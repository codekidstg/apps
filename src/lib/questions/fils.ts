import type { EtatQuestion, Question } from "./donnees";

/**
 * Les « Je bloque ici » regroupés en fils : un fil par élève et par exercice,
 * les messages du plus ancien au plus récent.
 *
 * Un enfant qui veut répondre à son mentor n'a pas d'autre moyen que de
 * reposer une question sur le même exercice : lues une à une, ces questions
 * cachent la conversation. Kenneth et son mentor ont échangé trois messages
 * sur le quiz de « Choisir » le 19 septembre 2026 ; en fil, cela se lit d'un
 * trait.
 *
 * Aucun accès à la base ici : la fonction est éprouvée par ses tests.
 */
export type Fil<Q extends Question> = {
  cle: string;
  /** Du plus ancien au plus récent. */
  questions: Q[];
  derniere: Q;
  /** La dernière chose arrivée dans le fil : question, réponse ou clôture. */
  derniereActivite: string;
  /** L'état du fil est celui de sa dernière question. */
  etat: EtatQuestion;
  enRetard: boolean;
};

const temps = (iso: string) => new Date(iso).getTime();

export function enFils<Q extends Question>(questions: Q[]): Fil<Q>[] {
  const parCle = new Map<string, Q[]>();
  for (const q of questions) {
    const cle = `${q.eleveId}|${q.blocId}`;
    parCle.set(cle, [...(parCle.get(cle) ?? []), q]);
  }

  const fils = [...parCle.entries()].map(([cle, liste]): Fil<Q> => {
    const ordre = [...liste].sort((a, b) => temps(a.poseeLe) - temps(b.poseeLe));
    const derniere = ordre[ordre.length - 1];
    const moments = ordre.flatMap((q) => [q.poseeLe, q.reponse?.le, q.reglee?.le]).filter((m): m is string => !!m);
    const derniereActivite = moments.reduce((a, b) => (temps(b) > temps(a) ? b : a));
    return { cle, questions: ordre, derniere, derniereActivite, etat: derniere.etat, enRetard: derniere.enRetard };
  });

  // Ceux qui attendent au-delà du délai d'abord, puis les plus récemment actifs.
  return fils.sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || temps(b.derniereActivite) - temps(a.derniereActivite));
}
