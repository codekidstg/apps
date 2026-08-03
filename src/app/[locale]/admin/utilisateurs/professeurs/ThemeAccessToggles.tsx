"use client";

import { useState, useTransition } from "react";
import { toggleThemeAccess } from "./theme-access-actions";

type Theme = { id: string; title: string; level: string };

type Props = {
  studentId: string;
  studentName: string;
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

export default function ThemeAccessToggles({ studentId, studentName, themes, activeThemeIds }: Props) {
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
  const levelOrder = ["explorer", "builder", "architect"];

  return (
    <div className="mt-3 space-y-3">
      <div className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
        <span>📚 Thèmes accessibles</span>
        {pending && <span className="text-[9px] text-blue-400 animate-pulse">Sauvegarde…</span>}
      </div>

      {levelOrder.filter(l => byLevel[l]?.length).map(level => {
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
                    {/* Toggle pill */}
                    <div className={`relative w-8 h-4 rounded-full shrink-0 transition-colors ${on ? "bg-brand-navy" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all ${on ? "left-4.5 translate-x-0.5" : "left-0.5"}`} />
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

      {themes.length === 0 && (
        <p className="text-xs text-gray-400 italic">Aucun thème publié disponible.</p>
      )}
    </div>
  );
}
