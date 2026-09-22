import { NON_TENUE } from "../rapports-libelles";

/**
 * La note d'un mentor pour un mois, sur 100.
 *
 * Elle ne porte que sur ce qu'il tient dans sa main :
 *
 *   ses séances                50 — la séance a eu lieu · le compte rendu est
 *                                   fait · dans les 48 h · il dit quelque chose
 *                                   d'utile
 *   ses réponses aux enfants   25 — une réponse · dans les 48 h
 *   sa réaction quand un
 *   élève décroche             25 — son compte rendu le signale · il écrit quoi
 *                                   reprendre la prochaine fois
 *
 * On part de 100, et chaque séance, chaque question, chaque élève qui décroche
 * peut coûter des points — au plus 8 chacun. Sans ce plafond, un compte rendu
 * oublié coûterait trois fois plus cher à un mentor de trois séances qu'à un
 * mentor de huit : la même faute, trois fois le prix. Un bloc sans matière ne
 * rapporte rien gratuitement, ses points passent aux séances. Et sous trois
 * séances dans le mois, il n'y a pas de note : une moyenne sur si peu ne
 * voudrait rien dire.
 *
 * La progression des élèves n'entre pas dans la note : elle dépend aussi de
 * leur maison, de leur santé, du courant qui saute. Elle reste affichée sur la
 * fiche, à côté, pour la discussion de fin de mois.
 *
 * Aucun accès à la base ici : la fonction est éprouvée par ses tests.
 */

export const SEUIL = 80;
export const PLAFOND_PAR_OUBLI = 8;
export const MINIMUM_SEANCES = 3;
export const DELAI_HEURES = 48;

export type SeanceDuMois = {
  date: string;   // YYYY-MM-DD
  quand: string;  // ISO, l'heure de la séance
  eleve: string | null;
  rapport: null | {
    tenue: boolean;
    raisonNonTenue: string | null;
    rendule: string;           // ISO
    difficultes: boolean;      // des difficultés écrites
    aides: boolean;            // une méthode d'aide cochée
    noteProchaine: boolean;    // une note pour la prochaine fois
  };
};

export type QuestionDuMois = {
  eleve: string;
  /** L'exercice où l'enfant a appuyé : deux messages y font un seul échange. */
  exercice: string;
  poseeLe: string;             // ISO
  traiteeLe: string | null;    // répondue, ou réglée en séance
};

/** Un enfant qui attend : depuis quand, et jusqu'à quand. */
export type Attente = { eleve: string; depuis: string; traiteeLe: string | null };

/**
 * Les « Je bloque ici » comptés comme le mentor les voit : un fil par élève et
 * par exercice, et dans un fil, une attente par suite de messages qui finit
 * par une réponse.
 *
 * Son écran ne lui montre pas des questions une à une mais des fils, et il
 * répond au dernier message — cette réponse vaut pour tout le fil. Sans ce
 * regroupement, un enfant qui redemande deux fois sur le même exercice
 * coûterait deux fautes à son mentor pour une seule réponse à écrire.
 *
 * L'attente part du premier message resté sans réponse, jamais du dernier :
 * sinon un enfant qui relance effacerait le retard qu'il vient de subir.
 */
export function attentes(questions: QuestionDuMois[]): Attente[] {
  const fils = new Map<string, QuestionDuMois[]>();
  for (const q of questions) {
    const cle = `${q.eleve}|${q.exercice}`;
    fils.set(cle, [...(fils.get(cle) ?? []), q]);
  }

  const out: Attente[] = [];
  for (const liste of fils.values()) {
    const ordre = [...liste].sort((a, b) => a.poseeLe.localeCompare(b.poseeLe));
    let depuis: string | null = null;
    for (const q of ordre) {
      depuis ??= q.poseeLe;
      if (q.traiteeLe) {
        out.push({ eleve: q.eleve, depuis, traiteeLe: q.traiteeLe });
        depuis = null;
      }
    }
    if (depuis) out.push({ eleve: ordre[0].eleve, depuis, traiteeLe: null });
  }
  return out.sort((a, b) => a.depuis.localeCompare(b.depuis));
}

export type EleveDuMois = {
  nom: string;
  /** 🟡 ralentit ou 🔴 bloqué : c'est là qu'on attend une réaction du mentor. */
  enDifficulte: boolean;
  /** Il a eu au moins une séance dans le mois — sinon le mentor n'a rien pu écrire. */
  avecSeance: boolean;
  signale: boolean;            // un compte rendu du mois le dit
  suite: boolean;              // un compte rendu du mois dit quoi reprendre
};

export type Bloc = { nom: string; points: number; sur: number; unites: number };
export type Perte = { points: number; quoi: string; manques: string[]; date: string };

export type NoteMentor = {
  /** null : moins de trois séances dans le mois, la note ne voudrait rien dire. */
  note: number | null;
  sansNote: string | null;
  blocs: Bloc[];
  /** Ce qui a coûté des points, du plus cher au moins cher. */
  pertes: Perte[];
  seances: { comptees: number; nonTenues: { date: string; raison: string; duMentor: boolean }[] };
};

const HEURE = 3_600_000;
const heures = (de: string, a: string) => (new Date(a).getTime() - new Date(de).getTime()) / HEURE;
const jour = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
const jours = (h: number) => Math.max(1, Math.round(h / 24));
// Deux enfants appuient sur « Je bloque ici » le même jour, sur deux exercices :
// sans l'heure, les deux lignes portent le même libellé.
const moment = (iso: string) =>
  `${jour(iso)} à ${new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}`;

/**
 * Une séance, une question, un élève : ce qui peut coûter des points.
 * `cases` : ce qui était en jeu. `rates` : ce qui est raté — un compte rendu
 * jamais fait en rate trois d'un coup. `manques` : ce qu'on en dit.
 */
type Unite = { quoi: string; date: string; cases: number; rates: number; manques: string[] };

function blocDe(nom: string, poids: number, unites: Unite[], pertes: Perte[]): Bloc {
  const cases = unites.reduce((n, u) => n + u.cases, 0);
  if (!cases) return { nom, points: 0, sur: 0, unites: 0 };
  const valeur = poids / cases;
  let perdus = 0;
  for (const u of unites) {
    if (!u.rates) continue;
    const cout = Math.min(PLAFOND_PAR_OUBLI, u.rates * valeur);
    perdus += cout;
    pertes.push({ points: Math.round(cout * 10) / 10, quoi: u.quoi, manques: u.manques, date: u.date });
  }
  return { nom, points: Math.round((poids - perdus) * 10) / 10, sur: poids, unites: unites.length };
}

export function calculerNote(
  { seances, questions, eleves }: { seances: SeanceDuMois[]; questions: QuestionDuMois[]; eleves: EleveDuMois[] },
  maintenant: Date = new Date(),
): NoteMentor {
  // Ce qui ne dépend pas du mentor sort du décompte ; « mentor empêché » reste.
  const nonTenues = seances
    .filter((s) => s.rapport?.tenue === false)
    .map((s) => ({
      date: s.date,
      raison: s.rapport!.raisonNonTenue ?? "",
      duMentor: NON_TENUE[s.rapport!.raisonNonTenue ?? ""]?.duMentor ?? true,
    }));
  const comptees = seances.filter((s) => {
    const r = s.rapport;
    return !(r?.tenue === false && !(NON_TENUE[r.raisonNonTenue ?? ""]?.duMentor ?? true));
  });

  const unitesSeances: Unite[] = comptees.map((s) => {
    const quoi = `Séance du ${jour(s.quand)}${s.eleve ? ` avec ${s.eleve}` : ""}`;
    const r = s.rapport;
    if (r?.tenue === false) {
      const raison = (NON_TENUE[r.raisonNonTenue ?? ""]?.label ?? "raison non dite").toLowerCase();
      return { quoi, date: s.date, cases: 4, rates: 4, manques: [`non tenue — ${raison}`] };
    }
    // Pas de compte rendu : trois cases tombent d'un coup — fait, à temps, utile.
    if (!r) return { quoi, date: s.date, cases: 4, rates: 3, manques: ["compte rendu jamais fait"] };

    const manques: string[] = [];
    const retard = heures(s.quand, r.rendule);
    if (retard > DELAI_HEURES) manques.push(`compte rendu rendu ${jours(retard)} jours après`);
    if (!r.difficultes && !r.aides && !r.noteProchaine) {
      manques.push("compte rendu sans difficulté, ni méthode d'aide, ni note pour la prochaine fois");
    }
    return { quoi, date: s.date, cases: 4, rates: manques.length, manques };
  });

  // Une question posée il y a moins de 48 h et encore en attente n'est pas en
  // retard : elle ne compte pas encore.
  const dues = attentes(questions).filter((q) => q.traiteeLe || heures(q.depuis, maintenant.toISOString()) > DELAI_HEURES);
  const unitesQuestions: Unite[] = dues.map((q) => {
    const quoi = `Question de ${q.eleve} du ${moment(q.depuis)}`;
    // Sans réponse, les deux cases tombent : la réponse, et le délai.
    if (!q.traiteeLe) return { quoi, date: q.depuis.slice(0, 10), cases: 2, rates: 2, manques: ["toujours sans réponse"] };
    const delai = heures(q.depuis, q.traiteeLe);
    const tard = delai > DELAI_HEURES;
    return {
      quoi, date: q.depuis.slice(0, 10), cases: 2, rates: tard ? 1 : 0,
      manques: tard ? [`répondue au bout de ${jours(delai)} jours`] : [],
    };
  });

  const unitesEleves: Unite[] = eleves
    .filter((e) => e.enDifficulte && e.avecSeance)
    .map((e) => {
      const manques: string[] = [];
      if (!e.signale) manques.push("aucun compte rendu du mois ne le signale");
      if (!e.suite) manques.push("aucun compte rendu ne dit quoi reprendre");
      return { quoi: `${e.nom} décroche`, date: "", cases: 2, rates: manques.length, manques };
    });

  // Un bloc sans matière passe ses points aux séances.
  let poidsSeances = 50;
  if (!unitesQuestions.length) poidsSeances += 25;
  if (!unitesEleves.length) poidsSeances += 25;

  const pertes: Perte[] = [];
  const blocs = [
    blocDe("Ses séances", poidsSeances, unitesSeances, pertes),
    blocDe("Ses réponses aux enfants", unitesQuestions.length ? 25 : 0, unitesQuestions, pertes),
    blocDe("Sa réaction quand un élève décroche", unitesEleves.length ? 25 : 0, unitesEleves, pertes),
  ];

  const perdusTotal = pertes.reduce((a, p) => a + p.points, 0);
  const assez = comptees.length >= MINIMUM_SEANCES;

  return {
    note: assez ? Math.max(0, Math.round(100 - perdusTotal)) : null,
    sansNote: assez ? null
      : comptees.length === 0
        ? "aucune séance à compter ce mois-ci"
        : `${comptees.length} séance${comptees.length > 1 ? "s" : ""} seulement dans le mois : trop peu pour une note`,
    blocs,
    pertes: pertes.sort((a, b) => b.points - a.points || a.date.localeCompare(b.date)),
    seances: { comptees: comptees.length, nonTenues },
  };
}

/** 🟢 à partir de 80, 🟡 de 70 à 79, 🔴 en dessous. */
export function couleurNote(note: number | null) {
  if (note === null) return { pastille: "⚪", classes: "bg-gray-50 text-gray-600 border-gray-200" };
  if (note >= SEUIL) return { pastille: "🟢", classes: "bg-green-50 text-green-700 border-green-200" };
  if (note >= 70)    return { pastille: "🟡", classes: "bg-amber-50 text-amber-700 border-amber-200" };
  return { pastille: "🔴", classes: "bg-red-50 text-red-700 border-red-200" };
}
