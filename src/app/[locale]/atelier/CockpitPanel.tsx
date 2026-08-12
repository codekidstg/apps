"use client";
import { useState, useEffect } from "react";
import type { Rule } from "./AtelierGame";

// ── Sons Web Audio ────────────────────────────────────────────────────────────
function playTick() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "square"; o.frequency.value = 1400;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
    o.start(); o.stop(ctx.currentTime + 0.04);
    setTimeout(() => ctx.close(), 200);
  } catch {}
}

function playToggle(on: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sine"; o.frequency.value = on ? 880 : 440;
    g.gain.setValueAtTime(0.12, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    o.start(); o.stop(ctx.currentTime + 0.15);
    setTimeout(() => ctx.close(), 300);
  } catch {}
}

function playLaunch() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.type = "sawtooth";
    o.frequency.setValueAtTime(150, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.5);
    g.gain.setValueAtTime(0.2, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    o.start(); o.stop(ctx.currentTime + 0.6);
    setTimeout(() => ctx.close(), 800);
  } catch {}
}

// ── Cadran rotatif ────────────────────────────────────────────────────────────
function Dial({ label, value, min, max, onChange, display }: {
  label: string; value: number; min: number; max: number;
  onChange: (v: number) => void; display: string;
}) {
  const pct = (value - min) / (max - min);
  const angle = -135 + pct * 270;
  const rad = (angle * Math.PI) / 180;
  const cx = 50, cy = 50;
  const px = cx + 32 * Math.sin(rad);
  const py = cy - 32 * Math.cos(rad);

  const ticks = Array.from({ length: max - min + 1 }, (_, i) => {
    const a = ((-135 + (i / (max - min)) * 270) * Math.PI) / 180;
    return {
      x1: cx + 44 * Math.sin(a), y1: cy - 44 * Math.cos(a),
      x2: cx + 38 * Math.sin(a), y2: cy - 38 * Math.cos(a),
      lit: i <= value - min,
    };
  });

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="text-[9px] font-black tracking-[0.15em] uppercase" style={{ color: "rgba(245,158,11,0.5)" }}>{label}</div>
      <div className="relative" style={{ width: 100, height: 100 }}>
        <svg viewBox="0 0 100 100" width="100" height="100">
          {/* Fond arc */}
          <circle cx={cx} cy={cy} r={42} fill="none" stroke="rgba(245,158,11,0.07)" strokeWidth="9"
            strokeDasharray={`${0.75 * 2 * Math.PI * 42} 9999`}
            strokeDashoffset={`${-0.125 * 2 * Math.PI * 42}`}
            strokeLinecap="round" />
          {/* Ticks */}
          {ticks.map((t, i) => (
            <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2}
              stroke={t.lit ? "#f59e0b" : "rgba(245,158,11,0.15)"} strokeWidth="2.5" strokeLinecap="round" />
          ))}
          {/* Aiguille */}
          <line x1={cx} y1={cy} x2={px} y2={py} stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }} />
          <circle cx={cx} cy={cy} r="3.5" fill="#f59e0b" style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.8))" }} />
          {/* Valeur centre */}
          <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
            fill="white" fontSize="9" fontWeight="bold" fontFamily="monospace">{display}</text>
        </svg>
        <button onClick={() => { if (value > min) { onChange(value - 1); playTick(); } }}
          disabled={value <= min}
          className="absolute bottom-0 left-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black transition-all disabled:opacity-20 hover:scale-110 active:scale-90"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>−</button>
        <button onClick={() => { if (value < max) { onChange(value + 1); playTick(); } }}
          disabled={value >= max}
          className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black transition-all disabled:opacity-20 hover:scale-110 active:scale-90"
          style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b" }}>+</button>
      </div>
    </div>
  );
}

// ── Interrupteur à bascule ────────────────────────────────────────────────────
function ToggleSwitch({ icon, label, sublabel, on, onChange }: {
  icon: string; label: string; sublabel: string; on: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button onClick={() => { onChange(!on); playToggle(!on); }}
      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-left transition-all"
      style={{
        background: on ? "rgba(245,158,11,0.06)" : "rgba(255,255,255,0.02)",
        border: `1px solid ${on ? "rgba(245,158,11,0.25)" : "rgba(255,255,255,0.05)"}`,
      }}>
      <span className="text-lg shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-black text-white leading-tight">{label}</div>
        <div className="text-[10px] leading-tight" style={{ color: "rgba(245,158,11,0.45)" }}>{sublabel}</div>
      </div>
      {/* Interrupteur physique vertical */}
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <div className="text-[8px] font-black" style={{ color: on ? "#f59e0b" : "#334155" }}>I</div>
        <div className="relative w-3.5 h-6 rounded-full"
          style={{ background: on ? "rgba(245,158,11,0.2)" : "rgba(30,41,59,0.8)", border: `1px solid ${on ? "rgba(245,158,11,0.4)" : "#1e293b"}` }}>
          <div className="absolute left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full transition-all duration-200"
            style={{
              top: on ? "2px" : "10px",
              background: on ? "#f59e0b" : "#334155",
              boxShadow: on ? "0 0 6px rgba(245,158,11,0.9)" : "none",
            }} />
        </div>
        <div className="text-[8px] font-black" style={{ color: on ? "#334155" : "#1e293b" }}>O</div>
      </div>
    </button>
  );
}

// ── Règles disponibles ────────────────────────────────────────────────────────
const RULE_DEFS = [
  { id: "collision",   icon: "💥", label: "Collision = Vie perdue",   sublabel: "Tu touches un obstacle → tu perds une vie",   condition: "collision",   action: "lose_life" },
  { id: "no_lives",   icon: "☠️", label: "Plus de vies = Game Over", sublabel: "0 vies restantes → la partie s'arrête",        condition: "no_lives",   action: "game_over" },
  { id: "loop",       icon: "🔄", label: "Jeu en boucle infinie",    sublabel: "Le jeu continue jusqu'à la mort",              condition: "loop",       action: "continue" },
  { id: "score_boost",icon: "⚡", label: "Turbo au score 50",        sublabel: "Score ≥ 50 → vitesse × 1.6 automatiquement",   condition: "score_boost",action: "speed_up", value: 50 },
];

// ── Composant principal ───────────────────────────────────────────────────────
type Props = {
  playerName: string;
  speed: number; setSpeed: (v: number) => void;
  obstacles: number; setObstacles: (v: number) => void;
  obstacleSize: number; setObstacleSize: (v: number) => void;
  rules: Rule[]; setRules: (r: Rule[]) => void;
  onLaunch: () => void;
};

export default function CockpitPanel({ playerName, speed, setSpeed, obstacles, setObstacles, obstacleSize, setObstacleSize, rules, setRules, onLaunch }: Props) {
  const [phase, setPhase] = useState<"briefing" | "controls" | "launch">("briefing");
  const [briefText, setBriefText] = useState("");
  const fullBrief = `> AGENT ${playerName.toUpperCase()} — PROGRAMME TON VAISSEAU AVANT LE DÉCOLLAGE.`;

  // Animation texte terminal
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setBriefText(fullBrief.slice(0, i));
      if (i >= fullBrief.length) {
        clearInterval(id);
        setTimeout(() => setPhase("controls"), 700);
      }
    }, 30);
    return () => clearInterval(id);
  }, []);

  // Règles actives
  const isActive = (id: string) => rules.some(r => r.id === id);
  function toggleRule(id: string, on: boolean) {
    const def = RULE_DEFS.find(r => r.id === id)!;
    if (on) setRules([...rules, { id: def.id, condition: def.condition, action: def.action, ...(def.value ? { value: def.value } : {}) }]);
    else setRules(rules.filter(r => r.id !== id));
  }

  // Affichage valeurs
  const speedDisplay   = `${(2.5 + speed * 0.7).toFixed(1)}`;
  const densityDisplay = `/${((Math.max(40, 90 - obstacles * 12)) / 60).toFixed(1)}s`;
  const sizeDisplay    = `${6 + obstacleSize * 2}px`;

  // Code JS pour le flash de lancement
  const codeLines = [
    `// 🎮 Jeu de ${playerName} — CodeKids`,
    ``,
    `const vitesse    = ${(2.5 + speed * 0.7).toFixed(1)};`,
    `const densité    = "${["rare","normal","dense","serré","extrême"][obstacles - 1]}";`,
    `const obstacles  = "${["micro","petit","normal","grand","énorme"][obstacleSize - 1]}";`,
    ``,
    ...RULE_DEFS.filter(r => isActive(r.id)).map(r => `règles.push("${r.id}"); // ${r.label}`),
  ];

  function handleLaunch() {
    playLaunch();
    setPhase("launch");
    setTimeout(onLaunch, 2200);
  }

  return (
    <>
      <style>{`
        @keyframes scanline {
          0%   { transform: translateY(-4px); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(420px); opacity: 0; }
        }
        .cockpit-scan { animation: scanline 4s linear infinite; }
        @keyframes codein {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .code-line { animation: codein 0.3s ease both; }
      `}</style>

      <div className="relative rounded-2xl overflow-hidden"
        style={{ background: "#050b08", border: "1px solid rgba(245,158,11,0.18)" }}>

        {/* Ligne de scan */}
        <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden" style={{ height: 420, zIndex: 1 }}>
          <div className="cockpit-scan absolute inset-x-0 h-0.5 opacity-0"
            style={{ background: "linear-gradient(90deg, transparent, rgba(245,158,11,0.3), transparent)" }} />
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
          <div className="text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.35)" }}>
            {rules.length} règle{rules.length > 1 ? "s" : ""} · v{(2.5 + speed * 0.7).toFixed(1)}
          </div>
        </div>

        {/* Phase Briefing */}
        {phase === "briefing" && (
          <div className="relative z-10 px-6 py-10 min-h-[140px] flex items-center">
            <p className="text-sm font-mono leading-relaxed" style={{ color: "#f59e0b" }}>
              {briefText}
              <span className="animate-pulse ml-0.5">█</span>
            </p>
          </div>
        )}

        {/* Phase Controls */}
        {phase === "controls" && (
          <div className="relative z-10 p-5 space-y-6">
            {/* Cadrans */}
            <div>
              <div className="text-[9px] font-black tracking-[0.15em] mb-4" style={{ color: "rgba(245,158,11,0.4)" }}>
                ⚙️ PARAMÈTRES PHYSIQUES
              </div>
              <div className="grid grid-cols-3 gap-1 place-items-center">
                <Dial label="VITESSE" value={speed} min={1} max={5} onChange={setSpeed} display={speedDisplay} />
                <Dial label="DENSITÉ" value={obstacles} min={1} max={5} onChange={setObstacles} display={densityDisplay} />
                <Dial label="TAILLE" value={obstacleSize} min={1} max={5} onChange={setObstacleSize} display={sizeDisplay} />
              </div>
            </div>

            {/* Interrupteurs */}
            <div>
              <div className="text-[9px] font-black tracking-[0.15em] mb-3" style={{ color: "rgba(245,158,11,0.4)" }}>
                📋 RÈGLES DU JEU
              </div>
              <div className="space-y-1.5">
                {RULE_DEFS.map(r => (
                  <ToggleSwitch key={r.id} icon={r.icon} label={r.label} sublabel={r.sublabel}
                    on={isActive(r.id)} onChange={v => toggleRule(r.id, v)} />
                ))}
              </div>
            </div>

            {/* Bouton décollage */}
            <button onClick={handleLaunch}
              className="w-full py-4 rounded-xl font-black text-lg tracking-widest transition-all hover:scale-[1.02] active:scale-[0.97]"
              style={{
                background: "linear-gradient(135deg, #b45309, #f59e0b, #d97706)",
                color: "#030712",
                boxShadow: "0 0 40px rgba(245,158,11,0.35), 0 4px 16px rgba(0,0,0,0.5)",
              }}>
              🚀 DÉCOLLAGE
            </button>
          </div>
        )}

        {/* Phase Launch — flash code */}
        {phase === "launch" && (
          <div className="relative z-10 p-6 min-h-[320px] flex flex-col justify-center gap-4">
            <div className="text-[10px] font-black tracking-widest" style={{ color: "#f59e0b" }}>
              ✅ PARAMÈTRES VALIDÉS — TRADUCTION EN JAVASCRIPT...
            </div>
            <div className="rounded-xl p-4 font-mono text-xs space-y-1 overflow-hidden"
              style={{ background: "rgba(0,0,0,0.7)", border: "1px solid rgba(245,158,11,0.15)" }}>
              {codeLines.map((line, i) => (
                <div key={i} className="code-line" style={{
                  animationDelay: `${i * 80}ms`,
                  color: line.startsWith("//") ? "rgba(245,158,11,0.4)"
                    : line.startsWith("règles") ? "#86efac"
                    : line === "" ? "transparent"
                    : "#fde68a",
                  minHeight: "1em",
                }}>
                  {line || " "}
                </div>
              ))}
            </div>
            <div className="text-center text-xs font-bold animate-pulse" style={{ color: "rgba(245,158,11,0.6)" }}>
              Chargement de ton jeu...
            </div>
          </div>
        )}
      </div>
    </>
  );
}
