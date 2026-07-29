"use client";

import { useState, useMemo } from "react";
import AddChildForm from "./AddChildForm";
import UnlinkButton from "./UnlinkButton";

const LEVEL_NAMES: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };

type ChildLink = {
  student_id: string;
  students: {
    id: string;
    xp: number;
    level_num: number;
    profiles: { id: string; display_name: string } | null;
  } | null;
};

type ParentRow = {
  id: string;
  display_name: string;
  email: string;
  children: ChildLink[];
};

type StudentOption = { id: string; display_name: string };

export default function ParentsSearchList({
  parents,
  studentList,
}: {
  parents: ParentRow[];
  studentList: StudentOption[];
}) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const lower = q.toLowerCase().trim();
    if (!lower) return parents;
    return parents.filter((p) => {
      return (
        p.display_name.toLowerCase().includes(lower) ||
        p.email.toLowerCase().includes(lower) ||
        p.children.some((c) =>
          (c.students?.profiles?.display_name ?? "").toLowerCase().includes(lower)
        )
      );
    });
  }, [q, parents]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, email, enfant…"
            className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 placeholder:text-gray-400 transition-all"
          />
        </div>
        {q && (
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
            Aucun parent pour « {q} »
          </div>
        ) : filtered.map((parent) => (
          <div key={parent.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-black text-blue-700">
                  {parent.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-gray-900">{parent.display_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{parent.email}</div>
                </div>
              </div>
              <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                {parent.children.length} enfant{parent.children.length !== 1 ? "s" : ""}
              </span>
            </div>

            {parent.children.length > 0 ? (
              <div className="mb-4 space-y-2">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Enfants liés</div>
                {parent.children.map((link) => {
                  const student = link.students;
                  const studentName = student?.profiles?.display_name ?? "—";
                  const levelNum = student?.level_num ?? 1;
                  return (
                    <div key={link.student_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👦</span>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{studentName}</div>
                          <div className="text-xs text-gray-400">
                            {LEVEL_NAMES[levelNum] ?? `Niveau ${levelNum}`} · {student?.xp ?? 0} XP
                          </div>
                        </div>
                      </div>
                      <UnlinkButton parentId={parent.id} studentId={link.student_id} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-4 text-sm text-gray-400 italic">Aucun enfant associé</div>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-brand-navy hover:underline list-none flex items-center gap-1">
                <span className="group-open:hidden">＋ Associer un enfant</span>
                <span className="hidden group-open:inline">▲ Fermer</span>
              </summary>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <AddChildForm parentId={parent.id} students={studentList} />
              </div>
            </details>
          </div>
        ))}
      </div>
    </div>
  );
}
