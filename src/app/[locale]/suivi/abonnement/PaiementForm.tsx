"use client";
import { useState, useTransition } from "react";
import { initCinetpayPayment, submitCashPayment } from "../actions";
import { useRouter } from "next/navigation";

type Plan = { id: string; name: string; price_fcfa: number; billing_cycle: string };

export default function PaiementForm({ plan, studentId }: { plan: Plan; studentId: string }) {
  const [method, setMethod]   = useState<"mobile" | "cash" | null>(null);
  const [isPending, start]    = useTransition();
  const [msg, setMsg]         = useState<string | null | undefined>(null);
  const router                = useRouter();

  async function handleMobile() {
    start(async () => {
      const res = await initCinetpayPayment(plan.id, studentId);
      if ("error" in res) { setMsg(res.error ?? "Erreur"); return; }
      router.push(res.paymentUrl);
    });
  }

  async function handleCash(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("plan_id", plan.id);
    fd.set("student_id", studentId);
    start(async () => {
      const res = await submitCashPayment(fd);
      if ("error" in res) { setMsg(res.error ?? "Erreur"); return; }
      setMsg("✅ Votre paiement espèces a été soumis. L'administrateur le validera sous 24h.");
      setMethod(null);
    });
  }

  return (
    <div className="space-y-3">
      {!method && (
        <div className="flex gap-2">
          <button
            onClick={() => setMethod("mobile")}
            className="flex-1 bg-[#1e3a6e] hover:bg-[#2a4a8e] text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            📱 Flooz / T-Money
          </button>
          <button
            onClick={() => setMethod("cash")}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors"
          >
            💵 Payer en espèces
          </button>
        </div>
      )}

      {method === "mobile" && (
        <div className="bg-[#0f1e3d] border border-[#1e3a6e] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-blue-300">
            <span>📱</span> Paiement Mobile Money via CinetPay
          </div>
          <div className="text-xs text-slate-400">
            Vous serez redirigé vers la page de paiement sécurisée CinetPay.
            Accepte Flooz (Togocel) et T-Money (Moov). <span className="text-amber-400 font-bold">[MODE TEST]</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleMobile} disabled={isPending}
              className="flex-1 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
              {isPending ? "Redirection…" : `Payer ${plan.price_fcfa.toLocaleString("fr-FR")} FCFA`}
            </button>
            <button onClick={() => setMethod(null)} className="px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors">✕</button>
          </div>
        </div>
      )}

      {method === "cash" && (
        <form onSubmit={handleCash} className="bg-slate-900/60 border border-slate-600 rounded-xl p-4 space-y-3">
          <div className="text-sm font-bold text-slate-300">💵 Paiement en espèces</div>
          <div className="text-xs text-slate-400">Renseignez la date et la référence du paiement. Un administrateur validera sous 24h.</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Date du paiement</label>
              <input type="date" name="cash_date" required
                defaultValue={new Date().toISOString().split("T")[0]}
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Référence / Reçu</label>
              <input type="text" name="cash_ref" placeholder="ex: REC-2026-001"
                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500" />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">Commentaire (optionnel)</label>
            <textarea name="cash_note" rows={2} placeholder="Ex: Payé à l'agence de Lomé-Agoè"
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
              {isPending ? "Envoi…" : "Soumettre le paiement"}
            </button>
            <button type="button" onClick={() => setMethod(null)} className="px-4 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold rounded-xl transition-colors">✕</button>
          </div>
        </form>
      )}

      {msg && (
        <div className={`text-sm rounded-xl px-4 py-3 font-bold ${msg.startsWith("✅") ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300"}`}>
          {msg}
        </div>
      )}
    </div>
  );
}
