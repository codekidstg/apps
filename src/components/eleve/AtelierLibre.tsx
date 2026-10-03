"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { sauverAtelier } from "@/app/[locale]/eleve/atelier/actions";
import type { Amorce } from "@/lib/eleve/atelier";
import EcranSortie, { ChoixAppareil, type Appareil } from "./EcranSortie";
import { THEMES, THEME_DEFAUT, type ThemeId } from "@/components/editor/themes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });

/**
 * L'atelier libre — l'établi de l'enfant.
 *
 * Il ne s'ouvre jamais sur une page blanche : soit le dernier code écrit, soit
 * le choix d'une amorce qui tourne déjà. Un enfant de douze ans devant un
 * éditeur vide ne tape rien ; devant trois lignes qui marchent, il en change
 * une pour voir.
 *
 * La sauvegarde part toute seule, deux secondes après la dernière frappe. S'il
 * fallait penser à enregistrer, il perdrait son programme une fois — et ne
 * reviendrait pas.
 */

const DELAI_SAUVEGARDE = 2000;

/**
 * L'appareil et l'habit sont des conforts de lecture, propres à l'enfant et à
 * l'écran qu'il a sous les yeux : ils restent dans son navigateur. Rien à
 * enregistrer en base, rien à synchroniser.
 */
function garder(cle: string, valeur: string) {
  try { localStorage.setItem(cle, valeur); } catch { /* navigation privée */ }
}
function relire<T extends string>(cle: string, defaut: T, valides: readonly T[]): T {
  try {
    const v = localStorage.getItem(cle) as T | null;
    return v && valides.includes(v) ? v : defaut;
  } catch { return defaut; }
}

export default function AtelierLibre({ codeInitial, amorces, modifieLe }: {
  codeInitial: string;
  amorces: Amorce[];
  modifieLe: string | null;
}) {
  const [code, setCode] = useState(codeInitial);
  const [commence, setCommence] = useState(Boolean(codeInitial.trim()));
  const [etat, setEtat] = useState<"repos" | "en_cours" | "garde" | "echec">("repos");
  const [appareil, setAppareil] = useState<Appareil>("telephone");
  const [theme, setTheme] = useState<ThemeId>(THEME_DEFAUT);

  // Relus après le premier rendu : le serveur ne connaît pas le navigateur.
  useEffect(() => {
    setAppareil(relire("atelier.appareil", "telephone", ["telephone", "ordinateur", "console"] as const));
    setTheme(relire("atelier.theme", THEME_DEFAUT, THEMES.map((t) => t.id) as ThemeId[]));
  }, []);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernierSauve = useRef(codeInitial);

  // La sauvegarde suit la frappe, de loin : deux secondes de silence.
  useEffect(() => {
    if (!commence || code === dernierSauve.current) return;
    setEtat("en_cours");
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(async () => {
      const r = await sauverAtelier(code, null);
      dernierSauve.current = code;
      setEtat(r?.error ? "echec" : "garde");
    }, DELAI_SAUVEGARDE);
    return () => { if (minuteur.current) clearTimeout(minuteur.current); };
  }, [code, commence]);

  if (!commence) {
    return (
      <div className="space-y-4">
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          Choisis un programme qui marche déjà. Tu le modifies comme tu veux — ici, rien n&apos;est noté.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {amorces.map((a) => (
            <button key={a.id} type="button"
              onClick={() => { setCode(a.code); setCommence(true); }}
              className="text-left rounded-2xl p-4 transition-colors hover:border-emerald-600"
              style={{ background: "#1e293b", border: "1px solid #334155" }}>
              <div className="text-2xl">{a.emoji}</div>
              <div className="font-black text-white text-sm mt-1.5">{a.titre}</div>
              <div className="text-xs mt-1 leading-relaxed" style={{ color: "#94a3b8" }}>{a.quoi}</div>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => { setCode("# Écris ton programme ici\n"); setCommence(true); }}
          className="text-xs font-bold underline" style={{ color: "#64748b" }}>
          Je préfère partir de rien
        </button>
      </div>
    );
  }

  const motEtat = {
    repos: modifieLe ? `Dernière fois : ${new Date(modifieLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}` : "",
    en_cours: "Enregistrement…",
    garde: "✓ Enregistré",
    echec: "⚠ Pas enregistré — réessaie dans un instant",
  }[etat];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs" style={{ color: "#64748b" }}>
          Ton programme s&apos;enregistre tout seul. Rien n&apos;est noté ici.
        </p>
        <span className="text-xs font-bold" style={{ color: etat === "echec" ? "#fca5a5" : "#64748b" }}>
          {motEtat}
        </span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <ChoixAppareil appareil={appareil} onChange={(a) => { setAppareil(a); garder("atelier.appareil", a); }} />
        <div className="flex flex-wrap gap-1.5">
          {THEMES.map((t) => (
            <button key={t.id} type="button" title={t.nom}
              onClick={() => { setTheme(t.id); garder("atelier.theme", t.id); }}
              className="flex items-center gap-1.5 text-xs font-bold px-2 py-1.5 rounded-xl transition-colors"
              style={t.id === theme
                ? { background: "#1e293b", border: "1px solid #10b981", color: "#6ee7b7" }
                : { background: "transparent", border: "1px solid #334155", color: "#64748b" }}>
              <span className="w-3 h-3 rounded-full shrink-0"
                style={{ background: t.apercu[0], border: `2px solid ${t.apercu[1]}` }} />
              {t.emoji} {t.nom}
            </button>
          ))}
        </div>
      </div>

      <PythonRunner
        key="atelier"
        starterCode={code}
        initialCode={code}
        onCodeChange={setCode}
        libre
        theme={theme}
        rendreSortie={(stdout) => <EcranSortie appareil={appareil} sortie={stdout} />}
      />

      <details className="rounded-2xl" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black" style={{ color: "#94a3b8" }}>
          💡 Repartir d&apos;un autre programme
        </summary>
        <div className="px-4 pb-4 grid gap-2 sm:grid-cols-3">
          {amorces.map((a) => (
            <button key={a.id} type="button" onClick={() => setCode(a.code)}
              className="text-left rounded-xl px-3 py-2 text-xs font-bold transition-colors hover:border-emerald-600"
              style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}>
              {a.emoji} {a.titre}
            </button>
          ))}
        </div>
      </details>
    </div>
  );
}
