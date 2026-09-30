/**
 * Explorateur — thème 1, séance 6 : « 🏆 La veillée du Griot ».
 *
 *     node scripts/explorateur-t1-s6-jalon.mjs [--ecrire] [--refaire]
 *
 * Le jalon existant codait Frère Jacques avec des boucles seulement, et se
 * terminait sur « en 6 séances, tu as maîtrisé la boucle ». Il avait été écrit
 * avant que le moteur sache faire une fonction : il ne pouvait pas clore un
 * thème qui s'appelle « avec mes propres blocs ».
 *
 * Or Frère Jacques est FAIT pour les blocs nommés : quatre phrases, chacune
 * chantée deux fois. Écrite avec quatre blocs, la chanson tient en huit lignes
 * qu'un parent lit à voix haute sans rien connaître au code. C'est exactement
 * ce qu'un jalon doit montrer.
 *
 * Attention au compte : la version en boucles seules fait MOINS de blocs que la
 * version en blocs nommés. Aucun `max_blocks` ici, donc — le jalon ne récompense
 * pas l'économie, il récompense un programme qui se lit. Le cours le dit.
 *
 * Le dernier défi est libre : depuis la migration 041, il produit une page que
 * le parent ouvre chez lui, avec un bouton ▶ qui joue la chanson de son enfant.
 */
import { base, lecteur } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 La veillée du Griot — mon morceau, de A à Z";

// ── Frère Jacques, phrase par phrase ──────────────────────────────────────
const P = {
  Intro:   ["Do", "Re", "Mi", "Do"],                 // « Frère Jacques »
  Couplet: ["Mi", "Fa", "Sol"],                      // « Dormez-vous ? »
  Refrain: ["Sol", "La", "Sol", "Fa", "Mi", "Do"],   // « Sonnez les matines »
  Final:   ["Do", "Sol", "Do"],                      // « Ding ding dong »
};
const deuxFois = (x) => [...x, ...x];
const CHANSON = [...deuxFois(P.Intro), ...deuxFois(P.Couplet), ...deuxFois(P.Refrain), ...deuxFois(P.Final)];

// Garde-fou : c'est la mélodie que le jalon jouait déjà, note pour note.
const ATTENDU = ["Do","Re","Mi","Do","Do","Re","Mi","Do","Mi","Fa","Sol","Mi","Fa","Sol","Sol","La","Sol","Fa","Mi","Do","Sol","La","Sol","Fa","Mi","Do","Do","Sol","Do","Do","Sol","Do"];
if (CHANSON.join() !== ATTENDU.join())
  throw new Error(`la chanson ne correspond plus à Frère Jacques :\n  ${CHANSON.join(" ")}\n  ${ATTENDU.join(" ")}`);
if (CHANSON.length !== 32) throw new Error(`${CHANSON.length} notes, attendu 32`);

// Le canon : la chanson chantée deux fois. Une boucle autour des huit appels
// remplace huit appels de plus — 30 blocs au lieu de 38. C'est le seul endroit
// du jalon où la boucle est VRAIMENT gagnante, et c'est comme ça qu'on chante
// Frère Jacques. Une boucle de 2 autour d'un appel, elle, coûterait 2 blocs
// pour en économiser 1 : on ne la force pas.
const CANON = [...CHANSON, ...CHANSON];
if (CANON.length !== 64) throw new Error(`le canon fait ${CANON.length} notes, attendu 64`);

/** Le programme du défi 3, tel qu'il est donné au défi 4 : plus rien à bâtir. */
const ORDRE = ["Intro", "Intro", "Couplet", "Couplet", "Refrain", "Refrain", "Final", "Final"];
const PROGRAMME_COMPLET = [
  ...Object.entries(P).map(([def, corps]) => ({ def, corps })),
  ...ORDRE.map((appel) => ({ appel })),
];
// Ce qu'il y a sur l'écran au départ : 4 définitions + 16 sons + 8 appels.
const BLOCS_DONNES = 4 + Object.values(P).flat().length + ORDRE.length;
if (BLOCS_DONNES !== 28) throw new Error(`${BLOCS_DONNES} blocs donnés, attendu 28`);
// Avec la boucle : 28 + la boucle et son chiffre = 30. Sans elle : 8 appels de
// plus = 36. La limite doit laisser passer 30 et refuser 36.
const PLAFOND_CANON = 32;

const DEBUT = [...deuxFois(P.Intro)];                             //  8 notes
const MOITIE = [...deuxFois(P.Intro), ...deuxFois(P.Couplet)];    // 14 notes
if (DEBUT.length !== 8 || MOITIE.length !== 14) throw new Error("les étapes intermédiaires ont changé de longueur");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });
const BLOCS_NOMMES = ["music_play_note", "music_define", "music_call"];

const BLOCS = [
  // ── 0. C'est aujourd'hui, et c'est devant quelqu'un ──────────────────────
  texte(
    "<h3>🏆 La veillée du Griot</h3>" +
    "<p style=\"color:#94a3b8\"><em>🎬 Partie 1 — tu montes ton morceau</em></p>" +
    "<p>Aujourd'hui, tu ne fais pas un exercice. Tu <strong>montes une chanson</strong>, entière, et tu la fais écouter.</p>" +
    "<p>La chanson, c'est <strong>Frère Jacques</strong>. Tu la connais par cœur — et c'est exactement pour ça qu'on la choisit : tu sais déjà comment elle est faite.</p>" +
    "<p>La séance se fait en <strong>deux parties</strong>&nbsp;: d'abord tu montes ton morceau, seul et tranquille. Ensuite tu vas chercher quelqu'un, et tu lui joues la veillée.</p>" +
    "<p>Tout ce que tu as appris depuis la première boucle va servir en même temps. Prends ton temps.</p>"
  ),

  // ── 1. On commence comme on a appris : par le plan ───────────────────────
  jeu({
    game_type: "plan_builder",
    title: "Le plan de Frère Jacques",
    description: "Sept cartes, et il n'en faut que quatre : les quatre phrases de la chanson, dans l'ordre.",
    consigne: "Chante-la dans ta tête, et range les quatre phrases dans l'ordre.",
    phases: [
      "Frère Jacques, Frère Jacques",
      "Dormez-vous ? Dormez-vous ?",
      "Sonnez les matines, sonnez les matines",
      "Ding ding dong, ding ding dong",
    ],
    distracteurs: [
      "Au clair de la lune",
      "Joyeux anniversaire",
      "Ah vous dirai-je maman",
    ],
    explanation:
      "Quatre phrases, et chacune se chante DEUX fois. Quatre phrases à fabriquer, huit à jouer : " +
      "c'est tout le thème en une ligne. Les compositeurs écrivent ce plan avant la première note.",
  }),

  // ── 2. Les quatre phrases, écrites noir sur blanc ────────────────────────
  texte(
    "<h3>🎼 Quatre phrases, quatre blocs</h3>" +
    "<p>Voilà Frère Jacques en notes. Chaque phrase se chante <strong>deux fois</strong> — c'est pour ça qu'on va leur donner un nom.</p>" +
    "<pre>🎼 <b>Intro</b>   → Do Ré Mi Do        <i>« Frère Jacques »</i>\n" +
    "🎼 <b>Couplet</b> → Mi Fa Sol           <i>« Dormez-vous ? »</i>\n" +
    "🎼 <b>Refrain</b> → Sol La Sol Fa Mi Do <i>« Sonnez les matines »</i>\n" +
    "🎼 <b>Final</b>   → Do Sol Do           <i>« Ding ding dong »</i></pre>" +
    "<p>Et la chanson devient huit lignes&nbsp;:</p>" +
    "<pre>▶ Intro · ▶ Intro · ▶ Couplet · ▶ Couplet\n▶ Refrain · ▶ Refrain · ▶ Final · ▶ Final</pre>" +
    "<p>Huit lignes qu'on <strong>lit à voix haute</strong>, sans rien connaître au code. Tu montreras ça tout à l'heure.</p>"
  ),

  // ── 3. La première phrase, pour se mettre en route ───────────────────────
  jeu({
    game_type: "music",
    title: "Défi 1 — « Frère Jacques, Frère Jacques »",
    instructions:
      "On commence par la première phrase.\n" +
      "Fabrique 🎼 Intro → Do Ré Mi Do — c'est « Frère Jacques » — puis joue-le DEUX fois.",
    target_notes: DEBUT,
    available_blocks: BLOCS_NOMMES,
    bloc_nomme: 2,
    tempo: 400,
  }),

  // ── 4. Deux phrases : la mécanique est prise ─────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 2 — « … et dormez-vous ? »",
    instructions:
      "Ajoute la deuxième phrase.\n" +
      "🎼 Couplet → Mi Fa Sol — c'est « Dormez-vous ? », joué deux fois lui aussi.\n" +
      "La chanson fait maintenant : Intro, Intro, Couplet, Couplet.",
    target_notes: MOITIE,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 2,
    tempo: 400,
  }),

  // ── Le point d'étape : deux blocs faits, on vérifie ce qu'on a compris ──
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Frère Jacques a 4 phrases, et chacune se chante 2 fois. Combien de blocs fabriques-tu ?",
          choices: ["8", "4", "32"],
          answer: 1,
          explanation: "Quatre. Chaque bloc est fabriqué une fois et joué deux fois — huit ▶ Jouer, quatre 🎼 Mon bloc.",
        },
        {
          question: "Tu poses 🎼 Mon bloc Final avec Do Sol Do dedans, et tu oublies le ▶ Jouer. Qu'entend-on ?",
          choices: ["Do Sol Do", "Rien", "Une erreur"],
          answer: 1,
          explanation: "Rien. Fabriquer n'est pas jouer — c'est le piège de la séance 3, et il tient jusqu'au bout.",
        },
        {
          question: "Ton ami veut la même chanson en tambour au lieu des notes. Que change-t-il ?",
          choices: ["L'ordre des ▶ Jouer", "Le nombre de blocs", "Les sons DANS les quatre blocs"],
          answer: 2,
          explanation: "Seulement le contenu des blocs. Le plan et l'ordre ne bougent pas — c'est la leçon de la séance 5.",
        },
        {
          question: "Pourquoi écrire la chanson avec quatre blocs nommés plutôt que 32 notes à la suite ?",
          choices: [
            "Parce qu'on la lit d'un coup d'œil et qu'on la corrige à un seul endroit",
            "Parce que ça utilise moins de blocs",
            "Parce que ça joue plus vite",
          ],
          answer: 0,
          explanation: "Ici, les blocs nommés n'économisent RIEN — il en faut même un peu plus. Ce qu'on gagne, c'est un programme qui se lit et qui se corrige. C'est pour ça que les programmeurs le font.",
        },
      ],
    },
  },

  // ── 6. Le morceau entier : le vrai jalon ─────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 3 — Frère Jacques en entier 🏆",
    instructions:
      "La chanson complète, avec tes QUATRE blocs :\n" +
      "· 🎼 Intro → Do Ré Mi Do\n" +
      "· 🎼 Couplet → Mi Fa Sol\n" +
      "· 🎼 Refrain → Sol La Sol Fa Mi Do\n" +
      "· 🎼 Final → Do Sol Do\n" +
      "Puis joue chacun deux fois, dans l'ordre. Prends ton temps : c'est le morceau du trimestre.",
    target_notes: CHANSON,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 4,
    tempo: 400,
  }),

  // ── Le canon : la boucle revient, et elle est vraiment gagnante ──────────
  jeu({
    game_type: "music",
    title: "Défi 4 — Le canon 🔁",
    instructions:
      "Ton morceau est déjà là, en entier. Ne le refais pas.\n" +
      "À la veillée, on chante Frère Jacques DEUX fois de suite.\n" +
      "Tu pourrais recopier tes huit ▶ Jouer… ou enrouler une boucle autour. À toi de voir.\n" +
      "32 blocs au plus — c'est fait exprès.",
    depart: PROGRAMME_COMPLET,
    target_notes: CANON,
    available_blocks: [...BLOCS_NOMMES, "controls_repeat_ext"],
    blocs_distincts: 4,
    max_blocks: PLAFOND_CANON,
    indice_limite: "Recopier huit appels, c'est huit blocs de plus. Une boucle de 2 autour de TOUT, c'en est deux 🔁",
    tempo: 400,
  }),

  // ── Partie 2 : à partir d'ici, quelqu'un regarde ─────────────────────────
  texte(
    "<h3 style=\"color:#FDB813\">🎬 Partie 2 — La veillée</h3>" +
    "<p>Arrête-toi. <strong>Va chercher quelqu'un</strong> — ton parent, ton mentor, ton grand frère.</p>" +
    "<p>Tu as fini la partie difficile. Ce qui vient maintenant, c'est ta représentation, et elle se fait à deux.</p>" +
    "<p>Installe-le à côté de toi avant de continuer.</p>"
  ),

  // ── 7. La sienne — c'est elle qui partira chez le parent ─────────────────
  jeu({
    game_type: "music",
    title: "Défi 5 — Ta veillée à toi 🎨",
    instructions:
      "Maintenant, ta chanson. Pas celle d'un autre.\n" +
      "Fais le plan dans ta tête, fabrique au moins DEUX blocs nommés, et fais-les se répondre.\n" +
      "Tu peux mêler le tambour et les notes — le Griot le fait tout le temps.\n" +
      "Au moins 16 sons. C'est cette chanson-là que tes parents pourront écouter.",
    free_mode: true,
    min_notes: 16,
    available_blocks: [...BLOCS_NOMMES, "music_drum", "music_pause", "controls_repeat_ext"],
    blocs_distincts: 2,
    tempo: 400,
  }),

  // ── 8. Le moment de la veillée ───────────────────────────────────────────
  texte(
    "<h3>👐 La représentation — à faire à deux</h3>" +
    "<p><em>Suis ces cinq étapes dans l'ordre, sans en sauter.</em></p>" +
    "<ol>" +
    "<li><strong>Fais-lui lire ton programme.</strong> Montre-lui tes huit lignes — Intro, Intro, Couplet, Couplet… — et demande-lui&nbsp;: « tu comprends la chanson rien qu'en lisant ça&nbsp;? » Il dira oui. C'est ça que tu as fabriqué.</li>" +
    "<li><strong>Joue.</strong> Remonte au défi 3 et appuie sur ▶. Laisse-le écouter en entier, sans parler.</li>" +
    "<li><strong>Donne-lui la main.</strong> Dis-lui&nbsp;: « choisis une note, n'importe laquelle, dans mon bloc Intro. » Ouvre le bloc devant lui, change CE son, et rejoue.<br>" +
    "Les <strong>deux</strong> « Frère Jacques » ont changé. Il n'a touché qu'un seul endroit. Laisse-le comprendre tout seul — ne lui explique pas.</li>" +
    "<li><strong>Explique en une phrase.</strong> « J'ai fabriqué quatre blocs, je les ai juste appelés. Les programmeurs appellent ça des fonctions. »</li>" +
    "<li><strong>Finis par la tienne.</strong> Joue-lui la chanson que tu as inventée au défi 5 — celle que personne d'autre n'a.</li>" +
    "</ol>" +
    "<p class=\"mt-2\">💡 Ta chanson reste enregistrée&nbsp;: tes parents pourront la réécouter chez eux, même sans toi.</p>"
  ),

  // ── 9. Le thème est clos ─────────────────────────────────────────────────
  texte(
    "<h3>🏆 Thème terminé — tu composes avec tes propres blocs</h3>" +
    "<p>En six séances, tu es passé de « répéter un son » à « écrire une chanson qui se lit ».</p>" +
    "<ul>" +
    "<li>🔁 <strong>La boucle</strong> — répéter sans recopier.</li>" +
    "<li>🔁🔁 <strong>La boucle dans la boucle</strong> — un motif dans un motif.</li>" +
    "<li>🎼 <strong>Le bloc nommé</strong> — écrire une fois, jouer autant qu'on veut.</li>" +
    "<li>🎶 <strong>Plusieurs blocs</strong> — qui se répondent, et qui vivent chacun leur vie.</li>" +
    "<li>🗺️ <strong>Le plan</strong> — la forme d'abord, les sons ensuite.</li>" +
    "</ul>" +
    "<p class=\"mt-3\">Le bloc nommé porte un vrai nom chez les programmeurs&nbsp;: une <strong>fonction</strong>. C'est l'outil que tu utiliseras le plus dans toute ta vie de codeur — plus que la boucle, plus que tout le reste.</p>" +
    "<h4>La suite</h4>" +
    "<p>Tu as fait tout ça en glissant des blocs. Bientôt, tu écriras la même chose <strong>au clavier</strong>, en Python — la langue des vrais programmes. Tu verras&nbsp;: tu sais déjà penser, il ne restera qu'à taper.</p>"
  ),
];

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("lesson_blocks", "id", (q) => q.eq("lesson_id", L.id));
if (deja.length && !process.argv.includes("--refaire"))
  throw new Error(`${deja.length} bloc(s) existent déjà — --refaire pour les remplacer`);

const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs sur « ${L.title} »\n`);
BLOCS.forEach((b, i) => console.log(
  `  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(12)} ${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 54))}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const { error } = await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
  if (error) throw new Error(`suppression : ${error.message}`);
  console.log(`  ⟲ ${deja.length} blocs remplacés`);
}
const { error } = await db.from("lesson_blocks").insert(
  BLOCS.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (error) throw new Error(error.message);

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = (await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id))).sort((a, b) => a.order_index - b.order_index);
ok(ap.length === BLOCS.length, `${BLOCS.length} blocs écrits (trouvé ${ap.length})`);
ok(ap.every((b, i) => b.order_index === i), "numérotation contiguë");
ok(ap.every((b) => b.content && Object.keys(b.content).length), "aucun bloc vide");
const musiques = ap.filter((b) => b.content.game_type === "music");
ok(musiques.length === 5, `5 défis musicaux (trouvé ${musiques.length})`);
ok(musiques.some((b) => b.content.blocs_distincts === 4), "le morceau entier exige les QUATRE blocs nommés");
ok(musiques.some((b) => b.content.free_mode), "un défi libre — c'est lui qui part chez le parent");
// Sur le morceau entier, la version en boucles seules serait plus courte : une
// limite y punirait la bonne solution. Le canon est la seule exception, et sa
// limite est calculée pour laisser passer la boucle et refuser la recopie.
ok(musiques.filter((b) => b.content.max_blocks !== undefined).length === 1,
   "une seule limite de blocs, sur le canon");
const canon = musiques.find((b) => b.content.depart);
ok(!!canon, "le canon repart du programme déjà écrit — l'enfant n'en rebâtit rien");
ok((canon?.content.depart ?? []).length === 12, "les 4 définitions et les 8 appels sont donnés");
ok(canon?.content.available_blocks?.includes("controls_repeat_ext"), "la boucle est dans la boîte du canon");
ok(ap.some((b) => b.type === "text" && /Partie 2/.test(b.content.html ?? "")), "la partie devant le parent est annoncée");
ok(ap.some((b) => b.type === "text" && /choisis une note/.test(b.content.html ?? "")), "le parent a un geste à faire, pas seulement à écouter");
const plan = ap.find((b) => b.content.game_type === "plan_builder");
const total = (plan?.content.phases ?? []).length + (plan?.content.distracteurs ?? []).length;
ok(new RegExp(`\\b${total}\\b|sept`, "i").test(plan?.content.description ?? ""), `la consigne annonce ses ${total} cartes`);
const q = ap.find((b) => b.type === "quiz");
ok(new Set((q?.content.questions ?? []).map((x) => x.answer)).size > 1, "les bonnes réponses du quiz ne sont pas toutes au même rang");
ok((q?.content.questions ?? []).every((x) => x.explanation), "chaque question s'explique");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
