"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateStudentProfile(studentId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();

  const birthYearRaw = formData.get("birth_year") as string;
  const birthYear = birthYearRaw ? parseInt(birthYearRaw, 10) : null;

  const { error } = await (admin.from("students") as any)
    .update({
      gender:       formData.get("gender")       || null,
      birth_year:   birthYear,
      device:       formData.get("device")        || null,
      school_level: formData.get("school_level") || null,
      objective:    formData.get("objective")     || null,
      notes:        formData.get("notes")         || null,
    })
    .eq("id", studentId);

  if (error) return { error: error.message };

  revalidatePath("/admin/utilisateurs/eleves");
  revalidatePath(`/admin/utilisateurs/eleves/${studentId}`);
  revalidatePath("/manager/utilisateurs/eleves");
  revalidatePath(`/manager/utilisateurs/eleves/${studentId}`);
  return { success: true };
}
