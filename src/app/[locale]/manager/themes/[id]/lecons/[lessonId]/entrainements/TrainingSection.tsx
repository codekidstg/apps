"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTraining, deleteTraining } from "../../../../actions";

type Training = { id: string; title: string; description: string | null; xp_reward: number };

type Props = {
  trainings: Training[];
  lessonId: string;
  themeId: string;
};

export default function TrainingSection({ trainings, lessonId, themeId }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [isPending, start] = useTransition();

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await createTraining(lessonId, themeId, fd);
      if (res?.id) {
        setShowForm(false);
        router.refresh();
      }
    });
  }

  async function handleDelete(trainingId: string, title: string) {
    if (!confirm(`Supprimer l'entraînement "${title}" et tous ses blocs ?`)) return;
    start(async () => {
      await deleteTraining(trainingId, lessonId, themeId);
      router.refresh();
    });
  }

  return (
    <div className="mt-10 border-t border-cream-border pt-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black text-ink">💪 Entraînements</h2>
          <p className="text-sm text-ink-muted mt-0.5">
            Exercices optionnels liés à cette leçon — disponibles après le cours, pour toute l&apos;année.
          </p>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-brand-orange text-white font-black px-4 py-2 rounded-xl text-sm hover:opacity-90 transition-opacity"
        >
          {showForm ? "✕ Annuler" : "+ Nouvel entraînement"}
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-cream-border rounded-2xl p-6 mb-4 space-y-4">
          <h3 className="font-black text-ink">Créer un entraînement</h3>
          <div>
            <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Titre *</label>
            <input name="title" required placeholder="Ex: Sprint Python — Variables" className="w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange" />
          </div>
          <div>
            <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">Description</label>
            <textarea name="description" rows={2} placeholder="Ce que l'élève va réviser…" className="w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange resize-none" />
          </div>
          <div>
            <label className="block text-xs font-black text-ink-muted mb-1.5 uppercase tracking-wider">XP Récompense</label>
            <input name="xp_reward" type="number" defaultValue={30} min={10} max={100} className="w-32 border border-cream-border rounded-xl px-3.5 py-2.5 text-sm font-bold text-ink focus:outline-none focus:ring-2 focus:ring-brand-orange" />
          </div>
          <button type="submit" disabled={isPending} className="bg-brand-orange text-white font-black px-6 py-2.5 rounded-xl text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {isPending ? "Création…" : "Créer l'entraînement"}
          </button>
        </form>
      )}

      {/* Training list */}
      {trainings.length === 0 && !showForm && (
        <div className="bg-white border-2 border-dashed border-cream-border rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">💪</div>
          <div className="font-bold text-ink mb-1">Aucun entraînement</div>
          <div className="text-sm text-ink-muted">Créez des exercices de révision liés à cette leçon.</div>
        </div>
      )}

      <div className="space-y-2">
        {trainings.map((t) => (
          <div key={t.id} className="bg-white border border-cream-border rounded-xl flex items-center gap-4 px-5 py-4 hover:bg-cream/50 transition-colors">
            <div className="flex-1 min-w-0">
              <div className="font-bold text-ink text-sm">{t.title}</div>
              {t.description && <div className="text-xs text-ink-muted truncate mt-0.5">{t.description}</div>}
            </div>
            <div className="text-xs font-bold text-brand-orange bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full shrink-0">
              +{t.xp_reward} XP
            </div>
            <Link
              href={`/manager/themes/${themeId}/lecons/${lessonId}/entrainements/${t.id}`}
              className="text-xs font-bold text-brand-orange hover:underline shrink-0"
            >
              Éditer →
            </Link>
            <button
              onClick={() => handleDelete(t.id, t.title)}
              className="text-xs text-red-400 hover:text-red-600 font-bold transition-colors shrink-0"
            >
              Supprimer
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
