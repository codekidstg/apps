/**
 * Explorateur — thème 1 séance 5 « Le plan du compositeur » : parcours + Terrain.
 *
 *     node scripts/explorateur-t1-s5-exercices.mjs [--ecrire] [--refaire]
 *
 * Ce que la séance a enseigné : écrire le plan avant de poser les blocs,
 * compter les blocs à fabriquer à partir du plan, et surtout que le plan dit
 * la FORME et pas les sons — un même plan porte mille chansons.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Le plan du compositeur";

const A = { intro: ["Tac", "Tac"], couplet: ["Do", "Mi", "Do"], refrain: ["Boum", "Boum", "Clap"] };
const B = { intro: ["Boum", "Boum"], couplet: ["Clap", "Tac", "Clap"], refrain: ["Sol", "Mi", "Sol"] };
const surLePlan = (x) => [x.intro, x.couplet, x.refrain, x.couplet, x.refrain, x.intro].flat();
const PLAN_A = surLePlan(A), PLAN_B = surLePlan(B);
if (PLAN_A.length !== 16 || PLAN_B.length !== 16) throw new Error("les deux chansons doivent faire 16 sons");

// Le plan du chef : Refrain + Couplet en boucle, 24 sons → 4 tours.
const TOURS = 4;
const VINGT_QUATRE = Array(TOURS).fill([A.refrain, A.couplet]).flat(2);
if (VINGT_QUATRE.length !== 24) throw new Error(`${VINGT_QUATRE.length} sons, attendu 24`);

const SONS = ["music_play_note", "music_drum"];
const AVEC = [...SONS, "music_define", "music_call"];

const PARCOURS = [
  {
    xp: 30,
    title: "Ça sert à quoi, le plan ?",
    description: "Dix gestes. Lesquels font partie du plan ?",
    blocs: [
      kodi("<p>Le plan se fait <strong>avant</strong> de toucher aux blocs, et il ne dit aucune note.</p><p>Range ces dix gestes : ceux qui font partie du plan, et ceux qui viennent après.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça sert à quoi, le plan ?",
          instruction: "Ce geste fait partie du plan, ou il vient après ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Le plan dit la FORME : quels morceaux, dans quel ordre.",
              "Le plan ne dit AUCUNE note.",
              "Tout ce qui touche aux sons vient après.",
              "Écouter pour repérer ce qui revient fait partie du plan.",
            ],
          },
          categories: [
            { id: "plan",  label: "C'est le plan", emoji: "🗺️", color: "#FDB813" },
            { id: "apres", label: "Ça vient après", emoji: "🎼", color: "#9333ea" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Écouter le morceau et repérer ce qui revient", correct: "plan",  hint: "C'est le tout premier geste du plan." },
            { id: "b", emoji: "2️⃣", label: "Écrire : Intro, Couplet, Refrain, Couplet",    correct: "plan",  hint: "La forme, sans une seule note." },
            { id: "c", emoji: "3️⃣", label: "Choisir les sons du Refrain",                  correct: "apres", hint: "Le plan ne dit pas les sons." },
            { id: "d", emoji: "4️⃣", label: "Compter combien de blocs fabriquer",           correct: "plan",  hint: "Le plan répond à cette question tout seul." },
            { id: "e", emoji: "5️⃣", label: "Glisser un Boum dans le bloc",                 correct: "apres", hint: "On remplit les blocs après avoir fait le plan." },
            { id: "f", emoji: "6️⃣", label: "Décider que le Refrain revient trois fois",    correct: "plan",  hint: "Combien de fois, c'est la forme." },
            { id: "g", emoji: "7️⃣", label: "Écrire les ▶ Jouer dans l'ordre",              correct: "apres", hint: "Le plan dit l'ordre, mais l'écrire en blocs vient après." },
            { id: "h", emoji: "8️⃣", label: "Chanter le morceau dans sa tête",              correct: "plan",  hint: "C'est comme ça qu'on repère la forme." },
            { id: "i", emoji: "9️⃣", label: "Écouter en entier et corriger",                correct: "apres", hint: "On ne peut corriger que ce qui existe déjà." },
            { id: "j", emoji: "🔟", label: "Écrire le plan sur une feuille",               correct: "plan",  hint: "Le geste même." },
          ],
        },
      },
    ],
  },
  {
    xp: 35,
    title: "Combien de blocs dit ce plan ?",
    description: "Neuf plans écrits en mots. Combien de blocs chacun demande ?",
    blocs: [
      kodi("<p>Un plan répond à la question sans qu'on pose un seul bloc : <strong>combien en fabriquer ?</strong></p><p>Compte les noms différents, pas les moments.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de blocs dit ce plan ?",
          instruction: "Glisse chaque plan vers le nombre de blocs à fabriquer.",
          bins: [
            { id: "un",    label: "1 bloc",  emoji: "1️⃣" },
            { id: "deux",  label: "2 blocs", emoji: "2️⃣" },
            { id: "trois", label: "3 blocs", emoji: "3️⃣" },
          ],
          items: [
            { id: "a", label: "Refrain, Refrain, Refrain, Refrain",              correct: "un",    hint: "Un seul nom." },
            { id: "b", label: "Intro, Couplet, Refrain, Couplet, Refrain, Intro", correct: "trois", hint: "Trois noms, six moments." },
            { id: "c", label: "Couplet, Refrain, Couplet, Refrain",              correct: "deux",  hint: "Deux noms, quatre moments." },
            { id: "d", label: "Intro, Refrain, Intro",                           correct: "deux",  hint: "Deux noms." },
            { id: "e", label: "Couplet, Couplet, Couplet",                       correct: "un",    hint: "Un seul nom, trois fois." },
            { id: "f", label: "Intro, Couplet, Refrain",                         correct: "trois", hint: "Trois noms, trois moments." },
            { id: "g", label: "Refrain, Couplet, Refrain, Couplet, Refrain",     correct: "deux",  hint: "Deux noms, cinq moments." },
            { id: "h", label: "Intro, Intro, Couplet, Couplet",                  correct: "deux",  hint: "Deux noms." },
            { id: "i", label: "Intro, Couplet, Intro, Refrain, Couplet",         correct: "trois", hint: "Trois noms, cinq moments." },
          ],
        },
      },
    ],
  },
  {
    xp: 40,
    title: "Deux plans mal suivis",
    description: "Deux programmes qui ne suivent pas leur plan.",
    blocs: [
      kodi("<p>Le plan est écrit en haut. Le programme en dessous ne le respecte pas.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui oublie de revenir à l'intro",
        context: "Plan : Intro, Couplet, Refrain, Intro. On n'entend l'intro qu'une seule fois.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 6,
        fix: "▶ Jouer Intro",
        explanation: "Le plan dit que la chanson finit comme elle a commencé. Le dernier appel devait être l'Intro, pas le Refrain une seconde fois.",
        instructions: [
          "🎼 Mon bloc Intro : ✋ Tac · ✋ Tac",
          "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "▶ Jouer Intro",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
          "▶ Jouer Refrain",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui fabrique un bloc de trop",
        context: "Plan : Couplet, Refrain, Couplet, Refrain. Le programme marche, mais un bloc ne sert à rien.",
        description: "Une seule ligne est inutile — clique dessus.",
        bug_index: 2,
        fix: "(à supprimer : aucun ▶ Jouer Intro dans ce plan)",
        explanation: "Le plan ne parle jamais d'intro. Fabriquer un bloc qu'on n'appelle pas, c'est du travail pour rien — le plan disait déjà qu'il en fallait deux.",
        instructions: [
          "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Intro : ✋ Tac · ✋ Tac",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
          "▶ Jouer Couplet (une seconde fois)",
          "▶ Jouer Refrain (une seconde fois)",
        ],
      }),
    ],
  },
  {
    xp: 45,
    title: "Suis le plan de la veillée",
    description: "Trois blocs, six moments, seize sons.",
    blocs: [
      kodi("<p>Le plan est écrit : <strong>Intro, Couplet, Refrain, Couplet, Refrain, Intro</strong>.</p><p>Trois blocs à fabriquer. Le plan te l'a dit avant que tu commences.</p>"),
      jeu({
        game_type: "music",
        title: "Le plan de la veillée",
        instructions:
          "Fabrique les trois blocs :\n" +
          "· 🎼 Intro → Tac Tac\n· 🎼 Couplet → Do Mi Do\n· 🎼 Refrain → Boum Boum Clap\n" +
          "Puis suis le plan : Intro, Couplet, Refrain, Couplet, Refrain, Intro.",
        target_notes: PLAN_A,
        available_blocks: AVEC,
        blocs_distincts: 3,
        tempo: 360,
      }),
    ],
  },
];

const TERRAIN = [
  {
    palier: 1,
    title: "Même plan, ou pas ?",
    description: "Dix chansons. Laquelle suit le plan de la veillée ?",
    blocs: [
      kodi("<p>Le plan de référence : <strong>Intro, Couplet, Refrain, Couplet, Refrain, Intro</strong>.</p><p>Deux chansons peuvent sonner très différemment et suivre le même plan — c'est tout l'intérêt.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Même plan, ou pas ?",
          instruction: "Cette chanson suit-elle le plan de référence ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Le plan : Intro, Couplet, Refrain, Couplet, Refrain, Intro.",
              "Le plan ne dit AUCUN son : les notes peuvent changer.",
              "Ce qui compte, c'est l'ordre des noms.",
              "Un moment en moins ou en plus, et ce n'est plus le même plan.",
            ],
          },
          categories: [
            { id: "oui", label: "Même plan",  emoji: "🗺️", color: "#10b981" },
            { id: "non", label: "Autre plan", emoji: "🔀", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Intro, Couplet, Refrain, Couplet, Refrain, Intro", correct: "oui", hint: "C'est le plan lui-même." },
            { id: "b", emoji: "2️⃣", label: "Le même, mais tout au tambour",                    correct: "oui", hint: "Les sons changent, la forme non." },
            { id: "c", emoji: "3️⃣", label: "Intro, Couplet, Refrain, Couplet, Refrain",        correct: "non", hint: "Il manque l'Intro de la fin." },
            { id: "d", emoji: "4️⃣", label: "Le même, mais chanté deux fois plus vite",         correct: "oui", hint: "Le tempo ne fait pas partie du plan." },
            { id: "e", emoji: "5️⃣", label: "Intro, Refrain, Couplet, Refrain, Couplet, Intro", correct: "non", hint: "Couplet et Refrain sont inversés." },
            { id: "f", emoji: "6️⃣", label: "Le même, avec un Refrain de 6 sons au lieu de 3",  correct: "oui", hint: "Le contenu des blocs ne fait pas le plan." },
            { id: "g", emoji: "7️⃣", label: "Intro, Couplet, Refrain, Intro",                   correct: "non", hint: "Quatre moments au lieu de six." },
            { id: "h", emoji: "8️⃣", label: "Couplet, Refrain, Couplet, Refrain",               correct: "non", hint: "Pas d'intro du tout." },
            { id: "i", emoji: "9️⃣", label: "Le même, joué par quelqu'un d'autre avec ses notes", correct: "oui", hint: "C'est exactement ce que le plan permet." },
            { id: "j", emoji: "🔟", label: "Intro, Couplet, Couplet, Refrain, Refrain, Intro", correct: "non", hint: "Les moments du milieu ne s'alternent plus." },
          ],
        },
      },
    ],
  },
  {
    palier: 1,
    title: "Les mots du plan",
    description: "Six mots du compositeur, à relier.",
    blocs: [
      kodi("<p>Les mots du plan. Ils servent aussi devant un vrai projet, plus tard.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots du plan",
          instruction: "Touche un mot, puis ce qu'il veut dire.",
          left_label: "Le mot",
          right_label: "Ce qu'il veut dire",
          pairs: [
            { left: "Le plan",             right: "La forme, sans les sons" },
            { left: "Un moment du plan",   right: "Un ▶ Jouer à écrire" },
            { left: "Un bloc à fabriquer", right: "Un morceau qui revient" },
            { left: "Six moments",         right: "Trois blocs, chacun deux fois" },
            { left: "Changer les sons",    right: "Même plan, autre chanson" },
            { left: "Changer le plan",     right: "Une autre chanson, d'autres appels" },
          ],
        },
      },
    ],
  },
  {
    palier: 2,
    title: "Remets le plan de travail en ordre",
    description: "Cinq étapes mélangées, un seul bon ordre.",
    blocs: [
      kodi("<p>L'ordre de travail d'un compositeur — et d'un développeur. Il ne change jamais.</p>"),
      jeu({
        game_type: "sort",
        title: "Remets le plan de travail en ordre",
        description: "De la première écoute à la chanson finie.",
        hint: "On ne peut pas remplir un bloc qu'on n'a pas encore décidé de fabriquer.",
        items: [
          "1. Écouter et repérer ce qui revient",
          "2. Écrire la forme : les noms, dans l'ordre",
          "3. Fabriquer un bloc par morceau qui revient",
          "4. Remplir chaque bloc avec ses sons",
          "5. Écrire les ▶ Jouer, puis écouter en entier",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Deux plans qui trébuchent",
    description: "Deux programmes qui trahissent leur plan.",
    blocs: [
      kodi("<p>Le plan est bon. C'est ce qui vient après qui déraille.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui s'arrête trop tôt",
        context: "Plan : Intro, Couplet, Refrain, Couplet, Refrain, Intro. La chanson finit sur le tambour.",
        description: "Une seule ligne manque à l'appel — clique sur la dernière.",
        bug_index: 5,
        fix: "▶ Jouer Refrain, puis ▶ Jouer Intro",
        explanation: "Le plan compte six moments, le programme n'en écrit que cinq. Il manque l'Intro de la fin — celle qui fait finir la chanson comme elle a commencé.",
        instructions: [
          "🎼 Intro · 🎼 Couplet · 🎼 Refrain (les trois blocs sont faits)",
          "▶ Jouer Intro",
          "▶ Jouer Couplet",
          "▶ Jouer Refrain",
          "▶ Jouer Couplet (une seconde fois)",
          "▶ Jouer Refrain (une seconde fois)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui range les sons dans le mauvais bloc",
        context: "Plan respecté, six moments. Mais c'est le tambour qui chante le couplet.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "🎼 Mon bloc Couplet : 🎵 Do · 🎵 Mi · 🎵 Do",
        explanation: "Le plan ne dit pas les sons — c'est à toi de les mettre au bon endroit. Ici le Couplet a reçu le contenu du Refrain.",
        instructions: [
          "🎼 Mon bloc Intro : ✋ Tac · ✋ Tac",
          "🎼 Mon bloc Couplet : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "🎼 Mon bloc Refrain : 🥁 Boum · 🥁 Boum · 👏 Clap",
          "▶ Jouer Intro · ▶ Couplet · ▶ Refrain · ▶ Couplet · ▶ Refrain · ▶ Intro",
        ],
      }),
    ],
  },
  {
    palier: 2,
    title: "Raconte le plan",
    description: "Six phrases sur un plan et sa chanson.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un plan, et la chanson qu'il a donnée.</p>" +
            "<pre><code>LE PLAN\n" +
            "  Intro · Couplet · Refrain · Couplet · Refrain · Intro\n\n" +
            "LES BLOCS\n" +
            "  🎼 Intro   → ✋ Tac · ✋ Tac              (2 sons)\n" +
            "  🎼 Couplet → 🎵 Do · 🎵 Mi · 🎵 Do        (3 sons)\n" +
            "  🎼 Refrain → 🥁 Boum · 🥁 Boum · 👏 Clap  (3 sons)</code></pre>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le plan",
          instruction: "Complète chaque phrase sur le plan affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Le plan compte", after: "moments.",
              options: ["6", "3", "16"], correct: 0,
              explanation: "Six noms écrits à la suite : six ▶ Jouer à écrire." },
            { id: "s2", before: "Il faut fabriquer", after: "blocs.",
              options: ["6", "3", "2"], correct: 1,
              explanation: "Trois noms différents. Chacun sert deux fois." },
            { id: "s3", before: "La chanson fait", after: "sons en tout.",
              options: ["8", "16", "18"], correct: 1,
              explanation: "(2 + 3 + 3) × 2 = 16. Chaque bloc est joué deux fois." },
            { id: "s4", before: "Le tout premier son est", after: ".",
              options: ["✋ Tac", "🎵 Do", "🥁 Boum"], correct: 0,
              explanation: "Le plan commence par l'Intro, qui commence par Tac." },
            { id: "s5", before: "Le tout dernier son est", after: ".",
              options: ["👏 Clap", "🎵 Do", "✋ Tac"], correct: 2,
              explanation: "Le plan finit par l'Intro : la chanson finit comme elle a commencé." },
            { id: "s6", before: "Si on remplace tous les sons par du tambour, le plan", after: ".",
              options: ["ne change pas", "change", "disparaît"], correct: 0,
              explanation: "Le plan dit la forme, pas les sons. Il porte mille chansons différentes." },
          ],
        },
      },
    ],
  },
  {
    palier: 3,
    title: "Le plan du chef — 24 sons",
    description: "Compte d'abord, pose ensuite.",
    blocs: [
      kodi("<p>Le chef de la veillée veut exactement <strong>24 sons</strong>. Son plan : <em>Refrain, Couplet</em> — encore et encore, rien d'autre.</p><p>Ton refrain fait 3 sons, ton couplet 3. Combien de tours ? Calcule avant de poser.</p>"),
      jeu({
        game_type: "music",
        title: "24 sons, pas un de plus",
        instructions:
          "Fabrique 🎼 Refrain → Boum Boum Clap et 🎼 Couplet → Do Mi Do.\n" +
          "Le chef veut 24 sons, en alternant Refrain puis Couplet.\n" +
          "Un tour fait 6 sons : combien de tours ? Écris-le avec une boucle.\n" +
          "13 blocs au plus.",
        target_notes: VINGT_QUATRE,
        available_blocks: [...AVEC, "controls_repeat_ext"],
        blocs_distincts: 2,
        max_blocks: 13,
        indice_limite: "Un tour = Refrain + Couplet = 6 sons. 24 ÷ 6, ça fait combien de tours ? 🔁",
        tempo: 360,
      }),
    ],
  },
  {
    palier: 3,
    title: "🎨 Même plan, ta chanson",
    description: "Le plan est donné. Les sons sont les tiens.",
    blocs: [
      kodi("<p>Voici un plan que tu n'as pas choisi : <strong>Intro, Couplet, Refrain, Couplet, Refrain, Intro</strong>.</p><p>Remplis-le avec <em>tes</em> sons. La chanson de quelqu'un d'autre suivra le même plan et ne ressemblera pas du tout à la tienne — c'est exactement ce qui se passe entre deux développeurs.</p>"),
      jeu({
        game_type: "music",
        title: "Même plan, ta chanson",
        instructions:
          "Suis ce plan : Intro, Couplet, Refrain, Couplet, Refrain, Intro.\n" +
          "Fabrique les TROIS blocs avec les sons que tu veux — tambour, voix, ou les deux.\n" +
          "Au moins 14 sons en tout.",
        free_mode: true,
        min_notes: 14,
        available_blocks: [...AVEC, "music_pause", "controls_repeat_ext"],
        blocs_distincts: 3,
        tempo: 360,
      }),
    ],
  },
];

verifier(TERRAIN, { comptes: { "Même plan, ou pas ?": 10, "Raconte le plan": 6 } });
verifier(PARCOURS, { paliers: null, comptes: { "Ça sert à quoi, le plan ?": 10, "Combien de blocs dit ce plan ?": 9 } });

const opts = { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") };
await appliquerParcours(db, g, LECON, PARCOURS, opts);
await appliquer(db, g, LECON, TERRAIN, opts);
