"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import { createTheme } from "../actions";

export default function NewThemePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultLevel = searchParams.get("level") ?? "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createTheme(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) setError(result.error);
  }

  return (
    <div>
      <PageHeader
        title="Nouveau thème"
        breadcrumb={[
          { label: "Thèmes & Cours", href: "/manager/themes" },
          { label: "Nouveau" },
        ]}
      />
      <div className="p-8 max-w-2xl">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-border p-8 space-y-5">

          <div>
            <label className="block text-xs font-extrabold text-ink-light mb-1.5">Titre du thème *</label>
            <input
              type="text" name="title" required
              placeholder="ex : Introduction à Python"
              className={inputClass}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-ink-light mb-1.5">Niveau *</label>
            <select name="level" required defaultValue={defaultLevel} className={inputClass}>
              <option value="">Choisir un niveau…</option>
              <option value="explorer">Explorateur (10–12 ans)</option>
              <option value="builder">Bâtisseur (12–15 ans)</option>
              <option value="architect">Architecte (15–18 ans)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-ink-light mb-1.5">Description</label>
            <textarea
              name="description" rows={3}
              placeholder="Ce thème couvre…"
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label className="block text-xs font-extrabold text-ink-light mb-1.5">Durée estimée (heures)</label>
            <input type="number" name="estimated_hours" min={1} max={100} className={inputClass} />
          </div>

          {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="border-2 border-cream-border text-ink-muted font-extrabold text-sm px-6 py-2.5 rounded-xl hover:bg-cream transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit" disabled={loading}
              className="bg-brand-orange text-white font-extrabold text-sm px-6 py-2.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Création…" : "Créer le thème →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass = "w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";
