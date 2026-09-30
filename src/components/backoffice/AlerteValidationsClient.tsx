"use client";

import { useState, useTransition } from "react";
import { marquerLeconTerminee } from "@/app/[locale]/prof/actions";
import { depuisLisible, type Attente } from "@/lib/lecons/attente-format";

/**
 * Le bouton qui débloque, posé dans l'alerte elle-même.
 *
 * La première version se contentait de constater — « X élèves attendent votre
 * validation » — et renvoyait vers la liste des élèves, où il n'y avait rien à
 * faire. Une alerte qui nomme un blocage sans porter son geste oblige à
 * chercher, et on ne cherche pas : on referme.
 */
export default function AlerteValidationsClient({ attentes }: { attentes: Attente[] }) {
  const [faits, setFaits] = useState<string[]>([]);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState("");
  const [, startTransition] = useTransition();

  const restantes = attentes.filter((a) => !faits.includes(cle(a)));
  if (!restantes.length && !faits.length) return null;

  const chaud = restantes.some((a) => a.jours >= 3);

  return (
    <div className="rounded-2xl px-5 py-4"
      style={{ background: chaud ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${chaud ? "#FECACA" : "#FDE68A"}` }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{chaud ? "⏳" : "✋"}</span>
        <div className="text-sm font-black" style={{ color: chaud ? "#B91C1C" : "#1B2D5E" }}>
          {restantes.length === 0
            ? "Tout est validé"
            : restantes.length === 1
              ? `${restantes[0].eleve} attend votre validation`
              : `${new Set(restantes.map((a) => a.studentId)).size} élèves attendent votre validation`}
        </div>
      </div>

      <div className="space-y-1.5">
        {restantes.map((a) => {
          const id = cle(a);
          return (
            <div key={id} className="flex items-center gap-3 bg-white/70 rounded-xl px-3 py-2">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold truncate" style={{ color: "#1B2D5E" }}>
                  {a.eleve} — « {a.lecon} »
                </div>
                <div className="text-[11px]" style={{ color: a.jours >= 3 ? "#B91C1C" : "#94A3B8" }}>
                  préparée {depuisLisible(a.jours)} · la suivante reste fermée
                </div>
              </div>
              <button
                disabled={enCours !== null}
                onClick={() => {
                  setErreur("");
                  setEnCours(id);
                  startTransition(async () => {
                    const r = await marquerLeconTerminee(a.lessonId, a.studentId);
                    if (r?.error) setErreur(r.error); else setFaits((f) => [...f, id]);
                    setEnCours(null);
                  });
                }}
                className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl text-white disabled:opacity-50"
                style={{ background: "#1B2D5E" }}>
                {enCours === id ? "…" : "Valider"}
              </button>
            </div>
          );
        })}
      </div>

      {faits.length > 0 && (
        <p className="text-xs font-bold mt-2" style={{ color: "#059669" }}>
          ✅ {faits.length === 1 ? "1 leçon validée" : `${faits.length} leçons validées`} — les points sont versés,
          la suite est ouverte.
        </p>
      )}
      {erreur && <p className="text-xs font-bold mt-2" style={{ color: "#B91C1C" }}>{erreur}</p>}

      <p className="text-[11px] mt-2" style={{ color: "#94A3B8" }}>
        Valider ici revient au même que cocher « on l&apos;a terminée ensemble » dans un compte rendu.
      </p>
    </div>
  );
}

const cle = (a: Attente) => `${a.studentId}:${a.lessonId}`;
