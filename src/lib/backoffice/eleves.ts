import { createAdminClient } from "@/lib/supabase/server";
import { chargerParcours, PARCOURS_VIDE, type Parcours } from "@/lib/progression";
import { slugFromNum } from "@/lib/levels";

/**
 * Données de l'écran « Élèves », partagées par /admin et /manager.
 *
 * Les deux pages en avaient chacune leur copie, au caractère près — mêmes
 * requêtes, mêmes maps, dans un ordre séquentiel côté manager. Toute correction
 * de la progression devait donc être écrite deux fois. Un seul chargement pour
 * les deux écrans : elles ne peuvent plus diverger.
 */
export type EleveRow = {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  xp: number;
  streak_days: number;
  level_num: number;
  parcours: Parcours;
  parents: string[];
};

export async function chargerEleves(): Promise<EleveRow[]> {
  const admin = createAdminClient();

  const [{ data: students, error: erreurEleves }, { data: authList }] = await Promise.all([
    (admin.from("students") as any)
      .select("id, xp, level, level_num, streak_days, profile_id, profiles!profile_id(id, display_name, created_at)")
      .order("xp", { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);
  if (erreurEleves) console.error("[eleves] students :", erreurEleves.message);

  const emailParProfil = new Map((authList?.users ?? []).map((u: any) => [u.id, u.email ?? ""]));

  // `level` (slug) est la colonne que lit l'espace élève ; `level_num` n'est
  // qu'un doublon d'affichage. On suit la première, avec repli sur la seconde.
  const [parcours, { data: liens, error: erreurLiens }] = await Promise.all([
    chargerParcours(admin, (students ?? []).map((s: any) => ({
      id: s.id,
      niveau: s.level ?? slugFromNum(s.level_num),
    }))),
    (admin.from("parent_children") as any)
      .select("student_id, parent_id, profiles!parent_id(display_name)"),
  ]);
  if (erreurLiens) console.error("[eleves] parent_children :", erreurLiens.message);

  const parentsParEleve = new Map<string, string[]>();
  for (const l of liens ?? []) {
    const arr = parentsParEleve.get(l.student_id) ?? [];
    arr.push(l.profiles?.display_name ?? "Parent");
    parentsParEleve.set(l.student_id, arr);
  }

  return (students ?? []).map((s: any) => ({
    id: s.id,
    profile_id: s.profile_id,
    name: s.profiles?.display_name ?? "—",
    email: emailParProfil.get(s.profile_id) ?? "—",
    xp: s.xp ?? 0,
    streak_days: s.streak_days ?? 0,
    level_num: s.level_num ?? 1,
    parcours: parcours.get(s.id) ?? PARCOURS_VIDE,
    parents: parentsParEleve.get(s.id) ?? [],
  }));
}

/**
 * Parcours d'un seul élève — pour sa fiche détaillée, qui affichait jusqu'ici
 * « terminées / lignes de suivi », un dénominateur qui grandissait à chaque
 * leçon ouverte.
 */
export async function chargerParcoursEleve(
  studentId: string,
  niveau: string | null,
  levelNum: number | null,
): Promise<Parcours> {
  const admin = createAdminClient();
  const m = await chargerParcours(admin, [{ id: studentId, niveau: niveau ?? slugFromNum(levelNum) }]);
  return m.get(studentId) ?? PARCOURS_VIDE;
}
