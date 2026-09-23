"use client";

import { useActionState, useState } from "react";
import { repondreQuestion, clorEchange, type ResultatSimple } from "@/lib/questions/actions";
import { REPONSES_RAPIDES, CLOTURES, type Cloture } from "@/lib/questions/raisons";
import type { FicheExercice as Fiche } from "@/lib/questions/corrige";
import FicheExercice from "./FicheExercice";

/**
 * Chez le mentor, sous un échange qui attend : l'exercice et sa réponse
 * attendue, dont chaque explication se reprend d'un geste, puis de quoi
 * répondre à l'enfant — ou régler la question en séance.
 *
 * Le mentor répond à la dernière question de l'échange : c'est la seule qui
 * attend, un enfant qui redemande sur le même exercice complète celle qui est
 * ouverte.
 */

const INITIAL: ResultatSimple = {};

export default function ReponseMentor({ questionId, fiche, choixEleve }: {
  questionId: string;
  /** L'exercice tel qu'il est aujourd'hui, avec sa réponse — null s'il a été réécrit depuis. */
  fiche: Fiche | null;
  /** Les choix de l'enfant, marqués dans la fiche (voir lib/questions/reponses-eleve.ts). */
  choixEleve: Record<number, number> | null;
}) {
  const [texte, setTexte] = useState("");
  const [etatReponse, actionReponse, reponseEnCours] = useActionState(repondreQuestion, INITIAL);
  const [etatCloture, actionCloture, clotureEnCours] = useActionState(clorEchange, INITIAL);
  // La clôture est repliée : répondre reste le geste normal.
  const [raison, setRaison] = useState<Cloture | null>(null);
  // Une explication de l'exercice, versée à la suite de ce qui est déjà écrit :
  // le mentor la relit et l'ajuste avant d'envoyer.
  const reprendre = (explication: string) =>
    setTexte((t) => (t.trim() ? `${t.trimEnd()}\n\n${explication}` : explication));

  return (
    <div className="space-y-4">
      {fiche ? (
        <details open className="rounded-xl border border-slate-200 bg-white">
          <summary className="px-3 py-2 text-xs font-black cursor-pointer select-none" style={{ color: "#1B2D5E" }}>
            📘 L&apos;exercice et sa réponse
          </summary>
          <div className="px-3 pb-3">
            <FicheExercice fiche={fiche} onReprendre={reprendre} reponsesEleve={choixEleve} />
          </div>
        </details>
      ) : (
        <p className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>
          Cet exercice a été modifié depuis la question : seule sa consigne d&apos;alors reste visible.
        </p>
      )}

      <form action={actionReponse} className="space-y-2">
        <input type="hidden" name="id" value={questionId} />
        <div className="flex flex-wrap gap-2">
          {REPONSES_RAPIDES.map((r) => (
            <button key={r} type="button" onClick={() => setTexte(r)}
              className="text-xs font-bold px-3 py-1.5 rounded-full border border-slate-200 hover:bg-slate-50"
              style={{ color: "#1B2D5E" }}>
              {r}
            </button>
          ))}
        </div>
        <textarea
          name="reponse"
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          rows={3}
          required
          maxLength={2000}
          placeholder="L'élève lira votre réponse sous l'exercice."
          className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B2D5E]"
          style={{ color: "#1B2D5E" }}
        />
        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={reponseEnCours}
            className="font-black text-sm text-white px-4 py-2.5 rounded-xl disabled:opacity-60" style={{ background: "#1B2D5E" }}>
            {reponseEnCours ? "Envoi…" : "Répondre"}
          </button>
          {etatReponse.error && <p className="text-xs font-bold text-red-600">{etatReponse.error}</p>}
        </div>
      </form>

      <details className="pt-1 border-t border-slate-100">
        <summary className="text-xs font-black cursor-pointer select-none py-1" style={{ color: "#64748B" }}>
          Rien à répondre ? Clore l&apos;échange
        </summary>
        <form action={actionCloture} className="mt-2 space-y-2">
          <input type="hidden" name="id" value={questionId} />
          <div className="flex flex-col gap-1.5">
            {CLOTURES.map((c) => (
              <label key={c.id} className="flex items-start gap-2 cursor-pointer rounded-xl px-2.5 py-2 hover:bg-slate-50">
                <input type="radio" name="raison" value={c.id} checked={raison === c.id}
                  onChange={() => setRaison(c.id)} className="mt-0.5 accent-[#1B2D5E]" />
                <span className="min-w-0">
                  <span className="block text-xs font-black" style={{ color: "#1B2D5E" }}>{c.emoji} {c.libelle}</span>
                  <span className="block text-[11px] font-bold" style={{ color: "#94A3B8" }}>{c.aide}</span>
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input name="note" maxLength={300} placeholder="Note pour l'élève (facultatif)"
              className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none" style={{ color: "#1B2D5E" }} />
            <button type="submit" disabled={clotureEnCours || !raison}
              className="font-black text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-40" style={{ color: "#1B2D5E" }}>
              {clotureEnCours ? "Un instant…" : "Clore l'échange"}
            </button>
            {etatCloture.error && <p className="text-xs font-bold text-red-600 w-full">{etatCloture.error}</p>}
          </div>
        </form>
      </details>

    </div>
  );
}
