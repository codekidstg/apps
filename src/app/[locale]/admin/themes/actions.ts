"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export type LessonStatus = "draft" | "validated" | "published" | "archived";

export async function updateLessonStatus(lessonId: string, status: LessonStatus) {
  const admin = createAdminClient();
  const { error } = await (admin.from("lessons") as any)
    .update({ status })
    .eq("id", lessonId);
  if (error) return { error: error.message };
  revalidatePath("/admin/themes");
  return { success: true };
}

export async function publishTheme(themeId: string) {
  const admin = createAdminClient();

  // Verrouille l'ancienne version published du même parent s'il y en a une
  const { data: theme } = await admin
    .from("themes").select("parent_version_id").eq("id", themeId).single<{ parent_version_id: string | null }>();

  if (theme?.parent_version_id) {
    await (admin.from("themes") as any)
      .update({ status: "locked", locked_at: new Date().toISOString() })
      .eq("id", theme.parent_version_id);
  }

  const { error } = await (admin.from("themes") as any).update({
    status: "published",
    published_at: new Date().toISOString(),
  }).eq("id", themeId);

  if (error) return { error: error.message };

  await (admin.from("theme_validations") as any).insert({
    theme_id: themeId,
    from_status: "validated",
    to_status: "published",
  });

  revalidatePath("/admin/themes");
  return { success: true };
}

export async function deleteTheme(themeId: string) {
  const admin = createAdminClient();
  const db = admin as any;

  // Supprimer les tables sans cascade d'abord
  await db.from("theme_validations").delete().eq("theme_id", themeId);
  await db.from("theme_assignments").delete().eq("theme_id", themeId);
  // theme_competencies si elle existe
  try { await db.from("theme_competencies").delete().eq("theme_id", themeId); } catch (_) {}

  // Cascade manuelle : lesson_blocks → lessons → chapters
  const { data: chapters } = await db.from("chapters").select("id").eq("theme_id", themeId) as { data: { id: string }[] | null };
  for (const ch of chapters ?? []) {
    const { data: lessons } = await db.from("lessons").select("id").eq("chapter_id", ch.id) as { data: { id: string }[] | null };
    for (const l of lessons ?? []) {
      await db.from("lesson_blocks").delete().eq("lesson_id", l.id);
    }
    await db.from("lessons").delete().eq("chapter_id", ch.id);
  }
  await db.from("chapters").delete().eq("theme_id", themeId);

  const { error } = await db.from("themes").delete().eq("id", themeId);
  if (error) return { error: error.message };
  revalidatePath("/admin/themes");
  return { success: true };
}

export async function reorderThemes(ids: string[]) {
  const admin = createAdminClient();
  await Promise.all(
    ids.map((id, i) => (admin.from("themes") as any).update({ order_index: i }).eq("id", id))
  );
  revalidatePath("/admin/themes");
  revalidatePath("/eleve");
  return { success: true };
}

export async function rejectTheme(themeId: string, comment: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("themes") as any).update({ status: "draft" }).eq("id", themeId);
  if (error) return { error: error.message };

  await (admin.from("theme_validations") as any).insert({
    theme_id: themeId,
    from_status: "validated",
    to_status: "draft",
    comment,
  });

  revalidatePath("/admin/themes");
  return { success: true };
}
