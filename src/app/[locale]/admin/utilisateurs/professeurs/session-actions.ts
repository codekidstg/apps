"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { analyserConflit, messageConflit, type Seance } from "@/lib/planning/conflits";

export async function createTeacherSession(formData: FormData) {
  const admin = createAdminClient();
  const teacherId   = formData.get("teacher_id") as string;
  const sessionType = formData.get("session_type") as "recurring" | "once";
  const title       = (formData.get("title") as string).trim();
  const durationMin = parseInt(formData.get("duration_min") as string, 10) || 60;
  const activeFrom  = formData.get("active_from") as string;
  const activeUntil = (formData.get("active_until") as string) || null;
  const notes       = (formData.get("notes") as string) || null;
  const studentId   = (formData.get("student_id") as string) || null;

  // --- Charger les sessions existantes du prof ---
  const { data: existing } = await (admin.from("teacher_sessions") as any)
    .select("id, title, session_type, weekday, start_time, scheduled_at, duration_min, active_from, active_until")
    .eq("teacher_id", teacherId);

  const existantes = (existing ?? []) as Seance[];

  // Une seule analyse pour les deux types : elle compare des dates réelles,
  // écarte le passé et distingue le chevauchement du simple manque d'espacement.
  const candidate = sessionType === "recurring"
    ? {
        type: "recurring" as const,
        weekday:   parseInt(formData.get("weekday") as string, 10),
        startTime: formData.get("start_time") as string,
        duration:  durationMin,
        from:      activeFrom,
        until:     activeUntil || null,
      }
    : {
        type: "once" as const,
        scheduledAt: formData.get("scheduled_at") as string,
        duration:    durationMin,
      };

  const verdict = analyserConflit(candidate, existantes);
  // Le chevauchement interdit ; l'espacement trop court avertit seulement.
  if (verdict.kind === "chevauchement") return { error: messageConflit(verdict) };

  const commun = {
    teacher_id: teacherId, session_type: sessionType, title,
    duration_min: durationMin, active_from: activeFrom,
    active_until: activeUntil || null, notes, student_id: studentId,
  };
  const row = candidate.type === "recurring"
    ? { ...commun, weekday: candidate.weekday, start_time: candidate.startTime }
    : { ...commun, scheduled_at: candidate.scheduledAt };

  const { error } = await (admin.from("teacher_sessions") as any).insert(row);
  if (error) return { error: error.message };

  revalidatePath("/admin/utilisateurs/professeurs");
  return verdict.kind === "serre"
    ? { success: true, warning: messageConflit(verdict) }
    : { success: true };
}

export async function deleteTeacherSession(sessionId: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("teacher_sessions") as any)
    .delete()
    .eq("id", sessionId);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/professeurs");
  return { success: true };
}
