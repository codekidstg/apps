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

export type Refus = "introuvable" | "theme_non_ouvert" | "theme_non_publie" | "lecon_verrouillee" | "entrainement_verrouille";

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
  lecon_verrouillee: "Termine d'abord la leçon précédente — celle-ci s'ouvrira juste après.",
  entrainement_verrouille: "Termine d'abord la leçon, et cet entraînement s'ouvrira.",
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

/**
 * L'ordre du programme, appliqué et plus seulement dessiné.
 *
 * La page d'un thème affichait bien un cadenas « Termine la leçon
 * précédente », mais rien ne le faisait respecter : la page de la leçon ne
 * vérifiait que le thème. Il suffisait d'un lien — « Voir la leçon → » sous un
 * entraînement verrouillé — pour ouvrir n'importe quelle leçon du thème, et la
 * ligne de progression se créait au chargement. Ryshawn a ainsi ouvert les
 * leçons 6 et 7 de son labyrinthe sans avoir fait les 4 et 5.
 *
 * La règle est celle que le cadenas annonçait : une leçon s'ouvre si c'est la
 * première du thème, si la précédente est terminée, ou si elle-même est déjà
 * terminée — on peut toujours revoir ce qu'on a fait.
 *
 * L'ordre est celui du thème : chapitres, puis leçons. Les thèmes, eux, restent
 * ouverts par le mentor.
 */
async function ordreVerrouille(admin: any, studentId: string, lessonId: string, themeId: string): Promise<boolean> {
  const { data: chapitres, error: eChap } = await admin
    .from("chapters").select("id, order_index").eq("theme_id", themeId).order("order_index");
  if (eChap) { console.error("[acces] chapters :", eChap.message); return false; }

  const ids = ((chapitres ?? []) as any[]).map((c) => c.id);
  if (!ids.length) return false;
  const rang = new Map<string, number>(((chapitres ?? []) as any[]).map((c, i) => [c.id, c.order_index ?? i]));

  const { data: lecons, error: eLecons } = await admin
    .from("lessons").select("id, chapter_id, order_index").in("chapter_id", ids);
  if (eLecons) { console.error("[acces] lessons :", eLecons.message); return false; }

  const ordre = ((lecons ?? []) as any[]).sort((a, b) =>
    (rang.get(a.chapter_id) ?? 0) - (rang.get(b.chapter_id) ?? 0) || (a.order_index ?? 0) - (b.order_index ?? 0));

  const i = ordre.findIndex((l) => l.id === lessonId);
  if (i <= 0) return false;  // première leçon du thème, ou leçon introuvable

  const { data: progres, error: eProgres } = await admin
    .from("lesson_progress").select("lesson_id, status")
    .eq("student_id", studentId).in("lesson_id", [ordre[i - 1].id, lessonId]);
  if (eProgres) { console.error("[acces] lesson_progress :", eProgres.message); return false; }

  const etat = new Map<string, string>(((progres ?? []) as any[]).map((p) => [p.lesson_id, p.status]));
  // Déjà terminée : c'est une révision, elle reste ouverte.
  if (etat.get(lessonId) === "completed") return false;
  return etat.get(ordre[i - 1].id) !== "completed";
}

export async function accesLecon(admin: any, studentId: string, lessonId: string): Promise<Verdict> {
  const [themeId, perimetre] = await Promise.all([
    themeDeLecon(admin, lessonId),
    perimetreEleve(admin, studentId),
  ]);
  const verdict = verdictPourTheme(themeId, perimetre);
  if (!verdict.ok) return verdict;

  return await ordreVerrouille(admin, studentId, lessonId, verdict.themeId)
    ? { ok: false, raison: "lecon_verrouillee" }
    : verdict;
}

/**
 * Un entraînement est la pratique qui vient après le cours : il s'ouvre quand
 * sa leçon est terminée. La page les listait dès la leçon *commencée*, et
 * Samuel a fini sept entraînements de leçons qu'il n'a jamais bouclées.
 */
export async function accesEntrainement(admin: any, studentId: string, trainingId: string): Promise<Verdict> {
  const { data, error } = await admin
    .from("trainings")
    .select("id, lesson_id")
    .eq("id", trainingId)
    .maybeSingle();
  if (error) console.error("[acces] trainings :", error.message);
  const lessonId = (data as any)?.lesson_id;
  if (!lessonId) return { ok: false, raison: "introuvable" };

  const verdict = await accesLecon(admin, studentId, lessonId);
  // Une leçon verrouillée verrouille son entraînement, avec le mot qui va bien.
  if (!verdict.ok) return { ok: false, raison: verdict.raison === "lecon_verrouillee" ? "entrainement_verrouille" : verdict.raison };

  const { data: progres, error: eProgres } = await admin
    .from("lesson_progress").select("status")
    .eq("student_id", studentId).eq("lesson_id", lessonId).maybeSingle();
  if (eProgres) console.error("[acces] lesson_progress :", eProgres.message);
  return (progres as any)?.status === "completed" ? verdict : { ok: false, raison: "entrainement_verrouille" };
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
