/**
 * « Je bloque ici » — ce qui se partage entre le navigateur et le serveur.
 *
 * Aucun import serveur ici : l'écran de l'élève s'en sert directement.
 */

export type Raison = "consigne" | "programme" | "commencer" | "autre";

/**
 * Un enfant de 9 ans sur un téléphone ne rédige pas un paragraphe. Il touche
 * ce qui lui ressemble ; le texte reste possible, jamais obligatoire.
 */
export const RAISONS: { id: Raison; libelle: string; emoji: string }[] = [
  { id: "consigne",  libelle: "Je ne comprends pas la consigne",             emoji: "🤔" },
  { id: "programme", libelle: "Ça ne marche pas et je ne sais pas pourquoi", emoji: "🧩" },
  { id: "commencer", libelle: "Je ne sais pas par où commencer",             emoji: "🚦" },
  { id: "autre",     libelle: "Autre chose",                                  emoji: "💬" },
];

export const LIBELLE_RAISON = Object.fromEntries(RAISONS.map((r) => [r.id, r.libelle])) as Record<Raison, string>;

export const estRaison = (v: unknown): v is Raison => RAISONS.some((r) => r.id === v);

/** Les réponses d'un geste, pour le mentor qui prépare plusieurs séances. */
export const REPONSES_RAPIDES = [
  "On regarde ça ensemble à la séance.",
  "Relis bien les étapes de la mission, une par une.",
  "Tu y es presque : recompte les cases avant de lancer.",
];

/** À partir de combien d'échecs le bouton se met en avant. */
export const ECHECS_AVANT_AIDE = 2;

/**
 * Ce qui peut s'afficher AVANT que l'enfant pose sa question.
 *
 * Une liste blanche, et courte. Beaucoup d'exercices portent leur propre
 * solution dans leur contenu — `explanation` d'un quiz, `fix` d'une chasse au
 * bug, `motif_start` d'un motif, les `hint` de chaque carte d'un tri —, qui ne
 * doivent jamais sortir avant la réponse de l'enfant. Seuls les champs écrits
 * pour guider y figurent, et un exercice qui n'en a pas n'affiche rien.
 */
export function indiceDuBloc(type: string, content: Record<string, unknown>): { lignes: string[] } | null {
  const lignes: string[] = [];
  const texte = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

  // Les étapes de mission des labyrinthes et de la musique : déjà affichées à
  // l'écran, on les remet simplement sous les yeux.
  if (Array.isArray(content.steps)) lignes.push(...content.steps.filter(texte));

  // L'indice méthodologique du jeu « remets dans l'ordre ».
  if (content.game_type === "sort" && texte(content.hint)) lignes.push(content.hint);

  // Les critères du tri par glissement.
  const aide = content.helper as { criteria?: unknown } | undefined;
  if (type === "swipe_sort" && Array.isArray(aide?.criteria)) lignes.push(...aide.criteria.filter(texte));

  return lignes.length ? { lignes } : null;
}
