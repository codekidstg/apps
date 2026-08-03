import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PaiementForm from "./PaiementForm";

export default async function AbonnementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: links } = await (supabase.from("parent_children") as any)
    .select("student_id, students(id, profiles!students_profile_id_fkey(display_name))")
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => ({
    id: l.students?.id, name: l.students?.profiles?.display_name ?? "Enfant",
  })).filter((c: any) => c.id);

  const { data: plans } = await (supabase.from("subscription_plans") as any)
    .select("*")
    .eq("active", true)
    .neq("plan_type", "b2b")
    .order("price_fcfa");

  const { data: activeSubs } = await (supabase.from("subscriptions") as any)
    .select("*, subscription_plans(name)")
    .eq("parent_id", user.id)
    .order("created_at", { ascending: false });

  // Paiements espèces en attente
  const { data: pendingPayments } = await (supabase.from("payments") as any)
    .select("id, amount_fcfa, status, cash_ref, cash_date, created_at")
    .eq("parent_id", user.id)
    .eq("provider", "cash")
    .eq("status", "pending");

  return (
    <div className="max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Abonnement</h1>
        <p className="text-slate-400 text-sm">Gérez l'accès Premium de votre enfant.</p>
      </div>

      {/* Abonnements actifs */}
      {(activeSubs ?? []).filter((s: any) => s.status === "active").length > 0 && (
        <div className="bg-emerald-900/30 border border-emerald-800 rounded-2xl p-5 space-y-2">
          <div className="font-black text-emerald-300">✅ Abonnement actif</div>
          {(activeSubs ?? []).filter((s: any) => s.status === "active").map((s: any) => (
            <div key={s.id} className="text-sm text-emerald-400">
              {s.subscription_plans?.name} — expire le{" "}
              {s.ends_at ? new Date(s.ends_at).toLocaleDateString("fr-FR") : "—"}
            </div>
          ))}
        </div>
      )}

      {/* Paiements espèces en attente */}
      {(pendingPayments ?? []).length > 0 && (
        <div className="bg-amber-900/30 border border-amber-800 rounded-2xl p-5">
          <div className="font-black text-amber-300 mb-2">⏳ Paiement en attente de validation</div>
          {(pendingPayments ?? []).map((p: any) => (
            <div key={p.id} className="text-sm text-amber-400">
              {p.amount_fcfa.toLocaleString("fr-FR")} FCFA — Réf. {p.cash_ref ?? "—"} —
              soumis le {new Date(p.created_at).toLocaleDateString("fr-FR")}
            </div>
          ))}
          <p className="text-xs text-amber-500 mt-2">L'administrateur validera votre paiement sous 24h.</p>
        </div>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-lg font-black text-white mb-4">Choisir un plan</h2>
        <div className="grid gap-4">
          {(plans ?? []).map((plan: any) => (
            <div key={plan.id} className={`bg-slate-800/60 border rounded-2xl p-5 ${plan.plan_type === "premium" && plan.billing_cycle === "year" ? "border-amber-600" : "border-slate-700"}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-black text-white">{plan.name}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {plan.billing_cycle === "year" ? "Facturation annuelle" : "Facturation mensuelle"}
                    {plan.billing_cycle === "year" && <span className="text-amber-400 ml-2">★ Meilleur prix</span>}
                  </div>
                </div>
                <div className="text-right">
                  {plan.price_fcfa === 0 ? (
                    <div className="text-2xl font-black text-emerald-400">Gratuit</div>
                  ) : (
                    <>
                      <div className="text-2xl font-black text-white">{plan.price_fcfa.toLocaleString("fr-FR")}</div>
                      <div className="text-xs text-slate-400">FCFA / {plan.billing_cycle === "year" ? "an" : "mois"}</div>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-4">
                {(plan.features as string[]).map((f: string) => (
                  <span key={f} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">✓ {f}</span>
                ))}
              </div>
              {plan.price_fcfa > 0 && children.length > 0 && (
                <PaiementForm plan={plan} studentId={children[0].id} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
