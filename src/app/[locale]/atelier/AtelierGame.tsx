"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type GameConfig = {
  avatar: string;
  name: string;
  speed: number;        // 1-5
  obstacles: number;    // 1-5
  obstacleSize: number; // 1-5
  theme: string;        // "space" | "jungle" | "ocean" | "volcano"
  rules: Rule[];
};

export type Rule = {
  id: string;
  condition: string;
  action: string;
  value?: number;
};

type Props = {
  config: GameConfig;
  onScore?: (score: number) => void;
  onGameOver?: (score: number) => void;
};

// ─── Thèmes ──────────────────────────────────────────────────────────────────

const THEMES: Record<string, {
  bg: string;
  particleColor: (o: number) => string;
  vx: number; vy: number;
  hintColor: string;
}> = {
  space:   { bg: "#030712", particleColor: o => `rgba(255,255,255,${o})`, vx: -0.4, vy: 0,    hintColor: "rgba(255,255,255,0.7)" },
  jungle:  { bg: "#071209", particleColor: o => `rgba(80,160,50,${o})`,   vx: 0.3,  vy: 0.4,  hintColor: "rgba(120,220,80,0.7)" },
  ocean:   { bg: "#020b18", particleColor: o => `rgba(60,160,210,${o})`,  vx: 0,    vy: -0.5, hintColor: "rgba(60,200,240,0.7)" },
  volcano: { bg: "#120400", particleColor: o => `rgba(240,90,20,${o})`,   vx: 0.2,  vy: -0.7, hintColor: "rgba(250,140,40,0.7)" },
};

function drawObstacle(
  ctx: CanvasRenderingContext2D,
  a: { x: number; y: number; r: number },
  theme: string,
  frame: number,
) {
  ctx.save();
  ctx.beginPath();
  ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);

  if (theme === "space") {
    const g = ctx.createRadialGradient(a.x - 4, a.y - 4, 2, a.x, a.y, a.r);
    g.addColorStop(0, "#9ca3af"); g.addColorStop(1, "#374151");
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.stroke();
  } else if (theme === "jungle") {
    ctx.fillStyle = "#2d1a0a"; ctx.fill();
    ctx.strokeStyle = "#4a7c3f"; ctx.lineWidth = 3; ctx.stroke();
    // Moss patch
    ctx.beginPath(); ctx.arc(a.x - a.r * 0.3, a.y - a.r * 0.4, a.r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "#3a6b2f"; ctx.fill();
  } else if (theme === "ocean") {
    // Corps méduse
    const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
    g.addColorStop(0, "rgba(80,200,220,0.8)");
    g.addColorStop(1, "rgba(20,100,140,0.9)");
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1.5; ctx.stroke();
    // Tentacules
    ctx.lineWidth = 1; ctx.strokeStyle = "rgba(100,220,240,0.5)";
    for (let i = -2; i <= 2; i++) {
      const tx = a.x + i * (a.r / 2.5);
      const wave = Math.sin(frame * 0.05 + i) * 3;
      ctx.beginPath();
      ctx.moveTo(tx, a.y + a.r);
      ctx.lineTo(tx + wave, a.y + a.r + a.r * 0.7);
      ctx.stroke();
    }
  } else if (theme === "volcano") {
    const g = ctx.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r);
    g.addColorStop(0, "#7f1d0a"); g.addColorStop(1, "#1a0500");
    ctx.fillStyle = g; ctx.fill();
    ctx.shadowBlur = 10; ctx.shadowColor = "#f97316";
    ctx.strokeStyle = "#f97316"; ctx.lineWidth = 2; ctx.stroke();
    ctx.shadowBlur = 0;
    // Crack
    ctx.beginPath();
    ctx.moveTo(a.x - a.r * 0.2, a.y - a.r * 0.5);
    ctx.lineTo(a.x + a.r * 0.1, a.y);
    ctx.lineTo(a.x - a.r * 0.1, a.y + a.r * 0.5);
    ctx.strokeStyle = "rgba(251,146,60,0.7)"; ctx.lineWidth = 1.5; ctx.stroke();
  }

  ctx.restore();
}

export default function AtelierGame({ config, onScore, onGameOver }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef  = useRef<any>(null);
  const rafRef    = useRef<number>(0);
  const keysRef   = useRef<Set<string>>(new Set());
  const touchRef  = useRef<{ y: number } | null>(null);

  const [lives,   setLives]   = useState(3);
  const [score,   setScore]   = useState(0);
  const [running, setRunning] = useState(false);
  const [over,    setOver]    = useState(false);

  const theme = THEMES[config.theme] ?? THEMES.space;

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const baseSpeed  = 2.5 + config.speed * 0.7;
    const spawnRate  = Math.max(40, 90 - config.obstacles * 12);
    const minR       = 6 + config.obstacleSize * 2;
    const maxR       = 12 + config.obstacleSize * 5;
    const shipSpeed  = 4.5;

    const speedBoostRule = config.rules.find(r => r.condition === "score_boost");
    const speedBoostAt   = speedBoostRule?.value ?? 50;

    let shipY      = H / 2;
    let livesLeft  = 3;
    let sc         = 0;
    let frame      = 0;
    let asteroids: { x: number; y: number; r: number; vy: number }[] = [];
    let bgParticles: { x: number; y: number; s: number; b: number }[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      s: Math.random() * 2 + 0.5, b: Math.random(),
    }));

    stateRef.current = { alive: true };

    function drawShip(x: number, y: number) {
      ctx.save();
      // Flamme propulseur
      ctx.beginPath();
      ctx.moveTo(x - 14, y - 5);
      ctx.lineTo(x - 24, y);
      ctx.lineTo(x - 14, y + 5);
      ctx.fillStyle = `rgba(251,146,60,${0.5 + 0.5 * Math.random()})`;
      ctx.fill();
      // Emoji vaisseau
      ctx.font = "26px serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(config.avatar, x + 2, y);
      ctx.restore();
    }

    function loop() {
      if (!stateRef.current?.alive) return;
      frame++;

      // Fond
      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      // Particules fond (étoiles / feuilles / bulles / braises)
      bgParticles.forEach(s => {
        const blink = 0.5 + 0.5 * Math.sin(frame * 0.04 + s.b * 10);
        ctx.fillStyle = theme.particleColor(blink * 0.8);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2);
        ctx.fill();
        s.x += theme.vx;
        s.y += theme.vy;
        if (s.x < -4) s.x = W + 4;
        if (s.x > W + 4) s.x = -4;
        if (s.y < -4) { s.y = H + 4; s.x = Math.random() * W; }
        if (s.y > H + 4) { s.y = -4; s.x = Math.random() * W; }
      });

      // Mouvement vaisseau
      const keys = keysRef.current;
      const goUp   = keys.has("ArrowUp")   || keys.has("KeyW") || keys.has("KeyZ");
      const goDown = keys.has("ArrowDown")  || keys.has("KeyS");
      if (touchRef.current && canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleY = H / rect.height;
        const fingerY = (touchRef.current.y - rect.top) * scaleY;
        if (fingerY < shipY - 10) shipY -= shipSpeed;
        else if (fingerY > shipY + 10) shipY += shipSpeed;
      } else {
        if (goUp)   shipY -= shipSpeed;
        if (goDown) shipY += shipSpeed;
      }
      shipY = Math.max(20, Math.min(H - 20, shipY));

      // Spawn
      if (frame % spawnRate === 0) {
        const r = minR + Math.random() * (maxR - minR);
        asteroids.push({
          x: W + r, y: Math.random() * (H - 60) + 30,
          r, vy: (Math.random() - 0.5) * 1.2,
        });
      }

      const currentSpeed = sc >= speedBoostAt ? baseSpeed * 1.6 : baseSpeed;
      asteroids = asteroids.filter(a => a.x + a.r > 0);

      for (const a of asteroids) {
        a.x -= currentSpeed;
        a.y += a.vy;
        a.y = Math.max(a.r, Math.min(H - a.r, a.y));
        drawObstacle(ctx, a, config.theme, frame);

        const dx = a.x - 65, dy = a.y - shipY;
        if (Math.sqrt(dx * dx + dy * dy) < a.r + 10) {
          livesLeft--;
          setLives(livesLeft);
          asteroids = asteroids.filter(x => x !== a);
          ctx.fillStyle = "rgba(239,68,68,0.3)";
          ctx.fillRect(0, 0, W, H);
          if (livesLeft <= 0) {
            stateRef.current.alive = false;
            setOver(true); setRunning(false);
            onGameOver?.(sc); return;
          }
        }
      }

      drawShip(65, shipY);

      // HUD score + vies
      ctx.fillStyle = theme.hintColor;
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(`${sc} pts`, 10, 10);
      ctx.textAlign = "right";
      ctx.fillText("❤️".repeat(livesLeft), W - 10, 10);

      if (frame % 6 === 0) { sc++; setScore(sc); onScore?.(sc); }

      rafRef.current = requestAnimationFrame(loop);
    }

    setLives(3); setScore(0); setOver(false); setRunning(true);
    stateRef.current = { alive: true };
    rafRef.current = requestAnimationFrame(loop);
  }, [config, onScore, onGameOver, theme]);

  // Clavier
  useEffect(() => {
    const PREVENT = new Set(["ArrowUp", "ArrowDown", "Space"]);
    function onDown(e: KeyboardEvent) { if (PREVENT.has(e.code)) e.preventDefault(); keysRef.current.add(e.code); }
    function onUp(e: KeyboardEvent) { keysRef.current.delete(e.code); }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // Touch
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    function onTouchStart(e: TouchEvent) { e.preventDefault(); touchRef.current = { y: e.touches[0].clientY }; }
    function onTouchMove(e: TouchEvent)  { e.preventDefault(); touchRef.current = { y: e.touches[0].clientY }; }
    function onTouchEnd()                { touchRef.current = null; }
    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove",  onTouchMove,  { passive: false });
    canvas.addEventListener("touchend",   onTouchEnd);
    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove",  onTouchMove);
      canvas.removeEventListener("touchend",   onTouchEnd);
    };
  }, []);

  useEffect(() => {
    return () => { cancelAnimationFrame(rafRef.current); if (stateRef.current) stateRef.current.alive = false; };
  }, []);

  return (
    <div className="relative select-none">
      <canvas
        ref={canvasRef}
        width={560} height={320}
        className="rounded-2xl w-full border border-slate-700"
        style={{ touchAction: "none", background: theme.bg }}
      />
      {!running && !over && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl gap-4">
          <div className="text-5xl">{config.avatar}</div>
          <div className="text-xl font-black text-white">{config.name || "Mon Jeu"}</div>
          {/* Sans prénom (manche 1 de la leçon), pas de ligne d'auteur vide. */}
          {config.name && <div className="text-slate-400 text-sm">Créé par toi</div>}
          <button
            onClick={startGame}
            className="mt-2 px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white font-black rounded-full text-lg transition-all hover:scale-105 active:scale-95 shadow-lg shadow-orange-500/30"
          >
            🚀 LANCER
          </button>
          <div className="text-xs text-slate-500">Flèches ↑↓ pour esquiver · Glisse sur mobile</div>
        </div>
      )}
      {over && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-2xl gap-3">
          <div className="text-4xl">💥</div>
          <div className="text-2xl font-black text-white">GAME OVER</div>
          <div className="text-orange-400 font-bold text-xl">{score} points</div>
          <button onClick={startGame} className="mt-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all">
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
