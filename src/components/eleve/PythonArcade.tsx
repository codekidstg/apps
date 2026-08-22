"use client";
import { useState, useRef } from "react";
import dynamic from "next/dynamic";
import type { GameConfig, Rule } from "@/app/[locale]/atelier/AtelierGame";

const CodeEditor   = dynamic(() => import("../editor/CodeEditor"), { ssr: false });
const AtelierGame  = dynamic(() => import("@/app/[locale]/atelier/AtelierGame"), { ssr: false });

export type ArcadeConfig = {
  title?: string;
  instructions?: string;
  starter_code?: string;
  /** Score à atteindre pour valider le défi. Sans lui, jouer suffit. */
  objectif_score?: number;
};

/** Noms d'univers en français → identifiants du moteur. */
const UNIVERS: Record<string, string> = {
  espace: "space", jungle: "jungle", ocean: "ocean",
  océan: "ocean", volcan: "volcano",
};

let workerInstance: Worker | null = null;
function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), { type: "module" });
  }
  return workerInstance;
}

/**
 * Valeurs par défaut + API du jeu, exécutées avant le code de l'enfant.
 * Un programme incomplet donne donc quand même un jeu jouable — on ne bloque
 * jamais un débutant sur une variable oubliée.
 */
const PRELUDE = `
vitesse = 3
obstacles = 3
taille = 2
univers = "espace"
vaisseau = "🚀"
nom = "Mon Jeu"
_regles = []

def accelere_a(seuil):
    """Les obstacles accelerent a partir de ce score."""
    _regles.append({"id": "score_boost", "condition": "score_boost",
                    "action": "speed_up", "value": int(seuil)})
`;

const COLLECT = ["vitesse", "obstacles", "taille", "univers", "vaisseau", "nom", "_regles"];

/** Ramène une valeur dans 1..5 et signale ce qui a été corrigé. */
function borne(v: unknown, nom: string, avertis: string[]): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) { avertis.push(`${nom} n'est pas un nombre — j'ai mis 3.`); return 3; }
  if (n < 1) { avertis.push(`${nom} était à ${n} : le minimum est 1.`); return 1; }
  if (n > 5) { avertis.push(`${nom} était à ${n} : le maximum est 5.`); return 5; }
  return n;
}

export default function PythonArcade({
  config, done, onSolved, savedCode, onCodeChange,
}: {
  config: ArcadeConfig;
  done: boolean;
  onSolved: () => void;
  savedCode?: string;
  onCodeChange?: (c: string) => void;
}) {
  const [code, setCode]       = useState(savedCode ?? config.starter_code ?? `vitesse = 3\nobstacles = 3\nunivers = "espace"\n`);
  const [status, setStatus]   = useState<"idle" | "loading" | "running">("idle");
  const [erreur, setErreur]   = useState<string | null>(null);
  const [avertis, setAvertis] = useState<string[]>([]);
  const [jeu, setJeu]         = useState<GameConfig | null>(null);
  const [meilleur, setMeilleur] = useState(0);
  const [reussi, setReussi]   = useState(done);
  const cle = useRef(0);

  function construis() {
    if (status !== "idle") return;
    setStatus("loading");
    setErreur(null);
    setAvertis([]);

    const worker = getWorker();
    const id = Math.random().toString(36).slice(2);

    function onMessage(e: MessageEvent) {
      if (e.data.id !== id) return;
      if (e.data.type === "loading") { setStatus("running"); return; }
      worker.removeEventListener("message", onMessage);
      setStatus("idle");

      if (e.data.type === "error") { setErreur(String(e.data.error ?? "")); setJeu(null); return; }

      const c = e.data.collected ?? {};
      const w: string[] = [];

      const univers = String(c.univers ?? "espace").toLowerCase().trim();
      if (!UNIVERS[univers]) {
        w.push(`« ${univers} » n'est pas un univers connu. Essaie espace, jungle, ocean ou volcan.`);
      }

      const regles = Array.isArray(c._regles) ? (c._regles as Rule[]) : [];

      cle.current += 1;
      setAvertis(w);
      setJeu({
        avatar: String(c.vaisseau ?? "🚀").slice(0, 4),
        name:   String(c.nom ?? "Mon Jeu").slice(0, 30),
        speed:        borne(c.vitesse, "vitesse", w),
        obstacles:    borne(c.obstacles, "obstacles", w),
        obstacleSize: borne(c.taille, "taille", w),
        theme:  UNIVERS[univers] ?? "space",
        rules: [
          { id: "collision", condition: "collision", action: "lose_life" },
          { id: "no_lives",  condition: "no_lives",  action: "game_over" },
          { id: "loop",      condition: "loop",      action: "continue"  },
          ...regles,
        ],
      });
      setAvertis(w);
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, type: "run", code, prelude: PRELUDE, collect: COLLECT });
  }

  function finPartie(score: number) {
    setMeilleur(m => Math.max(m, score));
    if (config.objectif_score && score >= config.objectif_score && !reussi) {
      setReussi(true);
      onSolved();
    } else if (!config.objectif_score && !reussi) {
      setReussi(true);
      onSolved();
    }
  }

  const occupe = status !== "idle";

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🕹️</span>
        <span className="font-black text-white">{config.title ?? "Programme ton jeu"}</span>
        {reussi && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>
        )}
      </div>

      {config.instructions && <p className="text-sm text-slate-300">{config.instructions}</p>}

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 min-w-0 space-y-3">
          <CodeEditor
            value={code}
            onChange={(c: string) => { setCode(c); onCodeChange?.(c); }}
            language="python"
            minHeight="200px"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={construis} disabled={occupe}
              className="bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-colors">
              {occupe ? "…" : "🎮 Construire mon jeu"}
            </button>
            {meilleur > 0 && (
              <span className="text-xs font-mono text-slate-400">Meilleur score : <strong className="text-orange-400">{meilleur}</strong></span>
            )}
            {config.objectif_score && (
              <span className="text-xs font-mono text-slate-500">Objectif : {config.objectif_score} pts</span>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 leading-relaxed">
            vitesse · obstacles · taille (1 à 5) · univers · vaisseau · nom<br />
            accelere_a(score) — les obstacles accélèrent à partir de ce score
          </div>

          {erreur && (
            <div className="rounded-xl px-4 py-3 font-mono text-xs whitespace-pre-wrap"
              style={{ background: "#7f1d1d40", border: "1px solid #991b1b", color: "#fca5a5" }}>
              {erreur}
            </div>
          )}

          {avertis.length > 0 && (
            <div className="rounded-xl px-4 py-3 text-xs space-y-1"
              style={{ background: "#78350f40", border: "1px solid #b45309", color: "#fcd34d" }}>
              {avertis.map((a, i) => <div key={i}>⚠️ {a}</div>)}
            </div>
          )}
        </div>

        <div className="lg:w-[420px] shrink-0">
          {jeu ? (
            <AtelierGame key={cle.current} config={jeu} onGameOver={finPartie} />
          ) : (
            <div className="rounded-2xl h-full min-h-[220px] flex items-center justify-center text-center px-6"
              style={{ background: "#0f172a", border: "1px dashed #334155" }}>
              <p className="text-sm text-slate-500">
                Écris tes réglages, puis clique sur <strong className="text-orange-400">Construire mon jeu</strong>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
