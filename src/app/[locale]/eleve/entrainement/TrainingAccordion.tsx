"use client";

import { useState } from "react";
import CarteExercice from "@/components/eleve/CarteExercice";

type Training = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  attempts: number;
  best_score: number | null;
  last_completed_at: string | null;
  /** 1 je m'échauffe · 2 je m'entraîne · 3 je me dépasse. Null : exercice du parcours. */
  palier?: number | null;
};

type LessonGroup = {
  lessonId: string;
  lessonTitle: string;
  lessonCompletedAt: string | null;
  trainings: Training[];
};

type ThemeGroup = {
  themeId: string;
  themeTitle: string;
  themeLevel: string;
  lessons: LessonGroup[];
};

type Props = {
  groups: ThemeGroup[];
  defaultOpenLessonId: string | null;
};

const LEVEL_META: Record<string, { icon: string; color: string; label: string }> = {
  explorer:  { icon: "🌱", color: "#10b981", label: "Explorateur" },
  builder:   { icon: "🔨", color: "#a78bfa", label: "Bâtisseur" },
  architect: { icon: "🏛️", color: "#60a5fa", label: "Architecte" },
};

export default function TrainingAccordion({ groups, defaultOpenLessonId }: Props) {
  // Thème ouvert si contient la leçon par défaut
  const defaultOpenThemeId = groups.find(g => g.lessons.some(l => l.lessonId === defaultOpenLessonId))?.themeId ?? null;

  const [openThemes,  setOpenThemes]  = useState<Set<string>>(new Set(defaultOpenThemeId ? [defaultOpenThemeId] : []));
  const [openLessons, setOpenLessons] = useState<Set<string>>(new Set(defaultOpenLessonId ? [defaultOpenLessonId] : []));

  function toggleTheme(id: string) {
    setOpenThemes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleLesson(id: string) {
    setOpenLessons(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {groups.map((group) => {
        const meta       = LEVEL_META[group.themeLevel] ?? LEVEL_META.explorer;
        const isThemeOpen = openThemes.has(group.themeId);
        const allTrainings = group.lessons.flatMap(l => l.trainings);
        const themeDone    = allTrainings.filter(t => t.attempts > 0).length;
        const themeTotal   = allTrainings.length;
        const themeHasTodo = themeDone < themeTotal;

        return (
          <div key={group.themeId} className="rounded-2xl overflow-hidden"
            style={{ border: `1px solid ${isThemeOpen ? `${meta.color}30` : "#1e293b"}`, background: "#0f172a" }}>

            {/* ── Header thème ── */}
            <button
              onClick={() => toggleTheme(group.themeId)}
              className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-slate-800/40"
            >
              <span className="text-lg shrink-0">{meta.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="font-black text-white text-sm truncate">{group.themeTitle}</div>
                <div className="text-[10px] font-mono mt-0.5" style={{ color: meta.color }}>{meta.label}</div>
              </div>
              {/* Indicateur non-fait */}
              {!isThemeOpen && themeHasTodo && (
                <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ background: "#FDB813" }} />
              )}
              {/* Compteur */}
              <span className="text-xs font-mono shrink-0" style={{ color: themeDone === themeTotal ? "#10b981" : "#475569" }}>
                {themeDone}/{themeTotal}
              </span>
              {/* Mini progress */}
              <div className="w-14 h-1 rounded-full overflow-hidden shrink-0" style={{ background: "#1e293b" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${themeTotal ? Math.round((themeDone/themeTotal)*100) : 0}%`, background: meta.color }} />
              </div>
              {/* Chevron */}
              <span className="text-xs shrink-0 transition-transform duration-200" style={{
                color: "#334155",
                transform: isThemeOpen ? "rotate(180deg)" : "rotate(0deg)",
              }}>▾</span>
            </button>

            {/* ── Contenu thème : leçons ── */}
            {isThemeOpen && (
              <div className="px-4 pb-4 space-y-2 border-t" style={{ borderColor: "#1e293b" }}>
                {group.lessons.map((lesson) => {
                  const isLessonOpen = openLessons.has(lesson.lessonId);
                  const lessonDone   = lesson.trainings.filter(t => t.attempts > 0).length;
                  const lessonTotal  = lesson.trainings.length;
                  const lessonTodo   = lessonDone < lessonTotal;

                  return (
                    <div key={lesson.lessonId} className="mt-2 rounded-xl overflow-hidden"
                      style={{ border: `1px solid ${isLessonOpen ? "#334155" : "#1a2035"}` }}>

                      {/* Header leçon */}
                      <button
                        onClick={() => toggleLesson(lesson.lessonId)}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-slate-800/30"
                        style={{ background: isLessonOpen ? "#1a2035" : "transparent" }}
                      >
                        <span className="text-sm shrink-0">📖</span>
                        <span className="flex-1 text-xs font-black text-white truncate min-w-0">{lesson.lessonTitle}</span>

                        {/* Dot "à faire" */}
                        {!isLessonOpen && lessonTodo && (
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "#FDB813" }} />
                        )}

                        {/* Summary fermé */}
                        {!isLessonOpen && (
                          <span className="text-[10px] font-mono shrink-0" style={{ color: lessonDone === lessonTotal ? "#10b981" : "#475569" }}>
                            {lessonDone}/{lessonTotal} fait{lessonTotal > 1 ? "s" : ""}
                          </span>
                        )}

                        <span className="text-[10px] shrink-0 transition-transform duration-200" style={{
                          color: "#334155",
                          transform: isLessonOpen ? "rotate(180deg)" : "rotate(0deg)",
                        }}>▾</span>
                      </button>

                      {/* Trainings */}
                      {isLessonOpen && (
                        <div className="px-3 pb-3 pt-1 space-y-2" style={{ background: "#080e1a" }}>
                          {lesson.trainings.map((t) => <CarteExercice key={t.id} t={t} />)}

                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
