/**
 * Les trois barreaux de l'échelle, et ce qu'est un exercice pour la salle.
 *
 * Ces valeurs vivent ici, hors de tout composant `"use client"` : une
 * constante exportée depuis un module client ne traverse pas la frontière —
 * un composant serveur n'en reçoit qu'une référence, et la parcourir échoue.
 */
export const PALIERS = [
  { n: 1, label: "① Je m'échauffe", color: "#10b981" },
  { n: 2, label: "② Je m'entraîne", color: "#FDB813" },
  { n: 3, label: "③ Je me dépasse", color: "#a78bfa" },
];

export type Exercice = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  attempts: number;
  best_score: number | null;
  last_completed_at: string | null;
  /** 1 je m'échauffe · 2 je m'entraîne · 3 je me dépasse. Null : exercice du parcours. */
  palier?: number | null;
  /** Il l'a réussi au moins une fois sans qu'un indice s'affiche. */
  sansIndice?: boolean;
};

export type Ceinture = { nom: string; couleur: string; emoji: string };

export const CEINTURES: Ceinture[] = [
  { nom: "Ceinture blanche", couleur: "#94a3b8", emoji: "🤍" },
  { nom: "Ceinture jaune",   couleur: "#FDB813", emoji: "💛" },
  { nom: "Ceinture orange",  couleur: "#f97316", emoji: "🧡" },
  { nom: "Ceinture verte",   couleur: "#10b981", emoji: "💚" },
];

/**
 * La ceinture d'une séance : un palier entier gagné, une couleur de plus.
 *
 * Elle s'arrête au premier palier incomplet — on ne saute pas un barreau.
 * Un palier vide (une séance dont un palier n'a aucun exercice) arrête aussi
 * le compte : mieux vaut une ceinture qui se mérite qu'une ceinture offerte
 * par un trou dans le contenu.
 */
export function ceintureDe(exercices: { palier?: number | null; attempts: number }[]): Ceinture {
  let gagnees = 0;
  for (const p of PALIERS) {
    const lot = exercices.filter((e) => (e.palier ?? 1) === p.n);
    if (!lot.length || !lot.every((e) => e.attempts > 0)) break;
    gagnees++;
  }
  return CEINTURES[gagnees];
}
