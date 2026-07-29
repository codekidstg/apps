"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createAssignment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { error } = await (supabase.from("theme_assignments") as any).insert({
    theme_id:     formData.get("theme_id") as string,
    class_id:     formData.get("class_id") as string,
    teacher_id:   formData.get("teacher_id") as string,
    scheduled_at: formData.get("scheduled_at") as string || null,
    created_by:   user.id,
  });

  if (error) return { error: error.message };
  revalidatePath("/manager/affectations");
  return { success: true };
}
