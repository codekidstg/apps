"use server";
import { createAdminClient } from "@/lib/supabase/server";

export async function toggleAtelier(studentId: string, active: boolean) {
  const admin = createAdminClient();
  await (admin.from("students") as any)
    .update({ atelier_active: active })
    .eq("id", studentId);
}
