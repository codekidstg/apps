"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath, revalidateTag } from "next/cache";
import type { BlockType } from "@/lib/supabase/types";

function invalidate(themeId: string, lessonId: string) {
  revalidatePath(`/admin/themes/${themeId}/lecons/${lessonId}`);
  revalidateTag("lessons", {} as any);
}

export async function adminCreateBlock(lessonId: string, themeId: string, type: BlockType) {
  const admin = createAdminClient();
  const { count } = await (admin.from("lesson_blocks") as any)
    .select("id", { count: "exact", head: true })
    .eq("lesson_id", lessonId);

  const defaults: Record<string, object> = {
    text:           { html: "" },
    video:          { url: "", title: "" },
    quiz:           { questions: [] },
    code_challenge: { language: "python", starter_code: "", tests: [] },
    game:           { game_type: "", params: {}, instructions: "" },
  };

  const { data, error } = await (admin.from("lesson_blocks") as any)
    .insert({ lesson_id: lessonId, type, content: defaults[type] ?? {}, order_index: count ?? 0 })
    .select("id").single();

  if (error) return { error: error.message };
  invalidate(themeId, lessonId);
  return { id: data.id };
}

export async function adminUpdateBlock(blockId: string, themeId: string, lessonId: string, content: unknown) {
  const admin = createAdminClient();
  const { error } = await (admin.from("lesson_blocks") as any)
    .update({ content })
    .eq("id", blockId);
  if (error) return { error: error.message };
  invalidate(themeId, lessonId);
  return { success: true };
}

export async function adminDeleteBlock(blockId: string, themeId: string, lessonId: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("lesson_blocks") as any)
    .delete().eq("id", blockId);
  if (error) return { error: error.message };
  invalidate(themeId, lessonId);
  return { success: true };
}

export async function adminMoveBlock(blockId: string, lessonId: string, themeId: string, direction: "up" | "down") {
  const admin = createAdminClient();
  const { data: blocks } = await (admin.from("lesson_blocks") as any)
    .select("id, order_index").eq("lesson_id", lessonId).order("order_index");

  const idx = (blocks ?? []).findIndex((b: any) => b.id === blockId);
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swapIdx < 0 || swapIdx >= (blocks ?? []).length) return { success: true };

  const a = blocks![idx];
  const b = blocks![swapIdx];
  await Promise.all([
    (admin.from("lesson_blocks") as any).update({ order_index: b.order_index }).eq("id", a.id),
    (admin.from("lesson_blocks") as any).update({ order_index: a.order_index }).eq("id", b.id),
  ]);
  invalidate(themeId, lessonId);
  return { success: true };
}

export async function adminUpdateLessonMeta(lessonId: string, themeId: string, data: { title?: string; xp_reward?: number; status?: string }) {
  const admin = createAdminClient();
  const { error } = await (admin.from("lessons") as any)
    .update(data).eq("id", lessonId);
  if (error) return { error: error.message };
  invalidate(themeId, lessonId);
  revalidatePath("/admin/themes");
  return { success: true };
}
