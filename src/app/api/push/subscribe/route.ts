import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Enregistre ou met à jour la subscription push d'un utilisateur
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const subscription = await req.json();
  if (!subscription?.endpoint) {
    return NextResponse.json({ error: "Subscription invalide" }, { status: 400 });
  }

  const admin = createAdminClient();
  await (admin.from("push_subscriptions") as any).upsert(
    {
      user_id:      user.id,
      endpoint:     subscription.endpoint,
      subscription: subscription,
      updated_at:   new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { endpoint } = await req.json();
  const admin = createAdminClient();
  await (admin.from("push_subscriptions") as any).delete().eq("endpoint", endpoint);

  return NextResponse.json({ ok: true });
}
