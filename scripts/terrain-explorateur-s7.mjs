/**
 * Le Terrain — Explorateur, séance 7 « Plan avant code ».
 *
 *     node scripts/terrain-explorateur-s7.mjs [--ecrire] [--refaire]
 *
 * Dernière séance du thème. Elle a enseigné : écrire son plan en français
 * avant de poser le moindre bloc — le pseudocode —, découper une mission en
 * phases quand l'ordre compte (aller chercher la clé avant la porte), et
 * produire un dessin avec un programme.
 *
 * Tout le thème est disponible : avancer, tourner, ramasser, répéter, motifs.
 * Le Terrain de cette séance sert aussi de révision du thème entier.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, cheminLabyrinthe } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Plan avant code";

// ── Le U à dessiner : descendre, traverser, remonter ──────────────────────
const TRACE = [
  { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }, { x: 1, y: 4 },
  { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 },
  { x: 4, y: 3 }, { x: 4, y: 2 }, { x: 4, y: 1 },
];
// Une trace n'est un dessin que si elle se tient : chaque case doit toucher la
// précédente. Une case isolée rendrait la figure impossible à obtenir.
for (let i = 1; i < TRACE.length; i++) {
  const d = Math.abs(TRACE[i].x - TRACE[i - 1].x) + Math.abs(TRACE[i].y - TRACE[i - 1].y);
  if (d !== 1) throw new Error(`la trace saute entre la case ${i} et la ${i + 1}`);
}

const EXOS = [
  {
    palier: 1,
    title: "Plan, ou déjà du code ?",
    description: "Douze phrases. Le plan se parle en français.",
    blocs: [
      kodi("<p>Un plan s'écrit <strong>en français</strong>, avec des mots à toi. Il dit ce qu'on veut faire, pas comment le taper.</p><p>Les ingénieurs appellent ça le pseudocode, et ils en écrivent avant chaque programme.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Plan, ou déjà du code ?",
          instruction: "Cette phrase, c'est un plan ou une instruction à poser ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Un plan dit l'intention : « aller chercher », « revenir », « finir sur ».",
              "Du code dit le geste exact : « Avancer », « Tourner à droite », « Répéter 4 fois ».",
              "Un plan peut se lire à voix haute à quelqu'un qui ne programme pas.",
              "Un plan ne compte pas les cases : il dit où l'on va.",
            ],
          },
          categories: [
            { id: "plan", label: "Un plan", emoji: "🗺️", color: "#10b981" },
            { id: "code", label: "Du code", emoji: "🧱", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Descendre chercher la clé 🗝️",              correct: "plan", hint: "Une intention, en français. On ne sait pas encore combien de cases." },
            { id: "b", emoji: "2️⃣", label: "Avancer",                                   correct: "code", hint: "Un bloc à poser, exactement." },
            { id: "c", emoji: "3️⃣", label: "Répéter 4 fois : Avancer",                  correct: "code", hint: "C'est déjà écrit pour le robot." },
            { id: "d", emoji: "4️⃣", label: "Remonter jusqu'au couloir",                 correct: "plan", hint: "Ça dit où aller, pas comment y aller." },
            { id: "e", emoji: "5️⃣", label: "Tourner à droite",                          correct: "code", hint: "Un geste précis, un bloc." },
            { id: "f", emoji: "6️⃣", label: "Traverser la porte et rejoindre l'étoile ⭐", correct: "plan", hint: "Une phase entière, racontée en une phrase." },
            { id: "g", emoji: "7️⃣", label: "Ramasser",                                  correct: "code", hint: "Le bloc, tel qu'on le pose." },
            { id: "h", emoji: "8️⃣", label: "Longer le mur jusqu'au bout",               correct: "plan", hint: "Un humain comprend ; un robot, non — il faudrait compter." },
            { id: "i", emoji: "9️⃣", label: "Répéter 3 fois : Avancer, Tourner à droite", correct: "code", hint: "Une boucle écrite, prête à poser." },
            { id: "j", emoji: "🔟", label: "D'abord la clé, ensuite la porte",           correct: "plan", hint: "C'est l'ordre des phases : le cœur du plan." },
            { id: "k", emoji: "🅰️", label: "Avancer, Avancer, Ramasser",                 correct: "code", hint: "Trois blocs à la suite." },
            { id: "l", emoji: "🅱️", label: "Finir exactement sur l'étoile",              correct: "plan", hint: "Une intention. Le nombre de cases viendra après." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque étape et son moment",
    description: "Sept gestes d'ingénieur, dans l'ordre où ils servent.",
    blocs: [
      kodi("<p>Les ingénieurs font toujours les mêmes gestes, et toujours dans le même ordre.</p><p>Relie chaque geste à ce qu'il apporte.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque étape et son moment",
          instruction: "Touche un geste d'ingénieur, puis ce qu'il apporte.",
          left_label: "Le geste",
          right_label: "Ce qu'il apporte",
          pairs: [
            { left: "Écrire le plan en français",     right: "Penser la solution avant de la taper" },
            { left: "Découper en segments",           right: "Un morceau entre chaque virage" },
            { left: "Repérer ce qui se répète",       right: "Ce qu'on confiera à une boucle" },
            { left: "Compter les cases",              right: "Régler le nombre de tours" },
            { left: "Poser les blocs",                right: "Le dernier geste, pas le premier" },
            { left: "Relancer et regarder",           right: "Vérifier l'écart entre voulu et obtenu" },
            { left: "L'ordre des phases",             right: "La clé avant la porte, toujours" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Dans quelle phase ?",
    description: "Douze gestes. Trois phases, et un ordre qui compte.",
    blocs: [
      kodi("<p>La mission : la clé 🗝️ est en bas, la porte est au milieu, l'étoile ⭐ derrière.</p><p>Trois phases — <strong>descendre chercher</strong>, <strong>remonter</strong>, <strong>franchir et finir</strong>. À chaque geste sa phase.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Dans quelle phase ?",
          instruction: "Choisis un geste, puis sa phase.",
          bins: [
            { id: "1", emoji: "⬇️", label: "1. Chercher la clé", color: "#10b981" },
            { id: "2", emoji: "⬆️", label: "2. Remonter",        color: "#FDB813" },
            { id: "3", emoji: "🚪", label: "3. Franchir et finir", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "🗝️", label: "Ramasser la clé",                       correct: "1", hint: "C'est le but de la première phase." },
            { id: "b", emoji: "🔄", label: "Faire demi-tour après la clé",           correct: "2", hint: "On repart d'où l'on vient : c'est le début du retour." },
            { id: "c", emoji: "🚪", label: "Passer la porte",                        correct: "3", hint: "Impossible avant d'avoir la clé et d'être remonté." },
            { id: "d", emoji: "⬇️", label: "Descendre le couloir de gauche",         correct: "1", hint: "Le chemin vers la clé." },
            { id: "e", emoji: "⭐", label: "S'arrêter exactement sur l'étoile",       correct: "3", hint: "Le tout dernier geste de la mission." },
            { id: "f", emoji: "⬆️", label: "Remonter jusqu'au croisement",           correct: "2", hint: "On refait le chemin à l'envers." },
            { id: "g", emoji: "👀", label: "Repérer où est posée la clé",            correct: "1", hint: "Avant de bouger, on regarde : c'est encore la phase 1." },
            { id: "h", emoji: "🧭", label: "Se remettre face à la porte",            correct: "2", hint: "Fin du retour : on se replace avant de franchir." },
            { id: "i", emoji: "🔁", label: "Répéter les pas du couloir d'en bas",    correct: "1", hint: "La boucle de la descente appartient à la première phase." },
            { id: "j", emoji: "🧮", label: "Compter les cases jusqu'à l'étoile",     correct: "3", hint: "On compte juste avant de finir." },
            { id: "k", emoji: "↩️", label: "Tourner pour reprendre le couloir",      correct: "2", hint: "Encore un geste du retour." },
            { id: "l", emoji: "🏁", label: "Vérifier qu'on a bien la clé",           correct: "2", hint: "On s'en assure avant d'arriver à la porte — sinon tout est à refaire." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux plans dans le désordre",
    description: "Le bon geste, au mauvais moment.",
    blocs: [
      kodi("<p>Ces deux plans contiennent les bonnes phases — mais l'une d'elles est mal placée.</p><p>Un plan faux coûte plus cher qu'un bloc mal posé : on s'en aperçoit à la toute fin.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "La porte avant la clé",
        context: "Kirikou arrive devant la porte et ne peut pas l'ouvrir. Une phase demande l'impossible.",
        description: "Clique sur la phase impossible.",
        bug_index: 2,
        fix: "Ouvrir la porte avec la clé",
        explanation: "On ne traverse pas une porte fermée : il faut l'ouvrir, et pour l'ouvrir il faut la clé — ramassée juste avant. Une phase doit toujours être possible au moment où elle arrive.",
        instructions: [
          "Observer le labyrinthe en entier",
          "Descendre chercher et ramasser la clé 🗝️",
          "Traverser la porte fermée",
          "Rejoindre l'étoile ⭐",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Le plan qui compte trop tôt",
        context: "Une phase de ce plan demande de compter quelque chose que personne n'a encore regardé.",
        description: "Clique sur la phase impossible.",
        bug_index: 1,
        fix: "Compter les cases du chemin trouvé",
        explanation: "Compter des cases sans avoir regardé la grille ne veut rien dire. On observe, ensuite on compte, ensuite seulement on pose.",
        instructions: [
          "Observer le labyrinthe et trouver le chemin",
          "Compter les cases sans regarder la grille",
          "Descendre et ramasser la clé 🗝️",
          "Remonter, franchir la porte, finir sur l'étoile ⭐",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le plan raconté",
    description: "Six questions sur une mission à trois phases.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>La mission de Kirikou, écrite en français :</p>" +
            "<pre><code>Phase 1 — Descendre chercher la clé 🗝️\n" +
            "Phase 2 — Remonter jusqu'au couloir\n" +
            "Phase 3 — Traverser la porte et rejoindre l'étoile ⭐</code></pre>" +
            "<p>Trois phrases. Pas un seul bloc. C'est exactement ce qu'un ingénieur écrit en premier.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Le plan raconté",
          instruction: "Relis le plan affiché au-dessus, puis complète chaque phrase.",
          sentences: [
            { id: "s1", before: "Ce plan est écrit", after: ".",
              options: ["en français", "en blocs", "en chiffres"], correct: 0,
              explanation: "C'est le pseudocode : un plan en langage humain, avant le moindre bloc." },
            { id: "s2", before: "Si on inverse les phases 1 et 3, Kirikou", after: ".",
              options: ["butera sur la porte fermée", "gagnera plus vite", "fera la même chose"], correct: 0,
              explanation: "Sans la clé, la porte ne s'ouvre pas. L'ordre des phases est le cœur du plan." },
            { id: "s3", before: "Le nombre de cases de chaque phase se décide", after: ".",
              options: ["après avoir observé le labyrinthe", "avant de regarder", "au hasard"], correct: 0,
              explanation: "Observer, tracer, compter : toujours dans cet ordre." },
            { id: "s4", before: "Une phase, c'est", after: ".",
              options: ["un morceau de mission qui a un but", "un seul bloc", "un virage"], correct: 0,
              explanation: "On découpe une grande mission en petits morceaux qui ont chacun un but clair." },
            { id: "s5", before: "Si un morceau du chemin se répète, on", after: ".",
              options: ["le confie à une boucle", "l'écrit plusieurs fois", "l'ignore"], correct: 0,
              explanation: "Repérer ce qui se répète, c'est ce que tu as appris la séance dernière." },
            { id: "s6", before: "Les blocs se posent", after: ".",
              options: ["en dernier", "en premier", "pendant qu'on réfléchit"], correct: 0,
              explanation: "Poser avant d'avoir pensé fait perdre trois fois plus de temps. C'est toute la leçon du thème." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le Grand Plan",
    description: "Cinq phases, deux pièges. L'ordre fait tout.",
    blocs: [
      kodi("<p>À toi d'écrire le plan complet de la mission, avant le moindre bloc.</p><p>Deux cartes sont là pour te piéger : celles qui agissent sans avoir regardé, et celles qui inversent la clé et la porte.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le Grand Plan",
        description: "Sept cartes, cinq bonnes. Deux sont des pièges : laisse-les de côté.",
        consigne: "La clé est en bas, la porte au milieu, l'étoile derrière. Touche les cinq phases, dans l'ordre.",
        phases: [
          "Observer le labyrinthe en entier",
          "Descendre chercher la clé 🗝️",
          "Ramasser la clé",
          "Remonter jusqu'à la porte",
          "Traverser et finir sur l'étoile ⭐",
        ],
        distracteurs: [
          "Traverser la porte avant d'avoir la clé",
          "Poser des blocs tout de suite, on verra bien",
        ],
        explanation: "Observer d'abord, la clé ensuite, la porte après — et les blocs en dernier. Un plan juste, c'est un labyrinthe déjà à moitié résolu.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Dessine un U",
    description: "Ton programme laisse une trace. Fais-en un dessin.",
    blocs: [
      kodi("<p>Dernier défi du thème. Cette fois Kirikou <strong>laisse une trace</strong> derrière lui : ton programme ne produit plus un déplacement, il produit un <strong>dessin</strong>.</p><p>Descends de trois cases, traverse de trois cases, remonte de trois cases. La trace doit dessiner un <strong>U</strong>, exactement.</p>"),
      jeu({
        game_type: "maze",
        title: "Dessine un U",
        grid_size: 6,
        start: { x: 1, y: 1, dir: "S" },
        goal: { x: 4, y: 1 },
        walls: [],
        trail: true,
        target_trail: TRACE,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right", "controls_repeat_ext"],
        max_blocks: 12,
        steps: ["Écris ton plan avant de poser", "Trois lignes droites, deux virages"],
        instructions: "Ta trace doit dessiner un U : trois cases vers le bas, trois vers la droite, trois vers le haut. Douze blocs au maximum.",
      }),
    ],
  },
];

const u = EXOS.at(-1).blocs[1].content;
const chemin = cheminLabyrinthe(u);
if (chemin.erreur) throw new Error(`le U : ${chemin.erreur}`);
console.log(`✓ le U : trace continue de ${TRACE.length} cases, ${u.max_blocks} blocs autorisés`);

verifier(EXOS, {
  interdits: [/print\(/, /\bdef\b/],
  comptes: { "Plan, ou déjà du code ?": 12, "Chaque étape et son moment": 7, "Dans quelle phase ?": 12, "Le plan raconté": 6 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
