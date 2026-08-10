"use client";
import { useEffect, useRef, useState } from "react";
import type { Rule } from "./AtelierGame";

// ─── Hook animation loop ────────────────────────────────────────────────────

function useAnimLoop(
  cb: (ctx: CanvasRenderingContext2D, W: number, H: number, frame: number) => void,
  deps: any[] = []
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef<number>(0);
  const frameRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    frameRef.current = 0;
    function loop() {
      frameRef.current++;
      const W = canvas!.width, H = canvas!.height;
      ctx.clearRect(0, 0, W, H);
      cb(ctx, W, H, frameRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function stars(ctx: CanvasRenderingContext2D, W: number, H: number, count = 30) {
  for (let i = 0; i < count; i++) {
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc((i * 37 + 11) % W, (i * 53 + 7) % H, 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawShip(ctx: CanvasRenderingContext2D, x: number, y: number, scale = 1, color = "#f97316") {
  const s = scale;
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 11 * s, 6 * s, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - 11 * s, y, x + 11 * s, y);
  g.addColorStop(0, color); g.addColorStop(1, "#fb923c");
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 11 * s, y); ctx.lineTo(x + 18 * s, y - 3 * s); ctx.lineTo(x + 18 * s, y + 3 * s); ctx.closePath();
  ctx.fillStyle = "#fb923c"; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 9 * s, y - 3 * s); ctx.lineTo(x - 16 * s, y); ctx.lineTo(x - 9 * s, y + 3 * s);
  ctx.fillStyle = `rgba(251,146,60,0.75)`; ctx.fill();
  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, "#9ca3af"); grad.addColorStop(1, "#374151");
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad; ctx.fill();
  ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.stroke();
}

function overlay(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.font = "bold 12px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("Active pour voir", W / 2, H / 2);
}

// ─── Animations — acceptent large (desktop) ou small (mobile) ───────────────

function AnimCollision({ active, large }: { active: boolean; large?: boolean }) {
  const W = large ? 360 : 220, H = large ? 190 : 110;
  const canvasRef = useAnimLoop((ctx, W, H, f) => {
    const CYCLE = 120, t = f % CYCLE;
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(0, 0, W, H);
    stars(ctx, W, H, large ? 40 : 25);
    const sc = large ? 1.5 : 1;
    const shipX = W * 0.22, shipY = H / 2;
    drawShip(ctx, shipX, shipY, sc);
    const astX = W - W * 0.12 - (t / CYCLE) * (W * 0.65);
    const r = (large ? 20 : 13) * sc;
    drawAsteroid(ctx, astX, H / 2, r);
    const IMPACT = 52 < t && t < 78;
    if (IMPACT) {
      ctx.fillStyle = `rgba(239,68,68,${0.35 * Math.sin((t - 52) / 26 * Math.PI)})`;
      ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        const len = 10 * sc + ((t - 52) / 26) * 18 * sc;
        ctx.beginPath();
        ctx.moveTo(shipX, shipY);
        ctx.lineTo(shipX + Math.cos(angle) * len, shipY + Math.sin(angle) * len);
        ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2 * sc; ctx.stroke();
      }
    }
    const livesLost = IMPACT || t > 68 ? 1 : 0;
    ctx.font = `${large ? 18 : 13}px serif`;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = (3 - i) <= livesLost ? 0.2 : 1;
      ctx.fillText("❤", W - (large ? 24 : 18) - i * (large ? 24 : 18), large ? 24 : 18);
    }
    ctx.globalAlpha = 1;
    if (!active) overlay(ctx, W, H);
  }, [active, large]);
  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full h-full" />;
}

function AnimScoreBoost({ threshold, active, large }: { threshold: number; active: boolean; large?: boolean }) {
  const W = large ? 360 : 220, H = large ? 190 : 110;
  const canvasRef = useAnimLoop((ctx, W, H, f) => {
    const CYCLE = 160, t = f % CYCLE;
    const score = Math.floor((t / CYCLE) * (threshold + 20));
    const boosted = score >= threshold;
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(0, 0, W, H);
    stars(ctx, W, H, large ? 40 : 25);
    const sc = large ? 1.5 : 1;
    const shipY = H / 2 + Math.sin(f * 0.06) * (large ? 22 : 14);
    drawShip(ctx, W * 0.18, shipY, sc);
    const speed = boosted ? 3.5 : 1.4;
    for (let i = 0; i < 2; i++) {
      const ax = W - ((f * speed + i * W * 0.55) % (W + 30));
      const ay = H * 0.28 + i * H * 0.44;
      drawAsteroid(ctx, ax, ay, (large ? 16 : 10) * sc);
    }
    ctx.fillStyle = boosted ? "#fbbf24" : "rgba(255,255,255,0.75)";
    ctx.font = `bold ${large ? 18 : 12}px monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`${score} pts`, large ? 8 : 6, large ? 22 : 16);
    if (boosted) {
      ctx.fillStyle = "rgba(251,191,36,0.12)"; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fbbf24";
      ctx.font = `bold ${large ? 16 : 11}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("⚡ Plus vite !", W / 2, H - (large ? 14 : 10));
    }
    if (!active) overlay(ctx, W, H);
  }, [threshold, active, large]);
  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full h-full" />;
}

function AnimNoLives({ active, large }: { active: boolean; large?: boolean }) {
  const W = large ? 360 : 220, H = large ? 190 : 110;
  const canvasRef = useAnimLoop((ctx, W, H, f) => {
    const CYCLE = 200, t = f % CYCLE;
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(0, 0, W, H);
    stars(ctx, W, H, large ? 40 : 25);
    const sc = large ? 1.5 : 1;
    const hits = [t > 35 ? 1 : 0, t > 80 ? 1 : 0, t > 125 ? 1 : 0];
    const livesLeft = 3 - hits.reduce((a, b) => a + b, 0);
    const gameOver = livesLeft === 0 && t > 140;
    const hitNow = (t > 33 && t < 47) || (t > 78 && t < 92) || (t > 123 && t < 137);
    if (!gameOver) {
      const shipY = H / 2 + Math.sin(f * 0.07) * (large ? 18 : 10);
      if (hitNow) { ctx.fillStyle = "rgba(239,68,68,0.25)"; ctx.fillRect(0, 0, W, H); }
      drawShip(ctx, W * 0.22, shipY, sc, hitNow ? "#ef4444" : "#f97316");
      if (hitNow) drawAsteroid(ctx, W * 0.32, H / 2, (large ? 16 : 11) * sc);
    }
    ctx.font = `${large ? 18 : 13}px serif`;
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < livesLeft ? 1 : 0.15;
      ctx.fillText("❤", W - (large ? 24 : 22) - i * (large ? 24 : 20), large ? 24 : 18);
    }
    ctx.globalAlpha = 1;
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.65)"; ctx.fillRect(0, 0, W, H);
      const alpha = Math.min(1, (t - 140) / 20);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ef4444";
      ctx.font = `bold ${large ? 22 : 17}px sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText("💀 GAME OVER", W / 2, H / 2 + (large ? 8 : 6));
      ctx.globalAlpha = 1;
    }
    if (!active) overlay(ctx, W, H);
  }, [active, large]);
  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full h-full" />;
}

function AnimLoop({ active, large }: { active: boolean; large?: boolean }) {
  const W = large ? 360 : 220, H = large ? 190 : 110;
  const canvasRef = useAnimLoop((ctx, W, H, f) => {
    ctx.fillStyle = "#0a0f1e"; ctx.fillRect(0, 0, W, H);
    stars(ctx, W, H, large ? 40 : 25);
    const CYCLE = 200, t = f % CYCLE;
    const cx = W / 2, cy = H / 2;
    const rx = W * 0.36, ry = H * 0.30;
    const angle = (t / CYCLE) * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(angle) * rx, sy = cy + Math.sin(angle) * ry;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(96,165,250,0.2)"; ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]); ctx.stroke(); ctx.setLineDash([]);
    for (let i = 1; i <= 14; i++) {
      const tp = ((t - i * 2) / CYCLE + 1) % 1;
      const ta = tp * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.arc(cx + Math.cos(ta) * rx, cy + Math.sin(ta) * ry, large ? 2.5 : 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249,115,22,${(1 - i / 14) * 0.65})`; ctx.fill();
    }
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + Math.PI / 2);
    const sc = large ? 1.4 : 1;
    ctx.beginPath(); ctx.ellipse(0, 0, 6 * sc, 10 * sc, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#f97316"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2 * sc, -9 * sc); ctx.lineTo(0, -14 * sc); ctx.lineTo(2 * sc, -9 * sc); ctx.closePath();
    ctx.fillStyle = "#fb923c"; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-2 * sc, 8 * sc); ctx.lineTo(0, 13 * sc); ctx.lineTo(2 * sc, 8 * sc); ctx.closePath();
    ctx.fillStyle = "rgba(251,146,60,0.7)"; ctx.fill();
    ctx.restore();
    const iter = Math.floor(f / CYCLE) + 1;
    ctx.fillStyle = "rgba(96,165,250,0.85)";
    ctx.font = `bold ${large ? 13 : 10}px monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`boucle #${iter}`, large ? 8 : 5, large ? 20 : 14);
    ctx.fillStyle = "rgba(96,165,250,0.6)";
    ctx.font = `${large ? 12 : 10}px sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("🔄 le jeu continue…", W / 2, H - (large ? 12 : 8));
    if (!active) overlay(ctx, W, H);
  }, [active, large]);
  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full h-full" />;
}

// ─── Données règles ─────────────────────────────────────────────────────────

const RULES_DEF = [
  {
    id: "collision", condition: "collision", action: "lose_life", icon: "💥",
    color: { border: "border-red-700", activeBorder: "border-red-500", bg: "bg-red-950/20", activeBg: "bg-red-950/40", badge: "bg-red-500/20 text-red-300", check: "bg-red-500", conceptColor: "text-red-400" },
    title: "SI le vaisseau touche un astéroïde",
    then: "ALORS perdre une vie",
    concept: "condition",
    explain: "C'est une condition. Si A se produit → Alors B arrive. Chaque app que tu connais tourne avec des milliers de conditions comme celle-là.",
  },
  {
    id: "score_boost", condition: "score_boost", action: "speed_up", icon: "⚡",
    color: { border: "border-yellow-700", activeBorder: "border-yellow-500", bg: "bg-yellow-950/20", activeBg: "bg-yellow-950/40", badge: "bg-yellow-500/20 text-yellow-300", check: "bg-yellow-500", conceptColor: "text-yellow-400" },
    title: "SI le score dépasse", then: "ALORS les astéroïdes vont plus vite",
    concept: "comparaison",
    explain: "C'est une comparaison. L'ordinateur vérifie en permanence si le score a passé le seuil que TU as choisi. C'est toi le développeur.",
    hasValue: true, defaultValue: 50,
  },
  {
    id: "no_lives", condition: "no_lives", action: "game_over", icon: "☠️",
    color: { border: "border-purple-700", activeBorder: "border-purple-500", bg: "bg-purple-950/20", activeBg: "bg-purple-950/40", badge: "bg-purple-500/20 text-purple-300", check: "bg-purple-500", conceptColor: "text-purple-400" },
    title: "SI il n'y a plus de vies", then: "ALORS GAME OVER",
    concept: "variable",
    explain: "Les vies sont une variable — un chiffre qui change pendant le jeu. Quand elle atteint zéro, le jeu s'arrête. Sans cette règle, on joue à l'infini.",
  },
  {
    id: "loop", condition: "loop", action: "continue", icon: "🔄",
    color: { border: "border-blue-700", activeBorder: "border-blue-500", bg: "bg-blue-950/20", activeBg: "bg-blue-950/40", badge: "bg-blue-500/20 text-blue-300", check: "bg-blue-500", conceptColor: "text-blue-400" },
    title: "TANT QUE il reste des vies", then: "ALORS continuer le jeu",
    concept: "boucle",
    explain: "C'est une boucle. Le jeu tourne 60 fois par seconde — chaque tour, il vérifie toutes tes règles. Sans boucle, le jeu s'arrête après 1 seule image.",
  },
];

type Props = { rules: Rule[]; onChange: (rules: Rule[]) => void };

// ─── Composant principal ────────────────────────────────────────────────────

export default function AtelierBlocks({ rules, onChange }: Props) {
  const [values, setValues] = useState<Record<string, number>>({ score_boost: 50 });

  const isActive = (id: string) => rules.some(r => r.id === id);

  function toggle(def: typeof RULES_DEF[0]) {
    if (isActive(def.id)) onChange(rules.filter(r => r.id !== def.id));
    else onChange([...rules, { id: def.id, condition: def.condition, action: def.action, value: values[def.id] ?? (def as any).defaultValue }]);
  }

  function updateValue(id: string, v: number) {
    setValues(prev => ({ ...prev, [id]: v }));
    onChange(rules.map(r => r.id === id ? { ...r, value: v } : r));
  }

  function Anim({ id, active, large }: { id: string; active: boolean; large?: boolean }) {
    if (id === "collision")   return <AnimCollision  active={active} large={large} />;
    if (id === "score_boost") return <AnimScoreBoost threshold={values.score_boost ?? 50} active={active} large={large} />;
    if (id === "no_lives")    return <AnimNoLives    active={active} large={large} />;
    if (id === "loop")        return <AnimLoop       active={active} large={large} />;
    return null;
  }

  return (
    <div className="space-y-4">
      {RULES_DEF.map(def => {
        const active = isActive(def.id);
        const c = def.color;

        return (
          <div
            key={def.id}
            className={`rounded-2xl border-2 overflow-hidden transition-all duration-300 ${
              active
                ? `${c.activeBorder} ${c.activeBg} shadow-lg`
                : `${c.border} ${c.bg} opacity-80 hover:opacity-100`
            }`}
          >
            {/* Texte explicatif en haut, pleine largeur */}
            <div className="px-5 pt-4 pb-3 border-b border-white/5 text-xs text-slate-300 leading-relaxed">
              💡 {def.explain}
            </div>

            {/* Bas : titre+bouton à gauche, canvas à droite */}
            <div className="flex flex-col md:flex-row">

              {/* Partie titre + bouton */}
              <div className="flex-1 p-5 space-y-3 flex flex-col justify-between">
                <div className="flex items-start gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{def.icon}</span>
                  <div className="flex-1">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}>
                      {def.concept}
                    </span>
                    <div className="text-base font-black text-white leading-tight mt-1.5">
                      {def.title}
                      {(def as any).hasValue && (
                        <input
                          type="number" min={10} max={200}
                          value={values[def.id] ?? (def as any).defaultValue}
                          onClick={e => e.stopPropagation()}
                          onChange={e => updateValue(def.id, parseInt(e.target.value) || 50)}
                          className="inline-block mx-1.5 w-14 bg-slate-800 border border-slate-600 rounded-lg px-1.5 py-0.5 text-center text-orange-400 font-black text-sm outline-none"
                        />
                      )}
                      {(def as any).hasValue && " pts"}
                    </div>
                    <div className={`text-sm font-bold mt-0.5 ${c.conceptColor}`}>{def.then}</div>
                  </div>
                </div>

                <button
                  onClick={() => toggle(def)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all self-start ml-9 ${
                    active
                      ? `${c.check} text-white shadow-md scale-95`
                      : "bg-slate-700 hover:bg-slate-600 text-white hover:scale-105"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${active ? "border-white bg-white" : "border-slate-400"}`}>
                    {active && <span className="text-[8px] font-black text-slate-900">✓</span>}
                  </div>
                  {active ? "Règle activée ✓" : "Activer cette règle"}
                </button>
              </div>

              {/* Canvas dans le bloc coloré */}
              <div className="md:w-[360px] md:shrink-0 p-4 flex flex-col justify-center">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center mb-2 md:hidden">
                  Ce qui se passe en jeu
                </div>
                <div className="md:hidden">
                  <Anim id={def.id} active={active} />
                </div>
                <div className="hidden md:block">
                  <Anim id={def.id} active={active} large />
                </div>
              </div>

            </div>
          </div>
        );
      })}

      <div className="text-center text-xs text-slate-500 pt-1">
        {rules.length} règle{rules.length > 1 ? "s" : ""} activée{rules.length > 1 ? "s" : ""} · {4 - rules.length} restante{4 - rules.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
