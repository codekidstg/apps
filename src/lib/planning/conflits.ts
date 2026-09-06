/**
 * Détection des conflits de planning d'un mentor.
 *
 * L'ancienne version ne comparait que le **jour de la semaine**. Une séance
 * ponctuelle du samedi 29 août bloquait donc toute récurrente du samedi, pour
 * toujours — y compris une récurrente démarrant le 5 septembre, avec laquelle
 * elle ne pouvait jamais coïncider. Trois causes cumulées : la date ignorée,
 * les séances passées jamais écartées, et les périodes d'activité
 * (`active_from` / `active_until`) jamais consultées.
 *
 * Ici, deux séances ne se gênent que si elles peuvent tomber **le même jour
 * réel**. Et l'on distingue le chevauchement — qui interdit — du simple
 * manque d'espacement, qui avertit sans bloquer.
 *
 * Toutes les lectures d'heure passent par les accesseurs UTC. Le Togo est à
 * UTC+0 toute l'année, donc l'heure UTC EST l'heure locale des séances — alors
 * que `getHours()` aurait donné l'heure du serveur : 12:00 sur un poste à
 * Paris pour une séance de 10:00, et 10:00 sur Vercel. La détection ne doit
 * pas dépendre de l'endroit où tourne le code.
 */

/** Marge de confort entre deux séances qui ne se chevauchent pas. */
export const BATTEMENT_MIN = 180; // 3 heures

export type Seance = {
  id?: string;
  title: string;
  session_type: "recurring" | "once";
  weekday: number | null;
  start_time: string | null;      // "HH:MM"
  scheduled_at: string | null;    // ISO
  duration_min: number | null;
  active_from: string | null;     // "YYYY-MM-DD"
  active_until: string | null;
};

export type Candidate =
  | { type: "recurring"; weekday: number; startTime: string; duration: number; from: string; until: string | null }
  | { type: "once"; scheduledAt: string; duration: number };

export type Verdict =
  | { kind: "libre" }
  | { kind: "chevauchement"; avec: string; date: string; creneau: string }
  | { kind: "serre"; avec: string; date: string; creneau: string; ecartMin: number };

const jour = (d: Date) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;

const minutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

const hhmm = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

const dateLisible = (iso: string) =>
  new Date(iso + "T12:00:00Z").toLocaleDateString("fr-FR",
    { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Les deux périodes [a1,a2] et [b1,b2] ont-elles au moins un jour en commun ? */
function periodesSeCroisent(a1: string, a2: string | null, b1: string, b2: string | null) {
  const debut = a1 > b1 ? a1 : b1;
  const fin   = a2 === null ? b2 : b2 === null ? a2 : (a2 < b2 ? a2 : b2);
  return fin === null || debut <= fin;
}

/**
 * Première date à laquelle une récurrente et une autre contrainte coïncident.
 * Renvoie null si elles ne se croisent jamais.
 */
function premierJourCommun(
  weekday: number, from: string, until: string | null,
  autreFrom: string, autreUntil: string | null,
): string | null {
  if (!periodesSeCroisent(from, until, autreFrom, autreUntil)) return null;
  const debut = from > autreFrom ? from : autreFrom;
  const finBrute = until === null ? autreUntil : autreUntil === null ? until : (until < autreUntil ? until : autreUntil);

  const d = new Date(debut + "T12:00:00Z");
  for (let i = 0; i < 7; i++) {
    if (d.getUTCDay() === weekday) {
      const j = jour(d);
      if (finBrute !== null && j > finBrute) return null;
      return j;
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

/** Comparaison horaire : chevauchement, ou simplement trop serré ? */
function compareHoraires(
  debutA: number, dureeA: number,
  debutB: number, dureeB: number,
): { chevauche: boolean; ecart: number } {
  const finA = debutA + dureeA;
  const finB = debutB + dureeB;
  if (debutA < finB && debutB < finA) return { chevauche: true, ecart: 0 };
  const ecart = debutA >= finB ? debutA - finB : debutB - finA;
  return { chevauche: false, ecart };
}

/**
 * Confronte une séance à créer aux séances existantes du mentor.
 *
 * `aujourdhui` est injecté pour rester testable — le comportement dépend de la
 * date, c'est précisément ce qui manquait.
 */
export function analyserConflit(
  candidate: Candidate,
  existantes: Seance[],
  aujourdhui = jour(new Date()),
): Verdict {
  let serre: Verdict | null = null;

  for (const e of existantes) {
    const dureeE = e.duration_min ?? 60;
    let jourCommun: string | null = null;
    let debutE = 0;

    if (candidate.type === "recurring") {
      const debutN = minutes(candidate.startTime);

      if (e.session_type === "recurring") {
        if (e.weekday !== candidate.weekday || !e.start_time) continue;
        // Une récurrente déjà terminée ne gêne plus personne.
        if (e.active_until && e.active_until < aujourdhui) continue;
        jourCommun = premierJourCommun(
          candidate.weekday, candidate.from, candidate.until,
          e.active_from ?? aujourdhui, e.active_until,
        );
        debutE = minutes(e.start_time);
      } else if (e.scheduled_at) {
        const d = new Date(e.scheduled_at);
        const j = jour(d);
        // Une séance passée est finie : elle ne peut plus rien bloquer.
        if (j < aujourdhui) continue;
        if (d.getUTCDay() !== candidate.weekday) continue;
        // Et elle doit tomber dans la période de la récurrente.
        if (j < candidate.from) continue;
        if (candidate.until && j > candidate.until) continue;
        jourCommun = j;
        debutE = d.getUTCHours() * 60 + d.getUTCMinutes();
      }

      if (!jourCommun) continue;
      const r = compareHoraires(debutN, candidate.duration, debutE, dureeE);
      const creneau = `${hhmm(debutE)}–${hhmm(debutE + dureeE)}`;
      if (r.chevauche) return { kind: "chevauchement", avec: e.title, date: jourCommun, creneau };
      if (r.ecart < BATTEMENT_MIN && !serre) {
        serre = { kind: "serre", avec: e.title, date: jourCommun, creneau, ecartMin: r.ecart };
      }
      continue;
    }

    // ── La séance à créer est ponctuelle ────────────────────────────────────
    const dn = new Date(candidate.scheduledAt);
    const jn = jour(dn);
    const debutN = dn.getUTCHours() * 60 + dn.getUTCMinutes();

    if (e.session_type === "once") {
      if (!e.scheduled_at) continue;
      const d = new Date(e.scheduled_at);
      if (jour(d) !== jn) continue;
      jourCommun = jn;
      debutE = d.getUTCHours() * 60 + d.getUTCMinutes();
    } else {
      if (e.weekday === null || !e.start_time) continue;
      if (dn.getUTCDay() !== e.weekday) continue;
      // La date choisie doit tomber dans la période d'activité de la récurrente.
      if (e.active_from && jn < e.active_from) continue;
      if (e.active_until && jn > e.active_until) continue;
      jourCommun = jn;
      debutE = minutes(e.start_time);
    }

    const r = compareHoraires(debutN, candidate.duration, debutE, dureeE);
    const creneau = `${hhmm(debutE)}–${hhmm(debutE + dureeE)}`;
    if (r.chevauche) return { kind: "chevauchement", avec: e.title, date: jourCommun, creneau };
    if (r.ecart < BATTEMENT_MIN && !serre) {
      serre = { kind: "serre", avec: e.title, date: jourCommun, creneau, ecartMin: r.ecart };
    }
  }

  return serre ?? { kind: "libre" };
}

/** Message affiché au mentor — il doit toujours nommer la date en cause. */
export function messageConflit(v: Verdict): string {
  if (v.kind === "chevauchement") {
    return `Chevauchement le ${dateLisible(v.date)} : « ${v.avec} » occupe déjà ${v.creneau}.`;
  }
  if (v.kind === "serre") {
    const h = Math.floor(v.ecartMin / 60), m = v.ecartMin % 60;
    const duree = h > 0 ? `${h} h${m ? ` ${m}` : ""}` : `${m} min`;
    return `Séance ajoutée. Attention : le ${dateLisible(v.date)}, « ${v.avec} » occupe ${v.creneau} — ${duree} d'écart seulement.`;
  }
  return "";
}
