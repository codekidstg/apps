"use client";

import { useState, useCallback } from "react";

export type ThemeProgress = {
  theme1: 0 | 1 | 2;
  theme2: 0 | 1 | 2;
  theme3: 0 | 1 | 2;
  theme4: 0 | 1 | 2;
  theme5: 0 | 1 | 2;
};

const SPOTS = [
  { id: "theme1" as const, label: "Routes du Village", short: "Routes", x: 390, y: 272, color: "#f59e0b" },
  { id: "theme2" as const, label: "Case du Griot",     short: "Griot",  x: 148, y: 200, color: "#a78bfa" },
  { id: "theme3" as const, label: "Bibliothèque",      short: "Biblio", x: 548, y: 148, color: "#60a5fa" },
  { id: "theme4" as const, label: "Palais",            short: "Palais", x: 648, y: 286, color: "#10b981" },
  { id: "theme5" as const, label: "Galerie des Œuvres",short: "Galerie",x: 332, y: 408, color: "#ec4899" },
];

const STARS: [number, number][] = [
  [50,25],[110,18],[195,42],[308,12],[418,32],[528,18],[648,38],[718,22],[778,48],
  [75,75],[168,62],[258,82],[378,68],[488,58],[598,72],[698,52],[758,88],
  [28,108],[138,118],[228,98],[348,112],[458,92],[578,108],[678,98],[748,78],
  [88,140],[158,132],[448,125],[568,138],[728,128],
];

const TREES: [number, number, number, number][] = [
  [60,170,1.1,0],[95,188,0.85,1],[110,175,0.9,2],
  [235,148,1.0,3],[290,165,1.2,4],[320,158,0.8,5],
  [475,210,0.9,6],[498,228,1.1,7],
  [614,188,1.0,8],[630,172,0.85,9],[645,195,1.1,10],
  [710,340,0.9,11],[730,358,1.1,12],[750,325,0.8,13],
  [55,380,1.1,14],[75,418,0.9,15],[245,452,1.0,16],[262,432,0.85,17],
  [448,445,0.9,18],[465,460,1.1,19],[582,435,1.0,20],[605,452,0.8,21],
  [490,160,0.7,22],[505,172,0.85,23],
];

// x, y, animation variant (1-3), delay
const FIREFLIES: [number, number, number, number][] = [
  [75, 315, 1, 0],   [120, 355, 2, 1.1], [185, 395, 3, 0.5],
  [225, 345, 1, 2.2],[438, 458, 2, 0.3], [472, 425, 3, 1.7],
  [535, 448, 1, 0.9],[622, 398, 2, 1.4], [662, 368, 3, 0.1],
  [732, 388, 1, 1.8],[272, 468, 2, 2.5], [358, 452, 3, 0.7],
  [562, 418, 1, 1.3],[158, 302, 2, 0.6], [685, 312, 3, 2.0],
];

export default function VillageMap({
  progress,
  kodiMessage,
}: {
  progress: ThemeProgress;
  kodiMessage?: string;
}) {
  const [avatarIdx, setAvatarIdx] = useState(0);
  const [moving, setMoving] = useState(false);
  const [bubble, setBubble] = useState<string | null>(kodiMessage ?? null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const av = SPOTS[avatarIdx];

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMouse({
      x: (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2),
      y: (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2),
    });
  }, []);

  const handleMouseLeave = useCallback(() => setMouse({ x: 0, y: 0 }), []);

  function goTo(idx: number) {
    if (idx === avatarIdx || moving) return;
    const spot = SPOTS[idx];
    if (progress[spot.id] === 0) return;
    setBubble(null);
    setMoving(true);
    setAvatarIdx(idx);
    setTimeout(() => {
      setMoving(false);
      setBubble(spot.label);
      setTimeout(() => setBubble(null), 3500);
    }, 1300);
  }

  // Parallax helpers — background moves opposite to mouse (depth illusion)
  const sky  = `translate(${mouse.x * -10}, ${mouse.y * -7})`;
  const mid  = `translate(${mouse.x * -5},  ${mouse.y * -4})`;

  return (
    <div
      style={{ width: "100%", borderRadius: 16, overflow: "hidden", background: "#060b24", userSelect: "none" }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <svg viewBox="0 0 800 500" style={{ width: "100%", display: "block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* ── Gradients ── */}
          <linearGradient id="vSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="#060b24" />
            <stop offset="55%" stopColor="#0f1a40" />
            <stop offset="100%" stopColor="#1a2d15" />
          </linearGradient>
          <radialGradient id="vMoonHalo" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fef3c7" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fef3c7" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="vGround" cx="45%" cy="35%" r="70%">
            <stop offset="0%"   stopColor="#2a4418" />
            <stop offset="100%" stopColor="#111d0a" />
          </radialGradient>

          {/* ── Ground light pools (one per quartier color) ── */}
          <radialGradient id="lgLamp"   cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#fcd34d" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#fcd34d" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lgGriot"  cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#a78bfa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lgBiblio" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#60a5fa" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lgPalais" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#10b981" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="lgGal"    cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#ec4899" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </radialGradient>

          {/* ── Filters ── */}
          <filter id="vGlow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="6" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="vSoft" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="vFirefly" x="-200%" y="-200%" width="500%" height="500%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="vLampPool" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="vWinPool" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" />
          </filter>
          <filter id="vLock">
            <feColorMatrix type="saturate" values="0" result="g" />
            <feComponentTransfer in="g">
              <feFuncR type="linear" slope="0.35" />
              <feFuncG type="linear" slope="0.35" />
              <feFuncB type="linear" slope="0.35" />
            </feComponentTransfer>
          </filter>

          {/* ── CSS Animations ── */}
          <style>{`
            @keyframes vTwinkle { 0%,100%{opacity:.12} 50%{opacity:.95} }
            @keyframes vBob     { 0%,100%{transform:translateY(0)}   50%{transform:translateY(-4px)} }
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
            @keyframes vWinBlink{ 0%,96%,100%{opacity:1} 97%{opacity:.3} }
            .vMove   { transition:transform 1.3s cubic-bezier(.4,0,.2,1); }
            .vBtn    { cursor:pointer; }
            .vBtn:hover .vHover { opacity:1!important; }
          `}</style>
        </defs>

        {/* ═══════════════════════════════════════
            LAYER 0 — SKY  (parallax deep)
        ════════════════════════════════════════ */}
        <rect width="800" height="500" fill="url(#vSky)" />
        <g transform={sky} style={{ transition: "transform 0.12s ease-out" }}>
          {STARS.map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r={i % 5 === 0 ? 2 : 1.3} fill="white"
              style={{ animation: `vTwinkle ${2.4 + (i % 4) * 0.9}s ease-in-out ${(i * 0.38) % 3}s infinite` }} />
          ))}
          {/* Moon */}
          <circle cx={715} cy={52} r={52} fill="url(#vMoonHalo)" />
          <circle cx={715} cy={52} r={30} fill="#fef3c7" style={{ animation: "vMoon 5s ease-in-out infinite" }} />
          <circle cx={727} cy={44} r={24} fill="#0f1a40" />
          <circle cx={700} cy={60} r={4}   fill="#fde68a" opacity={0.3} />
          <circle cx={707} cy={48} r={2.5} fill="#fde68a" opacity={0.22} />
        </g>

        {/* ═══════════════════════════════════════
            LAYER 1 — GROUND + LIGHT POOLS
        ════════════════════════════════════════ */}
        <rect x="0" y="148" width="800" height="352" fill="url(#vGround)" />
        <ellipse cx={180} cy={360} rx={90} ry={32} fill="#1e3510" opacity={0.55} />
        <ellipse cx={580} cy={440} rx={110} ry={38} fill="#1e3510" opacity={0.45} />
        <ellipse cx={680} cy={220} rx={65} ry={24} fill="#1e3510" opacity={0.45} />
        <ellipse cx={455} cy={182} rx={55} ry={18} fill="#1e3510" opacity={0.40} />

        {/* Lamppost ground pool */}
        <ellipse cx={390} cy={285} rx={80} ry={28} fill="url(#lgLamp)"
          filter="url(#vLampPool)" style={{ animation: "vLamp 3s ease-in-out infinite" }} />

        {/* Building window light pools (only when unlocked) */}
        {progress.theme2 >= 1 && (
          <ellipse cx={148} cy={225} rx={55} ry={18} fill="url(#lgGriot)"
            filter="url(#vWinPool)" style={{ animation: "vLamp 4s ease-in-out 0.5s infinite" }} />
        )}
        {progress.theme3 >= 1 && (
          <ellipse cx={548} cy={198} rx={60} ry={18} fill="url(#lgBiblio)"
            filter="url(#vWinPool)" style={{ animation: "vLamp 4s ease-in-out 1s infinite" }} />
        )}
        {progress.theme4 >= 1 && (
          <ellipse cx={648} cy={330} rx={65} ry={20} fill="url(#lgPalais)"
            filter="url(#vWinPool)" style={{ animation: "vLamp 4s ease-in-out 1.5s infinite" }} />
        )}
        {progress.theme5 >= 1 && (
          <ellipse cx={332} cy={448} rx={70} ry={18} fill="url(#lgGal)"
            filter="url(#vWinPool)" style={{ animation: "vLamp 4s ease-in-out 2s infinite" }} />
        )}

        {/* ═══════════════════════════════════════
            LAYER 2 — ROADS
        ════════════════════════════════════════ */}
        {([
          "M390,272 Q270,248 148,200",
          "M390,272 Q462,202 548,148",
          "M390,272 L648,286",
          "M390,272 Q368,335 332,408",
        ] as string[]).map((d, i) => (
          <g key={i}>
            <path d={d} stroke="#5c3d0a" strokeWidth={22} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#c8920e" strokeWidth={14} fill="none" strokeLinecap="round" />
            <path d={d} stroke="#fcd34d" strokeWidth={2}  fill="none" strokeLinecap="round"
              strokeDasharray="10 10" style={{ animation: "vRoad 1.2s linear infinite" }} />
          </g>
        ))}

        {/* ═══════════════════════════════════════
            LAYER 3 — BUILDINGS
        ════════════════════════════════════════ */}

        {/* T2 — CASE DU GRIOT */}
        <g className="vBtn" filter={progress.theme2 === 0 ? "url(#vLock)" : undefined} onClick={() => goTo(1)}>
          <ellipse cx={148} cy={216} rx={58} ry={28} fill="#2a1854" opacity={0.7} />
          {progress.theme2 >= 1 && (
            <ellipse cx={148} cy={200} rx={56} ry={46} fill="#a78bfa"
              style={{ animation: "vAura 3s ease-in-out infinite" }} filter="url(#vGlow)" />
          )}
          <ellipse cx={148} cy={218} rx={38} ry={14} fill="#7c3d12" />
          <rect x={110} y={178} width={76} height={44} rx={12} fill="#92400e" />
          <rect x={118} y={182} width={60} height={38} rx={10} fill="#b45309" />
          <rect x={110} y={200} width={76} height={5} fill="#a78bfa" opacity={0.5} />
          <rect x={110} y={207} width={76} height={3} fill="#7c3aed" opacity={0.35} />
          <path d="M140,222 Q148,210 156,222 Z" fill="#451a03" />
          <rect x={127} y={187} width={11} height={10} rx={2} fill="#7c3d12" stroke="#fcd34d" strokeWidth={1}
            style={progress.theme2 >= 1 ? { animation: "vWinBlink 8s ease-in-out 2s infinite" } : {}} />
          <rect x={158} y={187} width={11} height={10} rx={2} fill="#7c3d12" stroke="#fcd34d" strokeWidth={1}
            style={progress.theme2 >= 1 ? { animation: "vWinBlink 8s ease-in-out 4s infinite" } : {}} />
          {progress.theme2 >= 1 && <>
            <rect x={127} y={187} width={11} height={10} rx={2} fill="#fcd34d" opacity={0.22} />
            <rect x={158} y={187} width={11} height={10} rx={2} fill="#fcd34d" opacity={0.22} />
          </>}
          <polygon points="148,143 102,196 194,196" fill="#7c3d12" />
          <polygon points="148,143 108,192 188,192" fill="#92400e" />
          <polygon points="148,143 114,186 182,186" fill="#b45309" />
          {[1,2,3,4].map(i => (
            <line key={i} x1={148} y1={143} x2={108+i*10} y2={175+i*4} stroke="#78350f" strokeWidth={1.2} opacity={0.5} />
          ))}
          <circle cx={148} cy={141} r={5} fill={progress.theme2 >= 1 ? "#a78bfa" : "#4b5563"}
            style={progress.theme2 >= 1 ? { animation: "vPulse 2s infinite" } : {}} />
          {/* Smoke from chimney */}
          {progress.theme2 >= 1 && [0, 1.2, 2.5].map((delay, i) => (
            <circle key={i} cx={150 + i} cy={141} r={3 + i}
              fill="#d4d4d8" opacity={0.55}
              style={{ animation: `vSmoke 2.8s ease-out ${delay}s infinite` }} />
          ))}
          {/* Drum */}
          <rect x={182} y={207} width={16} height={12} rx={2} fill="#92400e" stroke="#b45309" strokeWidth={1} />
          <ellipse cx={190} cy={207} rx={8} ry={3} fill="#b45309" />
          <ellipse cx={190} cy={219} rx={8} ry={3} fill="#7c3d12" />
          <rect className="vHover" x={105} y={141} width={88} height={82} rx={8}
            fill="none" stroke="#a78bfa" strokeWidth={2.5} opacity={0} style={{ pointerEvents: "none" }} />
          <text x={148} y={240} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800"
            fill={progress.theme2 >= 1 ? "#c4b5fd" : "#6b7280"}>Case du Griot</text>
        </g>

        {/* T3 — BIBLIOTHÈQUE */}
        <g className="vBtn" filter={progress.theme3 === 0 ? "url(#vLock)" : undefined} onClick={() => goTo(2)}>
          <ellipse cx={548} cy={176} rx={66} ry={26} fill="#0c2a4a" opacity={0.7} />
          {progress.theme3 >= 1 && (
            <ellipse cx={548} cy={155} rx={63} ry={49} fill="#60a5fa"
              style={{ animation: "vAura 3s ease-in-out 1s infinite" }} filter="url(#vGlow)" />
          )}
          <rect x={507} y={186} width={82} height={4} rx={1} fill="#1e40af" />
          <rect x={512} y={190} width={72} height={3} rx={1} fill="#1e3a5f" />
          <rect x={503} y={148} width={90} height={40} rx={3} fill="#1e3a5f" />
          <rect x={507} y={151} width={82} height={36} rx={2} fill="#1d4ed8" />
          {[513, 526, 562, 575].map((x, i) => (
            <g key={i}>
              <rect x={x} y={149} width={7} height={36} rx={2} fill="#2563eb" />
              <rect x={x-1} y={147} width={9} height={5} rx={1} fill="#3b82f6" />
              <rect x={x-1} y={182} width={9} height={4} rx={1} fill="#3b82f6" />
            </g>
          ))}
          <ellipse cx={548} cy={147} rx={37} ry={12} fill="#1e3a5f" />
          <path d="M511,147 Q548,108 585,147 Z" fill="#1d4ed8" />
          <path d="M517,147 Q548,113 579,147 Z" fill="#2563eb" />
          <circle cx={548} cy={130} r={8} fill="#0f172a" stroke="#60a5fa" strokeWidth={1.5} />
          <circle cx={548} cy={130} r={4} fill="#60a5fa" opacity={0.4}
            style={progress.theme3 >= 1 ? { animation: "vPulse 2.5s infinite" } : {}} />
          <line x1={548} y1={108} x2={548} y2={99} stroke="#60a5fa" strokeWidth={2} />
          <circle cx={548} cy={97} r={4} fill={progress.theme3 >= 1 ? "#60a5fa" : "#334155"}
            style={progress.theme3 >= 1 ? { animation: "vPulse 2s infinite" } : {}} />
          {([514, 537, 568] as number[]).map((x, i) => (
            <g key={i}>
              <rect x={x} y={156} width={i === 1 ? 22 : 13} height={18} rx={3} fill="#0f172a" stroke="#60a5fa" strokeWidth={1}
                style={progress.theme3 >= 1 ? { animation: `vWinBlink 10s ease-in-out ${i * 2}s infinite` } : {}} />
              {progress.theme3 >= 1 && <rect x={x} y={156} width={i === 1 ? 22 : 13} height={18} rx={3} fill="#60a5fa" opacity={0.18} />}
            </g>
          ))}
          <rect className="vHover" x={503} y={97} width={90} height={96} rx={6}
            fill="none" stroke="#60a5fa" strokeWidth={2.5} opacity={0} style={{ pointerEvents: "none" }} />
          <text x={548} y={202} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800"
            fill={progress.theme3 >= 1 ? "#93c5fd" : "#6b7280"}>Bibliothèque</text>
        </g>

        {/* T4 — PALAIS */}
        <g className="vBtn" filter={progress.theme4 === 0 ? "url(#vLock)" : undefined} onClick={() => goTo(3)}>
          <ellipse cx={648} cy={318} rx={68} ry={26} fill="#0a2418" opacity={0.7} />
          {progress.theme4 >= 1 && (
            <ellipse cx={648} cy={290} rx={66} ry={52} fill="#10b981"
              style={{ animation: "vAura 3s ease-in-out 0.5s infinite" }} filter="url(#vGlow)" />
          )}
          <rect x={596} y={310} width={108} height={5} rx={1} fill="#064e3b" />
          <rect x={601} y={306} width={98}  height={5} rx={1} fill="#065f46" />
          <rect x={604} y={256} width={90} height={52} rx={2} fill="#047857" />
          <rect x={608} y={260} width={82} height={48} rx={2} fill="#059669" />
          <path d="M635,308 Q648,288 661,308 Z" fill="#064e3b" />
          {[610, 622, 673, 685].map((x, i) => (
            <g key={i}>
              <rect x={x} y={258} width={8} height={50} rx={2} fill="#10b981" />
              <rect x={x-1} y={255} width={10} height={6} rx={1} fill="#34d399" />
              <rect x={x-1} y={305} width={10} height={5} rx={1} fill="#34d399" />
            </g>
          ))}
          <polygon points="597,258 648,226 699,258" fill="#047857" />
          <polygon points="603,258 648,230 693,258" fill="#059669" />
          <circle cx={648} cy={248} r={9} fill="#064e3b" stroke="#10b981" strokeWidth={1.5} />
          {progress.theme4 >= 1 && <circle cx={648} cy={248} r={5} fill="#10b981" opacity={0.5}
            style={{ animation: "vPulse 2s infinite" }} />}
          <line x1={648} y1={226} x2={648} y2={215} stroke="#10b981" strokeWidth={2} />
          <polygon points="648,215 660,220 648,225" fill={progress.theme4 >= 1 ? "#10b981" : "#374151"} />
          {([612, 676] as number[]).map((x) => (
            <g key={x}>
              <rect x={x} y={267} width={12} height={16} rx={2} fill="#064e3b" stroke="#10b981" strokeWidth={1}
                style={progress.theme4 >= 1 ? { animation: `vWinBlink 9s ease-in-out ${x/100}s infinite` } : {}} />
              {progress.theme4 >= 1 && <rect x={x} y={267} width={12} height={16} rx={2} fill="#10b981" opacity={0.18} />}
            </g>
          ))}
          <rect className="vHover" x={596} y={215} width={108} height={100} rx={4}
            fill="none" stroke="#10b981" strokeWidth={2.5} opacity={0} style={{ pointerEvents: "none" }} />
          <text x={648} y={332} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800"
            fill={progress.theme4 >= 1 ? "#6ee7b7" : "#6b7280"}>Palais</text>
        </g>

        {/* T5 — GALERIE */}
        <g className="vBtn" filter={progress.theme5 === 0 ? "url(#vLock)" : undefined} onClick={() => goTo(4)}>
          <ellipse cx={332} cy={434} rx={74} ry={24} fill="#3d0a1e" opacity={0.7} />
          {progress.theme5 >= 1 && (
            <ellipse cx={332} cy={410} rx={72} ry={46} fill="#ec4899"
              style={{ animation: "vAura 3s ease-in-out 1.5s infinite" }} filter="url(#vGlow)" />
          )}
          <rect x={304} y={360} width={60} height={14} rx={3} fill="#831843" stroke="#ec4899" strokeWidth={1} />
          <text x={334} y={371} textAnchor="middle" fill="#f9a8d4" fontSize={6} fontFamily="system-ui" fontWeight="800">GALERIE</text>
          <rect x={255} y={372} width={158} height={7} rx={2} fill="#db2777" />
          <rect x={259} y={379} width={150} height={5} rx={1} fill="#be185d" />
          <rect x={263} y={382} width={140} height={50} rx={4} fill="#831843" />
          <rect x={267} y={385} width={132} height={46} rx={3} fill="#9d174d" />
          {([271, 316, 361] as number[]).map((x) => (
            <g key={x}>
              <rect x={x} y={389} width={36} height={32} rx={3} fill="#0f172a" stroke="#ec4899" strokeWidth={1.5}
                style={progress.theme5 >= 1 ? { animation: `vWinBlink 11s ease-in-out ${x/200}s infinite` } : {}} />
              {progress.theme5 >= 1 && <rect x={x} y={389} width={36} height={32} rx={3} fill="#ec4899" opacity={0.14} />}
            </g>
          ))}
          {progress.theme5 >= 1 && <>
            <rect x={275} y={393} width={11} height={10} rx={1} fill="#fbbf24" opacity={0.65} />
            <circle cx={299} cy={404} r={5} fill="#ec4899" opacity={0.7} />
            <rect x={320} y={393} width={24} height={8}  rx={1} fill="#60a5fa" opacity={0.55} />
            <polygon points="371,393 383,393 377,402" fill="#a78bfa" opacity={0.7} />
            <rect x={274} y={405} width={24} height={12} rx={1} fill="#f472b6" opacity={0.4} />
            <circle cx={372} cy={406} r={5} fill="#fb7185" opacity={0.5} />
          </>}
          {([269, 364] as number[]).map((x) => (
            <g key={x}>
              <rect x={x} y={430} width={32} height={8} rx={2} fill="#4a1942" />
              <circle cx={x+6}  cy={429} r={4}   fill="#f472b6" />
              <circle cx={x+14} cy={428} r={3.5} fill="#fb7185" />
              <circle cx={x+22} cy={429} r={4}   fill="#ec4899" />
            </g>
          ))}
          <rect className="vHover" x={257} y={358} width={156} height={82} rx={4}
            fill="none" stroke="#ec4899" strokeWidth={2.5} opacity={0} style={{ pointerEvents: "none" }} />
          <text x={332} y={450} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800"
            fill={progress.theme5 >= 1 ? "#f9a8d4" : "#6b7280"}>Galerie des Œuvres</text>
        </g>

        {/* T1 — ROUTES HUB */}
        <g className="vBtn" onClick={() => goTo(0)}>
          <ellipse cx={390} cy={286} rx={56} ry={22} fill="#5c3d0a" opacity={0.85} />
          <ellipse cx={390} cy={284} rx={48} ry={18} fill="#78350f" />
          {([-22,-10,2,14] as number[]).map((dx) =>
            ([-8, 4] as number[]).map((dy) => (
              <rect key={`${dx}${dy}`} x={390+dx-5} y={281+dy-4} width={10} height={7} rx={1} fill="#92400e" opacity={0.6} />
            ))
          )}
          <rect x={388} y={246} width={4} height={38} rx={2} fill="#b45309" />
          <ellipse cx={390} cy={245} rx={10} ry={4} fill="#78350f" />
          <ellipse cx={390} cy={244} rx={9}  ry={3} fill="#d97706" />
          <circle cx={390} cy={242} r={8} fill="#fef3c7" filter="url(#vSoft)"
            style={{ animation: "vPulse 3s ease-in-out infinite" }} />
          <circle cx={390} cy={242} r={4} fill="#fcd34d" />
          {/* Small houses */}
          <rect x={340} y={257} width={23} height={19} rx={2} fill="#b45309" />
          <polygon points="340,257 351,246 363,257" fill="#92400e" />
          <rect x={344} y={262} width={6}  height={10} rx={1} fill="#78350f" />
          <rect x={354} y={262} width={7}  height={8}  rx={1} fill="#78350f" stroke="#fcd34d" strokeWidth={0.8}
            style={{ animation: "vWinBlink 7s ease-in-out 1s infinite" }} />
          <rect x={416} y={257} width={23} height={19} rx={2} fill="#b45309" />
          <polygon points="416,257 427,246 439,257" fill="#92400e" />
          <rect x={420} y={262} width={6}  height={10} rx={1} fill="#78350f" />
          <rect x={430} y={262} width={7}  height={8}  rx={1} fill="#78350f" stroke="#fcd34d" strokeWidth={0.8}
            style={{ animation: "vWinBlink 7s ease-in-out 3s infinite" }} />
          <text x={390} y={304} textAnchor="middle" fontSize={9} fontFamily="system-ui" fontWeight="800" fill="#fcd34d">
            Routes du Village
          </text>
        </g>

        {/* ═══════════════════════════════════════
            LAYER 4 — TREES  (parallax mid)
        ════════════════════════════════════════ */}
        <g transform={mid} style={{ transition: "transform 0.18s ease-out" }}>
          {TREES.map(([tx, ty, s, d]) => (
            <g key={d} transform={`translate(${tx},${ty})`}
              style={{ animation: `vSway ${3.5 + (d % 3) * 0.7}s ease-in-out ${d * 0.45}s infinite` }}>
              <rect x={-3} y={0} width={6} height={s * 14} rx={2} fill="#713f12" />
              <circle cx={0}       cy={-s*8}  r={s*14} fill="#166534" />
              <circle cx={-s*6}    cy={-s*6}  r={s*10} fill="#15803d" />
              <circle cx={s*6}     cy={-s*5}  r={s*11} fill="#16a34a" />
              <circle cx={0}       cy={-s*14} r={s*9}  fill="#22c55e" opacity={0.7} />
            </g>
          ))}
        </g>

        {/* ═══════════════════════════════════════
            LAYER 5 — FIREFLIES
        ════════════════════════════════════════ */}
        {FIREFLIES.map(([fx, fy, variant, delay], i) => (
          <g key={i} transform={`translate(${fx},${fy})`}
            style={{ animation: `vFly${variant} ${4.5 + (i % 3) * 1.2}s ease-in-out ${delay}s infinite` }}>
            {/* Outer glow */}
            <circle r={5} fill="#d4fc60" opacity={0.15} filter="url(#vFirefly)" />
            {/* Inner dot */}
            <circle r={1.8} fill="#ecfccb"
              style={{ animation: `vPulse ${1.8 + (i % 4) * 0.4}s ease-in-out ${delay * 0.5}s infinite` }} />
          </g>
        ))}

        {/* ═══════════════════════════════════════
            LAYER 6 — COMPLETION STARS + LOCKS
        ════════════════════════════════════════ */}
        {SPOTS.map((s) => progress[s.id] === 2 && (
          <g key={s.id} transform={`translate(${s.x}, ${s.y - 54})`}
            style={{ animation: "vFloat 3s ease-in-out infinite" }}>
            <text fontSize={16} textAnchor="middle" y={6}>⭐</text>
          </g>
        ))}
        {SPOTS.slice(1).map((s) => progress[s.id] === 0 && (
          <g key={s.id} transform={`translate(${s.x}, ${s.y - 22})`}>
            <rect x={-11} y={-13} width={22} height={17} rx={3} fill="#0f172a" stroke="#374151" strokeWidth={1.5} />
            <path d="M-5,-13 Q-5,-24 0,-24 Q5,-24 5,-13" fill="none" stroke="#374151" strokeWidth={2} strokeLinecap="round" />
            <circle cx={0} cy={-4} r={3} fill="#4b5563" />
          </g>
        ))}

        {/* ═══════════════════════════════════════
            LAYER 7 — AVATAR
        ════════════════════════════════════════ */}
        <g className="vMove" transform={`translate(${av.x}, ${av.y - 32})`}>
          <ellipse cx={0} cy={27} rx={12} ry={4} fill="black" opacity={0.35} />
          <g style={{ animation: moving ? "none" : "vBob 2.2s ease-in-out infinite" }}>
            <rect x={-6} y={16}  width={5}  height={10} rx={2.5} fill="#2563eb" />
            <rect x={1}  y={16}  width={5}  height={10} rx={2.5} fill="#2563eb" />
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
            <circle cx={0} cy={-23} r={3} fill="#fbbf24"
              style={{ animation: "vPulse 1.8s ease-in-out infinite" }} />
          </g>
        </g>

        {/* ═══════════════════════════════════════
            LAYER 8 — SPEECH BUBBLE
        ════════════════════════════════════════ */}
        {bubble && (
          <g transform={`translate(${av.x}, ${av.y - 74})`}>
            <rect x={-74} y={-22} width={148} height={38} rx={10} fill="#0f172a" stroke="#f59e0b" strokeWidth={2} />
            <polygon points="-6,16 6,16 0,27" fill="#0f172a" />
            <polygon points="-4,16 4,16 0,25" fill="#f59e0b" />
            <text x={0} y={3} textAnchor="middle" fill="#fef3c7" fontSize={9} fontFamily="system-ui" fontWeight="800">
              {bubble.length > 22 ? bubble.slice(0, 22) + "…" : bubble}
            </text>
          </g>
        )}

        {/* ═══════════════════════════════════════
            LAYER 9 — LEGEND
        ════════════════════════════════════════ */}
        <rect x="0" y="474" width="800" height="26" fill="#060b24" opacity="0.92" />
        {SPOTS.map((s, i) => {
          const lvl = progress[s.id];
          return (
            <g key={s.id} transform={`translate(${10 + i * 156}, 487)`}>
              <circle cx={5} cy={0} r={5} fill={lvl > 0 ? s.color : "#1e293b"} />
              <text x={14} y={4} fill={lvl > 0 ? s.color : "#374151"} fontSize={9} fontFamily="system-ui" fontWeight="700">
                {s.short} {lvl === 2 ? "✓" : lvl === 1 ? "···" : "🔒"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
