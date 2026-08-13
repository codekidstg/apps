import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification, type PushPayload } from "@/lib/push";

// Envoie une notification push à un utilisateur spécifique (usage interne admin/serveur)
export async function POST(req: NextRequest) {
  // Réservé aux appels serveur internes authentifiés par service role
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`) {
    // Sinon vérifie que c'est un admin connecté
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const { userId, payload } = await req.json() as { userId: string; payload: PushPayload };

  const admin = createAdminClient();
  const { data: subs } = await (admin.from("push_subscriptions") as any)
    .select("subscription")
    .eq("user_id", userId);

  let sent = 0;
  let expired = 0;
  for (const { subscription } of subs ?? []) {
    const ok = await sendPushNotification(subscription, payload);
    if (ok) sent++;
    else {
      expired++;
      // Nettoie les subscriptions expirées
      await (admin.from("push_subscriptions") as any).delete().eq("endpoint", subscription.endpoint);
    }
  }

  return NextResponse.json({ sent, expired });
}
