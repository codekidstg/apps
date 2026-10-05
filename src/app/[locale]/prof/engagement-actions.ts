"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERSION_ENGAGEMENT } from "@/lib/prof/engagement";

/**
 * L'acceptation du mentor.
 *
 * L'adresse et le navigateur sont conservés avec la date : sans eux, une
 * acceptation en ligne n'est qu'une ligne dans une base, et une ligne dans une
 * base se conteste. Ils ne servent à rien d'autre.
 */
export async function accepterEngagement(): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Reconnectez-vous pour continuer." };

  const { data: profil } = await supabase
    .from("profiles").select("role").eq("id", user.id).maybeSingle<{ role: string }>();
  if (profil?.role !== "teacher") return { error: "Cette page ne vous concerne pas." };

  const entetes = await headers();
  // Derrière Vercel, l'adresse du visiteur est le premier maillon de la chaîne.
  const ip = (entetes.get("x-forwarded-for") ?? "").split(",")[0].trim() || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin.from("engagements_mentors").upsert({
    teacher_id: user.id,
    version: VERSION_ENGAGEMENT,
    accepte_le: new Date().toISOString(),
    adresse_ip: ip,
    navigateur: entetes.get("user-agent")?.slice(0, 400) ?? null,
  }, { onConflict: "teacher_id" });

  if (error) {
    console.error("[engagement] acceptation :", error.message);
    return { error: "Votre acceptation n'a pas pu être enregistrée. Réessayez dans un instant." };
  }

  revalidatePath("/fr/prof", "layout");
  return { ok: true };
}
