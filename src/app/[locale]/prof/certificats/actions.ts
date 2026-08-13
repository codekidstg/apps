"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

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

  // Notifie le parent via push si des subscriptions existent
  try {
    const { data: cert } = await (admin.from("certificates") as any)
      .select("student_id, students(profile_id, profiles!students_profile_id_fkey(display_name)), parent_children(parent_id)")
      .eq("id", certId)
      .single();

    const studentName = cert?.students?.profiles?.display_name ?? "votre enfant";
    const parentIds: string[] = (cert?.parent_children ?? []).map((pc: any) => pc.parent_id);

    for (const parentId of parentIds) {
      const { data: subs } = await (admin.from("push_subscriptions") as any)
        .select("subscription")
        .eq("user_id", parentId);
      for (const { subscription } of subs ?? []) {
        await sendPushNotification(subscription, {
          title: "🎓 Certificat validé !",
          body:  `Le professeur a validé le certificat de ${studentName}. Vous pouvez le télécharger.`,
          icon:  "/icons/icon-192.png",
          url:   "/fr/suivi/certificats",
          tag:   `cert-${certId}`,
        });
      }
    }
  } catch {
    // Erreur push non bloquante
  }

  revalidatePath("/prof/certificats");
  return { success: true };
}
