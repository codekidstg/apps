/**
 * Explorateur — thème 1 séance 6, le jalon : parcours + Terrain.
 *
 *     node scripts/explorateur-t1-s6-exercices.mjs [--ecrire] [--refaire]
 *
 * Le Terrain d'un jalon ne rejoue pas sa séance : il rejoue le THÈME. Les cinq
 * séances s'y croisent — la boucle, la boucle dans la boucle, le bloc nommé,
 * plusieurs blocs, le plan. C'est la même règle que pour le jalon Bâtisseur.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 La veillée du Griot — mon morceau, de A à Z";

// Frère Jacques, phrase par phrase — les mêmes qu'au cours.
const P = {
  Intro:   ["Do", "Re", "Mi", "Do"],
  Couplet: ["Mi", "Fa", "Sol"],
  Refrain: ["Sol", "La", "Sol", "Fa", "Mi", "Do"],
  Final:   ["Do", "Sol", "Do"],
};
const deuxFois = (x) => [...x, ...x];
const FRERE = [...deuxFois(P.Intro), ...deuxFois(P.Couplet), ...deuxFois(P.Refrain), ...deuxFois(P.Final)];
if (FRERE.length !== 32) throw new Error(`${FRERE.length} notes, attendu 32`);
const MOITIE = [...deuxFois(P.Intro), ...deuxFois(P.Couplet)];
if (MOITIE.length !== 14) throw new Error(`${MOITIE.length} notes, attendu 14`);

const R = ["Boum", "Boum", "Clap"], C = ["Do", "Mi", "Do"];
const TOURNE = Array(3).fill([R, C]).flat(2);   // 18 sons, le thème en un défi
if (TOURNE.length !== 18) throw new Error(`${TOURNE.length} sons, attendu 18`);

const NOTES = ["music_play_note"];
const SONS = ["music_play_note", "music_drum"];
const AVEC = [...SONS, "music_define", "music_call"];

const PARCOURS = [
  {
    xp: 30,
    title: "Les outils du thème",
    description: "Sept outils appris en six séances.",
    blocs: [
      kodi("<p>Tout le thème en sept lignes. Si tu les relies sans hésiter, le jalon est déjà à moitié gagné.</p>"),
      {
        type: "match",
        content: {
          title: "Les outils du thème",
          instruction: "Touche un outil, puis ce qu'il fait.",
          left_label: "L'outil",
          right_label: "Ce qu'il fait",
          pairs: [
            { left: "🔁 Répéter",            right: "Rejoue la même chose N fois de suite" },
            { left: "🔁 dans 🔁",            right: "Un motif à l'intérieur d'un motif" },
            { left: "🎼 Mon bloc",           right: "Range des sons sous un nom" },
            { left: "▶ Jouer",               right: "Fait sonner le bloc rangé" },
            { left: "Deux blocs nommés",     right: "Deux morceaux qui se répondent" },
            { left: "Le plan",               right: "La forme, écrite avant les sons" },
            { left: "Changer un son du bloc", right: "Tous ses appels changent" },
          ],
        },
      },
    ],
  },
  {
    xp: 35,
    title: "Boucle ou bloc nommé ?",
    description: "Dix besoins. Lequel des deux outils répond ?",
    blocs: [
      kodi("<p>C'est la question du thème entier. <strong>La boucle</strong> rejoue la même chose <em>collée</em>. <strong>Le bloc nommé</strong> rejoue la même chose <em>quand on veut</em>, même avec autre chose entre les deux.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Boucle ou bloc nommé ?",
          instruction: "Pour faire ça, tu prends une boucle ou un bloc nommé ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Si la répétition est COLLÉE, sans rien entre : une boucle.",
              "S'il y a autre chose ENTRE les répétitions : un bloc nommé.",
              "Si tu veux changer le morceau à un seul endroit : un bloc nommé.",
              "Si tu veux juste faire N fois de suite : une boucle.",
            ],
          },
          categories: [
            { id: "b", label: "Une boucle",     emoji: "🔁", color: "#059669" },
            { id: "n", label: "Un bloc nommé",  emoji: "🎼", color: "#9333ea" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Frapper Boum huit fois de suite",             correct: "b", hint: "Collé, sans rien entre : la boucle." },
            { id: "b", emoji: "2️⃣", label: "Un refrain qui revient entre deux couplets",   correct: "n", hint: "Il y a autre chose entre : la boucle ne sait pas." },
            { id: "c", emoji: "3️⃣", label: "Jouer Do Ré Mi trois fois d'affilée",          correct: "b", hint: "Trois fois collées." },
            { id: "d", emoji: "4️⃣", label: "Pouvoir changer le refrain à un seul endroit", correct: "n", hint: "C'est exactement ce que le nom permet." },
            { id: "e", emoji: "5️⃣", label: "Un motif de 4 sons répété 5 fois",             correct: "b", hint: "Répétition collée." },
            { id: "f", emoji: "6️⃣", label: "Couplet, Refrain, Couplet, Refrain",           correct: "n", hint: "Deux morceaux qui alternent : deux blocs nommés." },
            { id: "g", emoji: "7️⃣", label: "Une intro qui revient aussi tout à la fin",    correct: "n", hint: "Le même morceau, à deux endroits éloignés." },
            { id: "h", emoji: "8️⃣", label: "Taper du pied vingt fois",                     correct: "b", hint: "Vingt fois collées : une boucle de 20." },
            { id: "i", emoji: "9️⃣", label: "Donner un nom à un morceau pour le relire",    correct: "n", hint: "Seul le bloc nommé donne un nom." },
            { id: "j", emoji: "🔟", label: "Jouer toute la chanson une deuxième fois",     correct: "b", hint: "La chanson entière, recollée : une boucle autour de tout." },
          ],
        },
      },
    ],
  },
  {
    xp: 40,
    title: "Frère Jacques, la moitié",
    description: "Deux blocs nommés, quatre appels.",
    blocs: [
      kodi("<p>La première moitié de la chanson. Deux phrases, chacune chantée deux fois.</p>"),
      jeu({
        game_type: "music",
        title: "Les deux premières phrases",
        instructions:
          "Fabrique 🎼 Intro → Do Ré Mi Do, et 🎼 Couplet → Mi Fa Sol.\n" +
          "Puis : Intro, Intro, Couplet, Couplet.",
        target_notes: MOITIE,
        available_blocks: [...NOTES, "music_define", "music_call"],
        blocs_distincts: 2,
        tempo: 400,
      }),
    ],
  },
  {
    xp: 45,
    title: "Le thème en un seul programme",
    description: "Deux blocs nommés ET une boucle autour.",
    blocs: [
      kodi("<p>Le dernier exercice du thème réunit les deux outils : les blocs nommés du Griot, et la boucle qui les fait tourner.</p>"),
      jeu({
        game_type: "music",
        title: "Les deux outils ensemble",
        instructions:
          "Fabrique 🎼 Refrain → Boum Boum Clap et 🎼 Couplet → Do Mi Do.\n" +
          "Le Griot enchaîne Refrain, Couplet — trois fois de suite.\n" +
          "12 blocs au plus : la boucle est là pour ça.",
        target_notes: TOURNE,
        available_blocks: [...AVEC, "controls_repeat_ext"],
        blocs_distincts: 2,
        max_blocks: 12,
        indice_limite: "Une boucle autour de tes deux appels ferait les trois tours toute seule 🔁",
        tempo: 380,
      }),
    ],
  },
];

const TERRAIN = [
  {
    palier: 1,
    title: "Boucle, bloc nommé, ou les deux ?",
    description: "Douze programmes. Quel outil reconnais-tu ?",
    blocs: [
      kodi("<p>Tout le thème dans un seul tri. Regarde chaque programme et dis quel outil il utilise.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Quel outil reconnais-tu ?",
          instruction: "Glisse chaque programme vers l'outil qu'il utilise.",
          bins: [
            { id: "b",   label: "Une boucle",       emoji: "🔁" },
            { id: "n",   label: "Un bloc nommé",    emoji: "🎼" },
            { id: "deux", label: "Les deux",        emoji: "🔁🎼" },
          ],
          items: [
            { id: "a", label: "🔁 Répéter 4 fois { 🥁 Boum }",                          correct: "b",    hint: "Que la boucle." },
            { id: "b", label: "🎼 Refrain, puis ▶ Jouer Refrain deux fois",             correct: "n",    hint: "Un nom, deux appels. Pas de boucle." },
            { id: "c", label: "🔁 Répéter 3 fois { ▶ Jouer Refrain }",                  correct: "deux", hint: "Une boucle autour d'un appel." },
            { id: "d", label: "🔁 Répéter 2 fois { 🔁 Répéter 3 fois { 🎵 Do } }",       correct: "b",    hint: "Deux boucles, mais aucun bloc nommé." },
            { id: "e", label: "🎼 Couplet et 🎼 Refrain, puis quatre ▶ Jouer",           correct: "n",    hint: "Deux noms, quatre appels, pas de boucle." },
            { id: "f", label: "🔁 Répéter 5 fois { 🎵 Do · 🎵 Mi }",                     correct: "b",    hint: "Un motif collé, cinq fois." },
            { id: "g", label: "🔁 Répéter 2 fois { ▶ Refrain · ▶ Couplet }",            correct: "deux", hint: "La boucle fait tourner deux appels." },
            { id: "h", label: "🎼 Intro, puis ▶ Jouer Intro une seule fois",             correct: "n",    hint: "Un nom, un appel." },
            { id: "i", label: "🔁 Répéter 6 fois { ✋ Tac }",                             correct: "b",    hint: "Six fois collées, rien de nommé." },
            { id: "j", label: "🔁 Répéter 4 fois { ▶ Jouer Final }",                     correct: "deux", hint: "Boucle + appel." },
            { id: "k", label: "🎼 Refrain, 🎼 Couplet, 🎼 Intro, puis six ▶ Jouer",       correct: "n",    hint: "Trois noms, six appels, pas une boucle." },
            { id: "l", label: "🔁 Répéter 3 fois { 🥁 Boum · 👏 Clap }",                  correct: "b",    hint: "Motif collé, trois fois." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Les mots de tout le thème",
    description: "Sept mots, des six séances.",
    blocs: [
      kodi("<p>Les sept mots du thème. Ceux-là, tu les garderas longtemps.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots de tout le thème",
          instruction: "Touche un mot, puis ce qu'il veut dire.",
          left_label: "Le mot",
          right_label: "Ce qu'il veut dire",
          pairs: [
            { left: "Le motif",     right: "Le morceau qui revient" },
            { left: "La boucle",    right: "Rejouer N fois, collé" },
            { left: "La boucle dans la boucle", right: "Chaque grand tour refait tous les petits" },
            { left: "Fabriquer",    right: "Ranger sans faire de bruit" },
            { left: "Appeler",      right: "Faire sonner ce qui est rangé" },
            { left: "Le plan",      right: "La forme, avant les sons" },
            { left: "Une fonction", right: "Le vrai nom du bloc nommé" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Remets Frère Jacques en ordre",
    description: "Huit lignes mélangées, une seule bonne chanson.",
    blocs: [
      kodi("<p>Les quatre blocs sont déjà fabriqués. Remets les huit appels dans l'ordre de la chanson.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets Frère Jacques en ordre",
        description: "Chante-la dans ta tête : chaque phrase se chante deux fois.",
        hint: "Frère Jacques · Dormez-vous · Sonnez les matines · Ding ding dong.",
        items: [
          "▶ Jouer Intro   (« Frère Jacques »)",
          "▶ Jouer Intro   (« Frère Jacques », encore)",
          "▶ Jouer Couplet (« Dormez-vous ? »)",
          "▶ Jouer Couplet (« Dormez-vous ? », encore)",
          "▶ Jouer Refrain (« Sonnez les matines »)",
          "▶ Jouer Refrain (« Sonnez les matines », encore)",
          "▶ Jouer Final   (« Ding ding dong »)",
          "▶ Jouer Final   (« Ding ding dong », encore)",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Deux veillées qui trébuchent",
    description: "Deux programmes du thème, faux chacun d'une ligne.",
    blocs: [
      kodi("<p>Un de chaque outil : une boucle mal rangée, un bloc mal appelé.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle dont le Clap est tombé dans la boucle",
        context: "Le Griot voulait 4 Boum puis UN Clap, trois fois. Il entend un Clap après chaque Boum.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 3,
        fix: "     👏 Clap (sorti de la petite boucle)",
        explanation: "Le Clap est rangé DANS la petite boucle : il sonne à chacun de ses quatre tours. Il devait rester dehors, après elle.",
        instructions: [
          "🔁 Répéter 3 fois :",
          "     🔁 Répéter 4 fois :",
          "          🥁 Boum",
          "          👏 Clap",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui joue un bloc jamais fabriqué",
        context: "Le programme s'arrête : ce bloc n'existe pas encore.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "▶ Jouer Couplet",
        explanation: "Deux blocs ont été fabriqués — Intro et Couplet. Le troisième appel demande un Refrain qui n'a jamais été rangé.",
        instructions: [
          "🎼 Mon bloc Intro : 🎵 Do · 🎵 Ré",
          "🎼 Mon bloc Couplet : 🎵 Mi · 🎵 Fa",
          "▶ Jouer Intro",
          "▶ Jouer Refrain",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Raconte la veillée",
    description: "Six phrases sur Frère Jacques en blocs nommés.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Frère Jacques, écrit avec quatre blocs nommés.</p>" +
            "<pre><code>LES BLOCS\n" +
            "  🎼 Intro   → Do Ré Mi Do          (4 notes)\n" +
            "  🎼 Couplet → Mi Fa Sol            (3 notes)\n" +
            "  🎼 Refrain → Sol La Sol Fa Mi Do  (6 notes)\n" +
            "  🎼 Final   → Do Sol Do            (3 notes)\n\n" +
            "LA CHANSON\n" +
            "  ▶ Intro · ▶ Intro · ▶ Couplet · ▶ Couplet\n" +
            "  ▶ Refrain · ▶ Refrain · ▶ Final · ▶ Final</code></pre>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte la veillée",
          instruction: "Complète chaque phrase sur la chanson affichée au-dessus.",
          sentences: [
            { id: "s1", before: "Il y a", after: "blocs fabriqués.",
              options: ["8", "4", "32"], correct: 1,
              explanation: "Quatre noms différents. Chacun est appelé deux fois." },
            { id: "s2", before: "Il y a", after: "appels écrits.",
              options: ["8", "4", "16"], correct: 0,
              explanation: "Huit ▶ Jouer : quatre blocs, chacun deux fois." },
            { id: "s3", before: "La chanson fait", after: "notes.",
              options: ["16", "32", "8"], correct: 1,
              explanation: "(4 + 3 + 6 + 3) × 2 = 16 × 2 = 32." },
            { id: "s4", before: "Le bloc le plus long est", after: ".",
              options: ["Intro", "Final", "Refrain"], correct: 2,
              explanation: "Le Refrain fait 6 notes — « Sonnez les matines » est la plus longue phrase." },
            { id: "s5", before: "Si on remplace les huit appels par une boucle de 2 tours, on entend", after: ".",
              options: ["la chanson deux fois", "la moitié", "la même chose"], correct: 0,
              explanation: "La boucle refait les huit appels : la chanson se chante deux fois, comme en canon." },
            { id: "s6", before: "Si on change une note du bloc Intro, la chanson change", after: ".",
              options: ["à un endroit", "à deux endroits", "partout"], correct: 1,
              explanation: "L'Intro est appelée deux fois : un seul geste, deux endroits qui changent." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Frère Jacques en entier",
    description: "Quatre blocs nommés, trente-deux notes.",
    blocs: [
      kodi("<p>La chanson complète, avec les quatre phrases nommées. C'est le morceau du trimestre — prends ton temps.</p>"),
      jeu({
        game_type: "music",
        title: "Frère Jacques en entier",
        instructions:
          "Fabrique les QUATRE blocs :\n" +
          "· 🎼 Intro → Do Ré Mi Do\n· 🎼 Couplet → Mi Fa Sol\n" +
          "· 🎼 Refrain → Sol La Sol Fa Mi Do\n· 🎼 Final → Do Sol Do\n" +
          "Puis joue chacun deux fois, dans l'ordre.",
        target_notes: FRERE,
        available_blocks: [...NOTES, "music_define", "music_call"],
        blocs_distincts: 4,
        tempo: 380,
      }),
    ],
  },
  {
    palier: 3,
    title: "🎨 Ta veillée à toi",
    description: "Tout le thème, et c'est ta chanson.",
    blocs: [
      kodi("<p>La dernière. Fais le plan dans ta tête, fabrique tes blocs, et compose.</p><p>Tu peux tout utiliser : le tambour, la voix, les silences, la boucle. Rejoue-la autant que tu veux.</p>"),
      jeu({
        game_type: "music",
        title: "Ta veillée à toi",
        instructions:
          "Compose ta chanson : au moins DEUX blocs nommés qui se répondent.\n" +
          "Mêle le tambour et la voix si tu veux, et sers-toi d'une boucle si ça t'arrange.\n" +
          "Au moins 16 sons en tout.",
        free_mode: true,
        min_notes: 16,
        available_blocks: [...AVEC, "music_pause", "controls_repeat_ext"],
        blocs_distincts: 2,
        tempo: 400,
      }),
    ],
  },
];

verifier(TERRAIN, { comptes: { "Boucle, bloc nommé, ou les deux ?": 12, "Raconte la veillée": 6 } });
verifier(PARCOURS, { paliers: null, comptes: { "Boucle ou bloc nommé ?": 10, "Les outils du thème": 7 } });

const opts = { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") };
await appliquerParcours(db, g, LECON, PARCOURS, opts);
await appliquer(db, g, LECON, TERRAIN, opts);
