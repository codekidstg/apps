/**
 * Qui a le droit d'ouvrir quoi, côté élève.
 *
 * Le tableau de bord et la Cité filtraient bien — thèmes publiés ∩
 * `student_theme_access` — mais rien d'autre ne vérifiait quoi que ce soit.
 * Avec l'URL, un enfant ouvrait n'importe quelle leçon de la plateforme, y
 * compris d'un autre niveau ; la page de quête créait même la ligne
 * `lesson_progress` au simple chargement. C'est ainsi qu'un élève s'est
 * retrouvé « en cours » dans un thème qui ne lui avait jamais été ouvert.
 *
 * La page de thème, elle, appliquait la règle inverse : elle ne contrôlait
 * l'accès que si l'élève avait au moins une ligne, si bien qu'un élève sans
 * aucun accès configuré avait accès à tout. Ici la règle est unique et
 * stricte : un thème doit être publié ET activé pour cet élève.
 *
 * La RLS ne remplace pas ce garde : elle n'ouvre aux élèves que les thèmes
 * publiés — ils le sont tous — et les actions comme les routes de
 * synchronisation écrivent avec la clé de service, donc hors RLS.
 */

export type Refus = "introuvable" | "theme_non_ouvert" | "theme_non_publie";

export type Verdict =
  | { ok: true; themeId: string }
  | { ok: false; raison: Refus };

export type Perimetre = {
  /** Thèmes activés pour l'élève, publiés ou non. */
  ouverts: Set<string>;
  /** Thèmes publiés de la plateforme. */
  publies: Set<string>;
  /** L'intersection — ce que l'élève a le droit d'ouvrir. */
  autorises: Set<string>;
};

/** Le message montré à l'enfant, jamais un 404 sec. */
export const MESSAGE_REFUS: Record<Refus, string> = {
  introuvable:       "Cette page n'existe pas ou plus.",
  theme_non_ouvert:  "Ce thème ne t'est pas encore ouvert — parles-en à ton mentor.",
  theme_non_publie:  "Ce thème est encore en préparation. Reviens bientôt !",
};

export function urlRefus(locale: string, raison: Refus): string {
  return `/${locale}/eleve?acces=${raison}`;
}

export async function perimetreEleve(admin: any, studentId: string): Promise<Perimetre> {
  const [accesRes, themesRes] = await Promise.all([
    admin.from("student_theme_access").select("theme_id").eq("student_id", studentId),
    admin.from("themes").select("id").eq("status", "published"),
  ]);
  if (accesRes.error) console.error("[acces] student_theme_access :", accesRes.error.message);
  if (themesRes.error) console.error("[acces] themes :", themesRes.error.message);

  const ouverts = new Set<string>((accesRes.data ?? []).map((r: any) => r.theme_id));
  const publies = new Set<string>((themesRes.data ?? []).map((r: any) => r.id));
  const autorises = new Set<string>([...ouverts].filter((id) => publies.has(id)));
  return { ouverts, publies, autorises };
}

export async function themesAutorises(admin: any, studentId: string): Promise<Set<string>> {
  return (await perimetreEleve(admin, studentId)).autorises;
}

/** Verdict à partir d'un thème déjà connu. */
export function verdictPourTheme(themeId: string | null, p: Perimetre): Verdict {
  if (!themeId) return { ok: false, raison: "introuvable" };
  if (p.autorises.has(themeId)) return { ok: true, themeId };
  // Distinguer les deux refus : le message à l'enfant n'est pas le même.
  return { ok: false, raison: p.ouverts.has(themeId) ? "theme_non_publie" : "theme_non_ouvert" };
}

/**
 * Le thème d'une leçon se lit par son chapitre. `lessons.theme_id` existe et
 * concorde aujourd'hui sur les 99 leçons, mais rien ne le garantit : c'est le
 * chapitre qui fait foi.
 */
async function themeDeLecon(admin: any, lessonId: string): Promise<string | null> {
  const { data, error } = await admin
    .from("lessons")
    .select("id, chapters!inner(theme_id)")
    .eq("id", lessonId)
    .maybeSingle();
  if (error) { console.error("[acces] lessons :", error.message); return null; }
  return (data as any)?.chapters?.theme_id ?? null;
}

export async function accesLecon(admin: any, studentId: string, lessonId: string): Promise<Verdict> {
  const [themeId, perimetre] = await Promise.all([
    themeDeLecon(admin, lessonId),
    perimetreEleve(admin, studentId),
  ]);
  return verdictPourTheme(themeId, perimetre);
}

export async function accesEntrainement(admin: any, studentId: string, trainingId: string): Promise<Verdict> {
  const { data, error } = await admin
    .from("trainings")
    .select("id, lesson_id")
    .eq("id", trainingId)
    .maybeSingle();
  if (error) console.error("[acces] trainings :", error.message);
  const lessonId = (data as any)?.lesson_id;
  if (!lessonId) return { ok: false, raison: "introuvable" };
  return accesLecon(admin, studentId, lessonId);
}

/**
 * Qui visite l'espace élève.
 *
 * Le layout laisse entrer les rôles `student` et `admin`, mais un admin n'a
 * pas de ligne dans `students` : toutes les pages le renvoyaient donc à la
 * connexion, et le bouton « Aperçu élève » de l'éditeur de leçons pointait de
 * surcroît vers une route inexistante. L'admin entre désormais en aperçu :
 * il voit la leçon, mais aucune ligne de progression n'est créée et aucune XP
 * n'est versée.
 */
export type Visiteur =
  | { mode: "eleve"; studentId: string }
  | { mode: "apercu" };

export async function visiteurEleve(supabase: any, userId: string): Promise<Visiteur | null> {
  const [profilRes, eleveRes] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", userId).maybeSingle(),
    supabase.from("students").select("id").eq("profile_id", userId).maybeSingle(),
  ]);
  if (profilRes.error) console.error("[acces] profiles :", profilRes.error.message);
  if (eleveRes.error) console.error("[acces] students :", eleveRes.error.message);

  if ((profilRes.data as any)?.role === "admin") return { mode: "apercu" };
  const studentId = (eleveRes.data as any)?.id;
  return studentId ? { mode: "eleve", studentId } : null;
}
