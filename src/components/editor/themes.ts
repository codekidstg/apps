/**
 * Les habits de l'éditeur.
 *
 * S'approprier son outil fait partie du fait de devenir codeur — c'est le même
 * ressort que le robot qu'on personnalise. Et ça ne se gagne pas : l'atelier
 * est le seul endroit sans note, on n'y met pas de récompense à débloquer.
 *
 * Tous sont sombres et tous se lisent. Un « hack » vert sombre sur noir, en
 * 12 px, en plein jour, sur un écran d'entrée de gamme, ne se lit pas — c'est
 * la seule chose qui compte vraiment ici.
 *
 * Les couleurs du code viennent de `oneDark` ; un habit ne redéfinit que le
 * fond, la marge, le curseur et la taille. En CSS plutôt qu'en thème
 * CodeMirror : deux thèmes CodeMirror produisent des sélecteurs de même poids,
 * et c'est alors l'ordre d'injection des feuilles qui tranche — pas celui des
 * extensions. Une classe de plus sur le conteneur passe devant à coup sûr.
 */

export type ThemeId = "nuit" | "ninja" | "hack" | "contraste";

type Habit = {
  id: ThemeId;
  nom: string;
  emoji: string;
  /** Les deux couleurs de la pastille, dans le choix. */
  apercu: [string, string];
  fond: string;
  texte: string;
  marge: string;
  curseur: string;
  selection: string;
  taille: string;
};

const HABITS: Habit[] = [
  { id: "nuit",      nom: "Nuit",  emoji: "🌙", apercu: ["#282c34", "#61afef"],
    fond: "#282c34", texte: "#abb2bf", marge: "#5c6370", curseur: "#528bff", selection: "#3E4451", taille: "14px" },
  { id: "ninja",     nom: "Ninja", emoji: "🥷", apercu: ["#0b0f14", "#a78bfa"],
    fond: "#0b0f14", texte: "#cbd5e1", marge: "#475569", curseur: "#a78bfa", selection: "#1e293b", taille: "14px" },
  { id: "hack",      nom: "Hack",  emoji: "💚", apercu: ["#06120a", "#4ade80"],
    fond: "#06120a", texte: "#bbf7d0", marge: "#22c55e", curseur: "#4ade80", selection: "#14532d", taille: "14px" },
  // Pour lire dehors, sur un écran d'entrée de gamme : plus gros, plus clair.
  { id: "contraste", nom: "Grand", emoji: "🔆", apercu: ["#000000", "#ffffff"],
    fond: "#000000", texte: "#f8fafc", marge: "#94a3b8", curseur: "#ffffff", selection: "#334155", taille: "16px" },
];

export const THEMES = HABITS.map(({ id, nom, emoji, apercu }) => ({ id, nom, emoji, apercu }));
export const THEME_DEFAUT: ThemeId = "nuit";

/** La feuille de style des quatre habits, posée une fois par l'éditeur. */
export const CSS_HABITS = HABITS.map((h) => {
  const r = `.cm-habit[data-habit="${h.id}"]`;
  return [
    `${r} .cm-editor, ${r} .cm-gutters { background-color: ${h.fond}; }`,
    `${r} .cm-editor { color: ${h.texte}; }`,
    `${r} .cm-scroller { font-size: ${h.taille}; }`,
    `${r} .cm-gutters { color: ${h.marge}; border: none; }`,
    `${r} .cm-activeLine { background-color: rgba(255,255,255,0.05); }`,
    `${r} .cm-activeLineGutter { background-color: rgba(255,255,255,0.07); color: ${h.texte}; }`,
    `${r} .cm-cursor, ${r} .cm-dropCursor { border-left-color: ${h.curseur}; }`,
    `${r} .cm-selectionBackground, ${r} .cm-content ::selection { background-color: ${h.selection} !important; }`,
  ].join("\n");
}).join("\n");
