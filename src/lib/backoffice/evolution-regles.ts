/**
 * Les règles de la section « Évolution » qui ne touchent pas la base :
 * `evolution.ts` charge les données et les leur passe, les tests les éprouvent.
 *
 * Trois d'entre elles corrigent ce que la fiche de Kenneth a montré le
 * 21 septembre 2026 : une séance offerte comptée avant que son compte existe,
 * deux messages sur le même exercice comptés comme deux blocages, et des
 * entraînements affichés comme des leçons terminées.
 */
import { jourTogo } from "../planning/dates";
import { joursDepuis } from "./statut-eleve";

/**
 * Les séances qui comptent pour le rythme « une séance, une leçon » : celles
 * qui ont lieu à partir du jour où le compte de l'enfant existe. Avant, rien
 * ne pouvait s'enregistrer — la « Première séance offerte » de Kenneth, le
 * 29 août, précède son compte, créé le 1er septembre.
 *
 * Au jour près, pas à l'heure : un mentor qui crée le compte pendant la
 * séance fait bien travailler l'enfant dessus.
 */
export function seancesComptees(dates: string[], compteCree: Date): { comptees: string[]; avant: number } {
  const depuis = jourTogo(compteCree);
  const comptees = dates.filter((d) => d >= depuis);
  return { comptees, avant: dates.length - comptees.length };
}

export type QuestionAide = { lessonId: string | null; blockId: string; creeLe: Date };

/**
 * Pour chaque leçon pas finie : le nombre d'exercices DIFFÉRENTS sur lesquels
 * l'enfant a appuyé sur « Je bloque ici » ces 14 derniers jours.
 *
 * Des exercices, pas des messages. Pour répondre à son mentor, un enfant n'a
 * pas d'autre moyen que de rouvrir « Je bloque ici » sur le même exercice :
 * Kenneth l'a fait pour parler d'une coupure de courant, et passait en
 * « bloqué » sur deux messages d'une seule conversation.
 *
 * `finies` : les leçons terminées. Toute autre leçon est « pas finie », même
 * sans ligne de progression.
 */
export function exercicesAvecAide(questions: QuestionAide[], finies: Set<string>, maintenant: Date = new Date()): number[] {
  const parLecon = new Map<string, Set<string>>();
  for (const q of questions) {
    if (!q.lessonId || finies.has(q.lessonId) || joursDepuis(q.creeLe, maintenant) >= 14) continue;
    const exercices = parLecon.get(q.lessonId) ?? new Set<string>();
    exercices.add(q.blockId);
    parLecon.set(q.lessonId, exercices);
  }
  return [...parLecon.values()].map((e) => e.size);
}

export type EvenementJeu = { event_type: string; created_at: string; payload?: { lessonId?: unknown } | null };
export type ProgresLecon = { lesson_id: string; status: string; completed_at: string | null };
export type ProgresEntrainement = { training_id: string; status: string; completed_at: string | null };

/**
 * Les jours où l'enfant a terminé une leçon, et ceux où il a réussi un
 * entraînement.
 *
 * La plateforme enregistre un entraînement réussi sous le même nom qu'une
 * leçon terminée (`lesson_completed`, avec l'identifiant de l'entraînement à
 * la place de celui de la leçon) : seul l'identifiant les départage. Sans
 * cela, la frise de Kenneth montrait 7 jours de « leçon terminée » pour 2
 * leçons. Un identifiant qu'on ne reconnaît pas n'est rangé nulle part :
 * mieux vaut une case vide qu'une case fausse.
 */
export function joursDeTravail(
  evenements: EvenementJeu[],
  lecons: ProgresLecon[],
  entrainements: ProgresEntrainement[],
): { lecons: Set<string>; entrainements: Set<string> } {
  const idsLecons = new Set(lecons.map((l) => l.lesson_id));
  const idsEntrainements = new Set(entrainements.map((t) => t.training_id));
  const jours = { lecons: new Set<string>(), entrainements: new Set<string>() };

  for (const l of lecons) if (l.status === "completed" && l.completed_at) jours.lecons.add(jourTogo(new Date(l.completed_at)));
  for (const t of entrainements) if (t.status === "completed" && t.completed_at) jours.entrainements.add(jourTogo(new Date(t.completed_at)));
  for (const e of evenements) {
    if (e.event_type !== "lesson_completed") continue;
    const id = String(e.payload?.lessonId ?? "");
    const jour = jourTogo(new Date(e.created_at));
    if (idsLecons.has(id)) jours.lecons.add(jour);
    else if (idsEntrainements.has(id)) jours.entrainements.add(jour);
  }
  return jours;
}

export type BlocLecon = { id: string; type: string; content: Record<string, unknown> | null };
export type ProgressionBlocs = {
  quizAnswers?: Record<string, number | null>;
  quizResults?: Record<string, boolean | null>;
  codeResults?: Record<string, unknown>;
  solvedBlockly?: Record<string, unknown>;
} | null;
export type ErreurQuiz = { question: string; reponse: string | null; bonne: string | null };

type QuestionQuiz = { question?: string; choices?: string[]; answer?: number };
const EXERCICES = ["quiz", "code_challenge", "blockly", "game"];

/**
 * Où en est l'enfant dans une leçon : les exercices faits sur ceux qu'elle
 * propose, et ses mauvaises réponses aux quiz, dans l'ordre de la leçon.
 *
 * « Fait » suit le lecteur de leçon (QuestReader) : un quiz dont toutes les
 * questions ont une réponse, juste ou non ; un jeu résolu ; un défi de code
 * réussi. Les défis de code facultatifs comptent aussi : on mesure ce que
 * l'enfant a parcouru, pas ce qui lui manque pour terminer.
 *
 * `blocs` doit arriver dans l'ordre de la leçon.
 */
export function etatLecon(blocs: BlocLecon[], p: ProgressionBlocs): { faits: number; total: number; erreurs: ErreurQuiz[] } {
  const reponses = p?.quizAnswers ?? {};
  const resultats = p?.quizResults ?? {};
  let faits = 0;
  let total = 0;
  const erreurs: ErreurQuiz[] = [];

  for (const b of blocs) {
    if (!EXERCICES.includes(b.type)) continue;
    total++;
    if (b.type === "quiz") {
      // Un quiz est une liste de questions, ou une seule question posée à plat.
      const c = (b.content ?? {}) as { questions?: QuestionQuiz[] } & QuestionQuiz;
      const questions = Array.isArray(c.questions) ? c.questions : [c];
      if (questions.every((_, i) => resultats[`${b.id}-${i}`] != null)) faits++;
      questions.forEach((q, i) => {
        if (resultats[`${b.id}-${i}`] !== false) return;
        const choix = reponses[`${b.id}-${i}`];
        erreurs.push({
          question: q.question ?? `Question ${i + 1}`,
          reponse: typeof choix === "number" ? q.choices?.[choix] ?? null : null,
          bonne: typeof q.answer === "number" ? q.choices?.[q.answer] ?? null : null,
        });
      });
    } else if (b.type === "code_challenge") {
      if (p?.codeResults?.[b.id]) faits++;
    } else if (p?.solvedBlockly?.[b.id]) {
      faits++;
    }
  }
  return { faits, total, erreurs };
}
