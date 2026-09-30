/**
 * Explorateur — thème 1 séance 4 « Couplet et refrain » : parcours + Terrain.
 *
 *     node scripts/explorateur-t1-s4-exercices.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : plusieurs blocs nommés qui se répondent, le
 * fait qu'ils vivent séparément (toucher l'un ne touche pas l'autre), que
 * l'ordre des appels change la chanson, et qu'une boucle peut entourer des
 * appels. Le plan écrit reste pour la séance 5.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Couplet et refrain";

const R = ["Boum", "Boum", "Clap"];   // le tambour
const C = ["Do", "Mi", "Do"];         // la voix
const I = ["Tac", "Tac"];             // l'intro
const SONS = ["music_play_note", "music_drum"];
const AVEC = [...SONS, "music_define", "music_call"];

const CRCR = [...C, ...R, ...C, ...R];
const ICRCR = [...I, ...C, ...R, ...C, ...R];
if (CRCR.length !== 12) throw new Error(`${CRCR.length} sons, attendu 12`);
if (ICRCR.length !== 14) throw new Error(`${ICRCR.length} sons, attendu 14`);
// Le tour de chant : 3 tours de (Refrain + Couplet).
const TOURNE = [...Array(3).fill([R, C]).flat(2)];
if (TOURNE.length !== 18) throw new Error(`${TOURNE.length} sons, attendu 18`);

const PARCOURS = [
  {
    xp: 30,
    title: "Quel bloc joue là ?",
    description: "Dix moments d'une chanson. Lequel des deux blocs sonne ?",
    blocs: [
      kodi("<p>Deux blocs : <strong>Refrain</strong> fait Boum Boum Clap, <strong>Couplet</strong> fait Do Mi Do.</p><p>Pour chaque son entendu, dis quel bloc était en train de jouer.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Quel bloc joue là ?",
          instruction: "Ce son vient du Refrain, ou du Couplet ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Refrain = 🥁 Boum · 🥁 Boum · 👏 Clap — que du tambour.",
              "Couplet = 🎵 Do · 🎵 Mi · 🎵 Do — que de la voix.",
              "Un son de tambour ne peut venir que du Refrain.",
              "Une note chantée ne peut venir que du Couplet.",
            ],
          },
          categories: [
            { id: "r", label: "Le Refrain", emoji: "🥁", color: "#b45309" },
            { id: "c", label: "Le Couplet", emoji: "🎵", color: "#3b82f6" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "🥁 Boum",                     correct: "r", hint: "Le tambour, donc le Refrain." },
            { id: "b", emoji: "2️⃣", label: "🎵 Do",                       correct: "c", hint: "Une note chantée : le Couplet." },
            { id: "c", emoji: "3️⃣", label: "👏 Clap",                     correct: "r", hint: "Le Clap termine le Refrain." },
            { id: "d", emoji: "4️⃣", label: "🎵 Mi",                       correct: "c", hint: "Le Mi n'est que dans le Couplet." },
            { id: "e", emoji: "5️⃣", label: "Le 1er son de la chanson (Couplet d'abord)", correct: "c", hint: "Si le Couplet ouvre, c'est un Do." },
            { id: "f", emoji: "6️⃣", label: "Le son juste après le Clap",  correct: "c", hint: "Le Clap finit le Refrain : ce qui suit est le Couplet." },
            { id: "g", emoji: "7️⃣", label: "Le tout dernier son (Refrain à la fin)", correct: "r", hint: "Le Refrain finit par un Clap." },
            { id: "h", emoji: "8️⃣", label: "Deux sons pareils à la suite", correct: "r", hint: "Seul le Refrain répète le même son : Boum Boum." },
            { id: "i", emoji: "9️⃣", label: "Un son qui revient en 1er et en 3e position d'un bloc", correct: "c", hint: "Do … Do : c'est le Couplet." },
            { id: "j", emoji: "🔟", label: "Un son qui n'est PAS du tambour", correct: "c", hint: "Le Refrain n'a que du tambour : tout le reste vient du Couplet." },
          ],
        },
      },
    ],
  },
  {
    xp: 35,
    title: "Même chanson, ou pas ?",
    description: "Six programmes. Lesquels sonnent pareil ?",
    blocs: [
      kodi("<p>L'ordre des appels fait la chanson. Deux programmes avec les mêmes blocs ne sonnent pas forcément pareil.</p><p>La chanson de référence : <strong>Couplet, Refrain, Couplet, Refrain</strong>.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Même chanson, ou pas ?",
          instruction: "Ce programme sonne comme la référence, ou pas ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "La référence : Couplet, Refrain, Couplet, Refrain.",
              "L'ordre compte : un programme se lit de haut en bas.",
              "Une boucle de 2 autour de (Couplet, Refrain) donne la même chose.",
              "Changer le CONTENU d'un bloc change la chanson.",
            ],
          },
          categories: [
            { id: "oui", label: "Ça sonne pareil", emoji: "✅", color: "#10b981" },
            { id: "non", label: "Ça sonne autrement", emoji: "🔀", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Couplet, Refrain, Couplet, Refrain",   correct: "oui", hint: "C'est la référence elle-même." },
            { id: "b", emoji: "2️⃣", label: "Refrain, Couplet, Refrain, Couplet",   correct: "non", hint: "Mêmes blocs, autre ordre : autre chanson." },
            { id: "c", emoji: "3️⃣", label: "🔁 Répéter 2 fois { Couplet, Refrain }", correct: "oui", hint: "La boucle fait exactement les quatre appels." },
            { id: "d", emoji: "4️⃣", label: "Couplet, Couplet, Refrain, Refrain",   correct: "non", hint: "Les quatre mêmes appels, mais pas dans cet ordre." },
            { id: "e", emoji: "5️⃣", label: "Couplet, Refrain, Couplet",            correct: "non", hint: "Il manque le dernier Refrain." },
            { id: "f", emoji: "6️⃣", label: "La référence, mais le Clap du Refrain devient un Tac", correct: "non", hint: "Même ordre, mais le contenu du bloc a changé." },
          ],
        },
      },
    ],
  },
  {
    xp: 40,
    title: "Deux chansons de travers",
    description: "Deux programmes presque justes. Chacun, une ligne.",
    blocs: [
      kodi("<p>Le Griot voulait <strong>Couplet, Refrain, Couplet, Refrain</strong>. Deux fois, ça n'est pas sorti comme prévu.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui commence par le tambour",
        context: "On entend Boum Boum Clap en premier. Le Griot voulait que la voix ouvre.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "▶ Jouer Couplet",
        explanation: "Les deux blocs sont bons, mais le premier appel est le mauvais. Un programme se lit de haut en bas : c'est la première ligne qui ouvre la chanson.",
        instructions: [
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
          "▶ Jouer Refrain",
          "▶ Jouer Refrain",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle où le couplet est devenu un refrain",
        context: "On entend le tambour quatre fois et la voix jamais.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
        explanation: "Les appels sont justes, mais les deux blocs contiennent la même chose. Deux noms différents doivent ranger deux contenus différents.",
        instructions: [
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Couplet : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
        ],
      }),
    ],
  },
  {
    xp: 45,
    title: "La chanson du Griot",
    description: "Trois blocs nommés, une vraie chanson.",
    blocs: [
      kodi("<p>Tout ce que la séance a appris : trois blocs qui se répondent, et une intro pour donner le tempo.</p>"),
      jeu({
        game_type: "music",
        title: "Intro, couplet, refrain",
        instructions:
          "Fabrique TROIS blocs :\n" +
          "· 🎼 Intro → Tac Tac\n· 🎼 Couplet → Do Mi Do\n· 🎼 Refrain → Boum Boum Clap\n" +
          "Puis : Intro, Couplet, Refrain, Couplet, Refrain.",
        target_notes: ICRCR,
        available_blocks: AVEC,
        blocs_distincts: 3,
        tempo: 380,
      }),
    ],
  },
];

const TERRAIN = [
  {
    palier: 1,
    title: "Combien de blocs à fabriquer ?",
    description: "Dix chansons écrites en mots. Combien de blocs chacune demande-t-elle ?",
    blocs: [
      kodi("<p>On fabrique un bloc <strong>une fois</strong>, on l'appelle autant qu'on veut. Compte les blocs à fabriquer, pas les appels.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de blocs à fabriquer ?",
          instruction: "Glisse chaque chanson vers le nombre de blocs qu'il faut fabriquer.",
          bins: [
            { id: "un",    label: "1 bloc",  emoji: "1️⃣" },
            { id: "deux",  label: "2 blocs", emoji: "2️⃣" },
            { id: "trois", label: "3 blocs", emoji: "3️⃣" },
          ],
          items: [
            { id: "a", label: "Refrain, Refrain, Refrain",                 correct: "un",    hint: "Un seul nom, trois appels." },
            { id: "b", label: "Couplet, Refrain, Couplet, Refrain",        correct: "deux",  hint: "Deux noms différents." },
            { id: "c", label: "Intro, Couplet, Refrain",                   correct: "trois", hint: "Trois noms." },
            { id: "d", label: "Refrain, Couplet, Refrain",                 correct: "deux",  hint: "Deux noms, trois appels." },
            { id: "e", label: "Intro, Intro, Intro, Intro",                correct: "un",    hint: "Un seul nom, appelé quatre fois." },
            { id: "f", label: "Intro, Couplet, Couplet, Intro",            correct: "deux",  hint: "Deux noms seulement." },
            { id: "g", label: "Couplet, Refrain, Intro, Refrain, Couplet", correct: "trois", hint: "Trois noms, cinq appels." },
            { id: "h", label: "Refrain, Refrain",                          correct: "un",    hint: "Un nom." },
            { id: "i", label: "Intro, Refrain, Intro, Refrain, Intro",     correct: "deux",  hint: "Deux noms, cinq appels." },
            { id: "j", label: "Intro, Couplet, Refrain, Couplet, Intro",   correct: "trois", hint: "Trois noms, cinq appels." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Chaque bloc et son contenu",
    description: "Six paires à relier sur la chanson du Griot.",
    blocs: [
      kodi("<p>Les trois blocs de la séance, et ce qu'ils font.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque bloc et son contenu",
          instruction: "Touche un bloc, puis ce qui lui correspond.",
          left_label: "Le bloc",
          right_label: "Ce qui lui correspond",
          pairs: [
            { left: "🎼 Refrain",  right: "🥁 Boum · 🥁 Boum · 👏 Clap" },
            { left: "🎼 Couplet",  right: "🎵 Do · 🎵 Mi · 🎵 Do" },
            { left: "🎼 Intro",    right: "✋ Tac · ✋ Tac" },
            { left: "Changer le Refrain", right: "Le Couplet ne bouge pas" },
            { left: "Inverser deux appels", right: "Une autre chanson" },
            { left: "🔁 autour de deux appels", right: "Le tour de chant recommence" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Remets la chanson en ordre",
    description: "Six lignes mélangées, une seule bonne suite.",
    blocs: [
      kodi("<p>Les deux blocs se fabriquent d'abord. Ensuite seulement, la chanson.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets la chanson en ordre",
        description: "Deux blocs fabriqués, puis : Couplet, Refrain, Couplet, Refrain.",
        hint: "On ne joue pas un bloc qui n'existe pas encore.",
        items: [
          "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
          "▶ Jouer Couplet (une seconde fois)",
          "▶ Jouer Refrain (une seconde fois)",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Deux chansons qui se mélangent",
    description: "Deux programmes faux. Chacun, une ligne.",
    blocs: [
      kodi("<p>Deux blocs, deux vies séparées. Quand on les confond, ça s'entend.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui appelle un bloc vide",
        context: "Le Griot entend le tambour, puis un long silence à la place de la voix.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
        explanation: "Le bloc Couplet est bien appelé, mais il n'y a rien dedans. Un bloc vide joue un silence parfait.",
        instructions: [
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Couplet : (rien)",
          "▶ Jouer Refrain",
          "▶ Jouer Couplet",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle dont la boucle est au mauvais endroit",
        context: "Le Griot voulait Refrain, Couplet, Refrain, Couplet. Il entend deux refrains, puis un seul couplet.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 3,
        fix: "     ▶ Jouer Couplet",
        explanation: "La boucle ne contient que l'appel du Refrain : le Couplet est resté dehors et n'a sonné qu'une fois. Ce qu'on veut répéter va DANS la boucle.",
        instructions: [
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
          "🔁 Répéter 2 fois :",
          "     ▶ Jouer Refrain",
          "▶ Jouer Couplet",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Raconte la chanson",
    description: "Six phrases sur une chanson à deux blocs.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici une chanson. Elle marche.</p>" +
            "<pre><code>1  🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap\n" +
            "2  🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do\n" +
            "3\n" +
            "4  ▶ Jouer Couplet\n" +
            "5  ▶ Jouer Refrain\n" +
            "6  ▶ Jouer Couplet\n" +
            "7  ▶ Jouer Refrain</code></pre>" +
            "<p>Ne la modifie pas. Raconte-la.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte la chanson",
          instruction: "Complète chaque phrase sur la chanson affichée au-dessus.",
          sentences: [
            { id: "s1", before: "En tout, on entend", after: "sons.",
              options: ["12", "6", "4"], correct: 0,
              explanation: "Quatre appels, 3 sons chacun : 4 × 3 = 12." },
            { id: "s2", before: "Le tout premier son est", after: ".",
              options: ["🥁 Boum", "🎵 Do", "✋ Tac"], correct: 1,
              explanation: "La ligne 4 appelle le Couplet, qui commence par Do." },
            { id: "s3", before: "Le tout dernier son est", after: ".",
              options: ["🎵 Do", "🥁 Boum", "👏 Clap"], correct: 2,
              explanation: "La ligne 7 appelle le Refrain, qui finit par Clap." },
            { id: "s4", before: "Si on change le Mi de la ligne 2 en Sol, la chanson change", after: ".",
              options: ["à deux endroits", "à un endroit", "pas du tout"], correct: 0,
              explanation: "Le Couplet est appelé deux fois : un seul son modifié, deux endroits qui changent." },
            { id: "s5", before: "Si on change la ligne 1, le Couplet", after: ".",
              options: ["change aussi", "ne bouge pas", "disparaît"], correct: 1,
              explanation: "Deux noms différents, deux vies séparées. Toucher l'un ne touche pas l'autre." },
            { id: "s6", before: "Si on remplace les lignes 4 à 7 par une boucle de 2 tours, on entend",
              after: ".", options: ["6 sons", "24 sons", "la même chose"], correct: 2,
              explanation: "🔁 Répéter 2 fois { Couplet, Refrain } donne exactement les quatre mêmes appels." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Le tour de chant",
    description: "Deux blocs, une boucle, dix-huit sons.",
    blocs: [
      kodi("<p>Le Griot enchaîne <strong>Refrain, Couplet</strong> — trois fois de suite.</p><p>Tu as deux outils : le bloc nommé et la boucle. Sers-toi des deux.</p>"),
      jeu({
        game_type: "music",
        title: "Trois tours",
        instructions:
          "Fabrique 🎼 Refrain → Boum Boum Clap et 🎼 Couplet → Do Mi Do.\n" +
          "Puis enchaîne Refrain, Couplet — trois fois de suite.\n" +
          "12 blocs au plus : une boucle t'attend.",
        target_notes: TOURNE,
        available_blocks: [...AVEC, "controls_repeat_ext"],
        blocs_distincts: 2,
        // Deux définitions (1 + 3 sons = 8), la boucle et son chiffre (2), les
        // deux appels (2) = 12. Sans boucle : 8 + 6 appels = 14.
        max_blocks: 12,
        indice_limite: "Une boucle autour de tes deux appels ferait les trois tours toute seule 🔁",
        tempo: 380,
      }),
    ],
  },
  {
    palier: 3,
    title: "🎨 Ta chanson à toi",
    description: "Deux blocs nommés, et ils se répondent.",
    blocs: [
      kodi("<p>À toi. Deux blocs, les sons que tu veux — tambour, voix, ou les deux mélangés.</p><p>Fais-les se répondre comme tu l'entends. Rejoue autant que tu veux.</p>"),
      jeu({
        game_type: "music",
        title: "Ta chanson à toi",
        instructions:
          "Fabrique DEUX blocs nommés : ton couplet et ton refrain.\n" +
          "Fais-les se répondre dans l'ordre que tu veux.\n" +
          "Au moins 12 sons en tout.",
        free_mode: true,
        min_notes: 12,
        available_blocks: [...AVEC, "music_pause", "controls_repeat_ext"],
        blocs_distincts: 2,
        tempo: 380,
      }),
    ],
  },
];

verifier(TERRAIN, { comptes: { "Combien de blocs à fabriquer ?": 10, "Raconte la chanson": 6 } });
verifier(PARCOURS, { paliers: null, comptes: { "Quel bloc joue là ?": 10, "Même chanson, ou pas ?": 6 } });

const opts = { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") };
await appliquerParcours(db, g, LECON, PARCOURS, opts);
await appliquer(db, g, LECON, TERRAIN, opts);
