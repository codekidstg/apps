/**
 * La prochaine leçon d'un élève — exactement celle que son espace lui propose.
 *
 * Une séance n'a pas de colonne `lesson_id`, et il ne faut pas lui en donner
 * une : l'enfant avance à son rythme, un champ saisi à la main serait faux une
 * semaine sur deux. La bonne réponse se déduit — c'est la première leçon non
 * terminée, dans l'ordre du programme, parmi les thèmes activés pour lui.
 *
 * La règle est reprise de l'accueil élève, volontairement à l'identique, y
 * compris le tri des thèmes par `order_index` seul : ce qu'on montre à la
 * direction doit être ce que l'enfant verra, pas une autre vérité.
 *
 * (`progression.ts` fait un calcul voisin, mais à partir de `theme_assignments`,
 * une table vide : s'y brancher afficherait une colonne éternellement vide.)
 */
import { createAdminClient } from "@/lib/supabase/server";

export type LeconAVenir = {
  id: string;
  titre: string;
  themeId: string | null;
  /** Ce que le mentor trouvera en ouvrant l'aperçu. */
  publiee: boolean;
  blocs: number;
};

/** Pas de leçon n'est pas un cas unique : la direction doit savoir lequel. */
export type ResultatLecon =
  | { etat: "trouvee"; lecon: LeconAVenir }
  | { etat: "aucun-theme" }
  | { etat: "termine" };

type Ordonne = { order_index: number | null };
type ThemeRow    = { id: string; status?: string } & Ordonne;
type ChapitreRow = { id: string; theme_id: string } & Ordonne;
type LeconRow    = { id: string; title: string; chapter_id: string; theme_id: string | null; status: string } & Ordonne;

const parIndex = (a: Ordonne, b: Ordonne) => (a.order_index ?? 0) - (b.order_index ?? 0);

/**
 * Le cœur, sans base : le programme déroulé, et la première leçon qui reste.
 * `total` distingue « il a tout fini » de « il n'a rien à faire ».
 */
export function choisirProchaineLecon(
  themes: ThemeRow[],
  chapitres: ChapitreRow[],
  lecons: LeconRow[],
  faites: Set<string>,
): { lecon: LeconRow | null; total: number } {
  const chapitresDe = (themeId: string) => chapitres.filter((c) => c.theme_id === themeId).sort(parIndex);
  const leconsDe    = (chapId: string)  => lecons.filter((l) => l.chapter_id === chapId).sort(parIndex);

  const programme = [...themes].sort(parIndex)
    .flatMap((t) => chapitresDe(t.id).flatMap((c) => leconsDe(c.id)));

  return { lecon: programme.find((l) => !faites.has(l.id)) ?? null, total: programme.length };
}

/** Pour plusieurs élèves d'un coup — un tableau de bord en affiche cinq. */
export async function prochainesLecons(eleveIds: string[]): Promise<Map<string, ResultatLecon>> {
  const resultat = new Map<string, ResultatLecon>();
  if (!eleveIds.length) return resultat;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [themesRes, chapitresRes, leconsRes, accesRes, progresRes] = await Promise.all([
    admin.from("themes").select("id, order_index, status").eq("status", "published"),
    admin.from("chapters").select("id, theme_id, order_index"),
    admin.from("lessons").select("id, title, chapter_id, theme_id, order_index, status"),
    admin.from("student_theme_access").select("student_id, theme_id").in("student_id", eleveIds),
    admin.from("lesson_progress").select("student_id, lesson_id, status").in("student_id", eleveIds),
  ]);

  const publies   = (themesRes.data    ?? []) as ThemeRow[];
  const chapitres = (chapitresRes.data ?? []) as ChapitreRow[];
  const lecons    = (leconsRes.data    ?? []) as LeconRow[];
  const acces     = (accesRes.data     ?? []) as { student_id: string; theme_id: string }[];
  const progres   = (progresRes.data   ?? []) as { student_id: string; lesson_id: string; status: string }[];

  const choisies = new Map<string, LeconRow>();

  for (const eleveId of eleveIds) {
    const ouverts = new Set(acces.filter((a) => a.student_id === eleveId).map((a) => a.theme_id));
    const faites  = new Set(
      progres.filter((p) => p.student_id === eleveId && p.status === "completed").map((p) => p.lesson_id),
    );

    const { lecon, total } = choisirProchaineLecon(
      publies.filter((t) => ouverts.has(t.id)), chapitres, lecons, faites,
    );

    if (total === 0) resultat.set(eleveId, { etat: "aucun-theme" });
    else if (!lecon) resultat.set(eleveId, { etat: "termine" });
    else choisies.set(eleveId, lecon);
  }

  // Les blocs des seules leçons retenues. Lire la table entière marcherait
  // aujourd'hui — 405 lignes — et se tairait le jour où les 99 leçons seront
  // écrites : PostgREST rend 1000 lignes au maximum, sans rien dire, et les
  // leçons au-delà passeraient pour vides.
  const ids = [...new Set([...choisies.values()].map((l) => l.id))];
  const blocsRes = ids.length
    ? await admin.from("lesson_blocks").select("lesson_id").in("lesson_id", ids)
    : { data: [] };

  const nbBlocs = new Map<string, number>();
  for (const b of (blocsRes.data ?? []) as { lesson_id: string }[]) {
    nbBlocs.set(b.lesson_id, (nbBlocs.get(b.lesson_id) ?? 0) + 1);
  }

  for (const [eleveId, lecon] of choisies) {
    resultat.set(eleveId, {
      etat: "trouvee",
      lecon: {
        id: lecon.id,
        titre: lecon.title,
        themeId: lecon.theme_id,
        publiee: lecon.status === "published",
        blocs: nbBlocs.get(lecon.id) ?? 0,
      },
    });
  }

  return resultat;
}
