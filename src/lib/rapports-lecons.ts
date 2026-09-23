import { createAdminClient } from "@/lib/supabase/server";
import { slugFromNum } from "@/lib/levels";

/**
 * Les leçons à proposer au mentor quand il fait son compte rendu.
 *
 * L'application sait où en est l'enfant : elle propose, le mentor confirme ou
 * corrige. Une leçon devinée et corrigeable coûte une touche ; une liste de
 * quatre-vingt-dix-neuf leçons à chercher ne serait jamais remplie.
 *
 * L'ordre des propositions suit ce qui arrive vraiment en séance : la leçon en
 * cours d'abord, puis celle d'avant — reprendre est fréquent, le compte rendu
 * a même une case pour ça — puis la suivante, pour l'enfant qui a pris de
 * l'avance. Le reste est là, derrière une recherche.
 */

export type LeconProposee = {
  id: string;
  titre: string;
  theme: string;
  /** Rang dans le parcours du thème, pour que « #4 » situe la leçon. */
  rang: number;
  etat: "terminee" | "en_cours" | "a_faire";
  /** La proposition par défaut : là où l'enfant en est. */
  suggeree: boolean;
};

export async function leconsPourSeance(studentId: string | null | undefined): Promise<LeconProposee[]> {
  if (!studentId) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  const [eleve, acces, themes] = await Promise.all([
    admin.from("students").select("id, level, level_num").eq("id", studentId).maybeSingle(),
    admin.from("student_theme_access").select("theme_id").eq("student_id", studentId),
    admin.from("themes").select("id, title, level, order_index").eq("status", "published"),
  ]);
  if (eleve.error) console.error("[rapports-lecons] élève :", eleve.error.message);

  const ouverts = new Set<string>(((acces.data ?? []) as { theme_id: string }[]).map((a) => a.theme_id));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const siens = ((themes.data ?? []) as any[]).filter((t) => ouverts.has(t.id));
  if (!siens.length) return [];

  const [chapitres, progres] = await Promise.all([
    admin.from("chapters").select("id, theme_id, order_index").in("theme_id", siens.map((t) => t.id)),
    admin.from("lesson_progress").select("lesson_id, status").eq("student_id", studentId),
  ]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chapsIds = ((chapitres.data ?? []) as any[]).map((c) => c.id);
  const lecons = chapsIds.length
    ? await admin.from("lessons").select("id, title, chapter_id, order_index").in("chapter_id", chapsIds)
    : { data: [] };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chap = new Map<string, any>(((chapitres.data ?? []) as any[]).map((c) => [c.id, c]));
  const etatDe = new Map<string, string>(
    ((progres.data ?? []) as { lesson_id: string; status: string }[]).map((p) => [p.lesson_id, p.status]),
  );
  const rangTheme = new Map<string, number>(siens
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .map((t, i) => [t.id, i]));

  // Niveau de l'élève : ses thèmes d'abord, dans l'ordre du programme.
  const niveau = eleve.data?.level ?? slugFromNum(eleve.data?.level_num);
  const sonNiveau = (t: { level: string | null }) => (t.level === niveau ? 0 : 1);

  /** Ordre du programme : son niveau, puis le thème, le chapitre, la leçon. */
  const compare = (a: number[], b: number[]) => a.reduce((r, v, i) => r || v - b[i], 0);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordonnees = ((lecons.data ?? []) as any[])
    .map((l) => {
      const c = chap.get(l.chapter_id);
      const t = siens.find((x) => x.id === c?.theme_id);
      return { ...l, theme: t, cle: [sonNiveau(t ?? { level: null }), rangTheme.get(t?.id ?? "") ?? 99, c?.order_index ?? 0, l.order_index ?? 0] };
    })
    .filter((l) => l.theme)
    .sort((a, b) => compare(a.cle, b.cle));

  // Là où il en est : la première leçon non terminée de son parcours.
  const indexSuggere = Math.max(0, ordonnees.findIndex((l) => etatDe.get(l.id) !== "completed"));

  return ordonnees.map((l, i) => ({
    id: l.id,
    titre: l.title,
    theme: l.theme.title,
    rang: i + 1,
    etat: etatDe.get(l.id) === "completed" ? "terminee" : etatDe.has(l.id) ? "en_cours" : "a_faire",
    suggeree: i === indexSuggere,
  }));
}
