"use client";

import { type Forme, type Palette, modeleDe, palette } from "./robots";

/**
 * Le rendu navigateur du robot. La géométrie vit dans `robots.ts` — ici on ne
 * fait que traduire des formes en SVG, poser les dégradés et les halos, puis
 * ajouter la coiffe et l'accessoire par-dessus.
 *
 * Le PDF du diplôme lit la même géométrie avec son propre traducteur, pour que
 * le robot imprimé soit celui que l'enfant a construit.
 */

type AvatarConfig = {
  base?: string;
  hat?: string | null;
  accessory?: string | null;
  color?: string;
  /** La couleur de ce qui s'allume : yeux, réacteur, antenne, bouche. */
  accent?: string | null;
  size?: number;
  animated?: boolean;
};

export default function AvatarSvg({
  base = "robot_blue", hat, accessory, color, accent, size = 64, animated = false,
}: AvatarConfig) {
  const p = palette(color ?? "#3b82f6", accent);
  const modele = modeleDe(base);
  const coiffe = !!hat;

  // Un identifiant unique par combinaison : deux robots différents affichés
  // côte à côte ne doivent pas se partager un dégradé.
  const id = `av-${base}-${(color ?? "").replace("#", "")}-${(accent ?? "").replace("#", "")}`;

  const resoudre = (f: string): string =>
    f === "@degrade" ? `url(#corps-${id})` : jeton(f, p);

  return (
    <svg width={size} height={size} viewBox="0 0 120 140" xmlns="http://www.w3.org/2000/svg" aria-label="Avatar">
      <defs>
        <radialGradient id={`corps-${id}`} cx="40%" cy="30%" r="70%">
          <stop offset="0%" stopColor={p.clair} />
          <stop offset="100%" stopColor={p.sombre} />
        </radialGradient>
        <filter id={`lueur-${id}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="flou" />
          <feMerge><feMergeNode in="flou" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {modele.formes(coiffe).map((forme, i) => dessiner(forme, i, resoudre, `url(#lueur-${id})`))}

      {/* ── Coiffes ── */}
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
          <circle cx="60" cy="2" r="3" fill="#fbbf24" filter={`url(#lueur-${id})`} />
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

      {/* ── Accessoires ── */}
      {accessory === "acc_wings" && (
        <g opacity="0.9">
          <path d="M10 82 Q-10 68 2 52 Q16 70 28 78 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M10 82 Q-6 76 0 62 Q12 74 28 80 Z" fill="rgba(255,255,255,0.5)" />
          <path d="M110 82 Q130 68 118 52 Q104 70 92 78 Z" fill="rgba(255,255,255,0.85)" />
          <path d="M110 82 Q126 76 120 62 Q108 74 92 80 Z" fill="rgba(255,255,255,0.5)" />
        </g>
      )}

      {/* Le réacteur qui respire — seulement dans l'atelier de personnalisation.
          L'ancienne version faisait battre l'antenne, que la moindre coiffe
          recouvrait ; le réacteur, lui, est toujours visible. */}
      {animated && (
        <circle cx={modele.phare.x} cy={modele.phare.y} r="9"
          fill="none" stroke={p.accent} strokeWidth="1.2" opacity="0.55">
          <animate attributeName="r" values="8;15;8" dur="2.6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.55;0;0.55" dur="2.6s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

/** Traduit un jeton de couleur ; le dégradé est traité par l'appelant. */
function jeton(f: string, p: Palette): string {
  switch (f) {
    case "@corps":        return p.corps;
    case "@clair":        return p.clair;
    case "@sombre":       return p.sombre;
    case "@accent":       return p.accent;
    case "@accentClair":  return p.accentClair;
    case "@accentSombre": return p.accentSombre;
    default:              return f;
  }
}

function dessiner(s: Forme, i: number, couleur: (f: string) => string, lueur: string) {
  const filtre = "lueur" in s && s.lueur ? { filter: lueur } : {};
  const opacite = s.op !== undefined ? { opacity: s.op } : {};

  switch (s.f) {
    case "rect":
      return <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={couleur(s.fill)} {...opacite} {...filtre} />;
    case "cercle":
      return <circle key={i} cx={s.cx} cy={s.cy} r={s.rayon}
        fill={s.fill ? couleur(s.fill) : "none"}
        {...(s.trait ? { stroke: couleur(s.trait), strokeWidth: s.ep } : {})}
        {...opacite} {...filtre} />;
    case "ellipse":
      return <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
        fill={s.fill ? couleur(s.fill) : "none"}
        {...(s.trait ? { stroke: couleur(s.trait), strokeWidth: s.ep } : {})}
        {...opacite} />;
    case "polygone":
      return <polygon key={i} points={s.points} fill={couleur(s.fill)} {...opacite} {...filtre} />;
    case "chemin":
      return <path key={i} d={s.d} fill={couleur(s.fill)} {...opacite} />;
    case "ligne":
      return <line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
        stroke={couleur(s.trait)} strokeWidth={s.ep} strokeLinecap="round" {...opacite} {...filtre} />;
  }
}
