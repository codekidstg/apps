"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

export type ThemeProgress = {
  theme1: 0 | 1 | 2;
  theme2: 0 | 1 | 2;
  theme3: 0 | 1 | 2;
  theme4: 0 | 1 | 2;
  theme5: 0 | 1 | 2;
};

const SPOTS = [
  { id: "theme1" as const, label: "Routes du Village", short: "Routes", x: 390, y: 272, color: "#f59e0b", r: 52 },
  { id: "theme2" as const, label: "Case du Griot",     short: "Griot",  x: 148, y: 200, color: "#a78bfa", r: 52 },
  { id: "theme3" as const, label: "Bibliothèque",      short: "Biblio", x: 548, y: 148, color: "#60a5fa", r: 52 },
  { id: "theme4" as const, label: "Palais",            short: "Palais", x: 648, y: 286, color: "#10b981", r: 52 },
  { id: "theme5" as const, label: "Galerie des Œuvres",short: "Galerie",x: 332, y: 408, color: "#ec4899", r: 52 },
];

const STARS: [number, number][] = [
  [50,25],[110,18],[195,42],[308,12],[418,32],[528,18],[648,38],[718,22],[778,48],
  [75,75],[168,62],[258,82],[378,68],[488,58],[598,72],[698,52],[758,88],
  [28,108],[138,118],[228,98],[348,112],[458,92],[578,108],[678,98],[748,78],
  [88,140],[158,132],[448,125],[568,138],[728,128],
];

// [x, y, scale, animDelay]
const TREES: [number, number, number, number][] = [
  [62,172,1.1,0],[96,190,0.85,1],[112,176,0.9,2],
  [236,149,1.0,3],[292,166,1.2,4],[322,159,0.8,5],
  [476,211,0.9,6],[500,230,1.1,7],
  [616,189,1.0,8],[632,173,0.85,9],[647,196,1.1,10],
  [711,341,0.9,11],[732,359,1.1,12],[752,326,0.8,13],
  [56,381,1.1,14],[76,419,0.9,15],[246,453,1.0,16],[263,433,0.85,17],
  [449,446,0.9,18],[466,461,1.1,19],[583,436,1.0,20],[606,453,0.8,21],
  [491,161,0.7,22],[506,173,0.85,23],
];

// Lampadaires: [x, y]
const LAMPS: [number, number][] = [
  [285, 253],[200, 228],          // T1→T2
  [438, 220],[494, 183],          // T1→T3
  [490, 274],[570, 280],          // T1→T4
  [368, 322],[350, 370],          // T1→T5
];

// Fireflies
const FIREFLIES: [number, number, number, number][] = [
  [75,315,1,0],[120,355,2,1.1],[185,395,3,0.5],
  [225,345,1,2.2],[438,458,2,0.3],[472,425,3,1.7],
  [535,448,1,0.9],[622,398,2,1.4],[662,368,3,0.1],
  [732,388,1,1.8],[272,468,2,2.5],[358,452,3,0.7],
  [562,418,1,1.3],[158,302,2,0.6],[685,312,3,2.0],
];

// Couleurs des voitures
const CAR_COLORS = ["#ef4444","#3b82f6","#f59e0b","#10b981","#a78bfa","#ec4899"];

// Ce que Kodi dit quand le quartier est encore verrouillé — narratif + actionnable
const UNLOCK_HINT: Record<string, string> = {
  theme2: "Finis les Routes du Village et le Griot se réveillera.",
  theme3: "Le Griot doit chanter avant que la Bibliothèque n'ouvre.",
  theme4: "Lis à la Bibliothèque avant de frapper au Palais.",
  theme5: "Le Palais doit te reconnaître avant la Galerie.",
};

// ─── Sous-composants ────────────────────────────────────────────────────────

function Tree({ x, y, s, d }: { x:number; y:number; s:number; d:number }) {
  const leaves: [number,number,number,number,string][] = [
    [-s*10,-s*4, s*7,s*5,"#15803d"],[ s*9,-s*3, s*6,s*4.5,"#16a34a"],
    [-s*5,-s*13, s*6,s*4.5,"#22c55e"],[ s*4,-s*14, s*5,s*4,"#4ade80"],
    [-s*14,-s*6, s*5,s*3.5,"#15803d"],[ s*12,-s*8, s*5,s*3.5,"#16a34a"],
    [0,-s*18, s*5,s*4,"#4ade80"],[-s*3,-s*8, s*7,s*5,"#22c55e"],
  ];
  return (
    <g transform={`translate(${x},${y})`}
      style={{ animation: `vSway ${3.5+(d%3)*0.7}s ease-in-out ${d*0.45}s infinite` }}>
      {/* Trunk */}
      <rect x={-3} y={0} width={6} height={s*14} rx={2} fill="#713f12" />
      {/* Main canopy */}
      <circle cx={0} cy={-s*8} r={s*13} fill="#166534" />
      {/* Individual leaves */}
      {leaves.map(([lx,ly,rx,ry,c],i) => (
        <ellipse key={i} cx={lx} cy={ly} rx={rx} ry={ry} fill={c}
          style={{ animation: `vLeaf${(i%3)+1} ${2+(i*0.3)%2}s ease-in-out ${i*0.4+d*0.15}s infinite` }} />
      ))}
    </g>
  );
}

function Lamppost({ x, y, lit }: { x:number; y:number; lit:boolean }) {
  return (
    <g transform={`translate(${x},${y})`}>
      {/* Base */}
      <rect x={-3} y={0} width={6} height={28} rx={2} fill="#78350f" />
      {/* Arm */}
      <path d="M0,0 Q0,-8 8,-10" fill="none" stroke="#78350f" strokeWidth={3} strokeLinecap="round" />
      {/* Bulb */}
      <circle cx={8} cy={-10} r={5}
        fill={lit ? "#fef3c7" : "#374151"}
        style={lit ? { animation: "vPulse 3s ease-in-out infinite" } : {}} />
      {/* Glow pool */}
      {lit && (
        <ellipse cx={8} cy={20} rx={22} ry={8} fill="#fcd34d" opacity={0.12}
          style={{ animation: "vPulse 3s ease-in-out infinite" }} />
      )}
    </g>
  );
}

function TrafficLight({ x, y, phase }: { x:number; y:number; phase:number }) {
  // phase: 0=green,1=yellow,2=red
  return (
    <g transform={`translate(${x},${y})`}>
      <rect x={-5} y={-32} width={10} height={30} rx={2} fill="#1e293b" stroke="#334155" strokeWidth={1} />
      <rect x={-4} y={0} width={8} height={22} rx={1} fill="#334155" />
      {/* Lights */}
      <circle cx={0} cy={-26} r={3.5} fill={phase===2 ? "#ef4444" : "#1e293b"} stroke="#ef444455" strokeWidth={1} />
      <circle cx={0} cy={-18} r={3.5} fill={phase===1 ? "#f59e0b" : "#1e293b"} stroke="#f59e0b55" strokeWidth={1} />
      <circle cx={0} cy={-10} r={3.5} fill={phase===0 ? "#22c55e" : "#1e293b"} stroke="#22c55e55" strokeWidth={1} />
    </g>
  );
}

function NPC({ pathId, dur, delay, color, size=1 }: { pathId:string; dur:number; delay:number; color:string; size?:number }) {
  const s = size;
  return (
    <g>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
        <mpath href={`#${pathId}`} />
      </animateMotion>
      {/* Body */}
      <ellipse cx={0} cy={s*2} rx={s*5} ry={s*7} fill={color} />
      {/* Head */}
      <circle cx={0} cy={-s*6} r={s*5} fill="#fbbf24" />
      {/* Eyes */}
      <circle cx={-s*1.5} cy={-s*7} r={s} fill="#1e293b" />
      <circle cx={s*1.5}  cy={-s*7} r={s} fill="#1e293b" />
    </g>
  );
}

function Car({ pathId, dur, delay, color }: { pathId:string; dur:number; delay:number; color:string }) {
  return (
    <g>
      <animateMotion dur={`${dur}s`} begin={`${delay}s`} repeatCount="indefinite" rotate="auto">
        <mpath href={`#${pathId}`} />
      </animateMotion>
      <rect x={-9} y={-5} width={18} height={10} rx={3} fill={color} />
      <rect x={-6} y={-8} width={12} height={6} rx={2} fill={color} opacity={0.7} />
      <circle cx={-6} cy={5} r={3} fill="#1e293b" />
      <circle cx={6}  cy={5} r={3} fill="#1e293b" />
      <circle cx={-6} cy={-5} r={3} fill="#1e293b" />
      <circle cx={6}  cy={-5} r={3} fill="#1e293b" />
      {/* Headlights */}
      <circle cx={9} cy={-2} r={1.5} fill="#fef3c7" opacity={0.9} />
      <circle cx={9} cy={2}  r={1.5} fill="#fef3c7" opacity={0.9} />
    </g>
  );
}

function Firework({ x, y, color }: { x:number; y:number; color:string }) {
  const ARMS = 8;
  return (
    <g transform={`translate(${x},${y})`}>
      {Array.from({ length: ARMS }, (_, i) => {
        const angle = (i / ARMS) * Math.PI * 2;
        const ex = Math.cos(angle) * 35;
        const ey = Math.sin(angle) * 35;
        return (
          <line key={i} x1={0} y1={0} x2={ex} y2={ey}
            stroke={color} strokeWidth={2} strokeLinecap="round"
            style={{ animation: `vFwArm 1.8s ease-out ${i*0.05}s infinite` }} />
        );
      })}
      <circle r={5} fill={color} style={{ animation: "vFwCore 1.8s ease-out infinite" }} />
    </g>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────

export default function VillageMap({
  progress,
  kodiMessage,
  themeIds,
  locale = "fr",
}: {
  progress: ThemeProgress;
  kodiMessage?: string;
  /** UUID des 5 thèmes Explorer, dans l'ordre theme1…theme5. Sans eux, l'entrée reste décorative. */
  themeIds?: string[];
  locale?: string;
}) {
  const router = useRouter();

  // Avatar free movement — tous les refs pour éviter stale closure dans le RAF loop
  const keysRef    = useRef<Set<string>>(new Set());
  const posRef     = useRef({ x: SPOTS[0].x, y: SPOTS[0].y - 32 });
  const rafRef     = useRef<number>(0);
  const facingRef  = useRef<"left"|"right">("right");
  const nearRef    = useRef<number | null>(null);
  /** Bloque le déplacement + double déclenchement pendant le portail */
  const busyRef    = useRef(false);
  /** Pont entre le RAF loop et enterSpot(), qui a besoin des state courants */
  const enterRef   = useRef<(i: number) => void>(() => {});

  const [avatarPos, setAvatarPos] = useState({ x: SPOTS[0].x, y: SPOTS[0].y - 32 });
  const [facing,    setFacing]    = useState<"left"|"right">("right");

  // Bubble + nearby spot
  const [bubble,    setBubble]    = useState<string | null>(kodiMessage ?? null);
  const [nearSpot,  setNearSpot]  = useState<number | null>(null);

  // Entrée dans un quartier : portail ouvert, ou refus
  const [portal,  setPortal]  = useState<number | null>(null);
  /** Bâtiment refusé — pilote la secousse + le cadenas, retombe après 0,7 s */
  const [refused, setRefused] = useState<number | null>(null);
  /** Le message affiché est un refus — vit aussi longtemps que la bulle */
  const [denyMsg, setDenyMsg] = useState(false);

  // Traffic light phase (0=green,1=yellow,2=red)
  const [tlPhase, setTlPhase] = useState(0);

  // Mouse parallax
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  // Clouds (x offset animated via CSS, but we need initial positions)
  // Fireworks for completed buildings
  const unlockedCount = SPOTS.filter(s => progress[s.id] >= 1).length;

  // Day/night based on progress
  const illum = Math.min(1, unlockedCount / 5);
  const skyTop    = lerpColor("#060b24","#0c1e6e", illum);
  const skyBottom = lerpColor("#1a2d15","#0f4c2a", illum);

  // Arrow key movement loop
  useEffect(() => {
    // Les lettres sont normalisées en minuscule : sinon un « a » enfoncé puis
    // Shift relâche un « A » qui ne supprime jamais le « a » — l'avatar part tout seul.
    const norm = (k: string) => (k.length === 1 ? k.toLowerCase() : k);
    const WATCHED = ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","w","a","s","d","e"," ","Enter"];

    const onDown = (e: KeyboardEvent) => {
      const k = norm(e.key);
      keysRef.current.add(k);
      if (WATCHED.includes(k)) e.preventDefault();
    };
    const onUp = (e: KeyboardEvent) => keysRef.current.delete(norm(e.key));
    // Perdre le focus (Cmd-Tab, changement d'onglet) n'envoie aucun keyup :
    // sans ça l'avatar continuerait de courir indéfiniment.
    const release = () => keysRef.current.clear();

    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup",   onUp);
    window.addEventListener("blur",    release);
    document.addEventListener("visibilitychange", release);

    const SPEED = 2.5;
    const loop = () => {
      const k = keysRef.current;

      // Pendant le portail, l'avatar est figé — plus aucune entrée n'est lue
      if (busyRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      let { x, y } = posRef.current;
      let moved = false;
      let newFacing: "left"|"right" = facingRef.current;

      if (k.has("ArrowUp")    || k.has("w")) { y -= SPEED; moved = true; }
      if (k.has("ArrowDown")  || k.has("s")) { y += SPEED; moved = true; }
      if (k.has("ArrowLeft")  || k.has("a")) { x -= SPEED; moved = true; newFacing = "left"; }
      if (k.has("ArrowRight") || k.has("d")) { x += SPEED; moved = true; newFacing = "right"; }

      x = Math.max(28, Math.min(772, x));
      y = Math.max(162, Math.min(465, y));

      // Quartier à portée — verrouillé compris, pour pouvoir expliquer le refus
      let near: number | null = null;
      for (let i = 0; i < SPOTS.length; i++) {
        const s = SPOTS[i];
        const dx = x - s.x, dy = y - (s.y - 32);
        if (Math.sqrt(dx*dx + dy*dy) < 55) { near = i; break; }
      }

      if (moved) {
        posRef.current = { x, y };
        setAvatarPos({ x, y });
      }
      if (near !== nearRef.current) {
        nearRef.current = near;
        setNearSpot(near);
      }
      if (newFacing !== facingRef.current) {
        facingRef.current = newFacing;
        setFacing(newFacing);
      }

      // Entrée / E / Espace pour franchir le seuil
      if ((k.has("Enter") || k.has("e") || k.has(" ")) && near !== null) {
        k.delete("Enter"); k.delete("e"); k.delete(" ");
        enterRef.current(near);
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup",   onUp);
      cancelAnimationFrame(rafRef.current);
    };
  }, []); // eslint-disable-line

  // Traffic light cycle
  useEffect(() => {
    const t = setInterval(() => setTlPhase(p => (p + 1) % 3), 4000);
    return () => clearInterval(t);
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - r.left  - r.width  / 2) / (r.width  / 2),
      y: (e.clientY - r.top   - r.height / 2) / (r.height / 2),
    });
  }, []);

  const skyTx = `translate(${mouse.x * -10}, ${mouse.y * -7})`;
  const treeTx = `translate(${mouse.x * -5}, ${mouse.y * -4})`;

  // Le RAF loop appelle enterSpot via ce ref, réassigné à chaque rendu pour rester frais
  enterRef.current = enterSpot;

  const nearLocked = nearSpot !== null && progress[SPOTS[nearSpot].id] === 0 && nearSpot !== 0;

  return (
    <div
      tabIndex={0}
      style={{ width:"100%", borderRadius:16, overflow:"hidden", background:"#060b24",
               userSelect:"none", outline:"none" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setMouse({ x:0, y:0 })}
    >
      <svg viewBox="0 0 800 500" style={{ width:"100%", display:"block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Sky */}
          <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor={skyTop} />
            <stop offset="55%"  stopColor={lerpColor("#0f1a40","#1a3a80",illum)} />
            <stop offset="100%" stopColor={skyBottom} />
          </linearGradient>
          {/* Ground */}
          <radialGradient id="vGround" cx="45%" cy="35%" r="70%">
            <stop offset="0%"   stopColor={lerpColor("#2a4418","#3a5c22",illum)} />
            <stop offset="100%" stopColor={lerpColor("#111d0a","#1a2d0e",illum)} />
          </radialGradient>
          {/* River */}
          <linearGradient id="vRiver" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1d4ed8" />
            <stop offset="50%"  stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="vRiverShine" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#bfdbfe" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#bfdbfe" stopOpacity="0" />
          </linearGradient>
          {/* Moon halo */}
          <radialGradient id="vMoonH" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fef3c7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </radialGradient>
          {/* Light pools per quartier */}
          <radialGradient id="lgLamp"   cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#fcd34d" stopOpacity="0.38" /><stop offset="100%" stopColor="#fcd34d" stopOpacity="0" /></radialGradient>
          <radialGradient id="lgGriot"  cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#a78bfa" stopOpacity="0.32" /><stop offset="100%" stopColor="#a78bfa" stopOpacity="0" /></radialGradient>
          <radialGradient id="lgBiblio" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#60a5fa" stopOpacity="0.32" /><stop offset="100%" stopColor="#60a5fa" stopOpacity="0" /></radialGradient>
          <radialGradient id="lgPalais" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#10b981" stopOpacity="0.32" /><stop offset="100%" stopColor="#10b981" stopOpacity="0" /></radialGradient>
          <radialGradient id="lgGal"    cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#ec4899" stopOpacity="0.32" /><stop offset="100%" stopColor="#ec4899" stopOpacity="0" /></radialGradient>

          {/* Filters */}
          <filter id="vGlow"    x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="vSoft"    x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="vFF"      x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="2.5" result="b" /><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="vLPool"   x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="10" /></filter>
          <filter id="vWPool"   x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="8" /></filter>
          <filter id="vLock"><feColorMatrix type="saturate" values="0" result="g" /><feComponentTransfer in="g"><feFuncR type="linear" slope="0.35" /><feFuncG type="linear" slope="0.35" /><feFuncB type="linear" slope="0.35" /></feComponentTransfer></filter>
          <filter id="vRiverBlur" x="-5%" y="-5%" width="110%" height="110%"><feGaussianBlur stdDeviation="1.5" /></filter>

          {/* NPC + Car paths */}
          <path id="npcPath1" d="M390,240 Q430,265 390,290 Q350,315 310,290 Q270,265 310,240 Q350,215 390,240" fill="none" />
          <path id="npcPath2" d="M240,252 Q280,245 320,252 Q360,259 320,266 Q280,273 240,266 Q200,259 240,252" fill="none" />
          <path id="npcPath3" d="M390,272 Q420,300 450,310 Q420,320 390,310 Q360,300 390,272" fill="none" />
          <path id="carPath1" d="M390,268 Q462,202 548,148 Q462,202 390,268" fill="none" />
          <path id="carPath2" d="M390,272 L648,286 L390,272" fill="none" />
          <path id="carPath3" d="M390,272 Q368,335 332,408 Q368,335 390,272" fill="none" />
          <path id="carPath4" d="M148,200 Q270,248 390,272 Q270,248 148,200" fill="none" />
          <path id="birdPath" d="M-20,80 Q200,60 400,90 Q600,120 820,70" fill="none" />
          <path id="cloud1"   d="M850,55 L-50,55"  fill="none" />
          <path id="cloud2"   d="M850,85 L-50,85"  fill="none" />
          <path id="cloud3"   d="M850,38 L-50,38"  fill="none" />

          {/* CSS Animations */}
          <style>{`
            @keyframes vTwinkle { 0%,100%{opacity:.12} 50%{opacity:.95} }
            @keyframes vBob     { 0%,100%{transform:translateY(0)}  50%{transform:translateY(-4px)} }
            @keyframes vFloat   { 0%,100%{transform:translateY(0)rotate(0deg)} 50%{transform:translateY(-8px)rotate(180deg)} }
            @keyframes vPulse   { 0%,100%{opacity:.45} 50%{opacity:1} }
            @keyframes vMoon    { 0%,100%{opacity:.85} 50%{opacity:1} }
            @keyframes vRoad    { 0%{stroke-dashoffset:24} 100%{stroke-dashoffset:0} }
            @keyframes vSway    { 0%,100%{transform:rotate(-2deg);transform-origin:50% 100%} 50%{transform:rotate(2deg);transform-origin:50% 100%} }
            @keyframes vAura    { 0%,100%{opacity:.07} 50%{opacity:.18} }
            @keyframes vSmoke   { 0%{transform:translateY(0)scaleX(1);opacity:.55} 100%{transform:translateY(-34px)scaleX(2.8);opacity:0} }
            @keyframes vFly1    { 0%,100%{transform:translate(0,0)} 30%{transform:translate(14px,-18px)} 65%{transform:translate(-9px,-11px)} }
            @keyframes vFly2    { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-16px,11px)} 70%{transform:translate(11px,-9px)} }
            @keyframes vFly3    { 0%,100%{transform:translate(0,0)} 50%{transform:translate(18px,9px)}  80%{transform:translate(-13px,-16px)} }
            @keyframes vLamp    { 0%,100%{opacity:.7} 50%{opacity:1} }
            @keyframes vWink    { 0%,95%,100%{opacity:1} 96%{opacity:.25} }
            @keyframes vLeaf1   { 0%,100%{transform:rotate(-6deg)} 50%{transform:rotate(6deg)} }
            @keyframes vLeaf2   { 0%,100%{transform:rotate(4deg) scale(1)} 50%{transform:rotate(-4deg) scale(1.08)} }
            @keyframes vLeaf3   { 0%,100%{transform:translateX(0)} 50%{transform:translateX(4px)} }
            @keyframes vRiverFlow { 0%{stroke-dashoffset:60} 100%{stroke-dashoffset:0} }
            @keyframes vRiverShine{ 0%,100%{opacity:.15} 50%{opacity:.45} }
            @keyframes vFwArm   { 0%{opacity:1;transform:scale(0)} 60%{opacity:.8;transform:scale(1)} 100%{opacity:0;transform:scale(1)} }
            @keyframes vFwCore  { 0%{r:2;opacity:1} 100%{r:14;opacity:0} }
            @keyframes vWing    { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(-0.4)} }
            @keyframes vBlink   { 0%,96%,100%{opacity:1} 97%{opacity:.2} }
            @keyframes vCloud   { 0%{opacity:0} 5%,90%{opacity:.85} 100%{opacity:0} }
            @keyframes vNudge   { 0%,100%{transform:translateX(0)} 50%{transform:translateX(2px)} }
            @keyframes vShake   { 0%,100%{transform:translateX(0)} 15%{transform:translateX(-5px)} 30%{transform:translateX(5px)} 45%{transform:translateX(-4px)} 60%{transform:translateX(4px)} 80%{transform:translateX(-2px)} }
            @keyframes vDeny    { 0%{transform:scale(.6);opacity:0} 25%{transform:scale(1.25);opacity:1} 60%{transform:scale(1);opacity:1} 100%{transform:scale(1);opacity:0} }
            @keyframes vReady   { 0%,100%{transform:translateY(0);opacity:.9} 50%{transform:translateY(-3px);opacity:1} }
            @keyframes vPortalT { 0%{opacity:0;transform:scale(.85)} 45%{opacity:1;transform:scale(1)} 100%{opacity:1;transform:scale(1)} }
            .vMove { transition:transform 0.05s linear; }
            .vBtn  { cursor:pointer; }
            .vBtn:hover .vHover { opacity:1!important; }
          `}</style>
        </defs>

        {/* ══════════ LAYER 0 — SKY ══════════ */}
        <rect width="800" height="500" fill="url(#vSky)" />

        {/* Stars + Moon parallax */}
        <g transform={skyTx} style={{ transition:"transform 0.14s ease-out" }}>
          {STARS.map(([cx,cy],i) => (
            <circle key={i} cx={cx} cy={cy} r={i%5===0?2:1.3} fill="white"
              style={{ animation:`vTwinkle ${2.4+(i%4)*0.9}s ease-in-out ${(i*0.38)%3}s infinite` }} />
          ))}
          <circle cx={715} cy={52} r={52} fill="url(#vMoonH)" />
          <circle cx={715} cy={52} r={30} fill="#fef3c7" style={{ animation:"vMoon 5s ease-in-out infinite" }} />
          <circle cx={727} cy={44} r={24} fill={lerpColor("#0f1a40","#1a3a80",illum)} />
          <circle cx={700} cy={60} r={4}   fill="#fde68a" opacity={0.3} />
          <circle cx={707} cy={48} r={2.5} fill="#fde68a" opacity={0.22} />
        </g>

        {/* ══════════ CLOUDS ══════════ */}
        {[["cloud1",0.82,55],["cloud2",0.65,38],["cloud3",0.9,22]].map(([pid,op,dur],i) => (
          <g key={i} opacity={0.18 + illum*0.15}
            style={{ animation:`vCloud ${Number(dur)+10}s ease-in-out ${i*8}s infinite` }}>
            <animateMotion dur={`${Number(dur)*3}s`} begin={`${i*10}s`} repeatCount="indefinite">
              <mpath href={`#${pid}`} />
            </animateMotion>
            <ellipse cx={0} cy={0} rx={45} ry={18} fill="white" opacity={Number(op)} />
            <ellipse cx={-20} cy={-6} rx={25} ry={14} fill="white" opacity={Number(op)*0.8} />
            <ellipse cx={20}  cy={-5} rx={30} ry={13} fill="white" opacity={Number(op)*0.9} />
          </g>
        ))}

        {/* ══════════ BIRDS ══════════ */}
        <g>
          <animateMotion dur="22s" begin="5s" repeatCount="indefinite">
            <mpath href="#birdPath" />
          </animateMotion>
          {/* 3 birds in a V */}
          {[[0,0],[18,-8],[-18,-8]].map(([bx,by],i) => (
            <g key={i} transform={`translate(${bx},${by})`}>
              <path d="M-6,0 Q0,-4 6,0" fill="none" stroke="#c4b5fd" strokeWidth={1.5} strokeLinecap="round"
                style={{ animation:`vWing ${0.6+(i*0.15)}s ease-in-out ${i*0.1}s infinite` }} />
            </g>
          ))}
        </g>
        {/* Second flock delayed */}
        <g>
          <animateMotion dur="28s" begin="14s" repeatCount="indefinite">
            <mpath href="#birdPath" />
          </animateMotion>
          {[[0,0],[14,-6]].map(([bx,by],i) => (
            <g key={i} transform={`translate(${bx},${by})`}>
              <path d="M-5,0 Q0,-4 5,0" fill="none" stroke="#d4d4d8" strokeWidth={1.5} strokeLinecap="round"
                style={{ animation:`vWing ${0.7}s ease-in-out ${i*0.15}s infinite` }} />
            </g>
          ))}
        </g>

        {/* ══════════ LAYER 1 — GROUND ══════════ */}
        <rect x="0" y="148" width="800" height="352" fill="url(#vGround)" />
        <ellipse cx={180} cy={360} rx={90} ry={32} fill="#1e3510" opacity={0.55} />
        <ellipse cx={580} cy={440} rx={110} ry={38} fill="#1e3510" opacity={0.45} />
        <ellipse cx={680} cy={220} rx={65}  ry={24} fill="#1e3510" opacity={0.45} />

        {/* Ground light pools */}
        <ellipse cx={390} cy={288} rx={85} ry={28} fill="url(#lgLamp)" filter="url(#vLPool)"
          style={{ animation:"vLamp 3s ease-in-out infinite" }} />
        {progress.theme2>=1 && <ellipse cx={148} cy={228} rx={58} ry={18} fill="url(#lgGriot)"  filter="url(#vWPool)" style={{ animation:"vLamp 4s ease-in-out 0.5s infinite" }} />}
        {progress.theme3>=1 && <ellipse cx={548} cy={200} rx={62} ry={18} fill="url(#lgBiblio)" filter="url(#vWPool)" style={{ animation:"vLamp 4s ease-in-out 1s infinite" }} />}
        {progress.theme4>=1 && <ellipse cx={648} cy={332} rx={66} ry={20} fill="url(#lgPalais)" filter="url(#vWPool)" style={{ animation:"vLamp 4s ease-in-out 1.5s infinite" }} />}
        {progress.theme5>=1 && <ellipse cx={332} cy={450} rx={72} ry={18} fill="url(#lgGal)"    filter="url(#vWPool)" style={{ animation:"vLamp 4s ease-in-out 2s infinite" }} />}

        {/* ══════════ LAYER 2 — RIVER ══════════ */}
        {/* River bed (shadow) */}
        <path d="M660,152 Q580,180 505,208 Q430,234 370,248 Q305,260 258,278 Q215,296 178,332 Q152,358 132,418"
          fill="none" stroke="#0c1a3a" strokeWidth={26} strokeLinecap="round" />
        {/* River body */}
        <path d="M660,152 Q580,180 505,208 Q430,234 370,248 Q305,260 258,278 Q215,296 178,332 Q152,358 132,418"
          fill="none" stroke="url(#vRiver)" strokeWidth={20} strokeLinecap="round" />
        {/* River flow highlight */}
        <path d="M660,152 Q580,180 505,208 Q430,234 370,248 Q305,260 258,278 Q215,296 178,332 Q152,358 132,418"
          fill="none" stroke="#93c5fd" strokeWidth={6} strokeLinecap="round"
          strokeDasharray="18 22" style={{ animation:"vRiverFlow 2.5s linear infinite" }} />
        {/* River shine */}
        <path d="M660,152 Q580,180 505,208 Q430,234 370,248 Q305,260 258,278 Q215,296 178,332 Q152,358 132,418"
          fill="none" stroke="url(#vRiverShine)" strokeWidth={10} strokeLinecap="round"
          style={{ animation:"vRiverShine 3s ease-in-out infinite" }} />
        {/* Lily pads */}
        {[[525,211],[345,252],[200,312],[155,380]].map(([lx,ly],i) => (
          <g key={i} transform={`translate(${lx},${ly})`}>
            <ellipse cx={0} cy={0} rx={7} ry={5} fill="#15803d" opacity={0.85} />
            <ellipse cx={0} cy={0} rx={3} ry={2} fill="#4ade80" opacity={0.6} />
            <circle cx={0} cy={-2} r={1.5} fill="#fde047" opacity={0.8} />
          </g>
        ))}

        {/* ══════════ LAYER 3 — ROADS ══════════ */}
        {(["M390,272 Q270,248 148,200","M390,272 Q462,202 548,148","M390,272 L648,286","M390,272 Q368,335 332,408"]).map((d,i)=>(
          <g key={i}>
            <path d={d} stroke="#5c3d0a" strokeWidth={22} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#c8920e" strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#fcd34d" strokeWidth={2} fill="none" strokeLinecap="round"
              strokeDasharray="10 10" style={{ animation:"vRoad 1.2s linear infinite" }} />
          </g>
        ))}

        {/* ══════════ BRIDGE over river ══════════ */}
        {/* Bridge planks where T2 road crosses river (~258,278) */}
        <g transform="translate(267,256) rotate(-25)">
          {[-14,-7,0,7,14].map(px => (
            <rect key={px} x={px} y={-14} width={5} height={28} rx={1} fill="#713f12" stroke="#78350f" strokeWidth={0.5} />
          ))}
          <rect x={-18} y={-16} width={36} height={4} rx={1} fill="#92400e" />
          <rect x={-18} y={12} width={36} height={4} rx={1} fill="#92400e" />
          {/* Railings */}
          <line x1={-18} y1={-14} x2={-18} y2={14} stroke="#78350f" strokeWidth={2} />
          <line x1={18}  y1={-14} x2={18}  y2={14} stroke="#78350f" strokeWidth={2} />
        </g>

        {/* ══════════ LAYER 4 — BUILDINGS ══════════ */}

        {/* T2 — CASE DU GRIOT */}
        <g className="vBtn" filter={progress.theme2===0?"url(#vLock)":undefined} onClick={()=>enterSpot(1)}>
          <ellipse cx={148} cy={216} rx={58} ry={28} fill="#2a1854" opacity={0.7} />
          {progress.theme2>=1 && <ellipse cx={148} cy={200} rx={56} ry={46} fill="#a78bfa" style={{ animation:"vAura 3s ease-in-out infinite" }} filter="url(#vGlow)" />}
          <ellipse cx={148} cy={218} rx={38} ry={14} fill="#7c3d12" />
          <rect x={110} y={178} width={76} height={44} rx={12} fill="#92400e" />
          <rect x={118} y={182} width={60} height={38} rx={10} fill="#b45309" />
          <rect x={110} y={200} width={76} height={5} fill="#a78bfa" opacity={0.5} />
          <rect x={110} y={207} width={76} height={3} fill="#7c3aed" opacity={0.35} />
          <path d="M140,222 Q148,210 156,222 Z" fill="#451a03" />
          <rect x={127} y={187} width={11} height={10} rx={2} fill="#7c3d12" stroke="#fcd34d" strokeWidth={1} style={progress.theme2>=1?{ animation:"vWink 8s 2s infinite" }:{}} />
          <rect x={158} y={187} width={11} height={10} rx={2} fill="#7c3d12" stroke="#fcd34d" strokeWidth={1} style={progress.theme2>=1?{ animation:"vWink 8s 4s infinite" }:{}} />
          {progress.theme2>=1 && <><rect x={127} y={187} width={11} height={10} rx={2} fill="#fcd34d" opacity={0.22} /><rect x={158} y={187} width={11} height={10} rx={2} fill="#fcd34d" opacity={0.22} /></>}
          <polygon points="148,143 102,196 194,196" fill="#7c3d12" />
          <polygon points="148,143 108,192 188,192" fill="#92400e" />
          <polygon points="148,143 114,186 182,186" fill="#b45309" />
          {[1,2,3,4].map(i=><line key={i} x1={148} y1={143} x2={108+i*10} y2={175+i*4} stroke="#78350f" strokeWidth={1.2} opacity={0.5} />)}
          <circle cx={148} cy={141} r={5} fill={progress.theme2>=1?"#a78bfa":"#4b5563"} style={progress.theme2>=1?{ animation:"vPulse 2s infinite" }:{}} />
          {progress.theme2>=1 && [0,1.2,2.5].map((delay,i)=>(
            <circle key={i} cx={150+i} cy={141} r={3+i} fill="#d4d4d8" opacity={0.55}
              style={{ animation:`vSmoke 2.8s ease-out ${delay}s infinite` }} />
          ))}
          <rect x={182} y={207} width={16} height={12} rx={2} fill="#92400e" stroke="#b45309" strokeWidth={1} />
          <ellipse cx={190} cy={207} rx={8} ry={3} fill="#b45309" />
          <ellipse cx={190} cy={219} rx={8} ry={3} fill="#7c3d12" />
          <rect className="vHover" x={105} y={141} width={88} height={82} rx={8} fill="none" stroke="#a78bfa" strokeWidth={2.5} opacity={0} style={{ pointerEvents:"none" }} />
          <text x={148} y={240} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill={progress.theme2>=1?"#c4b5fd":"#6b7280"}>Case du Griot</text>
        </g>

        {/* T3 — BIBLIOTHÈQUE */}
        <g className="vBtn" filter={progress.theme3===0?"url(#vLock)":undefined} onClick={()=>enterSpot(2)}>
          <ellipse cx={548} cy={176} rx={66} ry={26} fill="#0c2a4a" opacity={0.7} />
          {progress.theme3>=1 && <ellipse cx={548} cy={155} rx={63} ry={49} fill="#60a5fa" style={{ animation:"vAura 3s ease-in-out 1s infinite" }} filter="url(#vGlow)" />}
          <rect x={507} y={186} width={82} height={4} rx={1} fill="#1e40af" />
          <rect x={512} y={190} width={72} height={3} rx={1} fill="#1e3a5f" />
          <rect x={503} y={148} width={90} height={40} rx={3} fill="#1e3a5f" />
          <rect x={507} y={151} width={82} height={36} rx={2} fill="#1d4ed8" />
          {[513,526,562,575].map((x,i)=><g key={i}><rect x={x} y={149} width={7} height={36} rx={2} fill="#2563eb" /><rect x={x-1} y={147} width={9} height={5} rx={1} fill="#3b82f6" /><rect x={x-1} y={182} width={9} height={4} rx={1} fill="#3b82f6" /></g>)}
          <ellipse cx={548} cy={147} rx={37} ry={12} fill="#1e3a5f" />
          <path d="M511,147 Q548,108 585,147 Z" fill="#1d4ed8" />
          <path d="M517,147 Q548,113 579,147 Z" fill="#2563eb" />
          <circle cx={548} cy={130} r={8} fill="#0f172a" stroke="#60a5fa" strokeWidth={1.5} />
          <circle cx={548} cy={130} r={4} fill="#60a5fa" opacity={0.4} style={progress.theme3>=1?{ animation:"vPulse 2.5s infinite" }:{}} />
          <line x1={548} y1={108} x2={548} y2={99} stroke="#60a5fa" strokeWidth={2} />
          <circle cx={548} cy={97} r={4} fill={progress.theme3>=1?"#60a5fa":"#334155"} style={progress.theme3>=1?{ animation:"vPulse 2s infinite" }:{}} />
          {([514,537,568] as number[]).map((x,i)=>(
            <g key={i}>
              <rect x={x} y={156} width={i===1?22:13} height={18} rx={3} fill="#0f172a" stroke="#60a5fa" strokeWidth={1} style={progress.theme3>=1?{ animation:`vWink ${10+i*2}s ${i*2}s infinite` }:{}} />
              {progress.theme3>=1 && <rect x={x} y={156} width={i===1?22:13} height={18} rx={3} fill="#60a5fa" opacity={0.18} />}
            </g>
          ))}
          <rect className="vHover" x={503} y={97} width={90} height={96} rx={6} fill="none" stroke="#60a5fa" strokeWidth={2.5} opacity={0} style={{ pointerEvents:"none" }} />
          <text x={548} y={202} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill={progress.theme3>=1?"#93c5fd":"#6b7280"}>Bibliothèque</text>
        </g>

        {/* T4 — PALAIS */}
        <g className="vBtn" filter={progress.theme4===0?"url(#vLock)":undefined} onClick={()=>enterSpot(3)}>
          <ellipse cx={648} cy={318} rx={68} ry={26} fill="#0a2418" opacity={0.7} />
          {progress.theme4>=1 && <ellipse cx={648} cy={290} rx={66} ry={52} fill="#10b981" style={{ animation:"vAura 3s ease-in-out 0.5s infinite" }} filter="url(#vGlow)" />}
          <rect x={596} y={310} width={108} height={5} rx={1} fill="#064e3b" />
          <rect x={601} y={306} width={98}  height={5} rx={1} fill="#065f46" />
          <rect x={604} y={256} width={90} height={52} rx={2} fill="#047857" />
          <rect x={608} y={260} width={82} height={48} rx={2} fill="#059669" />
          <path d="M635,308 Q648,288 661,308 Z" fill="#064e3b" />
          {[610,622,673,685].map((x,i)=><g key={i}><rect x={x} y={258} width={8} height={50} rx={2} fill="#10b981" /><rect x={x-1} y={255} width={10} height={6} rx={1} fill="#34d399" /><rect x={x-1} y={305} width={10} height={5} rx={1} fill="#34d399" /></g>)}
          <polygon points="597,258 648,226 699,258" fill="#047857" />
          <polygon points="603,258 648,230 693,258" fill="#059669" />
          <circle cx={648} cy={248} r={9} fill="#064e3b" stroke="#10b981" strokeWidth={1.5} />
          {progress.theme4>=1 && <circle cx={648} cy={248} r={5} fill="#10b981" opacity={0.5} style={{ animation:"vPulse 2s infinite" }} />}
          {/* Flag */}
          <line x1={648} y1={226} x2={648} y2={210} stroke="#10b981" strokeWidth={2} />
          <rect x={648} y={210} width={18} height={12} rx={2} fill={progress.theme4>=1?"#10b981":"#374151"}
            style={{ animation:"vLeaf1 2s ease-in-out infinite", transformOrigin:"648px 210px" }} />
          {([612,676] as number[]).map(x=><g key={x}><rect x={x} y={267} width={12} height={16} rx={2} fill="#064e3b" stroke="#10b981" strokeWidth={1} style={progress.theme4>=1?{ animation:`vWink 9s ${x/100}s infinite` }:{}} />{progress.theme4>=1 && <rect x={x} y={267} width={12} height={16} rx={2} fill="#10b981" opacity={0.18} />}</g>)}
          <rect className="vHover" x={596} y={210} width={108} height={106} rx={4} fill="none" stroke="#10b981" strokeWidth={2.5} opacity={0} style={{ pointerEvents:"none" }} />
          <text x={648} y={332} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill={progress.theme4>=1?"#6ee7b7":"#6b7280"}>Palais</text>
        </g>

        {/* T5 — GALERIE */}
        <g className="vBtn" filter={progress.theme5===0?"url(#vLock)":undefined} onClick={()=>enterSpot(4)}>
          <ellipse cx={332} cy={434} rx={74} ry={24} fill="#3d0a1e" opacity={0.7} />
          {progress.theme5>=1 && <ellipse cx={332} cy={410} rx={72} ry={46} fill="#ec4899" style={{ animation:"vAura 3s ease-in-out 1.5s infinite" }} filter="url(#vGlow)" />}
          <rect x={304} y={360} width={60} height={14} rx={3} fill="#831843" stroke="#ec4899" strokeWidth={1} />
          <text x={334} y={371} textAnchor="middle" fill="#f9a8d4" fontSize={6} fontFamily="system-ui" fontWeight="800">GALERIE</text>
          <rect x={255} y={372} width={158} height={7} rx={2} fill="#db2777" />
          <rect x={259} y={379} width={150} height={5} rx={1} fill="#be185d" />
          <rect x={263} y={382} width={140} height={50} rx={4} fill="#831843" />
          <rect x={267} y={385} width={132} height={46} rx={3} fill="#9d174d" />
          {([271,316,361] as number[]).map(x=><g key={x}><rect x={x} y={389} width={36} height={32} rx={3} fill="#0f172a" stroke="#ec4899" strokeWidth={1.5} style={progress.theme5>=1?{ animation:`vWink 11s ${x/200}s infinite` }:{}} />{progress.theme5>=1 && <rect x={x} y={389} width={36} height={32} rx={3} fill="#ec4899" opacity={0.14} />}</g>)}
          {progress.theme5>=1 && <><rect x={275} y={393} width={11} height={10} rx={1} fill="#fbbf24" opacity={0.65} /><circle cx={299} cy={404} r={5} fill="#ec4899" opacity={0.7} /><rect x={320} y={393} width={24} height={8} rx={1} fill="#60a5fa" opacity={0.55} /><polygon points="371,393 383,393 377,402" fill="#a78bfa" opacity={0.7} /></>}
          {([269,364] as number[]).map(x=><g key={x}><rect x={x} y={430} width={32} height={8} rx={2} fill="#4a1942" /><circle cx={x+6} cy={429} r={4} fill="#f472b6" /><circle cx={x+14} cy={428} r={3.5} fill="#fb7185" /><circle cx={x+22} cy={429} r={4} fill="#ec4899" /></g>)}
          <rect className="vHover" x={257} y={358} width={156} height={82} rx={4} fill="none" stroke="#ec4899" strokeWidth={2.5} opacity={0} style={{ pointerEvents:"none" }} />
          <text x={332} y={450} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill={progress.theme5>=1?"#f9a8d4":"#6b7280"}>Galerie des Œuvres</text>
        </g>

        {/* T1 — ROUTES HUB */}
        <g className="vBtn" onClick={()=>enterSpot(0)}>
          <ellipse cx={390} cy={286} rx={56} ry={22} fill="#5c3d0a" opacity={0.85} />
          <ellipse cx={390} cy={284} rx={48} ry={18} fill="#78350f" />
          {([-22,-10,2,14] as number[]).map(dx=>([-8,4] as number[]).map(dy=>(
            <rect key={`${dx}${dy}`} x={390+dx-5} y={281+dy-4} width={10} height={7} rx={1} fill="#92400e" opacity={0.6} />
          )))}
          <rect x={388} y={246} width={4} height={38} rx={2} fill="#b45309" />
          <ellipse cx={390} cy={245} rx={10} ry={4} fill="#78350f" />
          <ellipse cx={390} cy={244} rx={9} ry={3}  fill="#d97706" />
          <circle cx={390} cy={242} r={8} fill="#fef3c7" filter="url(#vSoft)" style={{ animation:"vPulse 3s ease-in-out infinite" }} />
          <circle cx={390} cy={242} r={4} fill="#fcd34d" />
          <rect x={340} y={257} width={23} height={19} rx={2} fill="#b45309" />
          <polygon points="340,257 351,246 363,257" fill="#92400e" />
          <rect x={344} y={262} width={6} height={10} rx={1} fill="#78350f" />
          <rect x={354} y={262} width={7} height={8}  rx={1} fill="#78350f" stroke="#fcd34d" strokeWidth={0.8} style={{ animation:"vWink 7s 1s infinite" }} />
          <rect x={416} y={257} width={23} height={19} rx={2} fill="#b45309" />
          <polygon points="416,257 427,246 439,257" fill="#92400e" />
          <rect x={420} y={262} width={6} height={10} rx={1} fill="#78350f" />
          <rect x={430} y={262} width={7} height={8}  rx={1} fill="#78350f" stroke="#fcd34d" strokeWidth={0.8} style={{ animation:"vWink 7s 3s infinite" }} />
          <text x={390} y={304} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill="#fcd34d">Routes du Village</text>
        </g>

        {/* ══════════ LAYER 5 — LAMPADAIRES ══════════ */}
        {LAMPS.map(([lx,ly],i) => (
          <Lamppost key={i} x={lx} y={ly} lit={true} />
        ))}

        {/* ══════════ TRAFFIC LIGHTS ══════════ */}
        <TrafficLight x={410} y={260} phase={tlPhase} />
        <TrafficLight x={374} y={255} phase={(tlPhase+1)%3} />

        {/* ══════════ LAYER 6 — TREES (mid parallax) ══════════ */}
        <g transform={treeTx} style={{ transition:"transform 0.18s ease-out" }}>
          {TREES.map(([tx,ty,s,d]) => <Tree key={d} x={tx} y={ty} s={s} d={d} />)}
        </g>

        {/* ══════════ LAYER 7 — CARS ══════════ */}
        <Car pathId="carPath1" dur={12} delay={0}  color={CAR_COLORS[0]} />
        <Car pathId="carPath2" dur={10} delay={2}  color={CAR_COLORS[1]} />
        <Car pathId="carPath3" dur={14} delay={5}  color={CAR_COLORS[2]} />
        <Car pathId="carPath4" dur={11} delay={1}  color={CAR_COLORS[3]} />
        <Car pathId="carPath1" dur={13} delay={7}  color={CAR_COLORS[4]} />

        {/* ══════════ LAYER 8 — NPCs ══════════ */}
        <NPC pathId="npcPath1" dur={12} delay={0}   color="#fbbf24" size={0.9} />
        <NPC pathId="npcPath2" dur={18} delay={3}   color="#f472b6" size={0.85} />
        <NPC pathId="npcPath3" dur={9}  delay={6}   color="#34d399" size={0.8} />

        {/* ══════════ LAYER 9 — FIREFLIES ══════════ */}
        {FIREFLIES.map(([fx,fy,v,delay],i) => (
          <g key={i} transform={`translate(${fx},${fy})`}
            style={{ animation:`vFly${v} ${4.5+(i%3)*1.2}s ease-in-out ${delay}s infinite` }}>
            <circle r={5} fill="#d4fc60" opacity={0.15} filter="url(#vFF)" />
            <circle r={1.8} fill="#ecfccb" style={{ animation:`vPulse ${1.8+(i%4)*0.4}s ease-in-out ${delay*0.5}s infinite` }} />
          </g>
        ))}

        {/* ══════════ LAYER 10 — COMPLETION STARS + FIREWORKS ══════════ */}
        {SPOTS.map(s => progress[s.id]===2 && (
          <g key={s.id}>
            <g transform={`translate(${s.x},${s.y-54})`} style={{ animation:"vFloat 3s ease-in-out infinite" }}>
              <text fontSize={16} textAnchor="middle" y={6}>⭐</text>
            </g>
            <Firework x={s.x} y={s.y-70} color={s.color} />
          </g>
        ))}

        {/* ══════════ LAYER 11 — LOCK ICONS ══════════ */}
        {SPOTS.slice(1).map(s => progress[s.id]===0 && (
          <g key={s.id} transform={`translate(${s.x},${s.y-22})`}>
            <rect x={-11} y={-13} width={22} height={17} rx={3} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
            <path d="M-5,-13 Q-5,-24 0,-24 Q5,-24 5,-13" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
            <circle cx={0} cy={-4} r={3} fill="#4b5563" />
          </g>
        ))}

        {/* ══════════ LAYER 12 — AVATAR ══════════ */}
        <g transform={`translate(${avatarPos.x},${avatarPos.y})`}
          style={{ transition:"transform 0.04s linear",
                   ...(refused !== null ? { animation:"vShake 0.5s ease-in-out" } : {}) }}>
          <ellipse cx={0} cy={27} rx={12} ry={4} fill="black" opacity={0.35} />
          <g style={{ animation:"vBob 2.2s ease-in-out infinite",
                      transform: facing==="left" ? "scaleX(-1)" : "scaleX(1)",
                      transformOrigin:"center" }}>
            <rect x={-6} y={16}  width={5} height={10} rx={2.5} fill="#2563eb" />
            <rect x={1}  y={16}  width={5} height={10} rx={2.5} fill="#2563eb" />
            <rect x={-10} y={2} width={20} height={16} rx={5} fill="#3b82f6" stroke="#60a5fa" strokeWidth={1.5} />
            <rect x={-6}  y={6} width={12} height={6}  rx={2} fill="#1e3a8a" />
            <circle cx={-3} cy={9} r={1.8} fill="#fbbf24" />
            <circle cx={3}  cy={9} r={1.8} fill="#34d399" />
            <rect x={-8} y={-13} width={16} height={15} rx={5} fill="#60a5fa" stroke="#93c5fd" strokeWidth={1.5} />
            <circle cx={-3} cy={-6} r={3} fill="#0f172a" />
            <circle cx={4}  cy={-6} r={3} fill="#0f172a" />
            <circle cx={-2} cy={-7} r={1} fill="white" />
            <circle cx={5}  cy={-7} r={1} fill="white" />
            <line x1={0} y1={-13} x2={0} y2={-21} stroke="#93c5fd" strokeWidth={2} />
            <circle cx={0} cy={-23} r={3} fill="#fbbf24" style={{ animation:"vPulse 1.8s ease-in-out infinite" }} />
          </g>
        </g>

        {/* ══════════ LAYER 13 — INTERACTION PROMPT ══════════ */}
        {nearSpot !== null && !bubble && !portal && (
          <g transform={`translate(${avatarPos.x},${avatarPos.y - 52})`}
             style={{ animation:"vReady 1.6s ease-in-out infinite" }}>
            <rect x={-46} y={-14} width={92} height={22} rx={6}
              fill="#0f172a"
              stroke={nearLocked ? "#64748b" : SPOTS[nearSpot].color}
              strokeWidth={1.5} />
            <text x={0} y={3} textAnchor="middle"
              fill={nearLocked ? "#94a3b8" : "#fef3c7"}
              fontSize={8} fontFamily="system-ui" fontWeight="700">
              {nearLocked ? "🔒 Verrouillé" : "[Entrée] Entrer"}
            </text>
          </g>
        )}

        {/* Refus : cadenas rouge qui claque sur le bâtiment */}
        {refused !== null && (
          <g transform={`translate(${SPOTS[refused].x},${SPOTS[refused].y - 46})`}
             style={{ animation:"vDeny 0.7s ease-out forwards" }}>
            <circle r={17} fill="#450a0a" stroke="#ef4444" strokeWidth={2.5} />
            <rect x={-7} y={-4} width={14} height={11} rx={2} fill="#ef4444" />
            <path d="M-4,-4 Q-4,-12 0,-12 Q4,-12 4,-4" fill="none" stroke="#ef4444" strokeWidth={2.2} strokeLinecap="round" />
          </g>
        )}

        {/* ══════════ LAYER 14 — SPEECH BUBBLE ══════════ */}
        {bubble && !portal && (() => {
          const lines  = wrapText(bubble, 30);
          const w      = 200;
          const h      = 16 + lines.length * 13;
          // La bulle reste dans le cadre même quand l'avatar longe un bord
          const bx     = Math.max(w/2 + 6, Math.min(800 - w/2 - 6, avatarPos.x));
          const tail   = Math.max(-w/2 + 14, Math.min(w/2 - 14, avatarPos.x - bx));
          const accent = denyMsg ? "#ef4444" : "#f59e0b";
          return (
            <g transform={`translate(${bx},${avatarPos.y - 78 - lines.length*6})`}>
              <rect x={-w/2} y={-h/2} width={w} height={h} rx={10}
                fill="#0f172a" stroke={accent} strokeWidth={2} />
              <polygon points={`${tail-6},${h/2} ${tail+6},${h/2} ${tail},${h/2+11}`} fill="#0f172a" />
              <polygon points={`${tail-4},${h/2} ${tail+4},${h/2} ${tail},${h/2+9}`}  fill={accent} />
              <text textAnchor="middle" fill="#fef3c7" fontSize={9}
                fontFamily="system-ui" fontWeight="800">
                {lines.map((ln,i) => (
                  <tspan key={i} x={0} y={-h/2 + 17 + i*13}>{ln}</tspan>
                ))}
              </text>
            </g>
          );
        })()}

        {/* ══════════ LEGEND + HINT ══════════ */}
        <rect x="0" y="474" width="800" height="26" fill="#060b24" opacity="0.92" />
        {SPOTS.map((s,i) => {
          const lvl = progress[s.id];
          return (
            <g key={s.id} transform={`translate(${10+i*148},487)`}>
              <circle cx={5} cy={0} r={5} fill={lvl>0?s.color:"#1e293b"} />
              <text x={14} y={4} fill={lvl>0?s.color:"#374151"} fontSize={9} fontFamily="system-ui" fontWeight="700">
                {s.short} {lvl===2?"✓":lvl===1?"···":"🔒"}
              </text>
            </g>
          );
        })}
        <text x={790} y={487} textAnchor="end" fill="#475569" fontSize={8} fontFamily="system-ui">
          ↑↓←→ déplacer · Entrée pour entrer
        </text>

        {/* ══════════ LAYER 15 — PORTAIL D'ENTRÉE (au-dessus de tout) ══════════ */}
        {portal !== null && (() => {
          const s = SPOTS[portal];
          const cy = s.y - 32;
          return (
            <g>
              {/* Onde qui part du bâtiment */}
              <circle cx={s.x} cy={cy} r={0} fill="none" stroke={s.color} strokeWidth={6} opacity={0.9}>
                <animate attributeName="r" from="10" to="420" dur="0.55s" fill="freeze" />
                <animate attributeName="opacity" from="0.9" to="0" dur="0.55s" fill="freeze" />
              </circle>
              {/* Le disque de couleur avale l'écran */}
              <circle cx={s.x} cy={cy} r={0} fill={s.color}>
                <animate attributeName="r" from="0" to="1000" dur="0.62s" begin="0.06s"
                  fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
              </circle>
              {/* Voile sombre pour que le texte reste lisible */}
              <circle cx={s.x} cy={cy} r={0} fill="#060b24" opacity={0.72}>
                <animate attributeName="r" from="0" to="1000" dur="0.62s" begin="0.16s"
                  fill="freeze" calcMode="spline" keyTimes="0;1" keySplines="0.4 0 0.2 1" />
              </circle>
              {/* Nom du quartier franchi */}
              <g style={{ animation:"vPortalT 0.5s ease-out 0.3s both" }}>
                <text x={400} y={244} textAnchor="middle" fill={s.color}
                  fontSize={13} fontFamily="system-ui" fontWeight="700" letterSpacing="3">
                  TU ENTRES DANS
                </text>
                <text x={400} y={276} textAnchor="middle" fill="#f8fafc"
                  fontSize={26} fontFamily="system-ui" fontWeight="900">
                  {s.label}
                </text>
              </g>
            </g>
          );
        })()}
      </svg>
    </div>
  );

  function enterSpot(idx: number) {
    if (busyRef.current) return;
    const s = SPOTS[idx];
    const locked = progress[s.id] === 0 && idx !== 0;

    if (locked) {
      // Refus : l'avatar recule et tremble, Kodi explique quoi faire pour ouvrir
      busyRef.current = true;
      setRefused(idx);
      setDenyMsg(true);
      setBubble(UNLOCK_HINT[s.id] ?? "Ce quartier dort encore.");
      const p = posRef.current;
      posRef.current = { x: p.x, y: Math.min(465, p.y + 16) };
      setAvatarPos(posRef.current);
      window.setTimeout(() => { busyRef.current = false; setRefused(null); }, 700);
      window.setTimeout(() => { setBubble(null); setDenyMsg(false); }, 4500);
      return;
    }

    // Ouvert : le portail avale l'écran, puis on entre dans le thème
    const dest = themeIds?.[idx];
    busyRef.current = true;
    setBubble(null);
    setDenyMsg(false);
    setPortal(idx);
    window.setTimeout(() => {
      if (dest) {
        router.push(`/${locale}/eleve/theme/${dest}`);
      } else {
        // Pas d'ID fourni : on rouvre la carte plutôt que de laisser l'écran plein
        busyRef.current = false;
        setPortal(null);
      }
    }, 780);
  }
}

// ─── Utilitaires ────────────────────────────────────────────────────────────

/** Découpe un message en lignes de `max` caractères, sans couper les mots. */
function wrapText(t: string, max: number): string[] {
  const lines: string[] = [];
  let cur = "";
  for (const w of t.split(" ")) {
    if (!cur) { cur = w; continue; }
    if ((cur + " " + w).length <= max) cur += " " + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1),16), pb = parseInt(b.slice(1),16);
  const ar=(pa>>16)&0xff, ag=(pa>>8)&0xff, ab=pa&0xff;
  const br=(pb>>16)&0xff, bg=(pb>>8)&0xff, bb=pb&0xff;
  const r=Math.round(ar+(br-ar)*t), g=Math.round(ag+(bg-ag)*t), bv=Math.round(ab+(bb-ab)*t);
  return `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${bv.toString(16).padStart(2,"0")}`;
}
