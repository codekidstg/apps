"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  createChapter, updateChapter, deleteChapter,
  createLesson, updateLesson, deleteLesson,
  submitForReview, forkTheme, updateThemeStatus,
} from "../actions";
import { useRouter } from "next/navigation";

type LessonStatus = "draft" | "validated" | "published" | "archived";
type Lesson  = { id: string; title: string; xp_reward: number; order_index: number; estimated_minutes: number | null; status: LessonStatus };
type Chapter = { id: string; title: string; description: string | null; order_index: number; estimated_minutes: number | null; lessons: Lesson[] };
type Theme   = { id: string; title: string; description: string | null; level: string; status: string; version: number; estimated_hours: number | null };
type Props   = { theme: Theme; chapters: Chapter[]; canEdit: boolean; userId: string };

const ic = "w-full border border-slate-200 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white";

const LESSON_STATUS: Record<LessonStatus, { label: string; dot: string; text: string; bg: string }> = {
  draft:     { label: "Brouillon", dot: "bg-slate-400",   text: "text-slate-600",   bg: "bg-slate-100" },
  validated: { label: "À valider", dot: "bg-amber-400",   text: "text-amber-700",   bg: "bg-amber-50" },
  published: { label: "Publiée",   dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  archived:  { label: "Archivée",  dot: "bg-gray-300",    text: "text-gray-400",    bg: "bg-gray-100" },
};

const THEME_STATUS_OPTIONS = [
  { value: "draft",     label: "Brouillon",  color: "text-slate-600"   },
  { value: "validated", label: "À valider",  color: "text-amber-600"   },
  { value: "published", label: "Publié",     color: "text-emerald-600" },
  { value: "archived",  label: "Archivé",    color: "text-gray-400"    },
];

// ── Inline editable text ──────────────────────────────────────────────────────

function InlineEdit({
  value, onSave, placeholder = "…", className = "", inputClass = "",
}: {
  value: string; onSave: (v: string) => Promise<void>;
  placeholder?: string; className?: string; inputClass?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();

  function commit() {
    if (draft.trim() === value) { setEditing(false); return; }
    startTransition(() => {
      onSave(draft.trim() || value).then(() => setEditing(false));
    });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
        disabled={pending}
        className={`${ic} ${inputClass} ${pending ? "opacity-60" : ""}`}
        placeholder={placeholder}
      />
    );
  }

  return (
    <span
      className={`cursor-text hover:bg-orange-50 hover:text-orange-700 rounded px-1 -ml-1 transition-colors ${className}`}
      title="Cliquer pour modifier"
      onClick={() => { setDraft(value); setEditing(true); }}
    >
      {value || <em className="text-slate-400">{placeholder}</em>}
      <span className="ml-1.5 text-[10px] text-slate-300 opacity-0 group-hover:opacity-100">✏️</span>
    </span>
  );
}

// ── Lesson status select ──────────────────────────────────────────────────────

function LessonStatusPill({ lessonId, themeId, current }: { lessonId: string; themeId: string; current: LessonStatus }) {
  const [status, setStatus] = useState<LessonStatus>(current);
  const [pending, startTransition] = useTransition();
  const cfg = LESSON_STATUS[status];

  return (
    <div className="relative flex items-center shrink-0" onClick={e => e.preventDefault()}>
      <div className={`absolute left-2 w-1.5 h-1.5 rounded-full ${cfg.dot} pointer-events-none z-10`} />
      <select
        value={status}
        onChange={e => {
          e.stopPropagation();
          const next = e.target.value as LessonStatus;
          setStatus(next);
          startTransition(() => { updateLesson(lessonId, themeId, { status: next }); });
        }}
        disabled={pending}
        className={`appearance-none pl-5 pr-5 py-1 text-xs font-bold rounded-full border border-transparent cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all
          ${cfg.bg} ${cfg.text} ${pending ? "opacity-60" : "hover:opacity-80"}`}
        style={{ backgroundImage: "none" }}
      >
        {(Object.keys(LESSON_STATUS) as LessonStatus[]).map(s => (
          <option key={s} value={s}>{LESSON_STATUS[s].label}</option>
        ))}
      </select>
      <span className={`absolute right-1.5 text-[9px] pointer-events-none ${cfg.text}`}>▾</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ThemeEditor({ theme, chapters, canEdit }: Props) {
  const router = useRouter();
  const [openChapters, setOpenChapters] = useState<Set<string>>(new Set(chapters.slice(0, 1).map(c => c.id)));
  const [addingChapter, setAddingChapter] = useState(false);
  const [addingLesson, setAddingLesson] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [themeStatus, setThemeStatus] = useState(theme.status);
  const [statusPending, startStatusTransition] = useTransition();

  const totalLessons = chapters.reduce((acc, c) => acc + c.lessons.length, 0);

  function toggleChapter(id: string) {
    setOpenChapters(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  async function handleAddChapter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await createChapter(theme.id, new FormData(e.currentTarget));
    setLoading(false);
    setAddingChapter(false);
    router.refresh();
  }

  async function handleDeleteChapter(chapterId: string) {
    if (!confirm("Supprimer ce chapitre et toutes ses leçons ?")) return;
    await deleteChapter(chapterId, theme.id);
    router.refresh();
  }

  async function handleAddLesson(e: React.FormEvent<HTMLFormElement>, chapterId: string) {
    e.preventDefault();
    setLoading(true);
    const result = await createLesson(chapterId, theme.id, new FormData(e.currentTarget));
    setLoading(false);
    setAddingLesson(null);
    if (result?.id) router.push(`/manager/themes/${theme.id}/lecons/${result.id}`);
    else router.refresh();
  }

  async function handleDeleteLesson(lessonId: string) {
    if (!confirm("Supprimer cette leçon et tout son contenu ?")) return;
    await deleteLesson(lessonId, theme.id);
    router.refresh();
  }

  async function handleSubmitForReview() {
    if (!confirm("Soumettre ce thème pour validation ?")) return;
    setLoading(true);
    const result = await submitForReview(theme.id);
    setLoading(false);
    if (result?.error) { alert(result.error); return; }
    router.refresh();
  }

  async function handleFork() {
    if (!confirm("Créer une nouvelle version (v" + (theme.version + 1) + ") de ce thème ?")) return;
    setLoading(true);
    const result = await forkTheme(theme.id);
    setLoading(false);
    if (result?.id) router.push(`/manager/themes/${result.id}`);
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── Info + actions thème ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
          <div className="space-y-1.5 flex-1 group">
            {theme.description && (
              <p className="text-sm text-slate-500">
                {canEdit ? (
                  <InlineEdit
                    value={theme.description}
                    placeholder="Description du thème"
                    onSave={async (v) => { await updateLesson(theme.id, theme.id, {}); router.refresh(); }}
                    className="text-slate-500"
                  />
                ) : theme.description}
              </p>
            )}
            <div className="flex gap-4 text-xs font-bold text-slate-400">
              <span>{chapters.length} chapitre(s)</span>
              <span>{totalLessons} leçon(s)</span>
              {theme.estimated_hours && <span>~{theme.estimated_hours}h</span>}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 shrink-0 items-center">
            {/* Statut thème */}
            {canEdit && (
              <div className="relative flex items-center">
                <select
                  value={themeStatus}
                  onChange={e => {
                    const next = e.target.value as any;
                    setThemeStatus(next);
                    startStatusTransition(() => { updateThemeStatus(theme.id, next); });
                  }}
                  disabled={statusPending}
                  className={`appearance-none text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 cursor-pointer
                    focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white pr-6
                    ${statusPending ? "opacity-60" : ""}
                    ${themeStatus === "published" ? "text-emerald-700 bg-emerald-50 border-emerald-200" :
                      themeStatus === "validated" ? "text-amber-700 bg-amber-50 border-amber-200" :
                      themeStatus === "archived"  ? "text-gray-400 bg-gray-100 border-gray-200" :
                      "text-slate-600 bg-slate-100 border-slate-200"}`}
                  style={{ backgroundImage: "none" }}
                >
                  {THEME_STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <span className="absolute right-2 text-[10px] text-slate-400 pointer-events-none">▾</span>
              </div>
            )}

            {canEdit && themeStatus === "draft" && (
              <button onClick={handleSubmitForReview} disabled={loading || totalLessons === 0}
                className="bg-brand-blue text-white text-xs font-extrabold px-4 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity">
                Soumettre pour validation →
              </button>
            )}
            {themeStatus === "published" && (
              <button onClick={handleFork} disabled={loading}
                className="border border-brand-blue text-brand-blue text-xs font-extrabold px-4 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                Créer v{theme.version + 1}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Chapitres ── */}
      <div className="space-y-3">
        {chapters.map((chapter, ci) => (
          <div key={chapter.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

            {/* Header chapitre */}
            <div
              className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-slate-50 transition-colors group"
              onClick={() => toggleChapter(chapter.id)}
            >
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 text-xs font-black flex items-center justify-center shrink-0">
                {ci + 1}
              </div>

              <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                {canEdit ? (
                  <InlineEdit
                    value={chapter.title}
                    placeholder="Titre du chapitre"
                    className="font-bold text-slate-800 text-sm"
                    onSave={async (v) => { await updateChapter(chapter.id, theme.id, { title: v }); router.refresh(); }}
                  />
                ) : (
                  <span className="font-bold text-slate-800 text-sm">{chapter.title}</span>
                )}
                {chapter.description && (
                  <div className="text-xs text-slate-400 truncate mt-0.5">
                    {canEdit ? (
                      <InlineEdit
                        value={chapter.description}
                        placeholder="Description"
                        className="text-slate-400"
                        onSave={async (v) => { await updateChapter(chapter.id, theme.id, { description: v }); router.refresh(); }}
                      />
                    ) : chapter.description}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-bold text-slate-400">{chapter.lessons.length} leçon(s)</span>
                {canEdit && (
                  <button
                    onClick={e => { e.stopPropagation(); handleDeleteChapter(chapter.id); }}
                    className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors text-xs font-bold"
                    title="Supprimer le chapitre"
                  >✕</button>
                )}
                <span className="text-slate-400 text-xs">{openChapters.has(chapter.id) ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Leçons */}
            {openChapters.has(chapter.id) && (
              <div className="border-t border-slate-100">
                {chapter.lessons.map((lesson, li) => (
                  <div key={lesson.id}
                    className="flex items-center gap-3 px-6 py-3 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group/lesson">

                    {/* Numéro */}
                    <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {li + 1}
                    </div>

                    {/* Titre inline éditable */}
                    <div className="flex-1 min-w-0" onClick={e => e.stopPropagation()}>
                      {canEdit ? (
                        <InlineEdit
                          value={lesson.title}
                          placeholder="Titre de la leçon"
                          className="font-semibold text-slate-800 text-sm"
                          onSave={async (v) => { await updateLesson(lesson.id, theme.id, { title: v }); router.refresh(); }}
                        />
                      ) : (
                        <span className="font-semibold text-slate-800 text-sm">{lesson.title}</span>
                      )}
                    </div>

                    {/* XP inline éditable */}
                    <XpEdit
                      lessonId={lesson.id}
                      themeId={theme.id}
                      value={lesson.xp_reward}
                      canEdit={canEdit}
                    />

                    {/* Statut leçon */}
                    <LessonStatusPill lessonId={lesson.id} themeId={theme.id} current={lesson.status ?? "draft"} />

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Link
                        href={`/manager/themes/${theme.id}/lecons/${lesson.id}`}
                        className="text-xs font-bold text-orange-500 opacity-0 group-hover/lesson:opacity-100 transition-opacity px-2 py-1 rounded-lg hover:bg-orange-50"
                      >
                        Éditer →
                      </Link>
                      {canEdit && (
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          className="w-6 h-6 flex items-center justify-center rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors text-xs font-bold opacity-0 group-hover/lesson:opacity-100"
                          title="Supprimer la leçon"
                        >✕</button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Ajouter leçon */}
                {canEdit && (
                  <div className="px-6 py-3 bg-slate-50/60">
                    {addingLesson === chapter.id ? (
                      <form onSubmit={e => handleAddLesson(e, chapter.id)} className="flex gap-2 items-center">
                        <input autoFocus type="text" name="title" required placeholder="Titre de la leçon" className={`${ic} flex-1`} />
                        <input type="number" name="xp_reward" defaultValue={10} min={1} placeholder="XP"
                          className="w-16 border border-slate-200 rounded-xl px-2 py-2 text-sm font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-400" />
                        <button type="submit" disabled={loading}
                          className="bg-orange-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-orange-600 disabled:opacity-50">
                          Ajouter
                        </button>
                        <button type="button" onClick={() => setAddingLesson(null)}
                          className="text-slate-400 text-xs font-bold px-2">Annuler</button>
                      </form>
                    ) : (
                      <button onClick={() => setAddingLesson(chapter.id)}
                        className="text-xs font-bold text-blue-500 hover:text-blue-700 transition-colors flex items-center gap-1">
                        + Ajouter une leçon
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Ajouter chapitre ── */}
      {canEdit && (
        <div>
          {addingChapter ? (
            <form onSubmit={handleAddChapter} className="bg-white rounded-2xl border-2 border-dashed border-orange-300 p-6 space-y-3">
              <div className="font-bold text-sm text-slate-700 mb-2">Nouveau chapitre</div>
              <input type="text" name="title" required autoFocus placeholder="Titre du chapitre" className={ic} />
              <input type="text" name="description" placeholder="Description (optionnel)" className={ic} />
              <div className="flex gap-3">
                <button type="submit" disabled={loading}
                  className="bg-orange-500 text-white font-bold text-sm px-5 py-2 rounded-xl hover:bg-orange-600 disabled:opacity-50">
                  {loading ? "…" : "Créer le chapitre"}
                </button>
                <button type="button" onClick={() => setAddingChapter(false)}
                  className="text-slate-400 font-bold text-sm px-4">Annuler</button>
              </div>
            </form>
          ) : (
            <button onClick={() => setAddingChapter(true)}
              className="w-full py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 font-bold text-sm hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50/30 transition-all">
              + Ajouter un chapitre
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── XP inline edit ────────────────────────────────────────────────────────────

function XpEdit({ lessonId, themeId, value, canEdit }: { lessonId: string; themeId: string; value: number; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [current, setCurrent] = useState(value);
  const [pending, startTransition] = useTransition();

  function commit() {
    const n = parseInt(draft);
    if (!isNaN(n) && n > 0 && n !== current) {
      setCurrent(n);
      startTransition(() => { updateLesson(lessonId, themeId, { xp_reward: n }); });
    }
    setEditing(false);
  }

  if (!canEdit) return <span className="text-xs text-slate-400 shrink-0">{current} XP</span>;

  if (editing) {
    return (
      <input autoFocus type="number" min={1} value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === "Enter") commit(); if (e.key === "Escape") setEditing(false); }}
        disabled={pending}
        className="w-16 text-xs font-bold text-center border border-orange-400 rounded-lg px-1 py-0.5 focus:outline-none shrink-0"
      />
    );
  }

  return (
    <span
      onClick={e => { e.stopPropagation(); setDraft(String(current)); setEditing(true); }}
      className="text-xs font-bold text-slate-400 cursor-pointer hover:text-orange-500 hover:bg-orange-50 px-1.5 py-0.5 rounded transition-colors shrink-0"
      title="Cliquer pour modifier les XP"
    >
      {current} XP
    </span>
  );
}
