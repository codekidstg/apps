"use client";

import { useState, useTransition } from "react";
import { setTeacherRate, setStudentRate } from "@/lib/compta/actions";

type Props =
  | { type: "teacher"; entityId: string; entityName: string; currentRate?: { rate_fcfa: number; rate_type: string } | null }
  | { type: "student"; entityId: string; entityName: string; currentRate?: number | null };

export default function RateModal(props: Props) {
  const [open, setOpen] = useState(false);
  const [rate, setRate] = useState(props.currentRate ? (props.type === "teacher" ? (props.currentRate as any).rate_fcfa : props.currentRate) : 0);
  const [rateType, setRateType] = useState<"per_session" | "per_hour">(
    props.type === "teacher" && props.currentRate ? (props.currentRate as any).rate_type : "per_session"
  );
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [errMsg, setErrMsg] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      let res;
      if (props.type === "teacher") {
        res = await setTeacherRate(props.entityId, Number(rate), rateType, notes);
      } else {
        res = await setStudentRate(props.entityId, Number(rate), notes);
      }
      if ("error" in res) { setStatus("error"); setErrMsg(res.error); return; }
      setStatus("ok");
      setTimeout(() => { setStatus("idle"); setOpen(false); }, 1500);
    });
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="text-xs font-black text-brand-navy border border-brand-navy/20 bg-blue-50 hover:bg-brand-navy hover:text-white px-2.5 py-1 rounded-lg transition-colors">
        ⚙ Tarif
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="font-black text-gray-900 mb-1">
              {props.type === "teacher" ? "Tarif du mentor" : "Coût de séance — élève"}
            </h3>
            <p className="text-xs text-gray-400 mb-5">{props.entityName}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Montant (FCFA)
                </label>
                <input type="number" min="0" step="100" required value={rate}
                  onChange={e => setRate(Number(e.target.value))}
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              {props.type === "teacher" && (
                <div>
                  <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                    Type de tarif
                  </label>
                  <div className="flex gap-2">
                    {([["per_session","Par séance"],["per_hour","Par heure"]] as const).map(([val, lbl]) => (
                      <button key={val} type="button" onClick={() => setRateType(val)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-all ${
                          rateType === val ? "bg-brand-navy text-white border-brand-navy" : "bg-white text-gray-400 border-gray-200"
                        }`}>
                        {lbl}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    {rateType === "per_hour" ? "Le montant sera calculé au prorata de la durée de la séance." : "Montant fixe par séance, quelle que soit la durée."}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-1.5">
                  Notes (optionnel)
                </label>
                <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
                  placeholder="Ex : tarif négocié, période d'essai…"
                  className="w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
                />
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button type="submit" disabled={pending}
                  className="flex-1 py-2.5 bg-brand-navy text-white text-sm font-black rounded-xl hover:bg-blue-900 transition-colors disabled:opacity-40">
                  {pending ? "Enregistrement…" : "Enregistrer"}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700">
                  Annuler
                </button>
              </div>

              {status === "ok"    && <p className="text-xs text-emerald-600 font-bold">✅ Tarif enregistré !</p>}
              {status === "error" && <p className="text-xs text-red-500 font-bold">{errMsg}</p>}
            </form>
          </div>
        </div>
      )}
    </>
  );
}
