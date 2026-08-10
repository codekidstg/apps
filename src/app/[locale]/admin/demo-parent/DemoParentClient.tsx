"use client";
import { useState, useTransition } from "react";
import { toggleAtelier } from "./actions";

type Student = { id: string; name: string; atelier_active: boolean };

export default function DemoParentClient({ students }: { students: Student[] }) {
  const [list, setList] = useState(students);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  const filtered = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

  function toggle(id: string) {
    startTransition(async () => {
      const student = list.find(s => s.id === id)!;
      const next = !student.atelier_active;
      await toggleAtelier(id, next);
      setList(prev => prev.map(s => s.id === id ? { ...s, atelier_active: next } : s));
    });
  }

  const activeCount = list.filter(s => s.atelier_active).length;

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-orange-400">{activeCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-bold">Séance(s) activée(s)</div>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-4 text-center">
          <div className="text-3xl font-black text-slate-300">{list.length - activeCount}</div>
          <div className="text-xs text-slate-400 mt-1 font-bold">Non activé(s)</div>
        </div>
      </div>

      {/* Recherche */}
      <input
        type="text"
        placeholder="Rechercher un élève…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-orange-500"
      />

      {/* Liste */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">Aucun élève trouvé</div>
        )}
        {filtered.map(s => (
          <div
            key={s.id}
            className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all ${
              s.atelier_active
                ? "border-orange-500 bg-orange-950/30"
                : "border-slate-700 bg-slate-800/50"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${
                s.atelier_active ? "bg-orange-500 text-white" : "bg-slate-700 text-slate-400"
              }`}>
                {s.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-white text-sm">{s.name}</div>
                {s.atelier_active && (
                  <div className="text-xs text-orange-400 font-bold mt-0.5">🎟️ Séance offerte active</div>
                )}
              </div>
            </div>

            <button
              disabled={pending}
              onClick={() => toggle(s.id)}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all disabled:opacity-50 ${
                s.atelier_active
                  ? "bg-slate-700 hover:bg-slate-600 text-white"
                  : "bg-orange-500 hover:bg-orange-400 text-white"
              }`}
            >
              {s.atelier_active ? "Désactiver" : "Activer la séance"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
