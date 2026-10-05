"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { sauverProgramme, renommerProgramme, basculerPartage } from "@/app/[locale]/eleve/atelier/actions";
import { TITRE_MAX } from "@/lib/eleve/atelier-regles";
import EcranSortie, { ChoixAppareil, type Appareil } from "./EcranSortie";
import { THEMES, THEME_DEFAUT, type ThemeId } from "@/components/editor/themes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });

/**
 * Un programme sur l'établi.
 *
 * La sauvegarde part toute seule, deux secondes après la dernière frappe. S'il
 * fallait penser à enregistrer, l'enfant perdrait son programme une fois — et
 * ne reviendrait pas.
 *
 * Le partage est éteint tant qu'il ne l'allume pas, et s'éteint pour de bon :
 * le lien envoyé la veille ne répond plus.
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

export default function AtelierLibre({ id, titreInitial, codeInitial, jetonInitial, modifieLe, locale }: {
  id: string;
  titreInitial: string;
  codeInitial: string;
  jetonInitial: string | null;
  modifieLe: string;
  locale: string;
}) {
  const [code, setCode] = useState(codeInitial);
  const [titre, setTitre] = useState(titreInitial);
  const [jeton, setJeton] = useState(jetonInitial);
  const [etat, setEtat] = useState<"repos" | "en_cours" | "garde" | "echec">("repos");
  const [appareil, setAppareil] = useState<Appareil>("telephone");
  const [theme, setTheme] = useState<ThemeId>(THEME_DEFAUT);
  const [copie, setCopie] = useState(false);
  const [enCours, demarrer] = useTransition();

  // Relus après le premier rendu : le serveur ne connaît pas le navigateur.
  useEffect(() => {
    setAppareil(relire("atelier.appareil", "telephone", ["telephone", "ordinateur", "console"] as const));
    setTheme(relire("atelier.theme", THEME_DEFAUT, THEMES.map((t) => t.id) as ThemeId[]));
  }, []);

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernierSauve = useRef(codeInitial);

  // La sauvegarde suit la frappe, de loin : deux secondes de silence.
  useEffect(() => {
    if (code === dernierSauve.current) return;
    setEtat("en_cours");
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(async () => {
      const r = await sauverProgramme(id, code, null);
      dernierSauve.current = code;
      setEtat(r?.error ? "echec" : "garde");
    }, DELAI_SAUVEGARDE);
    return () => { if (minuteur.current) clearTimeout(minuteur.current); };
  }, [code, id]);

  const motEtat = {
    repos: `Modifié le ${new Date(modifieLe).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`,
    en_cours: "Enregistrement…",
    garde: "✓ Enregistré",
    echec: "⚠ Pas enregistré — réessaie dans un instant",
  }[etat];

  const lien = jeton ? `${typeof window !== "undefined" ? window.location.origin : ""}/${locale}/p/${jeton}` : null;

  function changerPartage(actif: boolean) {
    demarrer(async () => {
      const r = await basculerPartage(id, actif);
      if (!r.error) { setJeton(r.jeton ?? null); setCopie(false); }
    });
  }

  function copier() {
    if (!lien) return;
    navigator.clipboard?.writeText(lien).then(() => {
      setCopie(true);
      setTimeout(() => setCopie(false), 2500);
    }).catch(() => { /* le lien reste affiché, il peut le recopier */ });
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href={`/${locale}/eleve/atelier`}
          className="text-xs font-black px-3 py-1.5 rounded-xl transition-colors hover:border-emerald-600"
          style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8" }}>
          ← Mes programmes
        </Link>
        <span className="text-xs font-bold" style={{ color: etat === "echec" ? "#fca5a5" : "#64748b" }}>
          {motEtat}
        </span>
      </div>

      {/* Le titre s'écrit sur place : pas de bouton « renommer », pas de boîte. */}
      <input
        value={titre}
        maxLength={TITRE_MAX}
        onChange={(e) => setTitre(e.target.value)}
        onBlur={() => { if (titre.trim() && titre !== titreInitial) renommerProgramme(id, titre); }}
        aria-label="Le nom de ton programme"
        className="w-full bg-transparent text-2xl font-black text-white outline-none rounded-lg px-2 py-1 -ml-2 focus:bg-slate-900"
      />

      <p className="text-xs" style={{ color: "#64748b" }}>
        Ton programme s&apos;enregistre tout seul. Rien n&apos;est noté ici.
      </p>

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
        key={id}
        starterCode={code}
        initialCode={code}
        onCodeChange={setCode}
        libre
        theme={theme}
        rendreSortie={(stdout) => <EcranSortie appareil={appareil} sortie={stdout} titre={titre} />}
      />

      {/* Le partage — éteint tant qu'il ne l'allume pas. */}
      <div className="rounded-2xl px-4 py-3 space-y-2" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        {jeton ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black" style={{ color: "#6ee7b7" }}>
                🔗 Ton programme est partagé
              </span>
              <button type="button" onClick={() => changerPartage(false)} disabled={enCours}
                className="text-xs font-bold hover:underline disabled:opacity-50" style={{ color: "#fca5a5" }}>
                Arrêter le partage
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <code className="flex-1 min-w-0 truncate text-xs font-mono px-3 py-2 rounded-lg"
                style={{ background: "#1e293b", color: "#e2e8f0" }}>
                {lien}
              </code>
              <button type="button" onClick={copier}
                className="text-xs font-black px-3 py-2 rounded-lg shrink-0"
                style={{ background: "#064e3b", color: "#6ee7b7" }}>
                {copie ? "✓ Copié" : "Copier"}
              </button>
            </div>
            <p className="text-xs" style={{ color: "#64748b" }}>
              Envoie ce lien à tes parents : ils pourront y jouer, sans rien installer.
            </p>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              Tu veux le montrer à tes parents ? Partage-le, ils pourront y jouer depuis leur téléphone.
            </p>
            <button type="button" onClick={() => changerPartage(true)} disabled={enCours}
              className="text-xs font-black px-3 py-2 rounded-xl shrink-0 disabled:opacity-50"
              style={{ background: "#1e293b", border: "1px solid #10b981", color: "#6ee7b7" }}>
              🔗 Partager mon programme
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
