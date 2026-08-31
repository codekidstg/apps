import { getComptaMentorsData } from "./actions";

/**
 * Justificatif de paiement d'un mentor, pour un mois donné.
 *
 * L'émetteur est NAVOR GROUP SARL — c'est l'entité qui décaisse, et ce sont
 * ses identifiants légaux qui donnent sa valeur à la pièce. CodeKids y figure
 * comme le programme au titre duquel les séances ont été faites.
 */
export const EMETTEUR = {
  raison:   "NAVOR GROUP SARL",
  activite: "CONSEIL & AUDIT IT · DÉVELOPPEMENT LOGICIEL · STAFFING & FORMATION IT",
  adresse:  "Lomé, Togo",
  capital:  "Capital 1 000 000 FCFA",
  tel:      "+228 96 15 37 36",
  email:    "contact@navorgroup.tg",
  site:     "navorgroup.tg",
  rccm:     "RCCM TG-LFW-01-2026-B12-01221",
  nif:      "NIF 1002143162",
};

/** Couleurs du modèle Word : indigo pour les titres, cuivre pour les accents. */
export const INDIGO = "#1B2340";
export const CUIVRE = "#B4713C";
export const ENCRE  = "#1A1A1A";

const MOIS = ["janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];

/** « août » → « d'août », « septembre » → « de septembre ». Avril, août et octobre commencent par une voyelle. */
export function duMois(moisLabel: string) {
  return /^[aeiouâàéèêîôûAEIOU]/.test(moisLabel) ? `d'${moisLabel}` : `de ${moisLabel}`;
}

export type LigneSeance = {
  date: string;          // YYYY-MM-DD
  titre: string;
  eleve: string | null;
  duree: number;         // minutes
  montant: number;
  paye: boolean;
};

export type Justificatif = {
  reference: string;
  mentor: string;
  mois: number;
  annee: number;
  moisLabel: string;
  tarif: { rate_fcfa: number; rate_type: string } | null;
  lignes: LigneSeance[];       // séances validées (compte rendu rendu)
  sansRapport: number;         // séances sans compte rendu — exclues du paiement
  total: number;
  totalDejaPaye: number;
  totalEnLettres: string;
};

// ── Montant en toutes lettres ────────────────────────────────────────────────
const UNITES = ["zéro","un","deux","trois","quatre","cinq","six","sept","huit","neuf",
  "dix","onze","douze","treize","quatorze","quinze","seize","dix-sept","dix-huit","dix-neuf"];
const DIZAINES = ["","","vingt","trente","quarante","cinquante","soixante","soixante","quatre-vingt","quatre-vingt"];

/**
 * `suivi` indique qu'un mot suit (mille, millions). *Vingt* et *cent* ne
 * prennent leur « s » que s'ils terminent le nombre : quatre-vingts, mais
 * quatre-vingt mille ; deux cents, mais deux cent mille.
 */
function centaines(n: number, suivi = false): string {
  if (n < 20) return UNITES[n];
  if (n < 100) {
    const d = Math.floor(n / 10), u = n % 10;
    const base = DIZAINES[d];
    if (d === 7 || d === 9) {
      const reste = UNITES[10 + u];
      return u === 1 && d === 7 ? `${base}-et-${reste}` : `${base}-${reste}`;
    }
    if (u === 0) return d === 8 && !suivi ? `${base}s` : base;
    if (u === 1 && d !== 8) return `${base}-et-un`;
    return `${base}-${UNITES[u]}`;
  }
  const c = Math.floor(n / 100), r = n % 100;
  const pluriel = c > 1 && r === 0 && !suivi;
  const tete = c === 1 ? "cent" : `${UNITES[c]} cent${pluriel ? "s" : ""}`;
  return r === 0 ? tete : `${tete} ${centaines(r, suivi)}`;
}

/** « 5 000 » → « cinq mille ». Suffisant jusqu'au milliard, ce qui couvre large. */
export function enLettres(n: number): string {
  if (n === 0) return "zéro";
  const parts: string[] = [];
  const millions = Math.floor(n / 1_000_000);
  const milliers = Math.floor((n % 1_000_000) / 1000);
  const reste    = n % 1000;

  if (millions) parts.push(millions === 1 ? "un million" : `${centaines(millions, true)} millions`);
  if (milliers) parts.push(milliers === 1 ? "mille" : `${centaines(milliers, true)} mille`);
  if (reste)    parts.push(centaines(reste));
  return parts.join(" ");
}

// ── Chargement ───────────────────────────────────────────────────────────────

/**
 * Le document ne recalcule rien : il lit ce que la compta a déjà établi. Un
 * justificatif qui inventerait son propre total pourrait certifier un montant
 * que la trésorerie ne connaît pas.
 *
 * Les séances sans compte rendu sont exclues du paiement — elles ne sont pas
 * dues — mais leur nombre est reporté, pour que l'écart avec le nombre de
 * séances tenues soit visible plutôt que silencieux.
 */
export async function getJustificatif(
  teacherId: string, month: number, year: number,
): Promise<Justificatif | null> {
  const data = await getComptaMentorsData(month, year);
  const t = (data as any[]).find(x => x.teacher?.id === teacherId);
  if (!t) return null;

  const validees = (t.lines as any[]).filter(l => l.status !== "pending_report");
  const lignes: LigneSeance[] = validees.map(l => ({
    date:    l.occurrenceDate,
    titre:   l.title ?? "Séance",
    eleve:   l.studentName ?? null,
    duree:   l.duration_min ?? 0,
    montant: l.amount ?? 0,
    paye:    l.status === "paid",
  }));

  const total = lignes.reduce((s, l) => s + l.montant, 0);

  // Référence déterministe : régénérer produit le même document, jamais un
  // second qui ressemblerait à un second paiement.
  const cle = (t.teacher.display_name ?? "")
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .split(/\s+/).pop()!.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "MENTOR";

  return {
    reference: `CK-${year}-${String(month).padStart(2, "0")}-${cle}`,
    mentor: t.teacher.display_name ?? "Mentor",
    mois: month,
    annee: year,
    moisLabel: `${MOIS[month - 1]} ${year}`,
    tarif: t.rate ?? null,
    lignes,
    sansRapport: (t.lines as any[]).filter(l => l.status === "pending_report").length,
    total,
    totalDejaPaye: lignes.filter(l => l.paye).reduce((s, l) => s + l.montant, 0),
    totalEnLettres: enLettres(total),
  };
}
