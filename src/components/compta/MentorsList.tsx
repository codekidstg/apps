"use client";

import { useState } from "react";
import MentorPaymentRow from "./MentorPaymentRow";
import RateModal from "./RateModal";

type Line = {
  sessionId: string; occurrenceDate: string; title: string;
  at: string; duration_min: number; studentName: string | null;
  status: "pending_report" | "to_pay" | "paid"; amount: number; paymentNotes?: string | null;
};
type MentorEntry = {
  teacher: { id: string; display_name: string };
  rate: { rate_fcfa: number; rate_type: string } | null;
  lines: Line[];
  totalDue: number; totalPaid: number;
};

export default function MentorsList({ data }: { data: MentorEntry[] }) {
  const [q, setQ] = useState("");
  const filtered = q.trim()
    ? data.filter(d => d.teacher.display_name.toLowerCase().includes(q.toLowerCase()))
    : data;

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un mentor…"
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 bg-white"
        />
        {q && (
          <button onClick={() => setQ("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">✕</button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          <div className="text-3xl mb-2">🔍</div>
          <p className="font-bold text-sm">Aucun mentor trouvé pour "{q}"</p>
        </div>
      )}

      {filtered.map(({ teacher, rate, lines, totalDue: due, totalPaid: paid }) => (
        <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header mentor */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shrink-0">
              {teacher.display_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900">{teacher.display_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {rate ? (
                  <span>{rate.rate_fcfa.toLocaleString("fr-FR")} FCFA / {rate.rate_type === "per_hour" ? "heure" : "séance"}</span>
                ) : (
                  <span className="text-amber-500 font-bold">⚠ Aucun tarif configuré</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <RateModal type="teacher" entityId={teacher.id} entityName={teacher.display_name} currentRate={rate} />
              <div className="text-right">
                <div className="text-xs text-gray-400">Dû</div>
                <div className="text-base font-black text-amber-600">{due.toLocaleString("fr-FR")} F</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Payé</div>
                <div className="text-base font-black text-green-600">{paid.toLocaleString("fr-FR")} F</div>
              </div>
            </div>
          </div>

          {/* Lignes séances */}
          <div>
            {lines.map((line, i) => (
              <MentorPaymentRow
                key={i}
                teacherId={teacher.id}
                sessionId={line.sessionId}
                occurrenceDate={line.occurrenceDate}
                title={line.title}
                at={line.at}
                duration_min={line.duration_min}
                studentName={line.studentName}
                status={line.status}
                amount={line.amount}
                paymentNotes={line.paymentNotes}
              />
            ))}
          </div>

          {/* Pied mentor */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
            <span className="text-xs text-gray-400">{lines.length} séance{lines.length > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-gray-500">
                En attente : <span className="text-amber-600">{(due - paid).toLocaleString("fr-FR")} F</span>
              </span>
              <span className="text-xs font-bold text-gray-500">
                Total dû : <span className="font-black text-gray-800">{due.toLocaleString("fr-FR")} F</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
