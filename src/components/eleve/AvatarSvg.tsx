"use client";

type AvatarConfig = {
  base?: string;
  hat?: string | null;
  accessory?: string | null;
  color?: string;
  size?: number;
  animated?: boolean;
};

export default function AvatarSvg({ base = "robot_blue", hat, accessory, color, size = 64, animated = false }: AvatarConfig) {
  const bodyColor = color ?? "#3b82f6";
  const darkColor = shadeColor(bodyColor, -40);
  const lightColor = shadeColor(bodyColor, 40);
  const glowColor = bodyColor + "88";
  const id = `av-${base}-${(color ?? "").replace("#", "")}`;

  return (
    <svg width={size} height={size} viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar">
      <defs>
        <radialGradient id={`body-${id}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={lightColor} />
          <stop offset="100%" stopColor={darkColor} />
        </radialGradient>
        <radialGradient id={`eye-${id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
        <radialGradient id={`pupil-${id}`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="60%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <filter id={`softglow-${id}`}>
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        <linearGradient id={`panel-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
        </linearGradient>
        <linearGradient id={`leg-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={bodyColor} />
          <stop offset="100%" stopColor={darkColor} />
        </linearGradient>
      </defs>

      {/* ── Shadow ── */}
      <ellipse cx="60" cy="138" rx="30" ry="4" fill="rgba(0,0,0,0.3)" />

      {/* ── Legs ── */}
      <rect x="36" y="108" width="18" height="22" rx="6" fill={`url(#leg-${id})`} />
      <rect x="66" y="108" width="18" height="22" rx="6" fill={`url(#leg-${id})`} />
      {/* Feet */}
      <rect x="32" y="124" width="24" height="8" rx="4" fill={darkColor} />
      <rect x="64" y="124" width="24" height="8" rx="4" fill={darkColor} />
      {/* Knee detail */}
      <rect x="39" y="112" width="12" height="4" rx="2" fill={lightColor} opacity="0.5" />
      <rect x="69" y="112" width="12" height="4" rx="2" fill={lightColor} opacity="0.5" />

      {/* ── Torso ── */}
      <rect x="28" y="72" width="64" height="42" rx="10" fill={`url(#body-${id})`} />
      {/* Torso panel */}
      <rect x="36" y="80" width="48" height="26" rx="6" fill="rgba(0,0,0,0.25)" />
      <rect x="38" y="82" width="44" height="22" rx="5" fill={`url(#panel-${id})`} />
      {/* Core reactor */}
      <circle cx="60" cy="93" r="8" fill={darkColor} />
      <circle cx="60" cy="93" r="6" fill={bodyColor} filter={`url(#glow-${id})`} />
      <circle cx="60" cy="93" r="4" fill={lightColor} />
      <circle cx="60" cy="93" r="2" fill="white" opacity="0.9" />
      {/* Side vents */}
      <rect x="36" y="88" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />
      <rect x="36" y="92" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />
      <rect x="36" y="96" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />
      <rect x="78" y="88" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />
      <rect x="78" y="92" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />
      <rect x="78" y="96" width="6" height="2" rx="1" fill={lightColor} opacity="0.6" />

      {/* ── Arms ── */}
      {/* Left arm */}
      <rect x="10" y="75" width="18" height="36" rx="8" fill={`url(#body-${id})`} />
      <rect x="8" y="102" width="22" height="10" rx="5" fill={darkColor} />
      <rect x="13" y="79" width="8" height="4" rx="2" fill={lightColor} opacity="0.4" />
      {/* Right arm */}
      <rect x="92" y="75" width="18" height="36" rx="8" fill={`url(#body-${id})`} />
      <rect x="90" y="102" width="22" height="10" rx="5" fill={darkColor} />
      <rect x="99" y="79" width="8" height="4" rx="2" fill={lightColor} opacity="0.4" />

      {/* ── Shoulder joints ── */}
      <circle cx="28" cy="80" r="7" fill={darkColor} />
      <circle cx="28" cy="80" r="5" fill={bodyColor} />
      <circle cx="92" cy="80" r="7" fill={darkColor} />
      <circle cx="92" cy="80" r="5" fill={bodyColor} />

      {/* ── Neck ── */}
      <rect x="50" y="62" width="20" height="14" rx="4" fill={darkColor} />
      <rect x="54" y="64" width="12" height="10" rx="3" fill={bodyColor} opacity="0.6" />

      {/* ── Head ── */}
      <rect x="22" y="14" width="76" height="54" rx="14" fill={`url(#body-${id})`} />
      {/* Head top highlight */}
      <rect x="28" y="16" width="64" height="8" rx="8" fill="rgba(255,255,255,0.12)" />
      {/* Ear panels */}
      <rect x="14" y="24" width="10" height="28" rx="5" fill={darkColor} />
      <rect x="96" y="24" width="10" height="28" rx="5" fill={darkColor} />
      <rect x="16" y="28" width="6" height="6" rx="2" fill={glowColor} filter={`url(#glow-${id})`} />
      <rect x="98" y="28" width="6" height="6" rx="2" fill={glowColor} filter={`url(#glow-${id})`} />

      {/* ── Eyes ── */}
      {/* Eye sockets */}
      <rect x="30" y="24" width="24" height="20" rx="6" fill="rgba(0,0,0,0.4)" />
      <rect x="66" y="24" width="24" height="20" rx="6" fill="rgba(0,0,0,0.4)" />
      {/* Eye whites */}
      <rect x="32" y="26" width="20" height="16" rx="5" fill={`url(#eye-${id})`} />
      <rect x="68" y="26" width="20" height="16" rx="5" fill={`url(#eye-${id})`} />
      {/* Pupils */}
      <circle cx="42" cy="34" r="6" fill={`url(#pupil-${id})`} filter={`url(#softglow-${id})`} />
      <circle cx="78" cy="34" r="6" fill={`url(#pupil-${id})`} filter={`url(#softglow-${id})`} />
      {/* Iris detail */}
      <circle cx="42" cy="34" r="3" fill="#1d4ed8" />
      <circle cx="78" cy="34" r="3" fill="#1d4ed8" />
      {/* Eye shine */}
      <circle cx="44" cy="31" r="2" fill="white" opacity="0.9" />
      <circle cx="80" cy="31" r="2" fill="white" opacity="0.9" />
      {/* Eye glow ring */}
      <circle cx="42" cy="34" r="7" fill="none" stroke={bodyColor} strokeWidth="1" opacity="0.5" />
      <circle cx="78" cy="34" r="7" fill="none" stroke={bodyColor} strokeWidth="1" opacity="0.5" />

      {/* ── Mouth / Speaker ── */}
      <rect x="34" y="52" width="52" height="10" rx="5" fill="rgba(0,0,0,0.35)" />
      <rect x="36" y="54" width="8" height="6" rx="2" fill={glowColor} />
      <rect x="46" y="54" width="8" height="6" rx="2" fill={glowColor} />
      <rect x="56" y="54" width="8" height="6" rx="2" fill={glowColor} />
      <rect x="66" y="54" width="8" height="6" rx="2" fill={glowColor} />
      <rect x="76" y="54" width="8" height="6" rx="2" fill={glowColor} />

      {/* ── Antenna ── */}
      <line x1="60" y1="14" x2="60" y2="4" stroke={bodyColor} strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="3" r="4" fill="#fbbf24" filter={`url(#glow-${id})`} />
      <circle cx="60" cy="3" r="2.5" fill="white" />
      {animated && (
        <circle cx="60" cy="3" r="5" fill="none" stroke="#fbbf24" strokeWidth="1" opacity="0.6">
          <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* ── Hat ── */}
      {hat === "hat_cap" && (
        <g>
          <rect x="16" y="11" width="88" height="8" rx="4" fill="#1e293b" />
          <rect x="24" y="2" width="72" height="12" rx="6" fill="#334155" />
          <rect x="26" y="4" width="68" height="4" rx="3" fill="#475569" opacity="0.5" />
          <rect x="60" y="2" width="20" height="4" rx="2" fill="#64748b" opacity="0.4" />
        </g>
      )}
      {hat === "hat_wizard" && (
        <g>
          <polygon points="60,0 30,16 90,16" fill="#6d28d9" />
          <polygon points="60,2 32,14 88,14" fill="#7c3aed" />
          <rect x="18" y="13" width="84" height="6" rx="3" fill="#5b21b6" />
          <circle cx="60" cy="2" r="3" fill="#fbbf24" filter={`url(#glow-${id})`} />
          <circle cx="40" cy="12" r="1.5" fill="#fbbf24" opacity="0.6" />
          <circle cx="80" cy="10" r="1.5" fill="#fbbf24" opacity="0.6" />
        </g>
      )}
      {hat === "hat_crown" && (
        <g>
          <polygon points="22,14 22,4 38,10 60,0 82,10 98,4 98,14" fill="#f59e0b" />
          <rect x="20" y="12" width="80" height="6" rx="2" fill="#d97706" />
          <circle cx="60" cy="1" r="4" fill="#ef4444" />
          <circle cx="38" cy="8" r="3" fill="#3b82f6" />
          <circle cx="82" cy="8" r="3" fill="#10b981" />
        </g>
      )}

      {/* ── Accessory / Wings ── */}
      {accessory === "acc_wings" && (
        <g opacity="0.9">
          {/* Left wing */}
          <path d="M10 82 Q-10 68 2 52 Q16 70 28 78 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M10 82 Q-6 76 0 62 Q12 74 28 80 Z" fill="rgba(255,255,255,0.5)" />
          {/* Right wing */}
          <path d="M110 82 Q130 68 118 52 Q104 70 92 78 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M110 82 Q126 76 120 62 Q108 74 92 80 Z" fill="rgba(255,255,255,0.5)" />
        </g>
      )}
    </svg>
  );
}

function shadeColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent * 2.55));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent * 2.55));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent * 2.55));
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}
