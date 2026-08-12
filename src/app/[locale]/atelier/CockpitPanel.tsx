"use client";
import { useState, useEffect, useRef } from "react";
import type { Rule } from "./AtelierGame";

// ── Sons ──────────────────────────────────────────────────────────────────────
function beep(freq: number, dur: number, vol = 0.1) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    o.start(); o.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close(), (dur + 0.1) * 1000);
  } catch {}
}
const sfxTick   = () => beep(1200, 0.04, 0.07);
const sfxSave   = () => { beep(523, 0.08); setTimeout(() => beep(784, 0.15), 90); };
const sfxToggle = (on: boolean) => beep(on ? 880 : 440, 0.1, 0.1);
const sfxLaunch = () => { beep(200, 0.06); setTimeout(() => beep(400, 0.06), 80); setTimeout(() => beep(900, 0.35), 160); };

// ── Mini preview canvas ───────────────────────────────────────────────────────
function MiniPreview({ type, value }: { type: string; value: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const valRef    = useRef(value);
  useEffect(() => { valRef.current = value; }, [value]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width, H = canvas.height;
    let frame = 0, raf = 0;
    let asteroids: { x: number; y: number; r: number; vy: number }[] = [];
    const bgStars = Array.from({ length: 18 }, () => ({
      x: Math.random() * W, y: Math.random() * H, s: Math.random() + 0.4,
    }));

    function drawAsteroid(ax: number, ay: number, ar: number) {
      ctx.save();
      ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(ax - 2, ay - 2, 1, ax, ay, ar);
      g.addColorStop(0, "#9ca3af"); g.addColorStop(1, "#374151");
      ctx.fillStyle = g; ctx.fill();
      ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }

    function bg() {
      ctx.fillStyle = "#050b08"; ctx.fillRect(0, 0, W, H);
      bgStars.forEach(s => {
        const b = 0.4 + 0.4 * Math.sin(frame * 0.04 + s.x);
        ctx.fillStyle = `rgba(255,255,255,${b})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
        s.x -= 0.25; if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
      });
    }

    function ship(x: number, y: number) {
      ctx.save();
      ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🚀", x, y);
      ctx.restore();
    }

    function label(txt: string) {
      ctx.fillStyle = "rgba(245,158,11,0.65)";
      ctx.font = "bold 8px monospace"; ctx.textAlign = "right"; ctx.textBaseline = "bottom";
      ctx.fillText(txt, W - 6, H - 4);
    }

    function loop() {
      frame++;
      const v = valRef.current;
      bg();

      if (type === "speed" || type === "density" || type === "size") {
        const spd      = type === "speed"   ? 2.5 + v * 0.7 : 3.5;
        const spawn    = type === "density" ? Math.max(40, 90 - v * 12) : 55;
        const minR     = type === "size"    ? 5 + v * 2 : 8;
        const maxR     = type === "size"    ? 10 + v * 5 : 20;
        if (frame % spawn === 0)
          asteroids.push({ x: W + 20, y: 15 + Math.random() * (H - 30), r: minR + Math.random() * (maxR - minR), vy: (Math.random() - 0.5) * 0.8 });
        asteroids = asteroids.filter(a => a.x + a.r > 0);
        for (const a of asteroids) {
          a.x -= spd; a.y += a.vy; a.y = Math.max(a.r, Math.min(H - a.r, a.y));
          drawAsteroid(a.x, a.y, a.r);
        }
        ship(32, H / 2);
        const lbl = type === "speed"   ? `${spd.toFixed(1)} px/image`
                  : type === "density" ? `1 obstacle / ${(spawn / 60).toFixed(1)}s`
                  : `rayon ${minR}–${maxR} px`;
        label(lbl);

      } else if (type === "collision") {
        const T = 110, t = frame % T;
        const ax = W - 22 - (t / T) * (W - 70);
        drawAsteroid(ax, H / 2, 13);
        ship(32, H / 2);
        if (t > 72 && t < 95) {
          ctx.fillStyle = "rgba(239,68,68,0.35)"; ctx.fillRect(0, 0, W, H);
          ctx.fillStyle = "#ef4444"; ctx.font = "bold 15px sans-serif";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("-1 ❤️", W / 2, H / 2);
        } else if (t >= 95) {
          ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H);
        }

      } else if (type === "gameover") {
        const T = 190, t = frame % T;
        const lives = t < 45 ? 3 : t < 85 ? 2 : t < 125 ? 1 : 0;
        const icons = ["❤️", "❤️", "❤️"].map((_, i) => i < lives ? "❤️" : "🖤");
        ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        icons.forEach((ic, i) => ctx.fillText(ic, W / 2 - 24 + i * 24, H / 2 - 14));
        if (lives === 0) {
          ctx.fillStyle = "rgba(239,68,68,0.8)"; ctx.font = "bold 13px monospace";
          ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("GAME OVER", W / 2, H / 2 + 16);
        }

      } else if (type === "loop") {
        const arrows = ["→", "→", "→", "→"];
        arrows.forEach((_, i) => {
          const x = ((frame * 1.8) + i * 52) % (W + 20) - 10;
          ctx.fillStyle = `rgba(245,158,11,${0.4 + 0.4 * Math.sin(frame * 0.05 + i)})`;
          ctx.font = "14px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText("→", x, H / 2 - 8);
        });
        ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.font = "8px monospace";
        ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(`image n°${frame}  ·  Le jeu continue…`, W / 2, H - 4);

      } else if (type === "turbo") {
        const T = 200, t = frame % T;
        const sc = Math.min(54, Math.floor(t * 0.28));
        const turbo = sc >= 50;
        if (turbo) { ctx.fillStyle = "rgba(245,158,11,0.12)"; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = turbo ? "#f59e0b" : "rgba(255,255,255,0.8)";
        ctx.font = `bold ${turbo ? 26 : 20}px monospace`;
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`${sc} pts`, W / 2, turbo ? H / 2 - 12 : H / 2);
        if (turbo) {
          ctx.fillStyle = "#f59e0b"; ctx.font = "bold 12px monospace";
          ctx.fillText("⚡ VITESSE × 1.6 !", W / 2, H / 2 + 14);
        }
      }

      raf = requestAnimationFrame(loop);
    }

    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); };
  }, [type]);

  return (
    <canvas ref={canvasRef} width={280} height={110}
      className="rounded-xl w-full"
      style={{ border: "1px solid rgba(245,158,11,0.15)", display: "block" }} />
  );
}

// ── Cadran ────────────────────────────────────────────────────────────────────
function Dial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = (value - 1) / 4;
  const angle = -135 + pct * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = 50, cy = 50;
  const px = cx + 32 * Math.sin(rad), py = cy - 32 * Math.cos(rad);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const a = ((-135 + (i / 4) * 270) * Math.PI) / 180;
    return { x1: cx + 43 * Math.sin(a), y1: cy - 43 * Math.cos(a), x2: cx + 36 * Math.sin(a), y2: cy - 36 * Math.cos(a), lit: i <= value - 1 };
  });

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 110, height: 110 }}>
        <svg viewBox="0 0 100 100" width="110" height="110">
          <circle cx={cx} cy={cy} r={40} fill="none" stroke="rgba(245,158,11,0.07)" strokeWidth="10"
            strokeDasharray={`${0.75 * 2 * Math.PI * 40} 9999`}
            strokeDashoffset={`${-0.125 * 2 * Math.PI * 40}`} strokeLinecap="round" />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.lit ? "#f59e0b" : "rgba(245,158,11,0.18)"} strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.7))" }} />
          <circle cx={cx} cy={cy} r="3.5" fill="#f59e0b"
            style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">{value}</text>
        </svg>
        <button onClick={() => { if (value > 1) { onChange(value - 1); sfxTick(); } }}
          disabled={value <= 1}
          className="absolute bottom-0 left-0 w-8 h-8 rounded-full flex items-center justify-center font-black transition-all disabled:opacity-20 hover:scale-110 active:scale-90 text-base"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>−</button>
        <button onClick={() => { if (value < 5) { onChange(value + 1); sfxTick(); } }}
          disabled={value >= 5}
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center font-black transition-all disabled:opacity-20 hover:scale-110 active:scale-90 text-base"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>+</button>
      </div>
    </div>
  );
}

// ── Toggle règle ──────────────────────────────────────────────────────────────
function RuleToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-center">
      <button onClick={() => { onChange(!on); sfxToggle(!on); }}
        className="flex flex-col items-center gap-2 px-8 py-4 rounded-2xl transition-all"
        style={{
          background: on ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)",
          border: `2px solid ${on ? "rgba(245,158,11,0.5)" : "rgba(255,255,255,0.08)"}`,
        }}>
        {/* Interrupteur physique */}
        <div className="relative w-6 h-10 rounded-full"
          style={{ background: on ? "rgba(245,158,11,0.2)" : "rgba(30,41,59,0.8)", border: `2px solid ${on ? "rgba(245,158,11,0.5)" : "#1e293b"}` }}>
          <div className="text-[9px] font-black absolute -top-4 left-1/2 -translate-x-1/2" style={{ color: on ? "#f59e0b" : "#334155" }}>I</div>
          <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full transition-all duration-200"
            style={{ top: on ? "3px" : "15px", background: on ? "#f59e0b" : "#334155",
              boxShadow: on ? "0 0 8px rgba(245,158,11,0.9)" : "none" }} />
          <div className="text-[9px] font-black absolute -bottom-4 left-1/2 -translate-x-1/2" style={{ color: on ? "#334155" : "#1e293b" }}>O</div>
        </div>
        <div className="text-sm font-black mt-2" style={{ color: on ? "#f59e0b" : "#475569" }}>
          {on ? "ACTIVÉE" : "DÉSACTIVÉE"}
        </div>
      </button>
    </div>
  );
}

// ── Définitions des étapes ────────────────────────────────────────────────────
type MicroStep = {
  id: string; type: "dial" | "toggle";
  title: string; description: string;
  pseudoFR: (v: number) => string;
  pseudoJS: (v: number) => string;
};

const SPEED_LABELS   = ["LENTE", "NORMALE", "RAPIDE", "TRÈS RAPIDE", "FULGURANT"] as const;
const DENSITY_LABELS = ["RARE", "NORMALE", "DENSE", "SERRÉE", "EXTRÊME"] as const;
const SIZE_LABELS    = ["MICRO", "PETITE", "NORMALE", "GRANDE", "ÉNORME"] as const;

const MICRO_STEPS: MicroStep[] = [
  {
    id: "speed", type: "dial",
    title: "⚡ Vitesse des obstacles",
    description: "Plus c'est rapide, plus c'est difficile à esquiver. Regarde le changement en direct.",
    pseudoFR: v => `vitesse ← ${SPEED_LABELS[v - 1]}`,
    pseudoJS: v => `const vitesse = ${(2.5 + v * 0.7).toFixed(1)};  // px par image`,
  },
  {
    id: "density", type: "dial",
    title: "☄️ Densité des obstacles",
    description: "Combien d'obstacles arrivent par seconde ? Regarde le flux changer.",
    pseudoFR: v => `densité ← ${DENSITY_LABELS[v - 1]}  (1 obstacle / ${(Math.max(40, 90 - v * 12) / 60).toFixed(1)}s)`,
    pseudoJS: v => `const délaiSpawn = ${(Math.max(40, 90 - v * 12) / 60).toFixed(1)};  // secondes`,
  },
  {
    id: "size", type: "dial",
    title: "📏 Taille des obstacles",
    description: "Des petits cailloux ou des rochers géants ? À toi de choisir.",
    pseudoFR: v => `taille ← ${SIZE_LABELS[v - 1]}  (rayon ${6 + v * 2}–${12 + v * 5} px)`,
    pseudoJS: v => `const taille = { min: ${6 + v * 2}, max: ${12 + v * 5} };  // pixels`,
  },
  {
    id: "collision", type: "toggle",
    title: "💥 Règle : Collision",
    description: "Si ton vaisseau touche un obstacle, que se passe-t-il ?",
    pseudoFR: v => v ? "SI collision ALORS perdre 1 vie" : "SI collision ALORS rien (invincible !)",
    pseudoJS: v => v ? "if (collision) { vies = vies - 1; }" : "// collision ignorée",
  },
  {
    id: "gameover", type: "toggle",
    title: "☠️ Règle : Game Over",
    description: "Quand toutes les vies sont perdues, le jeu doit-il s'arrêter ?",
    pseudoFR: v => v ? "SI vies = 0 ALORS arrêter le jeu" : "SI vies = 0 ALORS continuer quand même",
    pseudoJS: v => v ? "if (vies === 0) { gameOver(); }" : "// le jeu ne s'arrête jamais",
  },
  {
    id: "loop", type: "toggle",
    title: "🔄 Règle : Boucle infinie",
    description: "Le jeu tourne en boucle indéfiniment — une boucle, ça ne s'arrête jamais seul.",
    pseudoFR: v => v ? "RÉPÉTER indéfiniment : faire avancer les obstacles" : "RÉPÉTER 1 fois seulement",
    pseudoJS: v => v ? "while (enPartie) { mettreAJour(); }" : "// pas de boucle active",
  },
  {
    id: "turbo", type: "toggle",
    title: "⚡ Règle : Turbo automatique",
    description: "Quand le score atteint 50, les astéroïdes accélèrent automatiquement.",
    pseudoFR: v => v ? "SI score ≥ 50 ALORS vitesse × 1.6  (TURBO !)" : "Pas de turbo automatique",
    pseudoJS: v => v ? "if (score >= 50) { vitesse *= 1.6; }" : "// pas de turbo",
  },
];

// Map rule id → Rule object
function buildRule(id: string): Rule | null {
  if (id === "collision") return { id: "collision", condition: "collision", action: "lose_life" };
  if (id === "gameover")  return { id: "no_lives",  condition: "no_lives",  action: "game_over" };
  if (id === "loop")      return { id: "loop",      condition: "loop",      action: "continue"  };
  if (id === "turbo")     return { id: "score_boost", condition: "score_boost", action: "speed_up", value: 50 };
  return null;
}

// ── Props ──────────────────────────────────────────────────────────────────────
type Props = {
  playerName: string;
  speed: number; setSpeed: (v: number) => void;
  obstacles: number; setObstacles: (v: number) => void;
  obstacleSize: number; setObstacleSize: (v: number) => void;
  rules: Rule[]; setRules: (r: Rule[]) => void;
  onLaunch: () => void;
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function CockpitPanel({ playerName, speed, setSpeed, obstacles, setObstacles, obstacleSize, setObstacleSize, rules, setRules, onLaunch }: Props) {
  const [phase, setPhase]         = useState<"briefing" | "steps" | "complete">("briefing");
  const [briefLines, setBriefLines] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedLines, setSavedLines]   = useState<{ fr: string; js: string }[]>([]);
  const [showJS, setShowJS]           = useState(false);

  // Valeurs locales
  const [localSpeed, setLocalSpeed]   = useState(speed);
  const [localDensity, setLocalDensity] = useState(obstacles);
  const [localSize, setLocalSize]       = useState(obstacleSize);
  const [toggles, setToggles]           = useState({ collision: true, gameover: true, loop: true, turbo: false });

  // Briefing multi-lignes
  const BRIEF_LINES = [
    "> SYSTÈME ACTIVÉ...",
    `> IDENTIFICATION : AGENT ${playerName.toUpperCase()}`,
    "> MISSION : PROGRAMMER TON VAISSEAU",
    "> PRÊT À RECEVOIR LES PARAMÈTRES.",
  ];

  useEffect(() => {
    let lineIdx = 0, charIdx = 0;
    const rendered: string[] = [];
    const id = setInterval(() => {
      if (lineIdx >= BRIEF_LINES.length) {
        clearInterval(id);
        setTimeout(() => { setPhase("steps"); setShowJS(true); }, 500);
        return;
      }
      charIdx++;
      rendered[lineIdx] = BRIEF_LINES[lineIdx].slice(0, charIdx);
      setBriefLines([...rendered]);
      if (charIdx >= BRIEF_LINES[lineIdx].length) {
        lineIdx++; charIdx = 0;
        rendered.push("");
      }
    }, 28);
    return () => clearInterval(id);
  }, []);

  // Valeur courante (dial: 1-5, toggle: 0/1)
  function getCurrentValue(): number {
    const step = MICRO_STEPS[currentStep];
    if (step.type === "dial") {
      if (step.id === "speed")   return localSpeed;
      if (step.id === "density") return localDensity;
      if (step.id === "size")    return localSize;
    }
    const key = step.id as keyof typeof toggles;
    return toggles[key] ? 1 : 0;
  }

  function setCurrentValue(v: number) {
    const step = MICRO_STEPS[currentStep];
    if (step.id === "speed")   setLocalSpeed(v);
    if (step.id === "density") setLocalDensity(v);
    if (step.id === "size")    setLocalSize(v);
    if (step.type === "toggle") {
      const key = step.id as keyof typeof toggles;
      setToggles(prev => ({ ...prev, [key]: v === 1 }));
    }
  }

  function saveCurrentLine() {
    sfxSave();
    const step = MICRO_STEPS[currentStep];
    const v = getCurrentValue();
    const line = { fr: step.pseudoFR(v), js: step.pseudoJS(v) };
    setSavedLines(prev => [...prev, line]);

    // Sync vers parent
    if (step.id === "speed")   setSpeed(localSpeed);
    if (step.id === "density") setObstacles(localDensity);
    if (step.id === "size")    setObstacleSize(localSize);

    if (currentStep < MICRO_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Construire rules finales
      const finalRules: Rule[] = [];
      if (toggles.collision) finalRules.push({ id: "collision", condition: "collision", action: "lose_life" });
      if (toggles.gameover)  finalRules.push({ id: "no_lives",  condition: "no_lives",  action: "game_over" });
      if (toggles.loop)      finalRules.push({ id: "loop",      condition: "loop",      action: "continue"  });
      if (toggles.turbo)     finalRules.push({ id: "score_boost", condition: "score_boost", action: "speed_up", value: 50 });
      setRules(finalRules);
      setPhase("complete");
    }
  }

  function handleLaunch() {
    sfxLaunch();
    setTimeout(onLaunch, 1800);
  }

  const step = MICRO_STEPS[currentStep];
  const v    = getCurrentValue();

  return (
    <>
      <style>{`
        @keyframes scanline { 0%{transform:translateY(-4px);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(500px);opacity:0} }
        .ck-scan { animation: scanline 4s linear infinite; }
        @keyframes fadein { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        .ck-fadein { animation: fadein 0.3s ease both; }
        @keyframes slidein { from{opacity:0;transform:translateX(-6px)} to{opacity:1;transform:translateX(0)} }
        .ck-slide { animation: slidein 0.25s ease both; }
      `}</style>

      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "#050b08", border: "1px solid rgba(245,158,11,0.18)" }}>

        {/* Scan line */}
        <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden" style={{ height: 600, zIndex: 1 }}>
          <div className="ck-scan absolute inset-x-0 h-px opacity-0"
            style={{ background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.25),transparent)" }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "#f59e0b" }}>
              Mission Control
            </span>
          </div>
          {phase === "steps" && (
            <div className="text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.4)" }}>
              paramètre {currentStep + 1}/{MICRO_STEPS.length}
            </div>
          )}
        </div>

        {/* ── BRIEFING ── */}
        {phase === "briefing" && (
          <div className="relative z-10 px-6 py-8 min-h-[160px] flex flex-col justify-center gap-1">
            {briefLines.map((line, i) => (
              <p key={i} className="text-xs font-mono leading-relaxed"
                style={{ color: i === briefLines.length - 1 ? "#f59e0b" : "rgba(245,158,11,0.5)" }}>
                {line}
                {i === briefLines.length - 1 && <span className="animate-pulse ml-0.5">█</span>}
              </p>
            ))}
          </div>
        )}

        {/* ── STEPS ── */}
        {phase === "steps" && (
          <div className="relative z-10 p-5 space-y-4">

            {/* Programme accumulé */}
            {savedLines.length > 0 && (
              <div className="rounded-xl p-3 space-y-1 text-[10px] font-mono"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(245,158,11,0.1)" }}>
                <div style={{ color: "rgba(245,158,11,0.35)" }}>// 🎮 Programme de {playerName}</div>
                {savedLines.map((l, i) => (
                  <div key={i} className="ck-slide flex gap-2 items-baseline" style={{ animationDelay: `${i * 30}ms` }}>
                    <span style={{ color: "#fde68a", flexShrink: 0 }}>{l.fr}</span>
                    <span style={{ color: "rgba(245,158,11,0.25)", flexShrink: 0 }}>→</span>
                    <span style={{ color: "rgba(134,239,172,0.6)", flexShrink: 0 }}>{l.js}</span>
                  </div>
                ))}
                <div className="animate-pulse" style={{ color: "rgba(245,158,11,0.3)" }}>▌</div>
              </div>
            )}

            {/* Étape courante */}
            <div key={currentStep} className="ck-fadein space-y-4">
              <div>
                <div className="text-base font-black text-white">{step.title}</div>
                <div className="text-xs mt-0.5" style={{ color: "rgba(245,158,11,0.55)" }}>{step.description}</div>
              </div>

              {/* Contrôle */}
              {step.type === "dial" ? (
                <div className="flex justify-center">
                  <Dial value={v} onChange={setCurrentValue} />
                </div>
              ) : (
                <RuleToggle on={v === 1} onChange={nv => setCurrentValue(nv ? 1 : 0)} />
              )}

              {/* Mini preview */}
              <MiniPreview
                type={step.id === "gameover" ? "gameover" : step.id === "turbo" ? "turbo" : step.id}
                value={v}
              />

              {/* Pseudo-code */}
              <div className="rounded-xl p-3 space-y-1.5"
                style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(245,158,11,0.12)" }}>
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-black tracking-widest shrink-0 mt-px" style={{ color: "rgba(245,158,11,0.4)" }}>🇫🇷</span>
                  <span className="text-xs font-mono font-bold" style={{ color: "#fde68a" }}>{step.pseudoFR(v)}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-black tracking-widest shrink-0 mt-px" style={{ color: "rgba(245,158,11,0.4)" }}>💻</span>
                  <span className="text-xs font-mono" style={{ color: "#86efac" }}>{step.pseudoJS(v)}</span>
                </div>
              </div>

              {/* Bouton enregistrer */}
              <button onClick={saveCurrentLine}
                className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.97]"
                style={{
                  background: "linear-gradient(135deg, #92400e, #d97706)",
                  color: "white",
                  boxShadow: "0 0 20px rgba(245,158,11,0.2)",
                }}>
                ✓ Enregistrer cette ligne →
              </button>
            </div>
          </div>
        )}

        {/* ── COMPLET ── */}
        {phase === "complete" && (
          <div className="relative z-10 p-5 space-y-4">
            <div className="text-center">
              <div className="text-[10px] font-black tracking-widest mb-1" style={{ color: "#f59e0b" }}>
                ✅ PROGRAMME COMPLET
              </div>
              <div className="text-white font-black">Voilà ce que tu viens d'écrire !</div>
            </div>

            {/* Programme final complet */}
            <div className="rounded-xl p-4 space-y-1 text-[10px] font-mono overflow-hidden"
              style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <div style={{ color: "rgba(245,158,11,0.4)" }}>{"// 🎮 Programme de " + playerName}</div>
              <div style={{ color: "rgba(245,158,11,0.4)" }}>{"// ─────────────────────────"}</div>
              {savedLines.map((l, i) => (
                <div key={i} className="ck-slide" style={{ animationDelay: `${i * 60}ms` }}>
                  <div style={{ color: "#fde68a" }}>{l.fr}</div>
                  <div style={{ color: "rgba(134,239,172,0.7)", paddingLeft: 8 }}>→ {l.js}</div>
                </div>
              ))}
            </div>

            <button onClick={handleLaunch}
              className="w-full py-4 rounded-xl font-black text-lg tracking-widest transition-all hover:scale-[1.02] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #b45309, #f59e0b, #d97706)",
                color: "#030712",
                boxShadow: "0 0 40px rgba(245,158,11,0.4), 0 4px 16px rgba(0,0,0,0.5)",
              }}>
              🚀 DÉCOLLAGE
            </button>
          </div>
        )}
      </div>
    </>
  );
}
