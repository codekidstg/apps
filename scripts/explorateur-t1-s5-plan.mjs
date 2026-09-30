/**
 * Explorateur — thème 1, séance 5 : « Le plan du compositeur ».
 *
 *     node scripts/explorateur-t1-s5-plan.mjs [--ecrire] [--refaire]
 *
 * Le contenu précédent se terminait par « ce mois-ci tu as découvert… » et
 * « c'est ta dernière séance du mois » — alors que le jalon vient APRÈS elle.
 * C'était une clôture de thème posée à l'avant-dernière place.
 *
 * Elle devient ce que son titre promet, et ce que la séance 4 annonce : avant
 * un morceau long, on fait le plan. La séance réutilise le moteur `plan_builder`
 * déjà employé au thème 0 (« Plan avant code ») — l'enfant retrouve un geste
 * qu'il connaît, appliqué à la musique.
 *
 * Le défi 2 est le cœur de la séance : la MÊME structure avec d'autres notes.
 * C'est ce qui fait sentir qu'un plan se réutilise, et que le plan n'est pas
 * la musique.
 */
import { base, lecteur } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Le plan du compositeur";

// ── Les deux chansons, même plan, notes différentes ───────────────────────
const A = { intro: ["Fa", "Re"],  couplet: ["La", "Si", "La"],  refrain: ["Do", "Mi", "Sol"] };
const B = { intro: ["Sol", "La"], couplet: ["Mi", "Fa", "Mi"],  refrain: ["Si", "Sol", "Si"] };

/** Le plan de la veillée : on commence et on finit par l'intro. */
const surLePlan = (x) => [x.intro, x.couplet, x.refrain, x.couplet, x.refrain, x.intro].flat();
const CHANSON_A = surLePlan(A);
const CHANSON_B = surLePlan(B);

if (CHANSON_A.length !== 16) throw new Error(`la chanson A fait ${CHANSON_A.length} sons, attendu 16`);
if (CHANSON_B.length !== CHANSON_A.length) throw new Error("les deux chansons doivent avoir la même longueur");
// Le plan compte 6 moments, mais seulement 3 blocs à fabriquer : c'est le
// cœur du quiz, et le script refuse que ces nombres se démentent.
const MOMENTS = 6, A_FABRIQUER = 3;
if (surLePlan(A).length !== A.intro.length * 2 + A.couplet.length * 2 + A.refrain.length * 2)
  throw new Error("le plan ne rejoue plus chaque bloc deux fois");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const BLOCS_NOMMES = ["music_play_note", "music_define", "music_call"];

const BLOCS = [
  // ── 0. L'accroche ────────────────────────────────────────────────────────
  texte(
    "<h3>🗺️ Avant de jouer, on écrit le plan</h3>" +
    "<p>Ce soir, le Griot ne chante pas quatre morceaux. Il en chante <strong>six</strong>, et ça dure.</p>" +
    "<p>Poser les blocs au hasard, en écoutant à chaque fois pour voir&nbsp;: à six morceaux, on se perd.</p>" +
    "<p>Alors on fait comme les vrais compositeurs — et comme les vrais programmeurs. <strong>On écrit d'abord le plan.</strong> Ensuite seulement, on touche aux blocs.</p>" +
    "<p>Tu l'as déjà fait au thème précédent, pour guider le robot. Aujourd'hui, pour une chanson.</p>"
  ),

  // ── 1. Le plan, avant tout ───────────────────────────────────────────────
  jeu({
    game_type: "plan_builder",
    title: "Le plan de la veillée",
    // La description s'affiche avant la consigne : on annonce le décor, puis on
    // dit quoi faire. Et le nombre de cartes est dit — sans lui, un enfant qui
    // en laisse cinq de côté croit s'être trompé.
    description: "Le plan de travail du Griot. Neuf cartes en tout, et il n'en faut que quatre.",
    consigne: "Range dans l'ordre ce qu'un compositeur fait vraiment, et laisse les autres de côté.",
    phases: [
      "Écouter le morceau et repérer ce qui revient",
      "Fabriquer le bloc de chaque morceau qui revient",
      "Écrire l'ordre de la chanson avec des ▶ Jouer",
      "Écouter en entier et corriger",
    ],
    distracteurs: [
      "Poser des notes au hasard pour voir ce que ça donne",
      "Écrire toutes les notes à la main du début à la fin",
      "Effacer tout et recommencer si ça sonne mal",
      "Choisir la couleur des blocs",
      "Mettre le plus de blocs possible",
    ],
    explanation:
      "Repérer ce qui revient, puis le fabriquer, puis seulement l'assembler : c'est l'ordre de travail d'un compositeur comme d'un développeur. " +
      "Les cinq autres cartes sont des façons de perdre son temps — la plus tentante étant de poser des notes « pour voir ».",
  }),

  // ── 2. Ce qu'on vient de décider ─────────────────────────────────────────
  texte(
    "<h3>📋 Six moments, trois blocs</h3>" +
    "<p>Voici le plan de la veillée, écrit comme un compositeur l'écrirait&nbsp;:</p>" +
    "<pre>Intro · <b>Couplet</b> · <b>Refrain</b> · <b>Couplet</b> · <b>Refrain</b> · Intro</pre>" +
    `<p><strong>${MOMENTS} moments</strong> à entendre. Mais combien de blocs à fabriquer&nbsp;? <strong>${A_FABRIQUER}</strong> seulement — chacun sert deux fois.</p>` +
    "<p>Regarde ce que le plan t'a déjà donné, avant même d'avoir posé un bloc&nbsp;: tu sais <em>quoi</em> fabriquer, <em>combien</em>, et dans quel <em>ordre</em> les appeler.</p>" +
    "<p>Et la chanson finit comme elle a commencé. C'est joli, et ça ne coûte rien&nbsp;: l'Intro existe déjà.</p>"
  ),

  // ── 3. Le morceau long, guidé par le plan ────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 1 — La veillée du Griot",
    instructions:
      "Suis ton plan. Fabrique les trois blocs :\n" +
      "· 🎼 Intro → Fa Ré\n" +
      "· 🎼 Couplet → La Si La\n" +
      "· 🎼 Refrain → Do Mi Sol\n" +
      "Puis écris : Intro, Couplet, Refrain, Couplet, Refrain, Intro.",
    target_notes: CHANSON_A,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 3,
    tempo: 360,
  }),

  // ── 4. Le piège de la séance ─────────────────────────────────────────────
  texte(
    "<h3>⚠️ Le plan n'est pas la musique</h3>" +
    "<p>Ton plan dit <em>Intro, Couplet, Refrain, Couplet, Refrain, Intro</em>. Il ne dit <strong>aucune note</strong>.</p>" +
    "<p>C'est voulu&nbsp;! Le plan dit la <strong>forme</strong> de la chanson. Les notes, c'est ce qu'on met dedans.</p>" +
    "<p>Deux chansons complètement différentes peuvent suivre exactement le même plan. Tu vas le faire dans une minute.</p>" +
    "<p class=\"mt-2\">Et l'ordre de travail compte&nbsp;: on <strong>fabrique</strong> les trois blocs, <strong>ensuite</strong> on écrit les ▶ Jouer. Appeler un bloc qu'on n'a pas encore fabriqué, ça ne joue rien.</p>"
  ),

  // ── 5. Le quiz ───────────────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: `Ton plan tient en ${MOMENTS} moments : Intro, Couplet, Refrain, Couplet, Refrain, Intro. Combien de blocs dois-tu fabriquer ?`,
          choices: ["6", "3", "2"],
          answer: 1,
          explanation: "Trois. L'Intro, le Couplet et le Refrain servent chacun deux fois — on ne les fabrique qu'une fois.",
        },
        {
          question: "Pourquoi écrire le plan AVANT de poser les blocs ?",
          choices: [
            "Pour savoir quoi fabriquer et dans quel ordre l'appeler",
            "Parce que la musique sonne mieux",
            "Pour utiliser moins de couleurs",
          ],
          answer: 0,
          explanation: "Le plan répond à trois questions d'un coup : quoi fabriquer, combien, et dans quel ordre. Sans lui, on pose au hasard et on se perd.",
        },
        {
          question: "Tu as fabriqué tes trois blocs, mais tu n'as écrit aucun ▶ Jouer. Qu'entends-tu ?",
          choices: ["La chanson entière", "Les trois blocs une fois", "Rien du tout"],
          answer: 2,
          explanation: "Rien. Fabriquer n'est toujours pas jouer — même avec trois blocs bien rangés.",
        },
        {
          question: "Tu veux une autre chanson, avec exactement la même forme. Que changes-tu ?",
          choices: ["Le plan", "Les notes DANS les blocs", "L'ordre des ▶ Jouer"],
          answer: 1,
          explanation: "Le plan et l'ordre ne bougent pas. Seules les notes rangées dans chaque bloc changent — et toute la chanson change avec.",
        },
      ],
    },
  },

  // ── 6. Le même plan, une autre chanson ───────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 2 — Le même plan, une autre chanson",
    instructions:
      "Même forme, autres notes. Garde exactement le même ordre :\n" +
      "Intro, Couplet, Refrain, Couplet, Refrain, Intro.\n" +
      "· 🎼 Intro → Sol La\n" +
      "· 🎼 Couplet → Mi Fa Mi\n" +
      "· 🎼 Refrain → Si Sol Si",
    target_notes: CHANSON_B,
    available_blocks: BLOCS_NOMMES,
    blocs_distincts: 3,
    tempo: 360,
  }),

  // ── 7. La sienne, du plan jusqu'au son ───────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 3 — Ta veillée à toi 🎨",
    instructions:
      "À toi, du plan jusqu'au son.\n" +
      "1. Sur une feuille, écris ta forme : par exemple Intro, Couplet, Refrain, Couplet, Refrain.\n" +
      "2. Fabrique les trois blocs avec tes notes.\n" +
      "3. Écris ta chanson en suivant ton plan — au moins 14 sons.\n" +
      "Montre ta feuille à ton mentor avant d'écouter.",
    free_mode: true,
    min_notes: 14,
    available_blocks: [...BLOCS_NOMMES, "controls_repeat_ext", "music_drum", "music_pause"],
    blocs_distincts: 3,
    tempo: 360,
  }),

  // ── 8. Avec le mentor ────────────────────────────────────────────────────
  texte(
    "<h3>👐 Avec ton mentor — Le plan sur la table</h3>" +
    "<ol>" +
    "<li>Sors une feuille. Écris <strong>seulement</strong> la forme de ta chanson&nbsp;: les noms, dans l'ordre. Aucune note.</li>" +
    "<li>Donne la feuille à ton mentor. <strong>Sans</strong> lui dire tes notes, demande-lui&nbsp;: combien de blocs dois-je fabriquer&nbsp;?</li>" +
    "<li>S'il trouve, c'est que ton plan est clair. S'il hésite, réécris-le ensemble.</li>" +
    "<li>Maintenant, chacun remplit le plan avec <strong>ses</strong> notes, de son côté. Écoutez les deux.</li>" +
    "<li>Même plan, deux chansons différentes&nbsp;: c'est exactement ce que font deux développeurs devant le même cahier des charges.</li>" +
    "</ol>"
  ),

  // ── 9. Les mots ──────────────────────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots du plan",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "Le plan",            right: "La forme, sans les notes" },
      { left: "Un moment du plan",  right: "Un ▶ Jouer à écrire" },
      { left: "Un bloc à fabriquer", right: "Un morceau qui revient" },
      { left: "Six moments",        right: "Trois blocs seulement" },
      { left: "Changer les notes",  right: "Même plan, autre chanson" },
    ],
  }),

  // ── 10. Le thème est prêt, le jalon arrive ───────────────────────────────
  texte(
    "<h3>🏆 Tu fais le plan avant de coder</h3>" +
    "<p>Tu repères ce qui revient dans un morceau, avant d'avoir posé un seul bloc.</p>" +
    "<p>Tu sais combien de blocs fabriquer, et dans quel ordre les appeler.</p>" +
    "<p>Tu sais que le plan dit la forme, pas les notes — et qu'un même plan porte mille chansons.</p>" +
    "<p class=\"mt-3\">Les développeurs font exactement ça devant un vrai projet&nbsp;: ils écrivent la forme, ils repèrent ce qui se répète, puis ils codent. Toi aussi, maintenant.</p>" +
    "<h4>La prochaine fois</h4>" +
    "<p>🏆 <strong>La veillée du Griot.</strong> Tu vas coder une vraie chanson, entière, du plan jusqu'à la dernière note — et la faire écouter. Tout ce que tu as appris depuis la première boucle va servir d'un coup.</p>"
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
ok(musiques.length === 3, `3 défis musicaux (trouvé ${musiques.length})`);
ok(musiques.every((b) => b.content.blocs_distincts === 3), "chaque défi exige les trois blocs");
const plan = ap.find((b) => b.content.game_type === "plan_builder");
ok(!!plan, "le plan est là");
// Un plan à distracteurs doit avouer ses pièges ou annoncer le total de cartes.
const total = (plan?.content.phases ?? []).length + (plan?.content.distracteurs ?? []).length;
ok(new RegExp(`\\b${total}\\b|neuf|huit|sept`, "i").test(plan?.content.description ?? ""),
   `la consigne annonce bien ses ${total} cartes`);
const q = ap.find((b) => b.type === "quiz");
ok(new Set((q?.content.questions ?? []).map((x) => x.answer)).size > 1, "les bonnes réponses du quiz ne sont pas toutes au même rang");
ok((q?.content.questions ?? []).every((x) => x.explanation), "chaque question s'explique");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
