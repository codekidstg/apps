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

// ── Labels ────────────────────────────────────────────────────────────────────
const SPEED_LABELS   = ["LENTE", "NORMALE", "RAPIDE", "TRÈS RAPIDE", "FULGURANT"];
const DENSITY_LABELS = ["RARE", "NORMALE", "DENSE", "SERRÉE", "EXTRÊME"];
const SIZE_LABELS    = ["MICRO", "PETITE", "NORMALE", "GRANDE", "ÉNORME"];
const THRESHOLD_OPTS = ["10", "20", "30", "40", "50", "60", "70", "80", "90", "100"];

// ── InlineSelect ──────────────────────────────────────────────────────────────
function InlineSelect({ value, options, onChange }: {
  value: string; options: string[]; onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <span ref={ref} className="relative inline-block">
      <button onClick={() => setOpen(o => !o)}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded font-black transition-all hover:bg-amber-400/15 active:scale-95"
        style={{ color: "#fbbf24", borderBottom: "1.5px dotted rgba(251,191,36,0.5)", lineHeight: 1.4, fontSize: "inherit" }}>
        {value}
        <span style={{ fontSize: 7, opacity: 0.6, marginTop: 1 }}>▾</span>
      </button>
      {open && (
        <span className="absolute z-30 left-0 top-full mt-1 rounded-xl overflow-hidden shadow-2xl block"
          style={{ background: "#0f172a", border: "1px solid rgba(245,158,11,0.35)", minWidth: "max-content" }}>
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setOpen(false); sfxTick(); }}
              className="block w-full text-left px-3 py-1.5 text-xs font-bold transition-colors hover:bg-amber-400/10"
              style={{ color: opt === value ? "#f59e0b" : "#94a3b8" }}>
              {opt === value ? "● " : "○ "}{opt}
            </button>
          ))}
        </span>
      )}
    </span>
  );
}

// ── Helpers texte plat ────────────────────────────────────────────────────────
function plainFR(id: string, v: number, t: number) {
  switch (id) {
    case "speed":     return `vitesse ← ${SPEED_LABELS[v - 1]} (${(2.5 + v * 0.7).toFixed(1)} px/image)`;
    case "density":   return `densité ← ${DENSITY_LABELS[v - 1]} (1 / ${(Math.max(40, 90 - v * 12) / 60).toFixed(1)}s)`;
    case "size":      return `taille ← ${SIZE_LABELS[v - 1]} (rayon ${6 + v * 2}–${12 + v * 5} px)`;
    case "collision": return v ? "SI collision ALORS perdre 1 vie" : "SI collision ALORS rien (invincible !)";
    case "gameover":  return v ? "SI vies = 0 ALORS arrêter le jeu" : "SI vies = 0 ALORS continuer";
    case "loop":      return v ? "RÉPÉTER indéfiniment : avancer les obstacles" : "RÉPÉTER 1 fois seulement";
    case "turbo":     return v ? `SI score ≥ ${t} ALORS vitesse × 1.6 (TURBO !)` : "Pas de turbo automatique";
    default:          return "";
  }
}
function plainJS(id: string, v: number, t: number) {
  switch (id) {
    case "speed":     return `const vitesse = ${(2.5 + v * 0.7).toFixed(1)};  // px par image`;
    case "density":   return `const délaiSpawn = ${(Math.max(40, 90 - v * 12) / 60).toFixed(1)};  // secondes`;
    case "size":      return `const taille = { min: ${6 + v * 2}, max: ${12 + v * 5} };  // pixels`;
    case "collision": return v ? "if (collision) { vies = vies - 1; }" : "// collision ignorée";
    case "gameover":  return v ? "if (vies === 0) { gameOver(); }" : "// le jeu ne s'arrête jamais";
    case "loop":      return v ? "while (enPartie) { mettreAJour(); }" : "// pas de boucle active";
    case "turbo":     return v ? `if (score >= ${t}) { vitesse *= 1.6; }` : "// pas de turbo";
    default:          return "";
  }
}

// ── Pseudo-code interactif ────────────────────────────────────────────────────
function PseudoFR({ id, v, threshold, onChangeV, onChangeThreshold }: {
  id: string; v: number; threshold: number;
  onChangeV: (nv: number) => void; onChangeThreshold: (t: number) => void;
}) {
  const lbl = (txt: string) => <span style={{ color: "rgba(253,230,138,0.6)" }}>{txt}</span>;
  const dim = (txt: string) => <span style={{ color: "rgba(253,230,138,0.3)", fontSize: "0.85em" }}>{txt}</span>;

  switch (id) {
    case "speed": return <span>
      {lbl("vitesse ← ")}
      <InlineSelect value={SPEED_LABELS[v - 1]} options={SPEED_LABELS}
        onChange={opt => onChangeV(SPEED_LABELS.indexOf(opt) + 1)} />
      {dim(` (${(2.5 + v * 0.7).toFixed(1)} px/image)`)}
    </span>;
    case "density": return <span>
      {lbl("densité ← ")}
      <InlineSelect value={DENSITY_LABELS[v - 1]} options={DENSITY_LABELS}
        onChange={opt => onChangeV(DENSITY_LABELS.indexOf(opt) + 1)} />
      {dim(` (1 / ${(Math.max(40, 90 - v * 12) / 60).toFixed(1)}s)`)}
    </span>;
    case "size": return <span>
      {lbl("taille ← ")}
      <InlineSelect value={SIZE_LABELS[v - 1]} options={SIZE_LABELS}
        onChange={opt => onChangeV(SIZE_LABELS.indexOf(opt) + 1)} />
      {dim(` (rayon ${6 + v * 2}–${12 + v * 5} px)`)}
    </span>;
    case "collision": return <span>
      {lbl("SI collision ALORS ")}
      <InlineSelect
        value={v ? "perdre 1 vie" : "rien (invincible !)"}
        options={["perdre 1 vie", "rien (invincible !)"]}
        onChange={opt => onChangeV(opt === "perdre 1 vie" ? 1 : 0)} />
    </span>;
    case "gameover": return <span>
      {lbl("SI vies = 0 ALORS ")}
      <InlineSelect
        value={v ? "arrêter le jeu" : "continuer quand même"}
        options={["arrêter le jeu", "continuer quand même"]}
        onChange={opt => onChangeV(opt === "arrêter le jeu" ? 1 : 0)} />
    </span>;
    case "loop": return <span>
      {lbl("RÉPÉTER ")}
      <InlineSelect
        value={v ? "indéfiniment" : "1 fois seulement"}
        options={["indéfiniment", "1 fois seulement"]}
        onChange={opt => onChangeV(opt === "indéfiniment" ? 1 : 0)} />
      {v === 1 && lbl(" : avancer les obstacles")}
    </span>;
    case "turbo": return <span>
      {v === 1 ? <>
        {lbl("SI score ≥ ")}
        <InlineSelect value={String(threshold)} options={THRESHOLD_OPTS}
          onChange={opt => onChangeThreshold(parseInt(opt))} />
        {lbl(" ALORS vitesse × 1.6")}{dim(" (TURBO !)")}
      </> : <span style={{ color: "rgba(253,230,138,0.3)", fontStyle: "italic" }}>Pas de turbo automatique</span>}
    </span>;
    default: return null;
  }
}

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

    function bg() {
      ctx.fillStyle = "#050b08"; ctx.fillRect(0, 0, W, H);
      bgStars.forEach(s => {
        ctx.fillStyle = `rgba(255,255,255,${0.3 + 0.3 * Math.sin(frame * 0.04 + s.x)})`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
        s.x -= 0.25; if (s.x < 0) { s.x = W; s.y = Math.random() * H; }
      });
    }
    function rock(ax: number, ay: number, ar: number) {
      ctx.save(); ctx.beginPath(); ctx.arc(ax, ay, ar, 0, Math.PI * 2);
      const g = ctx.createRadialGradient(ax - 2, ay - 2, 1, ax, ay, ar);
      g.addColorStop(0, "#9ca3af"); g.addColorStop(1, "#374151");
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = "#6b7280"; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
    }
    function ship(x: number, y: number) {
      ctx.save(); ctx.font = "18px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText("🚀", x, y); ctx.restore();
    }
    function lbl(txt: string) {
      ctx.fillStyle = "rgba(245,158,11,0.5)"; ctx.font = "bold 8px monospace";
      ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(txt, W - 5, H - 4);
    }

    function loop() {
      frame++; const v = valRef.current; bg();
      if (type === "speed" || type === "density" || type === "size") {
        const spd   = type === "speed"   ? 2.5 + v * 0.7 : 3.5;
        const spawn = type === "density" ? Math.max(40, 90 - v * 12) : 55;
        const minR  = type === "size"    ? 5 + v * 2 : 8;
        const maxR  = type === "size"    ? 10 + v * 5 : 20;
        if (frame % spawn === 0)
          asteroids.push({ x: W + 20, y: 15 + Math.random() * (H - 30), r: minR + Math.random() * (maxR - minR), vy: (Math.random() - 0.5) * 0.8 });
        asteroids = asteroids.filter(a => a.x + a.r > 0);
        for (const a of asteroids) { a.x -= spd; a.y += a.vy; a.y = Math.max(a.r, Math.min(H - a.r, a.y)); rock(a.x, a.y, a.r); }
        ship(32, H / 2);
        lbl(type === "speed" ? `${spd.toFixed(1)} px/img` : type === "density" ? `1/${(spawn / 60).toFixed(1)}s` : `${minR}–${maxR} px`);
      } else if (type === "collision") {
        const T = 110, t = frame % T;
        rock(W - 22 - (t / T) * (W - 70), H / 2, 13); ship(32, H / 2);
        if (t > 72 && t < 95) { ctx.fillStyle = "rgba(239,68,68,0.35)"; ctx.fillRect(0, 0, W, H); ctx.fillStyle = "#ef4444"; ctx.font = "bold 14px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("-1 ❤️", W / 2, H / 2); }
        else if (t >= 95) { ctx.fillStyle = "rgba(0,0,0,0.5)"; ctx.fillRect(0, 0, W, H); }
      } else if (type === "gameover") {
        const T = 190, t = frame % T;
        const lives = t < 45 ? 3 : t < 85 ? 2 : t < 125 ? 1 : 0;
        ctx.font = "20px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        [0, 1, 2].forEach(i => ctx.fillText(i < lives ? "❤️" : "🖤", W / 2 - 24 + i * 24, H / 2 - 12));
        if (lives === 0) { ctx.fillStyle = "rgba(239,68,68,0.85)"; ctx.font = "bold 13px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("GAME OVER", W / 2, H / 2 + 16); }
      } else if (type === "loop") {
        [0, 1, 2, 3].forEach((_, i) => {
          const x = ((frame * 1.8) + i * 52) % (W + 20) - 10;
          ctx.fillStyle = `rgba(245,158,11,${0.4 + 0.4 * Math.sin(frame * 0.05 + i)})`;
          ctx.font = "14px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
          ctx.fillText("→", x, H / 2 - 8);
        });
        ctx.fillStyle = "rgba(255,255,255,0.3)"; ctx.font = "8px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "bottom";
        ctx.fillText(`image n°${frame}  ·  Le jeu continue…`, W / 2, H - 4);
      } else if (type === "turbo") {
        const T = 200, t = frame % T, sc = Math.min(54, Math.floor(t * 0.28)), turbo = sc >= 50;
        if (turbo) { ctx.fillStyle = "rgba(245,158,11,0.12)"; ctx.fillRect(0, 0, W, H); }
        ctx.fillStyle = turbo ? "#f59e0b" : "rgba(255,255,255,0.8)";
        ctx.font = `bold ${turbo ? 26 : 20}px monospace`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(`${sc} pts`, W / 2, turbo ? H / 2 - 12 : H / 2);
        if (turbo) { ctx.fillStyle = "#f59e0b"; ctx.font = "bold 11px monospace"; ctx.fillText("⚡ VITESSE × 1.6 !", W / 2, H / 2 + 14); }
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [type]);

  return <canvas ref={canvasRef} width={320} height={130} className="rounded-xl w-full"
    style={{ border: "1px solid rgba(245,158,11,0.12)", display: "block" }} />;
}

// ── Cadran ────────────────────────────────────────────────────────────────────
function Dial({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const pct = (value - 1) / 4, angle = -135 + pct * 270, rad = (angle * Math.PI) / 180;
  const cx = 50, cy = 50, px = cx + 32 * Math.sin(rad), py = cy - 32 * Math.cos(rad);
  const ticks = Array.from({ length: 5 }, (_, i) => {
    const a = ((-135 + (i / 4) * 270) * Math.PI) / 180;
    return { x1: cx + 43 * Math.sin(a), y1: cy - 43 * Math.cos(a), x2: cx + 36 * Math.sin(a), y2: cy - 36 * Math.cos(a), lit: i <= value - 1 };
  });
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative" style={{ width: 130, height: 130 }}>
        <svg viewBox="0 0 100 100" width="130" height="130">
          <circle cx={cx} cy={cy} r={40} fill="none" stroke="rgba(245,158,11,0.07)" strokeWidth="10"
            strokeDasharray={`${0.75 * 2 * Math.PI * 40} 9999`} strokeDashoffset={`${-0.125 * 2 * Math.PI * 40}`} strokeLinecap="round" />
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.lit ? "#f59e0b" : "rgba(245,158,11,0.18)"} strokeWidth="2.5" strokeLinecap="round" />
          ))}
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.7))" }} />
          <circle cx={cx} cy={cy} r="3.5" fill="#f59e0b" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }} />
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="11" fontWeight="bold" fontFamily="monospace">{value}</text>
        </svg>
      </div>
      <div className="flex items-center gap-4">
        <button onClick={() => { if (value > 1) { onChange(value - 1); sfxTick(); } }} disabled={value <= 1}
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all disabled:opacity-20 hover:scale-110 active:scale-90"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>−</button>
        <button onClick={() => { if (value < 5) { onChange(value + 1); sfxTick(); } }} disabled={value >= 5}
          className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg transition-all disabled:opacity-20 hover:scale-110 active:scale-90"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>+</button>
      </div>
    </div>
  );
}

// ── Interrupteur ──────────────────────────────────────────────────────────────
function RuleToggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex justify-center py-2">
      <button onClick={() => { onChange(!on); sfxToggle(!on); }}
        className="flex flex-col items-center gap-3 px-12 py-5 rounded-2xl transition-all"
        style={{ background: on ? "rgba(245,158,11,0.08)" : "rgba(255,255,255,0.02)", border: `2px solid ${on ? "rgba(245,158,11,0.45)" : "rgba(255,255,255,0.07)"}` }}>
        <div className="relative w-7 h-12 rounded-full"
          style={{ background: on ? "rgba(245,158,11,0.2)" : "rgba(30,41,59,0.8)", border: `2px solid ${on ? "rgba(245,158,11,0.5)" : "#1e293b"}` }}>
          <div className="text-[9px] font-black absolute -top-4 left-1/2 -translate-x-1/2" style={{ color: on ? "#f59e0b" : "#334155" }}>I</div>
          <div className="absolute left-1/2 -translate-x-1/2 w-5 h-5 rounded-full transition-all duration-200"
            style={{ top: on ? "3px" : "18px", background: on ? "#f59e0b" : "#334155", boxShadow: on ? "0 0 8px rgba(245,158,11,0.9)" : "none" }} />
          <div className="text-[9px] font-black absolute -bottom-4 left-1/2 -translate-x-1/2" style={{ color: on ? "#334155" : "#1e293b" }}>O</div>
        </div>
        <div className="text-base font-black" style={{ color: on ? "#f59e0b" : "#475569" }}>
          {on ? "ACTIVÉE" : "DÉSACTIVÉE"}
        </div>
      </button>
    </div>
  );
}

// ── Étapes ────────────────────────────────────────────────────────────────────
const MICRO_STEPS = [
  { id: "speed",     type: "dial",   title: "⚡ Vitesse des obstacles", desc: "Plus c'est rapide, plus c'est difficile à esquiver." },
  { id: "density",   type: "dial",   title: "☄️ Densité des obstacles", desc: "Combien d'obstacles arrivent par seconde ?" },
  { id: "size",      type: "dial",   title: "📏 Taille des obstacles",  desc: "Des petits cailloux ou des rochers géants ?" },
  { id: "collision", type: "toggle", title: "💥 Règle : Collision",      desc: "Si ton vaisseau touche un obstacle, que se passe-t-il ?" },
  { id: "gameover",  type: "toggle", title: "☠️ Règle : Game Over",      desc: "Quand toutes les vies sont perdues, le jeu s'arrête ?" },
  { id: "loop",      type: "toggle", title: "🔄 Règle : Boucle infinie", desc: "Le jeu tourne en boucle — il ne s'arrête jamais seul." },
  { id: "turbo",     type: "toggle", title: "⚡ Règle : Turbo",          desc: "Au-delà d'un score, les obstacles accélèrent automatiquement." },
] as const;

// ── Props ─────────────────────────────────────────────────────────────────────
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
  const [phase, setPhase]             = useState<"briefing" | "steps" | "complete">("briefing");
  const [briefLines, setBriefLines]   = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [savedLines, setSavedLines]   = useState<{ fr: string; js: string }[]>([]);

  const [localSpeed,   setLocalSpeed]   = useState(speed);
  const [localDensity, setLocalDensity] = useState(obstacles);
  const [localSize,    setLocalSize]    = useState(obstacleSize);
  const [toggles, setToggles]           = useState({ collision: true, gameover: true, loop: true, turbo: false });
  const [turboThreshold, setTurboThreshold] = useState(50);

  // Briefing
  const BRIEF = [
    "> SYSTÈME ACTIVÉ...",
    `> IDENTIFICATION : AGENT ${playerName.toUpperCase()}`,
    "> MISSION : PROGRAMMER TON VAISSEAU",
    "> PRÊT À RECEVOIR LES PARAMÈTRES.",
  ];
  useEffect(() => {
    let li = 0, ci = 0;
    const lines: string[] = [];
    const id = setInterval(() => {
      if (li >= BRIEF.length) { clearInterval(id); setTimeout(() => setPhase("steps"), 500); return; }
      ci++; lines[li] = BRIEF[li].slice(0, ci); setBriefLines([...lines]);
      if (ci >= BRIEF[li].length) { li++; ci = 0; lines.push(""); }
    }, 28);
    return () => clearInterval(id);
  }, []);

  function getV() {
    const s = MICRO_STEPS[currentStep];
    if (s.id === "speed")   return localSpeed;
    if (s.id === "density") return localDensity;
    if (s.id === "size")    return localSize;
    return toggles[s.id as keyof typeof toggles] ? 1 : 0;
  }
  function setV(v: number) {
    const s = MICRO_STEPS[currentStep];
    if (s.id === "speed")   { setLocalSpeed(v); return; }
    if (s.id === "density") { setLocalDensity(v); return; }
    if (s.id === "size")    { setLocalSize(v); return; }
    setToggles(p => ({ ...p, [s.id]: v === 1 }));
  }

  function goBack() {
    if (currentStep > 0) { setCurrentStep(s => s - 1); setSavedLines(p => p.slice(0, -1)); }
  }

  function saveLine() {
    sfxSave();
    const s = MICRO_STEPS[currentStep];
    const v = getV();
    setSavedLines(p => [...p, { fr: plainFR(s.id, v, turboThreshold), js: plainJS(s.id, v, turboThreshold) }]);
    if (s.id === "speed")   setSpeed(localSpeed);
    if (s.id === "density") setObstacles(localDensity);
    if (s.id === "size")    setObstacleSize(localSize);
    if (currentStep < MICRO_STEPS.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      const r: Rule[] = [];
      if (toggles.collision) r.push({ id: "collision",   condition: "collision",   action: "lose_life" });
      if (toggles.gameover)  r.push({ id: "no_lives",    condition: "no_lives",    action: "game_over" });
      if (toggles.loop)      r.push({ id: "loop",        condition: "loop",        action: "continue" });
      if (toggles.turbo)     r.push({ id: "score_boost", condition: "score_boost", action: "speed_up", value: turboThreshold });
      setRules(r);
      setPhase("complete");
    }
  }

  function handleLaunch() { sfxLaunch(); setTimeout(onLaunch, 1800); }

  const step = MICRO_STEPS[currentStep];
  const v    = getV();

  return (
    <>
      <style>{`
        @keyframes scanline { 0%{transform:translateY(-4px);opacity:0} 10%{opacity:1} 90%{opacity:1} 100%{transform:translateY(600px);opacity:0} }
        .ck-scan { animation: scanline 4s linear infinite; }
        @keyframes fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        .ck-fadein { animation: fadein 0.35s ease both; }
        @keyframes slidein { from{opacity:0;transform:translateX(-5px)} to{opacity:1;transform:translateX(0)} }
        .ck-slide { animation: slidein 0.25s ease both; }
        @keyframes crt-flicker { 0%,100%{opacity:1} 50%{opacity:0.97} }
        .ck-crt { animation: crt-flicker 3s ease infinite; }
      `}</style>

      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "#050b08", border: "1px solid rgba(245,158,11,0.18)" }}>

        {/* Scan line */}
        <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden rounded-2xl" style={{ height: 700, zIndex: 1 }}>
          <div className="ck-scan absolute inset-x-0 h-px opacity-0"
            style={{ background: "linear-gradient(90deg,transparent,rgba(245,158,11,0.25),transparent)" }} />
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3"
          style={{ borderBottom: "1px solid rgba(245,158,11,0.1)" }}>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#f59e0b" }} />
            <span className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: "#f59e0b" }}>Mission Control</span>
          </div>
          {phase === "steps" && (
            <div className="text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.4)" }}>
              paramètre {currentStep + 1} / {MICRO_STEPS.length}
            </div>
          )}
          {phase === "complete" && <div className="text-[9px] font-black" style={{ color: "#f59e0b" }}>✅ COMPLET</div>}
        </div>

        {/* ── BRIEFING ── */}
        {phase === "briefing" && (
          <div className="relative z-10 px-6 py-8 min-h-[160px] flex flex-col justify-center gap-1">
            {briefLines.map((line, i) => (
              <p key={i} className="text-xs font-mono leading-relaxed"
                style={{ color: i === briefLines.length - 1 ? "#f59e0b" : "rgba(245,158,11,0.45)" }}>
                {line}{i === briefLines.length - 1 && <span className="animate-pulse ml-0.5">█</span>}
              </p>
            ))}
          </div>
        )}

        {/* ── STEPS ── */}
        {phase === "steps" && (
          <div className="relative z-10 p-4">

            {/* Programme accumulé — bande horizontale compacte */}
            {savedLines.length > 0 && (
              <div className="mb-4 rounded-xl px-4 py-2.5 overflow-x-auto"
                style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(245,158,11,0.1)" }}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[9px] font-mono shrink-0" style={{ color: "rgba(245,158,11,0.3)" }}>
                    🎮 {playerName} :
                  </span>
                  {savedLines.map((l, i) => (
                    <span key={i} className="ck-slide text-[10px] font-mono font-bold shrink-0 px-2 py-0.5 rounded-lg"
                      style={{ background: "rgba(245,158,11,0.08)", color: "#fde68a", animationDelay: `${i * 25}ms` }}>
                      {l.fr.split("(")[0].trim()}
                    </span>
                  ))}
                  <span className="animate-pulse text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.25)" }}>▌</span>
                </div>
              </div>
            )}

            {/* Layout 2 colonnes */}
            <div key={currentStep} className="ck-fadein grid gap-4" style={{ gridTemplateColumns: "1fr 1.4fr" }}>

              {/* ── COLONNE GAUCHE : tableau de bord ── */}
              <div className="flex flex-col gap-4">
                {/* Titre + description */}
                <div>
                  <div className="text-base font-black text-white">{step.title}</div>
                  <div className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(245,158,11,0.5)" }}>{step.desc}</div>
                </div>

                {/* Contrôle principal */}
                <div className="flex-1 flex items-center justify-center py-2">
                  {step.type === "dial"
                    ? <Dial value={v} onChange={setV} />
                    : <RuleToggle on={v === 1} onChange={nv => setV(nv ? 1 : 0)} />}
                </div>

                {/* Boutons action */}
                <div className="flex flex-col gap-2">
                  <button onClick={saveLine}
                    className="w-full py-3 rounded-xl font-black text-sm tracking-wide transition-all hover:scale-[1.02] active:scale-[0.97]"
                    style={{ background: "linear-gradient(135deg, #92400e, #d97706)", color: "white", boxShadow: "0 0 20px rgba(245,158,11,0.2)" }}>
                    ✓ Enregistrer →
                  </button>
                  {currentStep > 0 && (
                    <button onClick={goBack}
                      className="w-full text-center text-xs font-bold py-1.5 rounded-lg transition-colors hover:bg-slate-800"
                      style={{ color: "rgba(245,158,11,0.4)" }}>
                      ← Étape précédente
                    </button>
                  )}
                </div>
              </div>

              {/* ── COLONNE DROITE : preview + écran CRT ── */}
              <div className="flex flex-col gap-3">
                {/* Mini canvas preview */}
                <MiniPreview type={step.id} value={v} />

                {/* Écran CRT pseudo-code */}
                <div className="ck-crt rounded-xl flex-1 relative overflow-hidden"
                  style={{
                    background: "linear-gradient(180deg, #020c04 0%, #010a03 100%)",
                    border: "1px solid rgba(134,239,172,0.15)",
                    boxShadow: "inset 0 0 30px rgba(0,0,0,0.8), 0 0 12px rgba(74,222,128,0.05)",
                  }}>
                  {/* Scanlines CSS */}
                  <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
                    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
                  }} />
                  {/* Vignette */}
                  <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
                    background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.4) 100%)",
                  }} />

                  <div className="relative p-3 space-y-2">
                    {/* Header CRT */}
                    <div className="flex items-center gap-1.5 mb-2 pb-2" style={{ borderBottom: "1px solid rgba(134,239,172,0.1)" }}>
                      <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#4ade80" }} />
                      <span className="text-[8px] font-mono tracking-widest" style={{ color: "rgba(134,239,172,0.4)" }}>TRADUCTEUR DE CODE</span>
                    </div>

                    {/* Ligne FR interactive */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-[8px] font-mono mt-0.5 shrink-0" style={{ color: "rgba(134,239,172,0.3)" }}>🇫🇷</span>
                      <div className="text-sm font-mono font-bold leading-relaxed" style={{ color: "#fde68a" }}>
                        <PseudoFR id={step.id} v={v} threshold={turboThreshold}
                          onChangeV={setV} onChangeThreshold={setTurboThreshold} />
                      </div>
                    </div>

                    {/* Séparateur */}
                    <div style={{ borderTop: "1px solid rgba(134,239,172,0.07)" }} />

                    {/* Ligne JS */}
                    <div className="flex items-start gap-1.5">
                      <span className="text-[8px] font-mono mt-0.5 shrink-0" style={{ color: "rgba(134,239,172,0.3)" }}>💻</span>
                      <div className="text-xs font-mono leading-relaxed" style={{ color: "rgba(134,239,172,0.7)" }}>
                        {plainJS(step.id, v, turboThreshold)}
                      </div>
                    </div>

                    {/* Curseur clignotant */}
                    <div className="animate-pulse text-[10px] font-mono" style={{ color: "rgba(134,239,172,0.3)" }}>█</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── COMPLET ── */}
        {phase === "complete" && (
          <div className="relative z-10 p-5 space-y-4">
            <div className="text-center">
              <div className="text-white font-black text-lg">Voilà ce que tu viens de programmer !</div>
            </div>

            {/* Récap visuel paramètres */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "VITESSE",  val: SPEED_LABELS[localSpeed-1],     sub: `${(2.5+localSpeed*0.7).toFixed(1)} px/img` },
                { label: "DENSITÉ",  val: DENSITY_LABELS[localDensity-1], sub: `1/${(Math.max(40,90-localDensity*12)/60).toFixed(1)}s` },
                { label: "TAILLE",   val: SIZE_LABELS[localSize-1],       sub: `${6+localSize*2}–${12+localSize*5} px` },
              ].map(p => (
                <div key={p.label} className="rounded-xl p-3 text-center"
                  style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
                  <div className="text-[8px] font-black tracking-widest mb-1" style={{ color: "rgba(245,158,11,0.45)" }}>{p.label}</div>
                  <div className="text-xs font-black text-white leading-tight">{p.val}</div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(245,158,11,0.5)" }}>{p.sub}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: "collision", icon: "💥", label: "Collision" },
                { id: "gameover",  icon: "☠️", label: "Game Over" },
                { id: "loop",      icon: "🔄", label: "Boucle" },
                { id: "turbo",     icon: "⚡", label: `Turbo (≥${turboThreshold})` },
              ].map(r => {
                const on = toggles[r.id as keyof typeof toggles];
                return (
                  <div key={r.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                    style={{ background: on ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${on ? "rgba(245,158,11,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                    <span className="text-base">{r.icon}</span>
                    <span className="text-xs font-bold flex-1 text-white">{r.label}</span>
                    <span className="text-[9px] font-black" style={{ color: on ? "#f59e0b" : "#334155" }}>{on ? "● ON" : "○ OFF"}</span>
                  </div>
                );
              })}
            </div>

            {/* Code complet dans écran CRT */}
            <div className="ck-crt rounded-xl relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #020c04 0%, #010a03 100%)",
                border: "1px solid rgba(134,239,172,0.15)",
                boxShadow: "inset 0 0 30px rgba(0,0,0,0.8)",
              }}>
              <div className="absolute inset-0 pointer-events-none rounded-xl" style={{
                background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
              }} />
              <div className="relative p-4 space-y-1 font-mono text-[10px]">
                <div className="flex items-center gap-1.5 mb-3 pb-2" style={{ borderBottom: "1px solid rgba(134,239,172,0.1)" }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#4ade80" }} />
                  <span className="tracking-widest" style={{ color: "rgba(134,239,172,0.4)" }}>PROGRAMME DE {playerName.toUpperCase()}</span>
                </div>
                {savedLines.map((l, i) => (
                  <div key={i} className="ck-slide" style={{ animationDelay: `${i * 50}ms` }}>
                    <div style={{ color: "#fde68a" }}>{l.fr}</div>
                    <div style={{ color: "rgba(134,239,172,0.55)", paddingLeft: 8 }}>→ {l.js}</div>
                  </div>
                ))}
                <div className="animate-pulse mt-1" style={{ color: "rgba(134,239,172,0.3)" }}>█</div>
              </div>
            </div>

            <button onClick={handleLaunch}
              className="w-full py-4 rounded-xl font-black text-lg tracking-widest transition-all hover:scale-[1.02] active:scale-[0.97]"
              style={{ background: "linear-gradient(135deg, #b45309, #f59e0b, #d97706)", color: "#030712", boxShadow: "0 0 40px rgba(245,158,11,0.4)" }}>
              🚀 DÉCOLLAGE
            </button>
          </div>
        )}
      </div>
    </>
  );
}
