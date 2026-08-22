"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import {
  CELL, DELTA, DIR_ANGLE, NEXT_DIR, CONFETTI, drawScene,
} from "./mazeCanvas";
import type { ChallengeConfig, Dir } from "./mazeCanvas";

const CodeEditor = dynamic(() => import("../editor/CodeEditor"), { ssr: false });

export type MazeConfig = ChallengeConfig & {
  /** Nombre de lignes visé — sert le score en étoiles. */
  par?: number;
  starter_code?: string;
};

type Move = { kind: "avance" | "gauche" | "droite" | "bloque" };

let workerInstance: Worker | null = null;
function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(new URL("../../workers/pyodide.worker.ts", import.meta.url), { type: "module" });
  }
  return workerInstance;
}

/**
 * Le robot est simulé côté Python : c'est ce qui permet à `mur_devant()` de
 * répondre pendant l'exécution, donc d'écrire de vraies conditions. Le code de
 * l'enfant produit une liste de mouvements, que l'on rejoue ensuite à l'écran.
 */
function prelude(config: MazeConfig): string {
  const murs = JSON.stringify(config.walls.map(w => [w.x, w.y]));
  return `
_murs = set(tuple(m) for m in ${murs})
_taille = ${config.grid_size}
_x, _y = ${config.start.x}, ${config.start.y}
_dir = "${config.start.dir}"
_moves = []
_DELTA = {"N": (0, -1), "E": (1, 0), "S": (0, 1), "W": (-1, 0)}
_GAUCHE = {"N": "W", "E": "N", "S": "E", "W": "S"}
_DROITE = {"N": "E", "E": "S", "S": "W", "W": "N"}

class _TropDePas(Exception):
    pass

def _case_devant():
    dx, dy = _DELTA[_dir]
    return (_x + dx, _y + dy)

def mur_devant():
    nx, ny = _case_devant()
    if nx < 0 or ny < 0 or nx >= _taille or ny >= _taille:
        return True
    return (nx, ny) in _murs

def avance():
    global _x, _y
    if len(_moves) > 400:
        raise _TropDePas()
    if mur_devant():
        _moves.append({"kind": "bloque"})
        return
    nx, ny = _case_devant()
    _x, _y = nx, ny
    _moves.append({"kind": "avance"})

def tourne_gauche():
    global _dir
    if len(_moves) > 400:
        raise _TropDePas()
    _dir = _GAUCHE[_dir]
    _moves.append({"kind": "gauche"})

def tourne_droite():
    global _dir
    if len(_moves) > 400:
        raise _TropDePas()
    _dir = _DROITE[_dir]
    _moves.append({"kind": "droite"})
`;
}

export default function PythonMaze({
  config, done, onSolved, savedCode, onCodeChange,
}: {
  config: MazeConfig;
  done: boolean;
  onSolved: () => void;
  savedCode?: string;
  onCodeChange?: (c: string) => void;
}) {
  const [code, setCode]       = useState(savedCode ?? config.starter_code ?? "avance()\n");
  const [status, setStatus]   = useState<"idle" | "loading" | "running" | "ko" | "ok">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [lignes, setLignes]   = useState(0);
  const [reussi, setReussi]   = useState(done);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const poseRef   = useRef({ x: config.start.x, y: config.start.y, dir: config.start.dir as Dir });
  const [, forceRender] = useState(0);

  const G = config.grid_size;
  const taille = G * CELL;

  const dessine = useCallback((px: number, py: number, rot: number, frame: number) => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    drawScene(ctx, config, px, py, poseRef.current.dir, rot, frame, new Set(), new Set());
  }, [config]);

  // Position de départ au montage et après chaque remise à zéro
  useEffect(() => {
    dessine(config.start.x, config.start.y, DIR_ANGLE[config.start.dir as Dir], 0);
    return () => cancelAnimationFrame(animRef.current);
  }, [dessine, config.start]);

  function reinitialise() {
    cancelAnimationFrame(animRef.current);
    poseRef.current = { x: config.start.x, y: config.start.y, dir: config.start.dir as Dir };
    dessine(config.start.x, config.start.y, DIR_ANGLE[config.start.dir as Dir], 0);
    setMessage(null);
    setStatus("idle");
  }

  /** Rejoue la liste de mouvements produite par le code de l'enfant. */
  function anime(moves: Move[]) {
    let i = 0;
    const suivant = () => {
      if (i >= moves.length) {
        const p = poseRef.current;
        const gagne = p.x === config.goal.x && p.y === config.goal.y;
        setStatus(gagne ? "ok" : "ko");
        setMessage(gagne ? null : "Kirikou n'est pas arrivé à l'étoile. Regarde son trajet et corrige.");
        if (gagne && !reussi) { setReussi(true); onSolved(); }
        return;
      }
      const mv = moves[i++];
      const p  = poseRef.current;

      if (mv.kind === "bloque") {
        setMessage("Kirikou s'est cogné contre un mur. Vérifie sa direction avant d'avancer.");
        dessine(p.x, p.y, DIR_ANGLE[p.dir], 0);
        setStatus("ko");
        return;
      }

      if (mv.kind === "avance") {
        const [dx, dy] = DELTA[p.dir];
        const dep = { x: p.x, y: p.y };
        const arr = { x: p.x + dx, y: p.y + dy };
        const t0 = performance.now();
        const pas = (now: number) => {
          const t = Math.min((now - t0) / 260, 1);
          dessine(dep.x + (arr.x - dep.x) * t, dep.y + (arr.y - dep.y) * t, DIR_ANGLE[p.dir], t);
          if (t < 1) { animRef.current = requestAnimationFrame(pas); }
          else { poseRef.current = { ...arr, dir: p.dir }; suivant(); }
        };
        animRef.current = requestAnimationFrame(pas);
        return;
      }

      // Rotation
      const nouvelle = mv.kind === "gauche" ? NEXT_DIR[p.dir].L : NEXT_DIR[p.dir].R;
      const a0 = DIR_ANGLE[p.dir];
      let a1 = DIR_ANGLE[nouvelle];
      if (a1 - a0 > 180) a1 -= 360;
      if (a1 - a0 < -180) a1 += 360;
      const t0 = performance.now();
      const pas = (now: number) => {
        const t = Math.min((now - t0) / 220, 1);
        dessine(p.x, p.y, a0 + (a1 - a0) * t, 0);
        if (t < 1) { animRef.current = requestAnimationFrame(pas); }
        else { poseRef.current = { ...p, dir: nouvelle }; forceRender(n => n + 1); suivant(); }
      };
      animRef.current = requestAnimationFrame(pas);
    };
    suivant();
  }

  function lance() {
    if (status === "loading" || status === "running") return;
    reinitialise();
    setStatus("loading");
    setLignes(code.split("\n").filter(l => l.trim() && !l.trim().startsWith("#")).length);

    const worker = getWorker();
    const id = Math.random().toString(36).slice(2);

    function onMessage(e: MessageEvent) {
      if (e.data.id !== id) return;
      if (e.data.type === "loading") { setStatus("running"); return; }
      worker.removeEventListener("message", onMessage);

      if (e.data.type === "error") {
        const msg = String(e.data.error ?? "");
        setStatus("ko");
        setMessage(msg.includes("_TropDePas")
          ? "Kirikou tourne en rond — plus de 400 mouvements. Ta boucle ne s'arrête sans doute jamais."
          : msg);
        return;
      }
      const moves = (e.data.collected?._moves ?? []) as Move[];
      if (!moves.length) {
        setStatus("ko");
        setMessage("Ton programme n'a fait bouger Kirikou d'aucune case.");
        return;
      }
      anime(moves);
    }

    worker.addEventListener("message", onMessage);
    worker.postMessage({ id, type: "run", code, prelude: prelude(config), collect: ["_moves"] });
  }

  const etoiles = config.par
    ? (lignes <= config.par ? 3 : lignes <= config.par * 1.6 ? 2 : 1)
    : 0;
  const occupe = status === "loading" || status === "running";

  return (
    <div className="rounded-2xl p-5 space-y-4" style={{ background: "#1e293b", border: "1px solid #334155" }}>
      <div className="flex items-center gap-2">
        <span className="text-xl">🤖</span>
        <span className="font-black text-white">{config.title ?? "Guide Kirikou"}</span>
        {reussi && (
          <span className="ml-auto text-xs font-mono font-black px-2 py-0.5 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98140" }}>✅ Réussi</span>
        )}
      </div>

      {config.instructions && <p className="text-sm text-slate-300">{config.instructions}</p>}

      <div className="flex flex-col lg:flex-row gap-4">
        <canvas
          ref={canvasRef} width={taille} height={taille}
          className="rounded-xl shrink-0 mx-auto"
          style={{ background: "#0f172a", border: "1px solid #334155", maxWidth: "100%" }}
        />
        <div className="flex-1 min-w-0 space-y-3">
          <CodeEditor
            value={code}
            onChange={(c: string) => { setCode(c); onCodeChange?.(c); }}
            language="python"
            minHeight="180px"
          />
          <div className="flex items-center gap-3 flex-wrap">
            <button onClick={lance} disabled={occupe}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-black px-5 py-2.5 rounded-xl transition-colors">
              {occupe ? "…" : "▶ Lancer Kirikou"}
            </button>
            <button onClick={reinitialise} className="text-xs font-bold text-slate-500 hover:text-slate-300">
              ↺ Replacer
            </button>
            {config.par && (
              <span className="text-xs font-mono text-slate-500">
                Objectif : {config.par} lignes
              </span>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 leading-relaxed">
            avance() · tourne_gauche() · tourne_droite() · mur_devant()
          </div>

          {status === "ok" && (
            <div className="rounded-xl px-4 py-3" style={{ background: "#10b98115", border: "1px solid #10b98140" }}>
              <div className="font-black text-sm" style={{ color: "#10b981" }}>
                {CONFETTI[lignes % CONFETTI.length]} Kirikou est arrivé !
              </div>
              {config.par && (
                <div className="text-xs mt-1 font-mono" style={{ color: "#10b981" }}>
                  {lignes} ligne{lignes > 1 ? "s" : ""} · {"⭐".repeat(etoiles)}{"☆".repeat(3 - etoiles)}
                  {etoiles < 3 && ` — peux-tu y arriver en ${config.par} ?`}
                </div>
              )}
            </div>
          )}

          {message && status === "ko" && (
            <div className="rounded-xl px-4 py-3 font-mono text-xs whitespace-pre-wrap"
              style={{ background: "#7f1d1d40", border: "1px solid #991b1b", color: "#fca5a5" }}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
