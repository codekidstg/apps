import { jourTogo, minuit, jourSemaine, ecartEnJours } from "@/lib/planning/dates";

/**
 * La prochaine séance d'un élève, pour une promesse tenable.
 *
 * Jamais « ton mentor te répond tout de suite » : les mentors sont payés à la
 * séance. La date de la prochaine est connue — on la dit.
 *
 * Même calcul que la carte « Prochaine session » de l'accueil du mentor, en
 * heure du Togo.
 */

export type SeanceBrute = {
  session_type: string;
  weekday: number | null;
  start_time: string | null;
  scheduled_at: string | null;
  active_until?: string | null;
};

export function prochaineSeance(seances: SeanceBrute[], maintenant: Date = new Date()): Date | null {
  let meilleure: Date | null = null;

  for (const s of seances) {
    let quand: Date | null = null;

    if (s.session_type === "recurring" && s.weekday !== null && s.start_time) {
      const [h, m] = s.start_time.split(":").map(Number);
      const curseur = minuit(jourTogo(maintenant));
      curseur.setUTCHours(h, m, 0, 0);
      const ecart = (s.weekday - jourSemaine(curseur) + 7) % 7;
      curseur.setUTCDate(curseur.getUTCDate() + (ecart === 0 && curseur > maintenant ? 0 : ecart === 0 ? 7 : ecart));
      if (s.active_until && curseur > new Date(s.active_until)) continue;
      quand = curseur;
    } else if (s.session_type === "once" && s.scheduled_at) {
      const d = new Date(s.scheduled_at);
      if (d > maintenant) quand = d;
    }

    if (quand && (!meilleure || quand < meilleure)) meilleure = quand;
  }
  return meilleure;
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/** « aujourd'hui », « demain », ou le jour de la semaine. */
export function jourDeSeance(quand: Date, maintenant: Date = new Date()): string {
  const ecart = ecartEnJours(quand, maintenant);
  if (ecart === 0) return "aujourd'hui";
  if (ecart === 1) return "demain";
  return JOURS[jourSemaine(quand)];
}
