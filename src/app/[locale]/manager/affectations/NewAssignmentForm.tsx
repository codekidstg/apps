"use client";

import { useState } from "react";
import { createAssignment } from "./actions";

type Item = { id: string; name?: string; title?: string; display_name?: string; level?: string };
type Props = { themes: Item[]; classes: Item[]; teachers: Item[] };

const ic = "w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";

export default function NewAssignmentForm({ themes, classes, teachers }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createAssignment(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
  }

  return (
    <>
      <button onClick={() => setOpen(true)}
        className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors">
        + Nouvelle affectation
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h2 className="font-display font-black text-xl text-ink mb-6">Affecter un thème</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Thème (publié) *</label>
                <select name="theme_id" required className={ic}>
                  <option value="">Choisir un thème…</option>
                  {themes.map((t) => (
                    <option key={t.id} value={t.id}>{t.title} · {t.level}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Classe *</label>
                <select name="class_id" required className={ic}>
                  <option value="">Choisir une classe…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Professeur *</label>
                <select name="teacher_id" required className={ic}>
                  <option value="">Choisir un professeur…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Date prévue (optionnel)</label>
                <input type="date" name="scheduled_at" className={ic} />
              </div>
              {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border-2 border-cream-border text-ink-muted font-extrabold text-sm py-2.5 rounded-xl hover:bg-cream">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark disabled:opacity-50">
                  {loading ? "Enregistrement…" : "Affecter"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
