"use client";

import { useActionState, useState } from "react";
import { poserQuestion, type ResultatQuestion } from "@/lib/questions/actions";
import { RAISONS, LIBELLE_RAISON, ECHECS_AVANT_AIDE, motCloture, type Raison } from "@/lib/questions/raisons";
import type { Question } from "@/lib/questions/donnees";

/**
 * « 🙋 Je bloque ici » — sous chaque exercice.
 *
 * Trois écrans : l'aide que l'exercice contient déjà, puis ce qui bloque, à
 * toucher plutôt qu'à écrire, puis une promesse tenable — « avant ta séance de
 * samedi », jamais « tout de suite ».
 *
 * Le bouton reste discret tant que tout va bien, et se met en avant quand
 * l'enfant échoue plusieurs fois : c'est à ce moment-là qu'il en a besoin.
 */

type Etape = "ferme" | "indice" | "raison";

type Props = {
  cible: { lessonId: string } | { trainingId: string };
  blocId: string;
  indice: { lignes: string[] } | null;
  echecs: number;
  question: Question | null;
  /** Ce que l'enfant a fait jusqu'ici, lu au moment où il demande. */
  capturerTravail: () => string | null;
  apercu?: boolean;
};

const INITIAL: ResultatQuestion = {};

function avantLaSeance(seance: string | null | undefined): string {
  if (!seance) return "dès que possible";
  return seance === "aujourd'hui" ? "avant ta séance d'aujourd'hui" : `avant ta séance de ${seance}`;
}

export default function JeBloqueIci({ cible, blocId, indice, echecs, question, capturerTravail, apercu = false }: Props) {
  const [etape, setEtape] = useState<Etape>("ferme");
  const [raison, setRaison] = useState<Raison | null>(null);
  const [etat, envoyer, envoiEnCours] = useActionState(poserQuestion, INITIAL);
  // La promesse s'affiche une fois par envoi, jusqu'à ce que l'enfant la ferme.
  const [etatVu, setEtatVu] = useState<ResultatQuestion | null>(null);

  if (apercu) {
    return (
      <p className="text-xs font-bold text-right" style={{ color: "#475569" }}>
        🙋 Je bloque ici — ici, l&apos;élève peut poser une question à son mentor (aperçu)
      </p>
    );
  }

  const ouvrir = () => {
    setRaison(null);
    setEtape(indice && !question ? "indice" : "raison");
  };

  // ── La promesse ──
  if (etat.success && etat !== etatVu) {
    return (
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#052e16", border: "1px solid #10b98140" }}>
        <div className="font-black text-white">🙋 C&apos;est parti !</div>
        <p className="text-sm leading-relaxed" style={{ color: "#a7f3d0" }}>
          {etat.promesse?.mentor ?? "Ton mentor"} te répondra {avantLaSeance(etat.promesse?.seance)}.
          En attendant, tu peux passer à l&apos;exercice suivant — tu reviendras ici voir la réponse.
        </p>
        <button
          type="button"
          onClick={() => { setEtatVu(etat); setEtape("ferme"); }}
          className="font-black text-sm px-4 py-2 rounded-xl"
          style={{ background: "#10b981", color: "#022c22" }}
        >
          D&apos;accord
        </button>
      </div>
    );
  }

  // ── Écran 1 : l'aide que l'exercice contient déjà ──
  if (etape === "indice" && indice) {
    return (
      <div className="rounded-2xl p-5 space-y-3" style={{ background: "#1e293b", border: "1px solid #334155" }}>
        <div className="font-black text-white">Avant de demander, relis la mission</div>
        <ul className="space-y-1.5">
          {indice.lignes.map((l, i) => (
            <li key={i} className="text-sm flex gap-2" style={{ color: "#cbd5e1" }}>
              <span className="font-black shrink-0" style={{ color: "#FDB813" }}>{i + 1}.</span>
              <span>{l}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col sm:flex-row gap-2 pt-1">
          <button type="button" onClick={() => setEtape("ferme")}
            className="font-black text-sm px-4 py-2.5 rounded-xl" style={{ background: "#FDB813", color: "#0f172a" }}>
            Je réessaie
          </button>
          <button type="button" onClick={() => setEtape("raison")}
            className="font-bold text-sm px-4 py-2.5 rounded-xl" style={{ border: "1px solid #475569", color: "#cbd5e1" }}>
            J&apos;ai encore besoin d&apos;aide
          </button>
        </div>
      </div>
    );
  }

  // ── Écran 2 : ce qui bloque ──
  if (etape === "raison") {
    return (
      <form action={envoyer} className="rounded-2xl p-5 space-y-3" style={{ background: "#1e293b", border: "1px solid #334155" }}>
        {"lessonId" in cible
          ? <input type="hidden" name="lessonId" value={cible.lessonId} />
          : <input type="hidden" name="trainingId" value={cible.trainingId} />}
        <input type="hidden" name="blockId" value={blocId} />
        <input type="hidden" name="raison" value={raison ?? ""} />
        <input type="hidden" name="essais" value={echecs} />
        <input type="hidden" name="travail" value={capturerTravail() ?? ""} />

        <div className="font-black text-white">
          {question?.etat === "en_attente" ? "Ajouter quelque chose à ta question" : "Qu'est-ce qui te bloque ?"}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RAISONS.map((r) => {
            const choisie = raison === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setRaison(r.id)}
                aria-pressed={choisie}
                className="flex items-center gap-2 text-left text-sm font-bold px-3 py-3 rounded-xl transition-colors"
                style={choisie
                  ? { background: "#FDB81320", border: "1px solid #FDB813", color: "#FDB813" }
                  : { background: "#0f172a", border: "1px solid #334155", color: "#cbd5e1" }}
              >
                <span className="text-lg shrink-0">{r.emoji}</span>
                <span>{r.libelle}</span>
              </button>
            );
          })}
        </div>

        <textarea
          name="message"
          rows={2}
          maxLength={500}
          placeholder="Tu peux ajouter un mot (ce n'est pas obligatoire)"
          className="w-full rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none"
          style={{ background: "#0f172a", border: "1px solid #334155" }}
        />

        {etat.error && etat !== etatVu && (
          <p className="text-sm font-bold" style={{ color: "#fca5a5" }}>{etat.error}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="submit"
            disabled={!raison || envoiEnCours}
            className="font-black text-sm px-4 py-2.5 rounded-xl disabled:opacity-40"
            style={{ background: "#FDB813", color: "#0f172a" }}
          >
            {envoiEnCours ? "Envoi…" : "Envoyer ma question"}
          </button>
          <button type="button" onClick={() => setEtape("ferme")}
            className="font-bold text-sm px-4 py-2.5 rounded-xl" style={{ color: "#94a3b8" }}>
            Annuler
          </button>
        </div>
      </form>
    );
  }

  // ── Fermé : la question déjà posée, ou le bouton ──
  if (question?.etat === "repondue" && question.reponse) {
    return (
      <div className="rounded-2xl p-5 space-y-2" style={{ background: "#052e16", border: "1px solid #10b98140" }}>
        <div className="text-xs font-black uppercase tracking-widest" style={{ color: "#6ee7b7" }}>
          💬 {question.reponse.parNom} t&apos;a répondu
        </div>
        <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{question.reponse.texte}</p>
        <button type="button" onClick={ouvrir} className="text-xs font-bold underline" style={{ color: "#a7f3d0" }}>
          Je bloque encore
        </button>
      </div>
    );
  }

  if (question?.etat === "reglee") {
    return (
      <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2" style={{ background: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-sm" style={{ color: "#cbd5e1" }}>✅ {motCloture(question.reglee?.raison ?? null, question.reglee?.note ?? null)}</p>
        <button type="button" onClick={ouvrir} className="text-xs font-bold underline" style={{ color: "#94a3b8" }}>
          Je bloque encore
        </button>
      </div>
    );
  }

  if (question?.etat === "en_attente") {
    return (
      <div className="rounded-2xl p-4 flex flex-wrap items-center justify-between gap-2" style={{ background: "#1e293b", border: "1px solid #334155" }}>
        <p className="text-sm" style={{ color: "#cbd5e1" }}>
          🙋 Ta question est partie — « {LIBELLE_RAISON[question.raison]} ». Ton mentor va te répondre.
        </p>
        <button type="button" onClick={ouvrir} className="text-xs font-bold underline" style={{ color: "#94a3b8" }}>
          Ajouter quelque chose
        </button>
      </div>
    );
  }

  if (echecs >= ECHECS_AVANT_AIDE) {
    return (
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{ background: "#FDB81312", border: "1px solid #FDB81350" }}>
        <p className="text-sm font-bold" style={{ color: "#FDB813" }}>Tu bloques ? Ton mentor peut t&apos;aider.</p>
        <button type="button" onClick={ouvrir}
          className="font-black text-sm px-4 py-2.5 rounded-xl" style={{ background: "#FDB813", color: "#0f172a" }}>
          🙋 Je bloque ici
        </button>
      </div>
    );
  }

  return (
    <div className="flex justify-end">
      <button type="button" onClick={ouvrir}
        className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-800"
        style={{ color: "#64748b" }}>
        🙋 Je bloque ici
      </button>
    </div>
  );
}
