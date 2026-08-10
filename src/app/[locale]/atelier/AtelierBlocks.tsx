"use client";
import { useEffect, useRef, useState } from "react";
import type { Rule } from "./AtelierGame";

// ─── Mini canvas animations ────────────────────────────────────────────────

function useAnimLoop(cb: (ctx: CanvasRenderingContext2D, frame: number) => void, deps: any[] = []) {
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
      ctx.clearRect(0, 0, canvas!.width, canvas!.height);
      cb(ctx, frameRef.current);
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return canvasRef;
}

// ── Animation 1 : Collision ──
function AnimCollision({ active }: { active: boolean }) {
  const W = 220, H = 110;
  const canvasRef = useAnimLoop((ctx, f) => {
    const CYCLE = 120;
    const t = f % CYCLE;

    // Fond
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, W, H);

    // Étoiles fixes
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 37 + 11) % W);
      const sy = ((i * 53 + 7) % H);
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.beginPath(); ctx.arc(sx, sy, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Vaisseau (position fixe à gauche)
    const shipX = 45, shipY = H / 2;
    drawMiniShip(ctx, shipX, shipY, "#f97316");

    // Astéroïde qui arrive depuis la droite
    const astX = W - 20 - (t / CYCLE) * (W - 80);
    const astY = H / 2;
    const r = 14;
    const grad = ctx.createRadialGradient(astX - 3, astY - 3, 2, astX, astY, r);
    grad.addColorStop(0, "#9ca3af"); grad.addColorStop(1, "#374151");
    ctx.beginPath(); ctx.arc(astX, astY, r, 0, Math.PI * 2);
    ctx.fillStyle = grad; ctx.fill();

    // Collision ?
    const dist = Math.abs(astX - shipX);
    const IMPACT = 55 < t && t < 75;

    if (IMPACT) {
      // Flash rouge
      ctx.fillStyle = `rgba(239,68,68,${0.35 * Math.sin((t - 55) / 20 * Math.PI)})`;
      ctx.fillRect(0, 0, W, H);
      // Particules
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const len = 8 + ((t - 55) / 20) * 14;
        ctx.beginPath();
        ctx.moveTo(shipX, shipY);
        ctx.lineTo(shipX + Math.cos(angle) * len, shipY + Math.sin(angle) * len);
        ctx.strokeStyle = "#fb923c"; ctx.lineWidth = 2; ctx.stroke();
      }
    }

    // Vies (❤️ → manque une)
    const livesLost = IMPACT || t > 70 ? 1 : 0;
    for (let i = 0; i < 3; i++) {
      ctx.font = "13px serif";
      ctx.globalAlpha = (3 - i) <= livesLost ? 0.2 : 1;
      ctx.fillText("❤", W - 18 - i * 18, 18);
    }
    ctx.globalAlpha = 1;

    // Label
    if (!active) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active pour voir", W / 2, H / 2);
    }
  }, [active]);

  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full" />;
}

// ── Animation 2 : Score boost ──
function AnimScoreBoost({ threshold, active }: { threshold: number; active: boolean }) {
  const W = 220, H = 110;
  const canvasRef = useAnimLoop((ctx, f) => {
    const CYCLE = 160;
    const t = f % CYCLE;
    const score = Math.floor((t / CYCLE) * (threshold + 15));
    const boosted = score >= threshold;

    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, W, H);

    // Étoiles
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath(); ctx.arc((i * 37 + 11) % W, (i * 53 + 7) % H, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // Vaisseau qui vole
    const shipY = H / 2 + Math.sin(f * 0.06) * 15;
    drawMiniShip(ctx, 35, shipY, "#f97316");

    // Astéroïdes qui arrivent — vitesse selon boost
    const speed = boosted ? 3.5 : 1.4;
    for (let i = 0; i < 2; i++) {
      const ax = W - ((f * speed + i * 110) % (W + 30));
      const ay = 30 + i * 50;
      const gr = ctx.createRadialGradient(ax - 2, ay - 2, 1, ax, ay, 10);
      gr.addColorStop(0, "#9ca3af"); gr.addColorStop(1, "#374151");
      ctx.beginPath(); ctx.arc(ax, ay, 10, 0, Math.PI * 2);
      ctx.fillStyle = gr; ctx.fill();
    }

    // Score HUD
    ctx.fillStyle = boosted ? "#fbbf24" : "rgba(255,255,255,0.7)";
    ctx.font = `bold ${boosted ? 14 : 12}px monospace`;
    ctx.textAlign = "left";
    ctx.fillText(`${score} pts`, 6, 16);

    // Flash boost
    if (boosted && (t - (CYCLE * threshold / (threshold + 15))) < 20) {
      ctx.fillStyle = "rgba(251,191,36,0.15)";
      ctx.fillRect(0, 0, W, H);
    }

    // Label boost
    if (boosted) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("⚡ Plus vite !", W / 2, H - 10);
    }

    if (!active) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active pour voir", W / 2, H / 2);
    }
  }, [threshold, active]);

  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full" />;
}

// ── Animation 3 : No lives / Game Over ──
function AnimNoLives({ active }: { active: boolean }) {
  const W = 220, H = 110;
  const canvasRef = useAnimLoop((ctx, f) => {
    const CYCLE = 180;
    const t = f % CYCLE;

    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath(); ctx.arc((i * 37 + 11) % W, (i * 53 + 7) % H, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    // 3 impacts à t=30, 70, 110
    const hits = [t > 30 ? 1 : 0, t > 70 ? 1 : 0, t > 110 ? 1 : 0];
    const livesLeft = 3 - hits.reduce((a, b) => a + b, 0);
    const gameOver = livesLeft === 0 && t > 120;

    // Vaisseau
    if (!gameOver) {
      const shipY = H / 2 + Math.sin(f * 0.08) * 10;
      const hitNow = (t > 28 && t < 40) || (t > 68 && t < 80) || (t > 108 && t < 120);
      if (hitNow) {
        ctx.fillStyle = `rgba(239,68,68,0.3)`;
        ctx.fillRect(0, 0, W, H);
      }
      drawMiniShip(ctx, 40, shipY, hitNow ? "#ef4444" : "#f97316");
    }

    // Astéroïde flash
    for (let i = 0; i < 3; i++) {
      const impacts = [30, 70, 110];
      if (t > impacts[i] - 5 && t < impacts[i] + 8 && !gameOver) {
        const gr = ctx.createRadialGradient(55, H / 2, 1, 55, H / 2, 12);
        gr.addColorStop(0, "#9ca3af"); gr.addColorStop(1, "#374151");
        ctx.beginPath(); ctx.arc(55, H / 2, 12, 0, Math.PI * 2);
        ctx.fillStyle = gr; ctx.fill();
      }
    }

    // Vies
    ctx.font = "14px serif";
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = i < livesLeft ? 1 : 0.15;
      ctx.fillText("❤", W - 22 - i * 20, 18);
    }
    ctx.globalAlpha = 1;

    // GAME OVER
    if (gameOver) {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      const alpha = Math.min(1, (t - 120) / 15);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "#ef4444";
      ctx.font = "bold 18px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💀 GAME OVER", W / 2, H / 2 + 6);
      ctx.globalAlpha = 1;
    }

    if (!active) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active pour voir", W / 2, H / 2);
    }
  }, [active]);

  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full" />;
}

// ── Animation 4 : Boucle ──
function AnimLoop({ active }: { active: boolean }) {
  const W = 220, H = 110;
  const canvasRef = useAnimLoop((ctx, f) => {
    ctx.fillStyle = "#0a0f1e";
    ctx.fillRect(0, 0, W, H);

    // Étoiles
    for (let i = 0; i < 20; i++) {
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.beginPath(); ctx.arc((i * 37 + 11) % W, (i * 53 + 7) % H, 0.8, 0, Math.PI * 2); ctx.fill();
    }

    const CYCLE = 200;
    const t = f % CYCLE;
    const progress = t / CYCLE;

    // Chemin circulaire du vaisseau
    const cx = W / 2, cy = H / 2;
    const rx = 70, ry = 32;
    const angle = progress * Math.PI * 2 - Math.PI / 2;
    const sx = cx + Math.cos(angle) * rx;
    const sy = cy + Math.sin(angle) * ry;

    // Tracer la trajectoire (ellipse)
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(96,165,250,0.25)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Tracer le sillage
    for (let i = 1; i <= 12; i++) {
      const trailProgress = ((t - i * 2) / CYCLE + 1) % 1;
      const ta = trailProgress * Math.PI * 2 - Math.PI / 2;
      const tx = cx + Math.cos(ta) * rx;
      const ty = cy + Math.sin(ta) * ry;
      ctx.beginPath(); ctx.arc(tx, ty, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(249,115,22,${(1 - i / 12) * 0.6})`;
      ctx.fill();
    }

    // Flèche de direction
    const arrowAngle = angle + 0.3;
    const ax = cx + Math.cos(arrowAngle) * rx;
    const ay = cy + Math.sin(arrowAngle) * ry;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ax, ay);
    ctx.strokeStyle = "rgba(249,115,22,0.5)";
    ctx.lineWidth = 1; ctx.stroke();

    // Vaisseau orienté dans la direction du mouvement
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle + Math.PI / 2);
    drawMiniShipRotated(ctx, 0, 0, "#f97316");
    ctx.restore();

    // Compteur d'itérations
    const iter = Math.floor(f / CYCLE) + 1;
    ctx.fillStyle = "rgba(96,165,250,0.8)";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`boucle #${iter}`, 5, 14);

    // Label TANT QUE
    ctx.fillStyle = "rgba(96,165,250,0.6)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("🔄 le jeu continue…", W / 2, H - 8);

    if (!active) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.font = "bold 11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Active pour voir", W / 2, H / 2);
    }
  }, [active]);

  return <canvas ref={canvasRef} width={W} height={H} className="rounded-xl w-full" />;
}

// ─── Helpers dessin vaisseau ────────────────────────────────────────────────

function drawMiniShip(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 11, 6, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(x - 11, y, x + 11, y);
  g.addColorStop(0, color); g.addColorStop(1, lighten(color));
  ctx.fillStyle = g; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + 11, y); ctx.lineTo(x + 17, y - 2); ctx.lineTo(x + 17, y + 2); ctx.closePath();
  ctx.fillStyle = lighten(color); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 9, y - 3); ctx.lineTo(x - 15, y); ctx.lineTo(x - 9, y + 3);
  ctx.fillStyle = `rgba(251,146,60,0.7)`; ctx.fill();
  ctx.restore();
}

function drawMiniShipRotated(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, 6, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 2, y - 9); ctx.lineTo(x, y - 14); ctx.lineTo(x + 2, y - 9); ctx.closePath();
  ctx.fillStyle = lighten(color); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 8); ctx.lineTo(x, y + 13); ctx.lineTo(x + 2, y + 8); ctx.closePath();
  ctx.fillStyle = "rgba(251,146,60,0.7)"; ctx.fill();
  ctx.restore();
}

function lighten(hex: string): string {
  return hex === "#f97316" ? "#fb923c" : "#a78bfa";
}

// ─── Composant principal ────────────────────────────────────────────────────

const RULES_DEF = [
  {
    id: "collision",
    condition: "collision",
    action: "lose_life",
    icon: "💥",
    color: { border: "border-red-700", activeBorder: "border-red-500", bg: "bg-red-950/30", activeBg: "bg-red-950/50", badge: "bg-red-500/20 text-red-300", check: "bg-red-500" },
    title: "SI le vaisseau touche un astéroïde",
    then: "ALORS perdre une vie",
    concept: "condition",
    conceptColor: "text-red-400",
    explain: "C'est une condition. Si A se produit → Alors B arrive. Chaque app que tu connais tourne avec des milliers de conditions comme celle-là.",
  },
  {
    id: "score_boost",
    condition: "score_boost",
    action: "speed_up",
    icon: "⚡",
    color: { border: "border-yellow-700", activeBorder: "border-yellow-500", bg: "bg-yellow-950/30", activeBg: "bg-yellow-950/50", badge: "bg-yellow-500/20 text-yellow-300", check: "bg-yellow-500" },
    title: "SI le score dépasse",
    then: "ALORS les astéroïdes vont plus vite",
    concept: "comparaison",
    conceptColor: "text-yellow-400",
    explain: "C'est une comparaison. L'ordinateur vérifie en permanence si le score a passé le seuil que TU as choisi. C'est toi le développeur.",
    hasValue: true,
    defaultValue: 50,
  },
  {
    id: "no_lives",
    condition: "no_lives",
    action: "game_over",
    icon: "☠️",
    color: { border: "border-purple-700", activeBorder: "border-purple-500", bg: "bg-purple-950/30", activeBg: "bg-purple-950/50", badge: "bg-purple-500/20 text-purple-300", check: "bg-purple-500" },
    title: "SI il n'y a plus de vies",
    then: "ALORS GAME OVER",
    concept: "variable",
    conceptColor: "text-purple-400",
    explain: "Les vies sont une variable — un chiffre qui change pendant le jeu. Quand cette variable atteint zéro, le jeu s'arrête. Sans cette règle, on joue à l'infini.",
  },
  {
    id: "loop",
    condition: "loop",
    action: "continue",
    icon: "🔄",
    color: { border: "border-blue-700", activeBorder: "border-blue-500", bg: "bg-blue-950/30", activeBg: "bg-blue-950/50", badge: "bg-blue-500/20 text-blue-300", check: "bg-blue-500" },
    title: "TANT QUE il reste des vies",
    then: "ALORS continuer le jeu",
    concept: "boucle",
    conceptColor: "text-blue-400",
    explain: "C'est une boucle. Le jeu tourne en boucle 60 fois par seconde — chaque tour, il vérifie toutes tes règles. Sans boucle, le jeu s'arrête après 1 seule image.",
  },
];

type Props = {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
};

export default function AtelierBlocks({ rules, onChange }: Props) {
  const [values, setValues]     = useState<Record<string, number>>({ score_boost: 50 });
  const [expanded, setExpanded] = useState<string | null>(null);

  const isActive = (id: string) => rules.some(r => r.id === id);

  function toggle(def: typeof RULES_DEF[0]) {
    if (isActive(def.id)) {
      onChange(rules.filter(r => r.id !== def.id));
    } else {
      setExpanded(def.id);
      onChange([...rules, { id: def.id, condition: def.condition, action: def.action, value: values[def.id] ?? def.defaultValue }]);
    }
  }

  function updateValue(id: string, v: number) {
    setValues(prev => ({ ...prev, [id]: v }));
    onChange(rules.map(r => r.id === id ? { ...r, value: v } : r));
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
              active ? `${c.activeBorder} ${c.activeBg} shadow-lg` : `${c.border} ${c.bg} opacity-80`
            }`}
          >
            {/* Header de la règle */}
            <div className="p-4 md:p-5">
              <div className="flex flex-col md:flex-row gap-4">

                {/* ── Colonne gauche : règle ── */}
                <div className="flex-1 space-y-3">
                  {/* Titre + concept */}
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{def.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${c.badge}`}>
                          {def.concept}
                        </span>
                      </div>
                      <div className="text-sm font-black text-white leading-tight">
                        {def.title}
                        {def.hasValue && (
                          <input
                            type="number"
                            min={10} max={200}
                            value={values[def.id] ?? def.defaultValue}
                            onClick={e => e.stopPropagation()}
                            onChange={e => updateValue(def.id, parseInt(e.target.value) || 50)}
                            className="inline-block mx-1.5 w-14 bg-slate-800 border border-slate-600 rounded-lg px-1.5 py-0.5 text-center text-orange-400 font-black text-sm outline-none focus:border-orange-400"
                          />
                        )}
                        {def.hasValue && " points"}
                      </div>
                      <div className={`text-sm font-bold mt-1 ${c.conceptColor}`}>
                        {def.then}
                      </div>
                    </div>
                  </div>

                  {/* Explication */}
                  <div className="text-xs text-slate-400 leading-relaxed pl-9 border-l border-slate-700 ml-3">
                    💡 {def.explain}
                  </div>

                  {/* Bouton activer */}
                  <div className="pl-9">
                    <button
                      onClick={() => toggle(def)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${
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
                </div>

                {/* ── Colonne droite : animation ── */}
                <div className="md:w-[220px] shrink-0">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5 text-center">
                    Ce qui se passe en jeu
                  </div>
                  {def.id === "collision"   && <AnimCollision  active={active} />}
                  {def.id === "score_boost" && <AnimScoreBoost threshold={values.score_boost ?? 50} active={active} />}
                  {def.id === "no_lives"    && <AnimNoLives    active={active} />}
                  {def.id === "loop"        && <AnimLoop       active={active} />}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Compteur */}
      <div className="text-center text-xs text-slate-500 pt-1">
        {rules.length} règle{rules.length > 1 ? "s" : ""} activée{rules.length > 1 ? "s" : ""} · {4 - rules.length} restante{4 - rules.length > 1 ? "s" : ""}
      </div>
    </div>
  );
}
