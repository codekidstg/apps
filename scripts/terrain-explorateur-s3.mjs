/**
 * Le Terrain — Explorateur, séance 3 « Gauche ou droite ? ».
 *
 *     node scripts/terrain-explorateur-s3.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : les quatre directions par rapport à l'écran
 * (Nord en haut, Sud en bas, Est à droite, Ouest à gauche), l'astuce de la
 * main, le cycle des virages — on peut prédire où l'on regardera sans bouger —
 * et la différence entre Avancer, qui change de case, et Tourner, qui change
 * de direction sans bouger.
 *
 * Pas encore vu, donc interdit : la répétition, les motifs, tout code écrit.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, cheminLabyrinthe } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Gauche ou droite ?";

// ── Garde-fou : le cycle des directions, calculé plutôt que recopié ────────
const ORDRE = ["N", "E", "S", "O"];            // sens des aiguilles d'une montre
const NOM = { N: "Nord", E: "Est", S: "Sud", O: "Ouest" };
const tourner = (d, sens) => ORDRE[(ORDRE.indexOf(d) + (sens === "droite" ? 1 : 3)) % 4];
if (tourner("N", "droite") !== "E" || tourner("N", "gauche") !== "O" || tourner(tourner("N", "droite"), "droite") !== "S")
  throw new Error("le cycle des directions est faux");

const VIRAGES = [
  ["a", "N", ["droite"]], ["b", "N", ["gauche"]], ["c", "E", ["droite"]],
  ["d", "E", ["gauche"]], ["e", "S", ["droite"]], ["f", "O", ["gauche"]],
  ["g", "N", ["droite", "droite"]], ["h", "E", ["gauche", "gauche"]],
  ["i", "S", ["droite", "droite", "droite"]], ["j", "O", ["droite", "droite"]],
  ["k", "E", ["droite", "droite", "droite"]], ["l", "N", ["gauche", "gauche", "gauche"]],
];
const items = VIRAGES.map(([id, depart, sens]) => {
  const arrivee = sens.reduce((d, s) => tourner(d, s), depart);
  const liste = sens.map((s) => `tourne à ${s}`).join(", puis ");
  return {
    id, emoji: "🧭",
    label: `Il regarde le ${NOM[depart]} et ${liste}`,
    correct: arrivee,
    hint: sens.length === 1
      ? `Un seul quart de tour depuis le ${NOM[depart]} : il regarde le ${NOM[arrivee]}.`
      : `${sens.length} quarts de tour depuis le ${NOM[depart]} : ${sens.reduce((acc, s) => { acc.push(tourner(acc[acc.length - 1], s)); return acc; }, [depart]).map((d) => NOM[d]).join(" → ")}.`,
  };
});

const EXOS = [
  {
    palier: 1,
    title: "Après le virage, il regarde où ?",
    description: "Douze virages. La boussole se tient dans la tête.",
    blocs: [
      kodi("<p>Tourner ne déplace pas Kirikou : ça change seulement ce qu'il a devant lui.</p><p>Les quatre directions tournent toujours dans le même ordre. Avec l'astuce de la main, tu peux prédire chaque virage sans bouger d'un pouce.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Il regarde où, maintenant ?",
          instruction: "Choisis un virage, puis la direction d'arrivée.",
          bins: [
            { id: "N", emoji: "⬆️", label: "Nord",  color: "#60a5fa" },
            { id: "E", emoji: "➡️", label: "Est",   color: "#10b981" },
            { id: "S", emoji: "⬇️", label: "Sud",   color: "#FDB813" },
            { id: "O", emoji: "⬅️", label: "Ouest", color: "#a78bfa" },
          ],
          items,
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque direction et sa place",
    description: "Sept repères. Deux gestes qui ne font pas du tout la même chose.",
    blocs: [
      kodi("<p>Les directions sont <strong>par rapport à l'écran</strong>, jamais par rapport à toi.</p><p>Et attention aux deux premiers : l'un change de case, l'autre change de regard.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque direction et sa place",
          pairs: [
            { left: "Avancer",             right: "Il change de case, pas de direction" },
            { left: "Tourner à droite",    right: "Il change de direction, sans bouger de case" },
            { left: "Nord",                right: "Le haut de l'écran" },
            { left: "Sud",                 right: "Le bas de l'écran" },
            { left: "Est",                 right: "La droite de l'écran" },
            { left: "Ouest",               right: "La gauche de l'écran" },
            { left: "Deux virages du même côté", right: "Il fait demi-tour" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens la boussole",
    description: "Six étapes. Suis Kirikou sans le regarder.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Kirikou démarre face à l'<strong>Est</strong>. Il reçoit ce programme :</p>" +
            "<pre><code>Avancer\nTourner à droite\nAvancer\nTourner à gauche\nAvancer</code></pre>" +
            "<p>Ne regarde pas l'écran du jeu : suis-le dans ta tête.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Deviens la boussole",
          sentences: [
            { id: "s1", before: "Après le premier Avancer, il regarde toujours vers", after: ".",
              options: ["l'Est", "le Sud", "le Nord"], correct: 0,
              explanation: "Avancer ne change jamais la direction du regard." },
            { id: "s2", before: "Après Tourner à droite depuis l'Est, il regarde vers", after: ".",
              options: ["le Sud", "le Nord", "l'Ouest"], correct: 0,
              explanation: "Le cycle va Nord → Est → Sud → Ouest. Depuis l'Est, un quart de tour à droite mène au Sud." },
            { id: "s3", before: "Le deuxième Avancer le fait donc descendre vers", after: ".",
              options: ["le bas de l'écran", "la droite de l'écran", "le haut de l'écran"], correct: 0,
              explanation: "Il avance dans la direction qu'il regarde : le Sud, c'est le bas." },
            { id: "s4", before: "Après Tourner à gauche depuis le Sud, il regarde vers", after: ".",
              options: ["l'Est", "l'Ouest", "le Nord"], correct: 0,
              explanation: "À gauche, on remonte le cycle : depuis le Sud, on revient à l'Est." },
            { id: "s5", before: "En tout, Kirikou a changé de case", after: "fois.",
              options: ["3", "5", "2"], correct: 0,
              explanation: "Trois Avancer. Les deux Tourner ne l'ont pas déplacé d'un pouce." },
            { id: "s6", before: "Le chemin qu'il a tracé ressemble à", after: ".",
              options: ["une marche d'escalier", "une ligne droite", "un cercle"], correct: 0,
              explanation: "Droite, puis bas, puis droite : c'est exactement une marche." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux virages ratés",
    description: "Le mauvais côté, et le mauvais moment.",
    blocs: [
      kodi("<p>Kirikou démarre face à l'<strong>Est</strong> et doit descendre vers l'étoile après trois cases.</p><p>Deux programmes le ratent. Une seule ligne est fausse dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le mauvais côté",
        context: "Kirikou devait descendre après trois cases. Il est remonté vers le haut de l'écran.",
        description: "Clique sur la ligne fausse.",
        bug_index: 3,
        fix: "Tourner à droite",
        explanation: "Depuis l'Est, c'est à droite qu'on va vers le Sud — vers le bas. À gauche, on part vers le Nord.",
        instructions: ["Avancer", "Avancer", "Avancer", "Tourner à gauche", "Avancer"],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Le mauvais moment",
        context: "Le virage est du bon côté, mais Kirikou descend trop tôt et se cogne au mur.",
        description: "Clique sur la ligne fausse.",
        bug_index: 1,
        fix: "Avancer",
        explanation: "Il fallait trois cases avant de tourner. Ici le virage arrive après une seule : c'est un bug de compte, pas de direction.",
        instructions: ["Avancer", "Tourner à droite", "Avancer", "Avancer", "Avancer"],
      }),
    ],
  },

  {
    palier: 2,
    title: "Remets le virage en ordre",
    description: "Cinq instructions mélangées, un seul chemin juste.",
    blocs: [
      kodi("<p>Kirikou part face à l'<strong>Est</strong>. L'étoile est <strong>deux cases à droite, puis deux cases plus bas</strong>.</p><p>Ces cinq instructions sont les bonnes — elles sont juste dans le désordre.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets le virage en ordre",
        description: "Deux cases vers la droite, un virage, deux cases vers le bas.",
        hint: "On tourne une seule fois, et seulement après avoir fini les cases de droite.",
        items: [
          "Avancer (1re case vers la droite)",
          "Avancer (2e case vers la droite)",
          "Tourner à droite",
          "Avancer (1re case vers le bas)",
          "Avancer (2e case vers le bas)",
        ],
      }),
    ],
  },

  {
    palier: 3,
    title: "Le plan du serpent",
    description: "Deux virages. Écris le plan avant de poser les blocs.",
    blocs: [
      kodi("<p>Le chemin fait un <strong>S</strong> : à droite, puis en bas, puis à gauche.</p><p>Compose le plan. Deux cartes sont là pour te piéger — celles qui posent des blocs avant d'avoir compté.</p>"),
      jeu({
        game_type: "plan_builder",
        title: "Le plan du serpent",
        description: "Compose les phases dans l'ordre.",
        phases: [
          "Observer le labyrinthe et trouver le chemin",
          "Compter les cases de la première ligne",
          "Avancer, puis tourner vers le bas",
          "Compter les cases de la descente",
          "Avancer, tourner, et finir sur l'étoile ⭐",
        ],
        distracteurs: [
          "Poser des blocs au hasard pour voir ce qui se passe",
          "Tourner d'abord, on comptera après",
        ],
        explanation: "Observer, tracer, compter : les trois étapes de la méthode. Poser des blocs sans avoir compté, c'est perdre trois fois plus de temps.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Le grand U",
    description: "Trois lignes droites, deux virages, une seule issue.",
    blocs: [
      kodi("<p>Dernier défi : un couloir en <strong>U</strong>. On descend à droite, puis on revient vers la gauche.</p><p>Trace le chemin du doigt et compte chaque ligne droite <em>avant</em> de poser le premier bloc.</p>"),
      jeu({
        game_type: "maze",
        title: "Le grand U",
        grid_size: 6,
        start: { x: 0, y: 0, dir: "E" },
        goal: { x: 0, y: 2 },
        walls: (() => {
          const libres = new Set();
          for (let x = 0; x <= 3; x++) libres.add(`${x},0`);   // la ligne du haut
          for (let y = 0; y <= 2; y++) libres.add(`3,${y}`);   // la descente
          for (let x = 0; x <= 3; x++) libres.add(`${x},2`);   // le retour
          const murs = [];
          for (let x = 0; x < 6; x++) for (let y = 0; y < 6; y++) if (!libres.has(`${x},${y}`)) murs.push({ x, y });
          return murs;
        })(),
        available_blocks: ["robot_move", "robot_turn_left", "robot_turn_right"],
        max_blocks: 12,
        steps: ["Trois lignes droites, deux virages", "Compte chaque ligne avant de poser"],
        instructions: "Suis le couloir en U jusqu'à l'étoile ⭐. Douze blocs au maximum : compte bien.",
      }),
    ],
  },
];

// Le U doit réellement se franchir, et le budget doit suffire.
const u = EXOS.at(-1).blocs[1].content;
const chemin = cheminLabyrinthe(u);
if (chemin.erreur) throw new Error(`le grand U : ${chemin.erreur}`);
console.log(`✓ le grand U : chemin de ${chemin.pas} cases, ${u.max_blocks} blocs autorisés`);

verifier(EXOS, {
  interdits: [/\bboucle\b/i, /répéter/i, /\bmotif\b/i, /print\(/, /\bdef\b/],
  comptes: { "Après le virage, il regarde où ?": 12, "Chaque direction et sa place": 7, "Deviens la boussole": 6 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
