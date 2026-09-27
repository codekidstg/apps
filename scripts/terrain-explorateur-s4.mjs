/**
 * Le Terrain — Explorateur, séance 4 « Le débogage — Deviens détective du code ».
 *
 *     node scripts/terrain-explorateur-s4.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : un bug est un écart entre ce qu'on voulait et
 * ce qu'on a écrit ; les trois familles — mauvaise instruction, mauvaise
 * direction, mauvais compte ; et la méthode du détective : lire, tracer avec
 * le doigt, comparer, corriger.
 *
 * Disponible : avancer, ramasser, tourner, les quatre directions.
 * Pas encore vu, donc interdit : la répétition, les motifs, tout code écrit.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, cheminLabyrinthe } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Le débogage — Deviens détective du code";

// Un L : trois cases vers la droite, puis trois vers le bas.
const MURS_L = (() => {
  const libres = new Set();
  for (let x = 0; x <= 3; x++) libres.add(`${x},0`);
  for (let y = 0; y <= 3; y++) libres.add(`3,${y}`);
  const murs = [];
  for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if (!libres.has(`${x},${y}`)) murs.push({ x, y });
  return murs;
})();

const EXOS = [
  {
    palier: 1,
    title: "Quel genre de bug ?",
    description: "Douze pannes. Trois familles seulement.",
    blocs: [
      kodi("<p>Presque tous les bugs de Kirikou tiennent en trois familles : il fait <strong>la mauvaise action</strong>, il part <strong>du mauvais côté</strong>, ou il compte <strong>mal ses cases</strong>.</p><p>Savoir dans quelle famille on est, c'est déjà la moitié du travail.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Quel genre de bug ?",
          instruction: "Choisis un symptôme, puis sa famille.",
          bins: [
            { id: "action",    emoji: "🔴", label: "Mauvaise action",    color: "#ef4444" },
            { id: "direction", emoji: "🧭", label: "Mauvaise direction", color: "#a78bfa" },
            { id: "compte",    emoji: "🔢", label: "Mauvais compte",     color: "#FDB813" },
          ],
          items: [
            { id: "a", emoji: "💎", label: "Il passe sur la gemme sans la prendre",          correct: "action",    hint: "L'instruction Ramasser manque : ce n'est ni un problème de côté ni de nombre." },
            { id: "b", emoji: "↩️", label: "Il part vers le haut au lieu du bas",            correct: "direction", hint: "Le virage a été fait du mauvais côté." },
            { id: "c", emoji: "🧱", label: "Il s'arrête une case avant l'étoile",            correct: "compte",    hint: "Un Avancer de moins : le compte est faux." },
            { id: "d", emoji: "🕳️", label: "Il dépasse l'étoile et tombe dans le puits",      correct: "compte",    hint: "Un Avancer de trop. Le chemin était bon." },
            { id: "e", emoji: "🔁", label: "Il tourne alors qu'il devait avancer",           correct: "action",    hint: "Ce n'est pas la bonne instruction du tout." },
            { id: "f", emoji: "⬅️", label: "Il tourne à gauche au lieu de droite",           correct: "direction", hint: "La famille la plus visible : il part à l'opposé." },
            { id: "g", emoji: "🐌", label: "Il fait deux cases au lieu de cinq",             correct: "compte",    hint: "Trois Avancer manquants." },
            { id: "h", emoji: "🌀", label: "Il tourne deux fois et se retrouve à l'envers",  correct: "direction", hint: "Deux virages du même côté font un demi-tour : direction perdue." },
            { id: "i", emoji: "🤲", label: "Il ramasse alors qu'il n'y a rien sous lui",     correct: "action",    hint: "L'action est inutile ici : elle ne fait rien et fait perdre un bloc." },
            { id: "j", emoji: "🚶", label: "Il avance alors qu'il devait ramasser",          correct: "action",    hint: "La bonne case, la mauvaise instruction." },
            { id: "k", emoji: "🧮", label: "Il tourne au bon endroit mais une case trop tôt", correct: "compte",    hint: "Le côté est bon, c'est le moment qui est faux : un Avancer manque avant." },
            { id: "l", emoji: "🔄", label: "Il finit face au mur, dos à l'étoile",           correct: "direction", hint: "Son regard n'est pas là où il devrait être." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque symptôme et son remède",
    description: "Sept pannes, sept gestes pour les réparer.",
    blocs: [
      kodi("<p>Un programme ne se trompe jamais : il fait exactement ce qui est écrit. Le bug est toujours entre ce que tu voulais et ce que tu as écrit.</p><p>À chaque panne, son remède.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque symptôme et son remède",
          instruction: "Touche une panne, puis le geste qui la répare.",
          left_label: "La panne",
          right_label: "Le remède",
          pairs: [
            { left: "Il s'arrête une case trop tôt",        right: "Ajouter un Avancer" },
            { left: "Il dépasse d'une case",                right: "Enlever un Avancer" },
            { left: "Il part du mauvais côté",              right: "Changer le sens du virage" },
            { left: "Il arrive les mains vides",            right: "Ajouter un Ramasser sur la bonne case" },
            { left: "Il tourne trop tôt",                   right: "Déplacer le virage plus loin" },
            { left: "Lire le programme pas à pas",          right: "La première chose à faire avant de corriger" },
            { left: "Comparer ce qu'on voulait et ce qu'on voit", right: "C'est là que le bug se cache" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Où ça a dérapé ?",
    description: "Six questions sur un programme qui rate de peu.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Kirikou part du coin en haut à gauche, face à l'<strong>Est</strong>. L'étoile ⭐ est à trois cases vers la droite, puis trois cases vers le bas.</p>" +
            "<p>Voici le programme qu'il a reçu :</p>" +
            "<pre><code>1  Avancer\n2  Avancer\n3  Tourner à droite\n4  Avancer\n5  Avancer\n6  Avancer</code></pre>" +
            "<p>Trace-le avec ton doigt avant de répondre.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Le rapport du détective",
          instruction: "Complète ton rapport : six phrases sur le programme affiché juste au-dessus.",
          sentences: [
            { id: "s1", before: "Avant de tourner, Kirikou a fait", after: "cases vers la droite.",
              options: ["2", "3", "4"], correct: 0,
              explanation: "Deux Avancer seulement, lignes 1 et 2." },
            { id: "s2", before: "Il en fallait", after: "avant le virage.",
              options: ["3", "2", "1"], correct: 0,
              explanation: "L'étoile est à trois cases vers la droite : il manque un Avancer." },
            { id: "s3", before: "Le virage de la ligne 3 est", after: ".",
              options: ["du bon côté", "du mauvais côté", "inutile"], correct: 0,
              explanation: "Depuis l'Est, tourner à droite mène au Sud — vers le bas. C'est bien ce qu'il fallait." },
            { id: "s4", before: "Ce bug appartient donc à la famille", after: ".",
              options: ["mauvais compte", "mauvaise direction", "mauvaise action"], correct: 0,
              explanation: "Le côté est bon, l'action est bonne : c'est le nombre de cases qui est faux." },
            { id: "s5", before: "Pour réparer, il faut", after: ".",
              options: ["ajouter un Avancer avant la ligne 3", "changer le virage", "enlever un Avancer"], correct: 0,
              explanation: "Un Avancer de plus avant le virage, et le chemin retombe juste." },
            { id: "s6", before: "Kirikou a fini", after: "de l'étoile.",
              options: ["une case à gauche", "une case en dessous", "juste au-dessus"], correct: 0,
              explanation: "Il a tourné une case trop tôt : sa descente s'est faite dans la mauvaise colonne." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux enquêtes",
    description: "Une panne de direction, une panne de compte.",
    blocs: [
      kodi("<p>Deux programmes, deux familles de bug. Une seule ligne fausse dans chacun — et cette fois, dis-toi bien de quelle famille il s'agit avant de cliquer.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "L'enquête du puits",
        context: "Kirikou devait s'arrêter sur l'étoile après quatre cases. Il est tombé dans le puits, une case plus loin.",
        description: "Clique sur la ligne en trop.",
        bug_index: 4,
        fix: "(rien — cette ligne était en trop)",
        explanation: "Quatre Avancer suffisaient. Le cinquième l'a fait dépasser : famille « mauvais compte ».",
        instructions: ["Avancer", "Avancer", "Avancer", "Avancer", "Avancer"],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "L'enquête du mur",
        context: "Kirikou regardait l'Est. Il devait descendre après deux cases ; il est parti vers le haut et s'est cogné.",
        description: "Clique sur la ligne fausse.",
        bug_index: 2,
        fix: "Tourner à droite",
        explanation: "Depuis l'Est, la gauche mène au Nord — vers le haut. C'est la famille « mauvaise direction ».",
        instructions: ["Avancer", "Avancer", "Tourner à gauche", "Avancer", "Avancer"],
      }),
    ],
  },

  {
    palier: 2,
    title: "La méthode du détective",
    description: "Quatre gestes, toujours dans le même ordre.",
    blocs: [
      kodi("<p>Devant un programme qui rate, les développeurs font toujours les mêmes gestes, dans le même ordre.</p><p>Remets-les — et souviens-toi qu'on ne corrige jamais avant d'avoir compris.</p>"),
      jeu({
        game_type: "sort",
        title: "La méthode du détective",
        description: "Quatre gestes, un seul ordre efficace.",
        hint: "Corriger avant d'avoir compris, c'est réparer au hasard.",
        items: [
          "Lire le programme, instruction par instruction",
          "Tracer le chemin avec son doigt",
          "Comparer ce qu'on voulait et ce qu'on obtient",
          "Corriger la ligne fautive, et seulement elle",
        ],
      }),
    ],
  },

  {
    palier: 3,
    title: "Le rapport d'enquête",
    description: "Écris ton plan de réparation avant de toucher au programme.",
    blocs: [
      kodi("<p>Un vrai détective écrit son rapport avant d'agir.</p><p>Compose les phases de l'enquête. Deux cartes sont là pour te piéger : ce sont celles où l'on agit sans avoir compris.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le rapport d'enquête",
        description: "Sept cartes, cinq bonnes. Deux sont des pièges : laisse-les de côté.",
        consigne: "Un programme rate et tu dois trouver pourquoi. Touche les cinq gestes de l'enquête, dans l'ordre.",
        phases: [
          "Lire le programme en entier",
          "Tracer le chemin de Kirikou avec le doigt",
          "Repérer la ligne où il quitte le bon chemin",
          "Dire à quelle famille appartient le bug",
          "Corriger cette ligne, et relancer",
        ],
        distracteurs: [
          "Tout effacer et recommencer de zéro",
          "Changer une ligne au hasard pour voir",
        ],
        explanation: "On lit, on trace, on compare, on corrige — et on ne touche qu'à la ligne fautive. Tout effacer fait perdre ce qui marchait déjà.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Le programme corrigé",
    description: "Tu sais où était le bug. Écris la version juste.",
    blocs: [
      kodi("<p>Dernier défi : plus de programme à réparer, c'est à toi de l'écrire — et du premier coup si tu comptes bien.</p><p>Trois cases vers la droite, puis trois vers le bas. Trace du doigt, compte, puis pose.</p>"),
      jeu({
        game_type: "maze",
        title: "Le programme corrigé",
        grid_size: 6,
        start: { x: 0, y: 0, dir: "E" },
        goal: { x: 3, y: 3 },
        walls: MURS_L,
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
        max_blocks: 9,
        steps: ["Trois cases, un virage, trois cases", "Compte avant de poser"],
        instructions: "Guide Kirikou jusqu'à l'étoile ⭐. Neuf blocs au maximum : il n'y a pas de place pour un pas de trop.",
      }),
    ],
  },
];

const l = EXOS.at(-1).blocs[1].content;
const chemin = cheminLabyrinthe(l);
if (chemin.erreur) throw new Error(`le L : ${chemin.erreur}`);
console.log(`✓ le programme corrigé : chemin de ${chemin.pas} cases, ${l.max_blocks} blocs autorisés`);

verifier(EXOS, {
  interdits: [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/],
  comptes: { "Quel genre de bug ?": 12, "Chaque symptôme et son remède": 7, "Où ça a dérapé ?": 6 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
