/**
 * Explorateur — thème 1, séance 4 : « Couplet et refrain ».
 *
 *     node scripts/explorateur-t1-s4-couplet-refrain.mjs [--ecrire] [--refaire]
 *
 * Cette séance s'appelait « Le rythme à paramètre », et son contenu enseignait
 * la mélodie en ouvrant sur « Rappel séance 1 » — le signe qu'il avait été
 * écrit pour un autre créneau. Le paramètre a d'ailleurs été écarté : le seul
 * disponible serait le chiffre du Répéter, que l'enfant manipule depuis la
 * séance 1. Ç'aurait été une séance pour rien.
 *
 * Elle devient l'usage de ce que la séance 3 a introduit : un bloc nommé,
 * c'est bien ; deux blocs qui se répondent, c'est une chanson. Et le dernier
 * défi dirigé réunit les deux outils du thème — une boucle qui appelle des
 * blocs nommés.
 */
import { base, lecteur } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Couplet et refrain";

// ── La chanson, écrite une fois et comptée par le script ──────────────────
// Le Griot frappe, la voix répond : c'est un appel-réponse, et c'est ce que
// deux blocs nommés racontent le mieux. Les séances 1 et 2 sont au tambour ;
// l'avoir laissé au piano faisait disparaître le personnage du thème.
const REFRAIN = ["Boum", "Boum", "Clap"];
const COUPLET = ["Do", "Mi", "Do"];
const INTRO   = ["Tac", "Tac"];

const morceau = (...parts) => parts.flat();
const CHANSON = morceau(COUPLET, REFRAIN, COUPLET, REFRAIN);                 // 12 sons
const AVEC_INTRO = morceau(INTRO, COUPLET, REFRAIN, COUPLET, REFRAIN);       // 14 sons
const TOURNE = morceau(REFRAIN, COUPLET, REFRAIN, COUPLET, REFRAIN, COUPLET); // 18 sons

if (CHANSON.length !== 12)    throw new Error(`la chanson fait ${CHANSON.length} sons, attendu 12`);
if (AVEC_INTRO.length !== 14) throw new Error(`avec l'intro : ${AVEC_INTRO.length}, attendu 14`);
if (TOURNE.length !== 18)     throw new Error(`le tour de chant : ${TOURNE.length}, attendu 18`);

// Le défi du calcul : 21 sons, en alternant et en finissant par un refrain.
// Trois tours de (Refrain + Couplet), puis un dernier Refrain. L'enfant doit
// trouver le 3 tout seul — c'est le premier raisonnement chiffré de ces trois
// séances, et les séances 1 et 2 en avaient un chacune.
const TOURS = 3;
const VINGT_ET_UN = [...Array(TOURS).fill([REFRAIN, COUPLET]).flat(2), ...REFRAIN];
if (VINGT_ET_UN.length !== 21)
  throw new Error(`le défi du calcul fait ${VINGT_ET_UN.length} sons, attendu 21`);

// La réparation : le Griot a inversé son appel et sa réponse. Le programme
// joue Refrain, Couplet, Refrain, Couplet — il devait jouer l'inverse.
const DEPART_INVERSE = [
  { def: "Refrain", corps: REFRAIN },
  { def: "Couplet", corps: COUPLET },
  { appel: "Refrain" }, { appel: "Couplet" }, { appel: "Refrain" }, { appel: "Couplet" },
];
if (REFRAIN.length !== COUPLET.length) throw new Error("refrain et couplet doivent faire la même longueur ici");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const BLOCS_NOMMES = ["music_play_note", "music_drum", "music_define", "music_call"];

const BLOCS = [
  // ── 0. L'accroche ────────────────────────────────────────────────────────
  texte(
    "<h3>🎶 Une chanson, c'est deux morceaux qui se répondent</h3>" +
    "<p>La semaine dernière, tu as donné un nom au refrain du Griot — son <strong>Boum&nbsp;Boum&nbsp;Clap</strong>. Les couplets, eux, changeaient à chaque fois : tu les as écrits note à note.</p>" +
    "<p>Mais écoute ce soir&nbsp;: le tambour appelle, et la voix répond <em>toujours la même chose</em>. Le couplet revient <strong>lui aussi</strong>.</p>" +
    "<pre>Couplet · <b>Refrain</b> · Couplet · <b>Refrain</b></pre>" +
    "<p>Deux morceaux qui reviennent. Deux morceaux qui méritent un nom.</p>"
  ),

  // ── 1. Deux blocs, tout de suite ─────────────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 1 — Deux blocs pour une chanson",
    instructions:
      "Fabrique DEUX blocs :\n" +
      "· 🎼 Refrain → Boum Boum Clap (le tambour)\n" +
      "· 🎼 Couplet → Do Mi Do (la voix)\n" +
      "Puis écris la chanson : Couplet, Refrain, Couplet, Refrain.",
    target_notes: CHANSON,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 2,
    tempo: 380,
  }),

  // ── 2. Ce qu'on vient de faire ───────────────────────────────────────────
  texte(
    "<h3>🎼 Chaque bloc a son nom, et son contenu</h3>" +
    "<p>Tu viens d'écrire douze sons… en n'en posant que <strong>six</strong>. Les six autres, les blocs les ont rejoués pour toi.</p>" +
    "<p>Et regarde ta chanson&nbsp;: elle se lit à voix haute.</p>" +
    "<pre>▶ Jouer <b>Couplet</b>\n▶ Jouer <b>Refrain</b>\n▶ Jouer <b>Couplet</b>\n▶ Jouer <b>Refrain</b></pre>" +
    "<p>Quatre lignes, et on comprend la chanson sans entendre une seule note. C'est ça qu'on gagne en donnant des noms&nbsp;: <strong>un programme qui se raconte</strong>.</p>"
  ),

  // ── 3. Un troisième bloc : l'intro ───────────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 2 — Le Griot ajoute une intro",
    instructions:
      "Avant de commencer, le Griot frappe deux Tac pour donner le tempo.\n" +
      "Fabrique un troisième bloc 🎼 Intro, et place-le tout au début.\n" +
      "La chanson devient : Intro, Couplet, Refrain, Couplet, Refrain.",
    target_notes: AVEC_INTRO,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 3,
    tempo: 380,
  }),

  // ── 4. Le piège de la séance ─────────────────────────────────────────────
  texte(
    "<h3>⚠️ Deux blocs, deux vies séparées</h3>" +
    "<p>Change une frappe dans ton <strong>Refrain</strong>&nbsp;: tous les refrains changent. Tu l'as déjà entendu la semaine dernière.</p>" +
    "<p>Mais le <strong>Couplet</strong>, lui, ne bouge pas d'un poil. Ils portent des noms différents, ils vivent chacun de leur côté.</p>" +
    "<p>C'est exactement ce qu'on veut&nbsp;: pouvoir retoucher le refrain sans abîmer le reste de la chanson.</p>" +
    "<p class=\"mt-2\">Et attention à l'ordre de ta liste&nbsp;: <em>Couplet, Refrain</em> ne s'entend pas comme <em>Refrain, Couplet</em>. Les mêmes blocs, une autre chanson.</p>"
  ),

  // ── 5. Le quiz ───────────────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Ton bloc Couplet fait 3 sons, ton bloc Refrain aussi. Tu écris : Couplet, Refrain, Couplet, Refrain. Combien de sons en tout ?",
          choices: ["6", "12", "4"],
          answer: 1,
          explanation: "Quatre appels, 3 sons chacun : 4 × 3 = 12. Tu n'as posé que 6 blocs de son — les blocs nommés ont fait le reste.",
        },
        {
          question: "Tu changes le Clap de ton bloc Refrain en Tac. Qu'est-ce qui change dans la chanson ?",
          choices: ["Tous les refrains", "Tous les couplets", "Toute la chanson"],
          answer: 0,
          explanation: "Seulement les refrains. Le Couplet est un autre bloc, avec son propre nom : il ne bouge pas.",
        },
        {
          question: "Tu inverses tes deux appels : Refrain, Couplet au lieu de Couplet, Refrain. Est-ce la même chanson ?",
          choices: ["Oui, mêmes blocs", "Oui, mêmes notes", "Non, l'ordre change tout"],
          answer: 2,
          explanation: "Les mêmes blocs dans un autre ordre donnent une autre chanson. Un programme se lit de haut en bas.",
        },
        {
          question: "Pourquoi donner un nom au couplet, alors qu'on pourrait écrire ses notes deux fois ?",
          choices: [
            "Pour que la chanson se lise et se corrige à un seul endroit",
            "Parce que ça joue plus vite",
            "Parce que c'est obligatoire",
          ],
          answer: 0,
          explanation: "Ça ne joue ni plus vite ni plus fort. Mais on lit la chanson d'un coup d'œil, et on la corrige à un seul endroit.",
        },
      ],
    },
  },

  // ── 6. Remettre en ordre ─────────────────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets la chanson en ordre",
    description: "Deux blocs fabriqués, puis la chanson : Couplet, Refrain, Couplet.",
    hint: "Les deux blocs se fabriquent d'abord. On ne joue pas un bloc qui n'existe pas encore.",
    items: [
      "🎼 Mon bloc Couplet : Do, Mi, Do",
      "🎼 Mon bloc Refrain : Boum, Boum, Clap",
      "▶ Jouer Couplet",
      "▶ Jouer Refrain",
      "▶ Jouer Couplet",
    ],
  }),

  // ── 7. Réparer, pas construire : le format le plus engageant du moteur ───
  jeu({
    game_type: "music",
    title: "Défi 3 — Le Griot s'est trompé 🔧",
    instructions:
      "Le programme est déjà écrit, et il joue. Mais le Griot a inversé l'appel et la réponse !\n" +
      "Il commence par frapper alors qu'il devait commencer par chanter.\n" +
      "Écoute, puis remets les ▶ Jouer dans le bon ordre : Couplet, Refrain, Couplet, Refrain.",
    depart: DEPART_INVERSE,
    target_notes: CHANSON,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 2,
    tempo: 380,
  }),

  // ── 8. Compter d'abord, poser ensuite ───────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 4 — Les 21 sons de la veillée 🧮",
    instructions:
      "Ce soir le Griot veut exactement 21 sons.\n" +
      "Il alterne Refrain (3 sons) et Couplet (3 sons), et il FINIT par un Refrain.\n" +
      "Calcule d'abord : combien de fois faut-il enchaîner Refrain puis Couplet, avant le dernier Refrain ?\n" +
      "Puis écris-le avec une boucle — 14 blocs au plus.",
    target_notes: VINGT_ET_UN,
    available_blocks: [...BLOCS_NOMMES, "controls_repeat_ext"],
    blocs_distincts: 2,
    // Le compte : deux définitions (1 + 3 sons chacune = 8), la boucle et son
    // chiffre (2), les deux appels dedans (2), le dernier appel (1) = 13.
    // Un bloc de marge, comme partout ailleurs.
    max_blocks: 14,
    indice_limite: "Une boucle autour de Refrain + Couplet ferait les tours toute seule — et il reste un Refrain à la fin 🔁",
    tempo: 380,
  }),

  // ── 9. La sienne ─────────────────────────────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 5 — Ta chanson à toi 🎨",
    instructions:
      "Compose ta propre chanson, avec DEUX blocs nommés : ton couplet et ton refrain.\n" +
      "Choisis leurs notes, puis fais-les se répondre comme tu veux.\n" +
      "Au moins 12 sons en tout — et fais-la écouter à ton mentor.",
    free_mode: true,
    min_notes: 12,
    available_blocks: [...BLOCS_NOMMES, "controls_repeat_ext", "music_drum"],
    blocs_distincts: 2,
    tempo: 380,
  }),

  // ── 10. Avec le mentor ───────────────────────────────────────────────────
  texte(
    "<h3>👐 Avec ton mentor — La chanson sans écran</h3>" +
    "<ol>" +
    "<li>Inventez <strong>deux</strong> suites de trois gestes. L'une s'appelle <em>Couplet</em>, l'autre <em>Refrain</em>.</li>" +
    "<li>Ton mentor annonce seulement les noms&nbsp;: « <em>Couplet, Refrain, Couplet, Refrain</em> ». À toi de faire les gestes.</li>" +
    "<li>Maintenant inversez&nbsp;: « <em>Refrain, Couplet, Refrain, Couplet</em> ». Est-ce que ça se ressemble&nbsp;?</li>" +
    "<li>Ton mentor change <strong>un geste du refrain seulement</strong>. Refaites tout. Le couplet a-t-il bougé&nbsp;?</li>" +
    "<li>À toi d'annoncer une chanson. Ton mentor la fait — et se trompe exprès d'ordre. Trouve où&nbsp;!</li>" +
    "</ol>"
  ),

  // ── 11. Les mots ─────────────────────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la chanson",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "Le refrain",        right: "Le morceau qui revient" },
      { left: "Le couplet",        right: "Ce qu'il y a entre deux refrains" },
      { left: "Deux noms",         right: "Deux blocs indépendants" },
      { left: "Changer le refrain", right: "Le couplet ne bouge pas" },
      { left: "Une boucle autour",  right: "Le tour de chant recommence" },
    ],
  }),

  // ── 12. Ce qu'il sait faire, et le mur suivant ───────────────────────────
  texte(
    "<h3>🏆 Tu composes avec tes propres blocs</h3>" +
    "<p>Tu fabriques plusieurs blocs nommés, chacun avec son contenu.</p>" +
    "<p>Tu les fais se répondre pour écrire une vraie chanson.</p>" +
    "<p>Tu sais qu'ils vivent séparément&nbsp;: toucher l'un ne touche pas l'autre.</p>" +
    "<p>Et tu sais mettre une boucle autour de tes appels pour faire tourner le morceau.</p>" +
    "<p class=\"mt-3\">Un programme fait de blocs nommés <strong>se lit</strong>. C'est comme ça que travaillent les vrais programmeurs — pas pour jouer plus vite, pour se relire.</p>" +
    "<h4>La prochaine fois</h4>" +
    "<p>Tu vas écrire un morceau bien plus long. Et là, poser les blocs au hasard ne suffira plus&nbsp;: il faudra d'abord faire le <strong>plan</strong> de ta chanson sur le papier, avant de toucher à l'écran.</p>"
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
  `  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(10)} ${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 56))}`));
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
ok(musiques.some((b) => b.content.depart), "un défi part d'un programme déjà posé — la réparation");
ok(musiques.some((b) => /[Cc]alcule/.test(b.content.instructions ?? "")), "un défi demande un calcul avant de poser");
ok(musiques.some((b) => b.content.available_blocks?.includes("music_drum")), "le tambour du Griot est de retour");
ok(musiques.filter((b) => b.content.max_blocks).length >= 1, "au moins un défi impose une limite de blocs");
ok(musiques.every((b) => b.content.blocs_distincts >= 2), "chaque défi exige au moins deux blocs nommés");
ok(musiques.every((b) => b.content.free_mode || (b.content.target_notes ?? []).length > 0), "chaque défi dirigé a sa mélodie cible");
const q = ap.find((b) => b.type === "quiz");
ok(!!q, "le quiz est bien un bloc de type quiz");
ok(new Set((q?.content.questions ?? []).map((x) => x.answer)).size > 1, "les bonnes réponses du quiz ne sont pas toutes au même rang");
ok((q?.content.questions ?? []).every((x) => x.explanation), "chaque question s'explique");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
