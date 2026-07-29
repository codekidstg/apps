"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

export async function logLessonAccess(lessonId: string, themeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? null;
  const ua = h.get("user-agent") ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("log_lesson_access", {
    p_user_id:   user.id,
    p_lesson_id: lessonId,
    p_theme_id:  themeId,
    p_ip:        ip,
    p_ua:        ua,
  });
}

export async function upsertGrade(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const student_id = formData.get("student_id") as string;
  const theme_id   = formData.get("theme_id") as string;
  const score      = formData.get("score") ? Number(formData.get("score")) : null;
  const comment    = formData.get("comment") as string || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("grades") as any).upsert({
    teacher_id: user.id,
    student_id,
    theme_id,
    score,
    comment,
    graded_at: new Date().toISOString(),
  }, { onConflict: "teacher_id,student_id,theme_id" });

  if (error) return { error: error.message };
  revalidatePath("/prof/classes");
  return { success: true };
}
