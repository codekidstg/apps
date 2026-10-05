"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { creerProgramme, supprimerProgramme } from "@/app/[locale]/eleve/atelier/actions";
import type { Amorce } from "@/lib/eleve/atelier";
import { MAX_PROGRAMMES } from "@/lib/eleve/atelier-regles";

/**
 * Mes programmes — l'étagère de l'enfant.
 *
 * Elle ne s'ouvre jamais sur une page blanche : tant qu'il n'a rien écrit,
 * c'est le choix des amorces qui occupe l'écran. Un enfant de douze ans devant
 * une liste vide et un bouton « Nouveau » ne clique pas ; devant huit
 * programmes qui tournent déjà, il en ouvre un.
 *
 * Le titre vient de l'amorce choisie. Pas de « nommez votre fichier » avant
 * d'avoir écrit une ligne : c'est exactement là qu'un enfant abandonne.
 */

export type Carte = {
  id: string;
  titre: string;
  modifieLe: string;
  partage: boolean;
};

const jour = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

export default function MesProgrammes({ programmes, amorces, locale, apercu = false }: {
  programmes: Carte[];
  amorces: Amorce[];
  locale: string;
  apercu?: boolean;
}) {
  const router = useRouter();
  const [enCours, demarrer] = useTransition();
  const [choix, setChoix] = useState(programmes.length === 0);
  const [aEffacer, setAEffacer] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);

  const plein = programmes.length >= MAX_PROGRAMMES;

  function commencer(titre: string, code: string) {
    setErreur(null);
    demarrer(async () => {
      const r = await creerProgramme(titre, code);
      if (r.error || !r.id) { setErreur(r.error ?? "Le programme n'a pas pu être créé."); return; }
      router.push(`/${locale}/eleve/atelier/${r.id}`);
    });
  }

  function effacer(id: string) {
    setErreur(null);
    demarrer(async () => {
      const r = await supprimerProgramme(id);
      if (r.error) { setErreur(r.error); return; }
      setAEffacer(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {erreur && (
        <p className="text-sm font-bold rounded-xl px-4 py-3"
          style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.4)", color: "#fca5a5" }}>
          {erreur}
        </p>
      )}

      {programmes.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-white">Mes programmes</h2>
            <span className="text-xs font-bold" style={{ color: plein ? "#fdba74" : "#64748b" }}>
              {programmes.length} sur {MAX_PROGRAMMES}
              {plein && " — efface-en un pour en commencer un nouveau"}
            </span>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((p) => (
              <div key={p.id} className="rounded-2xl p-4 flex flex-col gap-2"
                style={{ background: "#1e293b", border: "1px solid #334155" }}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => router.push(`/${locale}/eleve/atelier/${p.id}`)}
                    className="font-black text-white text-sm text-left flex-1 hover:underline">
                    {p.titre}
                  </button>
                  {p.partage && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full shrink-0"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#6ee7b7" }}
                      title="Ce programme a un lien de partage">
                      🔗 partagé
                    </span>
                  )}
                </div>
                <div className="text-xs" style={{ color: "#64748b" }}>Modifié le {jour(p.modifieLe)}</div>

                {aEffacer === p.id ? (
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs font-bold" style={{ color: "#fca5a5" }}>
                      Effacer pour de bon ?
                    </span>
                    <button type="button" onClick={() => effacer(p.id)} disabled={enCours}
                      className="text-xs font-black px-2.5 py-1 rounded-lg disabled:opacity-50"
                      style={{ background: "#7f1d1d", color: "#fecaca" }}>
                      Oui, efface
                    </button>
                    <button type="button" onClick={() => setAEffacer(null)}
                      className="text-xs font-bold" style={{ color: "#94a3b8" }}>
                      Non
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 mt-1">
                    <button type="button" onClick={() => router.push(`/${locale}/eleve/atelier/${p.id}`)}
                      className="text-xs font-black px-3 py-1.5 rounded-xl"
                      style={{ background: "#064e3b", color: "#6ee7b7" }}>
                      ▶ Ouvrir
                    </button>
                    <button type="button" onClick={() => setAEffacer(p.id)}
                      className="text-xs font-bold hover:underline" style={{ color: "#64748b" }}>
                      Effacer
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {!choix && !plein && (
            <button type="button" onClick={() => setChoix(true)}
              className="text-sm font-black px-4 py-2.5 rounded-xl"
              style={{ background: "#1e293b", border: "1px solid #10b981", color: "#6ee7b7" }}>
              ＋ Nouveau programme
            </button>
          )}
        </div>
      )}

      {choix && !plein && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-black text-white">
              {programmes.length === 0 ? "Choisis par quoi commencer" : "Par quoi commences-tu ?"}
            </h2>
            {programmes.length > 0 && (
              <button type="button" onClick={() => setChoix(false)}
                className="text-xs font-bold" style={{ color: "#94a3b8" }}>
                ← Revenir à mes programmes
              </button>
            )}
          </div>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Chacun marche déjà. Tu le modifies comme tu veux — ici, rien n&apos;est noté.
          </p>

          {/* Huit amorces : deux colonnes sur tablette, quatre sur ordinateur.
              Chacune annonce la notion qu'elle fait rencontrer — sans ça, un
              enfant les ouvre au hasard et retombe trois fois sur la même. */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {amorces.map((a) => (
              <button key={a.id} type="button" disabled={enCours || apercu}
                onClick={() => commencer(a.titre, a.code)}
                className="text-left rounded-2xl p-4 flex flex-col gap-1.5 transition-colors hover:border-emerald-600 disabled:opacity-60"
                style={{ background: "#1e293b", border: "1px solid #334155" }}>
                <div className="text-2xl">{a.emoji}</div>
                <div className="font-black text-white text-sm">{a.titre}</div>
                <span className="text-[10px] font-black uppercase tracking-wide self-start px-2 py-0.5 rounded-full"
                  style={{ background: "rgba(16,185,129,0.12)", color: "#6ee7b7" }}>
                  {a.notion}
                </span>
                <div className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>{a.quoi}</div>
              </button>
            ))}
          </div>

          <button type="button" disabled={enCours || apercu}
            onClick={() => commencer("Mon programme", "# Écris ton programme ici\n")}
            className="text-xs font-bold underline disabled:opacity-60" style={{ color: "#64748b" }}>
            Je préfère partir de rien
          </button>
        </div>
      )}

      {apercu && (
        <p className="text-xs font-bold" style={{ color: "#475569" }}>
          👁️ Mode aperçu — rien ne s&apos;enregistre, et aucun programme ne se crée.
        </p>
      )}
    </div>
  );
}
