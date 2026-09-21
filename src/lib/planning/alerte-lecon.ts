import type { ResultatLecon } from "@/lib/eleve/prochaine-lecon";

/**
 * Ce qui empêcherait la séance de se dérouler — la phrase que la direction
 * doit lire **avant** la séance, pas après.
 *
 * Rien à dire n'est pas une faute : une séance de groupe n'a pas d'élève dont
 * on puisse déduire une leçon, et une leçon publiée et remplie ne mérite
 * aucune alerte.
 */
export function alerteDe(r: ResultatLecon | undefined): string | null {
  if (!r) return null;
  if (r.etat === "aucun-theme") return "Aucun thème activé pour cet élève";
  if (r.etat === "termine")     return "Parcours terminé — plus rien à ouvrir";

  const { publiee, blocs } = r.lecon;
  if (!publiee && blocs === 0) return "Leçon non publiée, et vide";
  if (!publiee)                return "Leçon non publiée";
  if (blocs === 0)             return "Leçon vide — aucun bloc";
  return null;
}
