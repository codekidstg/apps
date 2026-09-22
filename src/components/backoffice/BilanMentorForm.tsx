"use client";

import { useActionState, useState } from "react";
import { enregistrerBilan, type ResultatBilan } from "@/lib/backoffice/bilans-actions";

/**
 * Le point de fin de mois, écrit par la direction sur la fiche du mentor.
 *
 * La note calculée n'est pas un champ : elle est recalculée côté serveur à
 * l'enregistrement, et figée là. Ici on ne saisit que ce qui vient de
 * l'entretien — l'ajustement et sa raison, les points forts, ce qui est à
 * améliorer, ce qui est décidé.
 *
 * Les types sont écrits à la main : ce composant tourne dans le navigateur et
 * ne peut pas importer `bilans.ts`, qui ouvre la base.
 */

const INITIAL: ResultatBilan = {};
const MAX = 10;

type BilanExistant = {
  ajustement: number;
  raisonAjustement: string | null;
  pointsForts: string | null;
  aAmeliorer: string | null;
  decisions: string | null;
  auteur: string | null;
  misAJourLe: string;
};

const champ = "w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-ink focus:border-brand-orange focus:outline-none";

export default function BilanMentorForm({ mentorId, mois, moisLabel, note, bilan }: {
  mentorId: string;
  mois: string;
  moisLabel: string;
  /** La note vivante du mois — null s'il n'y en a pas. */
  note: number | null;
  bilan: BilanExistant | null;
}) {
  const [etat, action, enCours] = useActionState(enregistrerBilan, INITIAL);
  const [ajustement, setAjustement] = useState(String(bilan?.ajustement ?? 0));
  const valeur = Math.trunc(Number(ajustement.replace(",", ".")) || 0);
  const retenue = note === null ? null : Math.max(0, Math.min(100, note + valeur));

  return (
    <form action={action} className="bg-white rounded-2xl border border-cream-border p-5 space-y-4">
      <input type="hidden" name="mentorId" value={mentorId} />
      <input type="hidden" name="mois" value={mois} />

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-black text-ink">Point de fin de mois — {moisLabel}</h2>
        {bilan && (
          <span className="text-[11px] font-bold text-ink-muted">
            Écrit le {new Date(bilan.misAJourLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
            {bilan.auteur ? ` par ${bilan.auteur}` : ""}
          </span>
        )}
      </div>

      <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 space-y-2">
        <div className="text-xs font-bold text-ink-muted">
          Note calculée : <strong className="text-ink">{note === null ? "pas de note ce mois-ci" : `${note} / 100`}</strong>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-black text-ink" htmlFor="ajustement">Votre ajustement</label>
          <input
            id="ajustement" name="ajustement" type="number" min={-MAX} max={MAX} step={1}
            value={ajustement} onChange={(e) => setAjustement(e.target.value)}
            className="w-20 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-black text-ink text-center focus:border-brand-orange focus:outline-none"
          />
          <span className="text-xs font-bold text-ink-muted">points, de −{MAX} à +{MAX}</span>
          {retenue !== null && valeur !== 0 && (
            <span className="text-xs font-black text-ink">→ note retenue : {retenue} / 100</span>
          )}
        </div>
        {valeur !== 0 && (
          <div>
            <label className="block text-[11px] font-black text-ink-muted mb-1" htmlFor="raisonAjustement">
              Pourquoi cet ajustement — obligatoire
            </label>
            <input id="raisonAjustement" name="raisonAjustement" className={champ}
              defaultValue={bilan?.raisonAjustement ?? ""}
              placeholder="Ex. : deux semaines de coupures à Lomé, il a rattrapé toutes ses séances" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-black text-ink-muted mb-1" htmlFor="pointsForts">Ses points forts</label>
          <textarea id="pointsForts" name="pointsForts" rows={2} className={champ}
            defaultValue={bilan?.pointsForts ?? ""} placeholder="Ce qu'il fait bien, et qu'on veut garder" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-ink-muted mb-1" htmlFor="aAmeliorer">À améliorer</label>
          <textarea id="aAmeliorer" name="aAmeliorer" rows={2} className={champ}
            defaultValue={bilan?.aAmeliorer ?? ""} placeholder="Ce qui a coûté des points, dit avec ses mots" />
        </div>
        <div>
          <label className="block text-[11px] font-black text-ink-muted mb-1" htmlFor="decisions">Ce qui est décidé pour le mois prochain</label>
          <textarea id="decisions" name="decisions" rows={2} className={champ}
            defaultValue={bilan?.decisions ?? ""} placeholder="Une ou deux choses précises, vérifiables le mois prochain" />
        </div>
      </div>

      {etat.error && (
        <p className="text-xs font-bold text-red-600">{etat.error}</p>
      )}
      {etat.success && !enCours && (
        <p className="text-xs font-bold text-emerald-700">Point enregistré.</p>
      )}

      <button type="submit" disabled={enCours}
        className="px-5 py-2.5 rounded-xl text-sm font-black text-white disabled:opacity-50"
        style={{ background: "#1B2D5E" }}>
        {enCours ? "Enregistrement…" : bilan ? "Mettre à jour le point" : "Enregistrer le point"}
      </button>
    </form>
  );
}
