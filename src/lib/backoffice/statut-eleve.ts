/**
 * Le statut d'un élève : une pastille que la direction lit d'un coup d'œil,
 * avec les raisons qui l'expliquent.
 *
 * Les seuils ont été fixés avec le fondateur :
 *   ⚪ démarre   — suivi commencé il y a moins de 14 jours
 *   🔴 bloqué    — « Je bloque ici » sur 2 exercices différents d'une leçon
 *                  pas finie, en 14 jours ; ou aucune activité depuis 14 jours
 *   🟡 ralentit  — 2 leçons de retard sur ses séances, ou « distrait » aux
 *                  2 derniers rapports, ou inactif depuis 8 à 13 jours
 *   🟢 progresse — tout le reste
 *
 * Hypothèse validée : une séance vaut une leçon. Le retard est donc le nombre
 * de séances passées moins le nombre de leçons terminées — séances comptées
 * à partir de la création du compte (voir `seancesComptees`).
 *
 * Aucun accès à la base ici : la fonction est éprouvée par ses tests.
 */
import { jourTogo, minuit } from "../planning/dates";

export type StatutEleve = "demarre" | "progresse" | "ralentit" | "bloque";

/** L'affichage d'un statut — partagé par la fiche (serveur) et la liste (client). */
export const STATUT_ELEVE: Record<StatutEleve, { label: string; pastille: string; classes: string; ordre: number }> = {
  bloque:    { label: "Bloqué",    pastille: "🔴", classes: "bg-red-50 text-red-700 border-red-200",       ordre: 0 },
  ralentit:  { label: "Ralentit",  pastille: "🟡", classes: "bg-amber-50 text-amber-700 border-amber-200", ordre: 1 },
  demarre:   { label: "Démarre",   pastille: "⚪", classes: "bg-gray-50 text-gray-600 border-gray-200",    ordre: 2 },
  progresse: { label: "Progresse", pastille: "🟢", classes: "bg-green-50 text-green-700 border-green-200", ordre: 3 },
};

export type FaitsEleve = {
  /** Première séance passée, ou à défaut la création du compte. */
  debut: Date;
  /** Dernière activité connue ; null s'il n'a jamais rien fait. */
  derniereActivite: Date | null;
  seancesPassees: number;
  leconsTerminees: number;
  /** Engagement noté aux rapports, du plus récent au plus ancien. */
  engagements: (string | null)[];
  /** Avancement noté aux rapports, du plus récent au plus ancien. */
  avancements: (string | null)[];
  /**
   * Pour chaque leçon encore non terminée : le nombre d'exercices différents
   * où il a appuyé sur « Je bloque ici » ces 14 derniers jours — des
   * exercices, pas des messages (voir `exercicesAvecAide`).
   */
  blocagesParLecon: number[];
};

/** Jours de calendrier écoulés, à l'heure du Togo. */
export function joursDepuis(date: Date, maintenant: Date = new Date()): number {
  return Math.round((minuit(jourTogo(maintenant)).getTime() - minuit(jourTogo(date)).getTime()) / 86_400_000);
}

export function statutEleve(f: FaitsEleve, maintenant: Date = new Date()): { statut: StatutEleve; raisons: string[] } {
  const blocages = Math.max(0, ...f.blocagesParLecon);
  // Un enfant qui appelle à l'aide sur deux exercices de la même leçon est
  // bloqué, même s'il vient de commencer : c'est là qu'il faut agir vite.
  if (blocages >= 2) {
    return { statut: "bloque", raisons: [`« Je bloque ici » sur ${blocages} exercices d'une leçon pas finie, en 14 jours`] };
  }

  const depuisDebut = joursDepuis(f.debut, maintenant);
  if (depuisDebut < 14) {
    return { statut: "demarre", raisons: [`suivi commencé il y a ${depuisDebut} jour${depuisDebut > 1 ? "s" : ""}`] };
  }

  const inactif = f.derniereActivite ? joursDepuis(f.derniereActivite, maintenant) : null;
  if (inactif === null) return { statut: "bloque", raisons: ["aucune activité depuis le début du suivi"] };
  if (inactif >= 14) return { statut: "bloque", raisons: [`aucune activité depuis ${inactif} jours`] };

  const raisons: string[] = [];
  const retard = f.seancesPassees > 0 ? Math.max(0, f.seancesPassees - f.leconsTerminees) : 0;
  if (retard >= 2) raisons.push(`${retard} leçons de retard sur ses ${f.seancesPassees} séances`);
  // « Démotivé » est pire que « distrait » : il compte dans la même règle.
  const decroche = (e: string | null) => e === "distracted" || e === "disengaged";
  if (f.engagements.length >= 2 && decroche(f.engagements[0]) && decroche(f.engagements[1])) {
    raisons.push("« distrait » ou « démotivé » aux 2 derniers rapports");
  }
  // Le mentor l'a écrit lui-même : la séance n'a pas pu avancer.
  if (f.avancements[0] === "blocked") raisons.push("dernier rapport : n'a pas pu avancer");
  if (inactif >= 8) raisons.push(`inactif depuis ${inactif} jours`);

  return raisons.length ? { statut: "ralentit", raisons } : { statut: "progresse", raisons: [] };
}
