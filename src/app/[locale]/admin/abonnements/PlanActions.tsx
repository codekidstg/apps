"use client";

import { useState, useTransition } from "react";
import { deletePlan, togglePlan } from "./actions";
import PlanForm from "./PlanForm";

type Plan = {
  id: string;
  name: string;
  plan_type: string;
  billing_cycle: string;
  price_fcfa: number;
  active: boolean;
  features: string[];
};

export function EditPlanButton({ plan }: { plan: Plan }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
      >
        Modifier
      </button>
      {open && <PlanForm plan={plan} onClose={() => setOpen(false)} />}
    </>
  );
}

export function TogglePlanButton({ id, active }: { id: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => togglePlan(id, !active))}
      className={`text-xs font-bold px-2.5 py-1 rounded-full transition-colors ${
        active
          ? "bg-emerald-900/60 text-emerald-300 hover:bg-red-900/60 hover:text-red-300"
          : "bg-slate-700 text-slate-400 hover:bg-emerald-900/60 hover:text-emerald-300"
      }`}
    >
      {pending ? "…" : active ? "● Actif" : "○ Inactif"}
    </button>
  );
}

export function DeletePlanButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [confirm, setConfirm] = useState(false);

  if (confirm) {
    return (
      <span className="flex items-center gap-2">
        <span className="text-xs text-red-400">Confirmer ?</span>
        <button
          disabled={pending}
          onClick={() => startTransition(() => deletePlan(id))}
          className="text-xs font-bold text-red-400 hover:text-red-300"
        >
          {pending ? "…" : "Oui"}
        </button>
        <button onClick={() => setConfirm(false)} className="text-xs text-slate-500 hover:text-white">
          Non
        </button>
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirm(true)}
      className="text-xs font-bold text-slate-500 hover:text-red-400 transition-colors"
    >
      Supprimer
    </button>
  );
}

export function NewPlanButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
      >
        + Nouveau plan
      </button>
      {open && <PlanForm onClose={() => setOpen(false)} />}
    </>
  );
}
