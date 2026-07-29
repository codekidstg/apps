import { redirect } from "next/navigation";

// Simule la page de retour CinetPay après paiement (sandbox uniquement)
export default async function MockRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ tx?: string; payload?: string; sig?: string }>;
}) {
  const sp = await searchParams;
  const { tx, payload, sig } = sp;

  if (!tx || !payload) redirect("/fr/suivi/abonnement");

  // Appel au webhook interne pour activer l'abonnement
  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const body = JSON.parse(decodeURIComponent(payload));
    await fetch(`${origin}/api/webhooks/cinetpay`, {
      method:  "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sig ? { "x-cinetpay-signature": sig } : {}),
      },
      body: JSON.stringify(body),
    });
  } catch (_) {
    // webhook failure non bloquant
  }

  redirect("/fr/suivi/abonnement?payment=success");
}
