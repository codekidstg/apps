"use client";

import { useActionState, useState } from "react";
import { repondreQuestion, reglerEnSeance, type ResultatSimple } from "@/lib/questions/actions";
import { REPONSES_RAPIDES, LIBELLE_RAISON } from "@/lib/questions/raisons";
import type { QuestionAvecEleve } from "@/lib/questions/donnees";
import type { FicheExercice as Fiche } from "@/lib/questions/corrige";
import ContexteQuestion from "./ContexteQuestion";
import FicheExercice from "./FicheExercice";

/**
 * Une question d'élève, telle que son mentor la traite.
 *
 * Ce qui la rend plus utile qu'un message : ce que l'enfant avait fait, côte
 * à côte avec sa question, et l'exercice complet avec sa réponse attendue. Le
 * mentor répond « ton Ramasser est une case trop tôt », pas « tu peux m'en
 * dire plus ? ».
 */

export type LibellesQuestion = { posee: string; depuis: string; reponse: string | null; reglee: string | null };

const ETATS = {
  en_attente: { libelle: "En attente", fond: "#FEF3C7", texte: "#92400E" },
  repondue:   { libelle: "Répondue",   fond: "#D1FAE5", texte: "#059669" },
  reglee:     { libelle: "Réglée",     fond: "#F1F5F9", texte: "#64748B" },
} as const;

const INITIAL: ResultatSimple = {};

export default function CarteQuestion({ question: q, libelles, fiche = null }: {
  question: QuestionAvecEleve;
  libelles: LibellesQuestion;
  /** L'exercice tel qu'il est aujourd'hui, avec sa réponse — null s'il a été réécrit depuis. */
  fiche?: Fiche | null;
}) {
  const [texte, setTexte] = useState("");
  // Une explication de l'exercice, versée à la suite de ce qui est déjà écrit :
  // le mentor la relit et l'ajuste avant d'envoyer.
  const reprendre = (explication: string) =>
    setTexte((t) => (t.trim() ? `${t.trimEnd()}\n\n${explication}` : explication));
  const [etatReponse, actionReponse, reponseEnCours] = useActionState(repondreQuestion, INITIAL);
  const [etatReglage, actionReglage, reglageEnCours] = useActionState(reglerEnSeance, INITIAL);

  const etat = ETATS[q.etat];
  const ouverte = q.etat === "en_attente";
  const { contenu, bloc } = q.contexte;

  return (
    <article className={`bg-white rounded-2xl border overflow-hidden ${q.enRetard ? "border-red-200" : "border-slate-200"}`}>
      <header className="px-5 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-slate-100">
        <div className="min-w-0">
          <h3 className="font-black text-sm" style={{ color: "#1B2D5E" }}>
            👦 {q.eleveNom} — {LIBELLE_RAISON[q.raison]}
          </h3>
          <div className="text-xs mt-1" style={{ color: "#64748B" }}>
            {contenu?.titre && <span>{contenu.genre === "entrainement" ? "Entraînement" : "Leçon"} « {contenu.titre} »</span>}
            {bloc?.titre && <span> › {bloc.titre}</span>}
            <span> · posée le {libelles.posee} ({libelles.depuis})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {q.enRetard && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700">Au-delà de 48 h</span>
          )}
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ background: etat.fond, color: etat.texte }}>
            {etat.libelle}
          </span>
        </div>
      </header>

      <div className="px-5 py-4 space-y-4">
        {q.message && (
          <blockquote className="text-sm whitespace-pre-wrap leading-relaxed border-l-4 border-slate-200 pl-3" style={{ color: "#1B2D5E" }}>
            {q.message}
          </blockquote>
        )}

        <ContexteQuestion contexte={q.contexte} sansConsigne={!!fiche} />

        {fiche ? (
          // Ouverte d'office tant que l'enfant attend : c'est là que le mentor
          // trouve de quoi répondre.
          <details open={ouverte} className="rounded-xl border border-slate-200 bg-white">
            <summary className="px-3 py-2 text-xs font-black cursor-pointer select-none" style={{ color: "#1B2D5E" }}>
              📘 L&apos;exercice et sa réponse
            </summary>
            <div className="px-3 pb-3">
              <FicheExercice fiche={fiche} onReprendre={ouverte ? reprendre : undefined} />
            </div>
          </details>
        ) : (
          <p className="text-[11px] font-bold" style={{ color: "#94A3B8" }}>
            Cet exercice a été modifié depuis la question : seule sa consigne d&apos;alors reste visible.
          </p>
        )}

        {ouverte && (
          <>
            <form action={actionReponse} className="space-y-2">
              <input type="hidden" name="id" value={q.id} />
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

            <form action={actionReglage} className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
              <input type="hidden" name="id" value={q.id} />
              <input name="note" maxLength={300} placeholder="Note pour l'élève (facultatif)"
                className="flex-1 min-w-[200px] rounded-xl border border-slate-200 px-3 py-2 text-xs focus:outline-none" style={{ color: "#1B2D5E" }} />
              <button type="submit" disabled={reglageEnCours}
                className="font-black text-xs px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-60" style={{ color: "#1B2D5E" }}>
                {reglageEnCours ? "Un instant…" : "✅ Réglé en séance"}
              </button>
              {etatReglage.error && <p className="text-xs font-bold text-red-600 w-full">{etatReglage.error}</p>}
            </form>
          </>
        )}

        {q.reponse && (
          <div className="rounded-xl p-3 space-y-1" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#059669" }}>
              💬 Réponse de {q.reponse.parNom}{libelles.reponse ? ` · ${libelles.reponse}` : ""}
            </div>
            <p className="text-sm whitespace-pre-wrap" style={{ color: "#1B2D5E" }}>{q.reponse.texte}</p>
            <p className="text-[11px] font-bold" style={{ color: "#64748B" }}>
              {q.reponse.vueLe ? "✓ Lue par l'élève" : "Pas encore lue par l'élève"}
            </p>
          </div>
        )}

        {!q.reponse && q.reglee && (
          <div className="rounded-xl p-3 bg-slate-50 border border-slate-200">
            <div className="text-[10px] font-black uppercase tracking-widest" style={{ color: "#64748B" }}>
              ✅ Réglée par {q.reglee.parNom}{libelles.reglee ? ` · ${libelles.reglee}` : ""}
            </div>
            {q.reglee.note && <p className="text-sm mt-1" style={{ color: "#334155" }}>{q.reglee.note}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
