import { createAdminClient } from "@/lib/supabase/server";

/**
 * Les leçons préparées par un enfant et pas encore validées par son mentor.
 *
 * C'est la contrepartie obligatoire du verrou du 30 septembre 2026 : depuis que
 * la validation du mentor commande le déverrouillage, un mentor qui oublie de
 * cocher bloque son élève jusqu'à la semaine suivante. Sans cette liste,
 * personne ne le verrait — et c'est Roland qui recevrait l'appel du parent.
 */

export type Attente = {
  studentId: string;
  eleve: string;
  lessonId: string;
  lecon: string;
  depuis: string;        // ISO
  jours: number;         // arrondi au jour entier, 0 = aujourd'hui
  mentorId: string | null;
};

/**
 * `mentorId` restreint aux élèves de ce mentor ; sans lui, toute la plateforme.
 * Triées de la plus ancienne à la plus récente : c'est l'ordre de l'urgence.
 */
export async function leconsEnAttente(mentorId?: string): Promise<Attente[]> {
  const admin = createAdminClient();

  let q = (admin.from("lesson_progress") as any)
    .select("student_id, lesson_id, prepared_at, lessons(title), students!inner(teacher_id, profiles!profile_id(display_name))")
    .eq("status", "prepared")
    .order("prepared_at", { ascending: true });

  if (mentorId) q = q.eq("students.teacher_id", mentorId);

  const { data, error } = await q;
  if (error) { console.error("[en-attente]", error.message); return []; }

  const maintenant = Date.now();
  return ((data ?? []) as any[]).map((r) => ({
    studentId: r.student_id,
    eleve:     r.students?.profiles?.display_name ?? "Élève",
    lessonId:  r.lesson_id,
    lecon:     r.lessons?.title ?? "Leçon",
    depuis:    r.prepared_at,
    jours:     r.prepared_at
      ? Math.floor((maintenant - new Date(r.prepared_at).getTime()) / 86_400_000)
      : 0,
    mentorId:  r.students?.teacher_id ?? null,
  }));
}

/** « depuis 3 jours », « hier », « aujourd'hui » — dit à un mentor pressé. */
export function depuisLisible(jours: number): string {
  if (jours <= 0) return "aujourd'hui";
  if (jours === 1) return "depuis hier";
  return `depuis ${jours} jours`;
}
