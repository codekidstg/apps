"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import DataTable from "@/components/backoffice/DataTable";
import PageHeader from "@/components/backoffice/PageHeader";
import { createSchool } from "./actions";

type School = { id: string; name: string; city: string | null; country: string; created_at: string };

export default function EcolesPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("schools").select("*").order("name").then(({ data }) => setSchools(data ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createSchool(new FormData(e.currentTarget));
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    setOpen(false);
    // Refresh
    const supabase = createClient();
    const { data } = await supabase.from("schools").select("*").order("name");
    setSchools(data ?? []);
  }

  return (
    <div>
      <PageHeader
        title="Écoles"
        subtitle={`${schools.length} école(s) enregistrée(s)`}
        actions={
          <button
            onClick={() => setOpen(true)}
            className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors"
          >
            + Nouvelle école
          </button>
        }
      />

      <div className="p-8">
        <DataTable
          data={schools}
          emptyText="Aucune école enregistrée."
          columns={[
            { key: "name", label: "Nom", render: (s) => <span className="font-bold text-ink">{s.name}</span> },
            { key: "city", label: "Ville", render: (s) => <span className="text-sm text-ink-muted">{s.city ?? "—"}</span> },
            { key: "country", label: "Pays", render: (s) => <span className="text-sm text-ink-muted">{s.country}</span> },
            {
              key: "created_at", label: "Créée le", width: "120px",
              render: (s) => <span className="text-xs text-ink-light">{new Date(s.created_at).toLocaleDateString("fr-FR")}</span>,
            },
          ]}
        />
      </div>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h2 className="font-display font-black text-xl text-ink mb-6">Nouvelle école</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: "Nom de l'école", name: "name", required: true },
                { label: "Ville",          name: "city" },
                { label: "Pays",           name: "country", placeholder: "Togo" },
              ].map((f) => (
                <div key={f.name}>
                  <label className="block text-xs font-extrabold text-ink-light mb-1.5">{f.label}</label>
                  <input
                    type="text" name={f.name} required={f.required}
                    placeholder={f.placeholder}
                    className="w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  />
                </div>
              ))}
              {error && <p className="text-sm text-red-600 font-bold">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border-2 border-cream-border text-ink-muted font-extrabold text-sm py-2.5 rounded-xl hover:bg-cream">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark disabled:opacity-50">
                  {loading ? "Enregistrement…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
