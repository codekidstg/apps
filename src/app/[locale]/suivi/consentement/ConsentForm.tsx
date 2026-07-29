"use client";
import { useState, useTransition } from "react";
import { saveConsent } from "../actions";

export default function ConsentForm({ studentId, alreadySigned }: { studentId: string; alreadySigned: boolean }) {
  const [checked, setChecked] = useState(false);
  const [done, setDone]       = useState(alreadySigned);
  const [isPending, start]    = useTransition();

  if (done) {
    return (
      <p className="text-emerald-400 text-sm font-bold">
        ✅ Consentement enregistré. Vous pouvez le révoquer en contactant l'administrateur.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-emerald-500"
        />
        <span className="text-sm text-slate-300">
          Je certifie être le parent ou tuteur légal de cet enfant et j'accepte les conditions
          de traitement des données décrites ci-dessus (version v1 — {new Date().toLocaleDateString("fr-FR")}).
        </span>
      </label>
      <button
        disabled={!checked || isPending}
        onClick={() =>
          start(async () => {
            const res = await saveConsent(studentId);
            if (!("error" in res)) setDone(true);
          })
        }
        className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black py-3 rounded-xl text-sm transition-colors"
      >
        {isPending ? "Enregistrement…" : "✅ Signer le consentement"}
      </button>
    </div>
  );
}
