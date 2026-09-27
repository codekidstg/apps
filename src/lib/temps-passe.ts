/**
 * Le temps passé sur un exercice, dit comme on le dirait à voix haute.
 *
 * Ce temps est mesuré chez l'enfant, plafonné à vingt minutes par tentative, et
 * lu par son mentor, son parent et l'admin. L'enfant, lui, ne le voit pas : un
 * chronomètre affiché fait bâcler ceux qui doutent d'eux.
 *
 * On ne compare jamais un enfant à un autre avec ce chiffre, et on n'en fait
 * pas de moyenne : un enfant lent n'est pas un enfant qui travaille mal.
 */
export function dureeLisible(secondes: number | null | undefined): string | null {
  if (!secondes || secondes < 5) return null;       // un aller-retour, pas un travail
  if (secondes < 60) return `${secondes} s`;
  const minutes = Math.round(secondes / 60);
  if (minutes < 60) return `${minutes} min`;
  const heures = Math.floor(minutes / 60);
  const reste  = minutes % 60;
  return reste ? `${heures} h ${reste}` : `${heures} h`;
}

/** La même durée, en phrase, pour le parent. */
export function phraseDuree(secondes: number | null | undefined, prenom?: string): string | null {
  const d = dureeLisible(secondes);
  if (!d) return null;
  return `${prenom ? prenom : "Il"} y est resté ${d}`;
}
