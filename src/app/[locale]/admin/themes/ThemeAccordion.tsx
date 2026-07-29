"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import StatusBadge from "@/components/backoffice/StatusBadge";
import type { ContentStatus } from "@/lib/supabase/types";
import { updateLessonStatus, deleteTheme, reorderThemes, type LessonStatus } from "./actions";

export type LessonRow = {
  id: string; title: string; xp_reward: number; order_index: number; status: LessonStatus;
};
export type ChapterRow = { id: string; title: string; order_index: number; lessons: LessonRow[] };
export type ThemeRow = {
  id: string; title: string; level: string; status: string;
  version: number; updated_at: string; order_index: number;
  number?: number | null;
  description?: string | null;
  profiles: { display_name: string } | null;
  chapters: ChapterRow[];
};

const STATUS_CONFIG: Record<LessonStatus, { label: string; color: string; bg: string; dot: string }> = {
  draft:     { label: "Brouillon",  color: "text-slate-600", bg: "bg-slate-100",  dot: "bg-slate-400" },
  validated: { label: "À valider",  color: "text-amber-700", bg: "bg-amber-50",   dot: "bg-amber-400" },
  published: { label: "Publiée",    color: "text-emerald-700", bg: "bg-emerald-50", dot: "bg-emerald-500" },
  archived:  { label: "Archivée",   color: "text-gray-400",  bg: "bg-gray-100",   dot: "bg-gray-300" },
};
const STATUS_OPTIONS: LessonStatus[] = ["draft", "validated", "published", "archived"];

function LessonStatusSelect({ lessonId, current }: { lessonId: string; current: LessonStatus }) {
  const [status, setStatus] = useState<LessonStatus>(current);
  const [isPending, startTransition] = useTransition();
  const cfg = STATUS_CONFIG[status];

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    e.preventDefault(); e.stopPropagation();
    const next = e.target.value as LessonStatus;
    setStatus(next);
    startTransition(async () => { await updateLessonStatus(lessonId, next); });
  }

  return (
    <div className="relative flex items-center" onClick={e => e.preventDefault()}>
      <div className={`absolute left-2.5 w-1.5 h-1.5 rounded-full ${cfg.dot} pointer-events-none z-10`} />
      <select value={status} onChange={handleChange} disabled={isPending}
        className={`appearance-none pl-6 pr-6 py-1 text-xs font-bold rounded-full border-0 cursor-pointer
          transition-all focus:outline-none focus:ring-2 focus:ring-orange-400
          ${cfg.bg} ${cfg.color} ${isPending ? "opacity-60" : "hover:opacity-80"}`}
        style={{ backgroundImage: "none" }}
      >
        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>)}
      </select>
      <span className={`absolute right-2 text-[10px] pointer-events-none ${cfg.color}`}>▾</span>
    </div>
  );
}

type DragProps = {
  onDragStart: (e: React.DragEvent) => void;
  onDragOver:  (e: React.DragEvent) => void;
  isDragging:  boolean;
};

export function ThemeRows({
  theme, onDelete, drag,
}: {
  theme: ThemeRow;
  onDelete: (id: string) => void;
  drag: DragProps;
}) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lessonCount = theme.chapters.reduce((n, c) => n + c.lessons.length, 0);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    startTransition(async () => { await deleteTheme(theme.id); onDelete(theme.id); });
  }

  return (
    <>
      {/* Ligne principale du thème */}
      <tr
        draggable
        onDragStart={drag.onDragStart}
        onDragOver={drag.onDragOver}
        className="border-b border-cream-border hover:bg-cream/50 transition-colors cursor-pointer select-none"
        style={{ opacity: drag.isDragging ? 0.4 : 1 }}
        onClick={() => setOpen(v => !v)}
      >
        {/* Handle drag */}
        <td className="w-8 pl-3 pr-1 py-4 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing" onClick={e => e.stopPropagation()}>
          <svg width="14" height="20" viewBox="0 0 14 20" fill="currentColor">
            <circle cx="4" cy="4"  r="2"/><circle cx="10" cy="4"  r="2"/>
            <circle cx="4" cy="10" r="2"/><circle cx="10" cy="10" r="2"/>
            <circle cx="4" cy="16" r="2"/><circle cx="10" cy="16" r="2"/>
          </svg>
        </td>

        <td className="px-3 py-4">
          <div className="flex items-center gap-2">
            <span className="text-ink-muted transition-transform duration-200 inline-block" style={{ fontSize: 11, transform: open ? "rotate(90deg)" : "rotate(0deg)" }}>▶</span>
            <div>
              <div className="font-bold text-ink">
                {theme.number != null && (
                  <span className="text-xs font-black text-ink-light mr-1.5">#{theme.number}</span>
                )}
                {theme.title}
              </div>
              {theme.description && (
                <div className="text-xs text-ink-muted mt-0.5 max-w-md leading-snug line-clamp-2">
                  🎯 {theme.description}
                </div>
              )}
              <div className="text-xs text-ink-light mt-0.5">
                v{theme.version} · par {theme.profiles?.display_name ?? "—"} · {lessonCount} leçon{lessonCount !== 1 ? "s" : ""}
              </div>
            </div>
          </div>
        </td>

        <td className="px-5 py-4"><StatusBadge status={theme.status as ContentStatus} /></td>

        <td className="px-5 py-4">
          <span className="text-xs text-ink-light">{new Date(theme.updated_at).toLocaleDateString("fr-FR")}</span>
        </td>

        <td className="px-4 py-4">
          <div className="flex items-center gap-2 justify-end" onClick={e => e.stopPropagation()}>
            <Link href={`/manager/themes/${theme.id}`} className="text-xs font-bold text-brand-orange hover:underline">Gérer →</Link>
            {confirming ? (
              <>
                <button onClick={handleDelete} disabled={isPending}
                  className="text-xs font-bold px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                  {isPending ? "…" : "Confirmer ✓"}
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirming(false); }}
                  className="text-xs font-bold px-2 py-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300">
                  Annuler
                </button>
              </>
            ) : (
              <button onClick={handleDelete}
                className="text-xs font-bold px-2 py-1 rounded text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors">
                🗑
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Lignes chapitres/leçons expandées */}
      {open && (() => {
        let globalIdx = 0;
        return theme.chapters.map(ch => (
          <tr key={ch.id} className="bg-cream/40 border-b border-cream-border last:border-0">
            <td colSpan={5} className="px-5 py-2">
              <div className="py-1">
                <div className="text-xs font-extrabold uppercase tracking-widest text-ink-light mb-1 pl-6">{ch.title}</div>
                {ch.lessons.length === 0 ? (
                  <div className="pl-10 text-xs text-ink-muted italic py-1">Aucune leçon</div>
                ) : ch.lessons.map(lesson => {
                  const n = ++globalIdx;
                  return (
                    <div key={lesson.id} className="flex items-center gap-3 pl-10 pr-4 py-2 rounded-lg hover:bg-white hover:shadow-sm transition-all group">
                      <span className="text-xs text-ink-muted w-4 text-right shrink-0">{n}.</span>
                      <Link href={`/manager/themes/${theme.id}/lecons/${lesson.id}`}
                        className="text-sm font-bold text-ink group-hover:text-brand-orange transition-colors flex-1 min-w-0 truncate">
                        {lesson.title}
                      </Link>
                      <span className="text-xs text-ink-muted shrink-0">{lesson.xp_reward} XP</span>
                      <div className="shrink-0"><LessonStatusSelect lessonId={lesson.id} current={lesson.status ?? "draft"} /></div>
                      <Link href={`/manager/themes/${theme.id}/lecons/${lesson.id}`}
                        className="text-xs font-bold text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        Éditer →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </td>
          </tr>
        ));
      })()}
    </>
  );
}

// ── Liste réordonnabe par niveau ────────────────────────────────────────────
export function SortableThemeList({ themes: initial }: { themes: ThemeRow[] }) {
  const [themes, setThemes] = useState(initial);
  const [, startTransition] = useTransition();
  const dragIdx = useRef<number | null>(null);
  const overIdx = useRef<number | null>(null);

  function onDragStart(idx: number) {
    return (e: React.DragEvent) => {
      dragIdx.current = idx;
      e.dataTransfer.effectAllowed = "move";
    };
  }

  function onDragOver(idx: number) {
    return (e: React.DragEvent) => {
      e.preventDefault();
      if (dragIdx.current === null || dragIdx.current === idx) return;
      overIdx.current = idx;
      const next = [...themes];
      const [moved] = next.splice(dragIdx.current, 1);
      next.splice(idx, 0, moved);
      dragIdx.current = idx;
      setThemes(next);
    };
  }

  function onDragEnd() {
    dragIdx.current = null;
    overIdx.current = null;
    startTransition(async () => { await reorderThemes(themes.map(t => t.id)); });
  }

  function handleDelete(id: string) {
    setThemes(t => t.filter(x => x.id !== id));
  }

  return (
    <tbody onDragEnd={onDragEnd}>
      {themes.map((t, idx) => (
        <ThemeRows
          key={t.id}
          theme={t}
          onDelete={handleDelete}
          drag={{
            onDragStart: onDragStart(idx),
            onDragOver:  onDragOver(idx),
            isDragging:  dragIdx.current === idx,
          }}
        />
      ))}
    </tbody>
  );
}
