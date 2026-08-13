import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import ValidateCashButton from "./ValidateCashButton";

export default async function PaiementsPage() {
  const supabase = await createClient();

  const { data: payments } = await (supabase.from("payments") as any)
    .select("*, profiles!payments_parent_id_fkey(display_name), subscriptions(subscription_plans(name))")
    .order("created_at", { ascending: false });

  const pending  = (payments ?? []).filter((p: any) => p.provider === "cash" && p.status === "pending");
  const history  = (payments ?? []).filter((p: any) => p.status !== "pending");

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle={`${payments?.length ?? 0} paiements au total`}
        actions={
          <a
            href="/api/admin/export/paiements"
            download
            className="flex items-center gap-1.5 text-sm font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
          >
            ⬇ CSV
          </a>
        }
      />

      <div className="p-8 space-y-8 max-w-5xl">
        {/* Espèces en attente */}
        {pending.length > 0 && (
          <div>
            <h2 className="text-sm font-black text-ink-light uppercase tracking-widest mb-4">
              ⏳ Paiements espèces à valider ({pending.length})
            </h2>
            <div className="space-y-3">
              {pending.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
                  <div>
                    <div className="font-black text-ink">
                      {p.profiles?.display_name ?? "Parent"} — {p.subscriptions?.subscription_plans?.name ?? "Plan"}
                    </div>
                    <div className="text-xs text-ink-muted mt-1">
                      {p.amount_fcfa?.toLocaleString("fr-FR")} FCFA · Réf. {p.cash_ref ?? "—"} ·
                      Date déclarée : {p.cash_date ?? "—"} ·
                      Soumis le {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </div>
                    {p.cash_note && (
                      <div className="text-xs text-ink-muted italic mt-0.5">Note : {p.cash_note}</div>
                    )}
                  </div>
                  <ValidateCashButton paymentId={p.id} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Historique */}
        <div>
          <h2 className="text-sm font-black text-ink-light uppercase tracking-widest mb-4">
            Historique des paiements
          </h2>
          <div className="bg-white border border-stone-100 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-cream border-b border-stone-100">
                <tr>
                  {["Parent","Plan","Montant","Méthode","Statut","Date"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-black text-ink-light">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {history.map((p: any) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-bold text-ink">{p.profiles?.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-ink-muted">{p.subscriptions?.subscription_plans?.name ?? "—"}</td>
                    <td className="px-4 py-3 font-bold">{p.amount_fcfa?.toLocaleString("fr-FR")} FCFA</td>
                    <td className="px-4 py-3 text-ink-muted capitalize">{p.provider}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        p.status === "success" ? "bg-emerald-100 text-emerald-700" :
                        p.status === "failed"  ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-muted text-xs">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))}
                {!history.length && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-ink-muted">Aucun paiement</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
