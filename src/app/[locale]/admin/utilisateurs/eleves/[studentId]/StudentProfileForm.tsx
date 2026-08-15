"use client";

import { useState, useTransition } from "react";
import { updateStudentProfile } from "./actions";

const GENDERS = [
  { value: "male",   label: "Garçon" },
  { value: "female", label: "Fille"  },
  { value: "other",  label: "Autre"  },
];

const DEVICES = [
  { value: "tablet",   label: "Tablette 📱"        },
  { value: "computer", label: "Ordinateur 💻"       },
  { value: "both",     label: "Les deux 📱💻"        },
  { value: "none",     label: "Aucun appareil 🚫"   },
];

const SCHOOL_LEVELS = [
  "CP","CE1","CE2","CM1","CM2",
  "6ème","5ème","4ème","3ème",
  "Seconde","Première","Terminale",
  "Autre",
];

const OBJECTIVES = [
  { value: "leisure",     label: "🎮 Loisir / passion"          },
  { value: "academic",    label: "📚 Renforcement scolaire"      },
  { value: "tech_career", label: "🚀 Orientation tech / dev"     },
  { value: "competition", label: "🏆 Prépa concours / olympiades" },
];

type Props = {
  studentId: string;
  initial: {
    gender:       string | null;
    birth_year:   number | null;
    device:       string | null;
    school_level: string | null;
    objective:    string | null;
    notes:        string | null;
  };
};

export default function StudentProfileForm({ studentId, initial }: Props) {
  const [saved,    setSaved]   = useState(false);
  const [error,    setError]   = useState<string | null>(null);
  const [pending,  start]      = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false); setError(null);
    const fd = new FormData(e.currentTarget);
    start(async () => {
      const res = await updateStudentProfile(studentId, fd);
      if (res.error) setError(res.error);
      else setSaved(true);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* Section : Identité */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>👤 Identité</h2>
        </div>
        <div className="px-6 py-5 grid grid-cols-2 gap-5">

          {/* Sexe */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Sexe</label>
            <div className="flex gap-2">
              {GENDERS.map(g => (
                <label key={g.value} className="flex-1 cursor-pointer">
                  <input type="radio" name="gender" value={g.value} defaultChecked={initial.gender === g.value} className="sr-only peer" />
                  <div className="text-center px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors peer-checked:bg-brand-navy peer-checked:text-white peer-checked:border-brand-navy hover:border-gray-400">
                    {g.label}
                  </div>
                </label>
              ))}
              <label className="flex-1 cursor-pointer">
                <input type="radio" name="gender" value="" defaultChecked={!initial.gender} className="sr-only peer" />
                <div className="text-center px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors peer-checked:bg-gray-100 peer-checked:text-gray-700 peer-checked:border-gray-300 hover:border-gray-400">
                  —
                </div>
              </label>
            </div>
          </div>

          {/* Année de naissance */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Année de naissance</label>
            <input
              name="birth_year"
              type="number"
              min="2005"
              max={new Date().getFullYear() - 3}
              defaultValue={initial.birth_year ?? ""}
              placeholder="ex : 2015"
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-400 transition-colors"
            />
          </div>

          {/* Niveau scolaire */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Niveau scolaire</label>
            <select
              name="school_level"
              defaultValue={initial.school_level ?? ""}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-400 transition-colors bg-white"
            >
              <option value="">— Non renseigné</option>
              {SCHOOL_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Objectif d&apos;inscription</label>
            <select
              name="objective"
              defaultValue={initial.objective ?? ""}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-400 transition-colors bg-white"
            >
              <option value="">— Non renseigné</option>
              {OBJECTIVES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Section : Équipement */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>🖥️ Équipement à la maison</h2>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-4 gap-3">
            {DEVICES.map(d => (
              <label key={d.value} className="cursor-pointer">
                <input type="radio" name="device" value={d.value} defaultChecked={initial.device === d.value} className="sr-only peer" />
                <div className="text-center px-3 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors peer-checked:bg-indigo-600 peer-checked:text-white peer-checked:border-indigo-600 hover:border-gray-400">
                  {d.label}
                </div>
              </label>
            ))}
            <label className="cursor-pointer">
              <input type="radio" name="device" value="" defaultChecked={!initial.device} className="sr-only peer" />
              <div className="text-center px-3 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-500 transition-colors peer-checked:bg-gray-100 peer-checked:text-gray-700 peer-checked:border-gray-300 hover:border-gray-400">
                — Non renseigné
              </div>
            </label>
          </div>
        </div>
      </div>

      {/* Section : Notes */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>📝 Commentaire interne</h2>
          <p className="text-xs text-gray-400 mt-0.5">Visible uniquement par admin et manager. Contexte, besoins spéciaux, notes pédagogiques…</p>
        </div>
        <div className="px-6 py-5">
          <textarea
            name="notes"
            defaultValue={initial.notes ?? ""}
            rows={4}
            placeholder="ex : Élève timide, besoin d'encouragements. Parle ewé à la maison. Progresse vite en algorithmique."
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 placeholder:text-gray-300 focus:outline-none focus:border-blue-400 transition-colors resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {saved && <span className="text-sm font-bold text-emerald-600">✓ Fiche sauvegardée</span>}
          {error && <span className="text-sm font-bold text-red-500">Erreur : {error}</span>}
        </div>
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 rounded-xl font-black text-sm text-white transition-opacity disabled:opacity-50"
          style={{ background: "#1B2D5E" }}
        >
          {pending ? "Enregistrement…" : "Sauvegarder la fiche"}
        </button>
      </div>
    </form>
  );
}
