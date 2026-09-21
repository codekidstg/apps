"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import LevelSelect from "./LevelSelect";
import type { Parcours } from "@/lib/progression";
import { STATUT_ELEVE, type StatutEleve } from "@/lib/backoffice/statut-eleve";

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
  parcours: Parcours;
  parents: string[];
  statut: StatutEleve;
  raisons: string[];
};

const STATUTS = Object.entries(STATUT_ELEVE) as [StatutEleve, (typeof STATUT_ELEVE)[StatutEleve]][];

export default function ElevesSearchTable({ students, basePath = "/admin/utilisateurs/eleves" }: { students: StudentRow[]; basePath?: string }) {
  const [q, setQ] = useState("");
  const [levelFilter, setLevelFilter] = useState(0);
  const [statutFilter, setStatutFilter] = useState<StatutEleve | null>(null);

  const filtered = useMemo(() => {
    const lower = q.toLowerCase().trim();
    return students.filter((s) => {
      if (levelFilter && s.level_num !== levelFilter) return false;
      if (statutFilter && s.statut !== statutFilter) return false;
      if (!lower) return true;
      return (
        s.name.toLowerCase().includes(lower) ||
        s.email.toLowerCase().includes(lower) ||
        (s.parcours.themeCourant ?? "").toLowerCase().includes(lower) ||
        s.parents.some((p) => p.toLowerCase().includes(lower))
      );
    });
  }, [q, levelFilter, statutFilter, students]);

  const parStatut = useMemo(() => {
    const n: Partial<Record<StatutEleve, number>> = {};
    for (const s of students) n[s.statut] = (n[s.statut] ?? 0) + 1;
    return n;
  }, [students]);

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
        {(q || levelFilter > 0 || statutFilter) && (
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Les statuts d'évolution, du plus urgent au plus tranquille. */}
      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setStatutFilter(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${statutFilter === null ? "bg-brand-navy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
          Tous les statuts
        </button>
        {STATUTS.map(([cle, s]) => (
          <button key={cle} onClick={() => setStatutFilter(statutFilter === cle ? null : cle)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${statutFilter === cle ? s.classes : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            {s.pastille} {s.label} <span className="opacity-60">{parStatut[cle] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* overflow-x-auto et non overflow-hidden : avec la colonne « Évolution »,
          la table dépasse sur un écran étroit, et la colonne des parents était
          coupée au lieu de défiler. */}
      <div className="overflow-x-auto border border-gray-200 rounded-2xl bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Élève", "Évolution", "Niveau", "Progression", "Thème en cours", "Parent(s)"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400 font-bold">
                Aucun élève pour ce filtre
              </td></tr>
            ) : filtered.map((s) => {
              const lvl = LEVELS.find((l) => l.num === s.level_num) ?? LEVELS[0];
              const p   = s.parcours;
              const pct = p.total ? Math.round((p.faites / p.total) * 100) : 0;
              return (
                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <Link href={`${basePath}/${s.id}`} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ background: lvl.color }}>
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors">{s.name}</div>
                        <div className="text-xs text-gray-400 font-mono">{s.email}</div>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block text-[11px] font-black px-2 py-0.5 rounded-full border ${STATUT_ELEVE[s.statut].classes}`}
                      title={s.raisons.join(" · ") || undefined}>
                      {STATUT_ELEVE[s.statut].pastille} {STATUT_ELEVE[s.statut].label}
                    </span>
                    {s.raisons[0] && <div className="text-[11px] text-gray-400 mt-1 max-w-40">{s.raisons[0]}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <LevelSelect studentId={s.id} currentLevel={s.level_num} levels={LEVELS} />
                    <div className="text-xs text-gray-400 mt-0.5"
                      title="L'XP vient des leçons, des entraînements, des jeux et de la série : elle ne suit pas le compteur de leçons.">
                      {s.xp} XP · 🔥 {s.streak_days}j
                    </div>
                  </td>
                  {/* Progression dans le thème en cours — pas sur le catalogue entier. */}
                  <td className="px-4 py-3">
                    {p.aucunThemeActive ? (
                      <span className="text-xs font-bold text-amber-600">Aucun thème activé</span>
                    ) : (
                      <>
                        <div className="text-sm font-bold text-gray-700">{p.faites}/{p.total} leçons</div>
                        <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden w-24">
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: lvl.color }} />
                        </div>
                        {p.rangTheme && (
                          <div className="text-[11px] text-gray-400 font-medium mt-1">
                            Thème {p.rangTheme} sur {p.themesDuNiveau}
                          </div>
                        )}
                      </>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.themeCourant ? (
                      <div className="flex flex-col items-start gap-1">
                        <span className="inline-flex items-center gap-1 text-xs font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded-full">
                          📚 {p.themeCourant}
                        </span>
                        {p.termine ? (
                          <span className="text-[11px] font-bold text-emerald-600">✓ Thème terminé</span>
                        ) : p.prochaineLecon ? (
                          <span className="text-[11px] text-gray-400">Prochaine : {p.prochaineLecon}</span>
                        ) : null}
                        {p.horsParcours > 0 && (
                          <span className="text-[11px] font-bold text-gray-400"
                            title="Leçons travaillées dans des thèmes qui ne lui sont pas activés — elles ne comptent pas dans sa progression.">
                            ⚠ {p.horsParcours} leçon{p.horsParcours > 1 ? "s" : ""} hors parcours
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-amber-600">Aucun thème activé</span>
                    )}
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
