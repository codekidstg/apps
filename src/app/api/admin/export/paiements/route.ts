import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminClient();
  const { data: payments } = await (admin.from("payments") as any)
    .select("id, status, amount_fcfa, provider, provider_tx_id, paid_at, created_at, profiles!payments_parent_id_fkey(display_name)")
    .order("created_at", { ascending: false });

  const rows = [
    ["ID", "Parent", "Montant (FCFA)", "Provider", "Référence", "Statut", "Payé le", "Créé le"],
    ...(payments ?? []).map((p: any) => [
      p.id,
      p.profiles?.display_name ?? "",
      p.amount_fcfa ?? "",
      p.provider ?? "",
      p.provider_tx_id ?? "",
      p.status ?? "",
      p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-FR") : "",
      p.created_at ? new Date(p.created_at).toLocaleDateString("fr-FR") : "",
    ]),
  ];

  const csv = rows.map((r) => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codekids-paiements-${date}.csv"`,
    },
  });
}
