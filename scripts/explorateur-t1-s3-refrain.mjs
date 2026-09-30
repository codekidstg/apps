/**
 * Explorateur — thème 1, séance 3 : « Mon refrain a un nom ».
 *
 *     node scripts/explorateur-t1-s3-refrain.mjs [--ecrire] [--refaire]
 *
 * La séance 2 se termine sur ces mots, écrits noir sur blanc : « Le Griot
 * chante un refrain qui revient… mais entre des couplets à chaque fois
 * différents. Aucune boucle ne sait faire ça. Il faudra donner un nom au
 * refrain. » Cette séance commence exactement là.
 *
 * Le contenu qui occupait ce créneau enseignait le paramètre — parce que le
 * moteur musical ne connaissait que quatre blocs et ne savait pas faire de
 * fonction. Il le sait depuis le 30 septembre 2026.
 *
 * L'argument de cette séance n'est PAS l'économie de blocs : nommer un refrain
 * de trois notes appelé deux fois n'en économise aucun. L'argument, c'est
 * qu'on l'écrit à UN SEUL endroit — et qu'on le change à un seul endroit. Tout
 * la séance tourne autour de ça, et le défi 3 le fait sentir au lieu de le dire.
 */
import { base, lecteur } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Mon refrain a un nom";

// ── Le morceau, écrit une fois et compté par le script ────────────────────
const REFRAIN  = ["Do", "Mi", "Sol"];
const COUPLET1 = ["La", "Si"];
const COUPLET2 = ["Fa", "Re"];

const morceau = (...parts) => parts.flat();
const COURT = morceau(REFRAIN, COUPLET1, REFRAIN);                      //  8 sons
const LONG  = morceau(REFRAIN, COUPLET1, REFRAIN, COUPLET2, REFRAIN);   // 13 sons

// Garde-fous : les nombres annoncés dans les textes doivent être ceux-là.
if (COURT.length !== 8)  throw new Error(`le morceau court fait ${COURT.length} sons, attendu 8`);
if (LONG.length !== 13)  throw new Error(`le morceau long fait ${LONG.length} sons, attendu 13`);
if (REFRAIN.length * 3 !== 9) throw new Error("trois refrains ne font plus 9 notes");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const NOTES_SEULES = ["music_play_note"];
const AVEC_BLOCS   = ["music_play_note", "music_define", "music_call"];

const BLOCS = [
  // ── 0. L'accroche : le mur laissé la semaine dernière ────────────────────
  texte(
    "<h3>🎤 Le refrain revient, les couplets changent</h3>" +
    "<p>Écoute le Griot : il chante <strong>Do&nbsp;Mi&nbsp;Sol</strong>, puis <em>La&nbsp;Si</em>, puis encore <strong>Do&nbsp;Mi&nbsp;Sol</strong>.</p>" +
    "<p>Le morceau du milieu change à chaque fois. Le premier et le dernier, non : c'est le <strong>refrain</strong>.</p>" +
    "<p>Une boucle répète toujours la même chose, collée. Ici, il y a quelque chose entre les deux. <strong>Aucune boucle ne sait faire ça.</strong></p>" +
    "<p>Commence par l'écrire à la main. Tu verras vite le problème.</p>"
  ),

  // ── 1. On pratique tout de suite : à la main, et c'est long ──────────────
  jeu({
    game_type: "music",
    title: "Défi 1 — Le morceau, à la main",
    instructions:
      "Écoute le modèle, puis joue-le note par note : Do Mi Sol, La Si, Do Mi Sol.\n" +
      "Compte tes blocs à la fin — tu en auras besoin dans deux minutes.",
    target_notes: COURT,
    available_blocks: NOTES_SEULES,
    tempo: 400,
  }),

  // ── 2. L'explication, après l'avoir fait ─────────────────────────────────
  texte(
    "<h3>🎼 Donne un nom à ton refrain</h3>" +
    "<p>Tu viens d'écrire <strong>Do&nbsp;Mi&nbsp;Sol deux fois</strong>. Et si le Griot en veut cinq&nbsp;? Dix&nbsp;?</p>" +
    "<p>Pire : s'il change d'avis et veut <em>Do&nbsp;Mi&nbsp;La</em>, il faut aller corriger <strong>partout</strong>. Et en oublier un, c'est fatal.</p>" +
    "<p>Alors on fait autrement. On fabrique un bloc, on lui donne un <strong>nom</strong>, et on le range à côté&nbsp;:</p>" +
    "<pre>🎼 Mon bloc <b>Refrain</b>\n     🎵 Do\n     🎵 Mi\n     🎵 Sol</pre>" +
    "<p>Ensuite, chaque fois qu'on en a besoin, on écrit juste&nbsp;: <strong>▶ Jouer Refrain</strong>.</p>" +
    "<p>Écrit <strong>une fois</strong>. Joué <strong>autant de fois qu'on veut</strong>.</p>"
  ),

  // ── 3. Le même morceau, avec le bloc nommé ──────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 2 — Le même morceau, avec un bloc nommé",
    instructions:
      "Exactement le même morceau qu'au défi 1, mais autrement.\n" +
      "1. Fabrique 🎼 Mon bloc Refrain, et mets Do Mi Sol dedans.\n" +
      "2. Écris : ▶ Jouer Refrain, puis La et Si, puis ▶ Jouer Refrain.",
    target_notes: COURT,
    available_blocks: AVEC_BLOCS,
    bloc_nomme: 2,
    tempo: 400,
  }),

  // ── 4. Le piège de la séance a son propre moment ─────────────────────────
  texte(
    "<h3>⚠️ Fabriquer n'est pas jouer</h3>" +
    "<p>Le bloc <strong>🎼 Mon bloc</strong> ne se branche ni au-dessus ni en dessous des autres. Il se pose <strong>à côté</strong>, tout seul.</p>" +
    "<p>Et il ne sonne pas. Si tu le poses sans rien d'autre, tu n'entends <strong>rien</strong>.</p>" +
    "<p>C'est normal&nbsp;: <em>écrire</em> un refrain n'est pas le <em>chanter</em>. Le Griot l'a dans la tête ; tant qu'il ne le chante pas, personne ne l'entend.</p>" +
    "<p>C'est <strong>▶ Jouer Refrain</strong> qui le fait sonner.</p>"
  ),

  // ── 5. Le quiz ───────────────────────────────────────────────────────────
  // Le quiz n'est pas un jeu : c'est son propre type de bloc. Écrit en `game`,
  // il ne s'affichait tout simplement pas dans le lecteur.
  {
    type: "quiz",
    content: {
    questions: [
      {
        question: "Tu poses 🎼 Mon bloc Refrain avec Do Mi Sol dedans, et rien d'autre. Qu'est-ce qu'on entend ?",
        choices: ["Do Mi Sol", "Do Mi Sol trois fois", "Rien du tout"],
        answer: 2,
        explanation: "Fabriquer n'est pas jouer. Le bloc est rangé, prêt — mais tant que personne n'écrit ▶ Jouer Refrain, il reste muet.",
      },
      {
        question: "Ton bloc Refrain joue Do Mi Sol. Tu écris ▶ Jouer Refrain trois fois. Combien de notes entend-on ?",
        choices: ["9", "3", "1"],
        answer: 0,
        explanation: "3 notes dans le bloc, joué 3 fois : 3 × 3 = 9 notes.",
      },
      {
        question: "Tu remplaces le Sol de ton bloc Refrain par un La. Combien d'endroits as-tu modifiés ?",
        choices: ["Trois", "Un seul", "Autant que de ▶ Jouer"],
        answer: 1,
        explanation: "Un seul — celui qui est DANS le bloc. C'est tout l'intérêt de lui avoir donné un nom.",
      },
      {
        question: "Et dans le morceau, combien de refrains ont changé ?",
        choices: ["Le premier", "Aucun", "Tous"],
        answer: 2,
        explanation: "Tous. Chaque ▶ Jouer Refrain va chercher le bloc, et le bloc a changé. Un seul geste, tout le morceau suit.",
      },
    ],
    },
  },

  // ── 6. Remettre un programme en ordre ────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets le morceau en ordre",
    description: "Un bloc Refrain de trois notes, puis le morceau : Refrain, La Si, Refrain.",
    hint: "La définition se pose d'abord — on ne peut pas jouer un bloc qui n'existe pas encore.",
    items: [
      "🎼 Mon bloc Refrain :",
      "   🎵 Do, Mi, Sol",
      "▶ Jouer Refrain",
      "🎵 La, Si",
      "▶ Jouer Refrain",
    ],
  }),

  // ── 7. Le Griot en veut plus : le bloc sert trois fois ───────────────────
  jeu({
    game_type: "music",
    title: "Défi 3 — Le Griot en veut trois",
    instructions:
      "Le Griot ajoute un deuxième couplet : Fa Ré.\n" +
      "Le morceau devient : Refrain, La Si, Refrain, Fa Ré, Refrain.\n" +
      "Ton bloc Refrain ne change pas — tu l'appelles simplement une fois de plus.",
    target_notes: LONG,
    available_blocks: AVEC_BLOCS,
    bloc_nomme: 3,
    tempo: 400,
  }),

  // ── 8. Le sien ───────────────────────────────────────────────────────────
  jeu({
    game_type: "music",
    title: "Défi 4 — Ton refrain à toi 🎨",
    instructions:
      "À toi de composer. Fabrique ton propre bloc Refrain, avec les notes que tu veux.\n" +
      "Puis écris un morceau où ton refrain revient au moins deux fois, avec autre chose entre les deux.\n" +
      "Au moins 8 sons en tout.",
    free_mode: true,
    min_notes: 8,
    available_blocks: [...AVEC_BLOCS, "controls_repeat_ext"],
    bloc_nomme: 2,
    tempo: 400,
  }),

  // ── 9. Avec le mentor, loin de l'écran ───────────────────────────────────
  texte(
    "<h3>👐 Avec ton mentor — Le refrain de la classe</h3>" +
    "<ol>" +
    "<li>Inventez ensemble un <strong>refrain</strong> de trois gestes : taper, claquer, sauter. Donnez-lui un nom.</li>" +
    "<li>Ton mentor annonce le morceau à voix haute&nbsp;: « <em>Refrain, tourne sur toi, Refrain, assieds-toi, Refrain</em> ».</li>" +
    "<li>Fais-le. Combien de fois as-tu fait les trois gestes&nbsp;? Compte.</li>" +
    "<li>Maintenant ton mentor change <strong>un seul geste du refrain</strong>. Refaites le morceau. Combien de choses ont changé&nbsp;?</li>" +
    "<li>À toi&nbsp;: invente un refrain, ton mentor le danse. Fais-le se tromper en changeant le refrain au milieu&nbsp;!</li>" +
    "</ol>"
  ),

  // ── 10. Les mots ─────────────────────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots du refrain",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "🎼 Mon bloc",   right: "Fabrique, sans faire de bruit" },
      { left: "▶ Jouer",       right: "Fait sonner le bloc" },
      { left: "Le refrain",    right: "Revient plusieurs fois" },
      { left: "Le couplet",    right: "Change à chaque fois" },
      { left: "Changer le bloc", right: "Change tout le morceau" },
    ],
  }),

  // ── 11. Ce qu'il sait faire, et le mur suivant ───────────────────────────
  texte(
    "<h3>🏆 Ton refrain a un nom</h3>" +
    "<p>Tu fabriques un bloc et tu lui donnes un nom.</p>" +
    "<p>Tu le joues autant de fois que tu veux, sans jamais le réécrire.</p>" +
    "<p>Tu sais qu'une définition ne sonne pas toute seule — il faut l'appeler.</p>" +
    "<p>Et tu sais qu'en changeant le bloc à <strong>un seul endroit</strong>, tout le morceau change.</p>" +
    "<p class=\"mt-3\">Les grands programmeurs font ça toute la journée. Ça porte un nom&nbsp;: une <strong>fonction</strong>. Tu viens d'en écrire une.</p>" +
    "<h4>La prochaine fois</h4>" +
    "<p>Un seul bloc nommé, c'est bien. Mais un vrai morceau a un refrain <strong>et</strong> des couplets — et les couplets aussi méritent leur nom. Tu vas composer une chanson entière avec deux blocs qui se répondent.</p>"
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
ok(musiques.length === 4, `4 défis musicaux (trouvé ${musiques.length})`);
ok(musiques.filter((b) => b.content.bloc_nomme).length === 3, "trois défis exigent le bloc nommé");
ok(musiques.every((b) => b.content.free_mode || (b.content.target_notes ?? []).length > 0), "chaque défi dirigé a sa mélodie cible");
const q = ap.find((b) => b.type === "quiz");
ok(new Set((q?.content.questions ?? []).map((x) => x.answer)).size > 1, "les bonnes réponses du quiz ne sont pas toutes au même rang");
ok((q?.content.questions ?? []).every((x) => x.explanation), "chaque question s'explique");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
