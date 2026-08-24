"use client";

import { useState, useTransition } from "react";
import {
  addTreasuryExpense, updateTreasuryExpense, deleteTreasuryExpense,
  addTreasuryIncome,  updateTreasuryIncome,  deleteTreasuryIncome,
  deleteMentorPayment, deleteParentSessionPayment,
} from "@/lib/compta/treasury";
import type { TreasuryData, ManualLine } from "@/lib/compta/treasury";
import { useRouter } from "next/navigation";

function fmt(n: number) {
  return n.toLocaleString("fr-FR") + " ₣";
}

function fmtDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

// ── Ligne auto ─────────────────────────────────────────────────────────────
// Lecture seule, sauf pour l'admin qui peut la supprimer. C'est un paiement
// réel : la suppression change les totaux et ne se rattrape pas, d'où la
// confirmation en deux temps plutôt que la croix immédiate des lignes saisies.
function AutoLine({ id, name, label, date, amount, sign, kind, isAdmin, onDeleted }: {
  id: string; name: string; label: string; date: string; amount: number;
  sign: "+" | "−"; kind: "mentor" | "parent"; isAdmin?: boolean; onDeleted: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [erreur, setErreur]         = useState<string | null>(null);
  const [pending, start]            = useTransition();
  const color = sign === "+" ? "text-emerald-600" : "text-red-500";

  function handleDelete() {
    start(async () => {
      const fn  = kind === "mentor" ? deleteMentorPayment : deleteParentSessionPayment;
      const res = await fn(id);
      if (res.error) { setErreur(res.error); setConfirming(false); return; }
      onDeleted();
    });
  }

  return (
    <div className="border-b border-gray-50 last:border-0">
      <div className="flex items-center gap-3 px-5 py-2.5">
        <div className="text-xs text-gray-400 font-semibold shrink-0 w-24 tabular-nums">{fmtDate(date)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-gray-800 truncate">{name}</div>
          <div className="text-[11px] text-gray-400 truncate">{label}</div>
        </div>
        <span className={`font-black text-sm shrink-0 tabular-nums ${color}`}>
          {sign}{fmt(amount)}
        </span>
        <span className="text-[9px] font-black bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded shrink-0">AUTO</span>
        {isAdmin && !confirming && (
          <button
            type="button"
            onClick={() => { setErreur(null); setConfirming(true); }}
            className="w-6 h-6 shrink-0 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="Supprimer cette ligne"
          >
            ×
          </button>
        )}
      </div>

      {confirming && (
        <div className="flex items-center justify-end gap-2 px-5 pb-2.5 -mt-1">
          <span className="text-[11px] font-bold text-gray-500">Supprimer définitivement&nbsp;?</span>
          <button type="button" onClick={() => setConfirming(false)}
            className="px-2.5 py-1 rounded-lg border border-gray-200 text-[11px] font-bold text-gray-500 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button type="button" onClick={handleDelete} disabled={pending}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-black text-white bg-red-500 transition-opacity ${pending ? "opacity-50" : "hover:opacity-90"}`}>
            {pending ? "…" : "Supprimer"}
          </button>
        </div>
      )}

      {erreur && (
        <div className="px-5 pb-2.5 -mt-1 text-[11px] font-bold text-red-500">{erreur}</div>
      )}
    </div>
  );
}

// ── Ligne manuelle éditable ────────────────────────────────────────────────
function ManualRow({ line, type, onEdited, isAdmin }: {
  line: ManualLine;
  type: "expense" | "income";
  onEdited: () => void;
  isAdmin?: boolean;
}) {
  const [editing, setEditing]   = useState(false);
  const [pending, start]        = useTransition();
  const color = type === "income" ? "text-emerald-600" : "text-red-500";
  const sign  = type === "income" ? "+" : "−";

  function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const fn = type === "expense" ? updateTreasuryExpense : updateTreasuryIncome;
      const res = await fn(line.id, fd);
      if (!res.error) { setEditing(false); onEdited(); }
    });
  }

  function handleDelete() {
    start(async () => {
      const fn = type === "expense" ? deleteTreasuryExpense : deleteTreasuryIncome;
      await fn(line.id);
      onEdited();
    });
  }

  if (editing) {
    return (
      <form onSubmit={handleUpdate} className="px-5 py-3 bg-gray-50 border-b border-gray-100">
        <div className="grid grid-cols-3 gap-2 mb-2">
          <div className="col-span-1">
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Libellé</label>
            <input name="label" defaultValue={line.label} required
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Montant</label>
            <input name="amount" type="number" min="1" defaultValue={line.amount_fcfa} required
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
          </div>
          <div>
            <label className="block text-[9px] font-black text-gray-400 uppercase tracking-wider mb-1">Date</label>
            <input name="date" type="date" defaultValue={line.date} required
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-bold text-gray-500 hover:bg-gray-100 transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={pending}
            className={`px-3 py-1.5 rounded-lg text-xs font-black text-white transition-opacity ${type === "expense" ? "bg-red-500" : "bg-emerald-500"} ${pending ? "opacity-50" : "hover:opacity-90"}`}>
            {pending ? "…" : "Sauvegarder"}
          </button>
        </div>
      </form>
    );
  }

  const tooltipTitle = isAdmin && line.createdByName
    ? `Ajouté par ${line.createdByName}`
    : "Cliquer pour modifier";

  return (
    <div
      onClick={() => setEditing(true)}
      className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer group relative"
      title={tooltipTitle}
    >
      <div className="text-xs text-gray-400 font-semibold shrink-0 w-24 tabular-nums">{fmtDate(line.date)}</div>
      <span className="flex-1 text-sm font-semibold text-gray-700 truncate">{line.label}</span>
      <span className={`font-black text-sm shrink-0 tabular-nums ${color}`}>
        {sign}{fmt(line.amount_fcfa)}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {isAdmin && line.createdByName && (
          <span className="hidden group-hover:inline-block text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded whitespace-nowrap">
            👤 {line.createdByName}
          </span>
        )}
        <span className="text-[10px] text-gray-300 group-hover:text-gray-400 font-bold">✎</span>
        <button
          type="button"
          onClick={e => { e.stopPropagation(); handleDelete(); }}
          disabled={pending}
          className="w-6 h-6 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Supprimer"
        >
          {pending ? "…" : "×"}
        </button>
      </div>
    </div>
  );
}

// ── Formulaire d'ajout ─────────────────────────────────────────────────────
function AddForm({ type, onClose }: { type: "expense" | "income"; onClose: () => void }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const today  = new Date().toISOString().slice(0, 10);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const fn  = type === "expense" ? addTreasuryExpense : addTreasuryIncome;
      const res = await fn(fd);
      if (!res.error) { onClose(); router.refresh(); }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Libellé</label>
          <input name="label" required placeholder={type === "expense" ? "ex : Loyer bureau" : "ex : Subvention ONG"}
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Montant (FCFA)</label>
          <input name="amount" type="number" min="1" required placeholder="50000"
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Date</label>
          <input name="date" type="date" defaultValue={today} required
            className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm font-semibold bg-white focus:outline-none focus:border-blue-400 text-gray-800" />
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

// ── Presets ────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "Ce mois", months: 0  },
  { label: "3 mois",  months: 3  },
  { label: "6 mois",  months: 6  },
  { label: "Année",   months: 12 },
] as const;

// ── Section card ───────────────────────────────────────────────────────────
function SectionCard({ title, total, autoLines, autoKind, manualLines, type, sign, isAdmin }: {
  title: string;
  total: number;
  autoLines: { id: string; name: string; label: string; date: string; amount_fcfa: number }[];
  /** Table d'origine des lignes auto — dit laquelle supprimer. */
  autoKind: "mentor" | "parent";
  manualLines: ManualLine[];
  type: "expense" | "income";
  sign: "+" | "−";
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const totalColor = type === "income" ? "text-emerald-600" : "text-red-500";
  const topColor   = type === "income" ? "#10B981" : "#EF4444";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100" style={{ borderTop: `3px solid ${topColor}` }}>
        <span className="font-black text-gray-900 text-sm">{title}</span>
        <span className={`font-black text-sm tabular-nums ${totalColor}`}>{sign}{fmt(total)}</span>
      </div>

      {/* Auto lines */}
      <div className="border-b border-gray-100">
        <div className="px-5 py-2 bg-gray-50 flex items-center justify-between border-b border-gray-100">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Calculé automatiquement</span>
        </div>
        {autoLines.length === 0 ? (
          <div className="px-5 py-4 text-center text-xs text-gray-300 font-semibold">
            Aucun paiement {type === "income" ? "reçu" : "effectué"} sur cette période
          </div>
        ) : (
          autoLines.map(l => (
            <AutoLine
              key={l.id}
              id={l.id}
              name={l.name}
              label={l.label}
              date={l.date}
              amount={l.amount_fcfa}
              sign={sign}
              kind={autoKind}
              isAdmin={isAdmin}
              onDeleted={() => router.refresh()}
            />
          ))
        )}
      </div>

      {/* Manual lines */}
      <div>
        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
            {type === "expense" ? "Autres dépenses" : "Autres entrées"}
          </span>
          <button onClick={() => setShowForm(v => !v)}
            className={`text-[11px] font-black text-gray-400 border border-dashed border-gray-200 px-2.5 py-1 rounded-lg transition-colors ${
              type === "expense"
                ? "hover:border-red-300 hover:text-red-500 hover:bg-red-50"
                : "hover:border-emerald-300 hover:text-emerald-600 hover:bg-emerald-50"
            }`}>
            ＋ Ajouter
          </button>
        </div>

        {manualLines.length === 0 && !showForm && (
          <div className="px-5 py-5 text-center text-xs text-gray-300 font-semibold italic">
            Aucune ligne manuelle — cliquez ＋ Ajouter
          </div>
        )}

        {manualLines.map(l => (
          <ManualRow key={l.id} line={l} type={type} onEdited={() => router.refresh()} isAdmin={isAdmin} />
        ))}

        {showForm && <AddForm type={type} onClose={() => setShowForm(false)} />}
      </div>
    </div>
  );
}

// ── Composant principal ────────────────────────────────────────────────────
interface Props { data: TreasuryData; from: string; to: string; isAdmin?: boolean; }

export default function TresorerieClient({ data, from, to, isAdmin }: Props) {
  const router = useRouter();
  const [dateFrom, setDateFrom]     = useState(from);
  const [dateTo,   setDateTo]       = useState(to);
  const [activePreset, setPreset]   = useState<string | null>(null);

  function applyRange(f: string, t: string, preset?: string) {
    setDateFrom(f); setDateTo(t); setPreset(preset ?? null);
    router.push(`?from=${f}&to=${t}`);
  }

  function applyPreset(months: number, label: string) {
    const now = new Date();
    const t   = now.toISOString().slice(0, 10);
    let f: string;
    if (months === 0)  f = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    else if (months === 12) f = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
    else { const d = new Date(now); d.setMonth(d.getMonth() - months); f = d.toISOString().slice(0, 10); }
    applyRange(f, t, label);
  }

  const balancePositive = data.balance >= 0;

  return (
    <div className="space-y-6">

      {/* Période */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-wrap items-center gap-3">
        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Période</span>
        <div className="flex gap-1 bg-gray-50 border border-gray-100 rounded-xl p-1">
          {PRESETS.map(p => (
            <button key={p.label} onClick={() => applyPreset(p.months, p.label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                activePreset === p.label ? "bg-brand-navy text-white" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              }`}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="w-px h-6 bg-gray-100" />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black text-gray-300 uppercase">Du</span>
            <input type="date" value={dateFrom}
              onChange={e => { setDateFrom(e.target.value); setPreset(null); }}
              className="bg-transparent text-sm font-black text-gray-700 outline-none" />
          </div>
          <span className="text-gray-300 font-bold">→</span>
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black text-gray-300 uppercase">Au</span>
            <input type="date" value={dateTo}
              onChange={e => { setDateTo(e.target.value); setPreset(null); }}
              className="bg-transparent text-sm font-black text-gray-700 outline-none" />
          </div>
          <button onClick={() => applyRange(dateFrom, dateTo)}
            className="px-4 py-1.5 rounded-xl bg-brand-navy text-white text-xs font-black hover:opacity-90 transition-opacity">
            Calculer
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" style={{ borderTop: "3px solid #10B981" }}>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">↑ Entrées</div>
          <div className="text-3xl font-black text-emerald-600 tabular-nums">{fmt(data.totalIn)}</div>
          <div className="text-xs text-gray-400 mt-1 font-semibold">
            Parents {fmt(data.parentsPaid)} + divers {fmt(data.totalIn - data.parentsPaid)}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5" style={{ borderTop: "3px solid #EF4444" }}>
          <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">↓ Sorties</div>
          <div className="text-3xl font-black text-red-500 tabular-nums">{fmt(data.totalOut)}</div>
          <div className="text-xs text-gray-400 mt-1 font-semibold">
            Mentors {fmt(data.mentorsPaid)} + divers {fmt(data.totalOut - data.mentorsPaid)}
          </div>
        </div>
        <div className="bg-brand-navy rounded-2xl shadow-sm p-5" style={{ borderTop: "3px solid #FDB813" }}>
          <div className="text-[11px] font-black text-white/40 uppercase tracking-widest mb-1">= Solde net</div>
          <div className={`text-3xl font-black tabular-nums ${balancePositive ? "text-yellow-300" : "text-red-300"}`}>
            {balancePositive ? "+" : ""}{fmt(data.balance)}
          </div>
          <div className="text-xs text-white/40 mt-1 font-semibold">
            {balancePositive ? "✓ Excédent" : "⚠ Déficit"}
          </div>
        </div>
      </div>

      {/* Deux colonnes */}
      <div className="grid grid-cols-2 gap-5">
        <SectionCard
          title="🔴 Décaissements"
          total={data.totalOut}
          autoLines={data.mentorLines}
          autoKind="mentor"
          manualLines={data.expenses}
          type="expense"
          sign="−"
          isAdmin={isAdmin}
        />
        <SectionCard
          title="🟢 Encaissements"
          total={data.totalIn}
          autoLines={data.parentLines}
          autoKind="parent"
          manualLines={data.incomes}
          type="income"
          sign="+"
          isAdmin={isAdmin}
        />
      </div>

      {/* Note */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-semibold">
        <span className="shrink-0">ℹ️</span>
        <span>
          Les lignes <strong>AUTO</strong> reflètent les paiements confirmés (status <em>paid</em>) dans la compta Mentors et Parents sur la période sélectionnée.
          Cliquez sur une ligne manuelle pour la modifier.
        </span>
      </div>

    </div>
  );
}
