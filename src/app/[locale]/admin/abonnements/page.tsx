import { createAdminClient } from "@/lib/supabase/admin";
import { EditPlanButton, TogglePlanButton, DeletePlanButton, NewPlanButton } from "./PlanActions";

export default async function AbonnementsAdminPage() {
  const admin = createAdminClient();
  const { data: plans } = await (admin.from("subscription_plans") as any)
    .select("*")
    .order("price_fcfa");

  const allPlans = (plans ?? []) as any[];
  const actifs   = allPlans.filter((p) => p.active).length;

  const typeBadge: Record<string, string> = {
    freemium: "bg-slate-600 text-slate-200",
    premium:  "bg-amber-700/80 text-amber-200",
    b2b:      "bg-violet-700/80 text-violet-200",
  };
  const cycleLabel: Record<string, string> = {
    month:    "/ mois",
    year:     "/ an",
    lifetime: "unique",
  };

  return (
    <div className="max-w-3xl space-y-8">

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white">Plans d'abonnement</h1>
          <p className="text-slate-400 text-sm mt-1">
            {actifs} plan{actifs > 1 ? "s" : ""} actif{actifs > 1 ? "s" : ""} visible{actifs > 1 ? "s" : ""} par les parents
          </p>
        </div>
        <NewPlanButton />
      </div>

      {/* Cartes */}
      <div className="space-y-4">
        {allPlans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-slate-800 border rounded-2xl p-6 transition-opacity ${
              plan.active ? "border-slate-700" : "border-slate-800 opacity-50"
            }`}
          >
            <div className="flex items-start justify-between gap-4">

              {/* Infos principales */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2.5 mb-3 flex-wrap">
                  <span className="font-black text-white text-lg">{plan.name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${typeBadge[plan.plan_type] ?? "bg-slate-600 text-slate-200"}`}>
                    {plan.plan_type}
                  </span>
                  <span className="text-xs text-slate-500 font-mono">{plan.id.slice(0, 8)}</span>
                </div>

                {/* Fonctionnalités */}
                <div className="flex flex-wrap gap-2">
                  {(plan.features as string[]).map((f: string) => (
                    <span key={f} className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg">
                      ✓ {f}
                    </span>
                  ))}
                </div>
              </div>

              {/* Prix + cycle */}
              <div className="text-right shrink-0">
                {plan.price_fcfa === 0 ? (
                  <div className="text-2xl font-black text-emerald-400">Gratuit</div>
                ) : (
                  <>
                    <div className="text-2xl font-black text-white">
                      {plan.price_fcfa.toLocaleString("fr-FR")}
                      <span className="text-sm font-bold text-slate-400"> FCFA</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">{cycleLabel[plan.billing_cycle] ?? plan.billing_cycle}</div>
                  </>
                )}
              </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between mt-5 pt-4 border-t border-slate-700">
              <TogglePlanButton id={plan.id} active={plan.active} />
              <div className="flex items-center gap-5">
                <EditPlanButton plan={plan} />
                <DeletePlanButton id={plan.id} />
              </div>
            </div>
          </div>
        ))}

        {allPlans.length === 0 && (
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-12 text-center">
            <div className="text-3xl mb-3">📦</div>
            <div className="font-bold text-white mb-1">Aucun plan configuré</div>
            <div className="text-sm text-slate-400">Créez votre premier plan d'abonnement.</div>
          </div>
        )}
      </div>

      <p className="text-xs text-slate-500">
        Les plans inactifs ne sont pas visibles par les parents. La suppression d'un plan n'affecte pas les abonnements existants.
      </p>
    </div>
  );
}
