/**
 * Le Terrain — Explorateur, séance 5 « La répétition ».
 *
 *     node scripts/terrain-explorateur-s5.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : le bloc Répéter N fois, la traduction entre
 * version longue et version courte, le fait que Tourner ne déplace pas, et une
 * contrainte de blocs qui rend la boucle obligatoire. La musique aussi se
 * répète : un motif joué plusieurs fois.
 *
 * Pas encore vu, donc interdit : le mot « motif » et le découpage d'un chemin
 * en motifs (séance 6), tout code écrit.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, cheminLabyrinthe } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La répétition — Kirikou dit moins pour faire plus";

// ── Les programmes à compter, et leur résultat calculé, pas recopié ───────
const PROGS = [
  ["a", 4, ["A"]],                     ["b", 2, ["A", "A"]],
  ["c", 3, ["A", "A"]],                ["d", 2, ["A", "A", "A"]],
  ["e", 4, ["A", "A"]],                ["f", 8, ["A"]],
  ["g", 4, ["A", "T"]],                ["h", 3, ["T", "A", "A"]],
  ["i", 6, ["A"]],                     ["j", 2, ["A", "T", "A", "A"]],
  ["k", 8, ["T", "A"]],                ["l", 2, ["A", "A", "T", "A"]],
];
const cases = (n, corps) => n * corps.filter((c) => c === "A").length;
const lisible = (n, corps) => `Répéter ${n} fois : ` + corps.map((c) => (c === "A" ? "Avancer" : "Tourner")).join(", ");
const items = PROGS.map(([id, n, corps]) => {
  const total = cases(n, corps);
  const tourne = corps.includes("T");
  return {
    id, emoji: "🔁", label: lisible(n, corps), correct: String(total),
    hint: tourne
      ? `${corps.filter((c) => c === "A").length} Avancer par tour × ${n} tours = ${total}. Les Tourner ne déplacent personne.`
      : `${corps.length} Avancer par tour × ${n} tours = ${total}.`,
  };
});
for (const [id, n, corps] of PROGS) if (![4, 6, 8].includes(cases(n, corps))) throw new Error(`${id} donne ${cases(n, corps)} cases, hors des bacs`);

// Un couloir droit de sept cases : sans Répéter il faudrait sept blocs.
const TAILLE = 8;
const MURS = [];
for (let x = 0; x < TAILLE; x++) for (let y = 1; y < TAILLE; y++) MURS.push({ x, y });

const EXOS = [
  {
    palier: 1,
    title: "Combien de cases ?",
    description: "Douze boucles. Attention à celles qui tournent.",
    blocs: [
      kodi("<p><strong>Répéter 3 fois : Avancer, Avancer</strong> ne veut pas dire trois cases : ça veut dire deux cases, trois fois.</p><p>Et souviens-toi que <strong>Tourner ne déplace pas</strong> Kirikou d'un pouce.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de cases parcourues ?",
          instruction: "Choisis un programme, puis son nombre de cases.",
          bins: [
            { id: "4", emoji: "4️⃣", label: "4 cases", color: "#10b981" },
            { id: "6", emoji: "6️⃣", label: "6 cases", color: "#FDB813" },
            { id: "8", emoji: "8️⃣", label: "8 cases", color: "#a78bfa" },
          ],
          items,
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Version longue, version courte",
    description: "Sept programmes. Les mêmes, dits deux fois.",
    blocs: [
      kodi("<p>Un bon programme dit la même chose avec moins de mots.</p><p>Relie chaque version longue à sa version courte.</p>"),
      {
        type: "match",
        content: {
          title: "La même chose, en plus court",
          pairs: [
            { left: "Avancer ×5",                              right: "Répéter 5 fois : Avancer" },
            { left: "Avancer, Avancer, Avancer",               right: "Répéter 3 fois : Avancer" },
            { left: "Avancer, Tourner, Avancer, Tourner",      right: "Répéter 2 fois : Avancer, Tourner" },
            { left: "Ramasser, Ramasser",                      right: "Répéter 2 fois : Ramasser" },
            { left: "Avancer ×6, puis Ramasser une seule fois", right: "Répéter 6 fois : Avancer — puis Ramasser en dehors" },
            { left: "Avancer, Avancer, Tourner, ×3",           right: "Répéter 3 fois : Avancer, Avancer, Tourner" },
            { left: "Avancer une seule fois",                  right: "Pas besoin de Répéter du tout" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Déroule la boucle",
    description: "Six questions sur une boucle de trois tours.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Kirikou part face à l'<strong>Est</strong> et reçoit ceci :</p>" +
            "<pre><code>Répéter 3 fois :\n    Avancer\n    Avancer\n    Tourner à droite</code></pre>" +
            "<p>Déroule-la dans ta tête, tour par tour, avec ton doigt.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule la boucle",
          sentences: [
            { id: "s1", before: "À chaque tour, Kirikou avance de", after: "cases.",
              options: ["2", "3", "1"], correct: 0,
              explanation: "Deux Avancer par tour. Le Tourner ne compte pas en cases." },
            { id: "s2", before: "En tout, il parcourt", after: "cases.",
              options: ["6", "9", "3"], correct: 0,
              explanation: "Deux cases par tour × trois tours = six." },
            { id: "s3", before: "Il tourne", after: "fois en tout.",
              options: ["3", "1", "6"], correct: 0,
              explanation: "Un Tourner par tour, et il y a trois tours." },
            { id: "s4", before: "Après le premier tour, il regarde vers", after: ".",
              options: ["le Sud", "l'Est", "le Nord"], correct: 0,
              explanation: "Il partait vers l'Est ; un quart de tour à droite le met face au Sud." },
            { id: "s5", before: "La version longue de ce programme ferait", after: "lignes.",
              options: ["9", "3", "6"], correct: 0,
              explanation: "Trois instructions par tour × trois tours = neuf lignes. Voilà ce que la boucle économise." },
            { id: "s6", before: "Le chemin dessiné ressemble à", after: ".",
              options: ["un escalier qui tourne", "une ligne droite", "un cercle parfait"], correct: 0,
              explanation: "Deux cases puis un virage, trois fois : le chemin tourne à chaque marche." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux boucles mal posées",
    description: "L'une englobe trop, l'autre compte faux.",
    blocs: [
      kodi("<p>Une boucle mal posée ne devient jamais rouge : Kirikou part simplement ailleurs.</p><p>Une seule ligne est fausse dans chacun de ces deux programmes.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui englobe trop",
        context: "Kirikou devait avancer de quatre cases, puis ramasser UNE fois la gemme au bout. Il a essayé de ramasser à chaque pas.",
        description: "Clique sur la ligne mal placée.",
        bug_index: 2,
        fix: "(cette ligne devait être en dehors de la boucle)",
        explanation: "Ramasser n'avait aucune raison de se répéter : il n'y a qu'une gemme, tout au bout. Ce qui ne se répète pas s'écrit en dehors.",
        instructions: ["Répéter 4 fois :", "    Avancer", "    Ramasser"],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui compte faux",
        context: "Le couloir fait six cases. Kirikou s'arrête à la quatrième.",
        description: "Clique sur la ligne fausse.",
        bug_index: 0,
        fix: "Répéter 6 fois :",
        explanation: "La boucle était bien construite : c'est son nombre de tours qui était faux. Compter les cases AVANT de poser la boucle évite ça.",
        instructions: ["Répéter 4 fois :", "    Avancer"],
      }),
    ],
  },

  {
    palier: 2,
    title: "Est-ce que ça fait pareil ?",
    description: "Douze couples. Même résultat, ou pas ?",
    blocs: [
      kodi("<p>Pour chaque couple, une version longue et une version courte.</p><p>Fais-les tourner toutes les deux dans ta tête : arrivent-elles au même endroit ?</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça fait pareil ?",
          instruction: "Les deux versions donnent-elles le même résultat ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Compte les Avancer de chaque côté : ils doivent être en même nombre.",
              "Compte aussi les Tourner : le même nombre, et au même moment.",
              "Ce qui est décalé sous Répéter se répète ; le reste ne passe qu'une fois.",
              "Un Tourner ne déplace pas, mais il change tout ce qui suit.",
            ],
          },
          categories: [
            { id: "oui", label: "Ça fait pareil", emoji: "🟰", color: "#10b981" },
            { id: "non", label: "Pas pareil",     emoji: "🚫", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Avancer ×3   ↔   Répéter 3 fois : Avancer",                  correct: "oui", hint: "Trois Avancer des deux côtés." },
            { id: "b", emoji: "2️⃣", label: "Avancer ×4   ↔   Répéter 2 fois : Avancer, Avancer",         correct: "oui", hint: "Deux par tour × deux tours = quatre." },
            { id: "c", emoji: "3️⃣", label: "Avancer ×6   ↔   Répéter 3 fois : Avancer",                  correct: "non", hint: "La version courte n'en fait que trois. Il en manque la moitié." },
            { id: "d", emoji: "4️⃣", label: "Avancer, Tourner ×2   ↔   Répéter 2 fois : Avancer, Tourner", correct: "oui", hint: "Même corps, même nombre de tours." },
            { id: "e", emoji: "5️⃣", label: "Avancer ×5   ↔   Répéter 5 fois : Avancer, Tourner",          correct: "non", hint: "La version courte ajoute cinq virages qui n'existaient pas." },
            { id: "f", emoji: "6️⃣", label: "Ramasser ×2   ↔   Répéter 2 fois : Ramasser",                 correct: "oui", hint: "Deux fois le même geste, des deux côtés." },
            { id: "g", emoji: "7️⃣", label: "Avancer ×4, Ramasser   ↔   Répéter 4 fois : Avancer, Ramasser", correct: "non", hint: "À droite, Ramasser est dans la boucle : il passerait quatre fois." },
            { id: "h", emoji: "8️⃣", label: "Avancer ×2, Tourner, Avancer ×2   ↔   Répéter 2 fois : Avancer", correct: "non", hint: "La version courte a perdu le virage et deux cases." },
            { id: "i", emoji: "9️⃣", label: "Avancer ×8   ↔   Répéter 4 fois : Avancer, Avancer",          correct: "oui", hint: "Deux par tour × quatre tours = huit." },
            { id: "j", emoji: "🔟", label: "Tourner ×2   ↔   Répéter 2 fois : Tourner",                   correct: "oui", hint: "Deux virages des deux côtés — et toujours zéro case." },
            { id: "k", emoji: "🅰️", label: "Avancer ×3, Ramasser   ↔   Répéter 3 fois : Avancer — puis Ramasser", correct: "oui", hint: "Ramasser est bien en dehors de la boucle : il ne passe qu'une fois." },
            { id: "l", emoji: "🅱️", label: "Avancer ×9   ↔   Répéter 3 fois : Avancer, Avancer, Avancer", correct: "oui", hint: "Trois par tour × trois tours = neuf." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Cinq blocs, pas un de plus",
    description: "Sept cases à parcourir. Sans boucle, c'est impossible.",
    blocs: [
      kodi("<p>Le couloir fait <strong>sept cases</strong>. Tu n'as droit qu'à <strong>cinq blocs</strong>.</p><p>Sans Répéter, il en faudrait sept : la boucle n'est plus un confort, elle est la seule issue. Souviens-toi que le bloc Répéter arrive avec son nombre.</p>"),
      jeu({
        game_type: "maze",
        title: "Cinq blocs, pas un de plus",
        grid_size: TAILLE,
        start: { x: 0, y: 0, dir: "E" },
        goal: { x: 7, y: 0 },
        walls: MURS,
        available_blocks: ["robot_move", "controls_repeat_ext"],
        max_blocks: 5,
        steps: ["Compte les cases du couloir", "Un seul Répéter suffit"],
        instructions: "Sept cases jusqu'à l'étoile ⭐, cinq blocs au maximum. Utilise Répéter.",
      }),
    ],
  },

  {
    palier: 3,
    title: "Le refrain du griot",
    description: "Six sons au moins, quatre blocs au plus.",
    blocs: [
      kodi("<p>Un rythme de griot, c'est un morceau qui revient — exactement comme un couloir qu'on répète.</p><p>Il te faut <strong>au moins six sons</strong> et tu n'as que <strong>quatre blocs</strong>. Écoute avant de poser : un bon rythme se reconnaît à l'oreille.</p>"),
      jeu({
        game_type: "music",
        title: "Le refrain du griot",
        free_mode: true,
        tempo: 360,
        min_notes: 6,
        max_blocks: 4,
        available_blocks: ["music_drum", "music_pause", "controls_repeat_ext"],
        instructions: "Compose un rythme d'au moins six sons avec quatre blocs au plus. Sans Répéter, c'est impossible — écoute ce que ça donne.",
      }),
    ],
  },
];

const couloir = EXOS.find((e) => e.title === "Cinq blocs, pas un de plus").blocs[1].content;
const chemin = cheminLabyrinthe(couloir);
if (chemin.erreur) throw new Error(`le couloir : ${chemin.erreur}`);
if (chemin.pas <= couloir.max_blocks) throw new Error(`le couloir se franchit en ${chemin.pas} blocs sans boucle : la contrainte ne force rien`);
console.log(`✓ le couloir : ${chemin.pas} cases pour ${couloir.max_blocks} blocs — la boucle est obligatoire`);

verifier(EXOS, {
  interdits: [/\bmotif\b/i, /print\(/, /\bdef\b/],
  comptes: { "Combien de cases ?": 12, "Version longue, version courte": 7, "Déroule la boucle": 6, "Est-ce que ça fait pareil ?": 12 },
});
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
