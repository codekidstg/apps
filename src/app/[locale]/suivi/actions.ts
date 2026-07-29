"use server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import crypto from "crypto";

// ── Consentement parental ────────────────────────────────────
export async function saveConsent(studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  const hdrs = await headers();
  const ip = hdrs.get("x-forwarded-for") ?? hdrs.get("x-real-ip") ?? "unknown";
  const ua = hdrs.get("user-agent") ?? "";

  await (supabase.from("parental_consents") as any).upsert({
    parent_id:  user.id,
    student_id: studentId,
    version:    "v1",
    consented_at: new Date().toISOString(),
    ip,
    user_agent: ua,
  }, { onConflict: "parent_id,student_id,version" });

  revalidatePath("/suivi");
  return { success: true };
}

// ── Initier un paiement CinetPay (mock) ─────────────────────
export async function initCinetpayPayment(planId: string, studentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  const { data: plan } = await (supabase.from("subscription_plans") as any)
    .select("*").eq("id", planId).single();
  if (!plan) return { error: "Plan introuvable" };

  const admin = createAdminClient();
  const txId = `MOCK-${Date.now()}`;

  // Créer l'abonnement en attente
  const { data: sub } = await (admin.from("subscriptions") as any)
    .insert({
      parent_id: user.id,
      student_id: studentId,
      plan_id: planId,
      status: "trial",
      provider: "cinetpay",
    })
    .select("id").single();

  // Créer le paiement en attente
  await (admin.from("payments") as any).insert({
    subscription_id: sub.id,
    parent_id:       user.id,
    amount_fcfa:     plan.price_fcfa,
    provider:        "cinetpay",
    provider_tx_id:  txId,
    status:          "pending",
  });

  // En mode mock : simuler un payment_url CinetPay
  const mockPayload = {
    cpm_trans_id: txId,
    cpm_result:   "00",
    cpm_amount:   plan.price_fcfa,
    metadata: { subscription_id: sub.id, billing_cycle: plan.billing_cycle },
  };
  const secret = process.env.CINETPAY_SECRET ?? "mock_secret_test";
  const sig = crypto.createHmac("sha256", secret).update(JSON.stringify(mockPayload)).digest("hex");

  // URL de simulation (route interne)
  const mockUrl = `/fr/suivi/paiement/mock-redirect?tx=${txId}&payload=${encodeURIComponent(JSON.stringify(mockPayload))}&sig=${sig}`;

  return { paymentUrl: mockUrl, txId, subscriptionId: sub.id };
}

// ── Paiement espèces ─────────────────────────────────────────
export async function submitCashPayment(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  const planId    = formData.get("plan_id") as string;
  const studentId = formData.get("student_id") as string;
  const cashDate  = formData.get("cash_date") as string;
  const cashRef   = formData.get("cash_ref") as string;
  const cashNote  = formData.get("cash_note") as string;

  const { data: plan } = await (supabase.from("subscription_plans") as any)
    .select("*").eq("id", planId).single();
  if (!plan) return { error: "Plan introuvable" };

  const admin = createAdminClient();

  const { data: sub } = await (admin.from("subscriptions") as any)
    .insert({
      parent_id: user.id,
      student_id: studentId,
      plan_id:  planId,
      status:   "trial",
      provider: "cash",
    })
    .select("id").single();

  await (admin.from("payments") as any).insert({
    subscription_id: sub.id,
    parent_id:       user.id,
    amount_fcfa:     plan.price_fcfa,
    provider:        "cash",
    status:          "pending",
    cash_date:       cashDate || null,
    cash_ref:        cashRef  || null,
    cash_note:       cashNote || null,
  });

  revalidatePath("/suivi/abonnement");
  return { success: true };
}

// ── Validation paiement espèces (admin) ─────────────────────
export async function validateCashPayment(paymentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non connecté" };

  const admin = createAdminClient();

  const { data: payment } = await (admin.from("payments") as any)
    .select("*, subscriptions(plan_id)")
    .eq("id", paymentId).single();
  if (!payment) return { error: "Paiement introuvable" };

  const { data: plan } = await (admin.from("subscription_plans") as any)
    .select("billing_cycle").eq("id", payment.subscriptions.plan_id).single();

  const endsAt = new Date();
  endsAt.setMonth(endsAt.getMonth() + (plan?.billing_cycle === "year" ? 12 : 1));

  await (admin.from("payments") as any).update({
    status:            "success",
    cash_validated_by: user.id,
    cash_validated_at: new Date().toISOString(),
    paid_at:           new Date().toISOString(),
  }).eq("id", paymentId);

  await (admin.from("subscriptions") as any).update({
    status:   "active",
    ends_at:  endsAt.toISOString(),
  }).eq("id", payment.subscription_id);

  revalidatePath("/admin/paiements");
  return { success: true };
}
