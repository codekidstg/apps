/**
 * Le Terrain — Explorateur, séance 6 « Trouver le motif ».
 *
 *     node scripts/terrain-explorateur-s6.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : le motif est le plus petit morceau qui revient
 * à l'identique ; on le repère, on compte ses retours, et on règle la boucle
 * dessus. Et le piège le plus fréquent : ce qui reste à la fin ne rentre pas
 * dans la boucle et s'écrit à côté.
 *
 * Disponible : avancer, tourner, ramasser, répéter. Pas encore vu : le plan
 * écrit en phases et la clé/porte (séance 7), tout code écrit.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, cheminLabyrinthe } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Trouver le motif";

const A = "Avancer", D = "Tourner à droite", G = "Tourner à gauche";

// ── Les séquences à mesurer, et la longueur de leur motif, calculée ───────
const SEQ = [
  ["a", [A, D], 3], ["b", [A, A, D], 3], ["c", [A, D, A, G], 3],
  ["d", [A, G], 4], ["e", [A, A, A, D], 2], ["f", [A, D, A], 3],
  ["g", [A, A], 4], ["h", [A, D, D], 3], ["i", [A, A, G, G], 2],
  ["j", [D, A], 4], ["k", [A, A, D, A], 2], ["l", [A, G, A], 3],
];
const items = SEQ.map(([id, motif, tours]) => {
  const suite = Array.from({ length: tours }, () => motif).flat();
  return {
    id, emoji: "🧩",
    label: suite.map((i) => (i === A ? "→" : i === D ? "↷" : "↶")).join(" "),
    correct: String(motif.length),
    hint: `${motif.join(", ")} revient ${tours} fois : le motif fait ${motif.length} instruction${motif.length > 1 ? "s" : ""}.`,
  };
});
for (const [id, motif] of SEQ) if (![2, 3, 4].includes(motif.length)) throw new Error(`${id} : motif de ${motif.length}, hors des bacs`);

// Un escalier : droite, bas, droite, bas, droite, bas.
const ESCALIER = [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 2 }, { x: 3, y: 3 }];
const MURS_ESCALIER = (() => {
  const libres = new Set(ESCALIER.map((c) => `${c.x},${c.y}`));
  const murs = [];
  for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if (!libres.has(`${x},${y}`)) murs.push({ x, y });
  return murs;
})();

const EXOS = [
  {
    palier: 1,
    title: "Quelle longueur fait le motif ?",
    description: "Douze chemins. Trouve le plus petit morceau qui revient.",
    blocs: [
      kodi("<p>Le motif, c'est le <strong>plus petit</strong> morceau qui revient à l'identique. Pas deux fois ce morceau : le plus petit.</p><p>→ avance, ↷ tourne à droite, ↶ tourne à gauche.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "La longueur du motif",
          instruction: "Choisis un chemin, puis la longueur de son motif.",
          bins: [
            { id: "2", emoji: "2️⃣", label: "2 instructions", color: "#10b981" },
            { id: "3", emoji: "3️⃣", label: "3 instructions", color: "#FDB813" },
            { id: "4", emoji: "4️⃣", label: "4 instructions", color: "#a78bfa" },
          ],
          items,
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Entoure le motif",
    description: "Clique sur son début, puis sur sa fin.",
    blocs: [
      kodi("<p>Voici un chemin complet. Un morceau y revient trois fois.</p><p>Clique sur sa <strong>première</strong> instruction, puis sur sa <strong>dernière</strong>.</p>"),
      jeu({
        game_type: "pattern_select",
        title: "Le motif de l'escalier",
        description: "Trouve le morceau qui revient jusqu'au bout. Clique sur son début, puis sur sa fin.",
        instructions: [A, D, A, G, A, D, A, G, A, D, A, G],
        motif_start: 0,
        motif_end: 3,
        repetitions: 3,
        explanation: "Avancer, droite, Avancer, gauche revient trois fois : le motif fait quatre instructions, et c'est lui qu'on met dans la boucle.",
      }),
    ],
  },

  {
    palier: 2,
    title: "Construis la boucle",
    description: "Le motif revient… et il reste quelque chose à la fin.",
    blocs: [
      kodi("<p>Voici le piège le plus fréquent : un chemin qui se répète, <strong>puis se termine autrement</strong>.</p><p>Construis la boucle sur le motif — et regarde bien ce qui reste après.</p>"),
      jeu({
        game_type: "pattern_build",
        title: "Le motif et le reste",
        description: "Construis la boucle, puis regarde ce qui reste à la fin.",
        instructions: [A, D, A, D, A, D, A, A],
        motif_start: 0,
        motif_end: 1,
        explanation: "Avancer, droite revient trois fois — puis il reste deux Avancer tout seuls. La boucle ne couvre que ce qui se répète ; le reste s'écrit à côté.",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux motifs mal découpés",
    description: "L'un est trop grand, l'autre mal compté.",
    blocs: [
      kodi("<p>Deux programmes écrits par quelqu'un qui a mal regardé le chemin.</p><p>Une seule ligne est fausse dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le motif trop grand",
        context: "Le chemin est : Avancer, droite, Avancer, droite, Avancer, droite. Ce programme en fait deux fois trop.",
        description: "Clique sur la ligne fausse.",
        bug_index: 0,
        fix: "Répéter 3 fois :",
        explanation: "Le motif — Avancer, droite — revient trois fois, pas six. Compter les retours du motif, pas les instructions.",
        instructions: ["Répéter 6 fois :", "    Avancer", "    Tourner à droite"],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "La fin oubliée",
        context: "Le chemin fait : le motif trois fois, PUIS deux Avancer tout seuls. Ce programme s'arrête trop tôt.",
        description: "Clique sur la ligne mal placée.",
        bug_index: 3,
        fix: "(ces Avancer devaient être en dehors de la boucle)",
        explanation: "Mis dans la boucle, les deux Avancer passeraient trois fois. Ce qui ne se répète pas s'écrit après la boucle, pas dedans.",
        instructions: ["Répéter 3 fois :", "    Avancer", "    Tourner à droite", "    Avancer, Avancer"],
      }),
    ],
  },

  {
    palier: 2,
    title: "Ce qui reste en dehors",
    description: "Six questions sur un chemin qui ne finit pas comme il commence.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici le chemin complet de Kirikou, instruction par instruction :</p>" +
            "<pre><code>Avancer, Tourner à droite,\nAvancer, Tourner à droite,\nAvancer, Tourner à droite,\nAvancer, Avancer</code></pre>" +
            "<p>Huit instructions en tout. Regarde bien où ça s'arrête de se répéter.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Ce qui reste en dehors",
          sentences: [
            { id: "s1", before: "Le motif qui revient est", after: ".",
              options: ["Avancer, Tourner à droite", "Avancer", "Tourner à droite"], correct: 0,
              explanation: "C'est le plus petit morceau qui revient à l'identique." },
            { id: "s2", before: "Il revient", after: "fois.",
              options: ["3", "4", "2"], correct: 0,
              explanation: "Trois fois deux instructions, soit les six premières." },
            { id: "s3", before: "Après la boucle, il reste", after: "instructions.",
              options: ["2", "0", "1"], correct: 0,
              explanation: "Les deux derniers Avancer ne suivent plus le motif." },
            { id: "s4", before: "Ces deux instructions doivent s'écrire", after: ".",
              options: ["en dehors de la boucle", "dans la boucle", "avant la boucle"], correct: 0,
              explanation: "La boucle ne couvre que ce qui se répète. Le reste s'écrit à côté, après." },
            { id: "s5", before: "Si on les mettait dans la boucle, elles passeraient", after: "fois.",
              options: ["3", "1", "2"], correct: 0,
              explanation: "Tout ce qui est dans la boucle passe une fois par tour." },
            { id: "s6", before: "Le programme complet tient en", after: "lignes au lieu de huit.",
              options: ["4", "6", "8"], correct: 0,
              explanation: "Répéter, les deux lignes du motif, et la ligne du reste : quatre." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "L'escalier de Kirikou",
    description: "Trois marches identiques. Repère-les, et pose ta boucle.",
    blocs: [
      kodi("<p>Un escalier de <strong>trois marches</strong> : à droite, en bas, à droite, en bas…</p><p>Trace le chemin du doigt, entoure la marche qui revient, compte-la — puis pose ta boucle.</p>"),
      jeu({
        game_type: "maze",
        title: "L'escalier de Kirikou",
        grid_size: 6,
        start: { x: 0, y: 0, dir: "E" },
        goal: { x: 3, y: 3 },
        walls: MURS_ESCALIER,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        max_blocks: 8,
        steps: ["Une marche = avancer, tourner, avancer, tourner", "Trois marches identiques"],
        instructions: "Descends l'escalier jusqu'à l'étoile ⭐. Huit blocs au maximum : repère la marche qui revient.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Le refrain et la note seule",
    description: "Un morceau qui revient deux fois, puis une note toute seule.",
    blocs: [
      kodi("<p>En musique aussi, tout ne rentre pas dans la boucle.</p><p>Joue un refrain de <strong>trois sons</strong>, répété <strong>deux fois</strong> — puis <strong>un son tout seul</strong> pour finir. Ce dernier son ne doit pas être dans la boucle.</p>"),
      jeu({
        game_type: "music",
        title: "Le refrain et la note seule",
        free_mode: true,
        tempo: 340,
        min_notes: 7,
        max_blocks: 6,
        available_blocks: ["music_drum", "music_pause", "controls_repeat_ext"],
        instructions: "Un refrain de trois sons joue deux fois, puis un son tout seul termine. Sept sons en tout, six blocs au maximum.",
      }),
    ],
  },
];

const esc = EXOS.find((e) => e.title === "L'escalier de Kirikou").blocs[1].content;
const chemin = cheminLabyrinthe(esc);
if (chemin.erreur) throw new Error(`l'escalier : ${chemin.erreur}`);
console.log(`✓ l'escalier : chemin de ${chemin.pas} cases, ${esc.max_blocks} blocs autorisés`);

verifier(EXOS, {
  interdits: [/print\(/, /\bdef\b/, /pseudocode/i],
  comptes: { "Quelle longueur fait le motif ?": 12, "Ce qui reste en dehors": 6 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
