/**
 * La prochaine leçon d'un élève, et ce que le mentor trouvera en l'ouvrant.
 *
 * La leçon elle-même vient de `progression.ts` — la seule définition du
 * parcours, celle que lisent la liste des élèves, leur fiche et l'espace
 * parent. Une première version de ce fichier recalculait la règle de son
 * côté, sur la foi d'une recherche mal faite qui concluait que ce module
 * n'était utilisé nulle part : c'était une cinquième définition de la
 * progression, précisément ce que `progression.ts` avait été écrit pour
 * empêcher. Il ne reste ici que ce qui n'appartient qu'au planning : l'état du
 * contenu de cette leçon — publiée ou non, remplie ou vide.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { chargerParcours } from "@/lib/progression";
import { slugFromNum } from "@/lib/levels";

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

/** Pour plusieurs élèves d'un coup — un tableau de bord en affiche cinq. */
export async function prochainesLecons(eleveIds: string[]): Promise<Map<string, ResultatLecon>> {
  const resultat = new Map<string, ResultatLecon>();
  if (!eleveIds.length) return resultat;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: eleves, error } = await admin.from("students").select("id, level, level_num").in("id", eleveIds);
  if (error) console.error("[prochaine-lecon] students :", error.message);

  const parcours = await chargerParcours(admin, (eleves ?? []).map((e: { id: string; level: string | null; level_num: number | null }) => ({
    id: e.id,
    niveau: e.level ?? slugFromNum(e.level_num ?? 1),
  })));

  const choisies = new Map<string, { id: string; titre: string; themeId: string | null }>();
  for (const id of eleveIds) {
    const p = parcours.get(id);
    if (!p || p.aucunThemeActive || p.totalParcours === 0) { resultat.set(id, { etat: "aucun-theme" }); continue; }
    if (p.termine || !p.prochaineLeconId) { resultat.set(id, { etat: "termine" }); continue; }
    choisies.set(id, { id: p.prochaineLeconId, titre: p.prochaineLecon ?? "Leçon", themeId: p.prochaineLeconThemeId });
  }

  // L'état du contenu des seules leçons retenues. Lire la table des blocs en
  // entier se tairait le jour où elle dépassera 1000 lignes : PostgREST rend
  // 1000 lignes au maximum, sans rien dire, et des leçons pleines passeraient
  // pour vides.
  const ids = [...new Set([...choisies.values()].map((l) => l.id))];
  const [leconsRes, blocsRes] = ids.length
    ? await Promise.all([
        admin.from("lessons").select("id, status").in("id", ids),
        admin.from("lesson_blocks").select("lesson_id").in("lesson_id", ids),
      ])
    : [{ data: [] }, { data: [] }];

  const statut = new Map(((leconsRes.data ?? []) as { id: string; status: string }[]).map((l) => [l.id, l.status]));
  const nbBlocs = new Map<string, number>();
  for (const b of (blocsRes.data ?? []) as { lesson_id: string }[]) nbBlocs.set(b.lesson_id, (nbBlocs.get(b.lesson_id) ?? 0) + 1);

  for (const [eleveId, l] of choisies) {
    resultat.set(eleveId, {
      etat: "trouvee",
      lecon: { ...l, publiee: statut.get(l.id) === "published", blocs: nbBlocs.get(l.id) ?? 0 },
    });
  }
  return resultat;
}
