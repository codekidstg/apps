/**
 * Séance 6 Explorateur — « Trouver le motif ». Leçon et entraînements.
 *
 *     node scripts/explorateur-s6.mjs           aperçu seul
 *     node scripts/explorateur-s6.mjs --ecrire  réécrit la leçon et crée les entraînements
 *
 * La séance s'appelait « La boucle qui fait tout » et n'enseignait rien que S5
 * n'ait déjà donné : la boucle, encore, sur des labyrinthes. Quatre textes, un
 * quiz vide, et trois labyrinthes dont un infranchissable — 5 cases libres sur
 * une grille de 49, aucun chemin du départ à l'arrivée.
 *
 * Son objectif devient le barreau qui manquait entre S5 et S7 : trouver le
 * motif SOI-MÊME dans un chemin qui n'est pas uniforme, et voir que la boucle
 * ne couvre que ce qui se répète — le reste s'écrit à côté.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
// La leçon a d'abord été écrite sous son ancien titre : on accepte les deux,
// pour que le script reste rejouable après le renommage.
const TITRES = ["Trouver le motif", "La boucle qui fait tout"];

// ── Fabrique de labyrinthes ─────────────────────────────────────────────────
/** Tout ce qui n'est pas sur le chemin devient un mur. */
function murs(taille, chemin) {
  const libre = new Set(chemin.map(([x, y]) => `${x},${y}`));
  const out = [];
  for (let y = 0; y < taille; y++)
    for (let x = 0; x < taille; x++)
      if (!libre.has(`${x},${y}`)) out.push({ x, y });
  return out;
}

/** Escalier descendant vers la droite : (0,0) → (n,n), une marche par tour. */
function escalier(n) {
  const c = [[0, 0]];
  for (let i = 0; i < n; i++) { c.push([i + 1, i]); c.push([i + 1, i + 1]); }
  return c;
}

const CHEMIN_ESCALIER = escalier(6);                                  // (0,0) → (6,6)
const CHEMIN_RESTE = [...escalier(3), [4, 3], [5, 3]];                // 3 marches puis 2 pas

const D = "#0f172a";
const html = (s) => ({ html: s });

// ── La leçon ────────────────────────────────────────────────────────────────
//
// L'ordre compte autant que le contenu. La première version plaçait le motif
// le plus complexe — quatre instructions, trois répétitions, avec un reste —
// en tout premier exercice, puis redescendait à « Répéter 6 fois : Avancer ».
// Et ce premier labyrinthe était plus facile que le dernier de S5 : la séance
// démarrait en dessous de celle qu'elle suit.
//
// La progression va maintenant du motif de deux instructions sans reste
// jusqu'au transfert hors du robot, en passant par le labyrinthe et le bug.

const ouverture = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#f97316;margin:0 0 10px">🔁 Kirikou descend un escalier</h2>
    <p style="color:#94a3b8;margin:0 0 12px">Tu sais déjà faire ça :</p>
    <pre style="background:#020617;color:#FDB813;padding:10px 14px;border-radius:8px;margin:0 0 12px">Répéter 6 fois : Avancer</pre>
    <p style="color:#94a3b8;margin:0 0 12px">…et Kirikou traverse un couloir tout droit.</p>
    <p style="color:#94a3b8;margin:0 0 8px">Mais regarde <strong style="color:#e2e8f0">ce</strong> chemin :</p>
    <p style="font-size:24px;letter-spacing:6px;margin:0 0 12px">➡️⬇️➡️⬇️➡️⬇️</p>
    <p style="color:#94a3b8;margin:0 0 12px">Il se répète, lui aussi. Mais ce n'est pas « Avancer » qui revient — c'est <strong style="color:#e2e8f0">avancer PUIS descendre</strong>, six fois de suite.</p>
    <p style="color:#f97316;font-weight:bold;margin:0">🎯 Aujourd'hui tu apprends à repérer le motif — le morceau qui revient — même quand il fait plusieurs instructions.</p>
  </div>`) };

const cestQuoiUnMotif = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#10b981;margin:0 0 10px">🧩 Un motif, c'est quoi exactement ?</h2>
    <p style="color:#94a3b8;margin:0 0 12px">Le motif, c'est <strong style="color:#e2e8f0">le plus petit morceau qui revient à l'identique</strong>.</p>
    <pre style="background:#020617;color:#FDB813;padding:12px 14px;border-radius:8px;margin:0 0 12px">Avancer, Tourner droite, Avancer, Tourner droite
   ↑___________________↑
   le motif fait 2 instructions, répété 2 fois</pre>
    <p style="color:#94a3b8;margin:0 0 12px">Les développeurs ont une règle pour ça — le principe <strong style="color:#e2e8f0">DRY</strong>, « Don't Repeat Yourself » : ne te répète jamais. Si tu écris deux fois la même chose, c'est qu'une boucle t'attend.</p>
    <div style="background:#020617;border-left:4px solid #10b981;padding:12px 16px;border-radius:0 8px 8px 0">
      <p style="color:#6ee7b7;margin:0">Et si le carré fait 10 cases de côté au lieu de 3 ? Tu changes <strong>un seul chiffre</strong>.</p>
    </div>
  </div>`) };

const quizMotif = { type: "quiz", content: { questions: [
  { question: "Avancer, Tourner à gauche, Avancer, Tourner à gauche — quel est le motif ?",
    choices: ["Avancer, Tourner à gauche", "Avancer", "Tourner à gauche", "Il n'y a pas de motif"],
    answer: 0,
    explanation: "Le morceau « Avancer, Tourner à gauche » revient deux fois à l'identique. Il fait 2 instructions." },
  { question: "Dans « Répéter 4 fois : [Avancer, Tourner à droite] », combien d'instructions Kirikou exécute-t-il en tout ?",
    choices: ["8", "4", "2", "6"],
    answer: 0,
    explanation: "Deux instructions par tour, quatre tours : 2 × 4 = 8 instructions exécutées." },
  { question: "Avancer, Avancer, Avancer, Tourner à droite — peut-on tout mettre dans une seule boucle ?",
    choices: ["Non — seul « Avancer » se répète, le virage n'arrive qu'une fois",
              "Oui, Répéter 4 fois avec les deux instructions",
              "Oui, Répéter 3 fois avec les deux instructions",
              "Non, on ne peut jamais utiliser de boucle ici"],
    answer: 0,
    explanation: "La boucle ne prend que ce qui se répète. Le virage s'écrit après, tout seul." },
] } };

/** Premier contact avec le geste : motif court, et rien qui dépasse. */
const motifSimple = { type: "game", content: {
  game_type: "pattern_select",
  title: "Ton premier motif",
  description: "Clique sur la première instruction du motif, puis sur la dernière.",
  instructions: ["Avancer", "Tourner à gauche", "Avancer", "Tourner à gauche", "Avancer", "Tourner à gauche"],
  motif_start: 0, motif_end: 1, repetitions: 3,
  explanation: "Deux instructions qui reviennent trois fois. Ici tout le programme tient dans la boucle — il n'y a rien qui dépasse.",
} };

const methode = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#3b82f6;margin:0 0 10px">🗺️ La méthode du chercheur de motif</h2>
    <ol style="color:#94a3b8;margin:0 0 12px;padding-left:20px;line-height:1.9">
      <li><strong style="color:#e2e8f0">Trace</strong> le chemin complet avec ton doigt</li>
      <li><strong style="color:#e2e8f0">Cherche</strong> le segment qui revient à l'identique</li>
      <li><strong style="color:#e2e8f0">Compte</strong> combien de fois il revient → c'est ton N</li>
      <li><strong style="color:#e2e8f0">Regarde ce qui reste</strong> en dehors — ça s'écrit normalement, hors de la boucle</li>
    </ol>
    <p style="color:#94a3b8;margin:0 0 10px">Dans un escalier, Kirikou ne fait pas que descendre : il <strong style="color:#e2e8f0">avance, descend, se remet droit</strong> — puis recommence.</p>
    <pre style="background:#020617;color:#FDB813;padding:12px 14px;border-radius:8px;margin:0 0 12px">Avancer
Tourner à droite      ← il regarde vers le bas
Avancer
Tourner à gauche      ← il se remet face à l'Est</pre>
    <p style="color:#94a3b8;margin:0 0 12px">Ces quatre instructions forment <strong style="color:#e2e8f0">une marche</strong>. Compte les marches, tu auras ton N.</p>
    <div style="background:#020617;border-left:4px solid #FDB813;padding:12px 16px;border-radius:0 8px 8px 0">
      <p style="color:#FDB813;margin:0">⚠️ Le bloc 🔁 Répéter compte pour <strong>deux</strong> : il arrive avec son nombre.</p>
    </div>
  </div>`) };

const labyEscalier = { type: "game", content: {
  game_type: "maze",
  title: "Défi 1 — L'escalier",
  grid_size: 7,
  start: { x: 0, y: 0, dir: "E" }, goal: { x: 6, y: 6 },
  walls: murs(7, CHEMIN_ESCALIER),
  max_blocks: 7,
  instructions: "Repère la marche qui se répète, puis compte combien il y en a. Le motif fait quatre instructions.",
  steps: ["Le motif : Avancer, Tourner à droite, Avancer, Tourner à gauche",
          "Compte les marches de l'escalier — il y en a six",
          "Mets le motif dans 🔁 Répéter 6 fois — 6 blocs en tout"],
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
} };

const chasseAuBug = { type: "game", content: {
  game_type: "bug_hunt",
  title: "Le motif mal choisi",
  description: "Ce programme devait descendre l'escalier. Une instruction du motif est fausse — clique dessus.",
  context: "L'escalier descend vers la droite. Après chaque descente, Kirikou doit se remettre face à l'Est ➡️.",
  instructions: ["Répéter 6 fois :", "   Avancer", "   Tourner à droite", "   Avancer", "   Tourner à droite"],
  bug_index: 4,
  fix: "   Tourner à gauche",
  explanation: "Deux virages à droite d'affilée font faire demi-tour à Kirikou. Après être descendu d'une case, il doit se remettre face à l'Est — donc tourner à gauche.",
} };

const pasToutCouvrir = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#10b981;margin:0 0 10px">✂️ La boucle ne couvre pas tout</h2>
    <p style="color:#94a3b8;margin:0 0 12px">Voici le piège le plus fréquent : un chemin qui se répète… <strong style="color:#e2e8f0">puis se termine autrement</strong>.</p>
    <pre style="background:#020617;color:#FDB813;padding:12px 14px;border-radius:8px;margin:0 0 12px">Répéter 3 fois :
   Avancer, Tourner droite, Avancer, Tourner gauche
Avancer          ← en dehors
Avancer          ← en dehors</pre>
    <p style="color:#94a3b8;margin:0">Mettre ces deux derniers pas dans la boucle casserait tout. On les écrit à côté, simplement.</p>
  </div>`) };

/** Le même geste, mais cette fois quelque chose déborde. */
const motifAvecReste = { type: "game", content: {
  game_type: "pattern_select",
  title: "Le motif… et ce qui reste",
  description: "Attention : tout le programme ne tient pas dans la boucle.",
  instructions: [
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche",
    "Avancer", "Avancer",
  ],
  motif_start: 0, motif_end: 3, repetitions: 3,
  explanation: "Les deux derniers « Avancer » ne font pas partie du motif : ils s'écrivent après la boucle.",
} };

const labyEscalierEtCouloir = { type: "game", content: {
  game_type: "maze",
  title: "Défi 2 — L'escalier et le couloir",
  grid_size: 7,
  start: { x: 0, y: 0, dir: "E" }, goal: { x: 5, y: 3 },
  walls: murs(7, CHEMIN_RESTE),
  max_blocks: 9,
  instructions: "Trois marches d'escalier, puis deux cases tout droit. La boucle ne prend que les marches.",
  steps: ["Repère les marches : il y en a trois", "Répéter 3 fois le motif de quatre instructions",
          "Puis deux Avancer, en dehors de la boucle"],
  available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
} };

const motifPartout = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#a78bfa;margin:0 0 10px">🎵 Un motif, ça n'est pas réservé aux robots</h2>
    <p style="color:#94a3b8;margin:0 0 12px">Écoute une chanson que tu aimes : le refrain revient. Regarde un pagne : le dessin se répète. Compte les pas d'une danse : le même enchaînement recommence.</p>
    <p style="color:#94a3b8;margin:0 0 12px">Partout où quelque chose <strong style="color:#e2e8f0">revient à l'identique</strong>, il y a un motif — et donc une boucle possible.</p>
    <div style="background:#020617;border-left:4px solid #a78bfa;padding:12px 16px;border-radius:0 8px 8px 0">
      <p style="color:#c4b5fd;margin:0">Essaie sur une mélodie : le geste est exactement le même que dans le labyrinthe.</p>
    </div>
  </div>`) };

const motifMusical = { type: "game", content: {
  game_type: "pattern_select",
  title: "Le motif de la mélodie",
  description: "Trois notes qui reviennent — et une qui ne revient pas.",
  instructions: ["Do", "Mi", "Sol", "Do", "Mi", "Sol", "La"],
  motif_start: 0, motif_end: 2, repetitions: 2,
  explanation: "Do-Mi-Sol deux fois, puis un La tout seul pour finir. Exactement comme l'escalier suivi du couloir : le motif, puis ce qui reste.",
} };

const quizBilan = { type: "quiz", content: { questions: [
  { question: "Répéter 4 fois : [Avancer, Tourner à droite] puis Avancer, Avancer — combien d'instructions en tout ?",
    choices: ["10", "8", "6", "12"],
    answer: 0,
    explanation: "4 tours × 2 instructions = 8, plus les 2 « Avancer » de la fin : 10." },
  { question: "Un chemin fait : motif × 5, puis 3 pas uniques. Que met-on dans la boucle ?",
    choices: ["Seulement le motif", "Le motif et les 3 pas", "Les 3 pas seulement", "Rien, on n'utilise pas de boucle"],
    answer: 0,
    explanation: "La boucle ne contient que ce qui se répète. Les 3 pas uniques s'écrivent après." },
  { question: "Pourquoi les développeurs détestent-ils écrire deux fois la même chose ?",
    choices: ["Parce qu'il faudrait corriger partout en cas d'erreur",
              "Parce que c'est interdit par l'ordinateur",
              "Parce que le programme serait plus lent",
              "Parce que ça prend trop de place sur le disque"],
    answer: 0,
    explanation: "C'est le principe DRY. Une seule copie, un seul endroit à corriger — et un seul chiffre à changer pour tout modifier." },
] } };

const activiteMentor = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#FDB813;margin:0 0 10px">🎯 Activité avec ton mentor</h2>
    <p style="color:#94a3b8;margin:0 0 10px"><strong style="color:#e2e8f0">🔍 Entoure le motif</strong> — ton mentor dessine un chemin sur papier. Avant d'écrire la moindre instruction, tu entoures au crayon le morceau qui se répète, et tu écris le nombre de fois à côté.</p>
    <p style="color:#94a3b8;margin:0 0 10px"><strong style="color:#e2e8f0">🥁 Le motif frappé</strong> — ton mentor tape un rythme sur la table. Tu dois dire au bout de combien de frappes le motif recommence. Puis on inverse.</p>
    <p style="color:#94a3b8;margin:0"><strong style="color:#e2e8f0">🏆 Le défi</strong> — dessine un chemin avec un motif <em>et</em> une fin différente. Le piège préféré des développeurs.</p>
  </div>`) };

const cloture = { type: "text", content: html(`
  <div style="background:${D};border-radius:12px;padding:18px 22px">
    <h2 style="color:#10b981;margin:0 0 10px">🔁 Tu sais reconnaître un motif</h2>
    <p style="color:#94a3b8;margin:0 0 12px">C'est ce que fait un développeur devant n'importe quel programme : repérer ce qui se répète, l'automatiser, et laisser le reste tranquille.</p>
    <p style="color:#e2e8f0;font-weight:bold;margin:0 0 6px">📌 Ce que tu as appris :</p>
    <ul style="color:#94a3b8;margin:0 0 12px;padding-left:20px;line-height:1.8">
      <li>Un motif, c'est le plus petit morceau qui revient à l'identique</li>
      <li>Le motif peut faire une, deux ou quatre instructions</li>
      <li>DRY — ne jamais écrire deux fois la même chose</li>
      <li>La boucle ne prend que ce qui se répète : le reste s'écrit à côté</li>
      <li>Un motif se trouve partout — dans un chemin comme dans une mélodie</li>
    </ul>
    <div style="background:#020617;border-left:4px solid #3b82f6;padding:12px 16px;border-radius:0 8px 8px 0">
      <p style="color:#93c5fd;margin:0">🔭 <strong>Prochaine séance — « Plan avant code »</strong>. La dernière du thème : tu combineras tout ce que tu sais sur de grands labyrinthes, en apprenant à planifier avant de poser le premier bloc.</p>
    </div>
  </div>`) };

const BLOCS = [
  ouverture, cestQuoiUnMotif, quizMotif,
  motifSimple,                      // motif de 2, sans reste
  methode,
  labyEscalier, chasseAuBug,        // le motif de 4, puis le bug
  pasToutCouvrir, motifAvecReste,   // ce qui déborde
  labyEscalierEtCouloir,
  motifPartout, motifMusical,       // le transfert hors du robot
  quizBilan, activiteMentor, cloture,
];

// ── Les entraînements ───────────────────────────────────────────────────────
const jeu = (game_type, content) => ({ type: "blockly_challenge", content: { game_type, ...content } });

const ENTRAINEMENTS = [
  {
    titre: "Quelle est la longueur du motif ?",
    description: "Une instruction, deux, ou quatre ? Range chaque programme dans la bonne famille.",
    xp: 30,
    blocs: [
      { type: "text", content: html(`<p>🤖 <strong>Kodi te parle</strong></p><p>Avant de compter les répétitions, il faut savoir <strong>où s'arrête le motif</strong>.</p><p>Lis chaque programme et demande-toi : quel est le plus petit morceau qui revient à l'identique ?</p>`) },
      { type: "drag_to_bin", content: {
        title: "Range chaque programme selon la longueur de son motif",
        bins: [
          { id: "un",     label: "1 instruction",  emoji: "1️⃣", color: "#10b981" },
          { id: "deux",   label: "2 instructions", emoji: "2️⃣", color: "#3b82f6" },
          { id: "quatre", label: "4 instructions", emoji: "4️⃣", color: "#a78bfa" },
        ],
        items: [
          { id: "a", emoji: "📄", label: "Avancer, Avancer, Avancer, Avancer, Avancer", correct: "un",
            hint: "Une seule instruction revient : « Avancer ». Le motif fait 1." },
          { id: "b", emoji: "📄", label: "Tourner à gauche, Tourner à gauche, Tourner à gauche", correct: "un",
            hint: "Toujours la même instruction, trois fois. Motif de 1." },
          { id: "c", emoji: "📄", label: "Avancer, Tourner à droite, Avancer, Tourner à droite", correct: "deux",
            hint: "« Avancer, Tourner à droite » revient deux fois : motif de 2." },
          { id: "d", emoji: "📄", label: "Avancer, Tourner à gauche, Avancer, Tourner à gauche, Avancer, Tourner à gauche", correct: "deux",
            hint: "Le même couple, trois fois de suite. Motif de 2, répété 3 fois." },
          { id: "e", emoji: "📄", label: "Avancer, Tourner à droite, Avancer, Tourner à gauche, Avancer, Tourner à droite, Avancer, Tourner à gauche", correct: "quatre",
            hint: "Attention aux virages : droite puis gauche. Il faut les quatre instructions pour retrouver le début." },
          { id: "f", emoji: "📄", label: "Avancer, Avancer, Tourner à droite, Tourner à droite, Avancer, Avancer, Tourner à droite, Tourner à droite", correct: "quatre",
            hint: "Deux Avancer puis deux virages : le morceau complet fait 4 instructions." },
        ],
      } },
    ],
  },
  {
    titre: "Surligne le motif",
    description: "Dans un programme, puis dans un rythme — le geste est le même.",
    xp: 35,
    blocs: [
      { type: "text", content: html(`<p>🤖 <strong>Kodi te parle</strong></p><p>Tu sais dire <em>combien</em> d'instructions fait un motif. Maintenant montre-moi <strong>où il commence et où il finit</strong>.</p><p>Clique sur la première instruction du motif, puis sur la dernière. Je colorierai les répétitions pour toi.</p>`) },
      jeu("pattern_select", {
        title: "Le motif ne commence pas toujours à la première ligne",
        description: "Regarde bien avant de cliquer.",
        instructions: [
          "Tourner à gauche",
          "Avancer", "Avancer", "Tourner à droite",
          "Avancer", "Avancer", "Tourner à droite",
          "Avancer", "Avancer", "Tourner à droite",
        ],
        motif_start: 1, motif_end: 3, repetitions: 3,
        explanation: "Le premier virage n'appartient pas au motif : il se fait une seule fois, avant la boucle.",
      }),
      { type: "text", content: html(`<p>🥁 Et maintenant, exactement le même geste — mais sur un rythme de tambour.</p>`) },
      jeu("pattern_select", {
        title: "Le rythme du tambour",
        description: "Boum, Tac… jusqu'où va le motif ?",
        instructions: ["Boum", "Tac", "Boum", "Tac", "Boum", "Tac", "Tac"],
        motif_start: 0, motif_end: 1, repetitions: 3,
        explanation: "Boum-Tac trois fois, puis un Tac tout seul pour finir. Un rythme se lit comme un programme.",
      }),
    ],
  },
  {
    titre: "Remets d'aplomb",
    description: "Un programme mélangé à remettre dans l'ordre, et une boucle mal comptée à corriger.",
    xp: 40,
    blocs: [
      { type: "text", content: html(`<p>🤖 <strong>Kodi te parle</strong></p><p>Quelqu'un a fait tomber mon programme et les instructions se sont mélangées.</p><p>Kirikou part face à l'Est ➡️. Il doit <strong>avancer de deux cases, descendre d'une, puis avancer de deux</strong>.</p><p>💡 Pour descendre depuis l'Est, on tourne à droite. Pour se remettre face à l'Est, on tourne à gauche.</p>`) },
      jeu("sort", {
        title: "Remets le programme dans l'ordre",
        description: "Chemin attendu : ➡️➡️⬇️➡️➡️",
        items: ["Avancer", "Avancer", "Tourner à droite", "Avancer", "Tourner à gauche", "Avancer", "Avancer"],
      }),
      { type: "text", content: html(`<p>🔍 Deuxième affaire : le motif est bon, mais quelque chose cloche quand même.</p>`) },
      jeu("bug_hunt", {
        title: "Le compte n'y est pas",
        description: "Une seule ligne est fausse — clique dessus.",
        context: "L'escalier fait QUATRE marches. Le motif écrit ci-dessous est correct.",
        instructions: ["Répéter 3 fois :", "   Avancer", "   Tourner à droite", "   Avancer", "   Tourner à gauche"],
        bug_index: 0,
        fix: "Répéter 4 fois :",
        explanation: "Le motif est juste — c'est le nombre qui ne l'est pas. Quatre marches, donc quatre tours. Kirikou s'arrêtait une marche trop tôt.",
      }),
    ],
  },
  {
    titre: "Le labyrinthe à motif",
    description: "À toi de guider Kirikou — avec une boucle, et le compte juste.",
    xp: 45,
    blocs: [
      { type: "text", content: html(`<p>🤖 <strong>Kodi te parle</strong></p><p>Assez lu de programmes : construis le tien.</p><p>Un escalier de <strong>quatre marches</strong> t'attend. Repère le motif, compte les marches, et pose la boucle.</p><p>⚠️ Le bloc 🔁 Répéter compte pour deux — il arrive avec son nombre.</p>`) },
      jeu("maze", {
        title: "L'escalier à quatre marches",
        grid_size: 6,
        start: { x: 0, y: 0, dir: "E" }, goal: { x: 4, y: 4 },
        walls: murs(6, escalier(4)),
        max_blocks: 7,
        instructions: "Quatre marches identiques. Le motif fait quatre instructions : Avancer, Tourner à droite, Avancer, Tourner à gauche.",
        steps: ["Trace le chemin du doigt", "Compte les marches", "Répéter N fois le motif de quatre instructions"],
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        required: true,
      }),
    ],
  },
];

// ── Contrôle des labyrinthes avant écriture ─────────────────────────────────
function franchissable(c) {
  const mur = new Set((c.walls ?? []).map((m) => `${m.x},${m.y}`));
  const file = [[c.start.x, c.start.y]];
  const vus = new Set([`${c.start.x},${c.start.y}`]);
  while (file.length) {
    const [x, y] = file.shift();
    if (x === c.goal.x && y === c.goal.y) return true;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= c.grid_size || ny >= c.grid_size) continue;
      if (mur.has(k) || vus.has(k)) continue;
      vus.add(k); file.push([nx, ny]);
    }
  }
  return false;
}

console.log("SÉANCE 6 — « Trouver le motif »\n");
console.log("LA LEÇON — " + BLOCS.length + " blocs");
for (const [i, b] of BLOCS.entries()) {
  const c = b.content;
  const nom = c.game_type ? `${b.type}:${c.game_type} — ${c.title}` : b.type === "quiz" ? `quiz — ${c.questions.length} questions` : "text";
  console.log(`  [${String(i).padStart(2)}] ${nom}`);
}

console.log("\nLES LABYRINTHES");
let souci = 0;
for (const b of [...BLOCS, ...ENTRAINEMENTS.flatMap((e) => e.blocs)]) {
  const c = b.content;
  if (!c.grid_size || !c.start) continue;
  const ok = franchissable(c);
  if (!ok) souci++;
  const libres = c.grid_size ** 2 - (c.walls ?? []).length;
  console.log(`  ${ok ? "✓" : "✗ SANS ISSUE"} ${c.title.padEnd(34)} ${c.grid_size}×${c.grid_size} · ${libres} cases libres · max ${c.max_blocks} blocs`);
}

console.log("\nLES ENTRAÎNEMENTS");
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const mecas = e.blocs.filter((b) => b.type !== "text").map((b) => b.content.game_type ?? b.type);
  console.log(`  ${i + 1}. ${String(e.xp).padStart(3)} XP  ${e.titre.padEnd(30)} ${mecas.join(", ")}`);
}

if (souci) { console.error(`\n${souci} labyrinthe(s) sans issue — rien n'a été écrit.`); process.exit(1); }
if (!ECRIRE) { console.log("\n(aperçu seul — relancer avec --ecrire)"); process.exit(0); }

// ── Écriture ────────────────────────────────────────────────────────────────
const { data: trouvees, error: eL } = await db.from("lessons").select("id, theme_id, chapter_id, title").in("title", TITRES);
const lecon = trouvees?.[0];
if (eL || !lecon) { console.error("Leçon introuvable :", eL?.message); process.exit(1); }
if (trouvees.length > 1) { console.error("Plusieurs leçons portent ces titres — ambigu."); process.exit(1); }

console.log("\nRéécriture de la leçon…");
await db.from("lesson_blocks").delete().eq("lesson_id", lecon.id);
const { error: eB } = await db.from("lesson_blocks").insert(
  BLOCS.map((b, i) => ({ lesson_id: lecon.id, theme_id: lecon.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (eB) { console.error("  ✗", eB.message); process.exit(1); }
console.log(`  ✓ ${BLOCS.length} blocs`);

await db.from("lessons").update({
  title: "Trouver le motif",
  objectives: [
    "Repérer le motif qui se répète dans un chemin ou un programme",
    "Compter les répétitions pour régler le nombre de la boucle",
    "Comprendre que la boucle ne couvre que ce qui se répète — le reste s'écrit à côté",
  ],
}).eq("id", lecon.id);
console.log("  ✓ titre et objectifs");

const { data: dejaLa } = await db.from("trainings").select("id").eq("lesson_id", lecon.id);
if (dejaLa?.length) {
  await db.from("training_blocks").delete().in("training_id", dejaLa.map((t) => t.id));
  await db.from("trainings").delete().eq("lesson_id", lecon.id);
  console.log(`  ↺ ${dejaLa.length} ancien(s) entraînement(s) remplacé(s)`);
}

console.log("\nÉcriture des entraînements…");
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data: tr, error } = await db.from("trainings").insert({
    lesson_id: lecon.id, title: e.titre, description: e.description, xp_reward: e.xp, order_index: i,
  }).select("id").single();
  if (error) { console.error(`  ✗ ${e.titre} : ${error.message}`); process.exit(1); }
  const { error: e2 } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: tr.id, type: b.type, content: b.content, order_index: j })),
  );
  if (e2) { console.error(`  ✗ blocs de « ${e.titre} » : ${e2.message}`); process.exit(1); }
  console.log(`  ✓ ${String(e.xp).padStart(3)} XP  ${e.titre}`);
}
console.log("\nTerminé.");
