"use client";

import { useRef, useState, useTransition } from "react";
import { upsertPlan } from "./actions";

type Plan = {
  id: string;
  name: string;
  plan_type: string;
  billing_cycle: string;
  price_fcfa: number;
  active: boolean;
  features: string[];
};

type Props = { plan?: Plan; onClose: () => void };

export default function PlanForm({ plan, onClose }: Props) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    setError(null);
    startTransition(async () => {
      try {
        await upsertPlan(fd);
        onClose();
      } catch (err: any) {
        setError(err.message ?? "Erreur");
      }
    });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="font-black text-white">{plan ? "Modifier le plan" : "Nouveau plan"}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">✕</button>
        </div>
        <form ref={formRef} onSubmit={handleSubmit} className="p-6 space-y-4">
          {plan && <input type="hidden" name="id" value={plan.id} />}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Nom du plan</label>
            <input
              name="name" required
              defaultValue={plan?.name ?? ""}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              placeholder="ex: Premium Mensuel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Type</label>
              <select
                name="plan_type"
                defaultValue={plan?.plan_type ?? "premium"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="free">Gratuit</option>
                <option value="premium">Premium</option>
                <option value="b2b">B2B</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1.5">Cycle</label>
              <select
                name="billing_cycle"
                defaultValue={plan?.billing_cycle ?? "month"}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="month">Mensuel</option>
                <option value="year">Annuel</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">Prix (FCFA)</label>
            <input
              name="price_fcfa" type="number" min="0" required
              defaultValue={plan?.price_fcfa ?? 0}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1.5">
              Fonctionnalités <span className="text-slate-500 font-normal">(une par ligne)</span>
            </label>
            <textarea
              name="features" rows={4}
              defaultValue={(plan?.features ?? []).join("\n")}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-blue-500 resize-none"
              placeholder={"Tout le contenu débloqué\nBadges premium\nCertificats PDF"}
            />
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs font-bold text-slate-400">Statut</label>
            <select
              name="active"
              defaultValue={plan ? String(plan.active) : "true"}
              className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={pending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
            >
              {pending ? "Enregistrement…" : plan ? "Mettre à jour" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
