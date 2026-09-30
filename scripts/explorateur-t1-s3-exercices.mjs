/**
 * Explorateur — thème 1 séance 3 « Mon refrain a un nom » : parcours + Terrain.
 *
 *     node scripts/explorateur-t1-s3-exercices.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné, et qu'on peut donc exercer : fabriquer un bloc
 * et lui donner un nom, l'appeler autant qu'on veut, le fait qu'une définition
 * ne sonne pas toute seule, et qu'un seul son changé dans le bloc change tous
 * les endroits où il est joué.
 *
 * Ce que le thème n'a PAS encore enseigné et qui reste interdit ici : deux
 * blocs nommés qui se répondent (séance 4) et le plan écrit (séance 5).
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Mon refrain a un nom";

const REFRAIN = ["Boum", "Boum", "Clap"];
const SONS = ["music_play_note", "music_drum"];
const AVEC_BLOCS = [...SONS, "music_define", "music_call"];
const trois = [...REFRAIN, "Do", "Mi", ...REFRAIN, "Sol", "Mi", ...REFRAIN];
if (trois.length !== 13) throw new Error(`le morceau à trois refrains fait ${trois.length} sons, attendu 13`);

// ── Les exercices du parcours : 4, en XP croissante ───────────────────────
const PARCOURS = [
  {
    xp: 30,
    title: "Ça fabrique, ou ça joue ?",
    description: "Dix lignes. Laquelle fait du bruit ?",
    blocs: [
      kodi("<p>Fabriquer un bloc et le jouer, ce n'est pas la même chose. L'un range, l'autre fait sonner.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça fabrique, ou ça joue ?",
          instruction: "Cette ligne range le refrain, ou elle le fait sonner ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "🎼 Mon bloc … : ça range. Aucun son.",
              "▶ Jouer … : ça fait sonner ce qui est rangé.",
              "Un son posé tout seul sonne tout de suite.",
              "Un son posé DANS un bloc ne sonne que quand on joue le bloc.",
            ],
          },
          categories: [
            { id: "range", label: "Ça range", emoji: "🎼", color: "#9333ea" },
            { id: "sonne", label: "Ça sonne", emoji: "🔊", color: "#10b981" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "🎼 Mon bloc Refrain",              correct: "range", hint: "Une définition ne fait jamais de bruit." },
            { id: "b", emoji: "2️⃣", label: "▶ Jouer Refrain",                  correct: "sonne", hint: "C'est l'appel : il fait sonner le bloc." },
            { id: "c", emoji: "3️⃣", label: "🥁 Boum, posé tout seul",          correct: "sonne", hint: "Un son dans le programme sonne à son tour." },
            { id: "d", emoji: "4️⃣", label: "🥁 Boum, posé DANS le bloc",       correct: "range", hint: "Il attend d'être appelé. Rangé, pas joué." },
            { id: "e", emoji: "5️⃣", label: "🎼 Mon bloc Couplet, vide",        correct: "range", hint: "Vide ou plein, une définition ne sonne pas." },
            { id: "f", emoji: "6️⃣", label: "▶ Jouer Refrain, trois fois",      correct: "sonne", hint: "Trois appels, trois fois le refrain." },
            { id: "g", emoji: "7️⃣", label: "🎵 Do, posé tout seul",            correct: "sonne", hint: "Une note posée dans le programme sonne." },
            { id: "h", emoji: "8️⃣", label: "🎼 Mon bloc Intro, rempli",        correct: "range", hint: "Rempli ne veut pas dire joué." },
            { id: "i", emoji: "9️⃣", label: "▶ Jouer Intro",                    correct: "sonne", hint: "Toujours l'appel qui sonne." },
            { id: "j", emoji: "🔟", label: "👏 Clap, posé DANS le bloc",       correct: "range", hint: "Dans le bloc, il attend l'appel." },
          ],
        },
      },
    ],
  },
  {
    xp: 35,
    title: "Chaque geste et son effet",
    description: "Six écritures du bloc nommé, et ce qu'elles font.",
    blocs: [
      kodi("<p>Six façons d'écrire, six effets différents. Deux se ressemblent beaucoup — celle qui range et celle qui joue.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque geste et son effet",
          instruction: "Touche une écriture, puis ce qu'elle fait.",
          left_label: "L'écriture",
          right_label: "Son effet",
          pairs: [
            { left: "🎼 Mon bloc Refrain",        right: "Range le refrain sous son nom" },
            { left: "▶ Jouer Refrain",            right: "Fait sonner ce qui est rangé" },
            { left: "Trois ▶ Jouer Refrain",      right: "Le refrain se fait entendre 3 fois" },
            { left: "Un bloc fabriqué, jamais joué", right: "Silence complet" },
            { left: "Changer un son DANS le bloc", right: "Tous les refrains changent" },
            { left: "▶ Jouer un bloc qui n'existe pas", right: "Le programme s'arrête et le dit" },
          ],
        },
      },
    ],
  },
  {
    xp: 40,
    title: "Deux refrains mal fabriqués",
    description: "Deux programmes presque justes. Chacun, une ligne.",
    blocs: [
      kodi("<p>Le Griot a écrit deux programmes. Aucun ne joue ce qu'il voulait. Trouve la ligne fautive.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qu'on n'appelle jamais",
        context: "Le Griot voulait entendre son refrain deux fois. Il n'entend que Do et Mi.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 4,
        fix: "▶ Jouer Refrain",
        explanation: "Le bloc est bien fabriqué, mais il n'est appelé qu'une fois. La dernière ligne devait être un appel, pas une note de plus.",
        instructions: [
          "🎼 Mon bloc Refrain :",
          "     🥁 Boum, 🥁 Boum, 👏 Clap",
          "▶ Jouer Refrain",
          "🎵 Do, 🎵 Mi",
          "🎵 Sol",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui range sans jamais jouer",
        context: "Le Griot a tout bien fabriqué. Et il n'entend rien du tout.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "▶ Jouer Refrain",
        explanation: "Fabriquer n'est pas jouer. Il a rangé son refrain deux fois au lieu de le jouer une fois.",
        instructions: [
          "🎼 Mon bloc Refrain :",
          "     🥁 Boum, 🥁 Boum, 👏 Clap",
          "🎼 Mon bloc Refrain (encore)",
        ],
      }),
    ],
  },
  {
    xp: 45,
    title: "Le refrain du Griot, en entier",
    description: "Un bloc nommé, appelé trois fois.",
    blocs: [
      kodi("<p>Tout ce que la séance a appris, dans un seul programme. Un bloc, trois appels, deux couplets entre les trois.</p>"),
      jeu({
        game_type: "music",
        title: "Trois refrains, un seul bloc",
        instructions:
          "Fabrique 🎼 Refrain → Boum Boum Clap.\n" +
          "Puis écris : Refrain, Do Mi, Refrain, Sol Mi, Refrain.",
        target_notes: trois,
        available_blocks: AVEC_BLOCS,
        bloc_nomme: 3,
        tempo: 400,
      }),
    ],
  },
];

// ── Le Terrain : 7 exercices, paliers 1-1-2-2-2-3-3 ───────────────────────
const TERRAIN = [
  {
    palier: 1,
    title: "Combien de sons en tout ?",
    description: "Dix programmes à bloc nommé. Compte ce qu'on entend.",
    blocs: [
      kodi("<p>Un bloc de 3 sons, appelé 2 fois, fait 6 sons. Compte ce que chaque programme fait entendre — et attention à celui qui ne joue rien.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de sons en tout ?",
          instruction: "Glisse chaque programme vers le nombre de sons qu'on entend.",
          bins: [
            { id: "z", label: "0 son",  emoji: "🔇" },
            { id: "t", label: "3 sons", emoji: "3️⃣" },
            { id: "s", label: "6 sons", emoji: "6️⃣" },
            { id: "n", label: "9 sons", emoji: "9️⃣" },
          ],
          items: [
            { id: "a", label: "Bloc de 3 · joué 2 fois",                 correct: "s", hint: "3 × 2 = 6." },
            { id: "b", label: "Bloc de 3 · joué 3 fois",                 correct: "n", hint: "3 × 3 = 9." },
            { id: "c", label: "Bloc de 3 · jamais joué",                 correct: "z", hint: "Fabriqué, mais pas appelé : rien." },
            { id: "d", label: "Bloc de 3 · joué 1 fois",                 correct: "t", hint: "Un seul appel." },
            { id: "e", label: "Bloc de 2 · joué 3 fois",                 correct: "s", hint: "2 × 3 = 6." },
            { id: "f", label: "Bloc de 1 · joué 9 fois",                 correct: "n", hint: "1 × 9 = 9." },
            { id: "g", label: "Bloc vide · joué 5 fois",                 correct: "z", hint: "Un bloc vide ne contient aucun son." },
            { id: "h", label: "Bloc de 3 · joué 2 fois, et 3 sons posés à côté", correct: "n", hint: "6 par le bloc, plus 3 posés : 9." },
            { id: "i", label: "Bloc de 2 · joué 1 fois, et 1 son posé",  correct: "t", hint: "2 + 1 = 3." },
            { id: "j", label: "Bloc de 6 · joué 1 fois",                 correct: "s", hint: "Un seul appel, mais six sons dedans." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Les mots du bloc nommé",
    description: "Six mots de la séance, à relier.",
    blocs: [
      kodi("<p>Les mots d'abord. Si tu les relies sans hésiter, le reste suivra.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots du bloc nommé",
          instruction: "Touche un mot, puis ce qu'il veut dire.",
          left_label: "Le mot",
          right_label: "Ce qu'il veut dire",
          pairs: [
            { left: "Fabriquer",  right: "Ranger des sons sous un nom" },
            { left: "Appeler",    right: "Faire sonner le bloc" },
            { left: "Le refrain", right: "Ce qui revient plusieurs fois" },
            { left: "Le couplet", right: "Ce qui change entre deux refrains" },
            { left: "Un bloc vide", right: "Rien à jouer" },
            { left: "Changer le bloc", right: "Tous les appels changent" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Remets le programme en ordre",
    description: "Cinq lignes mélangées, une seule bonne suite.",
    blocs: [
      kodi("<p>On ne peut pas jouer un bloc qui n'existe pas encore. L'ordre n'est pas libre.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets le programme en ordre",
        description: "Un bloc Refrain de trois sons, puis : Refrain, Do Mi, Refrain.",
        hint: "La définition se pose d'abord, et ses sons sont décalés dedans.",
        items: [
          "🎼 Mon bloc Refrain :",
          "     🥁 Boum, 🥁 Boum, 👏 Clap",
          "▶ Jouer Refrain",
          "🎵 Do, 🎵 Mi",
          "▶ Jouer Refrain (une seconde fois)",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Deux blocs qui ne sonnent pas",
    description: "Deux programmes muets. Chacun, une ligne.",
    blocs: [
      kodi("<p>Un programme qui ne fait aucun bruit ne dit pas pourquoi. À toi de trouver.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui dont le bloc est vide",
        context: "Le Griot appelle son refrain trois fois. On n'entend rien.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "     🥁 Boum, 🥁 Boum, 👏 Clap",
        explanation: "Le bloc est bien appelé, mais il n'y a rien dedans. Un bloc vide, joué trois fois, fait trois fois rien.",
        instructions: [
          "🎼 Mon bloc Refrain :",
          "     (rien)",
          "▶ Jouer Refrain",
          "▶ Jouer Refrain",
          "▶ Jouer Refrain",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui appelle le mauvais nom",
        context: "Le programme s'arrête et dit : ce bloc n'existe pas encore.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "▶ Jouer Refrain",
        explanation: "Le bloc fabriqué s'appelle Refrain, pas Couplet. On ne peut jouer que ce qu'on a fabriqué.",
        instructions: [
          "🎼 Mon bloc Refrain :",
          "     🥁 Boum, 🥁 Boum, 👏 Clap",
          "▶ Jouer Couplet",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Raconte le programme",
    description: "Six phrases sur un programme qui marche.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme. Il marche.</p>" +
            "<pre><code>1  🎼 Mon bloc Refrain :\n" +
            "2       🥁 Boum · 🥁 Boum · 👏 Clap\n" +
            "3\n" +
            "4  ▶ Jouer Refrain\n" +
            "5  🎵 Do · 🎵 Mi\n" +
            "6  ▶ Jouer Refrain</code></pre>" +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le programme",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "En tout, on entend", after: "sons.",
              options: ["8", "3", "5"], correct: 0,
              explanation: "Le refrain fait 3 sons et il est joué 2 fois : 6. Plus Do et Mi : 8." },
            { id: "s2", before: "Le tout premier son entendu est", after: ".",
              options: ["Do", "Boum", "Clap"], correct: 1,
              explanation: "La ligne 4 appelle le refrain, qui commence par Boum. Les lignes 1 et 2 n'ont rien joué." },
            { id: "s3", before: "La ligne 2 se fait entendre", after: ".",
              options: ["jamais", "une fois", "deux fois"], correct: 2,
              explanation: "Elle est dans le bloc, et le bloc est appelé deux fois." },
            { id: "s4", before: "Si on efface la ligne 6, on entend", after: "sons.",
              options: ["5", "8", "0"], correct: 0,
              explanation: "Un appel de moins : 3 sons de moins. 8 − 3 = 5." },
            { id: "s5", before: "Si on remplace le Clap de la ligne 2 par un Tac, le programme change", after: ".",
              options: ["une fois", "à deux endroits", "pas du tout"], correct: 1,
              explanation: "Un seul son modifié, mais les DEUX refrains changent : c'est tout l'intérêt du bloc nommé." },
            { id: "s6", before: "Si on efface les lignes 4 et 6, on entend", after: ".",
              options: ["le refrain", "rien", "Do et Mi"], correct: 2,
              explanation: "Sans appel, le bloc ne sonne pas. Il reste Do et Mi, posés tout seuls." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Le refrain qui revient quatre fois",
    description: "Un bloc, quatre appels, trois couplets.",
    blocs: [
      kodi("<p>Le Griot est en forme ce soir : quatre refrains, et trois couplets différents entre les quatre.</p><p>Un seul bloc à fabriquer.</p>"),
      jeu({
        game_type: "music",
        title: "Quatre refrains",
        instructions:
          "Fabrique 🎼 Refrain → Boum Boum Clap.\n" +
          "Puis : Refrain, Do, Refrain, Mi, Refrain, Sol, Refrain.",
        target_notes: [...REFRAIN, "Do", ...REFRAIN, "Mi", ...REFRAIN, "Sol", ...REFRAIN],
        available_blocks: AVEC_BLOCS,
        bloc_nomme: 4,
        tempo: 380,
      }),
    ],
  },
  {
    palier: 3,
    title: "🎨 Ton refrain à toi",
    description: "Compose, avec ton propre bloc nommé.",
    blocs: [
      kodi("<p>À toi. Fabrique le refrain que tu veux — au tambour, à la voix, ou les deux — et fais-le revenir au moins deux fois.</p><p>Il n'y a pas de bonne réponse ici. Rejoue-le autant que tu veux.</p>"),
      jeu({
        game_type: "music",
        title: "Ton refrain à toi",
        instructions:
          "Fabrique ton propre bloc Refrain, avec les sons que tu veux.\n" +
          "Fais-le revenir au moins deux fois, avec autre chose entre les deux.\n" +
          "Au moins 10 sons en tout.",
        free_mode: true,
        min_notes: 10,
        available_blocks: [...AVEC_BLOCS, "music_pause", "controls_repeat_ext"],
        bloc_nomme: 2,
        tempo: 400,
      }),
    ],
  },
];

verifier(TERRAIN, { comptes: { "Combien de sons en tout ?": 10, "Raconte le programme": 6 } });
verifier(PARCOURS, { paliers: null, comptes: { "Ça fabrique, ou ça joue ?": 10 } });

const opts = { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") };
await appliquerParcours(db, g, LECON, PARCOURS, opts);
await appliquer(db, g, LECON, TERRAIN, opts);
