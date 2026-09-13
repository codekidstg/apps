/**
 * Les quatre robots — la géométrie, définie une seule fois.
 *
 * Avant, `AvatarSvg` dessinait un seul robot et le champ `base` ne servait
 * qu'à fabriquer l'identifiant d'un dégradé : NEXUS-7, VULCAN-X, BIO-ALPHA et
 * AURUM-∞ rendaient une image strictement identique. Un enfant franchissait la
 * porte des 1500 XP, choisissait « BIO-ALPHA — Nano-organique », et ne voyait
 * rien changer.
 *
 * Les formes sont décrites en données plutôt qu'en JSX parce que le robot doit
 * aussi s'imprimer sur le diplôme, rendu par react-pdf : deux moteurs, une
 * seule définition, pas de dérive entre les deux.
 *
 * Le repère est celui d'origine — viewBox 0 0 120 140, le sol à y=138. Deux
 * conventions à respecter pour tout nouveau modèle :
 *   · les épaules restent vers y=75, sinon les ailes se décrochent ;
 *   · le sommet du crâne reste vers y=14, sinon les coiffes flottent.
 */

/** Un remplissage : soit une couleur littérale, soit un jeton résolu au rendu. */
export type Remplissage =
  | string
  | "@corps" | "@clair" | "@sombre" | "@degrade"
  | "@accent" | "@accentClair" | "@accentSombre";

export type Forme =
  | { f: "rect"; x: number; y: number; w: number; h: number; r?: number; fill: Remplissage; op?: number; lueur?: boolean }
  | { f: "cercle"; cx: number; cy: number; rayon: number; fill?: Remplissage; op?: number; trait?: Remplissage; ep?: number; lueur?: boolean }
  | { f: "ellipse"; cx: number; cy: number; rx: number; ry: number; fill?: Remplissage; op?: number; trait?: Remplissage; ep?: number }
  | { f: "polygone"; points: string; fill: Remplissage; op?: number; lueur?: boolean }
  | { f: "chemin"; d: string; fill: Remplissage; op?: number }
  | { f: "ligne"; x1: number; y1: number; x2: number; y2: number; trait: Remplissage; ep: number; op?: number; lueur?: boolean };

// ── Raccourcis d'écriture ───────────────────────────────────────────────────
const R = (x: number, y: number, w: number, h: number, r: number, fill: Remplissage, op?: number, lueur?: boolean): Forme =>
  ({ f: "rect", x, y, w, h, r, fill, ...(op !== undefined ? { op } : {}), ...(lueur ? { lueur } : {}) });
const C = (cx: number, cy: number, rayon: number, fill: Remplissage, op?: number, lueur?: boolean): Forme =>
  ({ f: "cercle", cx, cy, rayon, fill, ...(op !== undefined ? { op } : {}), ...(lueur ? { lueur } : {}) });
const Anneau = (cx: number, cy: number, rayon: number, trait: Remplissage, ep: number, op?: number): Forme =>
  ({ f: "cercle", cx, cy, rayon, trait, ep, ...(op !== undefined ? { op } : {}) });
const E = (cx: number, cy: number, rx: number, ry: number, fill: Remplissage, op?: number): Forme =>
  ({ f: "ellipse", cx, cy, rx, ry, fill, ...(op !== undefined ? { op } : {}) });
const P = (points: string, fill: Remplissage, op?: number, lueur?: boolean): Forme =>
  ({ f: "polygone", points, fill, ...(op !== undefined ? { op } : {}), ...(lueur ? { lueur } : {}) });

const NOIR_25 = "rgba(0,0,0,0.25)";
const NOIR_35 = "rgba(0,0,0,0.35)";
const NOIR_40 = "rgba(0,0,0,0.4)";
const BLANC_12 = "rgba(255,255,255,0.12)";

/** L'ombre au sol, commune à tous — sa largeur dit la carrure du modèle. */
const ombre = (rx: number, op = 0.3): Forme => ({ f: "ellipse", cx: 60, cy: 138, rx, ry: 4, fill: "rgba(0,0,0,1)", op });

// ════════════════════════════════════════════════════════════════════════════
// NEXUS-7 — l'unité de base. Le robot d'origine, repris trait pour trait.
// ════════════════════════════════════════════════════════════════════════════
function nexus(coiffe: boolean): Forme[] {
  return [
    ombre(30),

    // Jambes et pieds
    R(36, 108, 18, 22, 6, "@degrade"), R(66, 108, 18, 22, 6, "@degrade"),
    R(32, 124, 24, 8, 4, "@sombre"),   R(64, 124, 24, 8, 4, "@sombre"),
    R(39, 112, 12, 4, 2, "@clair", 0.5), R(69, 112, 12, 4, 2, "@clair", 0.5),

    // Torse
    R(28, 72, 64, 42, 10, "@degrade"),
    R(36, 80, 48, 26, 6, NOIR_25),
    R(38, 82, 44, 22, 5, BLANC_12, 0.6),

    // Réacteur central — le cœur qui s'allume
    C(60, 93, 8, "@sombre"),
    C(60, 93, 6, "@accent", undefined, true),
    C(60, 93, 4, "@accentClair"),
    C(60, 93, 2, "#ffffff", 0.9),

    // Aérations
    R(36, 88, 6, 2, 1, "@clair", 0.6), R(36, 92, 6, 2, 1, "@clair", 0.6), R(36, 96, 6, 2, 1, "@clair", 0.6),
    R(78, 88, 6, 2, 1, "@clair", 0.6), R(78, 92, 6, 2, 1, "@clair", 0.6), R(78, 96, 6, 2, 1, "@clair", 0.6),

    // Bras
    R(10, 75, 18, 36, 8, "@degrade"), R(8, 102, 22, 10, 5, "@sombre"), R(13, 79, 8, 4, 2, "@clair", 0.4),
    R(92, 75, 18, 36, 8, "@degrade"), R(90, 102, 22, 10, 5, "@sombre"), R(99, 79, 8, 4, 2, "@clair", 0.4),

    // Épaules
    C(28, 80, 7, "@sombre"), C(28, 80, 5, "@corps"),
    C(92, 80, 7, "@sombre"), C(92, 80, 5, "@corps"),

    // Cou
    R(50, 62, 20, 14, 4, "@sombre"),
    R(54, 64, 12, 10, 3, "@corps", 0.6),

    // Tête
    R(22, 14, 76, 54, 14, "@degrade"),
    R(28, 16, 64, 8, 8, BLANC_12),

    // Oreilles et leurs témoins lumineux
    R(14, 24, 10, 28, 5, "@sombre"), R(96, 24, 10, 28, 5, "@sombre"),
    R(16, 28, 6, 6, 2, "@accent", 0.85, true), R(98, 28, 6, 6, 2, "@accent", 0.85, true),

    // Yeux
    R(30, 24, 24, 20, 6, NOIR_40), R(66, 24, 24, 20, 6, NOIR_40),
    R(32, 26, 20, 16, 5, "#e8edf5"), R(68, 26, 20, 16, 5, "#e8edf5"),
    C(42, 34, 6, "@accent", undefined, true), C(78, 34, 6, "@accent", undefined, true),
    C(42, 34, 3, "@accentSombre"), C(78, 34, 3, "@accentSombre"),
    C(44, 31, 2, "#ffffff", 0.9), C(80, 31, 2, "#ffffff", 0.9),
    Anneau(42, 34, 7, "@accent", 1, 0.5), Anneau(78, 34, 7, "@accent", 1, 0.5),

    // Bouche / haut-parleur
    R(34, 52, 52, 10, 5, NOIR_35),
    R(36, 54, 8, 6, 2, "@accent", 0.8), R(46, 54, 8, 6, 2, "@accent", 0.8),
    R(56, 54, 8, 6, 2, "@accent", 0.8), R(66, 54, 8, 6, 2, "@accent", 0.8),
    R(76, 54, 8, 6, 2, "@accent", 0.8),

    // Antenne — escamotée dès qu'une coiffe est portée
    ...(coiffe ? [] : [
      { f: "ligne", x1: 60, y1: 14, x2: 60, y2: 4, trait: "@corps", ep: 3 } as Forme,
      C(60, 3, 4, "@accent", undefined, true),
      C(60, 3, 2.5, "#ffffff"),
    ]),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// VULCAN-X — modèle combat. Carrure large, visière d'un seul tenant, cornes.
// ════════════════════════════════════════════════════════════════════════════
function vulcan(coiffe: boolean): Forme[] {
  return [
    ombre(34, 0.35),

    // Jambes lourdes
    R(32, 110, 22, 22, 5, "@degrade"), R(66, 110, 22, 22, 5, "@degrade"),
    R(28, 126, 28, 9, 4, "@sombre"),   R(64, 126, 28, 9, 4, "@sombre"),
    R(36, 114, 14, 4, 2, "@clair", 0.45), R(70, 114, 14, 4, 2, "@clair", 0.45),

    // Torse large
    R(24, 70, 72, 44, 8, "@degrade"),
    // Plastron en V
    P("30,76 90,76 60,108", NOIR_25),
    P("34,79 86,79 60,103", BLANC_12, 0.5),

    // Réacteur — un noyau en losange, plus dur que le cercle du NEXUS
    P("60,84 70,94 60,104 50,94", "@sombre"),
    P("60,87 67,94 60,101 53,94", "@accent", undefined, true),
    P("60,90 64,94 60,98 56,94", "@accentClair"),

    // Aérations latérales
    R(28, 84, 8, 3, 1, "@clair", 0.5), R(28, 90, 8, 3, 1, "@clair", 0.5), R(28, 96, 8, 3, 1, "@clair", 0.5),
    R(84, 84, 8, 3, 1, "@clair", 0.5), R(84, 90, 8, 3, 1, "@clair", 0.5), R(84, 96, 8, 3, 1, "@clair", 0.5),

    // Bras
    R(10, 80, 18, 30, 6, "@degrade"), R(8, 104, 22, 11, 4, "@sombre"),
    R(92, 80, 18, 30, 6, "@degrade"), R(90, 104, 22, 11, 4, "@sombre"),

    // Pauldrons — la signature du modèle
    R(4, 66, 28, 20, 8, "@sombre"), R(88, 66, 28, 20, 8, "@sombre"),
    R(7, 69, 22, 6, 3, "@clair", 0.35), R(91, 69, 22, 6, 3, "@clair", 0.35),
    R(10, 78, 8, 3, 1.5, "@accent", 0.9, true), R(102, 78, 8, 3, 1.5, "@accent", 0.9, true),

    // Cou court
    R(52, 60, 16, 12, 3, "@sombre"),

    // Tête anguleuse
    R(26, 16, 68, 48, 8, "@degrade"),
    R(31, 18, 58, 6, 3, BLANC_12),
    // Mentonnière
    R(34, 54, 52, 11, 4, "@sombre"),
    R(40, 57, 40, 4, 2, "@clair", 0.25),

    // Visière d'un seul tenant — pas deux yeux
    R(30, 28, 60, 18, 6, NOIR_40),
    R(33, 31, 54, 12, 4, "@accent", 0.95, true),
    R(36, 33, 22, 3, 1.5, "#ffffff", 0.4),
    R(33, 31, 54, 12, 4, "@accentSombre", 0.25),

    // Cornes / évents — escamotés sous une coiffe
    ...(coiffe ? [] : [
      P("28,18 18,2 38,16", "@sombre"),
      P("92,18 102,2 82,16", "@sombre"),
      P("27,14 21,5 32,13", "@accent", 0.8),
      P("93,14 99,5 88,13", "@accent", 0.8),
    ]),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// BIO-ALPHA — nano-organique. Tête ronde, œil unique, membres fins, pousse.
// ════════════════════════════════════════════════════════════════════════════
function bio(coiffe: boolean): Forme[] {
  return [
    ombre(24, 0.25),

    // Jambes fines et pieds arrondis
    R(45, 110, 10, 20, 5, "@degrade"), R(65, 110, 10, 20, 5, "@degrade"),
    E(49, 131, 11, 5, "@sombre"), E(71, 131, 11, 5, "@sombre"),

    // Torse en goutte
    R(36, 70, 48, 44, 22, "@degrade"),
    R(43, 78, 34, 28, 16, NOIR_25),

    // Nervures
    R(59, 80, 2, 24, 1, "@accent", 0.35),
    R(50, 86, 2, 12, 1, "@accent", 0.22), R(68, 86, 2, 12, 1, "@accent", 0.22),

    // Graine centrale
    C(60, 92, 9, "@sombre"),
    C(60, 92, 6.5, "@accent", undefined, true),
    C(60, 92, 3, "@accentClair"),
    C(61, 90, 1.2, "#ffffff", 0.85),

    // Bras fins
    R(23, 76, 10, 32, 5, "@degrade"), C(28, 111, 6, "@sombre"),
    R(87, 76, 10, 32, 5, "@degrade"), C(92, 111, 6, "@sombre"),
    C(32, 78, 6, "@sombre"), C(32, 78, 4, "@corps"),
    C(88, 78, 6, "@sombre"), C(88, 78, 4, "@corps"),

    // Cou
    R(54, 58, 12, 14, 5, "@sombre"),

    // Tête ronde
    E(60, 38, 32, 27, "@degrade"),
    E(60, 26, 20, 6, BLANC_12),

    // Œil unique
    C(60, 37, 16, NOIR_40),
    C(60, 37, 13, "#e8edf5"),
    C(60, 37, 7.5, "@accent", undefined, true),
    C(60, 37, 3.8, "@accentSombre"),
    C(64, 33, 3, "#ffffff", 0.9),
    C(57, 41, 1.4, "#ffffff", 0.5),
    Anneau(60, 37, 17, "@accent", 1.2, 0.45),

    // Petite bouche
    R(52, 56, 16, 5, 2.5, "@accent", 0.65),

    // Pousse — escamotée sous une coiffe
    ...(coiffe ? [] : [
      { f: "ligne", x1: 60, y1: 12, x2: 60, y2: 3, trait: "@corps", ep: 2.5 } as Forme,
      { f: "chemin", d: "M60 6 Q50 1 52 11 Q58 11 60 6 Z", fill: "@accent", op: 0.85 } as Forme,
      { f: "chemin", d: "M60 4 Q70 -1 68 9 Q62 9 60 4 Z", fill: "@accentClair", op: 0.85 } as Forme,
    ]),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// AURUM-∞ — prototype légendaire. Pas de jambes : il lévite. Crête et visière
// à trois feux. Les bras sont détachés du corps, c'est sa signature.
// ════════════════════════════════════════════════════════════════════════════
function aurum(coiffe: boolean): Forme[] {
  return [
    ombre(16, 0.22),

    // Propulsion — les anneaux qui remplacent les jambes
    { f: "ellipse", cx: 60, cy: 122, rx: 26, ry: 7, trait: "@accent", ep: 2, op: 0.55 } as Forme,
    { f: "ellipse", cx: 60, cy: 128, rx: 18, ry: 5, trait: "@accent", ep: 1.5, op: 0.3 } as Forme,
    { f: "ellipse", cx: 60, cy: 133, rx: 10, ry: 3, trait: "@accent", ep: 1, op: 0.18 } as Forme,
    E(60, 118, 14, 5, "@accent", 0.25),

    // Torse fuselé
    P("34,72 86,72 78,116 42,116", "@degrade"),
    P("40,78 80,78 73,108 47,108", NOIR_25),
    P("43,81 77,81 71,105 49,105", BLANC_12, 0.4),

    // Noyau en losange
    P("60,82 69,94 60,106 51,94", "@sombre"),
    P("60,85 66,94 60,103 54,94", "@accent", undefined, true),
    P("60,89 63,94 60,99 57,94", "#ffffff", 0.85),

    // Bras détachés — un vide volontaire entre l'épaule et le bras
    C(30, 76, 8, "@sombre"), C(30, 76, 5, "@accent", 0.9, true),
    C(90, 76, 8, "@sombre"), C(90, 76, 5, "@accent", 0.9, true),
    R(12, 86, 16, 22, 8, "@degrade"), R(10, 104, 20, 10, 5, "@sombre"),
    R(92, 86, 16, 22, 8, "@degrade"), R(90, 104, 20, 10, 5, "@sombre"),

    // Halo
    Anneau(60, 40, 38, "@accent", 1, 0.16),

    // Cou
    R(54, 62, 12, 10, 3, "@sombre"),

    // Tête hexagonale
    P("60,14 92,27 92,53 60,66 28,53 28,27", "@degrade"),
    P("60,17 87,29 87,34 33,34 33,29", BLANC_12, 0.55),

    // Visière à trois feux
    R(34, 34, 52, 14, 6, NOIR_40),
    P("48,41 51,37 54,41 51,45", "@accent", 0.95, true),
    P("60,41 64,36 68,41 64,46", "@accent", undefined, true),
    P("72,41 75,37 78,41 75,45", "@accent", 0.95, true),

    // Menton
    R(46, 52, 28, 6, 3, "@sombre"),
    R(50, 53.5, 20, 2, 1, "@accent", 0.55),

    // Crête — escamotée sous une coiffe
    ...(coiffe ? [] : [
      P("42,18 60,0 78,18", "@accentSombre"),
      P("46,17 60,4 74,17", "@accent", undefined, true),
      P("52,16 60,8 68,16", "@accentClair", 0.9),
    ]),
  ];
}

// ── Le catalogue ────────────────────────────────────────────────────────────

export type Modele = {
  id: string;
  nom: string;
  desc: string;
  /** Ce qui saute aux yeux, pour que l'enfant sache ce qu'il choisit. */
  signe: string;
  xpRequis: number;
  formes: (coiffe: boolean) => Forme[];
  /** Le point qui respire dans l'atelier — toujours le réacteur, jamais masqué
   *  par une coiffe, contrairement à l'antenne d'origine. */
  phare: { x: number; y: number };
};

/**
 * Les identifiants gardent leurs noms de couleur d'origine — ils sont déjà
 * enregistrés en base pour les élèves qui ont personnalisé leur robot, et
 * les renommer effacerait leur choix.
 */
export const MODELES: Modele[] = [
  { id: "robot_blue",   nom: "NEXUS-7",   desc: "Unité de base",        signe: "Deux yeux, une antenne",  xpRequis: 0,    formes: nexus,  phare: { x: 60, y: 93 } },
  { id: "robot_orange", nom: "VULCAN-X",  desc: "Modèle combat",        signe: "Visière et pauldrons",    xpRequis: 500,  formes: vulcan, phare: { x: 60, y: 94 } },
  { id: "robot_green",  nom: "BIO-ALPHA", desc: "Nano-organique",       signe: "Un seul grand œil",       xpRequis: 1500, formes: bio,    phare: { x: 60, y: 92 } },
  { id: "robot_gold",   nom: "AURUM-∞",   desc: "Prototype légendaire", signe: "Sans jambes : il lévite", xpRequis: 3000, formes: aurum,  phare: { x: 60, y: 94 } },
];

export const modeleDe = (id?: string | null): Modele =>
  MODELES.find((m) => m.id === id) ?? MODELES[0];

// ── Résolution des couleurs ─────────────────────────────────────────────────

export type Palette = { corps: string; clair: string; sombre: string; accent: string; accentClair: string; accentSombre: string };

/** Éclaircit ou assombrit une couleur hexadécimale. */
export function nuance(hex: string, pourcent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + pourcent * 2.55));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + pourcent * 2.55));
  const b = Math.min(255, Math.max(0, (num & 0xff) + pourcent * 2.55));
  return `#${Math.round(r).toString(16).padStart(2, "0")}${Math.round(g).toString(16).padStart(2, "0")}${Math.round(b).toString(16).padStart(2, "0")}`;
}

/**
 * L'accent par défaut est « Cryo », le cyan du nuancier — proche du bleu qui
 * était codé en dur dans les pupilles, mais présent dans la palette : un
 * enfant qui change d'accent doit pouvoir revenir au réglage d'origine, ce
 * qu'une valeur hors nuancier lui aurait interdit.
 *
 * Il est volontairement différent du corps par défaut (Plasma) : sur un robot
 * tout neuf, les deux couleurs se distinguent, et c'est ainsi qu'un enfant
 * comprend qu'il y en a deux à régler.
 */
export const ACCENT_DEFAUT = "#06b6d4";

export function palette(corps: string, accent?: string | null): Palette {
  const a = accent || ACCENT_DEFAUT;
  return {
    corps,
    clair: nuance(corps, 40),
    sombre: nuance(corps, -40),
    accent: a,
    accentClair: nuance(a, 45),
    accentSombre: nuance(a, -45),
  };
}

/** Traduit un jeton en couleur ; `degradeAplat` sert au PDF, qui n'a pas de dégradé. */
export function couleur(fill: Remplissage, p: Palette, degradeAplat = false): string {
  switch (fill) {
    case "@corps":        return p.corps;
    case "@clair":        return p.clair;
    case "@sombre":       return p.sombre;
    case "@accent":       return p.accent;
    case "@accentClair":  return p.accentClair;
    case "@accentSombre": return p.accentSombre;
    case "@degrade":      return degradeAplat ? p.corps : p.corps;
    default:              return fill;
  }
}
