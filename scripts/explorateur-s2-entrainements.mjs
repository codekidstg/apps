/**
 * Séance 2 Explorateur — « Mon premier algorithme » : les entraînements, et
 * les deux endroits de la leçon qui mentaient encore.
 *
 *     node scripts/explorateur-s2-entrainements.mjs           aperçu seul
 *     node scripts/explorateur-s2-entrainements.mjs --ecrire  applique
 *
 * ── Ce qui existait ────────────────────────────────────────────────────────
 * Cinq entraînements, tous des quiz : 22 questions à choix multiples qui
 * s'ajoutaient aux 14 de la leçon. Trente-six QCM pour une séance, et la
 * seule séance rédigée du niveau sans un seul geste à faire.
 *
 * Pire, ils avaient été écrits avant que S3 et S5 existent, et enseignaient
 * leurs notions à l'avance : « une boucle permet de… » dans le tout premier
 * entraînement, « si le robot tourne deux fois à gauche… » dans le dernier,
 * des coordonnées (0,2) jamais introduites, et une notation en flèches
 * ↑ → ← que l'enfant n'a nulle part ailleurs. Le quatrième s'appelait
 * « Labyrinthe express », promettait « un nouveau labyrinthe à résoudre »,
 * et donnait trois QCM.
 *
 * ── Ce qui les remplace ────────────────────────────────────────────────────
 * Quatre entraînements, quatre mécaniques, aucun quiz. Le vocabulaire reste
 * celui de S2 — Avancer, Ramasser, compter — et rien d'autre :
 *
 *   30 XP  sort         l'ordre : une suite d'actions à remettre d'aplomb
 *   35 XP  drag_to_bin  la précision, en trois familles au lieu de deux
 *   40 XP  fill_blank   le compte exact, y compris l'arrêt avant le bout
 *   45 XP  maze         le vrai labyrinthe, seul, avec les deux pièges
 *
 * Le labyrinthe final est un couloir droit, comme les trois de la leçon —
 * la palette de S2 n'autorise rien d'autre, les virages appartiennent à S3.
 * Mais il est le seul à cumuler les deux difficultés de la séance : deux
 * gemmes à ramasser au bon moment, et une étoile qui n'est pas au bout.
 *
 * ── Et deux corrections dans la leçon ──────────────────────────────────────
 * Le bloc 6 annonçait « Kirikou comprend exactement 3 instructions :
 * Avancer, Tourner à gauche, Tourner à droite » — or aucun labyrinthe de S2
 * ne donne les virages, et celui qu'il faut vraiment, Ramasser, n'était pas
 * cité. Le bloc 15 félicitait l'enfant d'avoir « guidé un robot avec Avancer,
 * Tourner à gauche et Tourner à droite », puis annonçait « la Séance 2 »
 * alors qu'on y est déjà.
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
const html = (s) => ({ html: s });
const jeu = (game_type, content) => ({ type: "blockly_challenge", content: { game_type, ...content } });

/** Un couloir horizontal : tout le reste de la grille devient mur. */
function couloir(taille, ligne, deX, aX) {
  const out = [];
  for (let y = 0; y < taille; y++)
    for (let x = 0; x < taille; x++)
      if (y !== ligne || x < deX || x > aX) out.push({ x, y });
  return out;
}

// ══ La leçon : deux blocs à reprendre ═══════════════════════════════════════

const CORRECTIONS_LECON = [
  {
    ordre: 6,
    quoi: "les instructions de Kirikou : deux, pas trois — et Ramasser en fait partie",
    type: "text",
    content: html(`
      <div style="background:${D};border-radius:12px;padding:18px 22px">
        <h2 style="color:#3b82f6;margin:0 0 10px">🤖 Le robot obéit… à la lettre !</h2>
        <p style="color:#94a3b8;margin:0 0 12px">Dans cette séance, tu vas programmer un robot qui s'appelle <strong style="color:#e2e8f0">Kirikou</strong>. Il est coincé dans un labyrinthe et compte sur toi pour rejoindre l'étoile ⭐.</p>
        <p style="color:#94a3b8;margin:0 0 12px">Aujourd'hui, Kirikou ne comprend que <strong style="color:#e2e8f0">deux instructions</strong> :</p>
        <pre style="background:#020617;color:#FDB813;padding:12px 14px;border-radius:8px;margin:0 0 12px">🚀 Avancer      il avance d'une case, droit devant lui
🧲 Ramasser     il prend l'objet posé sur SA case</pre>
        <p style="color:#94a3b8;margin:0 0 12px">C'est tout. Il ne sait pas encore tourner — <strong style="color:#e2e8f0">ça viendra à la prochaine séance</strong>. Ici les couloirs sont droits, et deux choses seulement comptent : <strong style="color:#e2e8f0">combien de fois</strong> tu lui dis d'avancer, et <strong style="color:#e2e8f0">à quel moment</strong> tu lui dis de ramasser.</p>
        <div style="background:#020617;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0">
          <p style="color:#93c5fd;margin:0">⚠️ Kirikou ne devine rien. Il ne ramasse pas une gemme en passant dessus, il ne s'arrête pas tout seul sur l'étoile, et il ne traverse pas les murs. Il fait <strong>exactement</strong> ce que tu écris — pas plus, pas moins.</p>
        </div>
      </div>`),
  },
  {
    ordre: 15,
    quoi: "le bilan : ce qu'on a vraiment fait, et la vraie séance suivante",
    type: "text",
    content: html(`
      <div style="background:${D};border-radius:12px;padding:18px 22px">
        <h2 style="color:#10b981;margin:0 0 10px">🏆 Mission accomplie, Architecte !</h2>
        <p style="color:#94a3b8;margin:0 0 12px">Décomposer un problème en petites étapes claires, une par une, et les écrire dans le bon ordre : c'est exactement ce que font les développeurs tous les jours. Et toi, tu viens de le faire — avec un vrai robot et de vraies instructions.</p>
        <div style="background:#020617;border-radius:8px;padding:14px 18px;margin:0 0 12px">
          <p style="color:#e2e8f0;margin:0 0 8px"><strong>📚 Ce que tu as appris aujourd'hui</strong></p>
          <p style="color:#94a3b8;margin:0;line-height:1.9">✓ Un algorithme est une suite d'instructions <strong style="color:#e2e8f0">précises et ordonnées</strong><br/>
          ✓ Un robot fait exactement ce qu'on lui dit — il ne devine jamais<br/>
          ✓ <strong style="color:#e2e8f0">Compter les cases</strong> avant d'écrire : un bloc Avancer = une case<br/>
          ✓ Poser 🧲 Ramasser au bon moment, quand Kirikou est <em>sur</em> l'objet<br/>
          ✓ S'arrêter au bon endroit — même quand le couloir continue</p>
        </div>
        <div style="background:#020617;border-left:4px solid #a78bfa;padding:12px 16px;border-radius:0 8px 8px 0;margin:0 0 12px">
          <p style="color:#c4b5fd;margin:0 0 6px"><strong>🔭 La prochaine fois — « Gauche ou droite ? »</strong></p>
          <p style="color:#94a3b8;margin:0">Les couloirs vont arrêter d'être droits. Kirikou apprendra à <strong style="color:#e2e8f0">tourner</strong>, et tu découvriras le piège que tous les débutants rencontrent : tourner ne le fait pas avancer d'une seule case.</p>
        </div>
        <p style="color:#94a3b8;margin:0">🏅 Avant ça, fais tes <strong style="color:#e2e8f0">quatre entraînements</strong> : l'ordre, la précision, le compte, et un dernier labyrinthe où tu seras seul aux commandes.</p>
      </div>`),
  },
];

// ══ Les quatre entraînements ════════════════════════════════════════════════

// ── 1 · 30 XP — l'ordre ─────────────────────────────────────────────────────
const ordre = {
  titre: "Remets l'algorithme dans l'ordre",
  description: "Six actions mélangées. Dans un algorithme, l'ordre change tout.",
  xp: 30,
  blocs: [
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0 0 10px">🤖 <strong style="color:#e2e8f0">Kodi te parle</strong></p>
      <p style="color:#94a3b8;margin:0 0 10px">Un algorithme, ce n'est pas seulement <em>les bonnes actions</em> : c'est les bonnes actions <strong style="color:#e2e8f0">dans le bon ordre</strong>.</p>
      <p style="color:#94a3b8;margin:0">Kirikou veut manger une mangue, tranquillement assis à la maison. Ses six actions se sont mélangées — remets-les d'aplomb avec les flèches ▲ ▼.</p>`) },
    jeu("sort", {
      title: "La mangue de Kirikou",
      description: "But : Kirikou finit assis chez lui, la mangue mangée et la peau à la poubelle.",
      items: [
        "Aller au manguier",
        "Cueillir la mangue",
        "Rentrer à la maison",
        "Éplucher la mangue",
        "Manger la mangue",
        "Jeter la peau",
      ],
      hint: "Demande-toi à chaque fois : est-ce que Kirikou PEUT faire cette action maintenant ? On ne cueille pas une mangue sans être devant l'arbre, et on ne mange pas une mangue encore dans sa peau.",
    }),
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0 0 10px">😅 <strong style="color:#e2e8f0">Et si on mélangeait ?</strong></p>
      <pre style="background:#020617;color:#f87171;padding:12px 14px;border-radius:8px;margin:0 0 10px">Jeter la peau
Manger la mangue
Éplucher la mangue
Cueillir la mangue</pre>
      <p style="color:#94a3b8;margin:0">Les quatre actions sont pourtant les bonnes. Mais dans cet ordre-là, Kirikou jette une peau qu'il n'a pas, puis mange une mangue qui est encore sur l'arbre. <strong style="color:#e2e8f0">Changer l'ordre, c'est changer le résultat</strong> — et c'est vrai pour un programme comme pour une mangue.</p>`) },
  ],
};

// ── 2 · 35 XP — la précision ────────────────────────────────────────────────
const precision = {
  titre: "Assez précis pour un robot ?",
  description: "Six consignes à trier : exécutables, incomplètes, ou trop vagues.",
  xp: 35,
  blocs: [
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0 0 10px">🤖 <strong style="color:#e2e8f0">Kodi te parle</strong></p>
      <p style="color:#94a3b8;margin:0 0 10px">Tu te souviens du robot qui renverse un seau d'eau parce qu'on lui a dit « va chercher de l'eau » ? Une consigne peut rater de <strong style="color:#e2e8f0">deux façons différentes</strong>, et c'est utile de savoir laquelle.</p>
      <p style="color:#94a3b8;margin:0 0 8px">🤖 <strong style="color:#10b981">C'est clair</strong> — Kirikou sait quoi faire, et combien de fois.</p>
      <p style="color:#94a3b8;margin:0 0 8px">🔢 <strong style="color:#f59e0b">Combien ?</strong> — le verbe est bon, mais le nombre manque : « Avance », d'accord… mais de combien de cases ?</p>
      <p style="color:#94a3b8;margin:0">❓ <strong style="color:#ef4444">Trop vague</strong> — l'action elle-même n'existe pas pour lui : il ne connaît qu'avancer et ramasser, rien d'autre.</p>`) },
    { type: "drag_to_bin", content: {
      title: "Range chaque consigne dans sa famille",
      // Trois colonnes sur un écran de téléphone : les intitulés doivent tenir
      // en deux lignes courtes, l'explication est déjà dans le texte au-dessus.
      bins: [
        { id: "precis", label: "C'est clair", emoji: "🤖", color: "#10b981" },
        { id: "nombre", label: "Combien ?",  emoji: "🔢", color: "#f59e0b" },
        { id: "vague",  label: "Trop vague", emoji: "❓", color: "#ef4444" },
      ],
      items: [
        { id: "trois-puis-gemme", emoji: "💬", label: "Avance de 3 cases, puis ramasse la gemme", correct: "precis",
          hint: "Le nombre est écrit, et « ramasser » agit sur la case où Kirikou se trouve déjà. Il n'a rien à deviner : il peut exécuter." },
        { id: "sous-les-pieds", emoji: "💬", label: "Ramasse la gemme sur laquelle tu te trouves", correct: "precis",
          hint: "Une action, une case — celle où il est. C'est exactement ce que fait le bloc 🧲 Ramasser." },
        { id: "avance-seul", emoji: "💬", label: "Avance", correct: "nombre",
          hint: "Le bon verbe, mais avancer de combien ? Un bloc Avancer fait une seule case : si tu en veux quatre, il faut l'écrire quatre fois." },
        { id: "jusqu-a-la-gemme", emoji: "💬", label: "Avance jusqu'à la gemme", correct: "nombre",
          hint: "Piège : Kirikou ne voit pas la gemme, il ne sait pas s'arrêter dessus tout seul. C'est à toi de compter les cases et de lui donner le nombre." },
        { id: "va-chercher", emoji: "💬", label: "Va chercher l'étoile", correct: "vague",
          hint: "« Aller chercher » n'existe pas dans la tête de Kirikou. Il ne connaît que deux gestes : avancer d'une case, et ramasser." },
        { id: "debrouille", emoji: "💬", label: "Débrouille-toi pour arriver", correct: "vague",
          hint: "Un robot ne se débrouille jamais. C'est toi qui décides de chaque case, une par une — c'est ça, écrire un algorithme." },
      ],
    } },
  ],
};

// ── 3 · 40 XP — le compte ───────────────────────────────────────────────────
const compte = {
  titre: "Le compte juste",
  description: "Cinq situations où tout se joue sur un nombre.",
  xp: 40,
  blocs: [
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0 0 10px">🤖 <strong style="color:#e2e8f0">Kodi te parle</strong></p>
      <p style="color:#94a3b8;margin:0 0 10px">Dans la séance, tu as vu que Kirikou ne s'arrête pas tout seul et ne ramasse pas tout seul. Tout repose donc sur <strong style="color:#e2e8f0">un nombre</strong> : combien de blocs, et à quelle place.</p>
      <p style="color:#94a3b8;margin:0">Compte sur tes doigts avant de répondre — c'est exactement ce que font les programmeurs.</p>`) },
    { type: "fill_blank", content: {
      title: "Cinq comptes à régler",
      sentences: [
        { id: "c1", before: "L'étoile est à 5 cases de Kirikou, tout droit. Pour arriver dessus, il faut", after: "blocs Avancer.",
          options: ["5", "4", "1"], correct: 0,
          explanation: "Un bloc Avancer = une case, toujours. Cinq cases, cinq blocs. Il n'y a pas de raccourci." },
        { id: "c2", before: "L'étoile est à 6 cases, mais tu ne poses que 4 blocs Avancer. Alors Kirikou", after: ".",
          options: ["s'arrête 2 cases avant l'étoile", "continue tout seul jusqu'à l'étoile", "revient au départ"], correct: 0,
          explanation: "Il exécute les 4 instructions, puis il s'arrête. Il ne devine pas qu'il en manque deux — il n'a aucun moyen de le savoir." },
        { id: "c3", before: "Une gemme est posée à 3 cases de Kirikou. Le bloc 🧲 Ramasser doit être placé", after: ".",
          options: ["juste après le 3ᵉ Avancer", "juste après le 2ᵉ Avancer", "tout au début du programme"], correct: 0,
          explanation: "Ramasser agit sur la case où Kirikou se trouve à ce moment-là. Après 3 Avancer, il est sur la gemme : c'est là, et nulle part ailleurs." },
        { id: "c4", before: "L'étoile est à 4 cases, mais le couloir continue jusqu'à 7 cases. Tu poses 7 blocs Avancer :",
          after: ".",
          options: ["Kirikou dépasse l'étoile et rate le niveau", "Kirikou s'arrête sur l'étoile", "Kirikou s'arrête devant le mur, c'est gagné"], correct: 0,
          explanation: "C'est le piège du compteur. Aller jusqu'au mur n'est pas une stratégie : il faut s'arrêter exactement sur l'étoile, donc 4 blocs." },
        { id: "c5", before: "Une gemme à 2 cases, l'étoile à 5 cases, dans le même couloir. Le programme complet fait",
          after: "blocs.",
          options: ["6", "5", "7"], correct: 0,
          explanation: "Deux Avancer pour arriver sur la gemme, un Ramasser, puis trois Avancer pour aller de la case 2 à la case 5. 2 + 1 + 3 = 6." },
      ],
    } },
  ],
};

// ── 4 · 45 XP — le vrai labyrinthe ──────────────────────────────────────────
const LABY = {
  game_type: "maze",
  title: "Le couloir aux deux gemmes",
  grid_size: 8,
  start: { x: 0, y: 3, dir: "E" },
  goal: { x: 5, y: 3 },
  walls: couloir(8, 3, 0, 7),
  collectibles: [{ x: 1, y: 3, type: "gem" }, { x: 4, y: 3, type: "gem" }],
  max_blocks: 8,
  instructions: "Deux gemmes à ramasser, et une étoile qui n'est PAS au bout du couloir. Compte avant de poser le premier bloc.",
  steps: [
    "La première gemme est tout près : combien de cases ?",
    "Ramasse-la, puis compte jusqu'à la seconde",
    "L'étoile est juste après la seconde gemme — pas une case de plus",
  ],
  available_blocks: ["robot_move", "robot_pick"],
  required: true,
};

const labyrinthe = {
  titre: "Le couloir aux deux gemmes",
  description: "Seul aux commandes : deux gemmes à récupérer, et une étoile à ne pas dépasser.",
  xp: 45,
  blocs: [
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0 0 10px">🤖 <strong style="color:#e2e8f0">Kodi te parle</strong></p>
      <p style="color:#94a3b8;margin:0 0 10px">Assez compté sur le papier — à toi de construire le programme en entier, sans que personne te dise combien de blocs poser.</p>
      <p style="color:#94a3b8;margin:0 0 10px">Ce couloir réunit les <strong style="color:#e2e8f0">deux pièges</strong> de la séance : il faut ramasser au bon moment, <em>et</em> s'arrêter au bon endroit.</p>
      <div style="background:#020617;border-left:4px solid #FDB813;padding:12px 16px;border-radius:0 8px 8px 0">
        <p style="color:#FDB813;margin:0">🕵️ Regarde la grille en entier avant de commencer. Où sont les gemmes ? Où est l'étoile ? Et surtout : où s'arrête le couloir ?</p>
      </div>`) },
    jeu("maze", LABY),
    { type: "text", content: html(`
      <p style="color:#94a3b8;margin:0">🏆 <strong style="color:#e2e8f0">Bravo.</strong> Tu viens d'écrire un algorithme complet : les bonnes instructions, dans le bon ordre, le bon nombre de fois. C'est la base de tous les programmes du monde — les jeux vidéo compris.</p>`) },
  ],
};

const ENTRAINEMENTS = [ordre, precision, compte, labyrinthe];

// ══ Contrôles avant écriture ════════════════════════════════════════════════

/** Le labyrinthe tient-il debout : départ, arrivée et objets accessibles ? */
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
  if (!(c.available_blocks ?? []).includes("robot_pick") && (c.collectibles ?? []).length)
    ennuis.push("des objets à ramasser mais pas de bloc Ramasser dans la palette");
  return ennuis;
}

/** Les mêmes règles que BlocklyRobot : arriver ne suffit pas s'il reste un objet. */
function simuler(c, programme) {
  const mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
  let { x, y, dir } = c.start;
  const ramasses = new Set();

  for (const cmd of programme) {
    if (cmd === "ramasser") {
      for (const o of c.collectibles ?? []) if (o.x === x && o.y === y) ramasses.add(`${o.x},${o.y}`);
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

/** Le programme attendu doit passer ; les deux programmes naïfs doivent échouer. */
const EPREUVES = [
  { nom: "le programme attendu (7 blocs)", prog: ["avancer", "ramasser", ...A(3), "ramasser", "avancer"], attendu: true },
  { nom: "avancer jusqu'à l'étoile sans jamais ramasser", prog: A(5), attendu: false },
  { nom: "avancer jusqu'au bout du couloir", prog: [...A(1), "ramasser", ...A(3), "ramasser", ...A(3)], attendu: false },
];

// ══ Aperçu ══════════════════════════════════════════════════════════════════

console.log(`SÉANCE 2 — « ${LECON} »\n`);
console.log("LA LEÇON — 2 blocs repris");
for (const c of CORRECTIONS_LECON) console.log(`  [${String(c.ordre).padStart(2)}] ${c.type.padEnd(6)} ${c.quoi}`);

console.log("\nLES ENTRAÎNEMENTS — 4, en remplacement des 5 quiz");
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const mecas = e.blocs.filter((b) => b.type !== "text").map((b) => b.content.game_type ?? b.type);
  console.log(`  ${i + 1}. ${String(e.xp).padStart(3)} XP  ${e.titre.padEnd(32)} ${e.blocs.length} blocs · ${mecas.join(", ")}`);
}
const mecaniques = new Set(ENTRAINEMENTS.flatMap((e) => e.blocs.filter((b) => b.type !== "text").map((b) => b.content.game_type ?? b.type)));
console.log(`\n  ${mecaniques.size} mécaniques distinctes : ${[...mecaniques].join(", ")}`);
console.log(`  XP : ${ENTRAINEMENTS.map((e) => e.xp).join(" · ")} — total ${ENTRAINEMENTS.reduce((s, e) => s + e.xp, 0)}`);
console.log(`  quiz : ${ENTRAINEMENTS.flatMap((e) => e.blocs).filter((b) => b.type === "quiz").length}`);

console.log("\nCONTRÔLE DU LABYRINTHE");
const ennuis = verifier(LABY);
if (ennuis.length) { console.error("  ✗ " + ennuis.join(" ; ")); process.exit(1); }
console.log("  ✓ grille cohérente, gemmes accessibles, palette complète");
let echec = false;
for (const ep of EPREUVES) {
  const r = simuler(LABY, ep.prog);
  const bon = r.ok === ep.attendu;
  if (!bon) echec = true;
  console.log(`  ${bon ? "✓" : "✗"} ${ep.attendu ? "réussit" : "est refusé"} : ${ep.nom}${r.ok ? "" : ` — ${r.pourquoi}`}`);
}
if (echec) { console.error("\n  Le labyrinthe ne se comporte pas comme annoncé. Rien n'a été écrit."); process.exit(1); }

if (!ECRIRE) {
  console.log("\n(aperçu seul — relancer avec --ecrire pour appliquer)");
  process.exit(0);
}

// ══ Écriture ════════════════════════════════════════════════════════════════

const { data: lecon, error: eL } = await db.from("lessons").select("id").eq("title", LECON).single();
if (eL || !lecon) { console.error("Leçon introuvable :", eL?.message); process.exit(1); }

console.log("\nÉcriture…");

// ── 1 · les deux blocs de la leçon ─────────────────────────────────────────
const { data: blocs, error: eB } = await db.from("lesson_blocks")
  .select("id, order_index, type, content").eq("lesson_id", lecon.id).order("order_index");
if (eB) { console.error("Blocs illisibles :", eB.message); process.exit(1); }

for (const c of CORRECTIONS_LECON) {
  const cible = blocs.find((b) => b.order_index === c.ordre);
  if (!cible) { console.error(`  ✗ bloc ${c.ordre} introuvable`); process.exit(1); }
  if (cible.type !== c.type) { console.error(`  ✗ bloc ${c.ordre} : ${cible.type} au lieu de ${c.type}`); process.exit(1); }
  const { error } = await db.from("lesson_blocks").update({ content: c.content }).eq("id", cible.id);
  if (error) { console.error(`  ✗ bloc ${c.ordre} : ${error.message}`); process.exit(1); }
  console.log(`  ✓ bloc ${String(c.ordre).padStart(2)} — ${c.quoi}`);
}

// ── 2 · le premier labyrinthe n'annonçait pas son type ──────────────────────
const niveau1 = blocs.find((b) => b.order_index === 9);
if (niveau1 && !niveau1.content?.game_type) {
  const { error } = await db.from("lesson_blocks")
    .update({ content: { ...niveau1.content, game_type: "maze" } }).eq("id", niveau1.id);
  if (error) { console.error(`  ✗ bloc 9 : ${error.message}`); process.exit(1); }
  console.log("  ✓ bloc  9 — game_type: \"maze\" ajouté (il reposait sur la valeur par défaut du lecteur)");
}

// ── 3 · les cinq quiz s'en vont ────────────────────────────────────────────
const { data: anciens } = await db.from("trainings").select("id, title").eq("lesson_id", lecon.id);
if (anciens?.length) {
  const ids = anciens.map((t) => t.id);
  const { count, error: eP } = await db.from("training_progress")
    .select("id", { count: "exact", head: true }).in("training_id", ids);
  if (eP) { console.error("  ✗ progressions illisibles :", eP.message); process.exit(1); }
  if ((count ?? 0) > 0) {
    console.error(`  ✗ ${count} progression(s) d'élève sur ces entraînements — suppression annulée.`);
    process.exit(1);
  }
  const { error: e1 } = await db.from("training_blocks").delete().in("training_id", ids);
  if (e1) { console.error("  ✗ blocs :", e1.message); process.exit(1); }
  const { error: e2 } = await db.from("trainings").delete().in("id", ids);
  if (e2) { console.error("  ✗ entraînements :", e2.message); process.exit(1); }
  console.log(`  ✓ ${anciens.length} anciens entraînements supprimés (aucune progression perdue)`);
}

// ── 4 · les quatre nouveaux ────────────────────────────────────────────────
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data: tr, error } = await db.from("trainings").insert({
    lesson_id: lecon.id, title: e.titre, description: e.description,
    xp_reward: e.xp, order_index: i,
  }).select("id").single();
  if (error) { console.error(`  ✗ ${e.titre} : ${error.message}`); process.exit(1); }

  const lignes = e.blocs.map((b, j) => ({ training_id: tr.id, type: b.type, content: b.content, order_index: j }));
  const { error: eBl } = await db.from("training_blocks").insert(lignes);
  if (eBl) { console.error(`  ✗ blocs de « ${e.titre} » : ${eBl.message}`); process.exit(1); }
  console.log(`  ✓ ${String(e.xp).padStart(3)} XP  ${e.titre}  (${lignes.length} blocs)`);
}

console.log("\nTerminé.");
