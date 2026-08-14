"use client";

import { useState, useTransition } from "react";
import {
  addTreasuryExpense,
  deleteTreasuryExpense,
  addTreasuryIncome,
  deleteTreasuryIncome,
} from "@/lib/compta/treasury";
import type { TreasuryData } from "@/lib/compta/treasury";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " ₣";
}

function DateChip({ date }: { date: string }) {
  const d = new Date(date + "T00:00:00");
  const day = d.getDate().toString().padStart(2, "0");
  const mon = d.toLocaleDateString("fr-FR", { month: "short" });
  return (
    <div className="text-center shrink-0 w-12">
      <div className="text-[10px] font-black text-gray-400 uppercase leading-none">{mon}</div>
      <div className="text-base font-black text-gray-700 leading-tight">{day}</div>
    </div>
  );
}

// ── Add form ──────────────────────────────────────────────────────────────────
function AddForm({
  type,
  onClose,
}: {
  type: "expense" | "income";
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const fn = type === "expense" ? addTreasuryExpense : addTreasuryIncome;
      const res = await fn(fd);
      if (!res.error) { onClose(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border-t border-gray-100 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Libellé</label>
          <input
            name="label"
            required
            placeholder={type === "expense" ? "ex : Loyer bureau" : "ex : Subvention ONG"}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Montant (FCFA)</label>
          <input
            name="amount"
            type="number"
            min="1"
            required
            placeholder="50000"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Date</label>
          <input
            name="date"
            type="date"
            defaultValue={today}
            required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800"
          />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onClose}
          className="px-4 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
          Annuler
        </button>
        <button type="submit" disabled={pending}
          className={`px-4 py-2 rounded-xl text-xs font-black text-white transition-opacity ${type === "expense" ? "bg-red-500" : "bg-emerald-500"} ${pending ? "opacity-50" : "hover:opacity-90"}`}>
          {pending ? "…" : type === "expense" ? "Enregistrer la dépense" : "Enregistrer l'entrée"}
        </button>
      </div>
    </form>
  );
}

// ── Delete button ─────────────────────────────────────────────────────────────
function DelBtn({ id, type }: { id: string; type: "expense" | "income" }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => {
        const fn = type === "expense" ? deleteTreasuryExpense : deleteTreasuryIncome;
        await fn(id);
        router.refresh();
      })}
      className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
      title="Supprimer"
    >
      {pending ? "…" : "×"}
    </button>
  );
}

// ── Preset bar ────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Ce mois",   months: 0 },
  { label: "3 mois",    months: 3 },
  { label: "6 mois",    months: 6 },
  { label: "Année",     months: 12 },
] as const;

interface Props {
  data: TreasuryData;
  from: string;
  to: string;
}

export default function TresorerieClient({ data, from, to }: Props) {
  const router = useRouter();
  const [showExpForm, setShowExpForm] = useState(false);
  const [showIncForm, setShowIncForm] = useState(false);
  const [dateFrom, setDateFrom] = useState(from);
  const [dateTo,   setDateTo]   = useState(to);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  function applyRange(f: string, t: string, preset?: string) {
    setDateFrom(f);
    setDateTo(t);
    setActivePreset(preset ?? null);
    router.push(`?from=${f}&to=${t}`);
  }

  function applyPreset(months: number, label: string) {
    const now = new Date();
    const t = now.toISOString().slice(0, 10);
    let f: string;
    if (months === 0) {
      f = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    } else if (months === 12) {
      f = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    } else {
      const d = new Date(now);
      d.setMonth(d.getMonth() - months);
      f = d.toISOString().slice(0, 10);
    }
    applyRange(f, t, label);
  }

  const balancePositive = data.balance >= 0;

  return (
    <div className="space-y-6">

      {/* ── Période ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Période</span>

        {/* Presets */}
        <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
          {PRESETS.map((p) => (
            <button key={p.label}
              onClick={() => applyPreset(p.months, p.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                activePreset === p.label ? "bg-brand-navy text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}>
              {p.label}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-gray-100" />

        {/* Custom range */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black text-gray-300 uppercase">Du</span>
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setActivePreset(null); }}
              className="bg-transparent text-sm font-black text-gray-700 outline-none" />
          </div>
          <span className="text-gray-300 font-bold">→</span>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black text-gray-300 uppercase">Au</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setActivePreset(null); }}
              className="bg-transparent text-sm font-black text-gray-700 outline-none" />
          </div>
          <button onClick={() => applyRange(dateFrom, dateTo)}
            className="px-4 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-black hover:opacity-90 transition-opacity">
            Calculer
          </button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-3 gap-4">
        {/* Entrées */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-t-4" style={{ borderTopColor: "#10B981" }}>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">↑ Entrées</div>
          <div className="text-3xl font-black text-emerald-600" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmt(data.totalIn)}
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold">Parents + autres recettes</div>
        </div>

        {/* Sorties */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 border-t-4" style={{ borderTopColor: "#EF4444" }}>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">↓ Sorties</div>
          <div className="text-3xl font-black text-red-500" style={{ fontVariantNumeric: "tabular-nums" }}>
            {fmt(data.totalOut)}
          </div>
          <div className="text-xs text-gray-400 mt-1 font-semibold">Mentors + autres dépenses</div>
        </div>

        {/* Solde */}
        <div className="bg-brand-navy rounded-2xl shadow-sm p-5 border-t-4" style={{ borderTopColor: "#FDB813" }}>
          <div className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-1">= Solde net</div>
          <div className={`text-3xl font-black ${balancePositive ? "text-yellow-300" : "text-red-300"}`} style={{ fontVariantNumeric: "tabular-nums" }}>
            {balancePositive ? "+" : ""}{fmt(data.balance)}
          </div>
          <div className="text-xs text-white/40 mt-1 font-semibold">
            {balancePositive ? "✓ Excédent" : "⚠ Déficit"}
          </div>
        </div>
      </div>

      {/* ── Deux colonnes ── */}
      <div className="grid grid-cols-2 gap-5">

        {/* ── SORTIES ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-black text-gray-900 text-sm flex items-center gap-2">🔴 Décaissements</span>
            <span className="font-black text-red-500 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(data.totalOut)}</span>
          </div>

          {/* Auto: mentors */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Calculé automatiquement</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                Paie mentors (séances validées)
                <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">AUTO</span>
              </span>
              <span className="font-black text-gray-700 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(data.mentorsPaid)}</span>
            </div>
          </div>

          {/* Manuel: dépenses */}
          <div>
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Autres dépenses</span>
              <button onClick={() => setShowExpForm(v => !v)}
                className="text-[11px] font-black text-gray-400 border border-dashed border-gray-200 px-2.5 py-1 rounded-lg hover:border-red-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                ＋ Ajouter
              </button>
            </div>

            {data.expenses.length === 0 && !showExpForm && (
              <div className="px-5 py-6 text-center text-gray-400 text-xs font-semibold">Aucune dépense manuelle</div>
            )}

            {data.expenses.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                <DateChip date={e.expense_date} />
                <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{e.label}</span>
                <span className="font-black text-red-500 text-sm shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                  −{fmt(e.amount_fcfa)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DelBtn id={e.id} type="expense" />
                </div>
              </div>
            ))}

            {showExpForm && <AddForm type="expense" onClose={() => setShowExpForm(false)} />}
          </div>
        </div>

        {/* ── ENTRÉES ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <span className="font-black text-gray-900 text-sm flex items-center gap-2">🟢 Encaissements</span>
            <span className="font-black text-emerald-600 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(data.totalIn)}</span>
          </div>

          {/* Auto: parents */}
          <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-2">Calculé automatiquement</div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 font-semibold flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 shrink-0" />
                Paiements parents (séances facturées)
                <span className="text-[9px] font-black bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded">AUTO</span>
              </span>
              <span className="font-black text-gray-700 text-sm" style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(data.parentsPaid)}</span>
            </div>
          </div>

          {/* Manuel: recettes */}
          <div>
            <div className="flex items-center justify-between px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Autres entrées</span>
              <button onClick={() => setShowIncForm(v => !v)}
                className="text-[11px] font-black text-gray-400 border border-dashed border-gray-200 px-2.5 py-1 rounded-lg hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50 transition-colors">
                ＋ Ajouter
              </button>
            </div>

            {data.incomes.length === 0 && !showIncForm && (
              <div className="px-5 py-6 text-center text-gray-400 text-xs font-semibold">Aucune recette manuelle</div>
            )}

            {data.incomes.map((inc) => (
              <div key={inc.id} className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                <DateChip date={inc.income_date} />
                <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{inc.label}</span>
                <span className="font-black text-emerald-600 text-sm shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>
                  +{fmt(inc.amount_fcfa)}
                </span>
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <DelBtn id={inc.id} type="income" />
                </div>
              </div>
            ))}

            {showIncForm && <AddForm type="income" onClose={() => setShowIncForm(false)} />}
          </div>
        </div>

      </div>

      {/* ── Note ── */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-semibold">
        <span className="shrink-0">ℹ️</span>
        <span>
          Les montants <strong>AUTO</strong> sont calculés depuis les tables Compta (séances validées / paiements confirmés) sur l'intervalle sélectionné.
          Les entrées et dépenses manuelles sont filtrées par leur date.
        </span>
      </div>

    </div>
  );
}
