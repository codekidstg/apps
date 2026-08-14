"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertMentorPayment } from "@/lib/compta/actions";

type Status = "pending_report" | "to_pay" | "paid";

type Props = {
  teacherId: string;
  sessionId: string;
  occurrenceDate: string;
  title: string;
  at: string;
  duration_min: number;
  studentName: string | null;
  status: Status;
  amount: number;
  paymentNotes?: string | null;
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  pending_report: { label: "⏳ Sans rapport", color: "text-gray-500",  bg: "bg-gray-100" },
  to_pay:         { label: "💰 À payer",      color: "text-amber-700", bg: "bg-amber-100" },
  paid:           { label: "✅ Payé",          color: "text-green-700", bg: "bg-green-100" },
};

export default function MentorPaymentRow(props: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(props.status);
  const [amount, setAmount] = useState(props.amount);
  const [notes,  setNotes]  = useState(props.paymentNotes ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err,    setErr]    = useState("");

  const meta = STATUS_META[status];
  const at   = new Date(props.at);

  function save(newStatus: Status) {
    setErr("");
    startTransition(async () => {
      const res = await upsertMentorPayment(
        props.teacherId, props.sessionId, props.occurrenceDate,
        newStatus, amount, notes || undefined,
      );
      if ("error" in res) { setErr(res.error); return; }
      setStatus(newStatus);
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <div className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 last:border-0 ${pending ? "opacity-60" : ""}`}>
      {/* Date */}
      <div className="w-12 text-center shrink-0 pt-0.5">
        <div className="text-[10px] font-black text-gray-400 uppercase">
          {at.toLocaleDateString("fr-FR", { month: "short" })}
        </div>
        <div className="text-base font-black text-gray-700 leading-none">{at.getDate()}</div>
      </div>

      {/* Info séance */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-800 truncate">{props.title}</div>
        <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
          <span>🕐 {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          <span>· {props.duration_min} min</span>
          {props.studentName && <span>· 👦 {props.studentName}</span>}
        </div>
        {err && <div className="text-xs text-red-500 mt-1 font-bold">{err}</div>}
      </div>

      {/* Montant */}
      {editing ? (
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min="0" step="100"
          className="w-24 border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-300 shrink-0"
        />
      ) : (
        <div className="text-sm font-black text-gray-700 w-24 text-right shrink-0 pt-0.5">
          {amount > 0 ? `${amount.toLocaleString("fr-FR")} F` : "0 F"}
        </div>
      )}

      {/* Statut + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {/* Toujours éditable */}
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
              ✏️
            </button>
          )}
        </div>

        {editing && (
          <>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Note (optionnel)"
              className="w-40 border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-300"
            />
            <div className="flex gap-1">
              <button onClick={() => save("paid")} disabled={pending}
                className="flex-1 text-[10px] font-black text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
                ✅ Payé
              </button>
              <button onClick={() => save("to_pay")} disabled={pending}
                className="flex-1 text-[10px] font-black text-amber-600 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
                💰 À payer
              </button>
              <button onClick={() => save("pending_report")} disabled={pending}
                className="flex-1 text-[10px] font-black text-gray-500 border border-gray-200 hover:bg-gray-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
                ⏳
              </button>
              <button onClick={() => { setEditing(false); setErr(""); }}
                className="text-[10px] text-gray-400 hover:text-gray-600 px-1.5 py-1 rounded-lg border border-gray-100">
                ✕
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
