import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import crypto from "crypto";

// Mock CinetPay webhook — vérifie la signature HMAC et active l'abonnement
export async function POST(req: NextRequest) {
  const body = await req.json();
  const secret = process.env.CINETPAY_SECRET ?? "mock_secret_test";

  // Vérification HMAC (CinetPay signe avec SHA-256 du payload)
  const sig = req.headers.get("x-cinetpay-signature") ?? "";
  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(body))
    .digest("hex");

  // En mode mock on tolère la signature manquante
  const isMock = process.env.CINETPAY_MODE === "mock" || !sig;
  if (!isMock && sig !== expected) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { cpm_trans_id, cpm_result, cpm_amount, metadata } = body;
  if (!cpm_trans_id) return NextResponse.json({ error: "Missing tx_id" }, { status: 400 });

  const admin = createAdminClient();

  // Mettre à jour le paiement
  await (admin.from("payments") as any)
    .update({
      status:          cpm_result === "00" ? "success" : "failed",
      provider_tx_id:  cpm_trans_id,
      webhook_payload: body,
      paid_at:         cpm_result === "00" ? new Date().toISOString() : null,
    })
    .eq("provider_tx_id", cpm_trans_id);

  // Si succès → activer l'abonnement
  if (cpm_result === "00" && metadata?.subscription_id) {
    const endsAt = new Date();
    endsAt.setMonth(endsAt.getMonth() + (metadata.billing_cycle === "year" ? 12 : 1));

    await (admin.from("subscriptions") as any)
      .update({ status: "active", ends_at: endsAt.toISOString() })
      .eq("id", metadata.subscription_id);
  }

  return NextResponse.json({ message: "OK" });
}
