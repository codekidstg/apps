"use client";

import { useState, useTransition } from "react";
import { toggleThemeAccess } from "./theme-access-actions";

type Theme = { id: string; title: string; level: string };

type Props = {
  studentId: string;
  studentName: string;
  studentLevel: string; // "explorer" | "builder" | "architect"
  themes: Theme[];
  activeThemeIds: Set<string>;
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  explorer:  { bg: "bg-green-50",  text: "text-green-700",  dot: "bg-green-400" },
  builder:   { bg: "bg-blue-50",   text: "text-blue-700",   dot: "bg-blue-400" },
  architect: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-400" },
};

const LEVEL_NAMES: Record<string, string> = {
  explorer: "Explorateur", builder: "Bâtisseur", architect: "Architecte",
};

const LEVEL_ORDER = ["explorer", "builder", "architect"];

export default function ThemeAccessToggles({ studentId, studentName, studentLevel, themes, activeThemeIds }: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<Set<string>>(new Set(activeThemeIds));
  const [pending, startTransition] = useTransition();

  function toggle(themeId: string) {
    const next = new Set(active);
    const activate = !next.has(themeId);
    if (activate) next.add(themeId); else next.delete(themeId);
    setActive(next);
    startTransition(() => toggleThemeAccess(studentId, themeId, activate));
  }

  // Grouper par niveau
  const byLevel: Record<string, Theme[]> = {};
  for (const t of themes) {
    if (!byLevel[t.level]) byLevel[t.level] = [];
    byLevel[t.level].push(t);
  }

  // Niveaux : niveau actuel en premier, puis les autres dans "avancés"
  const currentLevelThemes = byLevel[studentLevel] ?? [];
  const advancedLevels = LEVEL_ORDER.filter(l => l !== studentLevel && byLevel[l]?.length);

  const activeCount = active.size;
  const currentActive = currentLevelThemes.filter(t => active.has(t.id)).length;

  return (
    <div className="mt-2 border border-gray-100 rounded-2xl overflow-hidden">
      {/* Header accordion */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 bg-gray-50 hover:bg-gray-100 transition-colors text-left"
      >
        <span className="text-[10px]">📚</span>
        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex-1">
          Thèmes accessibles
        </span>
        {/* Badge résumé */}
        {activeCount > 0 ? (
          <span className="text-[9px] font-black bg-brand-navy/10 text-brand-navy px-2 py-0.5 rounded-full">
            {activeCount} activé{activeCount > 1 ? "s" : ""}
          </span>
        ) : (
          <span className="text-[9px] text-gray-400">aucun activé</span>
        )}
        {pending && <span className="text-[9px] text-blue-400 animate-pulse">•</span>}
        <span className={`text-gray-400 text-[10px] transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {/* Contenu dépliable */}
      {open && (
        <div className="px-3 py-3 space-y-4 bg-white">

          {/* Niveau actuel de l'élève */}
          <div>
            {(() => {
              const colors = LEVEL_COLORS[studentLevel] ?? LEVEL_COLORS.explorer;
              return (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block ${colors.bg} ${colors.text}`}>
                      {LEVEL_NAMES[studentLevel]} — Niveau actuel
                    </span>
                    <span className="text-[9px] text-gray-400">{currentActive}/{currentLevelThemes.length}</span>
                  </div>
                  <div className="space-y-1">
                    {currentLevelThemes.map(theme => {
                      const on = active.has(theme.id);
                      return (
                        <button
                          key={theme.id}
                          onClick={() => toggle(theme.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                            on
                              ? "bg-brand-navy/5 border border-brand-navy/20 hover:bg-brand-navy/10"
                              : "bg-gray-50 border border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-80"
                          }`}
                        >
                          <div className={`relative w-8 h-4 rounded-full shrink-0 transition-colors ${on ? "bg-brand-navy" : "bg-gray-200"}`}>
                            <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                          </div>
                          <span className={`text-xs font-bold truncate ${on ? "text-gray-800" : "text-gray-400"}`}>
                            {theme.title}
                          </span>
                          {on && <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />}
                        </button>
                      );
                    })}
                    {currentLevelThemes.length === 0 && (
                      <p className="text-xs text-gray-400 italic px-1">Aucun thème à ce niveau.</p>
                    )}
                  </div>
                </>
              );
            })()}
          </div>

          {/* Niveaux avancés (compactés) */}
          {advancedLevels.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors select-none">
                <span className="group-open:rotate-90 transition-transform inline-block">▸</span>
                Niveaux avancés
                {(() => {
                  const advActive = advancedLevels.flatMap(l => byLevel[l]).filter(t => active.has(t.id)).length;
                  return advActive > 0
                    ? <span className="ml-1 text-[9px] font-black bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded-full normal-case tracking-normal">{advActive} activé{advActive > 1 ? "s" : ""}</span>
                    : null;
                })()}
              </summary>
              <div className="mt-2 space-y-3 pl-2 border-l-2 border-gray-100">
                {advancedLevels.map(level => {
                  const colors = LEVEL_COLORS[level] ?? LEVEL_COLORS.explorer;
                  return (
                    <div key={level}>
                      <div className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md inline-block mb-1.5 ${colors.bg} ${colors.text}`}>
                        {LEVEL_NAMES[level]}
                      </div>
                      <div className="space-y-1">
                        {byLevel[level].map(theme => {
                          const on = active.has(theme.id);
                          return (
                            <button
                              key={theme.id}
                              onClick={() => toggle(theme.id)}
                              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-all ${
                                on
                                  ? "bg-brand-navy/5 border border-brand-navy/20 hover:bg-brand-navy/10"
                                  : "bg-gray-50 border border-gray-100 hover:border-gray-200 opacity-60 hover:opacity-80"
                              }`}
                            >
                              <div className={`relative w-8 h-4 rounded-full shrink-0 transition-colors ${on ? "bg-brand-navy" : "bg-gray-200"}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
                              </div>
                              <span className={`text-xs font-bold truncate ${on ? "text-gray-800" : "text-gray-400"}`}>
                                {theme.title}
                              </span>
                              {on && <span className={`ml-auto w-1.5 h-1.5 rounded-full shrink-0 ${colors.dot}`} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

        </div>
      )}
    </div>
  );
}
