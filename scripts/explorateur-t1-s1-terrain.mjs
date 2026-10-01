/**
 * Explorateur — thème 1 séance 1 « Le tambour qui répète » : le Terrain.
 *
 *     node scripts/explorateur-t1-s1-terrain.mjs [--ecrire] [--refaire]
 *
 * La séance enseigne la boucle : répéter un motif N fois au lieu de le
 * recopier. Le bloc nommé n'existe pas encore — il arrive à la séance 3 — et
 * n'a donc sa place ni dans les défis ni dans les mots.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Le tambour qui répète";

const PERCU = ["music_drum", "music_pause"];
const AVEC_BOUCLE = [...PERCU, "controls_repeat_ext"];
const motif = (m, n) => Array(n).fill(m).flat();

const QUINZE = motif(["Boum", "Boum", "Clap"], 5);
if (QUINZE.length !== 15) throw new Error(`${QUINZE.length} sons, attendu 15`);
const DOUZE = motif(["Tac", "Tac", "Boum", "Clap"], 3);
if (DOUZE.length !== 12) throw new Error(`${DOUZE.length} sons, attendu 12`);

const EXOS = [
  {
    palier: 1,
    title: "Combien de sons en tout ?",
    description: "Dix boucles. Compte ce qu'on entend.",
    blocs: [
      kodi("<p>Une boucle joue son motif à chaque tour. Le compte est toujours le même : <strong>sons du motif × nombre de tours</strong>.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de sons en tout ?",
          instruction: "Glisse chaque boucle vers le nombre de sons qu'on entend.",
          bins: [
            { id: "six",  label: "6 sons",  emoji: "6️⃣" },
            { id: "huit", label: "8 sons",  emoji: "8️⃣" },
            { id: "douze", label: "12 sons", emoji: "🔢" },
          ],
          items: [
            { id: "a", label: "🔁 3 fois { 🥁 Boum · 👏 Clap }",             correct: "six",  hint: "2 sons × 3 tours = 6." },
            { id: "b", label: "🔁 4 fois { 🥁 Boum · 👏 Clap }",             correct: "huit", hint: "2 × 4 = 8." },
            { id: "c", label: "🔁 4 fois { 🥁 Boum · ✋ Tac · 👏 Clap }",     correct: "douze", hint: "3 × 4 = 12." },
            { id: "d", label: "🔁 2 fois { 🥁 Boum · ✋ Tac · 👏 Clap }",     correct: "six",  hint: "3 × 2 = 6." },
            { id: "e", label: "🔁 8 fois { 🥁 Boum }",                       correct: "huit", hint: "1 × 8 = 8." },
            { id: "f", label: "🔁 6 fois { 🥁 Boum · 👏 Clap }",             correct: "douze", hint: "2 × 6 = 12." },
            { id: "g", label: "🔁 6 fois { ✋ Tac }",                         correct: "six",  hint: "1 × 6 = 6." },
            { id: "h", label: "🔁 2 fois { 🥁 Boum · ✋ Tac · 👏 Clap · 🥁 Boum }", correct: "huit", hint: "4 × 2 = 8." },
            { id: "i", label: "🔁 3 fois { 🥁 Boum · 🥁 Boum · ✋ Tac · 👏 Clap }", correct: "douze", hint: "4 × 3 = 12." },
            { id: "j", label: "🔁 12 fois { 👏 Clap }",                      correct: "douze", hint: "1 × 12 = 12." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Les mots de la boucle",
    description: "Six mots de la séance, à relier.",
    blocs: [
      kodi("<p>Les mots d'abord. Ils reviendront tout le thème.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots de la boucle",
          instruction: "Touche un mot, puis ce qu'il veut dire.",
          left_label: "Le mot",
          right_label: "Ce qu'il veut dire",
          pairs: [
            { left: "Le motif",       right: "Le morceau qui revient" },
            { left: "Le nombre de tours", right: "Combien de fois le motif se rejoue" },
            { left: "🔁 Répéter",     right: "Rejouer sans recopier" },
            { left: "Le silence ⏸",   right: "Un temps qui ne sonne pas" },
            { left: "Un motif de 3, 4 tours", right: "12 sons" },
            { left: "Un son posé dehors", right: "Ne sonne qu'une fois" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Deux boucles qui se trompent",
    description: "Deux rythmes faux. Chacun, une ligne.",
    blocs: [
      kodi("<p>Le Griot voulait un rythme précis. Deux fois, ce n'est pas ce qui est sorti.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui compte un tour de trop",
        context: "Le Griot voulait 9 sons : Boum Boum Clap, trois fois. Il en entend 12.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 0,
        fix: "🔁 Répéter 3 fois :",
        explanation: "Le motif fait 3 sons. Pour en entendre 9, il faut 3 tours, pas 4.",
        instructions: [
          "🔁 Répéter 4 fois :",
          "     🥁 Boum",
          "     🥁 Boum",
          "     👏 Clap",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle dont le Clap est resté dehors",
        context: "Le Griot voulait Boum Boum Clap, trois fois. Il entend six Boum, puis un seul Clap.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 3,
        fix: "     👏 Clap (à ranger DANS la boucle)",
        explanation: "Ce qui est dans la boucle se rejoue à chaque tour. Le Clap, posé dehors, n'a sonné qu'une fois — tout à la fin.",
        instructions: [
          "🔁 Répéter 3 fois :",
          "     🥁 Boum",
          "     🥁 Boum",
          "👏 Clap",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Dedans ou dehors ?",
    description: "Dix sons. Celui-là se rejoue, ou pas ?",
    blocs: [
      kodi("<p>Un son rangé <strong>dans</strong> la boucle sonne à chaque tour. Posé <strong>dehors</strong>, il ne sonne qu'une fois.</p><p>La boucle fait 4 tours.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Dedans ou dehors ?",
          instruction: "Ce son se fait entendre 4 fois, ou une seule ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Décalé sous la boucle : il est dedans, il sonne 4 fois.",
              "Collé à gauche : il est dehors, il sonne une fois.",
              "Avant la boucle : une fois, et en premier.",
              "Après la boucle : une fois, et en dernier.",
            ],
          },
          categories: [
            { id: "quatre", label: "4 fois", emoji: "🔁", color: "#059669" },
            { id: "une",    label: "1 fois", emoji: "1️⃣", color: "#64748b" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "🥁 Boum, décalé sous la boucle",       correct: "quatre", hint: "Décalé = dedans." },
            { id: "b", emoji: "2️⃣", label: "👏 Clap, collé à gauche après la boucle", correct: "une",   hint: "Dehors, après : une seule fois." },
            { id: "c", emoji: "3️⃣", label: "✋ Tac, décalé sous la boucle",         correct: "quatre", hint: "Dedans." },
            { id: "d", emoji: "4️⃣", label: "🥁 Boum, posé avant la boucle",        correct: "une",   hint: "Avant : il ouvre, une seule fois." },
            { id: "e", emoji: "5️⃣", label: "⏸ Silence, décalé sous la boucle",     correct: "quatre", hint: "Même un silence se répète à chaque tour." },
            { id: "f", emoji: "6️⃣", label: "👏 Clap, décalé sous la boucle",       correct: "quatre", hint: "Dedans." },
            { id: "g", emoji: "7️⃣", label: "✋ Tac, tout en bas, collé à gauche",   correct: "une",   hint: "Collé à gauche : la boucle l'a laissé dehors." },
            { id: "h", emoji: "8️⃣", label: "Le tout premier son, avant 🔁",         correct: "une",   hint: "Avant la boucle." },
            { id: "i", emoji: "9️⃣", label: "Le dernier son, décalé sous 🔁",        correct: "quatre", hint: "Décalé, donc dedans — même s'il est le dernier écrit." },
            { id: "j", emoji: "🔟", label: "🥁 Boum, collé à gauche entre deux boucles", correct: "une", hint: "Entre les deux, mais dans aucune : une fois." },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Raconte le rythme",
    description: "Six phrases sur un rythme de Griot.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un rythme. Il marche.</p>" +
            "<pre><code>1  🥁 Boum\n" +
            "2  🔁 Répéter 4 fois :\n" +
            "3       ✋ Tac\n" +
            "4       👏 Clap\n" +
            "5  🥁 Boum</code></pre>" +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le rythme",
          instruction: "Complète chaque phrase sur le rythme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "En tout, on entend", after: "sons.",
              options: ["10", "6", "4"], correct: 0,
              explanation: "La boucle fait 2 × 4 = 8 sons, plus les deux Boum des lignes 1 et 5 : 10." },
            { id: "s2", before: "La ligne 3 se fait entendre", after: "fois.",
              options: ["1", "4", "8"], correct: 1,
              explanation: "Elle est dans la boucle, qui fait 4 tours." },
            { id: "s3", before: "La ligne 5 se fait entendre", after: "fois.",
              options: ["4", "2", "1"], correct: 2,
              explanation: "Elle est dehors, après la boucle : une seule fois, tout à la fin." },
            { id: "s4", before: "Le tout premier son est", after: ".",
              options: ["🥁 Boum", "✋ Tac", "👏 Clap"], correct: 0,
              explanation: "La ligne 1 sonne avant que la boucle commence." },
            { id: "s5", before: "Si on met la ligne 5 DANS la boucle, on entend", after: "sons.",
              options: ["10", "13", "12"], correct: 1,
              explanation: "Le motif passerait à 3 sons : 3 × 4 = 12, plus le Boum du début : 13." },
            { id: "s6", before: "Si la boucle passait à 6 tours, on entendrait", after: "sons.",
              options: ["14", "10", "12"], correct: 0,
              explanation: "2 × 6 = 12, plus les deux Boum de dehors : 14." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Le rythme de quinze sons",
    description: "Compte d'abord, pose ensuite.",
    blocs: [
      kodi("<p>Le Griot veut <strong>15 sons</strong> ce soir. Son motif : <em>Boum, Boum, Clap</em>.</p><p>Combien de tours ? Calcule avant de poser — et tiens en 5 blocs.</p>"),
      jeu({
        game_type: "music",
        title: "Quinze sons",
        instructions:
          "Le motif du Griot : Boum, Boum, Clap.\n" +
          "Il en veut 15 sons en tout. Combien de tours de boucle ?\n" +
          "5 blocs au plus.",
        target_notes: QUINZE,
        available_blocks: AVEC_BOUCLE,
        // La boucle (1) + son chiffre (1) + les 3 sons du motif = 5.
        max_blocks: 5,
        indice_limite: "Le motif fait 3 sons. 15 ÷ 3, ça fait combien de tours ? 🔁",
        tempo: 380,
      }),
    ],
  },
  {
    palier: 3,
    title: "Le motif de quatre",
    description: "Un motif plus long, toujours en cinq blocs… ou six.",
    blocs: [
      kodi("<p>Cette fois le motif fait <strong>quatre</strong> sons : <em>Tac, Tac, Boum, Clap</em>. Et le Griot en veut 12.</p><p>La même méthode : compte, puis pose.</p>"),
      jeu({
        game_type: "music",
        title: "Douze sons, motif de quatre",
        instructions:
          "Le motif : Tac, Tac, Boum, Clap.\n" +
          "Le Griot en veut 12 sons. Combien de tours ?\n" +
          "6 blocs au plus.",
        target_notes: DOUZE,
        available_blocks: AVEC_BOUCLE,
        // La boucle (1) + son chiffre (1) + les 4 sons du motif = 6.
        max_blocks: 6,
        indice_limite: "Le motif fait 4 sons. 12 ÷ 4, ça fait combien de tours ? 🔁",
        tempo: 380,
      }),
    ],
  },
];

verifier(EXOS, { comptes: { "Combien de sons en tout ?": 10, "Dedans ou dehors ?": 10, "Raconte le rythme": 6 } });
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
