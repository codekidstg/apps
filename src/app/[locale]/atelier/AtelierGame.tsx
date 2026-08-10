"use client";
import { useEffect, useRef, useState, useCallback } from "react";

export type GameConfig = {
  avatar: string;
  name: string;
  speed: number;       // 1-5
  obstacles: number;   // 1-5
  gravity: number;     // 1-5 (conservé pour compat mais non utilisé)
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

export default function AtelierGame({ config, onScore, onGameOver }: Props) {
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const stateRef   = useRef<any>(null);
  const rafRef     = useRef<number>(0);
  const keysRef    = useRef<Set<string>>(new Set());
  const touchRef   = useRef<{ y: number } | null>(null);

  const [lives,   setLives]   = useState(3);
  const [score,   setScore]   = useState(0);
  const [running, setRunning] = useState(false);
  const [over,    setOver]    = useState(false);

  const SHIP_COLORS: Record<string, [string, string]> = {
    "🚀": ["#f97316", "#fb923c"], "🛸": ["#818cf8", "#a5b4fc"],
    "⭐": ["#fbbf24", "#fde68a"], "🌙": ["#94a3b8", "#cbd5e1"],
    "🪐": ["#c084fc", "#e879f9"], "☄️": ["#60a5fa", "#93c5fd"],
  };

  const startGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;

    const baseSpeed  = 2.5 + config.speed * 0.7;
    const spawnRate  = Math.max(40, 90 - config.obstacles * 12);
    const shipSpeed  = 4.5;           // vitesse verticale du vaisseau

    const speedBoostRule = config.rules.find(r => r.condition === "score_boost");
    const speedBoostAt   = speedBoostRule?.value ?? 50;

    let shipY      = H / 2;
    let livesLeft  = 3;
    let sc         = 0;
    let frame      = 0;
    let asteroids: { x: number; y: number; r: number; vy: number }[] = [];
    let bgStars: { x: number; y: number; s: number; b: number }[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      s: Math.random() * 2 + 0.5, b: Math.random(),
    }));

    stateRef.current = { alive: true };

    function drawShip(x: number, y: number) {
      const [c1, c2] = SHIP_COLORS[config.avatar] ?? ["#f97316", "#fb923c"];
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(x, y, 14, 9, 0, 0, Math.PI * 2);
      const g = ctx.createLinearGradient(x - 14, y, x + 14, y);
      g.addColorStop(0, c1); g.addColorStop(1, c2);
      ctx.fillStyle = g; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x + 14, y); ctx.lineTo(x + 22, y - 3); ctx.lineTo(x + 22, y + 3); ctx.closePath();
      ctx.fillStyle = c2; ctx.fill();
      ctx.beginPath();
      ctx.arc(x + 4, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.fill();
      ctx.beginPath();
      ctx.moveTo(x - 12, y - 4); ctx.lineTo(x - 20, y); ctx.lineTo(x - 12, y + 4);
      ctx.fillStyle = `rgba(251,146,60,${0.6 + 0.4 * Math.random()})`; ctx.fill();
      ctx.restore();
    }

    function drawAsteroid(a: { x: number; y: number; r: number }) {
      ctx.save();
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(a.x - 4, a.y - 4, 2, a.x, a.y, a.r);
      grad.addColorStop(0, "#9ca3af"); grad.addColorStop(1, "#374151");
      ctx.fillStyle = grad; ctx.fill();
      ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }

    function loop() {
      if (!stateRef.current?.alive) return;
      frame++;

      ctx.fillStyle = "#030712"; ctx.fillRect(0, 0, W, H);
      bgStars.forEach(s => {
        const blink = 0.5 + 0.5 * Math.sin(frame * 0.05 + s.b * 10);
        ctx.fillStyle = `rgba(255,255,255,${blink * 0.8})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
        s.x -= 0.4;
        if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
      });

      // Mouvement vaisseau — flèches ↑↓, ZQSD, ou swipe touch
      const keys = keysRef.current;
      const goUp   = keys.has("ArrowUp")   || keys.has("KeyW") || keys.has("KeyZ");
      const goDown = keys.has("ArrowDown")  || keys.has("KeyS");

      // Swipe touch : comparer position doigt avec vaisseau
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

      // Spawn astéroïdes
      if (frame % spawnRate === 0) {
        const r = 10 + Math.random() * 18;
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
        drawAsteroid(a);

        const dx = a.x - 60, dy = a.y - shipY;
        if (Math.sqrt(dx * dx + dy * dy) < a.r + 12) {
          livesLeft--;
          setLives(livesLeft);
          asteroids = asteroids.filter(x => x !== a);
          ctx.fillStyle = "rgba(239,68,68,0.3)"; ctx.fillRect(0, 0, W, H);
          if (livesLeft <= 0) {
            stateRef.current.alive = false;
            setOver(true); setRunning(false);
            onGameOver?.(sc); return;
          }
        }
      }

      drawShip(60, shipY);

      if (frame % 6 === 0) { sc++; setScore(sc); onScore?.(sc); }

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "top";
      ctx.fillText(`${sc} pts`, 10, 10);
      ctx.textAlign = "right";
      ctx.fillText("❤️".repeat(livesLeft), W - 10, 10);

      rafRef.current = requestAnimationFrame(loop);
    }

    setLives(3); setScore(0); setOver(false); setRunning(true);
    stateRef.current = { alive: true };
    rafRef.current = requestAnimationFrame(loop);
  }, [config, onScore, onGameOver]);

  // Clavier — flèches ↑↓
  useEffect(() => {
    const PREVENT = new Set(["ArrowUp", "ArrowDown", "Space"]);
    function onDown(e: KeyboardEvent) {
      if (PREVENT.has(e.code)) e.preventDefault();
      keysRef.current.add(e.code);
    }
    function onUp(e: KeyboardEvent) { keysRef.current.delete(e.code); }
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => { window.removeEventListener("keydown", onDown); window.removeEventListener("keyup", onUp); };
  }, []);

  // Touch — swipe vertical
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
        className="rounded-2xl w-full border border-slate-700 bg-[#030712]"
        style={{ touchAction: "none" }}
      />
      {!running && !over && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl gap-4">
          <div className="text-5xl">{config.avatar}</div>
          <div className="text-xl font-black text-white">{config.name || "Mon Jeu"}</div>
          <div className="text-slate-400 text-sm">Créé par {config.name ? "toi" : "—"}</div>
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
          <button
            onClick={startGame}
            className="mt-2 px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-full transition-all"
          >
            Rejouer
          </button>
        </div>
      )}
    </div>
  );
}
