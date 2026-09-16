/**
 * Séance 7 Explorateur — les quatre entraînements qui manquaient.
 *
 *     node scripts/explorateur-s7-entrainements.mjs           aperçu seul
 *     node scripts/explorateur-s7-entrainements.mjs --ecrire  applique
 *
 * S7 était la seule séance rédigée du thème 0 sans un seul entraînement : la
 * dernière du parcours, et celle qui en offrait le moins. Les quatre ci-dessous
 * rejouent les gestes de la séance, un par entraînement, sans jamais redonner
 * les réponses des défis.
 *
 *   0. Le plan d'abord   — composer un plan sur une autre mission
 *   1. L'ordre qui compte — remettre des phases dans l'ordre imposé par la clé
 *   2. Lis le tracé       — écrire un programme dont la trace dessine un L
 *   3. La deuxième porte  — un second labyrinthe clé/porte, géométrie neuve
 *
 * Le script refuse d'écrire si un labyrinthe n'est pas résoluble, si une porte
 * ne contraint rien, ou si la figure visée n'est pas celle que trace la
 * solution de référence.
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

// ── Garde-fous ─────────────────────────────────────────────────────────────
const D = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };
const O = ["N", "E", "S", "W"];

function murs(n, libres) {
  const s = new Set(libres.map(([x, y]) => `${x},${y}`));
  const w = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!s.has(`${x},${y}`)) w.push({ x, y });
  return w;
}

/** BFS (x, y, direction, clé) — la porte ne s'ouvre qu'avec la clé, comme dans le moteur. */
function resoudre(c) {
  const n = c.grid_size;
  const mur = new Set(c.walls.map((w) => `${w.x},${w.y}`));
  const cles = new Set((c.collectibles ?? []).filter((o) => o.type === "key").map((o) => `${o.x},${o.y}`));
  const portes = new Set((c.locked_doors ?? []).map((d) => `${d.x},${d.y}`));
  const cle = (s) => `${s.x},${s.y},${s.dir},${s.k ? 1 : 0}`;
  const depart = { x: c.start.x, y: c.start.y, dir: c.start.dir, k: false };
  const vus = new Set([cle(depart)]);
  let front = [[depart, 0]];
  while (front.length) {
    const suiv = [];
    for (const [s, pas] of front) {
      if (s.x === c.goal.x && s.y === c.goal.y && (!cles.size || s.k)) return { ok: true, pas };
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
      if (cles.has(ici) && !s.k) {
        const t = { ...s, k: true };
        if (!vus.has(cle(t))) { vus.add(cle(t)); suiv.push([t, pas + 1]); }
      }
    }
    front = suiv;
  }
  return { ok: false };
}

function verifierMaze(nom, c, { porteUtile = false } = {}) {
  const r = resoudre(c);
  if (!r.ok) throw new Error(`${nom} : IMPOSSIBLE`);
  if (r.pas > c.max_blocks) throw new Error(`${nom} : ${r.pas} instructions minimum > max_blocks ${c.max_blocks}`);
  if (porteUtile) {
    const sans = resoudre({ ...c, collectibles: (c.collectibles ?? []).filter((o) => o.type !== "key") });
    if (sans.ok) throw new Error(`${nom} : la porte ne contraint rien`);
  }
  console.log(`  ✓ ${nom} — ${r.pas} instructions min, max_blocks ${c.max_blocks} (marge ${c.max_blocks - r.pas})`);
  return c;
}

/** Déroule un programme sans murs et rend les cases parcourues. */
function tracer(start, prog) {
  let { x, y, dir } = start;
  const cases = [{ x, y }];
  for (const i of prog) {
    if (i === "A") { const [dx, dy] = D[dir]; x += dx; y += dy; cases.push({ x, y }); }
    else dir = O[(O.indexOf(dir) + (i === "D" ? 1 : 3)) % 4];
  }
  const vues = new Map(cases.map((c) => [`${c.x},${c.y}`, c]));
  return { cases: [...vues.values()], fin: { x, y } };
}

// ── Entraînement 2 : la figure en L, calculée, jamais recopiée à la main ────
const DEPART_L = { x: 1, y: 1, dir: "E" };
const PROG_L = ["A", "A", "A", "A", "D", "A", "A", "A", "A"];
const L_TRACE = tracer(DEPART_L, PROG_L);
console.log(`  ✓ Entraînement 2 — figure en L : ${L_TRACE.cases.length} cases, fin (${L_TRACE.fin.x},${L_TRACE.fin.y})`);

const MAZE_L = {
  game_type: "maze",
  title: "Dessine un L",
  instructions: "Quatre cases vers la droite, puis quatre cases vers le bas. Ta trace doit dessiner un L, exactement.",
  steps: ["Compte les cases d'un côté avant de poser tes blocs", "Un seul virage suffit"],
  grid_size: 7,
  start: DEPART_L,
  goal: L_TRACE.fin,
  walls: [],
  trail: true,
  target_trail: L_TRACE.cases,
  max_blocks: 10,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
};

// ── Entraînement 3 : une seconde porte, géométrie différente de la séance ───
const MAZE_PORTE = verifierMaze("Entraînement 3 — La deuxième porte", {
  game_type: "maze",
  title: "La deuxième porte",
  instructions: "Encore une porte. La clé n'est pas sur ton chemin — à toi de décider par où commencer.",
  steps: ["Repère d'abord ce qui bloque", "Découpe ta mission en phases", "L'ordre des phases n'est pas libre"],
  grid_size: 7,
  start: { x: 3, y: 0, dir: "S" },
  goal: { x: 6, y: 4 },
  walls: murs(7, [[3,0],[3,1],[3,2],[3,3],[3,4],[0,4],[1,4],[2,4],[4,4],[5,4],[6,4]]),
  collectibles: [{ x: 0, y: 4, type: "key" }],
  locked_doors: [{ x: 4, y: 4, requires: "key" }],
  // 17 instructions minimum : une marge de 1 serait le piège que l'ancien
  // Défi 3 tendait déjà (20 pour max_blocks 20). L'exercice porte sur l'ordre
  // des phases, pas sur l'économie de blocs.
  max_blocks: 22,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "robot_pick", "controls_repeat_ext"],
}, { porteUtile: true });

// ── Le contenu ─────────────────────────────────────────────────────────────
const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
const jeu  = (content) => ({ type: "blockly_challenge", content });

const ENTRAINEMENTS = [
  {
    title: "Le plan d'abord",
    description: "Une autre mission, le même réflexe : écrire les phases avant de toucher aux blocs.",
    xp_reward: 30,
    blocs: [
      kodi("<p>Je dois rapporter la gemme 💎 au coffre, mais je n'ai pas le droit de traverser deux fois la même salle.</p><p>Écris mes phases dans l'ordre. Attention : toutes les cartes ne servent pas.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le plan du coffre",
        description: "Compose les phases dans l'ordre.",
        phases: [
          "Aller jusqu'à la gemme 💎",
          "Ramasser la gemme 💎",
          "Repartir vers le coffre",
        ],
        distracteurs: [
          "Ouvrir le coffre avant d'avoir la gemme",
          "Ramasser la clé 🗝️",
        ],
        explanation: "Ramasser vient forcément après être arrivé, et repartir après avoir ramassé. Les phases ne se mélangent pas.",
      }),
    ],
  },
  {
    title: "L'ordre qui compte",
    description: "Quand une porte est verrouillée, les étapes ne sont plus interchangeables.",
    xp_reward: 30,
    blocs: [
      kodi("<p>Voici mes étapes, mais elles se sont mélangées.</p><p>Remets-les dans l'ordre où je dois les faire. 💡 Une porte verrouillée ne s'ouvre qu'après la clé.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets mes phases dans l'ordre",
        description: "Le chemin direct est barré par une porte.",
        hint: "Demande-toi ce qui est impossible tant que la clé n'est pas ramassée.",
        items: [
          "Marcher jusqu'à la clé 🗝️",
          "Ramasser la clé 🗝️",
          "Revenir devant la porte",
          "Franchir la porte",
          "Rejoindre l'étoile ⭐",
        ],
      }),
    ],
  },
  {
    title: "Lis le tracé",
    description: "Ton programme ne marque plus un point : il laisse un dessin.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Cette fois je laisse une trace derrière moi.</p><p>Écris un programme dont la trace dessine un <strong>L</strong>. Ni plus long, ni plus court.</p>"),
      jeu(MAZE_L),
    ],
  },
  {
    title: "La deuxième porte",
    description: "Un nouveau labyrinthe verrouillé — à toi de trouver l'ordre.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Dernière épreuve du thème.</p><p>Une porte, une clé, et aucune consigne qui te donne le chemin. Trace-le du doigt, découpe-le en phases, puis pose tes blocs.</p>"),
      jeu(MAZE_PORTE),
    ],
  },
];

// ── Application ────────────────────────────────────────────────────────────
const lecons = await req(() => db.from("lessons").select("id,title").eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const lessonId = lecons[0].id;

const existants = await req(() => db.from("trainings").select("id,title").eq("lesson_id", lessonId));
if (existants.length) throw new Error(`${existants.length} entraînement(s) existent déjà — ce script n'est pas fait pour écraser`);

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${ENTRAINEMENTS.length} entraînements :\n`);
for (const [i, e] of ENTRAINEMENTS.entries()) {
  console.log(`  [${i}] ${e.title} — ${e.blocs.length} blocs : ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`);
}
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: lessonId, title: e.title, description: e.description,
    xp_reward: e.xp_reward, order_index: i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const lignes = e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j }));
  const { error: eb } = await db.from("training_blocks").insert(lignes);
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
  console.log(`  ✓ [${i}] ${e.title}`);
}
console.log("\nTerminé.");
