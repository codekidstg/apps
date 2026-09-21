/**
 * Explorateur, thème musique — séance 1 : « Le tambour qui répète »,
 * et ses quatre entraînements.
 *
 *     node scripts/explorateur-musique-s1.mjs                       aperçu
 *     node scripts/explorateur-musique-s1.mjs --ecrire --sauvegarde=<fichier.json>
 *
 * La pratique d'abord : 9 blocs sur 13 font jouer, trier, compter ou taper sur
 * la table. Les 4 textes sont courts, et chacun s'appuie sur ce que l'enfant
 * vient de faire. L'histoire et les consignes vivent dans les défis eux-mêmes.
 *
 * Le thème 0 a déjà fait jouer des boucles au piano : rien ici ne prétend les
 * « découvrir ». La nouveauté, c'est le rythme — trois frappes, le silence qui
 * compte, et l'oreille pour vérifier un programme.
 *
 *   obj. 1  retrouver la boucle et le motif de Kirikou dans un rythme   blocs 0, 5, 6, 10
 *   obj. 2  entendre qu'une boucle joue ce que jouent les blocs recopiés blocs 2, 3, 4
 *   obj. 3  prévoir le nombre de sons : tours × sons d'un tour         blocs 7, 8, 9, 10
 *
 * Tout ce qui se calcule est calculé ici, pas recopié : les cibles des défis,
 * les bonnes réponses des quiz et des tris sortent d'un même petit interprète,
 * qui rejoue aussi la solution attendue de chaque défi avant toute écriture.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } });
const ECRIRE = process.argv.includes("--ecrire");
const SAUVEGARDE = process.argv.find((a) => a.startsWith("--sauvegarde="))?.split("=")[1];
const LECON = "Le tambour qui répète";

const pause = (ms) => new Promise((r) => setTimeout(r, ms));
async function g(t, c, f) {
  for (let i = 0; i < 5; i++) {
    let q = db.from(t).select(c); if (f) q = f(q);
    const { data, error } = await q;
    if (!error) return data;
    if (i === 4) throw new Error(`${t} : ${error.message}`);
    await pause(1500);
  }
}

// ── Le petit interprète : le même que le jeu, sans le son ──────────────────
// Un programme s'écrit en abrégé : "Boum", "Tac", "Clap", "silence", ou
// { rep: N, corps: [...] } pour un bloc Répéter.
const deroule = (prog) => prog.flatMap((e) => (typeof e === "object" ? Array.from({ length: e.rep }, () => deroule(e.corps)).flat() : [e]));
// Comme le compteur du jeu : chaque son est un bloc ; un Répéter compte pour
// deux (le bloc et la case de son nombre), plus ce qu'il contient.
const blocs = (prog) => prog.reduce((n, e) => n + (typeof e === "object" ? 2 + blocs(e.corps) : 1), 0);
const sons = (prog) => deroule(prog).filter((s) => s !== "silence").length;
const pareil = (a, b) => { const x = deroule(a), y = deroule(b); return x.length === y.length && x.every((s, i) => s === y[i]); };
const fois = (n, motif) => ({ rep: n, corps: motif });

const LIBELLE = { Boum: "🥁 Boum", Tac: "✋ Tac", Clap: "👏 Clap", silence: "⏸ Silence" };
const lisible = (prog) => prog.map((e) => (typeof e === "object" ? `Répéter ${e.rep} fois : ${lisible(e.corps)}` : e === "silence" ? "⏸" : e)).join(", ");

// ── Les rythmes de la séance ────────────────────────────────────────────────
const GRIOT      = ["Boum", "Boum", "Clap", "silence"];
const DOUZE      = deroule([fois(3, GRIOT)]);
const VEILLEE    = ["Boum", "Tac", "Clap"];
const TAMBOUR    = ["music_drum", "music_pause", "controls_repeat_ext"];
const TEMPO      = 340;

const txt = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

// Chaque défi musical porte sa solution de référence, rejouée plus bas.
const DEFIS = [];
const defi = (content, reference, recopieInterdite = false) => {
  DEFIS.push({ content, reference, recopieInterdite });
  return jeu(content);
};

// ── La séance ───────────────────────────────────────────────────────────────
const BLOCS = [
  txt(`<h2>🥁 La boucle entre dans la Case du Griot</h2>
<p>Avec Kirikou, tu as allumé 40 lampes avec <strong>un seul bloc Répéter</strong>, et tu as trouvé des motifs dans des escaliers.</p>
<p>Aujourd'hui, ta boucle va jouer du tambour. Et au tambour, il y a un secret : <strong>le silence compte</strong>.</p>
<p>D'abord, écoute. Pose des blocs, appuie sur ▶ Jouer.</p>`),

  defi({
    game_type: "music",
    title: "Premier contact",
    instructions: "Le tambour a trois sons : 🥁 Boum (la main au milieu), ✋ Tac (les doigts sur le bord), 👏 Clap (les mains). ⏸ Silence : un temps où l'on ne joue rien. Pose au moins 4 sons, mélange-les, écoute !",
    free_mode: true, min_notes: 4,
    available_blocks: ["music_drum", "music_pause"], tempo: TEMPO,
  }, ["Boum", "Tac", "Clap", "Boum"]),

  defi({
    game_type: "music",
    title: "Le rythme du Griot, à la main",
    instructions: "Le Griot joue Boum, Boum, Clap, puis se tait un temps. Et il recommence : trois fois en tout. Clique sur 🔊 Écouter le modèle, puis pose-le bloc par bloc — oui, les 12 !",
    target_notes: DOUZE,
    available_blocks: ["music_drum", "music_pause"], tempo: TEMPO,
  }, DOUZE),

  defi({
    game_type: "music",
    title: "Le même rythme, en 6 blocs",
    steps: [
      "Pose un bloc 🔁 Répéter et mets 3 dans sa case",
      "Glisse DEDANS : Boum, Boum, Clap, Silence",
      "▶ Jouer — écoute bien : c'est exactement le même rythme qu'avec tes 12 blocs !",
    ],
    target_notes: DOUZE, max_blocks: 6,
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, [fois(3, GRIOT)], true),
];

// Le quiz « même rythme, ou pas ? » : la bonne réponse est calculée.
const MEME = [
  { gauche: ["Boum", "Tac", "Boum", "Tac", "Boum", "Tac"], droite: [fois(3, ["Boum", "Tac"])],
    oui: "La boucle joue Boum, Tac, trois fois : exactement les 6 sons de gauche.", non: "" },
  { gauche: [fois(2, ["Boum", "Clap"])], droite: [fois(2, ["Boum", "Clap", "silence"])],
    oui: "", non: "On entend les mêmes sons, mais pas au même moment : le silence laisse un trou d'un temps. Au tambour, ça change tout." },
  { gauche: ["Boum", "Boum", "Clap", "Boum", "Boum", "Clap"], droite: [fois(3, ["Boum", "Boum", "Clap"])],
    oui: "", non: "À gauche, le motif passe 2 fois. La boucle, elle, le joue 3 fois : un tour de trop." },
];
BLOCS.push({
  type: "quiz",
  content: {
    questions: MEME.map((q) => {
      const juste = pareil(q.gauche, q.droite);
      return {
        question: `« ${lisible(q.gauche)} » et « ${lisible(q.droite)} » — même rythme ?`,
        choices: ["Oui, exactement le même", "Non, pas le même"],
        answer: juste ? 0 : 1,
        explanation: juste ? q.oui : q.non,
      };
    }),
  },
});

const MOTIF_SELECT = ["Boum", "Tac", "Tac", "Boum", "Tac", "Tac", "Boum", "Tac", "Tac", "Clap"];
const MOTIF_BUILD  = ["Tac", "Boum", "Clap", "Boum", "Clap", "Boum", "Clap", "Boum", "Clap", "Tac"];
BLOCS.push(
  jeu({
    game_type: "pattern_select",
    title: "Le motif du Griot",
    description: "Le motif, c'est le plus petit morceau qui revient à l'identique — comme chez Kirikou. Clique sur son premier son, puis sur son dernier.",
    instructions: MOTIF_SELECT.map((s) => LIBELLE[s]),
    motif_start: 0, motif_end: 2, repetitions: 3,
    explanation: "Boum, Tac, Tac revient 3 fois. Le Clap de la fin n'arrive qu'une fois : il se joue après la boucle, tout seul.",
  }),
  jeu({
    game_type: "pattern_build",
    title: "Construis la boucle du Griot",
    description: "Choisis le motif, règle le nombre de tours, et regarde ce qui reste en dehors.",
    instructions: MOTIF_BUILD.map((s) => LIBELLE[s]),
    motif_start: 1, motif_end: 2, repetitions: 4,
    explanation: "Boum, Clap, quatre fois. Un Tac avant, un Tac après : ils restent en dehors de la boucle.",
  }),

  txt(`<h2>🧮 Compter avant d'écouter</h2>
<p>Un truc de musicien : <strong>compte les sons d'un seul tour</strong>, puis multiplie par le nombre de tours.</p>
<p><code>Répéter 4 fois : Boum, Boum, Clap, ⏸</code></p>
<p>Un tour = 3 sons (le silence ne fait pas de bruit). 4 tours → <strong>4 × 3 = 12 sons</strong>.</p>
<p>Le silence prend quand même sa place : ce rythme dure 16 temps.</p>`),
);

// Le quiz « combien de sons ? » : les réponses sortent de l'interprète.
const COMPTE = [
  { prog: [fois(5, ["Boum", "Clap"])], choix: [5, 7, 10],
    expl: "2 sons par tour, 5 tours : 2 × 5 = 10." },
  { prog: [fois(4, GRIOT)], choix: [16, 12, 4],
    expl: "3 sons par tour — le silence ne sonne pas. 3 × 4 = 12." },
  { prog: [fois(3, ["Tac"]), "Clap"], choix: [4, 6, 3],
    expl: "La boucle joue 3 Tac. Le Clap est en dehors : il ne sonne qu'une fois. 3 + 1 = 4.",
    texte: "Répéter 3 fois : Tac — puis un Clap tout seul. Combien de sons ?" },
];
const TOURS_20 = { motif: ["Boum", "Tac", "Tac", "Clap"], voulu: 20, choix: [4, 5, 20] };
const bonTours = TOURS_20.voulu / sons(TOURS_20.motif);
BLOCS.push({
  type: "quiz",
  content: {
    questions: [
      ...COMPTE.map((q) => ({
        question: q.texte ?? `${lisible(q.prog)} — combien de sons ?`,
        choices: q.choix.map(String),
        answer: q.choix.indexOf(sons(q.prog)),
        explanation: q.expl,
      })),
      {
        question: `Le Griot veut ${TOURS_20.voulu} sons avec le motif Boum, Tac, Tac, Clap. Combien de tours ?`,
        choices: TOURS_20.choix.map(String),
        answer: TOURS_20.choix.indexOf(bonTours),
        explanation: `Un tour fait ${sons(TOURS_20.motif)} sons. ${bonTours} tours × ${sons(TOURS_20.motif)} = ${TOURS_20.voulu}.`,
      },
    ],
  },
});

BLOCS.push(
  defi({
    game_type: "music",
    title: "Le rythme de la veillée",
    instructions: "Le Griot veut 24 sons, avec son motif : Boum, Tac, Clap. Combien de tours faut-il ? Calcule d'abord, puis écris ta boucle — 5 blocs au plus.",
    target_notes: deroule([fois(8, VEILLEE)]), max_blocks: 5,
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, [fois(8, VEILLEE)], true),

  txt(`<h2>👐 Avec ton mentor — L'écho du Griot</h2>
<p><strong>1.</strong> Ton mentor tape un rythme sur la table, plusieurs fois de suite.</p>
<p><strong>2.</strong> Toi, tu retrouves le motif et tu comptes les tours. Écris la boucle sur une feuille : « Répéter … fois : … ».</p>
<p><strong>3.</strong> Joue-la à ton tour sur la table. Si c'est le même rythme, c'est gagné.</p>
<p><strong>4.</strong> On inverse : c'est toi le Griot !</p>`),

  jeu({
    game_type: "memory",
    title: "Les mots du tambour",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "🔁 Répéter 4 fois", right: "La même chose, 4 fois de suite" },
      { left: "Le motif", right: "Le morceau qui revient" },
      { left: "⏸ Silence", right: "Un temps sans bruit" },
      { left: "Tours × sons d'un tour", right: "Le nombre de sons" },
    ],
  }),

  txt(`<h2>🏆 Tu joues du tambour avec une boucle</h2>
<ul>
<li>Tu trouves le motif d'un rythme, silence compris.</li>
<li>Tu écris la boucle au lieu de tout recopier — et tu entends que c'est pareil.</li>
<li>Tu comptes les sons avant d'écouter : les tours × les sons d'un tour.</li>
</ul>
<h3>La prochaine fois</h3>
<p>Et si le motif se répétait déjà à l'intérieur ? Une boucle… dans une boucle.</p>`),
);

// ── Les entraînements ───────────────────────────────────────────────────────
const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
const jeuEntr = (content) => ({ type: "blockly_challenge", content });

const PAIRES = [
  { id: "s1", gauche: ["Boum", "Clap", "Boum", "Clap", "Boum", "Clap"], droite: [fois(3, ["Boum", "Clap"])],
    hint: "Trois fois Boum, Clap, de chaque côté : c'est exactement la boucle." },
  { id: "s2", gauche: ["Boum", "Boum", "Tac", "Boum", "Boum", "Tac"], droite: [fois(3, ["Boum", "Boum", "Tac"])],
    hint: "À gauche le motif passe 2 fois, la boucle le joue 3 fois : un tour de trop." },
  { id: "s3", gauche: ["Tac", "silence", "Tac", "silence"], droite: [fois(2, ["Tac"])],
    hint: "La boucle a oublié le silence : les deux Tac arrivent collés." },
  { id: "s4", gauche: ["Boum", "Tac", "Clap", "Boum", "Tac", "Clap"], droite: [fois(2, ["Boum", "Clap", "Tac"])],
    hint: "Mêmes sons, mais pas dans le même ordre : Clap et Tac sont inversés." },
  { id: "s5", gauche: ["Clap", "silence", "Clap", "silence", "Clap", "silence"], droite: [fois(3, ["Clap", "silence"])],
    hint: "Le silence est dans la boucle : il revient à chaque tour, comme à gauche." },
  { id: "s6", gauche: ["Boum", "Boum", "Boum", "Boum"], droite: [fois(4, ["Boum"])],
    hint: "Quatre Boum d'un côté, quatre tours de l'autre." },
];

const BACS = [8, 12, 16];
const A_RANGER = [
  { id: "a", prog: [fois(4, ["Boum", "Clap"])] },
  { id: "b", prog: [fois(2, ["Boum", "Tac", "Tac", "Clap"])] },
  { id: "c", prog: [fois(3, ["Boum", "Boum", "Clap", "Clap"])] },
  { id: "d", prog: [fois(4, GRIOT)], hint: "Le piège : 16 temps, mais le silence ne sonne pas. 3 sons × 4 tours = 12." },
  { id: "e", prog: [fois(8, ["Tac", "Clap"])] },
  { id: "f", prog: [fois(4, ["Boum", "Tac", "Tac", "Clap"])] },
];

const MON_RYTHME = { min: 16, max: 8, reference: [fois(4, ["Boum", "Tac", "Clap", "Clap"])] };

const ENTRAINEMENTS = [
  {
    title: "Même rythme, ou pas ?",
    description: "Une boucle et des blocs recopiés : jouent-ils exactement le même rythme ?",
    xp_reward: 30,
    blocs: [
      kodi("<p>Deux programmes. Écoute-les dans ta tête : jouent-ils <strong>exactement</strong> le même rythme ?</p><p>Attention au silence : il ne fait pas de bruit, mais il change le rythme.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Même rythme, ou pas ?",
          instruction: "Déroule la boucle dans ta tête, puis compare son par son.",
          helper: { title: "Comment décider ?", criteria: [
            "Écris chaque tour de la boucle à la suite",
            "Compare son par son, silence compris",
            "Un son différent ou un tour de trop : ce n'est plus le même rythme",
          ] },
          categories: [
            { id: "pareil", label: "Même rythme", color: "#10b981", emoji: "✅" },
            { id: "different", label: "Pas le même", color: "#ef4444", emoji: "❌" },
          ],
          items: PAIRES.map((p) => ({
            id: p.id, emoji: "🥁",
            label: `${lisible(p.gauche)}  ⟷  ${lisible(p.droite)}`,
            correct: pareil(p.gauche, p.droite) ? "pareil" : "different",
            hint: p.hint,
          })),
        },
      },
    ],
  },
  {
    title: "Le motif du tambour",
    description: "Trouve ce qui revient — silence compris — puis construis la boucle.",
    xp_reward: 35,
    blocs: [
      kodi("<p>Au tambour, le silence fait partie du motif. Quand tu cherches ce qui revient, compte-le aussi !</p>"),
      jeuEntr({
        game_type: "pattern_select",
        title: "Un motif avec un silence",
        description: "Clique sur le premier son du motif, puis sur le dernier.",
        instructions: deroule([fois(3, ["Boum", "Clap", "silence"])]).map((s) => LIBELLE[s]),
        motif_start: 0, motif_end: 2, repetitions: 3,
        explanation: "Boum, Clap, silence : trois temps, trois fois. Sans son silence, le rythme courrait trop vite.",
      }),
      kodi("<p>Celui-ci est plus long. Regarde bien où il s'arrête… et ce qui reste à la fin.</p>"),
      jeuEntr({
        game_type: "pattern_build",
        title: "Le grand motif",
        description: "Choisis le motif, règle le nombre de tours, et regarde ce qui reste.",
        instructions: [...deroule([fois(3, ["Boum", "Boum", "Tac", "Clap"])]), "Boum"].map((s) => LIBELLE[s]),
        motif_start: 0, motif_end: 3, repetitions: 3,
        explanation: "Boum, Boum, Tac, Clap : un motif de 4 sons, joué 3 fois. Le dernier Boum reste en dehors.",
      }),
    ],
  },
  {
    title: "Combien de sons ?",
    description: "Les sons d'un tour, fois le nombre de tours — et le silence ne sonne pas.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Compte les sons d'<strong>un seul tour</strong>, puis multiplie par le nombre de tours. Et n'oublie pas : le silence ne sonne pas !</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Range chaque boucle selon son nombre de sons",
          bins: [
            { id: "8", label: "8 sons", emoji: "8️⃣", color: "#10b981" },
            { id: "12", label: "12 sons", emoji: "🔟", color: "#3b82f6" },
            { id: "16", label: "16 sons", emoji: "🥁", color: "#a78bfa" },
          ],
          items: A_RANGER.map((it) => {
            const n = sons(it.prog);
            const parTour = sons(it.prog[0].corps);
            return {
              id: it.id, emoji: "🔁", label: lisible(it.prog), correct: String(n),
              hint: it.hint ?? `${parTour} sons par tour × ${it.prog[0].rep} tours = ${n}.`,
            };
          }),
        },
      },
      jeuEntr({
        game_type: "bug_hunt",
        title: "Le Griot compte faux",
        context: "Le Griot voulait 12 sons avec son motif Boum, Boum, Clap. Il n'en entend que 9.",
        description: "Une seule ligne est fausse — clique dessus.",
        instructions: ["Répéter 3 fois :", "   🥁 Boum", "   🥁 Boum", "   👏 Clap"],
        bug_index: 0,
        fix: "Répéter 4 fois :",
        explanation: "Le motif est juste : c'est le nombre de tours qui est faux. 3 sons par tour × 4 tours = 12.",
      }),
    ],
  },
  {
    title: "Mon rythme de Griot",
    description: "Invente ton rythme : au moins 16 sons, avec 8 blocs au plus.",
    xp_reward: 45,
    blocs: [
      kodi("<p>À toi de créer ! Invente ton rythme de Griot : <strong>au moins 16 sons, avec 8 blocs au plus</strong>. Impossible sans boucle… 😉</p><p>Ensuite, joue-le à ta famille — sur la table, avec les mains !</p>"),
      jeuEntr({
        game_type: "music",
        title: "Mon rythme de Griot",
        instructions: "Choisis ton motif, ton nombre de tours, et écoute ! Au moins 16 sons, 8 blocs au plus.",
        free_mode: true, min_notes: MON_RYTHME.min, max_blocks: MON_RYTHME.max,
        available_blocks: TAMBOUR, tempo: TEMPO,
      }),
    ],
  },
];

// ── Garde-fous : on rejoue tout avant d'écrire quoi que ce soit ────────────
let ko = 0;
const verifie = (c, m) => { if (!c) { console.log(`  ⛔ ${m}`); ko++; } };

for (const { content: c, reference, recopieInterdite } of DEFIS) {
  const joue = deroule(reference);
  if (c.target_notes) {
    verifie(pareil(reference, c.target_notes), `« ${c.title} » : la solution ne joue pas la cible`);
    if (recopieInterdite) verifie(blocs(c.target_notes) > c.max_blocks, `« ${c.title} » : recopier tiendrait dans la limite`);
  }
  if (c.free_mode) verifie(joue.filter((s) => s !== "silence").length >= c.min_notes, `« ${c.title} » : la référence n'a pas assez de sons`);
  if (c.max_blocks !== undefined) verifie(blocs(reference) <= c.max_blocks, `« ${c.title} » : la solution dépasse ${c.max_blocks} blocs (${blocs(reference)})`);
  const autorises = new Set(c.available_blocks);
  verifie(joue.every((s) => autorises.has(s === "silence" ? "music_pause" : "music_drum")), `« ${c.title} » : la solution utilise un bloc absent de la boîte`);
  if (reference.some((e) => typeof e === "object")) verifie(autorises.has("controls_repeat_ext"), `« ${c.title} » : Répéter indisponible`);
}
// Mon rythme de Griot : faisable, et impossible sans boucle.
verifie(sons(MON_RYTHME.reference) >= MON_RYTHME.min && blocs(MON_RYTHME.reference) <= MON_RYTHME.max, "Mon rythme : la référence ne tient pas");
verifie(MON_RYTHME.min > MON_RYTHME.max, "Mon rythme : on pourrait réussir sans boucle");

// Jeux de motif : le motif annoncé redonne exactement le programme.
const motifOk = (instr, d, f, n) => {
  const m = instr.slice(d, f + 1);
  const couvre = instr.slice(d, d + m.length * n);
  const juste = couvre.length === m.length * n && couvre.every((s, i) => s === m[i % m.length]);
  const suite = instr.slice(d + m.length * n, d + m.length * (n + 1));
  const pasSousCompte = !(suite.length === m.length && suite.every((s, i) => s === m[i]));
  return juste && pasSousCompte;
};
const jeuxMotif = [...BLOCS.map((b) => b.content), ...ENTRAINEMENTS.flatMap((e) => e.blocs.map((b) => b.content))]
  .filter((c) => c?.game_type === "pattern_select" || c?.game_type === "pattern_build");
for (const c of jeuxMotif) verifie(motifOk(c.instructions, c.motif_start, c.motif_end, c.repetitions), `« ${c.title} » : motif incohérent`);

// Quiz : chaque bonne réponse existe parmi les choix.
for (const b of BLOCS.filter((x) => x.type === "quiz")) {
  b.content.questions.forEach((q, i) => verifie(q.answer >= 0 && q.answer < q.choices.length && q.explanation, `quiz, question ${i + 1} : réponse ou explication absente`));
}
// Tri : chaque bac attendu existe.
for (const it of ENTRAINEMENTS[2].blocs[1].content.items) verifie(BACS.map(String).includes(it.correct), `tri « ${it.label} » : ${it.correct} sons, aucun bac`);
// Chasse au bug : la version fausse donne 9, la corrigée 12.
verifie(sons([fois(3, ["Boum", "Boum", "Clap"])]) === 9 && sons([fois(4, ["Boum", "Boum", "Clap"])]) === 12, "chasse au bug : les comptes ne tombent pas");

if (ko) throw new Error(`${ko} garde-fou(s) en échec — rien n'est écrit`);
console.log(`✓ ${DEFIS.length} défis rejoués, ${jeuxMotif.length} jeux de motif, quiz, tri et chasse au bug cohérents`);

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs, ${ENTRAINEMENTS.length} entraînements\n`);
BLOCS.forEach((b, i) => {
  const c = b.content;
  const quoi = c.game_type ?? b.type;
  const titre = c.title ?? (b.type === "text" ? (String(c.html).match(/<h2>(.*?)<\/h2>/)?.[1] ?? "") : `${c.questions?.length} questions`);
  console.log(`  [${String(i).padStart(2)}] ${quoi.padEnd(15)} ${titre}`);
});
ENTRAINEMENTS.forEach((e, i) =>
  console.log(`  entr. ${i} ${e.title.padEnd(26)} ${e.xp_reward} XP — ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

// --detail : ce que l'interprète a calculé, pour le relire avant d'écrire.
if (process.argv.includes("--detail")) {
  console.log("\n── Quiz (réponses calculées) ──");
  for (const b of BLOCS.filter((x) => x.type === "quiz")) {
    for (const q of b.content.questions) console.log(`  ${q.question}\n     → ${q.choices[q.answer]}  | ${q.explanation}`);
  }
  console.log("\n── Tri « même rythme, ou pas ? » ──");
  for (const it of ENTRAINEMENTS[0].blocs[1].content.items) console.log(`  ${it.correct.padEnd(9)} ${it.label}`);
  console.log("\n── Bacs « combien de sons ? » ──");
  for (const it of ENTRAINEMENTS[2].blocs[1].content.items) console.log(`  ${it.correct.padStart(2)} sons  ${it.label}  | ${it.hint}`);
  console.log("\n── Défis musicaux ──");
  for (const b of BLOCS.filter((x) => x.content.game_type === "music")) {
    const c = b.content;
    console.log(`  ${c.title.padEnd(32)} ${c.target_notes ? `${c.target_notes.length} temps` : `libre, ${c.min_notes} sons min.`}  · ${c.max_blocks ?? "—"} blocs max`);
  }
}

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }
if (!SAUVEGARDE) throw new Error("--sauvegarde=<fichier.json> est obligatoire avec --ecrire : l'ancien contenu y est copié avant d'être remplacé");

// ── Application ─────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id,status,objectives", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
if (L.status !== "draft") throw new Error("la leçon n'est pas en brouillon — refus par prudence");
if ((L.objectives?.length ?? 0) !== 3) throw new Error("les 3 objectifs doivent être écrits avant le contenu");

// Un enfant qui aurait commencé l'ancienne version garderait des états de jeu
// attachés à des blocs qui n'existeraient plus.
const progres = await g("lesson_progress", "id", (q) => q.eq("lesson_id", L.id));
if (progres.length) throw new Error(`${progres.length} élève(s) ont commencé cette leçon — refus`);
const dejaEntr = await g("trainings", "id", (q) => q.eq("lesson_id", L.id));
if (dejaEntr.length) throw new Error(`${dejaEntr.length} entraînement(s) existent déjà — ce script n'écrase pas`);

const anciens = await g("lesson_blocks", "*", (q) => q.eq("lesson_id", L.id).order("order_index"));
fs.writeFileSync(SAUVEGARDE, JSON.stringify(anciens, null, 2));
console.log(`\n  ✓ ${anciens.length} anciens blocs sauvegardés dans ${SAUVEGARDE}`);

const { error: ed } = await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
if (ed) throw new Error(`suppression : ${ed.message}`);
const { error: ei } = await db.from("lesson_blocks").insert(
  BLOCS.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, order_index: i, type: b.type, content: b.content })),
);
if (ei) throw new Error(`insertion des blocs : ${ei.message} — l'ancien contenu est dans ${SAUVEGARDE}`);

for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: L.id, title: e.title, description: e.description, xp_reward: e.xp_reward, order_index: i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const { error: eb } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
  );
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
}

// ── Relecture ───────────────────────────────────────────────────────────────
let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const apres = await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id).order("order_index"));
ok(apres.length === BLOCS.length, `${apres.length} blocs (attendu ${BLOCS.length})`);
ok(apres.every((b, i) => b.order_index === i), "séquence contiguë");
ok(apres.every((b) => b.content && Object.keys(b.content).length), "tous remplis");
const tr = await g("trainings", "id,title,order_index", (q) => q.eq("lesson_id", L.id).order("order_index"));
ok(tr.length === 4 && tr.every((t, i) => t.order_index === i), `${tr.length} entraînements contigus`);
for (const t of tr) {
  const tb = await g("training_blocks", "order_index,content", (q) => q.eq("training_id", t.id).order("order_index"));
  ok(tb.length > 0 && tb.every((b, i) => b.order_index === i && b.content && Object.keys(b.content).length), `« ${t.title} » — ${tb.length} blocs`);
}
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
