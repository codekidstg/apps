"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processGamificationEvent } from "@/lib/gamification/process-event";
import { checkThemeCompletion, issueCertificate } from "@/lib/certificates/generate";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function getStudentId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", userId)
    .single<{ id: string }>();
  return data?.id ?? null;
}

export async function completeLesson(lessonId: string, score: number, perfect: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  // Upsert lesson progress
  await (supabase.from("lesson_progress") as any).upsert({
    student_id:   studentId,
    lesson_id:    lessonId,
    status:       "completed",
    score,
    attempts:     1,
    completed_at: new Date().toISOString(),
  }, { onConflict: "student_id,lesson_id" });

  // Process gamification
  const result = await processGamificationEvent(studentId, "lesson_completed", { lessonId, score, perfect });

  // Auto-certificat si thème 100% complété
  try {
    const admin = createAdminClient();
    const { data: lesson } = await admin.from("lessons").select("chapter_id").eq("id", lessonId).single<{ chapter_id: string }>();
    if (lesson) {
      const { data: chapter } = await admin.from("chapters").select("theme_id").eq("id", lesson.chapter_id).single<{ theme_id: string }>();
      if (chapter?.theme_id) {
        const done = await checkThemeCompletion(studentId, chapter.theme_id);
        if (done) {
          // Vérifier que le certificat n'existe pas déjà
          const { data: existing } = await (admin.from("certificates") as any)
            .select("id").eq("student_id", studentId).eq("theme_id", chapter.theme_id).eq("cert_type", "theme").maybeSingle();
          if (!existing) {
            await issueCertificate({
              studentId,
              type:     "theme",
              themeId:  chapter.theme_id,
              score,
              totalXp:  result.xpGained ?? 0,
              validatedBy: user.id, // auto-validé par le système (prof devra confirmer)
            });
          }
        }
      }
    }
  } catch (_) { /* non bloquant */ }

  revalidatePath("/eleve");
  return { success: true, ...result };
}

export async function solveBlockly(lessonId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const result = await processGamificationEvent(studentId, "blockly_solved", { lessonId });

  revalidatePath("/eleve");
  return { success: true, ...result };
}

export async function completeTraining(trainingId: string, score: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  // Récupère le nombre de tentatives précédentes
  const { data: existing } = await (supabase.from("training_progress") as any)
    .select("attempts, score")
    .eq("student_id", studentId)
    .eq("training_id", trainingId)
    .maybeSingle();

  const prevAttempts = existing?.attempts ?? 0;
  const bestScore = Math.max(score, existing?.score ?? 0);

  await (supabase.from("training_progress") as any).upsert({
    student_id:   studentId,
    training_id:  trainingId,
    status:       "completed",
    score:        bestScore,
    attempts:     prevAttempts + 1,
    completed_at: new Date().toISOString(),
  }, { onConflict: "student_id,training_id" });

  // XP uniquement à la première complétion
  if (prevAttempts === 0) {
    const { data: training } = await (supabase.from("trainings") as any)
      .select("xp_reward")
      .eq("id", trainingId)
      .single();
    const xpReward = training?.xp_reward ?? 30;
    const result = await processGamificationEvent(studentId, "lesson_completed", {
      lessonId: trainingId, score, perfect: score === 100,
    });
    revalidatePath("/eleve");
    return { success: true, xpGained: result.xpGained ?? xpReward };
  }

  revalidatePath("/eleve");
  return { success: true, xpGained: 0 };
}

export async function syncBlockProgress(lessonId: string, blockProgress: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  try {
    const { data: existing } = await (supabase.from("lesson_progress") as any)
      .select("status")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      student_id:     studentId,
      lesson_id:      lessonId,
      block_progress: blockProgress,
    };
    // Relire une leçon déjà terminée ne doit pas la rétrograder : le déverrouillage
    // des leçons suivantes dépend du statut "completed" de la précédente.
    if (existing?.status !== "completed") payload.status = "in_progress";

    await (supabase.from("lesson_progress") as any)
      .upsert(payload, { onConflict: "student_id,lesson_id" });
  } catch (_) { /* La colonne block_progress n'existe peut-être pas encore */ }

  return { success: true };
}

export async function saveAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  await (supabase.from("student_avatar") as any).upsert({
    student_id: studentId,
    base:       formData.get("base") as string || "robot_blue",
    hat:        formData.get("hat")  as string || null,
    accessory:  formData.get("accessory") as string || null,
    color:      formData.get("color") as string || "#3B82F6",
    updated_at: new Date().toISOString(),
  }, { onConflict: "student_id" });

  revalidatePath("/eleve");
  return { success: true };
}
