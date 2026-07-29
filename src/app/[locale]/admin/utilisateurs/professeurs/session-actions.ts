"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createTeacherSession(formData: FormData) {
  const admin = createAdminClient();
  const teacherId   = formData.get("teacher_id") as string;
  const sessionType = formData.get("session_type") as "recurring" | "once";
  const title       = (formData.get("title") as string).trim();
  const durationMin = parseInt(formData.get("duration_min") as string, 10) || 60;
  const activeFrom  = formData.get("active_from") as string;
  const activeUntil = (formData.get("active_until") as string) || null;
  const notes       = (formData.get("notes") as string) || null;

  const studentId = (formData.get("student_id") as string) || null;

  let row: Record<string, unknown> = {
    teacher_id: teacherId,
    session_type: sessionType,
    title,
    duration_min: durationMin,
    active_from: activeFrom,
    active_until: activeUntil || null,
    notes,
    student_id: studentId,
  };

  if (sessionType === "recurring") {
    row.weekday    = parseInt(formData.get("weekday") as string, 10);
    row.start_time = formData.get("start_time") as string;
  } else {
    row.scheduled_at = formData.get("scheduled_at") as string;
  }

  const { error } = await (admin.from("teacher_sessions") as any).insert(row);
  if (error) return { error: error.message };
  revalidatePath("/admin/utilisateurs/professeurs");
  return { success: true };
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
