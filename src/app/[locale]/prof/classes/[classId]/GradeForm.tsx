"use client";

import { useState } from "react";
import { upsertGrade } from "../../actions";

type Props = {
  studentId: string;
  themeId: string;
  existingScore: number | null;
  existingComment: string | null;
};

export default function GradeForm({ studentId, themeId, existingScore, existingComment }: Props) {
  const [score,   setScore]   = useState(existingScore?.toString() ?? "");
  const [comment, setComment] = useState(existingComment ?? "");
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const result = await upsertGrade(fd);
    setSaving(false);
    if (result?.error) { setError(result.error); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const ic = "border border-cream-border rounded-xl px-3 py-2 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <input type="hidden" name="student_id" value={studentId} />
      <input type="hidden" name="theme_id"   value={themeId} />

      <div className="flex flex-col gap-1">
        <label className="text-xs font-extrabold text-ink-light">Note (/100)</label>
        <input
          type="number" name="score" min={0} max={100} step={0.5}
          value={score} onChange={(e) => setScore(e.target.value)}
          placeholder="—" className={`${ic} w-24`}
        />
      </div>

      <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
        <label className="text-xs font-extrabold text-ink-light">Commentaire</label>
        <input
          type="text" name="comment"
          value={comment} onChange={(e) => setComment(e.target.value)}
          placeholder="Ex : Bon travail, à revoir les variables"
          className={`${ic} w-full`}
        />
      </div>

      <button
        type="submit" disabled={saving}
        className="bg-brand-orange text-white text-xs font-extrabold px-4 py-2.5 rounded-xl hover:bg-brand-orange-dark disabled:opacity-50 transition-colors shrink-0"
      >
        {saving ? "…" : saved ? "✓ Enregistré" : "Enregistrer"}
      </button>

      {error && <p className="w-full text-xs text-red-600 font-bold">{error}</p>}
    </form>
  );
}
