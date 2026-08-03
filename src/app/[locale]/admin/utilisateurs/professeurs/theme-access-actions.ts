"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleThemeAccess(studentId: string, themeId: string, activate: boolean) {
  const admin = createAdminClient();

  if (activate) {
    await (admin.from("student_theme_access") as any).upsert(
      { student_id: studentId, theme_id: themeId },
      { onConflict: "student_id,theme_id" }
    );
  } else {
    await (admin.from("student_theme_access") as any)
      .delete()
      .eq("student_id", studentId)
      .eq("theme_id", themeId);
  }

  revalidatePath("/admin/utilisateurs/professeurs");
}
