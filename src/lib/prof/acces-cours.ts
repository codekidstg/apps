/**
 * Ce qu'un mentor a le droit de lire dans le contenu des cours.
 *
 * La page d'un thème vérifiait bien l'affectation ; la page d'une *leçon*, à
 * côté, ne vérifiait que la connexion — et lisait la base avec la clé de
 * service, qui passe outre toutes les règles. Un mentor changeait
 * l'identifiant dans la barre d'adresse et lisait n'importe quelle leçon de
 * la plateforme : les autres niveaux, les thèmes qu'il n'enseigne pas, et même
 * ceux qui ne sont pas publiés.
 *
 * La règle est maintenant celle du verrou de validation, appliquée au
 * contenu : il rouvre librement tout ce que ses élèves ont terminé — il faut
 * bien pouvoir répondre, trois semaines après, à la question d'un enfant — et
 * il voit une leçon d'avance pour préparer sa séance. Pas davantage : avec une
 * leçon à la fois, il n'y a pas de corpus à constituer.
 */

/**
 * Les leçons ouvertes, à partir de l'ordre du programme et de ce qui est fait.
 *
 * Séparée de la base pour être vérifiable : c'est ici que se joue l'étendue de
 * la fuite, pas dans les requêtes.
 */
export function leconsAutorisees(ordreDuTheme: string[], terminees: Set<string>): Set<string> {
  // Le plus loin qu'un élève soit allé. -1 quand personne n'a rien terminé :
  // la première leçon reste ouverte, sinon un mentor qui démarre un thème
  // n'aurait rien à préparer.
  let dernierTermine = -1;
  ordreDuTheme.forEach((id, i) => {
    if (terminees.has(id)) dernierTermine = i;
  });
  return new Set(ordreDuTheme.slice(0, dernierTermine + 2));
}

type Chapitre = { order_index: number; lessons: { id: string; order_index: number }[] | null };

/** L'ordre du programme : chapitre par chapitre, leçon par leçon. */
export function ordreDesLecons(chapitres: Chapitre[]): string[] {
  return [...chapitres]
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((c) =>
      [...(c.lessons ?? [])]
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map((l) => l.id)
    );
}

export type Autorisation =
  /** L'admin regarde tout : c'est son catalogue. */
  | { mode: "admin" }
  | { mode: "mentor"; lecons: Set<string> }
  | { mode: "refus" };

/**
 * Ce que cet utilisateur peut ouvrir dans ce thème.
 *
 * `admin` est le client de service : la fonction est appelée depuis des pages
 * serveur qui ont déjà vérifié qui visite.
 */
export async function autorisationCours(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  admin: any,
  userId: string,
  themeId: string,
): Promise<Autorisation> {
  const { data: profil } = await admin
    .from("profiles").select("role").eq("id", userId).maybeSingle();
  if (profil?.role === "admin") return { mode: "admin" };
  if (profil?.role !== "teacher") return { mode: "refus" };

  const [{ data: theme }, { data: themeRows }, { data: eleves }] = await Promise.all([
    admin.from("themes").select("id").eq("id", themeId).eq("status", "published").maybeSingle(),
    admin.from("chapters").select("order_index, lessons(id, order_index)").eq("theme_id", themeId),
    admin.from("students").select("id").eq("teacher_id", userId),
  ]);

  // Un thème en préparation n'a rien à faire sous les yeux d'un mentor.
  if (!theme) return { mode: "refus" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idsEleves = ((eleves ?? []) as any[]).map((e) => e.id);
  if (idsEleves.length === 0) return { mode: "refus" };

  /**
   * Le droit d'entrer suit les élèves, pas une table d'affectation.
   *
   * `theme_assignments` existe mais n'a jamais été remplie : aucun de vos
   * mentors n'y a la moindre ligne, et la liste « Mes cours » les envoie
   * directement sur une leçon sans passer par la page du thème. S'en servir
   * ici aurait fermé le contenu à tout le monde, un samedi matin.
   *
   * La règle est donc celle de la liste : le thème est ouvert à au moins un de
   * ses élèves.
   */
  const { data: acces } = await admin
    .from("student_theme_access").select("student_id")
    .eq("theme_id", themeId).in("student_id", idsEleves).limit(1);
  if (!acces?.length) return { mode: "refus" };

  const ordre = ordreDesLecons((themeRows ?? []) as Chapitre[]);
  if (ordre.length === 0) return { mode: "mentor", lecons: new Set<string>() };

  const { data: progres } = await admin
    .from("lesson_progress")
    .select("lesson_id")
    .in("student_id", idsEleves)
    .in("lesson_id", ordre)
    .eq("status", "completed");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const terminees = new Set<string>(((progres ?? []) as any[]).map((p) => p.lesson_id));
  return { mode: "mentor", lecons: leconsAutorisees(ordre, terminees) };
}

/** Raccourci pour les pages : cette leçon est-elle ouverte à ce visiteur ? */
export function leconOuverte(a: Autorisation, lessonId: string): boolean {
  return a.mode === "admin" || (a.mode === "mentor" && a.lecons.has(lessonId));
}
