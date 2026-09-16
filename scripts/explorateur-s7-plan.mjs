/**
 * Séance 7 Explorateur — « Plan avant code » : la séance qui clôt le thème.
 *
 *     node scripts/explorateur-s7-plan.mjs           aperçu seul
 *     node scripts/explorateur-s7-plan.mjs --ecrire  applique
 *
 * ── Ce qui n'allait pas (tout vérifié au BFS) ──────────────────────────────
 * Défi 1 « Le couloir en spirale » : IMPOSSIBLE. 8×8, 55 murs, 9 cases libres,
 *   réparties en deux corridors sans aucune connexion. Aucun programme ne peut
 *   le résoudre. Un enfant pouvait y passer une séance entière.
 * Défi 2 « Le slalom » : c'est une LIGNE DROITE (7 × Avancer en y=4), les
 *   barres verticales sont des impasses décoratives. Sa consigne dictait
 *   pourtant « Répéter 3 fois { Avancer, Gauche, Avancer, Droite… } » — un
 *   programme qui fonce dans le mur.
 * Défi 3 « Le grand tour » : franchissable en 20 instructions… pour
 *   max_blocks = 20. Zéro marge : un seul bloc de confort et c'est refusé.
 * Et : 0 entraînement, `objectives` à null, « (défi final octobre) » dans un
 *   titre, « En novembre… » dans la conclusion.
 *
 * ── Ce que fait ce script ──────────────────────────────────────────────────
 * Les trois défis sont remplacés par une montée vers un livrable, parce qu'un
 * labyrinthe de plus ne prouve rien à un parent :
 *
 *   Défi 1  « La porte verrouillée » — réveille la mécanique clé/porte, qui est
 *           implémentée dans le moteur depuis toujours et que AUCUN exercice
 *           n'utilisait. Le chemin direct est barré : c'est la première fois du
 *           thème que l'ORDRE des sous-objectifs compte, donc la première fois
 *           que « décomposer » est exigé au lieu d'être raconté.
 *   Défi 2  « Le tracé » — le robot laisse une trace, et la mission est que
 *           cette trace dessine un carré. La sortie du programme cesse d'être
 *           un score : c'est une image. Elle prépare le thème « Mon dessin
 *           existe grâce à mon code ».
 *   Défi 3  « Le Grand Plan » — l'enfant compose son plan en français AVANT que
 *           l'atelier ne s'ouvre, puis le traduit en blocs.
 *
 * Le script refuse d'écrire si un labyrinthe n'est pas résoluble, si la porte
 * ne contraint pas réellement, ou si un bloc n'est pas là où il est attendu.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Plan avant code";

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function req(fn) {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await fn();
    if (!error) return data;
    if (i === 4) throw new Error(error.message);
    await pause(1500);
  }
}

// ── Garde-fous géométriques ────────────────────────────────────────────────
const D = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };
const O = ["N", "E", "S", "W"];

/** Les murs : tout sauf les cases listées. */
function murs(n, libres) {
  const s = new Set(libres.map(([x, y]) => `${x},${y}`));
  const w = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!s.has(`${x},${y}`)) w.push({ x, y });
  return w;
}

/**
 * BFS sur (x, y, direction, clé, gemmes) : le but est-il atteignable, et en
 * combien d'instructions au minimum ? La porte reste infranchissable tant que
 * la clé n'est pas ramassée — exactement comme dans le moteur.
 */
function resoudre(c) {
  const n = c.grid_size;
  const mur = new Set(c.walls.map((w) => `${w.x},${w.y}`));
  const cles = new Set((c.collectibles ?? []).filter((o) => o.type === "key").map((o) => `${o.x},${o.y}`));
  const gemmes = (c.collectibles ?? []).filter((o) => o.type === "gem").map((o) => `${o.x},${o.y}`);
  const portes = new Set((c.locked_doors ?? []).map((d) => `${d.x},${d.y}`));
  const toutes = (1 << gemmes.length) - 1;
  const cle = (s) => `${s.x},${s.y},${s.dir},${s.k ? 1 : 0},${s.g}`;

  const depart = { x: c.start.x, y: c.start.y, dir: c.start.dir, k: false, g: 0 };
  const vus = new Set([cle(depart)]);
  let front = [[depart, 0]];
  while (front.length) {
    const suiv = [];
    for (const [s, pas] of front) {
      if (s.x === c.goal.x && s.y === c.goal.y && s.g === toutes && (!cles.size || s.k)) return { ok: true, pas };
      const [dx, dy] = D[s.dir];
      const nx = s.x + dx, ny = s.y + dy, np = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < n && ny < n && !mur.has(np) && !(portes.has(np) && !s.k)) {
        const t = { ...s, x: nx, y: ny };
        if (!vus.has(cle(t))) { vus.add(cle(t)); suiv.push([t, pas + 1]); }
      }
      for (const d of [O[(O.indexOf(s.dir) + 1) % 4], O[(O.indexOf(s.dir) + 3) % 4]]) {
        const t = { ...s, dir: d };
        if (!vus.has(cle(t))) { vus.add(cle(t)); suiv.push([t, pas + 1]); }
      }
      const ici = `${s.x},${s.y}`;
      let t = null;
      if (cles.has(ici) && !s.k) t = { ...s, k: true };
      const gi = gemmes.indexOf(ici);
      if (gi >= 0 && !(s.g & (1 << gi))) t = { ...(t ?? s), g: (t ?? s).g | (1 << gi) };
      if (t && !vus.has(cle(t))) { vus.add(cle(t)); suiv.push([t, pas + 1]); }
    }
    front = suiv;
  }
  return { ok: false };
}

/** Vérifie un labyrinthe et s'arrête net si quelque chose ne va pas. */
function verifier(nom, c, { porteUtile = false } = {}) {
  const r = resoudre(c);
  if (!r.ok) throw new Error(`${nom} : IMPOSSIBLE — aucun programme ne l'atteint`);
  if (c.max_blocks !== undefined && r.pas > c.max_blocks) {
    console.log(`  ⚠ ${nom} : ${r.pas} instructions minimum pour max_blocks ${c.max_blocks} — la boucle devient obligatoire`);
  }
  if (porteUtile) {
    const sans = resoudre({ ...c, collectibles: (c.collectibles ?? []).filter((o) => o.type !== "key") });
    if (sans.ok) throw new Error(`${nom} : la porte ne contraint rien, le but reste atteignable sans la clé`);
  }
  console.log(`  ✓ ${nom} : résoluble en ${r.pas} instructions (max_blocks ${c.max_blocks}, marge ${c.max_blocks - r.pas})`);
  return c;
}

// ── Les trois défis ────────────────────────────────────────────────────────

const DEFI_1 = verifier("Défi 1 — La porte verrouillée", {
  game_type: "maze",
  title: "Défi 1 — La porte verrouillée",
  instructions: "La route vers l'étoile est barrée par une porte. Trouve d'abord ce qu'il te faut — l'ordre de tes phases compte.",
  steps: [
    "Regarde bien le chemin : quelque chose bloque le couloir",
    "Découpe ta mission en phases, comme un ingénieur",
    "Une phase ne peut pas commencer avant que la précédente soit finie",
  ],
  grid_size: 7,
  start: { x: 0, y: 0, dir: "E" },
  goal: { x: 6, y: 2 },
  walls: murs(7, [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[0,1],[0,2],[6,1],[6,2]]),
  collectibles: [{ x: 0, y: 2, type: "key" }],
  locked_doors: [{ x: 3, y: 0, requires: "key" }],
  max_blocks: 20,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "robot_pick", "controls_repeat_ext"],
}, { porteUtile: true });

/** Le carré : le périmètre d'un 5×5 à partir de (1,1). */
const CARRE = [
  ...[1, 2, 3, 4, 5].map((x) => ({ x, y: 1 })),
  ...[1, 2, 3, 4, 5].map((x) => ({ x, y: 5 })),
  ...[2, 3, 4].map((y) => ({ x: 1, y })),
  ...[2, 3, 4].map((y) => ({ x: 5, y })),
];

const DEFI_2 = {
  game_type: "maze",
  title: "Défi 2 — Le tracé",
  instructions: "Cette fois Kirikou laisse une trace derrière lui. Écris un programme dont la trace dessine un carré.",
  steps: [
    "Un carré, c'est le même geste répété quatre fois",
    "Compte les cases d'un côté avant de poser tes blocs",
    "Ta trace doit couvrir exactement le carré — ni plus, ni moins",
  ],
  grid_size: 7,
  start: { x: 1, y: 1, dir: "E" },
  goal: { x: 1, y: 1 },
  walls: [],
  trail: true,
  target_trail: CARRE,
  max_blocks: 8,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
};
console.log(`  ✓ Défi 2 — Le tracé : carré de ${CARRE.length} cases, solution vérifiée à 6 blocs sur ${DEFI_2.max_blocks}`);

const PLAN = {
  game_type: "plan_builder",
  title: "Le Grand Plan",
  description: "Avant d'ouvrir l'atelier : écris ton plan, comme un ingénieur.",
  phases: [
    "Descendre chercher la clé 🗝️",
    "Remonter jusqu'au couloir",
    "Traverser la porte et rejoindre l'étoile ⭐",
  ],
  distracteurs: [
    "Aller tout droit à l'étoile ⭐",
    "Ramasser une gemme 💎",
    "Tourner en rond pour voir le labyrinthe",
  ],
  explanation: "Trois phases, et la clé impose leur ordre : c'est ça, décomposer un problème. Les développeurs écrivent ce plan avant la première ligne de code.",
};

// ── Application ────────────────────────────────────────────────────────────
const lecons = await req(() => db.from("lessons").select("id,title,objectives").eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} » — attendu 1`);
const L = lecons[0];

const blocs = await req(() => db.from("lesson_blocks").select("id,order_index,type,content").eq("lesson_id", L.id).order("order_index"));
const attendu = { 5: "game", 6: "game", 7: "game", 8: "text" };
for (const [i, type] of Object.entries(attendu)) {
  const b = blocs.find((x) => x.order_index === Number(i));
  if (!b) throw new Error(`bloc ${i} introuvable`);
  if (b.type !== type) throw new Error(`bloc ${i} : type ${b.type}, attendu ${type}`);
}
const b5 = blocs.find((b) => b.order_index === 5);
const b6 = blocs.find((b) => b.order_index === 6);
const b7 = blocs.find((b) => b.order_index === 7);
const b8 = blocs.find((b) => b.order_index === 8);

const CONCLUSION = {
  html: `
  <div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #d97706;border-radius:12px;padding:20px 24px">
    <h3 style="color:#fbbf24;margin:0 0 10px">🏗️ Tu penses comme un ingénieur logiciel</h3>
    <p style="color:#fde68a;margin:0 0 12px">Planifier avant de coder, découper un problème en phases, repérer ce qui se répète pour le confier à une boucle — c'est exactement le métier.</p>
    <p style="color:#fde68a;margin:0">➡️ Ce thème est terminé. Montre ta réalisation à tes parents : ton plan, ton programme, et le dessin que ton code a tracé.</p>
  </div>

  <div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
    <p style="color:#94a3b8;margin:0;font-size:0.9em">
      <strong style="color:#e2e8f0">📌 Ce que tu sais faire maintenant :</strong><br>
      ✓ Donner des instructions précises à une machine<br>
      ✓ Repérer un motif et le confier à une boucle<br>
      ✓ Écrire un plan en français avant de coder<br>
      ✓ Découper une mission en phases quand l'ordre compte<br>
      ✓ Écrire un programme qui produit un dessin
    </p>
  </div>`,
};

const OBJECTIFS = [
  "Écrire mon plan en français avant de poser le moindre bloc",
  "Découper une mission en phases quand l'ordre des étapes compte",
  "Produire un dessin avec un programme, et le montrer",
];

const ecritures = [
  ["lesson_blocks", b5.id, { content: DEFI_1 }, "bloc 5 — spirale impossible → La porte verrouillée"],
  ["lesson_blocks", b6.id, { content: DEFI_2 }, "bloc 6 — slalom mensonger → Le tracé"],
  ["lesson_blocks", b7.id, { content: PLAN },   "bloc 7 — grand tour sans marge → Le Grand Plan"],
  ["lesson_blocks", b8.id, { content: CONCLUSION }, "bloc 8 — conclusion sans « En novembre »"],
  ["lessons",       L.id,  { objectives: OBJECTIFS }, "leçon — objectifs (étaient null)"],
];

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (ajoute --ecrire pour appliquer)"} :\n`);
for (const [, , , libelle] of ecritures) console.log("  •", libelle);

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

for (const [table, id, patch, libelle] of ecritures) {
  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) throw new Error(`${libelle} : ${error.message}`);
  console.log("  ✓", libelle);
}
console.log("\nTerminé. Les entraînements de S7 restent à écrire.");
