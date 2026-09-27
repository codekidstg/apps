/**
 * Le Terrain — Explorateur, séance 2 « Mon premier algorithme ».
 *
 *     node scripts/terrain-explorateur-s2.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : un algorithme est une suite d'instructions
 * PRÉCISES ; l'ordre compte ; Kirikou obéit à la lettre ; il ne connaît que
 * deux blocs — Avancer et Ramasser — et il ne ramasse rien en passant dessus.
 * Et le piège du compteur : l'étoile n'est pas toujours au bout du couloir.
 *
 * Pas encore vu, donc interdit : tourner et les directions (séance 3), la
 * répétition (séance 5), les motifs (séance 6), tout code écrit.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Mon premier algorithme";

// Un couloir d'une seule ligne : tout le reste est mur. L'étoile est AVANT le
// bout, pour que s'arrêter au bon moment devienne le vrai défi.
const TAILLE = 6;
const MURS = [];
for (let x = 0; x < TAILLE; x++) for (let y = 1; y < TAILLE; y++) MURS.push({ x, y });

const EXOS = [
  {
    palier: 1,
    title: "Assez précis pour Kirikou ?",
    description: "Douze consignes. Un robot ne devine rien.",
    blocs: [
      kodi("<p>Kirikou obéit <strong>à la lettre</strong>. Il ne devine pas, il ne suppose pas, il ne fait pas de son mieux.</p><p>Douze consignes. Lesquelles peut-il exécuter sans hésiter ?</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Assez précis pour Kirikou ?",
          instruction: "Il comprend, ou il reste planté ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Un nombre exact de cases : il comprend.",
              "« Un peu », « par là », « jusqu'à ce que » : il ne sait pas.",
              "Une action qu'il connaît (avancer, ramasser) : il comprend.",
              "Un mot qui demande de deviner ou de choisir : il ne sait pas.",
            ],
          },
          categories: [
            { id: "ok", label: "Il comprend",    emoji: "🤖", color: "#10b981" },
            { id: "ko", label: "Il reste planté", emoji: "🤷", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Avance de 3 cases",              correct: "ok", hint: "Un nombre exact : il sait compter." },
            { id: "b", emoji: "2️⃣", label: "Avance un peu",                  correct: "ko", hint: "« Un peu », c'est combien ? Il n'en sait rien." },
            { id: "c", emoji: "3️⃣", label: "Ramasse la gemme",               correct: "ok", hint: "Une action qu'il connaît, sur la case où il est." },
            { id: "d", emoji: "4️⃣", label: "Prends ce qui brille",           correct: "ko", hint: "Il faudrait deviner ce qui brille. Un robot ne devine pas." },
            { id: "e", emoji: "5️⃣", label: "Avance jusqu'à l'étoile",        correct: "ko", hint: "Il ne voit pas l'étoile : il ne sait pas quand s'arrêter." },
            { id: "f", emoji: "6️⃣", label: "Avance de 1 case",               correct: "ok", hint: "Aussi précis qu'on peut l'être." },
            { id: "g", emoji: "7️⃣", label: "Va vers la sortie",              correct: "ko", hint: "Vers où ? Par quel chemin ? Trop vague." },
            { id: "h", emoji: "8️⃣", label: "Avance, avance, ramasse",        correct: "ok", hint: "Trois instructions précises, dans l'ordre." },
            { id: "i", emoji: "9️⃣", label: "Fais attention au puits",        correct: "ko", hint: "« Fais attention » n'est pas une action. Il ne saura pas quoi faire." },
            { id: "j", emoji: "🔟", label: "Avance de 10 cases",             correct: "ok", hint: "Précis. Il le fera, même s'il se cogne au mur à la troisième." },
            { id: "k", emoji: "🅰️", label: "Dépêche-toi",                    correct: "ko", hint: "Kirikou n'a qu'une vitesse. Ce n'est pas une instruction." },
            { id: "l", emoji: "🅱️", label: "Ramasse, puis avance de 2 cases", correct: "ok", hint: "Deux actions connues, dans un ordre clair." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque mot et ce qu'il fait",
    description: "Sept mots de la séance, et leur effet exact.",
    blocs: [
      kodi("<p>Sept mots que tu viens d'apprendre. À chacun son effet exact — pas un de plus.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque mot et ce qu'il fait",
          instruction: "Touche un mot, puis ce que Kirikou fait quand il l'entend.",
          left_label: "Le mot",
          right_label: "Ce que ça fait",
          pairs: [
            { left: "Avancer",              right: "Kirikou se déplace d'une case" },
            { left: "Ramasser",             right: "Il prend ce qui est sous ses pieds" },
            { left: "Un mur devant lui",    right: "Il reste bloqué, il ne traverse pas" },
            { left: "Un algorithme",        right: "Une suite d'instructions précises" },
            { left: "Changer l'ordre",      right: "Change le résultat" },
            { left: "Passer sur une gemme", right: "Ne la ramasse pas toute seule" },
            { left: "Une consigne vague",   right: "Il ne fait rien du tout" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens Kirikou",
    description: "Suis le programme case par case, comme lui.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Un couloir de six cases, numérotées de 1 à 6. Une gemme 💎 est posée sur la case 3, l'étoile ⭐ sur la case 5.</p>" +
            "<pre><code>[1] [2] [3💎] [4] [5⭐] [6]</code></pre>" +
            "<p>Kirikou est sur la case 1. Il reçoit ce programme :</p>" +
            "<pre><code>Avancer\nAvancer\nRamasser\nAvancer\nAvancer</code></pre>" +
            "<p>Suis-le pas à pas, avec ton doigt s'il le faut.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Deviens Kirikou",
          instruction: "Suis le programme case par case, puis complète chaque phrase.",
          sentences: [
            { id: "s1", before: "Après le premier Avancer, Kirikou est sur la case", after: ".",
              options: ["2", "1", "3"], correct: 0,
              explanation: "Un Avancer déplace d'une seule case. De 1, il passe à 2." },
            { id: "s2", before: "Après le deuxième Avancer, il est sur la case", after: ".",
              options: ["3", "2", "4"], correct: 0,
              explanation: "Deux Avancer depuis la case 1 : il est sur la 3, juste sur la gemme." },
            { id: "s3", before: "Le Ramasser lui sert à", after: ".",
              options: ["prendre la gemme sous ses pieds", "avancer d'une case", "voir plus loin"], correct: 0,
              explanation: "Il ne ramasse jamais en passant : il faut le lui dire, sur la bonne case." },
            { id: "s4", before: "À la fin du programme, il est sur la case", after: ".",
              options: ["5", "4", "6"], correct: 0,
              explanation: "Deux Avancer de plus depuis la case 3 : il arrive exactement sur l'étoile." },
            { id: "s5", before: "Si on ajoutait un Avancer de plus, il", after: ".",
              options: ["dépasserait l'étoile", "gagnerait quand même", "reviendrait en arrière"], correct: 0,
              explanation: "Le couloir continue après l'étoile. Un pas de trop, et c'est raté." },
            { id: "s6", before: "Si on mettait le Ramasser en premier, Kirikou", after: ".",
              options: ["ramasserait le vide", "ramasserait quand même la gemme", "avancerait d'abord"], correct: 0,
              explanation: "Sur la case 1, il n'y a rien. L'ordre change le résultat : c'est toute la leçon." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux programmes qui ratent",
    description: "Un pas de trop, une gemme oubliée.",
    blocs: [
      kodi("<p>Le même couloir : gemme sur la case 3, étoile sur la case 5, et le couloir continue après.</p><pre><code>[1] [2] [3💎] [4] [5⭐] [6]</code></pre><p>Deux programmes ratent de peu. Une seule ligne est fausse dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le pas de trop",
        context: "Kirikou a bien pris la gemme, mais il finit sur la case 6 au lieu de l'étoile.",
        description: "Clique sur la ligne en trop.",
        bug_index: 5,
        fix: "(rien — il ne fallait pas cette ligne)",
        explanation: "Deux Avancer suffisaient après la gemme. Le troisième dépasse l'étoile : c'est le piège du compteur.",
        instructions: ["Avancer", "Avancer", "Ramasser", "Avancer", "Avancer", "Avancer"],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "La gemme oubliée",
        context: "Kirikou finit sur la case 6, les mains vides. Il a dépassé l'étoile ET oublié la gemme.",
        description: "Clique sur la ligne fausse.",
        bug_index: 2,
        fix: "Ramasser",
        explanation: "À la troisième instruction, il était pile sur la gemme. En avançant au lieu de ramasser, il repart sans elle — et fait un pas de trop. Une seule ligne réparait les deux.",
        instructions: ["Avancer", "Avancer", "Avancer", "Avancer", "Avancer"],
      }),
    ],
  },

  {
    palier: 2,
    title: "L'algorithme du thé",
    description: "Six gestes. Un seul ordre marche.",
    blocs: [
      kodi("<p>Un algorithme n'est pas réservé aux robots : préparer le thé en est un.</p><p>Six gestes se sont mélangés. Remets-les dans l'ordre — et souviens-toi qu'un geste impossible reste impossible, même si on le veut très fort.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets l'algorithme du thé",
        description: "Six gestes, un seul ordre possible.",
        hint: "Demande-toi ce qui est impossible tant que l'eau n'est pas chaude.",
        items: [
          "Remplir la théière d'eau froide",
          "Poser la théière pleine sur le feu",
          "Attendre que l'eau bouille",
          "Ajouter le thé et le sucre",
          "Verser dans le verre",
          "Boire",
        ],
      }),
    ],
  },

  {
    palier: 3,
    title: "Le plan du couloir",
    description: "Écris le plan avant de poser un seul bloc.",
    blocs: [
      kodi("<p>Les développeurs écrivent leur plan avant de coder. Toi aussi, maintenant.</p><p>Compose les phases du couloir, dans l'ordre. Deux cartes sont là pour te piéger.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le plan du couloir",
        description: "Sept cartes, cinq bonnes. Deux sont des pièges : laisse-les de côté.",
        consigne: "Kirikou doit ramasser la gemme, puis s'arrêter pile sur l'étoile. Touche les cinq bonnes étapes, dans l'ordre.",
        phases: [
          "Compter les cases jusqu'à la gemme 💎",
          "Avancer jusqu'à la gemme",
          "Ramasser la gemme",
          "Compter les cases jusqu'à l'étoile ⭐",
          "Avancer et s'arrêter dessus",
        ],
        distracteurs: [
          "Ramasser la gemme avant d'arriver dessus",
          "Avancer jusqu'au bout du couloir",
        ],
        explanation: "On compte AVANT d'avancer, on ramasse SUR la gemme, et on s'arrête sur l'étoile — pas au bout du couloir.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Le couloir qui continue",
    description: "L'étoile n'est pas au bout. Compte avant de poser.",
    blocs: [
      kodi("<p>Dernier défi. Une gemme à prendre, une étoile qui n'est <strong>pas</strong> au bout du couloir.</p><p>Compte tes cases d'abord, pose tes blocs ensuite. Avancer jusqu'au mur ne marchera pas cette fois.</p>"),
      jeu({
        game_type: "maze",
        title: "Le couloir qui continue",
        grid_size: TAILLE,
        start: { x: 0, y: 0, dir: "E" },
        goal: { x: 3, y: 0 },
        walls: MURS,
        collectibles: [{ x: 2, y: 0, type: "gem" }],
        available_blocks: ["robot_move", "robot_pick"],
        max_blocks: 6,
        steps: ["Compte les cases avant de poser tes blocs", "L'étoile n'est pas au bout du couloir"],
        instructions: "Ramasse la gemme 💎, puis arrête-toi exactement sur l'étoile ⭐. Le couloir continue après : ne te laisse pas emporter.",
      }),
    ],
  },
];

verifier(EXOS, {
  interdits: [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/, /\bnord\b/i, /\bsud\b/i, /tourner/i, /\bgauche\b/i, /\bdroite\b/i],
  comptes: { "Assez précis pour Kirikou ?": 12, "Chaque mot et ce qu'il fait": 7, "Deviens Kirikou": 6 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
