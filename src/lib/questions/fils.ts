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

/** Les filtres des pages d'échanges, lus dans l'adresse : « tous » par défaut. */
export type FiltreEchanges = "tous" | "attente" | "retard";
export const lireFiltre = (v: string | undefined): FiltreEchanges => (v === "attente" || v === "retard" ? v : "tous");
const garde = (f: FiltreEchanges) => <Q extends Question>(x: Fil<Q>) =>
  f === "tous" || (f === "attente" ? x.etat === "en_attente" : x.enRetard);
export const filtrerFils = <Q extends Question>(fils: Fil<Q>[], f: FiltreEchanges) => fils.filter(garde(f));
export const compterFils = <Q extends Question>(fils: Fil<Q>[]): Record<FiltreEchanges, number> => ({
  tous: fils.length,
  attente: fils.filter(garde("attente")).length,
  retard: fils.filter(garde("retard")).length,
});

export type Enfant<Q extends Question> = {
  eleveId: string;
  /** Dans l'ordre de `enFils` : ce qui attend au-delà du délai d'abord. */
  fils: Fil<Q>[];
  enAttente: number;
  enRetard: number;
  derniereActivite: string;
};

/**
 * Les fils regroupés par enfant, pour que la page de la direction reste
 * courte : une ligne par enfant, qu'on déplie.
 *
 * En tête, les enfants dont une question attend au-delà du délai, puis ceux
 * qui attendent une réponse, puis les autres, du plus récent au plus ancien.
 */
export function parEnfant<Q extends Question>(fils: Fil<Q>[]): Enfant<Q>[] {
  const groupes = new Map<string, Fil<Q>[]>();
  for (const f of fils) groupes.set(f.derniere.eleveId, [...(groupes.get(f.derniere.eleveId) ?? []), f]);

  return [...groupes.entries()]
    .map(([eleveId, liste]): Enfant<Q> => ({
      eleveId,
      fils: liste,
      enAttente: liste.filter((f) => f.etat === "en_attente").length,
      enRetard: liste.filter((f) => f.enRetard).length,
      derniereActivite: liste.map((f) => f.derniereActivite).reduce((a, b) => (temps(b) > temps(a) ? b : a)),
    }))
    .sort((a, b) =>
      Number(b.enRetard > 0) - Number(a.enRetard > 0)
      || Number(b.enAttente > 0) - Number(a.enAttente > 0)
      || temps(b.derniereActivite) - temps(a.derniereActivite));
}
