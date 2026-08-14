"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

// ── Themes ────────────────────────────────────────────────────────────────────

export async function createTheme(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const title = formData.get("title") as string;
  const { data, error } = await (supabase.from("themes") as any).insert({
    title,
    slug:            slugify(title),
    description:     formData.get("description") as string || null,
    level:           formData.get("level") as string,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
    created_by:      user.id,
    status:          "draft",
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/manager/themes");
  redirect(`/fr/manager/themes/${data.id}`);
}

export async function updateThemeMeta(themeId: string, formData: FormData) {
  const supabase = await createClient();
  const title = formData.get("title") as string;
  const { error } = await (supabase.from("themes") as any).update({
    title,
    slug:            slugify(title),
    description:     formData.get("description") as string || null,
    estimated_hours: formData.get("estimated_hours") ? Number(formData.get("estimated_hours")) : null,
  }).eq("id", themeId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

export async function submitForReview(themeId: string) {
  // Utilise l'admin client car la policy manager ne permet pas de changer le status via UPDATE
  const admin = createAdminClient();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await (admin.from("themes") as any)
    .update({ status: "validated" })
    .eq("id", themeId)
    .eq("created_by", user.id);

  if (error) return { error: error.message };

  await (admin.from("theme_validations") as any).insert({
    theme_id: themeId, from_status: "draft", to_status: "validated", changed_by: user.id,
  });

  revalidatePath(`/manager/themes/${themeId}`);
  revalidatePath("/manager/themes");
  return { success: true };
}

export async function forkTheme(themeId: string) {
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: original } = await (supabase.from("themes") as any)
    .select("*").eq("id", themeId).single();
  if (!original) return { error: "Thème introuvable" };

  const { data: newTheme, error } = await (supabase.from("themes") as any).insert({
    title:            `${original.title} (v${Number(original.version) + 1})`,
    slug:             `${original.slug}-v${Number(original.version) + 1}`,
    description:      original.description as string | null,
    level:            original.level as string,
    estimated_hours:  original.estimated_hours as number | null,
    created_by:       user.id,
    status:           "draft",
    version:          Number(original.version) + 1,
    parent_version_id: themeId,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath("/manager/themes");
  return { id: newTheme.id };
}

export async function updateThemeStatus(themeId: string, status: "draft" | "validated" | "published" | "archived") {
  const admin = createAdminClient();
  const { error } = await (admin.from("themes") as any).update({ status }).eq("id", themeId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  revalidatePath("/manager/themes");
  return { success: true };
}

// ── Chapters ──────────────────────────────────────────────────────────────────

export async function createChapter(themeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: existing } = await (supabase.from("chapters") as any)
    .select("order_index").eq("theme_id", themeId).order("order_index", { ascending: false }).limit(1);
  const nextIndex = ((existing as any[])?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await (supabase.from("chapters") as any).insert({
    theme_id:          themeId,
    title:             formData.get("title") as string,
    description:       formData.get("description") as string || null,
    estimated_minutes: formData.get("estimated_minutes") ? Number(formData.get("estimated_minutes")) : null,
    order_index:       nextIndex,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { id: data.id };
}

export async function updateChapter(chapterId: string, themeId: string, data: { title?: string; description?: string }) {
  const supabase = await createClient();
  const { error } = await (supabase.from("chapters") as any).update(data).eq("id", chapterId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

export async function deleteChapter(chapterId: string, themeId: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from("chapters") as any).delete().eq("id", chapterId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

// ── Lessons ───────────────────────────────────────────────────────────────────

export async function createLesson(chapterId: string, themeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: existing } = await (supabase.from("lessons") as any)
    .select("order_index").eq("chapter_id", chapterId).order("order_index", { ascending: false }).limit(1);
  const nextIndex = ((existing as any[])?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await (supabase.from("lessons") as any).insert({
    chapter_id:        chapterId,
    theme_id:          themeId,
    title:             formData.get("title") as string,
    xp_reward:         formData.get("xp_reward") ? Number(formData.get("xp_reward")) : 10,
    estimated_minutes: formData.get("estimated_minutes") ? Number(formData.get("estimated_minutes")) : null,
    order_index:       nextIndex,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  revalidateTag("lessons", {});
  return { id: data.id };
}

export async function updateLesson(lessonId: string, themeId: string, data: { title?: string; xp_reward?: number; status?: string }) {
  const supabase = await createClient();
  const { error } = await (supabase.from("lessons") as any).update(data).eq("id", lessonId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  revalidateTag("lessons", {});
  return { success: true };
}

export async function deleteLesson(lessonId: string, themeId: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from("lessons") as any).delete().eq("id", lessonId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  revalidateTag("lessons", {});
  return { success: true };
}

// ── Blocks ────────────────────────────────────────────────────────────────────

export async function createBlock(lessonId: string, themeId: string, type: string) {
  const supabase = await createClient();
  const { data: existing } = await (supabase.from("lesson_blocks") as any)
    .select("order_index").eq("lesson_id", lessonId).order("order_index", { ascending: false }).limit(1);
  const nextIndex = ((existing as any[])?.[0]?.order_index ?? -1) + 1;

  const defaultContent: Record<string, unknown> = {
    text:            { markdown: "" },
    video:           { url: "", title: "" },
    quiz:            { questions: [] },
    code_challenge:  { language: "python", starter_code: "", tests: [] },
    game:            { game_type: "maze", params: {} },
  };

  const { data, error } = await (supabase.from("lesson_blocks") as any).insert({
    lesson_id:   lessonId,
    theme_id:    themeId,
    type,
    content:     defaultContent[type] ?? {},
    order_index: nextIndex,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { id: data.id };
}

export async function updateBlock(blockId: string, themeId: string, content: unknown) {
  const supabase = await createClient();
  const { error } = await (supabase.from("lesson_blocks") as any).update({ content }).eq("id", blockId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

export async function deleteBlock(blockId: string, themeId: string) {
  const supabase = await createClient();
  const { error } = await (supabase.from("lesson_blocks") as any).delete().eq("id", blockId);
  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

export async function moveBlock(blockId: string, lessonId: string, themeId: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: blocks } = await (supabase.from("lesson_blocks") as any)
    .select("id, order_index").eq("lesson_id", lessonId).order("order_index") as { data: { id: string; order_index: number }[] | null };

  if (!blocks || blocks.length < 2) return { success: true };
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return { success: true };

  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return { success: true };

  const a = blocks[idx];
  const b = blocks[swapIdx];
  await (supabase.from("lesson_blocks") as any).update({ order_index: b.order_index }).eq("id", a.id);
  await (supabase.from("lesson_blocks") as any).update({ order_index: a.order_index }).eq("id", b.id);

  revalidatePath(`/manager/themes/${themeId}`);
  return { success: true };
}

// ── Trainings ─────────────────────────────────────────────────────────────────

export async function createTraining(lessonId: string, themeId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: existing } = await (supabase.from("trainings") as any)
    .select("order_index").eq("lesson_id", lessonId).order("order_index", { ascending: false }).limit(1);
  const nextIndex = ((existing as any[])?.[0]?.order_index ?? -1) + 1;

  const { data, error } = await (supabase.from("trainings") as any).insert({
    lesson_id:   lessonId,
    title:       formData.get("title") as string,
    description: formData.get("description") as string || null,
    xp_reward:   Number(formData.get("xp_reward") ?? 30),
    order_index: nextIndex,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}`);
  revalidateTag("trainings", {});
  return { id: data.id };
}

export async function deleteTraining(trainingId: string, lessonId: string, themeId: string) {
  const supabase = await createClient();
  await (supabase.from("trainings") as any).delete().eq("id", trainingId);
  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}`);
  revalidateTag("trainings", {});
  return { success: true };
}

export async function createTrainingBlock(trainingId: string, lessonId: string, themeId: string, type: string) {
  const supabase = await createClient();
  const { data: existing } = await (supabase.from("training_blocks") as any)
    .select("order_index").eq("training_id", trainingId).order("order_index", { ascending: false }).limit(1);
  const nextIndex = ((existing as any[])?.[0]?.order_index ?? -1) + 1;

  const defaultContent: Record<string, unknown> = {
    text:           { markdown: "" },
    quiz:           { questions: [] },
    code_challenge: { language: "python", starter_code: "", required: false },
  };

  const { data, error } = await (supabase.from("training_blocks") as any).insert({
    training_id: trainingId,
    type,
    content:     defaultContent[type] ?? {},
    order_index: nextIndex,
  }).select("id").single();

  if (error) return { error: error.message };
  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}/entrainements/${trainingId}`);
  return { id: data.id };
}

export async function updateTrainingBlock(blockId: string, trainingId: string, lessonId: string, themeId: string, content: unknown) {
  const supabase = await createClient();
  await (supabase.from("training_blocks") as any).update({ content }).eq("id", blockId);
  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}/entrainements/${trainingId}`);
  return { success: true };
}

export async function deleteTrainingBlock(blockId: string, trainingId: string, lessonId: string, themeId: string) {
  const supabase = await createClient();
  await (supabase.from("training_blocks") as any).delete().eq("id", blockId);
  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}/entrainements/${trainingId}`);
  return { success: true };
}

export async function moveTrainingBlock(blockId: string, trainingId: string, lessonId: string, themeId: string, direction: "up" | "down") {
  const supabase = await createClient();
  const { data: blocks } = await (supabase.from("training_blocks") as any)
    .select("id, order_index").eq("training_id", trainingId).order("order_index") as { data: { id: string; order_index: number }[] | null };

  if (!blocks || blocks.length < 2) return { success: true };
  const idx = blocks.findIndex((b) => b.id === blockId);
  if (idx === -1) return { success: true };
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= blocks.length) return { success: true };

  const a = blocks[idx], b = blocks[swapIdx];
  await (supabase.from("training_blocks") as any).update({ order_index: b.order_index }).eq("id", a.id);
  await (supabase.from("training_blocks") as any).update({ order_index: a.order_index }).eq("id", b.id);

  revalidatePath(`/manager/themes/${themeId}/lecons/${lessonId}/entrainements/${trainingId}`);
  return { success: true };
}
