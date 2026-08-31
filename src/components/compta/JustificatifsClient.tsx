"use client";

import { useState } from "react";

type Mentor = { id: string; nom: string };
type Ligne  = { date: string; titre: string; eleve: string | null; duree: number; montant: number; paye: boolean };
type Recap  = {
  reference: string; mentor: string; moisLabel: string;
  tarif: { rate_fcfa: number; rate_type: string } | null;
  lignes: Ligne[]; sansRapport: number; total: number; totalDejaPaye: number; totalEnLettres: string;
} | null;

const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
const fcfa = (n: number) => n.toLocaleString("fr-FR") + " F";

/**
 * Sélection mentor + mois, récapitulatif, puis génération du PDF.
 *
 * Le récapitulatif affiche exactement ce que le document contiendra — y
 * compris les séances écartées faute de compte rendu. Le bouton reste
 * inactif tant qu'il n'y a rien à justifier : mieux vaut ne pas produire de
 * pièce que d'en produire une vide.
 */
export default function JustificatifsClient({
  mentors, recap, mentorId: mentorInitial, mois, annee, base,
}: {
  mentors: Mentor[]; recap: Recap; mentorId: string; mois: number; annee: number; base: string;
}) {
  // L'état part de l'URL : sans ça le sélecteur retombait sur « — Choisir — »
  // après rechargement, et le lien de génération partait sans mentor.
  const [mentorId, setMentorId] = useState(mentorInitial);
  const [m, setM] = useState(mois);
  const [a, setA] = useState(annee);

  const params = new URLSearchParams({ teacher: mentorId, month: String(m), year: String(a) });
  const lien = `/api/compta/justificatif?${params}`;

  function recharger(next: { mentor?: string; mois?: number; annee?: number }) {
    const q = new URLSearchParams({
      mentor: next.mentor ?? mentorId,
      month:  String(next.mois  ?? m),
      year:   String(next.annee ?? a),
    });
    window.location.href = `${base}?${q}`;
  }

  const pretARG = !!recap && recap.lignes.length > 0;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-cream-border p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mentor</label>
            <select
              value={mentorId}
              onChange={e => { setMentorId(e.target.value); recharger({ mentor: e.target.value }); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-ink bg-white focus:outline-none focus:border-brand-orange"
            >
              <option value="">— Choisir —</option>
              {mentors.map(x => <option key={x.id} value={x.id}>{x.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Mois</label>
            <select value={m} onChange={e => { setM(+e.target.value); recharger({ mois: +e.target.value }); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-ink bg-white focus:outline-none focus:border-brand-orange">
              {MOIS.map((lib, i) => <option key={i} value={i + 1}>{lib}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Année</label>
            <select value={a} onChange={e => { setA(+e.target.value); recharger({ annee: +e.target.value }); }}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-ink bg-white focus:outline-none focus:border-brand-orange">
              {[annee - 1, annee, annee + 1].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!mentorId && (
        <div className="bg-white rounded-2xl border border-cream-border px-6 py-12 text-center">
          <div className="text-3xl mb-2">🧾</div>
          <p className="font-bold text-gray-500 text-sm">Choisissez un mentor pour voir ses séances validées.</p>
        </div>
      )}

      {mentorId && !recap && (
        <div className="bg-white rounded-2xl border border-cream-border px-6 py-12 text-center">
          <p className="font-bold text-gray-500 text-sm">Aucune séance pour ce mentor sur cette période.</p>
        </div>
      )}

      {recap && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Carte valeur={String(recap.lignes.length)} libelle="Séances validées" ton="ok" />
            <Carte valeur={String(recap.sansRapport)} libelle="Sans compte rendu" ton={recap.sansRapport ? "alerte" : "muet"} />
            <Carte valeur={fcfa(recap.total)} libelle="Montant à justifier" ton="ok" />
            <Carte valeur={fcfa(recap.totalDejaPaye)} libelle="Déjà marqué payé" ton="muet" />
          </div>

          {recap.sansRapport > 0 && (
            <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3.5 text-sm text-amber-900">
              <b>{recap.sansRapport} séance{recap.sansRapport > 1 ? "s" : ""}</b> sans compte rendu {recap.sansRapport > 1 ? "sont" : "est"} exclue{recap.sansRapport > 1 ? "s" : ""} du
              montant. Le justificatif le mentionne explicitement.
            </div>
          )}

          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="px-5 py-3 border-b border-cream-border flex items-center justify-between">
              <span className="font-black text-ink text-sm">Détail — {recap.moisLabel}</span>
              <span className="text-xs font-mono text-gray-400">{recap.reference}</span>
            </div>
            {recap.lignes.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm font-bold text-gray-400">
                Aucune séance validée : rien à justifier.
              </div>
            ) : (
              <div className="divide-y divide-cream-border">
                {recap.lignes.map((l, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs text-gray-400 font-semibold w-24 shrink-0 tabular-nums">
                      {new Date(l.date + "T00:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-ink truncate">{l.titre}</div>
                      <div className="text-xs text-gray-400 truncate">{l.eleve ?? "—"} · {l.duree} min</div>
                    </div>
                    {l.paye && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 shrink-0">payé</span>}
                    <span className="text-sm font-black text-ink shrink-0 tabular-nums">{fcfa(l.montant)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-brand-navy rounded-2xl px-6 py-5">
            <div>
              <div className="text-2xl font-black text-white tabular-nums">{fcfa(recap.total)}</div>
              <div className="text-xs text-white/50 italic mt-0.5">{recap.totalEnLettres} francs CFA</div>
            </div>
            <a
              href={pretARG ? lien : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!pretARG}
              className={`px-5 py-3 rounded-xl text-sm font-black transition-opacity ${
                pretARG ? "bg-brand-orange text-white hover:opacity-90" : "bg-white/10 text-white/30 pointer-events-none"
              }`}
            >
              🧾 Générer le justificatif
            </a>
          </div>
        </>
      )}
    </div>
  );
}

function Carte({ valeur, libelle, ton }: { valeur: string; libelle: string; ton: "ok" | "alerte" | "muet" }) {
  const couleur = ton === "ok" ? "text-brand-navy" : ton === "alerte" ? "text-amber-600" : "text-gray-300";
  return (
    <div className="bg-white rounded-2xl border border-cream-border p-4">
      <div className={`text-xl font-black tabular-nums ${couleur}`}>{valeur}</div>
      <div className="text-[11px] font-bold text-gray-400 mt-1">{libelle}</div>
    </div>
  );
}
