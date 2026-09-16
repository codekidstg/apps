/**
 * Séance 6 Explorateur — « Trouver le motif » : diversifier les jeux, et cesser
 * de donner la réponse dans la consigne.
 *
 *     node scripts/explorateur-s6-motif.mjs           aperçu seul
 *     node scripts/explorateur-s6-motif.mjs --ecrire  applique
 *
 * ── Ce qui n'allait pas ────────────────────────────────────────────────────
 * 1. `pattern_select` revenait CINQ fois (blocs 3, 8, 11 + deux fois dans
 *    l'entraînement « Surligne le motif »). Le geste y est toujours le même :
 *    deux clics, verdict binaire. À partir de la troisième fois, seule la
 *    garniture changeait — robot, robot+reste, notes, tambour.
 *
 * 2. Le motif ET le nombre de tours étaient dictés dans chaque consigne :
 *      Défi 1        « Le motif : Avancer, Tourner à droite… » + « il y en a six »
 *      Défi 2        « Repère les marches : il y en a trois »
 *      Entraînement  « Le motif fait quatre instructions : … » + « quatre marches »
 *    Le geste central de la séance était donc offert à l'instant précis où il
 *    aurait dû être exigé. L'enfant recopiait.
 *
 * 3. L'objectif n°2 — « compter les répétitions pour régler le nombre de la
 *    boucle » — n'était exercé par aucun jeu. `pattern_select` annonce lui-même
 *    « se répète N fois » dans sa correction.
 *
 * 4. Bloc 0 : la bande de flèches montre TROIS répétitions, le texte dit « six
 *    fois de suite ». Bloc 12, Q1 : la question du bloc 2 Q2, à +2 près.
 *
 * ── Ce que fait ce script ──────────────────────────────────────────────────
 * Bloc 0   la bande de flèches passe à six répétitions
 * Bloc 8   pattern_select → pattern_build (le nouveau jeu : motif + compteur)
 * Bloc 11  pattern_select → music (le motif qui s'entend, pas qui se clique)
 * Bloc 12  Q1 remplacée : déduire N à partir du total, ce que rien ne testait
 * Bloc 5   Défi 1 — consigne sans le motif ni le compte
 * Bloc 9   Défi 2 — nouvelle géométrie : un motif de SIX instructions, pas
 *          l'escalier. La séance contient enfin deux motifs différents.
 * Entr. 1  le tambour passe en pattern_build (un seul pattern_select restant)
 * Entr. 3  consigne sans le motif ni le compte
 *
 * Résultat : cinq `pattern_select` → deux. Une modalité sonore gagnée. Le jeu
 * central devient actif. Et les quatre exercices qui donnaient la réponse ne la
 * donnent plus.
 *
 * Le script refuse d'écrire si un bloc n'est pas là où il est attendu, ou si le
 * nouveau labyrinthe n'est pas résoluble.
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
const LECON = "Trouver le motif";

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function req(fn) {
  for (let i = 0; i < 5; i++) {
    const { data, error } = await fn();
    if (!error) return data;
    if (i === 4) throw new Error(error.message);
    await pause(1500);
  }
}

// ── Garde-fou : le nouveau Défi 2 est-il résoluble ? ────────────────────────
const DIRS = { E: [1, 0], S: [0, 1], W: [-1, 0], N: [0, -1] };
const ORDRE = ["N", "E", "S", "W"];

/** Déroule un programme et rend le chemin, ou lève si le robot se cogne. */
function simuler(prog, { walls, grid, start, goal }) {
  const mur = new Set(walls.map((w) => `${w.x},${w.y}`));
  let { x, y, dir } = start;
  for (const i of prog) {
    if (i === "A") {
      const [dx, dy] = DIRS[dir];
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= grid || ny >= grid) throw new Error(`sort de la grille en (${nx},${ny})`);
      if (mur.has(`${nx},${ny}`)) throw new Error(`fonce dans un mur en (${nx},${ny})`);
      x = nx; y = ny;
    } else dir = ORDRE[(ORDRE.indexOf(dir) + (i === "D" ? 1 : 3)) % 4];
  }
  if (x !== goal.x || y !== goal.y) throw new Error(`termine en (${x},${y}) au lieu de (${goal.x},${goal.y})`);
  return true;
}

/** Le couloir du Défi 2 : exactement le chemin de la solution, rien d'autre. */
const MOTIF_2 = ["A", "A", "D", "A", "A", "G"];
const PROG_2 = [...Array.from({ length: 2 }, () => MOTIF_2).flat(), "A", "A"];
const GRID_2 = 7;
const WALLS_2 = (() => {
  let x = 0, y = 0, dir = "E";
  const libres = new Set(["0,0"]);
  for (const i of PROG_2) {
    if (i === "A") { const [dx, dy] = DIRS[dir]; x += dx; y += dy; libres.add(`${x},${y}`); }
    else dir = ORDRE[(ORDRE.indexOf(dir) + (i === "D" ? 1 : 3)) % 4];
  }
  const w = [];
  for (let j = 0; j < GRID_2; j++) for (let i = 0; i < GRID_2; i++) if (!libres.has(`${i},${j}`)) w.push({ x: i, y: j });
  return { walls: w, but: { x, y } };
})();

simuler(PROG_2, { walls: WALLS_2.walls, grid: GRID_2, start: { x: 0, y: 0, dir: "E" }, goal: WALLS_2.but });
console.log(`✓ Défi 2 vérifié : motif de ${MOTIF_2.length} × 2 + 2 pas → but (${WALLS_2.but.x},${WALLS_2.but.y}), ${2 + MOTIF_2.length + 2} blocs sur 11 autorisés`);

// ── Les nouveaux contenus ──────────────────────────────────────────────────

const BLOC_0 = {
  html: `
  <div style="background:#0f172a;border-radius:12px;padding:18px 22px">
    <h2 style="color:#f97316;margin:0 0 10px">🔁 Kirikou descend un escalier</h2>
    <p style="color:#94a3b8;margin:0 0 12px">Tu sais déjà faire ça :</p>
    <pre style="background:#020617;color:#FDB813;padding:10px 14px;border-radius:8px;margin:0 0 12px">Répéter 6 fois : Avancer</pre>
    <p style="color:#94a3b8;margin:0 0 12px">…et Kirikou traverse un couloir tout droit.</p>
    <p style="color:#94a3b8;margin:0 0 8px">Mais regarde <strong style="color:#e2e8f0">ce</strong> chemin :</p>
    <p style="font-size:24px;letter-spacing:6px;margin:0 0 12px">➡️⬇️➡️⬇️➡️⬇️➡️⬇️➡️⬇️➡️⬇️</p>
    <p style="color:#94a3b8;margin:0 0 12px">Il se répète, lui aussi. Mais ce n'est pas « Avancer » qui revient — c'est <strong style="color:#e2e8f0">avancer PUIS descendre</strong>, six fois de suite.</p>
    <p style="color:#f97316;font-weight:bold;margin:0">🎯 Aujourd'hui tu apprends à repérer le motif — le morceau qui revient — même quand il fait plusieurs instructions.</p>
  </div>`,
};

const BLOC_5 = (ancien) => ({
  ...ancien,
  title: "Défi 1 — L'escalier",
  instructions: "Kirikou doit rejoindre le coin en bas à droite. Repère le morceau qui revient, compte-le, et pose ta boucle.",
  steps: [
    "Trace le chemin du doigt, d'un bout à l'autre",
    "Cherche le morceau qui revient à l'identique",
    "Compte combien de fois il revient — c'est ton nombre de tours",
  ],
});

const BLOC_8 = {
  game_type: "pattern_build",
  title: "Construis la boucle — et vois ce qui reste",
  description: "Délimite le morceau qui revient, puis règle toi-même le nombre de tours.",
  instructions: [
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Avancer",
  ],
  motif_start: 0,
  motif_end: 3,
  explanation: "Les deux derniers « Avancer » ne rentrent dans aucun tour : ils s'écrivent après la boucle.",
};

const BLOC_9 = {
  game_type: "maze",
  title: "Défi 2 — La grande marche",
  instructions: "Un autre escalier — mais ses marches ne font pas la même taille que tout à l'heure. Et la fin ne rentre pas dans la boucle.",
  steps: [
    "Attention : ce motif n'est pas celui du défi précédent",
    "Compte les tours avant de lancer",
    "Regarde bien la fin du chemin — tout ne se répète pas",
  ],
  grid_size: GRID_2,
  start: { x: 0, y: 0, dir: "E" },
  goal: WALLS_2.but,
  walls: WALLS_2.walls,
  max_blocks: 11,
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
};

const BLOC_11 = {
  game_type: "music",
  title: "Le motif de la mélodie",
  instructions: "Joue « Do Mi Sol » 2 fois, puis un « La » tout seul pour finir. Le La ne rentre pas dans la boucle.",
  target_notes: ["Do", "Mi", "Sol", "Do", "Mi", "Sol", "La"],
  max_blocks: 6,
  tempo: 500,
  available_blocks: ["music_play_note", "controls_repeat_ext"],
};

const BLOC_12_Q1 = {
  question: "Un programme répète « Avancer, Tourner à droite » et exécute 12 instructions en tout. Combien de tours fait la boucle ?",
  choices: ["6", "12", "2", "24"],
  answer: 0,
  explanation: "Le motif fait 2 instructions. 12 ÷ 2 = 6 tours. C'est le calcul que tu feras devant chaque escalier.",
};

const TAMBOUR = {
  game_type: "pattern_build",
  title: "Le rythme du tambour",
  description: "Boum, Tac… construis la boucle, et regarde ce qui reste à la fin.",
  instructions: ["Boum", "Tac", "Boum", "Tac", "Boum", "Tac", "Tac"],
  motif_start: 0,
  motif_end: 1,
  explanation: "Boum-Tac trois fois, puis un Tac tout seul. Un rythme se construit exactement comme un programme.",
};

const ENTR3_TEXTE = {
  html: "<p>🤖 <strong>Kodi te parle</strong></p><p>Assez lu de programmes : construis le tien.</p><p>Un escalier t'attend. À toi de trouver le morceau qui revient, et de compter les tours.</p><p>⚠️ Le bloc 🔁 Répéter compte pour deux — il arrive avec son nombre.</p>",
};

// ── Application ────────────────────────────────────────────────────────────

const lecons = await req(() => db.from("lessons").select("id,title").eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} » — attendu 1`);
const lessonId = lecons[0].id;

const blocs = await req(() => db.from("lesson_blocks").select("id,order_index,type,content").eq("lesson_id", lessonId).order("order_index"));
const ents = await req(() => db.from("trainings").select("id,title,order_index").eq("lesson_id", lessonId).order("order_index"));

/** Vérifie qu'un bloc est bien celui qu'on croit avant de le remplacer. */
function bloc(i, attendu) {
  const b = blocs.find((x) => x.order_index === i);
  if (!b) throw new Error(`bloc ${i} introuvable`);
  if (b.type !== attendu.type) throw new Error(`bloc ${i} : type ${b.type}, attendu ${attendu.type}`);
  if (attendu.jeu && b.content?.game_type !== attendu.jeu) throw new Error(`bloc ${i} : jeu ${b.content?.game_type}, attendu ${attendu.jeu}`);
  return b;
}

const b0  = bloc(0,  { type: "text" });
const b5  = bloc(5,  { type: "game", jeu: "maze" });
const b8  = bloc(8,  { type: "game", jeu: "pattern_select" });
const b9  = bloc(9,  { type: "game", jeu: "maze" });
const b11 = bloc(11, { type: "game", jeu: "pattern_select" });
const b12 = bloc(12, { type: "quiz" });

const entr1 = ents.find((e) => e.order_index === 1);
const entr3 = ents.find((e) => e.order_index === 3);
if (!entr1 || !entr3) throw new Error("entraînements 1 et 3 introuvables");

const tb1 = await req(() => db.from("training_blocks").select("id,order_index,type,content").eq("training_id", entr1.id).order("order_index"));
const tb3 = await req(() => db.from("training_blocks").select("id,order_index,type,content").eq("training_id", entr3.id).order("order_index"));

const blocTambour = tb1.find((b) => b.content?.title === "Le rythme du tambour");
if (!blocTambour) throw new Error("bloc « Le rythme du tambour » introuvable dans l'entraînement 1");
const blocTexte3 = tb3.find((b) => b.type === "text");
const blocMaze3 = tb3.find((b) => b.content?.game_type === "maze");
if (!blocTexte3 || !blocMaze3) throw new Error("entraînement 3 : texte ou labyrinthe introuvable");

const nouveauQuiz = { ...b12.content, questions: [BLOC_12_Q1, ...b12.content.questions.slice(1)] };

const maze3 = {
  ...blocMaze3.content,
  instructions: "À toi. Repère le morceau qui revient, compte les tours, et pose la boucle.",
  steps: ["Trace le chemin du doigt", "Cherche le morceau qui revient", "Compte les tours avant de lancer"],
};

const ecritures = [
  ["lesson_blocks", b0.id,  { content: BLOC_0 },            "bloc 0  — six répétitions dans la bande de flèches"],
  ["lesson_blocks", b5.id,  { content: BLOC_5(b5.content) }, "bloc 5  — Défi 1 sans le motif ni le compte"],
  ["lesson_blocks", b8.id,  { content: BLOC_8 },            "bloc 8  — pattern_select → pattern_build"],
  ["lesson_blocks", b9.id,  { content: BLOC_9 },            "bloc 9  — Défi 2 : nouveau motif de 6, nouvelle géométrie"],
  ["lesson_blocks", b11.id, { content: BLOC_11 },           "bloc 11 — pattern_select → music"],
  ["lesson_blocks", b12.id, { content: nouveauQuiz },       "bloc 12 — Q1 remplacée (déduire N)"],
  ["training_blocks", blocTambour.id, { content: TAMBOUR }, "entr. 1 — tambour → pattern_build"],
  ["training_blocks", blocTexte3.id,  { content: ENTR3_TEXTE }, "entr. 3 — brief sans le compte"],
  ["training_blocks", blocMaze3.id,   { content: maze3 },   "entr. 3 — consigne sans le motif ni le compte"],
];

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (ajoute --ecrire pour appliquer)"} — ${ecritures.length} bloc(s) :\n`);
for (const [, , , libelle] of ecritures) console.log("  •", libelle);

if (!ECRIRE) {
  console.log("\nRien n'a été écrit.");
  process.exit(0);
}

for (const [table, id, patch, libelle] of ecritures) {
  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) throw new Error(`${libelle} : ${error.message}`);
  console.log("  ✓", libelle);
}

// Les entraînements ont un titre qui promettait « surligner » : il construit maintenant.
const { error: eTitre } = await db.from("trainings")
  .update({ description: "Dans un programme, puis dans un rythme — repérer le motif, puis construire la boucle." })
  .eq("id", entr1.id);
if (eTitre) throw new Error(`description entraînement 1 : ${eTitre.message}`);
console.log("  ✓ entr. 1 — description mise à jour");

console.log("\nTerminé.");
