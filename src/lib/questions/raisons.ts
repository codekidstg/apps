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

/**
 * Ce qui s'affiche à la place de la raison. Un message que l'enfant écrit sans
 * rien demander n'en a pas : il répond à son mentor (migration 037).
 */
export function libelleRaison(raison: Raison | null | undefined): string {
  return raison ? LIBELLE_RAISON[raison] ?? raison : "te répond";
}

export const estRaison = (v: unknown): v is Raison => RAISONS.some((r) => r.id === v);

/**
 * Pourquoi un échange se clôt, côté mentor.
 *
 * `compte` : l'échange entre dans son suivi comme une réponse. Un message qui
 * n'est pas une question n'en est pas une — il sort du décompte, et le clore
 * trois jours plus tard ne coûte rien : l'enfant n'attendait pas.
 */
export type Cloture = "seance" | "pas_une_question" | "autrement";

export const CLOTURES: {
  id: Cloture; emoji: string; libelle: string; aide: string;
  noteDefaut: string; pourEnfant: string; compte: boolean;
}[] = [
  {
    id: "seance", emoji: "🧑‍🏫",
    libelle: "Réglé pendant la séance",
    aide: "Le délai se compte jusqu'à la séance, pas jusqu'à maintenant.",
    noteDefaut: "Réglé en séance.",
    pourEnfant: "Réglé en séance avec ton mentor.",
    compte: true,
  },
  {
    id: "pas_une_question", emoji: "👋",
    libelle: "Pas une question — rien à répondre",
    aide: "Un merci, un « ça marche ! » : l'échange sort du décompte.",
    noteDefaut: "Message lu, rien à répondre.",
    pourEnfant: "Ton mentor a bien lu ton message.",
    compte: false,
  },
  {
    id: "autrement", emoji: "📞",
    libelle: "Réglé autrement (téléphone, WhatsApp)",
    aide: "Compte comme une réponse, au moment où vous le notez ici.",
    noteDefaut: "Réglé avec ton mentor en dehors de l'application.",
    pourEnfant: "Réglé avec ton mentor.",
    compte: true,
  },
];

export const LIBELLE_CLOTURE = Object.fromEntries(CLOTURES.map((c) => [c.id, c])) as Record<Cloture, (typeof CLOTURES)[number]>;

export const estCloture = (v: unknown): v is Cloture => CLOTURES.some((c) => c.id === v);

/**
 * Ce que l'enfant lit quand son mentor a clos sans écrire de réponse. Les
 * clôtures d'avant la migration 036 n'ont pas de raison : elles voulaient
 * toutes dire « réglé en séance ».
 */
export function motCloture(raison: string | null, note: string | null): string {
  return note?.trim() || LIBELLE_CLOTURE[(raison ?? "seance") as Cloture]?.pourEnfant || "Réglé avec ton mentor.";
}

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
