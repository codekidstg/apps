// react-pdf — rendu serveur uniquement
import { Svg, Rect, Circle, Ellipse, Polygon, Path, Line } from "@react-pdf/renderer";
import { modeleDe, palette, type Forme } from "@/components/eleve/robots";

/**
 * Le robot de l'élève, imprimé sur son diplôme.
 *
 * Il lit exactement la même géométrie que l'écran (`robots.ts`) : c'est le
 * robot que l'enfant a construit, pas une illustration qui lui ressemble.
 *
 * Deux différences assumées avec la version navigateur, imposées par le PDF :
 * pas de halo — react-pdf n'a pas de filtre — et pas de dégradé sur le corps,
 * remplacé par la teinte pleine. Sur un papier, c'est de toute façon plus net.
 */
export default function RobotPdf({
  base, hat, accessory, color, accent, width = 54,
}: {
  base?: string | null;
  hat?: string | null;
  accessory?: string | null;
  color?: string | null;
  accent?: string | null;
  width?: number;
}) {
  const p = palette(color || "#3b82f6", accent);
  const modele = modeleDe(base);
  const hauteur = Math.round((width * 140) / 120);

  const resoudre = (f: string): string => {
    switch (f) {
      case "@corps": case "@degrade": return p.corps;
      case "@clair":                  return p.clair;
      case "@sombre":                 return p.sombre;
      case "@accent":                 return p.accent;
      case "@accentClair":            return p.accentClair;
      case "@accentSombre":           return p.accentSombre;
      default:                        return f;
    }
  };

  return (
    <Svg width={width} height={hauteur} viewBox="0 0 120 140">
      {modele.formes(!!hat).map((forme, i) => dessiner(forme, i, resoudre))}
      {hat === "hat_cap" && [
        <Rect key="c1" x={16} y={11} width={88} height={8} rx={4} fill="#1e293b" />,
        <Rect key="c2" x={24} y={2} width={72} height={12} rx={6} fill="#334155" />,
        <Rect key="c3" x={26} y={4} width={68} height={4} rx={3} fill="#475569" opacity={0.5} />,
      ]}
      {hat === "hat_wizard" && [
        <Polygon key="w1" points="60,0 30,16 90,16" fill="#6d28d9" />,
        <Polygon key="w2" points="60,2 32,14 88,14" fill="#7c3aed" />,
        <Rect key="w3" x={18} y={13} width={84} height={6} rx={3} fill="#5b21b6" />,
        <Circle key="w4" cx={60} cy={2} r={3} fill="#fbbf24" />,
      ]}
      {hat === "hat_crown" && [
        <Polygon key="k1" points="22,14 22,4 38,10 60,0 82,10 98,4 98,14" fill="#f59e0b" />,
        <Rect key="k2" x={20} y={12} width={80} height={6} rx={2} fill="#d97706" />,
        <Circle key="k3" cx={60} cy={1} r={4} fill="#ef4444" />,
        <Circle key="k4" cx={38} cy={8} r={3} fill="#3b82f6" />,
        <Circle key="k5" cx={82} cy={8} r={3} fill="#10b981" />,
      ]}
      {accessory === "acc_wings" && [
        <Path key="a1" d="M10 82 Q-10 68 2 52 Q16 70 28 78 Z" fill="#ffffff" opacity={0.85} />,
        <Path key="a2" d="M110 82 Q130 68 118 52 Q104 70 92 78 Z" fill="#ffffff" opacity={0.85} />,
      ]}
    </Svg>
  );
}

/**
 * react-pdf ne sait pas lire `rgba()` : on le sépare en une couleur pleine et
 * une opacité, qui se combine avec celle de la forme.
 */
function separer(fill: string, op?: number): { couleur: string; opacite?: number } {
  const m = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(fill);
  if (!m) return { couleur: fill, ...(op !== undefined ? { opacite: op } : {}) };
  const hex = "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  const alpha = m[4] !== undefined ? Number(m[4]) : 1;
  return { couleur: hex, opacite: alpha * (op ?? 1) };
}

function dessiner(s: Forme, i: number, resoudre: (f: string) => string) {
  switch (s.f) {
    case "rect": {
      const { couleur, opacite } = separer(resoudre(s.fill), s.op);
      return <Rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.r} fill={couleur} opacity={opacite} />;
    }
    case "cercle": {
      const rempli = s.fill ? separer(resoudre(s.fill), s.op) : null;
      const trait = s.trait ? separer(resoudre(s.trait), s.op) : null;
      return (
        <Circle key={i} cx={s.cx} cy={s.cy} r={s.rayon}
          fill={rempli ? rempli.couleur : "none"}
          stroke={trait?.couleur} strokeWidth={s.ep}
          opacity={rempli?.opacite ?? trait?.opacite} />
      );
    }
    case "ellipse": {
      const rempli = s.fill ? separer(resoudre(s.fill), s.op) : null;
      const trait = s.trait ? separer(resoudre(s.trait), s.op) : null;
      return (
        <Ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry}
          fill={rempli ? rempli.couleur : "none"}
          stroke={trait?.couleur} strokeWidth={s.ep}
          opacity={rempli?.opacite ?? trait?.opacite} />
      );
    }
    case "polygone": {
      const { couleur, opacite } = separer(resoudre(s.fill), s.op);
      return <Polygon key={i} points={s.points} fill={couleur} opacity={opacite} />;
    }
    case "chemin": {
      const { couleur, opacite } = separer(resoudre(s.fill), s.op);
      return <Path key={i} d={s.d} fill={couleur} opacity={opacite} />;
    }
    case "ligne": {
      const { couleur, opacite } = separer(resoudre(s.trait), s.op);
      return <Line key={i} x1={s.x1} y1={s.y1} x2={s.x2} y2={s.y2}
        stroke={couleur} strokeWidth={s.ep} opacity={opacite} strokeLinecap="round" />;
    }
  }
}
