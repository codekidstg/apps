"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function validateCertificate(certId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  const role = user.app_metadata?.role;
  if (!["admin", "teacher"].includes(role)) return { error: "Non autorisé" };

  const admin = createAdminClient();
  const { error } = await (admin.from("certificates") as any).update({
    validated_by: user.id,
    validated_at: new Date().toISOString(),
  }).eq("id", certId);

  if (error) return { error: error.message };
  revalidatePath("/prof/certificats");
  return { success: true };
}
