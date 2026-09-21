/**
 * Les prochaines séances, heure du Togo.
 *
 * Le calcul existait déjà cinq fois — accueil manager, accueil prof, planning
 * prof, rapports (pour le passé), compta (pour le mois). Quatre de ces cinq
 * lisent les dates avec `getDay()` / `setHours()`, donc dans le fuseau de la
 * machine : juste par coïncidence tant que le serveur tourne en UTC comme le
 * Togo, faux le jour où il change de région.
 *
 * Celui-ci est le seul pour l'avenir, et il passe par les accesseurs UTC de
 * `dates.ts`. Deux oublis de la version manager sont réparés au passage :
 *   · `active_from` était ignoré — une séance qui ne commence que le mois
 *     prochain s'affichait dès aujourd'hui ;
 *   · une séance commencée depuis dix minutes disparaissait de l'écran, alors
 *     que c'est précisément celle qui est en train d'avoir lieu.
 */
import { jourTogo, minuit } from "./dates";

export type SeancePlanifiee = {
  id: string;
  title: string | null;
  session_type: string;
  weekday: number | null;
  start_time: string | null;
  scheduled_at: string | null;
  duration_min?: number | null;
  active_from?: string | null;
  active_until?: string | null;
  student_id?: string | null;
  teacher_id?: string | null;
};

export type Occurrence = {
  seanceId: string;
  titre: string;
  quand: Date;
  /** Commencée, pas encore finie. */
  enCours: boolean;
  studentId: string | null;
  teacherId: string | null;
};

const DUREE_DEFAUT = 60;
const JOUR = 86_400_000;

export function prochainesOccurrences(
  seances: SeancePlanifiee[],
  jours = 7,
  maintenant: Date = new Date(),
): Occurrence[] {
  const out: Occurrence[] = [];
  const now    = maintenant.getTime();
  const limite = now + jours * JOUR;

  for (const s of seances) {
    const duree = (s.duration_min ?? DUREE_DEFAUT) * 60_000;

    const retient = (quand: Date) => {
      const t = quand.getTime();
      if (t > limite) return;
      if (t + duree < now) return;            // déjà terminée
      out.push({
        seanceId:  s.id,
        titre:     (s.title ?? "").trim() || "Séance",
        quand,
        enCours:   t <= now,
        studentId: s.student_id ?? null,
        teacherId: s.teacher_id ?? null,
      });
    };

    if (s.session_type === "recurring" && s.weekday !== null && s.start_time) {
      // `active_from` / `active_until` bornent la récurrence, pas une séance
      // ponctuelle : celle-ci vaut par sa date, et rien d'autre.
      const depuis = s.active_from  ? minuit(s.active_from).getTime()       : -Infinity;
      const jusqua = s.active_until ? minuit(s.active_until).getTime() + JOUR - 1 : Infinity;

      const [h, m] = s.start_time.split(":").map(Number);
      const curseur = minuit(jourTogo(maintenant));
      curseur.setUTCHours(h || 0, m || 0, 0, 0);
      curseur.setUTCDate(curseur.getUTCDate() + ((s.weekday - curseur.getUTCDay() + 7) % 7));
      // Le jour même, une séance déjà finie renvoie à la semaine suivante.
      if (curseur.getTime() + duree < now) curseur.setUTCDate(curseur.getUTCDate() + 7);

      while (curseur.getTime() <= limite) {
        const t = curseur.getTime();
        if (t >= depuis && t <= jusqua) retient(new Date(curseur));
        curseur.setUTCDate(curseur.getUTCDate() + 7);
      }
    } else if (s.scheduled_at) {
      retient(new Date(s.scheduled_at));
    }
  }

  return out.sort((a, b) => a.quand.getTime() - b.quand.getTime());
}
