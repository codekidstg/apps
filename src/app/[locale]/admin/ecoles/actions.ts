"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createSchool(formData: FormData) {
  const supabase = await createClient();
  const { error } = await (supabase.from("schools") as any).insert({
    name:    formData.get("name") as string,
    city:    formData.get("city") as string || null,
    country: (formData.get("country") as string) || "Togo",
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/ecoles");
  return { success: true };
}

export async function updateSchool(id: string, formData: FormData) {
  const supabase = await createClient();
  const { error } = await (supabase.from("schools") as any).update({
    name:    formData.get("name") as string,
    city:    formData.get("city") as string || null,
    country: (formData.get("country") as string) || "Togo",
  }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/ecoles");
  return { success: true };
}
