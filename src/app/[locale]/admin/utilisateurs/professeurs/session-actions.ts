"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const BUFFER_MIN = 180; // 3 heures

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function hasConflict(
  newStart: number, // minutes depuis minuit
  newDuration: number,
  existing: { startMin: number; duration: number; title: string }[],
): { conflict: boolean; with?: string } {
  for (const e of existing) {
    const gap = Math.abs(newStart - e.startMin);
    if (gap < BUFFER_MIN) {
      return { conflict: true, with: e.title };
    }
  }
  return { conflict: false };
}

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
    .select("id, title, session_type, weekday, start_time, scheduled_at, duration_min")
    .eq("teacher_id", teacherId);

  const allSessions: any[] = existing ?? [];

  if (sessionType === "recurring") {
    const newWeekday   = parseInt(formData.get("weekday") as string, 10);
    const newStartTime = formData.get("start_time") as string;
    const newStart     = timeToMinutes(newStartTime);

    // Séances existantes sur le même jour de semaine
    const sameDay = allSessions.flatMap((s: any) => {
      if (s.session_type === "recurring" && s.weekday === newWeekday) {
        return [{ startMin: timeToMinutes(s.start_time), duration: s.duration_min, title: s.title }];
      }
      if (s.session_type === "once") {
        const d = new Date(s.scheduled_at);
        if (d.getDay() === newWeekday) {
          return [{ startMin: d.getHours() * 60 + d.getMinutes(), duration: s.duration_min, title: s.title }];
        }
      }
      return [];
    });

    const check = hasConflict(newStart, durationMin, sameDay);
    if (check.conflict) {
      const hh = String(Math.floor(newStart / 60)).padStart(2, "0");
      const mm = String(newStart % 60).padStart(2, "0");
      return { error: `Conflit de planning : "${check.with}" est déjà planifié ce jour à moins de 3h de ${hh}:${mm}.` };
    }

    const row = {
      teacher_id: teacherId, session_type: sessionType, title,
      duration_min: durationMin, active_from: activeFrom,
      active_until: activeUntil || null, notes, student_id: studentId,
      weekday: newWeekday, start_time: newStartTime,
    };
    const { error } = await (admin.from("teacher_sessions") as any).insert(row);
    if (error) return { error: error.message };

  } else {
    const scheduledAt = formData.get("scheduled_at") as string;
    const dt = new Date(scheduledAt);
    const newStart   = dt.getHours() * 60 + dt.getMinutes();
    const newWeekday = dt.getDay();

    const sameDay = allSessions.flatMap((s: any) => {
      if (s.session_type === "recurring" && s.weekday === newWeekday) {
        return [{ startMin: timeToMinutes(s.start_time), duration: s.duration_min, title: s.title }];
      }
      if (s.session_type === "once") {
        const d = new Date(s.scheduled_at);
        if (d.toDateString() === dt.toDateString()) {
          return [{ startMin: d.getHours() * 60 + d.getMinutes(), duration: s.duration_min, title: s.title }];
        }
      }
      return [];
    });

    const check = hasConflict(newStart, durationMin, sameDay);
    if (check.conflict) {
      return { error: `Conflit de planning : "${check.with}" est déjà planifié ce jour à moins de 3h de l'heure choisie.` };
    }

    const row = {
      teacher_id: teacherId, session_type: sessionType, title,
      duration_min: durationMin, active_from: activeFrom,
      active_until: activeUntil || null, notes, student_id: studentId,
      scheduled_at: scheduledAt,
    };
    const { error } = await (admin.from("teacher_sessions") as any).insert(row);
    if (error) return { error: error.message };
  }

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
