"use client";

import { useActionState } from "react";
import { prendreEnCharge, repondre, clore, type Resultat } from "@/lib/contact/actions";
import type { MessageDirection } from "@/lib/contact/boite";

/**
 * Un message de parent, tel que la direction le traite.
 *
 * Les dates arrivent déjà formatées par le serveur : calculer « il y a 3 h »
 * dans le navigateur donnerait un autre texte qu'au rendu serveur, et React
 * jetterait tout le rendu à l'hydratation.
 */

export type LibellesMessage = {
  recu: string;
  depuis: string;
  priseEnCharge: string | null;
  reponse: string | null;
  cloture: string | null;
};

const ETATS: Record<MessageDirection["etat"], { libelle: string; fond: string; texte: string }> = {
  a_traiter:      { libelle: "À traiter",      fond: "#F1F5F9", texte: "#475569" },
  pris_en_charge: { libelle: "Pris en charge", fond: "#EEF1F8", texte: "#1B2D5E" },
  repondu:        { libelle: "Répondu",        fond: "#D1FAE5", texte: "#059669" },
  clos:           { libelle: "Clos",           fond: "#F1F5F9", texte: "#64748B" },
};

const INITIAL: Resultat = {};

export default function CarteMessage({
  message: m, moiId, libelles,
}: {
  message: MessageDirection;
  moiId: string | null;
  libelles: LibellesMessage;
}) {
  const [etatPrise, actionPrise, prisePending]       = useActionState(prendreEnCharge, INITIAL);
  const [etatReponse, actionReponse, reponsePending] = useActionState(repondre, INITIAL);
  const [etatCloture, actionCloture, cloturePending] = useActionState(clore, INITIAL);

  const ouvert = m.etat === "a_traiter" || m.etat === "pris_en_charge";
  const priseParMoi = !!m.priseEnCharge && m.priseEnCharge.parId === moiId;
  const etat = ETATS[m.etat];

  return (
    <article className={`bg-white rounded-2xl border overflow-hidden ${m.enRetard ? "border-red-200" : "border-cream-border"}`}>
      <header className="px-6 py-4 flex flex-wrap items-start justify-between gap-3 border-b border-cream-border">
        <div className="min-w-0">
          <h3 className="font-black text-ink">{m.sujet}</h3>
          <div className="text-xs text-ink-muted mt-1 flex flex-wrap gap-x-2 gap-y-0.5">
            <span>👤 {m.parentNom}</span>
            {m.enfants.length > 0 && <span>· parent de {m.enfants.join(", ")}</span>}
            <span>· reçu le {libelles.recu} ({libelles.depuis})</span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {m.enRetard && (
            <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-red-100 text-red-700">
              Au-delà des 48 h
            </span>
          )}
          <span className="text-[11px] font-black px-2.5 py-1 rounded-full" style={{ background: etat.fond, color: etat.texte }}>
            {etat.libelle}
          </span>
        </div>
      </header>

      <div className="px-6 py-5 space-y-4">
        <blockquote className="text-sm text-ink whitespace-pre-wrap leading-relaxed border-l-4 border-cream-border pl-4">
          {m.texte}
        </blockquote>

        {ouvert && m.priseEnCharge && (
          <p className="text-xs font-bold text-ink-muted">
            👀 Pris en charge par {priseParMoi ? "vous" : m.priseEnCharge.parNom}
            {libelles.priseEnCharge ? `, ${libelles.priseEnCharge}` : ""}.
          </p>
        )}

        {ouvert && (
          <>
            {!priseParMoi && (
              <form action={actionPrise} className="flex flex-wrap items-center gap-3">
                <input type="hidden" name="id" value={m.id} />
                <button
                  type="submit"
                  disabled={prisePending}
                  className="font-black text-sm px-4 py-2.5 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ background: "#FDB813", color: "#1B2D5E" }}
                >
                  {prisePending ? "Un instant…" : m.priseEnCharge ? "Reprendre ce message" : "Je m'en occupe"}
                </button>
                {etatPrise.error && <p className="text-xs font-bold text-red-600">{etatPrise.error}</p>}
              </form>
            )}

            <form action={actionReponse} className="space-y-2">
              <input type="hidden" name="id" value={m.id} />
              <label htmlFor={`reponse-${m.id}`} className="block text-xs font-black text-ink-muted uppercase tracking-widest">
                Répondre au parent
              </label>
              <textarea
                id={`reponse-${m.id}`}
                name="reponse"
                rows={4}
                required
                maxLength={4000}
                placeholder="Le parent lira votre réponse sur sa page Contact."
                className="w-full rounded-xl border border-cream-border px-4 py-3 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-[#1B2D5E]/20 focus:border-[#1B2D5E]"
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={reponsePending}
                  className="font-black text-sm text-white px-4 py-2.5 rounded-xl disabled:opacity-60 transition-opacity hover:opacity-90"
                  style={{ background: "#1B2D5E" }}
                >
                  {reponsePending ? "Envoi…" : "Envoyer la réponse"}
                </button>
                {etatReponse.error && <p className="text-xs font-bold text-red-600">{etatReponse.error}</p>}
              </div>
            </form>

            <details>
              <summary className="text-xs font-bold text-ink-muted cursor-pointer hover:text-ink">
                Clore sans réponse écrite — réglé par téléphone ou en séance
              </summary>
              <form action={actionCloture} className="mt-3 space-y-2">
                <input type="hidden" name="id" value={m.id} />
                <input
                  name="note"
                  maxLength={500}
                  placeholder="Ce que le parent verra, par exemple : « Nous vous avons appelé le 15 septembre. »"
                  className="w-full rounded-xl border border-cream-border px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-[#1B2D5E]"
                />
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={cloturePending}
                    className="font-black text-xs px-3 py-2 rounded-xl border border-cream-border text-ink hover:bg-gray-50 disabled:opacity-60"
                  >
                    {cloturePending ? "Un instant…" : "Clore le message"}
                  </button>
                  {etatCloture.error && <p className="text-xs font-bold text-red-600">{etatCloture.error}</p>}
                </div>
              </form>
            </details>
          </>
        )}

        {m.reponse && (
          <div className="rounded-xl p-4 space-y-1.5" style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
            <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#059669" }}>
              💬 Réponse de {m.reponse.parNom}{libelles.reponse ? ` · ${libelles.reponse}` : ""}
            </div>
            <p className="text-sm text-ink whitespace-pre-wrap">{m.reponse.texte}</p>
            <p className="text-xs font-bold text-ink-muted">
              {m.reponse.vueLe ? "✓ Lue par le parent" : "Pas encore lue par le parent"}
            </p>
          </div>
        )}

        {!m.reponse && m.cloture && (
          <div className="rounded-xl p-4 bg-gray-50 border border-cream-border space-y-1">
            <div className="text-xs font-black uppercase tracking-widest text-ink-muted">
              ✅ Clos{libelles.cloture ? ` · ${libelles.cloture}` : ""}
            </div>
            {m.cloture.note && <p className="text-sm text-ink">{m.cloture.note}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
