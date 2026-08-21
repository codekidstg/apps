/**
 * Où renvoyer quelqu'un qui quitte l'atelier ou la leçon.
 *
 * Partagé par /atelier et /atelier/lecon : ces deux écrans sont plein écran,
 * hors de toute barre latérale, et sont la seule issue de leur visiteur.
 * Un visiteur non connecté retombe sur l'accueil public.
 */
export const ROLE_HOME: Record<string, string> = {
  student: "/eleve",
  teacher: "/prof",
  admin:   "/admin",
  parent:  "/suivi",
  manager: "/manager",
};

/** Destination de sortie pour un rôle donné, préfixée par la locale. */
export function homeHrefFor(role: string | undefined, locale: string): string {
  const dest = ROLE_HOME[role ?? ""];
  return dest ? `/${locale}${dest}` : "/";
}
