import { jourTogo } from "../planning/dates";

/**
 * Les mois du suivi des mentors : par où ça commence, et jusqu'où on remonte.
 *
 * Le suivi commence en septembre 2026 — avant, il n'y avait que les premières
 * séances offertes, sans compte rendu régulier ni question d'élève : une note
 * sur ces mois-là ne voudrait rien dire. La liste ne propose donc jamais un
 * mois antérieur, et elle glisse : au-delà d'un an, le plus ancien sort.
 *
 * Un mois plus vieux que la fenêtre reste lisible par son adresse — les
 * anciens bilans y renvoient — tant qu'il est après le début du suivi.
 *
 * Aucun accès à la base ici : les fonctions sont éprouvées par leurs tests.
 */

export const DEBUT_SUIVI = "2026-09";
export const FENETRE_MOIS = 12;
/** À partir de ce jour du mois, le point de fin de mois se prépare. */
export const JOUR_BILAN = 25;

export type Mois = { cle: string; label: string };

const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const FORMAT = /^\d{4}-(0[1-9]|1[0-2])$/;

/** « 2026-09 » → « septembre 2026 ». */
export function libelleMois(cle: string): string {
  const [an, mois] = cle.split("-");
  return `${MOIS_FR[Number(mois) - 1] ?? cle} ${an}`;
}

export function moisCourant(maintenant: Date = new Date()): string {
  return jourTogo(maintenant).slice(0, 7);
}

/** Le mois décalé de n mois — négatif pour remonter. */
function decale(cle: string, n: number): string {
  const [an, mois] = cle.split("-").map(Number);
  const d = new Date(Date.UTC(an, mois - 1 + n, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/**
 * Le mois en cours et les précédents, du plus récent au plus ancien : au plus
 * une année, et jamais avant le début du suivi.
 */
export function moisDisponibles(maintenant: Date = new Date(), combien = FENETRE_MOIS): Mois[] {
  const courant = moisCourant(maintenant);
  const liste: Mois[] = [];
  for (let i = 0; i < combien; i++) {
    const cle = decale(courant, -i);
    if (cle < DEBUT_SUIVI) break;
    liste.push({ cle, label: libelleMois(cle) });
  }
  // Une horloge réglée avant septembre 2026 ne doit pas rendre une liste vide.
  return liste.length ? liste : [{ cle: courant, label: libelleMois(courant) }];
}

/**
 * Le mois dont le point de fin de mois est à faire, pour l'alerte du tableau
 * de bord : le mois en cours à partir du 25, le mois précédent avant lui.
 *
 * Sans cette bascule, l'alerte réclamerait dès le 2 un bilan sur un mois qui
 * vient de commencer, ou attendrait le 1er du mois suivant pour rappeler un
 * point qui se tient dans les derniers jours. `null` : il n'y a pas encore de
 * mois à boucler — avant le début du suivi, il n'y a rien à dire.
 */
export function moisABoucler(maintenant: Date = new Date()): string | null {
  const jour = Number(jourTogo(maintenant).slice(8, 10));
  const courant = moisCourant(maintenant);
  const cible = jour >= JOUR_BILAN ? courant : decale(courant, -1);
  return cible < DEBUT_SUIVI ? null : cible;
}

/**
 * Le mois demandé dans l'adresse, s'il existe : sinon le mois en cours. Rien
 * avant le début du suivi, rien dans le futur — une adresse tapée à la main ne
 * fabrique pas un mois qui n'a pas eu lieu.
 */
export function lireMois(brut: string | undefined, maintenant: Date = new Date()): string {
  const courant = moisCourant(maintenant);
  if (!brut || !FORMAT.test(brut)) return courant;
  if (brut < DEBUT_SUIVI || brut > courant) return courant;
  return brut;
}
