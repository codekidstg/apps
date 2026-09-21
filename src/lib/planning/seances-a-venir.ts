/**
 * Les séances à venir, prêtes à afficher — le même chargement pour l'accueil
 * admin et l'accueil manager.
 *
 * À chaque séance on attache la leçon que l'enfant ouvrira, déduite de sa
 * progression, et l'alerte quand cette leçon n'existe pas encore : c'est le
 * seul endroit de la plateforme où le planning croise l'état du contenu. Un
 * mentor qui ouvre une leçon vide en séance, la direction doit l'apprendre
 * avant, pas après.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { prochainesOccurrences, type SeancePlanifiee } from "./occurrences";
import { prochainesLecons, type LeconAVenir } from "@/lib/eleve/prochaine-lecon";
import { alerteDe } from "./alerte-lecon";

export type SeanceAVenir = {
  seanceId: string;
  /** Le titre saisi à la création — souvent générique, jamais une leçon. */
  titre: string;
  quand: Date;
  enCours: boolean;
  mentor: string;
  eleve: string | null;
  lecon: LeconAVenir | null;
  alerte: string | null;
};

/** Une relation PostgREST arrive tantôt en objet, tantôt en tableau. */
function nomDe(relation: unknown): string | null {
  const r = Array.isArray(relation) ? relation[0] : relation;
  return (r as { display_name?: string } | null)?.display_name ?? null;
}

export async function getSeancesAVenir(jours = 7): Promise<SeanceAVenir[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data } = await admin.from("teacher_sessions").select(
    "id, title, session_type, weekday, start_time, scheduled_at, duration_min, active_from, active_until," +
    " student_id, teacher_id, profiles!teacher_id(display_name), students(profiles!profile_id(display_name))",
  );

  type Jointe = SeancePlanifiee & { profiles?: unknown; students?: { profiles?: unknown } | { profiles?: unknown }[] };
  const seances = (data ?? []) as Jointe[];

  const occurrences = prochainesOccurrences(seances, jours);
  if (!occurrences.length) return [];

  const eleveIds = [...new Set(occurrences.map((o) => o.studentId).filter((x): x is string => !!x))];
  const lecons   = await prochainesLecons(eleveIds);
  const parId    = new Map(seances.map((s) => [s.id, s]));

  return occurrences.map((o) => {
    const s = parId.get(o.seanceId);
    const eleveRel = Array.isArray(s?.students) ? s?.students[0] : s?.students;
    const resultat = o.studentId ? lecons.get(o.studentId) : undefined;

    return {
      seanceId: o.seanceId,
      titre:    o.titre,
      quand:    o.quand,
      enCours:  o.enCours,
      mentor:   nomDe(s?.profiles) ?? "Mentor",
      eleve:    nomDe(eleveRel?.profiles),
      lecon:    resultat?.etat === "trouvee" ? resultat.lecon : null,
      alerte:   alerteDe(resultat),
    };
  });
}
