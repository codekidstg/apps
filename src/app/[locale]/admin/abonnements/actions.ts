"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function assertAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non connecté");
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (profile?.role !== "admin") throw new Error("Accès refusé");
}

export async function upsertPlan(formData: FormData) {
  await assertAdmin();
  const admin = createAdminClient();

  const id            = formData.get("id") as string | null;
  const name          = (formData.get("name") as string).trim();
  const plan_type     = formData.get("plan_type") as string;
  const billing_cycle = formData.get("billing_cycle") as string;
  const price_fcfa    = parseInt(formData.get("price_fcfa") as string, 10);
  const active        = formData.get("active") === "true";
  const featuresRaw   = (formData.get("features") as string).trim();
  const features      = featuresRaw.split("\n").map((f) => f.trim()).filter(Boolean);

  const payload = { name, plan_type, billing_cycle, price_fcfa, active, features };

  if (id) {
    await (admin.from("subscription_plans") as any).update(payload).eq("id", id);
  } else {
    await (admin.from("subscription_plans") as any).insert(payload);
  }

  revalidatePath("/fr/admin/abonnements");
  revalidatePath("/fr/suivi/abonnement");
}

export async function deletePlan(id: string) {
  await assertAdmin();
  const admin = createAdminClient();
  await (admin.from("subscription_plans") as any).delete().eq("id", id);
  revalidatePath("/fr/admin/abonnements");
  revalidatePath("/fr/suivi/abonnement");
}

export async function togglePlan(id: string, active: boolean) {
  await assertAdmin();
  const admin = createAdminClient();
  await (admin.from("subscription_plans") as any).update({ active }).eq("id", id);
  revalidatePath("/fr/admin/abonnements");
  revalidatePath("/fr/suivi/abonnement");
}
