"use client";

import { useState, useMemo } from "react";
import LevelSelect from "./LevelSelect";

const LEVELS = [
  { num: 1, name: "Explorateur 🌱", color: "#10B981" },
  { num: 2, name: "Bâtisseur 🏗️",  color: "#7C3AED" },
  { num: 3, name: "Architecte 🏛️", color: "#F47B20" },
];

type StudentRow = {
  id: string;
  profile_id: string;
  name: string;
  email: string;
  xp: number;
  streak_days: number;
  level_num: number;
  done: number;
  total: number;
  currentTheme: string | null;
  parents: string[];
};

export default function ElevesSearchTable({ students }: { students: StudentRow[] }) {
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState(0);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase().trim();
    return students.filter((s) => {
      if (levelFilter && s.level_num !== levelFilter) return false;
      if (!lower) return true;
      return (
        s.name.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower) ||
        (s.currentTheme ?? "").toLowerCase().includes(lower) ||
        s.parents.some((p) => p.toLowerCase().includes(lower))
      );
    });
  }, [q, levelFilter, students]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, email, thème, parent…"
            className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 placeholder:text-gray-400 transition-all"
          />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setLevelFilter(0)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${levelFilter === 0 ? "bg-brand-navy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            Tous
          </button>
          {LEVELS.map((l) => (
            <button key={l.num} onClick={() => setLevelFilter(l.num)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${levelFilter === l.num ? "text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}
              style={levelFilter === l.num ? { background: l.color } : {}}>
              {l.name}
            </button>
          ))}
        </div>
        {(q || levelFilter > 0) && (
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="overflow-hidden border border-gray-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Élève", "Niveau", "Progression", "Thème actif", "Parent(s)"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={5} className="px-5 py-12 text-center text-gray-400 font-bold">
                Aucun élève pour « {q || LEVELS.find(l => l.num === levelFilter)?.name} »
              </td></tr>
            ) : filtered.map((s) => {
              const lvl = LEVELS.find((l) => l.num === s.level_num) ?? LEVELS[0];
              const pct = s.total ? Math.round((s.done / s.total) * 100) : 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white"
                        style={{ background: lvl.color }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{s.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <LevelSelect studentId={s.id} currentLevel={s.level_num} levels={LEVELS} />
                    <div className="text-xs text-gray-400 mt-0.5">{s.xp} XP · 🔥 {s.streak_days}j</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-bold text-gray-700">{s.done}/{s.total} leçons</div>
                    <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: lvl.color }} />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {s.currentTheme ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                        📚 {s.currentTheme}
                      </span>
                    ) : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {s.parents.length > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        {s.parents.map((p, i) => <span key={i} className="text-xs font-bold text-blue-600">👤 {p}</span>)}
                      </div>
                    ) : <span className="text-xs text-gray-300 italic">Aucun parent</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
