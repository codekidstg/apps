"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { upsertParentPayment } from "@/lib/compta/actions";

type Status = "pending" | "paid" | "unpaid";

type Props = {
  parentId: string;
  studentId: string;
  sessionId: string;
  occurrenceDate: string;
  title: string;
  at: string;
  duration_min: number;
  status: Status;
  amount: number;
  comment?: string | null;
};

const STATUS_META: Record<Status, { label: string; color: string; bg: string }> = {
  pending: { label: "⏳ En attente", color: "text-amber-700", bg: "bg-amber-100" },
  paid:    { label: "✅ Payé",       color: "text-green-700", bg: "bg-green-100" },
  unpaid:  { label: "❌ Impayé",     color: "text-red-700",   bg: "bg-red-100"   },
};

export default function ParentPaymentRow(props: Props) {
  const router = useRouter();
  const [status,  setStatus]  = useState<Status>(props.status);
  const [amount,  setAmount]  = useState(props.amount);
  const [comment, setComment] = useState(props.comment ?? "");
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();
  const [err,     setErr]     = useState("");

  const meta = STATUS_META[status];
  const at   = new Date(props.at);

  function save(newStatus: Status) {
    if (newStatus === "unpaid" && !comment.trim()) {
      setErr("Un commentaire est obligatoire pour un impayé.");
      return;
    }
    setErr("");
    startTransition(async () => {
      const res = await upsertParentPayment(
        props.parentId, props.studentId, props.sessionId,
        props.occurrenceDate, newStatus, amount, comment || undefined,
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

      {/* Séance */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold text-gray-800 truncate">{props.title}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          🕐 {at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {props.duration_min} min
        </div>
        {comment && status === "unpaid" && (
          <div className="text-xs text-red-400 mt-0.5 italic">— {comment}</div>
        )}
        {err && <div className="text-xs text-red-500 mt-1 font-bold">{err}</div>}
      </div>

      {/* Montant */}
      {editing ? (
        <input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} min="0" step="100"
          className="w-24 border border-blue-300 rounded-lg px-2 py-1 text-xs font-bold text-right focus:outline-none focus:ring-2 focus:ring-blue-300 shrink-0"
        />
      ) : (
        <div className="text-sm font-black text-gray-700 w-24 text-right shrink-0 pt-0.5">
          {amount.toLocaleString("fr-FR")} F
        </div>
      )}

      {/* Statut + actions */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black px-2 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          {/* Bouton édition — toujours disponible */}
          {!editing && (
            <button onClick={() => setEditing(true)}
              className="text-xs font-bold text-gray-400 hover:text-blue-600 transition-colors" title="Modifier">
              ✏️
            </button>
          )}
        </div>

        {editing && (
          <>
            <input type="text" value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Commentaire (requis si impayé)"
              className={`w-44 border rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 ${
                !comment.trim() && status === "unpaid" ? "border-red-300 focus:ring-red-300" : "border-gray-200 focus:ring-blue-300"
              }`}
            />
            <div className="flex gap-1">
              <button onClick={() => save("paid")} disabled={pending}
                className="flex-1 text-[10px] font-black text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
                ✅ Payé
              </button>
              <button onClick={() => save("unpaid")} disabled={pending}
                className="flex-1 text-[10px] font-black text-red-600 border border-red-200 hover:bg-red-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
                ❌ Impayé
              </button>
              <button onClick={() => save("pending")} disabled={pending}
                className="flex-1 text-[10px] font-black text-amber-600 border border-amber-200 hover:bg-amber-50 px-2 py-1 rounded-lg disabled:opacity-40 transition-colors">
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
