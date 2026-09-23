import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import ValidateCashButton from "./ValidateCashButton";

/** Combien de lignes d'historique s'affichent d'un coup. */
const LOT = 25;

const CHAMPS = "*, profiles!payments_parent_id_fkey(display_name), subscriptions(subscription_plans(name))";

export default async function PaiementsPage({ searchParams }: { searchParams: Promise<{ voir?: string }> }) {
  const { voir } = await searchParams;
  const supabase = await createClient();
  const montrees = Math.max(LOT, Number(voir) || LOT);

  // Ce qui attend une validation est chargé en entier : un paiement espèces
  // qu'on ne voit pas est un parent qui a payé sans que personne ne le sache.
  // L'historique, lui, ne cesse de grandir — il vient par lots.
  const [enAttente, historique] = await Promise.all([
    (supabase.from("payments") as any)
      .select(CHAMPS)
      .eq("provider", "cash").eq("status", "pending")
      .order("created_at", { ascending: false }),
    (supabase.from("payments") as any)
      .select(CHAMPS, { count: "exact" })
      .neq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(montrees),
  ]);

  const pending = (enAttente.data ?? []) as any[];
  const history = (historique.data ?? []) as any[];
  const encore  = Math.max(0, (historique.count ?? 0) - history.length);

  return (
    <div>
      <PageHeader
        title="Paiements"
        subtitle={`${(historique.count ?? 0) + pending.length} paiement${(historique.count ?? 0) + pending.length > 1 ? "s" : ""} au total`}
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
            Historique des paiements ({history.length}{encore > 0 ? ` sur ${history.length + encore}` : ""})
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

          {encore > 0 && (
            <div className="text-center mt-4">
              <Link href={`/admin/paiements?voir=${montrees + LOT}`}
                className="inline-block text-sm font-black px-5 py-2.5 rounded-xl border border-stone-200 bg-white hover:border-brand-orange transition-colors"
                style={{ color: "#1B2D5E" }}>
                Voir plus — {encore} paiement{encore > 1 ? "s" : ""} encore
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
