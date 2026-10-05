"use client";

import { useState, useTransition } from "react";
import { accepterEngagement } from "@/app/[locale]/prof/engagement-actions";
import { ENGAGEMENT, TITRE_ENGAGEMENT, PHRASE_ACCEPTATION } from "@/lib/prof/engagement";

/**
 * Ce que le mentor voit à sa première connexion, avant tout le reste.
 *
 * Bloquant, et une seule fois. Il est court exprès : un engagement qu'on ne
 * lit pas n'engage personne, et un mur de texte ne se lit jamais. La case à
 * cocher est obligatoire — un bouton seul se clique sans réfléchir.
 */
export default function EcranEngagement() {
  const [lu, setLu] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, demarrer] = useTransition();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div className="bg-card rounded-3xl border border-gray-100 shadow-sm p-8">
        <h1 className="font-display font-black text-2xl text-ink">{TITRE_ENGAGEMENT}</h1>
        <p className="text-sm text-ink-muted mt-2">
          Avant d&apos;accéder aux cours, merci de prendre une minute. Cela ne vous sera demandé qu&apos;une fois.
        </p>

        <div className="mt-6 space-y-5">
          {ENGAGEMENT.map((bloc) => (
            <div key={bloc.titre}>
              <div className="font-black text-sm text-ink">{bloc.titre}</div>
              <p className="text-sm text-ink-muted mt-1 leading-relaxed">{bloc.texte}</p>
            </div>
          ))}
        </div>

        <label className="mt-8 flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={lu}
            onChange={(e) => { setLu(e.target.checked); setErreur(null); }}
            className="mt-0.5 w-5 h-5 shrink-0 accent-emerald-600"
          />
          <span className="text-sm font-bold text-ink">{PHRASE_ACCEPTATION}</span>
        </label>

        {erreur && (
          <p className="mt-3 text-sm font-bold text-red-600">{erreur}</p>
        )}

        <button
          type="button"
          disabled={!lu || enCours}
          onClick={() => demarrer(async () => {
            const r = await accepterEngagement();
            if (r.error) setErreur(r.error);
          })}
          className="mt-6 w-full rounded-2xl px-6 py-3.5 font-black text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: "#047857" }}
        >
          {enCours ? "Enregistrement…" : "Continuer vers mes cours"}
        </button>

        <p className="mt-4 text-xs text-ink-muted text-center">
          La date et l&apos;heure de votre acceptation sont enregistrées.
        </p>
      </div>
    </div>
  );
}
