"use client";

import { useState } from "react";
import ParentPaymentRow from "./ParentPaymentRow";
import RateModal from "./RateModal";

type Line = {
  sessionId: string; occurrenceDate: string; title: string;
  at: string; duration_min: number;
  status: "pending" | "paid" | "unpaid"; amount: number;
  payment?: { comment?: string | null } | null;
};
type ChildEntry = {
  studentId: string; studentName: string; rate: number;
  lines: Line[]; totalDue: number; totalPaid: number;
};
type ParentEntry = {
  parent: { id: string; display_name: string };
  children: ChildEntry[];
  grandDue: number; grandPaid: number;
};

export default function ParentsList({ data }: { data: ParentEntry[] }) {
  const [q, setQ] = useState("");
  const [openParents, setOpenParents] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenParents(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const filtered = q.trim()
    ? data.filter(d =>
        d.parent.display_name.toLowerCase().includes(q.toLowerCase()) ||
        d.children.some(c => c.studentName.toLowerCase().includes(q.toLowerCase()))
      )
    : data;

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
        <input
          type="text" value={q} onChange={e => setQ(e.target.value)}
          placeholder="Rechercher un parent ou un élève…"
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
          <p className="font-bold text-sm">Aucun résultat pour "{q}"</p>
        </div>
      )}

      {filtered.map(({ parent, children, grandDue, grandPaid }) => {
        const isOpen = openParents.has(parent.id);
        const totalChildren = children.length;
        const totalLines = children.reduce((s, c) => s + c.lines.length, 0);
        const pendingCount = children.reduce((s, c) => s + c.lines.filter(l => l.status === "pending").length, 0);

        return (
          <div key={parent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header parent — cliquable pour ouvrir/fermer */}
            <button
              type="button"
              onClick={() => toggle(parent.id)}
              className="w-full flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50 hover:bg-gray-100/60 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-black text-base shrink-0">
                {parent.display_name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900">{parent.display_name}</div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2">
                  <span>{totalChildren} enfant{totalChildren > 1 ? "s" : ""}</span>
                  <span>·</span>
                  <span>{totalLines} séance{totalLines > 1 ? "s" : ""}</span>
                  {pendingCount > 0 && (
                    <span className="text-amber-500 font-bold">· {pendingCount} en attente</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-gray-400">Total dû</div>
                  <div className="text-base font-black text-amber-600">{grandDue.toLocaleString("fr-FR")} F</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">Encaissé</div>
                  <div className="text-base font-black text-green-600">{grandPaid.toLocaleString("fr-FR")} F</div>
                </div>
                <div className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}>
                  ▼
                </div>
              </div>
            </button>

            {/* Contenu collapsible — enfants */}
            {isOpen && (
              <div>
                {children.map((child) => (
                  <div key={child.studentId}>
                    {/* Header enfant */}
                    <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-50/40 border-b border-indigo-100/50">
                      <span className="text-sm">👦</span>
                      <span className="text-sm font-black text-indigo-900 flex-1">{child.studentName}</span>
                      <div className="flex items-center gap-3">
                        <RateModal
                          type="student"
                          entityId={child.studentId}
                          entityName={child.studentName}
                          currentRate={child.rate ?? null}
                        />
                        {child.rate > 0 ? (
                          <span className="text-xs text-gray-400">{child.rate.toLocaleString("fr-FR")} F/séance</span>
                        ) : (
                          <span className="text-xs text-amber-500 font-bold">⚠ Tarif non défini</span>
                        )}
                        <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                          {child.totalPaid.toLocaleString("fr-FR")} / {child.totalDue.toLocaleString("fr-FR")} F
                        </span>
                      </div>
                    </div>

                    {/* Lignes séances */}
                    {child.lines.map((line, i) => (
                      <ParentPaymentRow
                        key={i}
                        parentId={parent.id}
                        studentId={child.studentId}
                        sessionId={line.sessionId}
                        occurrenceDate={line.occurrenceDate}
                        title={line.title}
                        at={line.at}
                        duration_min={line.duration_min}
                        status={line.status}
                        amount={line.amount}
                        comment={line.payment?.comment}
                      />
                    ))}
                  </div>
                ))}

                {/* Pied parent */}
                <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
                  <span className="text-xs text-gray-400">
                    {children.reduce((s, c) => s + c.lines.length, 0)} séance{children.reduce((s, c) => s + c.lines.length, 0) > 1 ? "s" : ""}
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-gray-500">
                      Reste : <span className="text-amber-600 font-black">{(grandDue - grandPaid).toLocaleString("fr-FR")} F</span>
                    </span>
                    <span className="text-xs font-bold text-gray-500">
                      Total : <span className="font-black text-gray-800">{grandDue.toLocaleString("fr-FR")} F</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
