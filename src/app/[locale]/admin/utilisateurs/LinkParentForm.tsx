"use client";
import { useState, useTransition } from "react";
import { linkParentToStudent } from "./actions";

type User = { id: string; display_name: string; role: string };

export default function LinkParentForm({ users }: { users: User[] }) {
  const [open, setOpen]    = useState(false);
  const [error, setError]  = useState<string | null>(null);
  const [ok, setOk]        = useState(false);
  const [isPending, start] = useTransition();

  const parents  = users.filter((u) => u.role === "parent");
  const students = users.filter((u) => u.role === "student");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await linkParentToStudent(fd.get("parent_id") as string, fd.get("student_id") as string);
      if (res.error) { setError(res.error); return; }
      setOk(true);
      setTimeout(() => { setOpen(false); setOk(false); }, 1500);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-[#1e3a6e] text-white text-sm font-extrabold px-4 py-2.5 rounded-xl hover:bg-[#2a4a8e] transition-colors"
      >
        🔗 Lier parent ↔ enfant
      </button>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h2 className="font-display font-black text-xl text-ink mb-6">Lier un parent à un élève</h2>

            {ok ? (
              <div className="text-center py-4 text-emerald-600 font-black text-lg">✅ Lien créé avec succès !</div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold text-ink-light mb-1.5">Parent</label>
                  <select name="parent_id" required className={sel}>
                    <option value="">Choisir un parent…</option>
                    {parents.map((u) => (
                      <option key={u.id} value={u.id}>{u.display_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-ink-light mb-1.5">Enfant (élève)</label>
                  <select name="student_id" required className={sel}>
                    <option value="">Choisir un élève…</option>
                    {students.map((u) => (
                      <option key={u.id} value={u.id}>{u.display_name}</option>
                    ))}
                  </select>
                </div>

                {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 border-2 border-cream-border text-ink-muted font-extrabold text-sm py-2.5 rounded-xl hover:bg-cream transition-colors">
                    Annuler
                  </button>
                  <button type="submit" disabled={isPending}
                    className="flex-1 bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50">
                    {isPending ? "Liaison…" : "Créer le lien"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const sel = "w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";
