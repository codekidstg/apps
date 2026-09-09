/**
 * Séance 2 Explorateur — « Mon premier algorithme ». Vidéo et labyrinthes.
 *
 *     node scripts/explorateur-s2.mjs           aperçu seul
 *     node scripts/explorateur-s2.mjs --ecrire  applique
 *
 * Les trois labyrinthes de la séance étaient le même puzzle trois fois : un
 * couloir droit de 4 pas, un de 5, puis un de 5 avec des embranchements
 * décoratifs qu'on ne peut pas emprunter — le seul bloc disponible étant
 * « Avancer ». L'enfant appuyait sur le même bouton trois fois de suite.
 *
 * La restriction à un seul verbe est volontaire et reste : S2 enseigne qu'un
 * algorithme est une suite ordonnée et précise, et les virages appartiennent à
 * S3. Mais quand on n'a qu'un verbe, trois labyrinthes c'est deux de trop.
 *
 * On en garde un tel quel, et les deux autres reçoivent chacun une vraie
 * question :
 *   · « La récolte »  — un second verbe, 🧲 Ramasser, qui ne mord pas sur S3.
 *   · « Le piège »    — l'étoile n'est plus au bout du couloir : dépasser fait
 *                        échouer. Le compte devient la difficulté.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Mon premier algorithme";

const D = "#0f172a";
/** Un couloir horizontal : tout le reste de la grille devient mur. */
function couloir(taille, ligne, deX, aX) {
  const out = [];
  for (let y = 0; y < taille; y++)
    for (let x = 0; x < taille; x++)
      if (y !== ligne || x < deX || x > aX) out.push({ x, y });
  return out;
}

// ── Les remplacements, bloc par bloc ────────────────────────────────────────
const REMPLACEMENTS = [
  {
    ordre: 1,
    quoi: "la vidéo devient un vrai bloc video, avec la nouvelle URL",
    type: "video",
    content: {
      url: "https://www.youtube.com/watch?v=tbmKIErjnns",
      title: "Qu'est-ce qu'un algorithme ?",
    },
  },
  {
    ordre: 10,
    quoi: "texte — introduit la récolte au lieu d'« un couloir plus long »",
    type: "text",
    content: { html: `
      <div style="background:${D};border-radius:12px;padding:18px 22px">
        <h2 style="color:#f59e0b;margin:0 0 10px">💎 Kirikou a une deuxième mission</h2>
        <p style="color:#94a3b8;margin:0 0 12px">Le couloir suivant contient <strong style="color:#e2e8f0">deux gemmes</strong>. Kirikou doit toutes les récupérer avant d'atteindre l'étoile.</p>
        <p style="color:#94a3b8;margin:0 0 12px">Attention : <strong style="color:#e2e8f0">il ne les ramasse pas tout seul en passant dessus</strong>. Il faut lui dire de le faire, avec le bloc 🧲 <strong style="color:#e2e8f0">Ramasser</strong>.</p>
        <pre style="background:#020617;color:#FDB813;padding:12px 14px;border-radius:8px;margin:0 0 12px">Avancer
Avancer
Ramasser     ← seulement s'il est bien SUR la gemme</pre>
        <div style="background:#020617;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:0 8px 8px 0">
          <p style="color:#fcd34d;margin:0">Un « Ramasser » posé une case trop tôt ne ramasse rien du tout. C'est là que compter devient vraiment utile.</p>
        </div>
      </div>` },
  },
  {
    ordre: 11,
    quoi: "labyrinthe 2 — « La récolte » remplace « Le grand couloir »",
    type: "game",
    content: {
      game_type: "maze",
      title: "Niveau 2 — La récolte 💎",
      grid_size: 7,
      start: { x: 0, y: 3, dir: "E" },
      goal: { x: 6, y: 3 },
      walls: couloir(7, 3, 0, 6),
      collectibles: [{ x: 2, y: 3, type: "gem" }, { x: 4, y: 3, type: "gem" }],
      max_blocks: 9,
      instructions: "Deux gemmes à récupérer avant l'étoile. Kirikou ne ramasse rien en passant : pose un bloc 🧲 Ramasser sur chaque gemme.",
      steps: ["Compte les cases jusqu'à la première gemme", "Pose 🧲 Ramasser quand Kirikou est dessus",
              "Recommence pour la seconde, puis termine jusqu'à l'étoile"],
      available_blocks: ["robot_move", "robot_pick"],
    },
  },
  {
    ordre: 12,
    quoi: "texte — annonce le vrai piège : s'arrêter au bon endroit",
    type: "text",
    content: { html: `
      <div style="background:${D};border-radius:12px;padding:18px 22px">
        <h2 style="color:#ef4444;margin:0 0 10px">🏆 Défi bonus — Le piège du compteur</h2>
        <p style="color:#94a3b8;margin:0 0 12px">Jusqu'ici, l'étoile était toujours <strong style="color:#e2e8f0">au bout du couloir</strong>. Tu pouvais avancer jusqu'au mur sans réfléchir.</p>
        <p style="color:#94a3b8;margin:0 0 12px">Cette fois, <strong style="color:#e2e8f0">le couloir continue après l'étoile</strong>. Si Kirikou avance une fois de trop, il la dépasse — et il a perdu.</p>
        <div style="background:#020617;border-left:4px solid #ef4444;padding:12px 16px;border-radius:0 8px 8px 0">
          <p style="color:#fca5a5;margin:0">🕵️ Regarde la grille et <strong>compte les cases avant de poser le premier bloc</strong>. Un algorithme précis, c'est un algorithme qui s'arrête au bon endroit — pas seulement qui part dans la bonne direction.</p>
        </div>
      </div>` },
  },
  {
    ordre: 13,
    quoi: "labyrinthe 3 — « Le piège du compteur » remplace un couloir décoratif",
    type: "game",
    content: {
      game_type: "maze",
      title: "Niveau 3 — Le piège du compteur 🌟",
      grid_size: 7,
      start: { x: 0, y: 3, dir: "E" },
      goal: { x: 4, y: 3 },
      walls: couloir(7, 3, 0, 6),
      collectibles: [{ x: 2, y: 3, type: "gem" }],
      max_blocks: 6,
      instructions: "L'étoile n'est PAS au bout du couloir. Ramasse la gemme, puis arrête-toi exactement dessus.",
      steps: ["Compte : combien de cases jusqu'à la gemme ?", "Ramasse-la",
              "Combien de cases encore jusqu'à l'étoile ? Pas une de plus !"],
      available_blocks: ["robot_move", "robot_pick"],
    },
  },
];

// ── Contrôle ────────────────────────────────────────────────────────────────
function verifier(c) {
  const mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const ennuis = [];
  if (mur.has(`${c.start.x},${c.start.y}`)) ennuis.push("départ dans un mur");
  if (mur.has(`${c.goal.x},${c.goal.y}`)) ennuis.push("arrivée dans un mur");
  for (const o of c.collectibles ?? [])
    if (mur.has(`${o.x},${o.y}`)) ennuis.push(`objet (${o.x},${o.y}) dans un mur`);

  const file = [[c.start.x, c.start.y]], vus = new Set([`${c.start.x},${c.start.y}`]);
  let atteint = false;
  while (file.length) {
    const [x, y] = file.shift();
    if (x === c.goal.x && y === c.goal.y) atteint = true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= c.grid_size || ny >= c.grid_size || mur.has(k) || vus.has(k)) continue;
      vus.add(k); file.push([nx, ny]);
    }
  }
  if (!atteint) ennuis.push("aucun chemin vers l'arrivée");
  for (const o of c.collectibles ?? [])
    if (!vus.has(`${o.x},${o.y}`)) ennuis.push(`objet (${o.x},${o.y}) inaccessible`);
  return ennuis;
}


/**
 * Simule le robot avec les mêmes règles que BlocklyRobot : on avance, on
 * ramasse, on échoue si l'on sort de la grille ou si l'on heurte un mur — et,
 * depuis cette version, arriver ne suffit plus s'il reste un objet au sol.
 *
 * Sert à prouver deux choses sur chaque labyrinthe : le programme attendu
 * réussit, et le programme naïf — avancer sans jamais ramasser — échoue.
 */
function simuler(c, programme) {
  const mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  const DROITE = { N: "E", E: "S", S: "W", W: "N" };
  const GAUCHE = { N: "W", W: "S", S: "E", E: "N" };
  let { x, y, dir } = c.start;
  const ramasses = new Set();

  for (const cmd of programme) {
    if (cmd === "droite") { dir = DROITE[dir]; continue; }
    if (cmd === "gauche") { dir = GAUCHE[dir]; continue; }
    if (cmd === "ramasser") {
      for (const o of c.collectibles ?? [])
        if (o.x === x && o.y === y) ramasses.add(`${o.x},${o.y}`);
      continue;
    }
    const [dx, dy] = DELTA[dir];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= c.grid_size || ny >= c.grid_size) return { ok: false, pourquoi: "sort de la grille" };
    if (mur.has(`${nx},${ny}`)) return { ok: false, pourquoi: "heurte un mur" };
    x = nx; y = ny;
  }

  if (x !== c.goal.x || y !== c.goal.y) return { ok: false, pourquoi: `s'arrête en (${x},${y}) au lieu de (${c.goal.x},${c.goal.y})` };
  const oublies = (c.collectibles ?? []).filter((o) => !ramasses.has(`${o.x},${o.y}`));
  if (oublies.length) return { ok: false, pourquoi: `${oublies.length} objet(s) laissé(s) au sol` };
  return { ok: true };
}

const A = (n) => Array(n).fill("avancer");

/** Pour chaque labyrinthe : le programme attendu, et un programme naïf à rejeter. */
const EPREUVES = {
  "Niveau 2 — La récolte 💎": {
    attendu: [...A(2), "ramasser", ...A(2), "ramasser", ...A(2)],
    naif: A(6),
    naifPourquoi: "avancer jusqu'à l'étoile sans jamais ramasser",
  },
  "Niveau 3 — Le piège du compteur 🌟": {
    attendu: [...A(2), "ramasser", ...A(2)],
    naif: A(6),
    naifPourquoi: "avancer jusqu'au bout du couloir",
  },
};

console.log(`SÉANCE 2 — « ${LECON} »\n`);
let souci = 0;
for (const r of REMPLACEMENTS) {
  console.log(`  [${String(r.ordre).padStart(2)}] ${r.type.padEnd(5)} ${r.quoi}`);
  const c = r.content;
  if (!c.grid_size) continue;
  const ennuis = verifier(c);
  const G = c.grid_size, mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const gem = new Set((c.collectibles ?? []).map((o) => `${o.x},${o.y}`));
  for (let y = 0; y < G; y++) {
    let ligne = "        ";
    for (let x = 0; x < G; x++) {
      const k = `${x},${y}`;
      ligne += x === c.start.x && y === c.start.y ? "K " : k === `${c.goal.x},${c.goal.y}` ? "⭐"
        : gem.has(k) ? "💎" : mur.has(k) ? "██" : ". ";
    }
    console.log(ligne);
  }
  if (ennuis.length) { console.log(`        ✗ ${ennuis.join(" · ")}`); souci++; }
  else console.log(`        ✓ franchissable · max ${c.max_blocks} blocs · blocs : ${c.available_blocks.join(", ")}`);

  const ep = EPREUVES[c.title];
  if (ep) {
    const bon = simuler(c, ep.attendu);
    const mauvais = simuler(c, ep.naif);
    console.log(`        ${bon.ok ? "✓" : "✗"} le programme attendu (${ep.attendu.length} blocs) ${bon.ok ? "réussit" : "ÉCHOUE : " + bon.pourquoi}`);
    console.log(`        ${!mauvais.ok ? "✓" : "✗"} ${ep.naifPourquoi} ${!mauvais.ok ? "est refusé — " + mauvais.pourquoi : "RÉUSSIT alors qu'il ne devrait pas"}`);
    if (!bon.ok || mauvais.ok) souci++;
  }
}

if (souci) { console.error(`\n${souci} labyrinthe(s) en défaut — rien n'a été écrit.`); process.exit(1); }
if (!ECRIRE) { console.log("\n(aperçu seul — relancer avec --ecrire)"); process.exit(0); }

// ── Écriture ────────────────────────────────────────────────────────────────
const { data: lecon, error: eL } = await db.from("lessons").select("id, theme_id").eq("title", LECON).single();
if (eL || !lecon) { console.error("Leçon introuvable :", eL?.message); process.exit(1); }
const { data: blocs } = await db.from("lesson_blocks")
  .select("id, order_index").eq("lesson_id", lecon.id).order("order_index");

console.log("\nApplication…");
for (const r of REMPLACEMENTS) {
  const cible = blocs.find((b) => b.order_index === r.ordre);
  if (!cible) { console.error(`  ✗ aucun bloc à l'index ${r.ordre}`); process.exit(1); }
  const { error } = await db.from("lesson_blocks")
    .update({ type: r.type, content: r.content }).eq("id", cible.id);
  if (error) { console.error(`  ✗ [${r.ordre}] ${error.message}`); process.exit(1); }
  console.log(`  ✓ [${r.ordre}] ${r.quoi}`);
}
console.log("\nTerminé.");
