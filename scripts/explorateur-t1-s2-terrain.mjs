/**
 * Explorateur — thème 1 séance 2 « La boucle dans la boucle » : le Terrain.
 *
 *     node scripts/explorateur-t1-s2-terrain.mjs [--ecrire] [--refaire]
 *
 * La séance enseigne l'imbrication : une petite boucle rangée dans une grande,
 * et le compte qui se fait de l'intérieur vers l'extérieur. Le bloc nommé
 * n'arrive qu'à la séance 3 : il n'a sa place ni ici ni dans les mots.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La boucle dans la boucle";

const PERCU = ["music_drum", "music_pause"];
const AVEC_BOUCLE = [...PERCU, "controls_repeat_ext"];

/** Un grand tour = n petits sons, puis la queue. */
const imbrique = (petit, n, queue, tours) =>
  Array(tours).fill([...Array(n).fill(petit).flat(), ...queue]).flat();

const VINGT = imbrique(["Boum"], 4, ["Clap"], 4);      // 4 × (4 Boum + 1 Clap) = 20
if (VINGT.length !== 20) throw new Error(`${VINGT.length} sons, attendu 20`);
const DIX_HUIT = imbrique(["Tac"], 2, ["Boum"], 6);    // 6 × (2 Tac + 1 Boum) = 18
if (DIX_HUIT.length !== 18) throw new Error(`${DIX_HUIT.length} sons, attendu 18`);

const EXOS = [
  {
    palier: 1,
    title: "Combien de sons en tout ?",
    description: "Dix boucles imbriquées. Compte de l'intérieur vers l'extérieur.",
    blocs: [
      kodi("<p>On compte toujours de l'intérieur : d'abord <strong>un grand tour</strong>, puis on multiplie par le nombre de grands tours.</p><p>Exemple : 3 fois { 4 fois {Boum}, Clap } → un grand tour = 4 + 1 = 5 sons, et 3 × 5 = 15.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de sons en tout ?",
          instruction: "Glisse chaque programme vers son nombre de sons.",
          bins: [
            { id: "huit",  label: "8 sons",  emoji: "8️⃣" },
            { id: "douze", label: "12 sons", emoji: "🔢" },
            { id: "vingt", label: "20 sons", emoji: "🎯" },
          ],
          items: [
            { id: "a", label: "🔁 4 fois { 🔁 4 fois {🥁 Boum}, 👏 Clap }",     correct: "vingt", hint: "Un grand tour = 4 + 1 = 5. 4 × 5 = 20." },
            { id: "b", label: "🔁 2 fois { 🔁 3 fois {🥁 Boum}, 👏 Clap }",     correct: "huit",  hint: "Un grand tour = 3 + 1 = 4. 2 × 4 = 8." },
            { id: "c", label: "🔁 3 fois { 🔁 3 fois {✋ Tac}, 👏 Clap }",       correct: "douze", hint: "3 + 1 = 4, et 3 × 4 = 12." },
            { id: "d", label: "🔁 4 fois { 🔁 2 fois {🥁 Boum} }",              correct: "huit",  hint: "Pas de queue : 2 × 4 = 8." },
            { id: "e", label: "🔁 5 fois { 🔁 3 fois {👏 Clap}, ✋ Tac }",       correct: "vingt", hint: "3 + 1 = 4, et 5 × 4 = 20." },
            { id: "f", label: "🔁 6 fois { 🔁 2 fois {🥁 Boum} }",              correct: "douze", hint: "2 × 6 = 12." },
            { id: "g", label: "🔁 2 fois { 🔁 5 fois {✋ Tac}, 👏 Clap }",       correct: "douze", hint: "Un grand tour = 5 + 1 = 6. 2 × 6 = 12." },
            { id: "h", label: "🔁 4 fois { 🔁 1 fois {🥁 Boum}, 👏 Clap }",     correct: "huit",  hint: "1 + 1 = 2, et 4 × 2 = 8." },
            { id: "i", label: "🔁 10 fois { 🔁 2 fois {👏 Clap} }",             correct: "vingt", hint: "2 × 10 = 20." },
            { id: "j", label: "🔁 3 fois { 🔁 2 fois {🥁 Boum}, ✋ Tac · 👏 Clap }", correct: "douze", hint: "2 + 2 = 4, et 3 × 4 = 12." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Les mots de l'imbrication",
    description: "Six mots de la séance, à relier.",
    blocs: [
      kodi("<p>Les mots de la boucle dans la boucle.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots de l'imbrication",
          instruction: "Touche un mot, puis ce qu'il veut dire.",
          left_label: "Le mot",
          right_label: "Ce qu'il veut dire",
          pairs: [
            { left: "La petite boucle", right: "Rangée dans la grande" },
            { left: "La grande boucle", right: "Refait tout son contenu à chaque tour" },
            { left: "Tout au fond",     right: "Le son qu'on entend le plus souvent" },
            { left: "La queue du motif", right: "Le son qui vient après la petite boucle" },
            { left: "Compter",          right: "De l'intérieur vers l'extérieur" },
            { left: "3 tours × 5 sons", right: "15 sons" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Remets l'imbrication en ordre",
    description: "Cinq lignes mélangées, un seul bon décalage.",
    blocs: [
      kodi("<p>Le décalage dit tout : plus une ligne est décalée, plus elle est rangée au fond, et plus elle sonne souvent.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets l'imbrication en ordre",
        description: "Le Griot joue 3 Boum puis un Clap, quatre fois. Et un seul Tac tout à la fin.",
        hint: "La grande boucle d'abord, la petite dedans, la queue après elle, et le Tac tout en bas.",
        items: [
          "🔁 Répéter 4 fois :",
          "     🔁 Répéter 3 fois :",
          "          🥁 Boum",
          "     👏 Clap",
          "✋ Tac",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Deux imbrications de travers",
    description: "Deux rythmes faux. Chacun, une ligne.",
    blocs: [
      kodi("<p>Dans une imbrication, un son mal décalé d'un cran change tout le rythme — et ça ne fait jamais d'erreur rouge.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle dont le Clap est tombé au fond",
        context: "Le Griot voulait 3 Boum puis UN Clap, trois fois. Il entend un Clap après chaque Boum.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 3,
        fix: "     👏 Clap (remonté d'un cran, hors de la petite boucle)",
        explanation: "Le Clap est décalé au même niveau que le Boum : il est DANS la petite boucle, et sonne à chacun de ses trois tours. Il devait rester dans la grande, mais dehors de la petite.",
        instructions: [
          "🔁 Répéter 3 fois :",
          "     🔁 Répéter 3 fois :",
          "          🥁 Boum",
          "          👏 Clap",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle dont le Tac est sorti de tout",
        context: "Le Griot voulait finir chaque grand tour par un Tac. Il n'entend qu'un seul Tac, tout à la fin.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 3,
        fix: "     ✋ Tac (décalé DANS la grande boucle)",
        explanation: "Collé à gauche, le Tac est sorti des deux boucles : il ne sonne qu'une fois. Décalé d'un cran, il finirait chacun des grands tours.",
        instructions: [
          "🔁 Répéter 4 fois :",
          "     🔁 Répéter 2 fois :",
          "          🥁 Boum",
          "✋ Tac",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Raconte l'imbrication",
    description: "Six phrases sur un rythme à deux boucles.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un rythme. Il marche.</p>" +
            "<pre><code>1  🔁 Répéter 3 fois :\n" +
            "2       🔁 Répéter 4 fois :\n" +
            "3            🥁 Boum\n" +
            "4       👏 Clap\n" +
            "5  ✋ Tac</code></pre>" +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte l'imbrication",
          instruction: "Complète chaque phrase sur le rythme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Un seul grand tour fait", after: "sons.",
              options: ["5", "4", "7"], correct: 0,
              explanation: "4 Boum, puis 1 Clap : 5 sons par grand tour." },
            { id: "s2", before: "En tout, on entend", after: "sons.",
              options: ["15", "16", "12"], correct: 1,
              explanation: "3 × 5 = 15 pour les boucles, plus le Tac de la ligne 5 : 16." },
            { id: "s3", before: "La ligne 3 se fait entendre", after: "fois.",
              options: ["4", "3", "12"], correct: 2,
              explanation: "4 fois par grand tour, et 3 grands tours : 4 × 3 = 12." },
            { id: "s4", before: "La ligne 4 se fait entendre", after: "fois.",
              options: ["12", "3", "1"], correct: 1,
              explanation: "Une fois par grand tour, et il y a 3 grands tours." },
            { id: "s5", before: "La ligne 5 se fait entendre", after: "fois.",
              options: ["1", "3", "12"], correct: 0,
              explanation: "Elle est sortie des deux boucles : une seule fois, tout à la fin." },
            { id: "s6", before: "Le son qu'on entend le plus souvent est celui qui est", after: ".",
              options: ["le plus décalé", "le moins décalé", "le dernier écrit"], correct: 0,
              explanation: "Plus un son est rangé au fond, plus il est repris par les boucles qui l'entourent." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Le grand rythme de vingt",
    description: "Compte d'abord, imbrique ensuite.",
    blocs: [
      kodi("<p>Le Griot veut <strong>20 sons</strong>. Son motif : <em>4 Boum, puis 1 Clap</em>.</p><p>Un grand tour fait 5 sons. Combien de grands tours ? Calcule avant de poser.</p>"),
      jeu({
        game_type: "music",
        title: "Vingt sons",
        instructions:
          "Le motif : 4 Boum, puis 1 Clap — ça fait 5 sons.\n" +
          "Le Griot en veut 20. Combien de grands tours ?\n" +
          "Écris-le avec une boucle dans une boucle. 6 blocs au plus.",
        target_notes: VINGT,
        available_blocks: AVEC_BOUCLE,
        boucle_imbriquee: true,
        // Grande boucle (2) + petite boucle (2) + Boum + Clap = 6.
        max_blocks: 6,
        indice_limite: "Un grand tour = 4 + 1 = 5 sons. 20 ÷ 5, ça fait combien de grands tours ? 🔁",
        tempo: 380,
      }),
    ],
  },
  {
    palier: 3,
    title: "Le rythme de dix-huit",
    description: "Un motif plus court, plus de tours.",
    blocs: [
      kodi("<p>Cette fois : <em>2 Tac, puis 1 Boum</em>, et le Griot en veut <strong>18</strong>.</p><p>Même méthode — un grand tour d'abord, le nombre de tours ensuite.</p>"),
      jeu({
        game_type: "music",
        title: "Dix-huit sons",
        instructions:
          "Le motif : 2 Tac, puis 1 Boum.\n" +
          "Le Griot en veut 18 sons. Combien de grands tours ?\n" +
          "Une boucle dans une boucle, 6 blocs au plus.",
        target_notes: DIX_HUIT,
        available_blocks: AVEC_BOUCLE,
        boucle_imbriquee: true,
        max_blocks: 6,
        indice_limite: "Un grand tour = 2 + 1 = 3 sons. 18 ÷ 3, ça fait combien de grands tours ? 🔁",
        tempo: 380,
      }),
    ],
  },
];

verifier(EXOS, { comptes: { "Combien de sons en tout ?": 10, "Raconte l'imbrication": 6 } });
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
