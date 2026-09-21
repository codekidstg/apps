/**
 * Explorateur, thème musique — séance 2 : « La boucle dans la boucle »,
 * et ses quatre entraînements.
 *
 *     node scripts/explorateur-musique-s2.mjs [--detail]                aperçu
 *     node scripts/explorateur-musique-s2.mjs --ecrire --sauvegarde=<fichier.json>
 *
 * Le thème 0 n'a jamais imbriqué de boucles : tout est nouveau ici. L'ancien
 * contenu de cette leçon n'en faisait construire aucune — ses trois défis se
 * résolvaient avec une seule boucle, y compris « La phrase musicale imbriquée ».
 *
 * La règle qui tient la séance : pour que la boucle dans la boucle soit
 * NÉCESSAIRE, un son doit se répéter au moins 4 fois dans le motif ; sinon une
 * seule boucle tient dans la même limite de blocs. Le script le vérifie pour
 * chaque défi qui prétend l'exiger.
 *
 * La pratique d'abord : l'enfant joue le rythme avec ce qu'il sait (une seule
 * boucle), puis TRANSFORME sa boucle quand la limite baisse, puis ENTEND un
 * programme fautif et le répare. Le mot « boucle dans la boucle » n'arrive
 * qu'après qu'il l'a écrite.
 *
 *   obj. 1  mettre une boucle dans une autre            blocs 1, 2, 9
 *   obj. 2  compter : la petite boucle, puis les tours   blocs 3, 4, 8
 *   obj. 3  quelle boucle dedans, quel son dehors        blocs 4, 5, 6, 7
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
const LECON = "La boucle dans la boucle";

// L'objectif 2 décrivait le comptage de la séance 1 (« 3 tours de 4 sons »).
const OBJECTIF_2 = {
  avant: "Prévoir le nombre de sons avant d'écouter : 3 tours de 4 sons, 12 sons",
  apres: "Prévoir le nombre de sons avant d'écouter : compter la petite boucle, puis multiplier par les grands tours",
};

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
const deroule = (prog) => prog.flatMap((e) => (typeof e === "object" ? Array.from({ length: e.rep }, () => deroule(e.corps)).flat() : [e]));
// Comme le compteur du jeu : un Répéter compte pour deux (lui et son nombre).
const blocs = (prog) => prog.reduce((n, e) => n + (typeof e === "object" ? 2 + blocs(e.corps) : 1), 0);
const sons = (prog) => deroule(prog).filter((s) => s !== "silence").length;
const combien = (prog, son) => deroule(prog).filter((s) => s === son).length;
const pareil = (a, b) => { const x = deroule(a), y = deroule(b); return x.length === y.length && x.every((s, i) => s === y[i]); };
const imbrique = (prog, dansUneBoucle = false) => prog.some((e) => typeof e === "object" && ((dansUneBoucle && e.rep >= 2) || imbrique(e.corps, e.rep >= 2)));
/** La même musique avec une seule boucle : les petites boucles déroulées dans la grande. */
const uneSeuleBoucle = (prog) => prog.map((e) => (typeof e === "object" ? { rep: e.rep, corps: deroule(e.corps) } : e));
const fois = (n, corps) => ({ rep: n, corps });

const LIBELLE = { Boum: "🥁 Boum", Tac: "✋ Tac", Clap: "👏 Clap", silence: "⏸ Silence" };
const lisible = (prog) => prog.map((e) => (typeof e === "object" ? `Répéter ${e.rep} fois : [${lisible(e.corps)}]` : e === "silence" ? "⏸" : e)).join(", ");

// ── Les rythmes ─────────────────────────────────────────────────────────────
const B = "Boum", T = "Tac", C = "Clap";
const RYTHME          = [fois(3, [fois(4, [B]), C])];            // 15 temps
const BOUCLE_SEULE    = [fois(3, [B, B, B, B, C])];             // le même, en 7 blocs
const CLAP_AU_FOND    = [fois(3, [fois(4, [B, C])])];            // le bug : 24 temps
const QUI_DEDANS      = [fois(2, [fois(4, [T]), C])];            // 10 temps
const QUI_DEDANS_FAUX = [fois(4, [fois(2, [T]), C])];            // les nombres inversés : 12
const GRAND           = [fois(4, [fois(5, [B]), C])];            // 24 sons
const DEDANS_DEHORS   = [fois(3, [fois(4, [T]), B]), C];         // 16 temps, Clap dehors
const MA_DANSE        = { min: 24, max: 8, reference: [fois(4, [fois(4, [B]), C, T])] };

const TAMBOUR = ["music_drum", "music_pause", "controls_repeat_ext"];
const TEMPO = 340;
const txt = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

// Chaque défi porte sa solution de référence et ce qu'il prétend exiger.
const DEFIS = [];
const defi = (content, reference, exige = {}) => {
  DEFIS.push({ content, reference, exige });
  return jeu(content);
};

// ── La séance ───────────────────────────────────────────────────────────────
const BLOCS = [
  txt(`<h2>🥁 Un motif… qui se répète à l'intérieur</h2>
<p>Écoute le nouveau rythme du Griot : <strong>Boum, Boum, Boum, Boum, Clap</strong> — trois fois.</p>
<p>Tu sais déjà le jouer avec une boucle. Commence par là !</p>`),

  defi({
    game_type: "music",
    title: "Avec une seule boucle",
    instructions: "Clique sur 🔊 Écouter le modèle. Puis joue-le avec UNE boucle : 3 tours, et dedans Boum, Boum, Boum, Boum, Clap. 7 blocs au plus.",
    target_notes: deroule(RYTHME), max_blocks: 7,
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, BOUCLE_SEULE, { boucle: true }),

  defi({
    game_type: "music",
    title: "Transforme ta boucle",
    steps: [
      "Voici ta boucle. Joue-la : c'est le bon rythme… mais en 7 blocs.",
      "Plus que 6 blocs ! Regarde ton motif : les 4 Boum se répètent.",
      "Glisse un nouveau 🔁 Répéter DANS la grande boucle, mets 4, et un seul Boum dedans.",
      "Enlève les 3 autres Boum. Le Clap reste après la petite boucle, dans la grande.",
    ],
    depart: BOUCLE_SEULE,
    target_notes: deroule(RYTHME), max_blocks: 6,
    indice_limite: "Regarde dans ton motif : les 4 Boum se répètent encore… mets-les dans une petite boucle !",
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, RYTHME, { imbrication: true, departAJour: true }),

  txt(`<h2>🔁 Une boucle dans une boucle</h2>
<p>Tu viens de ranger une <strong>petite boucle</strong> dans une <strong>grande</strong>.</p>
<p>À chaque tour de la grande boucle, la petite fait <strong>tous</strong> ses tours — 4 Boum — puis vient le Clap.</p>
<p>Pour compter, pars de l'intérieur :</p>
<ul>
<li>la petite boucle : 4 sons ;</li>
<li>un grand tour : 4 + 1 Clap = 5 sons ;</li>
<li>3 grands tours : 3 × 5 = <strong>15 sons</strong>.</li>
</ul>`),
];

// Quiz : les réponses sortent de l'interprète.
const QUIZ = [
  { prog: [fois(2, [fois(3, [B]), C])], choix: [6, 8, 5], compte: sons,
    expl: "Un grand tour = 3 Boum + 1 Clap = 4 sons. 2 grands tours : 2 × 4 = 8. Pas 6 : les tours se multiplient, ils ne s'ajoutent pas." },
  { prog: RYTHME, choix: [12, 15, 7], compte: sons,
    expl: "Un grand tour = 4 Boum + 1 Clap = 5 sons. 3 × 5 = 15." },
  { prog: [fois(4, [fois(2, [T]), C, "silence"])], choix: [16, 12, 8], compte: sons,
    expl: "Un grand tour = 2 Tac + 1 Clap = 3 sons — le silence ne sonne pas. 4 × 3 = 12." },
  { prog: RYTHME, choix: [12, 3, 1], compte: (p) => combien(p, C),
    texte: `Dans « ${lisible(RYTHME)} », combien de fois sonne le Clap ?`,
    expl: "Le Clap est dans la grande boucle, pas dans la petite : il sonne une fois par grand tour. 3 fois." },
];
BLOCS.push({
  type: "quiz",
  content: {
    questions: QUIZ.map((q) => ({
      question: q.texte ?? `${lisible(q.prog)} — combien de sons ?`,
      choices: q.choix.map(String),
      answer: q.choix.indexOf(q.compte(q.prog)),
      explanation: q.expl,
    })),
  },
});

// Le tri : des lignes décalées, comme la chasse au bug du thème 0.
const LIGNES_TRI = ["Répéter 3 fois :", "   Répéter 4 fois :", "      🥁 Boum", "   👏 Clap", "✋ Tac"];
BLOCS.push(
  jeu({
    game_type: "sort",
    title: "Remets la boucle dans la boucle en ordre",
    description: "Le Griot joue 4 Boum puis un Clap, trois fois. Et à la toute fin, un seul Tac.",
    hint: "Regarde le décalage : plus une ligne est décalée, plus elle est rangée au fond.",
    items: LIGNES_TRI,
  }),

  defi({
    game_type: "music",
    title: "Le Clap qui s'est glissé au fond",
    instructions: "Le Griot voulait 4 Boum puis UN Clap, trois fois. Ce programme joue un Clap après CHAQUE Boum ! Écoute-le, trouve le Clap mal rangé, et répare-le.",
    depart: CLAP_AU_FOND,
    target_notes: deroule(RYTHME), max_blocks: 6,
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, RYTHME, { departFaux: true }),

  defi({
    game_type: "music",
    title: "Qui va dedans ?",
    instructions: "Le Griot tape 4 Tac puis un Clap, et il le fait 2 fois. Le 4 et le 2 : lequel va dans la petite boucle ? Écoute le modèle, puis décide.",
    target_notes: deroule(QUI_DEDANS), max_blocks: 6,
    indice_limite: "Regarde dans ton motif : un morceau s'y répète encore…",
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, QUI_DEDANS, { imbrication: true, inverseDistinct: QUI_DEDANS_FAUX }),

  defi({
    game_type: "music",
    title: "Le grand rythme du Griot",
    instructions: "Le Griot veut 24 sons. Son motif : 5 Boum, puis 1 Clap. Combien de grands tours ? Calcule d'abord, puis écris ta boucle dans la boucle — 6 blocs au plus.",
    target_notes: deroule(GRAND), max_blocks: 6,
    indice_limite: "Les 5 Boum : une petite boucle !",
    available_blocks: TAMBOUR, tempo: TEMPO,
  }, GRAND, { imbrication: true }),

  txt(`<h2>👐 Avec ton mentor — La danse des boucles</h2>
<p><strong>1.</strong> Ton mentor lit : « Répéter 3 fois : [ Répéter 4 fois : [tape du pied], frappe dans tes mains ] ».</p>
<p><strong>2.</strong> Avant de danser, compte : combien de coups de pied ? Combien de claps ?</p>
<p><strong>3.</strong> Danse-le ! Ton mentor vérifie.</p>
<p><strong>4.</strong> À toi d'écrire une danse avec une boucle dans une boucle. Ton mentor la danse… et se trompe exprès une fois. Trouve où !</p>`),

  jeu({
    game_type: "memory",
    title: "Les mots des boucles",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "Petite boucle", right: "Rangée dans la grande" },
      { left: "Tout au fond", right: "Sonne le plus souvent" },
      { left: "3 tours × 4 sons", right: "12 sons" },
      { left: "Dehors", right: "Une seule fois" },
    ],
  }),

  txt(`<h2>🏆 Tu ranges une boucle dans une boucle</h2>
<ul>
<li>Tu repères le motif qui se répète à l'intérieur du motif.</li>
<li>Tu comptes de l'intérieur vers l'extérieur.</li>
<li>Tu sais qu'un son rangé au fond sonne plus souvent qu'un son dehors.</li>
</ul>
<p>Plus tard, en Python, tu dessineras des rangées de cases avec la même idée.</p>
<h3>La prochaine fois</h3>
<p>Le Griot chante un refrain qui revient… mais entre des couplets à chaque fois différents. Aucune boucle ne sait faire ça. Il faudra donner un nom au refrain.</p>`),
);

// ── Les entraînements ───────────────────────────────────────────────────────
const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
const jeuEntr = (content) => ({ type: "blockly_challenge", content });

// Chaque grande boucle contient la petite ET un autre son : une imbrication
// qui ne contiendrait qu'une boucle n'aurait aucune raison d'être.
const BACS = [8, 12, 16];
const A_RANGER = [
  { id: "a", prog: [fois(2, [fois(3, [B]), C])] },
  { id: "b", prog: [fois(2, [fois(2, [T]), C, C])] },
  { id: "c", prog: [fois(3, [fois(3, [B]), C])] },
  { id: "d", prog: [fois(4, [fois(2, [T]), C, "silence"])], hint: "Le piège : 16 temps, mais le silence ne sonne pas. Un grand tour = 3 sons, × 4 = 12." },
  { id: "e", prog: [fois(4, [fois(3, [T]), C])] },
  { id: "f", prog: [fois(2, [fois(7, [B]), C])] },
];
const PHRASES = [
  { id: "p1", prog: [fois(3, [fois(4, [B]), T])], avant: "Répéter 3 fois : [Répéter 4 fois : [Boum], Tac] joue", apres: "sons.", faux: [12, 7],
    expl: "Un grand tour = 4 Boum + 1 Tac = 5 sons. 3 × 5 = 15." },
  { id: "p2", prog: [fois(2, [fois(5, [T]), C])], avant: "Répéter 2 fois : [Répéter 5 fois : [Tac], Clap] joue", apres: "sons.", faux: [10, 7],
    expl: "Un grand tour = 5 Tac + 1 Clap = 6 sons. 2 × 6 = 12." },
  { id: "p3", prog: [fois(2, [fois(5, [T]), C])], compte: (p) => combien(p, C), avant: "… et dans ce programme, le Clap sonne", apres: "fois.", faux: [10, 1],
    expl: "Le Clap est dans la grande boucle : une fois par grand tour, donc 2 fois." },
];
const PAIRES = [
  { id: "p1", gauche: [B, B, C, B, B, C], droite: [fois(2, [fois(2, [B]), C])],
    hint: "2 Boum puis Clap, deux fois : exactement la boucle dans la boucle." },
  { id: "p2", gauche: [T, T, T, T, C, T, T, T, T, C], droite: [fois(4, [fois(2, [T]), C])],
    hint: "Les nombres sont inversés : cette boucle joue 2 Tac puis Clap, quatre fois." },
  { id: "p3", gauche: [B, B, B, C, B, B, B, C], droite: [fois(2, [fois(3, [B, C])])],
    hint: "Le Clap est tombé dans la petite boucle : il sonne après chaque Boum." },
  { id: "p4", gauche: [T, T, C, T, T, C, B], droite: [fois(2, [fois(2, [T]), C]), B],
    hint: "Le Boum est dehors : il ne sonne qu'une fois, à la fin." },
  { id: "p5", gauche: [B, B, C, B, B, C, B], droite: [fois(2, [fois(2, [B]), C, B])],
    hint: "Le dernier Boum est dans la grande boucle : il sonne à chaque grand tour, pas une seule fois." },
  { id: "p6", gauche: [C, T, T, T, C, T, T, T], droite: [fois(2, [C, fois(3, [T])])],
    hint: "Le Clap d'abord, puis la petite boucle de 3 Tac : deux fois." },
];

const ENTRAINEMENTS = [
  {
    title: "Le motif dans le motif",
    description: "Trouve le grand motif… puis ce qui se répète à l'intérieur.",
    xp_reward: 30,
    blocs: [
      kodi("<p>Comme des boîtes rangées dans des boîtes : trouve d'abord le <strong>grand</strong> motif… puis regarde ce qu'il y a dedans.</p>"),
      jeuEntr({
        game_type: "pattern_select",
        title: "Le grand motif",
        description: "Trouve le motif qui revient jusqu'au bout. Clique sur son premier son, puis sur son dernier.",
        instructions: deroule([fois(3, [B, B, B, C])]).map((s) => LIBELLE[s]),
        motif_start: 0, motif_end: 3, repetitions: 3,
        explanation: "Boum, Boum, Boum, Clap revient 3 fois : c'est la grande boucle.",
      }),
      kodi("<p>Maintenant, regarde <strong>dans</strong> ce motif.</p>"),
      jeuEntr({
        game_type: "pattern_select",
        title: "Et dedans ?",
        description: "Voici le grand motif tout seul. Qu'est-ce qui s'y répète encore ?",
        instructions: [B, B, B, C].map((s) => LIBELLE[s]),
        motif_start: 0, motif_end: 0, repetitions: 3,
        explanation: "Dans le motif, Boum revient 3 fois : c'est la petite boucle. Le Clap reste après elle, dans la grande.",
      }),
    ],
  },
  {
    title: "Combien de sons ?",
    description: "Pars de l'intérieur : la petite boucle, puis un grand tour, puis multiplie.",
    xp_reward: 35,
    blocs: [
      kodi("<p>Pars de l'intérieur : compte la petite boucle, puis un grand tour, puis multiplie par les grands tours.</p>"),
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
            const n = sons(it.prog), parTour = sons(it.prog[0].corps);
            return { id: it.id, emoji: "🔁", label: lisible(it.prog), correct: String(n),
              hint: it.hint ?? `Un grand tour = ${parTour} sons. ${it.prog[0].rep} grands tours × ${parTour} = ${n}.` };
          }),
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Compte avant d'écouter",
          sentences: PHRASES.map((p) => {
            const juste = (p.compte ?? sons)(p.prog);
            return { id: p.id, before: p.avant, after: p.apres, options: [String(juste), ...p.faux.map(String)], correct: 0, explanation: p.expl };
          }),
        },
      },
    ],
  },
  {
    title: "Dedans ou dehors ?",
    description: "Où tu ranges un son décide combien de fois il sonne.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Où tu ranges un son décide combien de fois il sonne : <strong>au fond</strong>, souvent ; <strong>dehors</strong>, une seule fois.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Même rythme, ou pas ?",
          instruction: "Déroule les deux boucles dans ta tête, puis compare son par son.",
          helper: { title: "Comment décider ?", criteria: [
            "Pars de l'intérieur : la petite boucle, puis un grand tour",
            "Regarde où chaque son est rangé : au fond, dans la grande, ou dehors",
            "Un son de trop ou mal placé : ce n'est plus le même rythme",
          ] },
          categories: [
            { id: "pareil", label: "Même rythme", color: "#10b981", emoji: "✅" },
            { id: "different", label: "Pas le même", color: "#ef4444", emoji: "❌" },
          ],
          items: PAIRES.map((p) => ({
            id: p.id, emoji: "🥁", label: `${lisible(p.gauche)}  ⟷  ${lisible(p.droite)}`,
            correct: pareil(p.gauche, p.droite) ? "pareil" : "different", hint: p.hint,
          })),
        },
      },
      jeuEntr({
        game_type: "music",
        title: "Dedans ou dehors ?",
        instructions: "Trois fois : 4 Tac puis un Boum. Et à la toute fin, UN seul Clap. Où ranges-tu ce Clap ?",
        target_notes: deroule(DEDANS_DEHORS), max_blocks: 7,
        indice_limite: "Les 4 Tac : une petite boucle !",
        available_blocks: TAMBOUR, tempo: TEMPO,
      }),
    ],
  },
  {
    title: "Ma danse de Griot",
    description: "Invente une danse : au moins 24 sons, 8 blocs au plus, et une boucle dans une boucle.",
    xp_reward: 45,
    blocs: [
      kodi("<p>Invente une danse pour la veillée : <strong>au moins 24 sons, 8 blocs au plus, et une boucle rangée dans une autre</strong>.</p><p>Puis danse-la avec ta famille : les pieds pour les Boum, les mains pour les Clap !</p>"),
      jeuEntr({
        game_type: "music",
        title: "Ma danse de Griot",
        instructions: "Au moins 24 sons, 8 blocs au plus, et une boucle DANS une boucle. Choisis tes sons, tes tours… et écoute !",
        free_mode: true, min_notes: MA_DANSE.min, max_blocks: MA_DANSE.max, boucle_imbriquee: true,
        available_blocks: TAMBOUR, tempo: TEMPO,
      }),
    ],
  },
];
// Le défi « Dedans ou dehors ? » des entraînements passe par les mêmes contrôles.
DEFIS.push({ content: ENTRAINEMENTS[2].blocs[2].content, reference: DEDANS_DEHORS, exige: { imbrication: true } });

// ── Garde-fous : on rejoue tout avant d'écrire quoi que ce soit ────────────
let ko = 0;
const verifie = (c, m) => { if (!c) { console.log(`  ⛔ ${m}`); ko++; } };

for (const { content: c, reference, exige } of DEFIS) {
  const t = c.title;
  verifie(pareil(reference, c.target_notes), `« ${t} » : la solution ne joue pas la cible`);
  verifie(blocs(reference) <= c.max_blocks, `« ${t} » : la solution dépasse ${c.max_blocks} blocs (${blocs(reference)})`);
  verifie(blocs(c.target_notes) > c.max_blocks, `« ${t} » : recopier tiendrait dans la limite`);
  if (exige.imbrication) {
    verifie(imbrique(reference), `« ${t} » : la solution n'est pas une boucle dans une boucle`);
    verifie(blocs(uneSeuleBoucle(reference)) > c.max_blocks, `« ${t} » : une seule boucle tiendrait (${blocs(uneSeuleBoucle(reference))} blocs) — l'imbrication n'est pas nécessaire`);
  }
  if (exige.departAJour) {
    verifie(pareil(c.depart, c.target_notes) && blocs(c.depart) > c.max_blocks, `« ${t} » : le départ doit jouer juste mais dépasser la limite`);
  }
  if (exige.departFaux) {
    verifie(!pareil(c.depart, c.target_notes) && blocs(c.depart) <= c.max_blocks, `« ${t} » : le départ doit être faux mais tenir dans la limite`);
  }
  if (exige.inverseDistinct) {
    verifie(!pareil(exige.inverseDistinct, c.target_notes), `« ${t} » : inverser les nombres donnerait le même rythme`);
  }
}
// Ma danse : faisable avec une boucle dans la boucle, et sans elle aussi — c'est
// pourquoi la vérification de l'imbrication est indispensable.
verifie(sons(MA_DANSE.reference) >= MA_DANSE.min && blocs(MA_DANSE.reference) <= MA_DANSE.max && imbrique(MA_DANSE.reference), "Ma danse : la référence ne tient pas");
const tricheUneBoucle = [fois(5, [B, B, B, B, C])];
verifie(sons(tricheUneBoucle) >= MA_DANSE.min && blocs(tricheUneBoucle) <= MA_DANSE.max, "Ma danse : on attendait qu'une seule boucle suffise sans la vérification");
verifie(ENTRAINEMENTS[3].blocs[1].content.boucle_imbriquee === true, "Ma danse : la vérification de l'imbrication manque");

// Le tri : les lignes, relues d'après leur décalage, redonnent le rythme décrit.
const depuisLignes = (lignes) => {
  const racine = { corps: [] }, pile = [{ niveau: -1, noeud: racine }];
  for (const l of lignes) {
    const niveau = (l.match(/^ */)[0].length) / 3;
    while (pile.at(-1).niveau >= niveau) pile.pop();
    const m = l.trim().match(/^Répéter (\d+) fois :$/);
    const noeud = m ? { rep: Number(m[1]), corps: [] } : l.trim().split(" ").pop();
    pile.at(-1).noeud.corps.push(noeud);
    if (m) pile.push({ niveau, noeud });
  }
  return racine.corps;
};
verifie(pareil(depuisLignes(LIGNES_TRI), [...RYTHME, T]), "tri : les lignes ne donnent pas le rythme annoncé");

// Jeux de motif : le motif annoncé redonne exactement le programme.
const motifOk = (instr, d, f, n) => {
  const m = instr.slice(d, f + 1), couvre = instr.slice(d, d + m.length * n);
  const juste = couvre.length === m.length * n && couvre.every((s, i) => s === m[i % m.length]);
  const suite = instr.slice(d + m.length * n, d + m.length * (n + 1));
  return juste && !(suite.length === m.length && suite.every((s, i) => s === m[i]));
};
const jeuxMotif = ENTRAINEMENTS.flatMap((e) => e.blocs.map((b) => b.content)).filter((c) => c?.game_type === "pattern_select");
for (const c of jeuxMotif) verifie(motifOk(c.instructions, c.motif_start, c.motif_end, c.repetitions), `« ${c.title} » : motif incohérent`);

// Quiz, bacs, phrases : chaque bonne réponse existe, et chaque boucle du quiz
// qui en contient une autre a une raison de l'imbriquer.
for (const q of BLOCS.find((b) => b.type === "quiz").content.questions) verifie(q.answer >= 0, `quiz « ${q.question} » : la bonne réponse n'est pas proposée`);
for (const q of QUIZ) verifie(q.prog.every((e) => typeof e !== "object" || e.corps.some((x) => typeof x !== "object")), `quiz « ${lisible(q.prog)} » : une boucle qui ne contient qu'une boucle`);
for (const it of ENTRAINEMENTS[1].blocs[1].content.items) verifie(BACS.map(String).includes(it.correct), `bac « ${it.label} » : ${it.correct} sons, aucun bac`);
for (const p of PHRASES) verifie(!p.faux.includes((p.compte ?? sons)(p.prog)), `phrase « ${p.avant} » : la bonne réponse est aussi parmi les fausses`);
for (const it of A_RANGER) verifie(imbrique(it.prog), `bac « ${lisible(it.prog)} » : pas une boucle dans une boucle`);

if (ko) throw new Error(`${ko} garde-fou(s) en échec — rien n'est écrit`);
console.log(`✓ ${DEFIS.length} défis rejoués (dont l'imbrication nécessaire là où elle est exigée), tri relu d'après ses décalages, ${jeuxMotif.length} jeux de motif, quiz, bacs et phrases cohérents`);

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs, ${ENTRAINEMENTS.length} entraînements\n`);
BLOCS.forEach((b, i) => {
  const c = b.content;
  const titre = c.title ?? (b.type === "text" ? (String(c.html).match(/<h2>(.*?)<\/h2>/)?.[1] ?? "") : `${c.questions?.length} questions`);
  console.log(`  [${String(i).padStart(2)}] ${(c.game_type ?? b.type).padEnd(10)} ${titre}`);
});
ENTRAINEMENTS.forEach((e, i) =>
  console.log(`  entr. ${i} ${e.title.padEnd(24)} ${e.xp_reward} XP — ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

if (process.argv.includes("--detail")) {
  console.log("\n── Défis musicaux ──");
  for (const { content: c, reference } of DEFIS) {
    console.log(`  ${c.title.padEnd(34)} ${c.target_notes.length} temps · ${c.max_blocks} blocs max · solution ${blocs(reference)} blocs · une seule boucle ${blocs(uneSeuleBoucle(reference))}${c.depart ? ` · départ : ${lisible(c.depart)} (${deroule(c.depart).length} temps)` : ""}`);
  }
  console.log("\n── Quiz ──");
  for (const q of BLOCS.find((b) => b.type === "quiz").content.questions) console.log(`  ${q.question}\n     → ${q.choices[q.answer]}  | ${q.explanation}`);
  console.log("\n── Bacs ──");
  for (const it of ENTRAINEMENTS[1].blocs[1].content.items) console.log(`  ${it.correct.padStart(2)} sons  ${it.label}`);
  console.log("\n── Phrases ──");
  for (const s of ENTRAINEMENTS[1].blocs[2].content.sentences) console.log(`  ${s.before} [${s.options[s.correct]}] ${s.after}   (choix : ${s.options.join(" / ")})`);
  console.log("\n── Même rythme, ou pas ? ──");
  for (const it of ENTRAINEMENTS[2].blocs[1].content.items) console.log(`  ${it.correct.padEnd(9)} ${it.label}`);
}

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }
if (!SAUVEGARDE) throw new Error("--sauvegarde=<fichier.json> est obligatoire avec --ecrire : l'ancien contenu y est copié avant d'être remplacé");

// ── Application ─────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id,status,objectives", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
if (L.status !== "draft") throw new Error("la leçon n'est pas en brouillon — refus par prudence");
if ((L.objectives?.length ?? 0) !== 3 || ![OBJECTIF_2.avant, OBJECTIF_2.apres].includes(L.objectives[1])) {
  throw new Error(`objectifs inattendus : ${JSON.stringify(L.objectives)}`);
}
const progres = await g("lesson_progress", "id", (q) => q.eq("lesson_id", L.id));
if (progres.length) throw new Error(`${progres.length} élève(s) ont commencé cette leçon — refus`);
const dejaEntr = await g("trainings", "id", (q) => q.eq("lesson_id", L.id));
if (dejaEntr.length) throw new Error(`${dejaEntr.length} entraînement(s) existent déjà — ce script n'écrase pas`);

const anciens = await g("lesson_blocks", "*", (q) => q.eq("lesson_id", L.id).order("order_index"));
fs.writeFileSync(SAUVEGARDE, JSON.stringify(anciens, null, 2));
console.log(`\n  ✓ ${anciens.length} anciens blocs sauvegardés dans ${SAUVEGARDE}`);

const objectifs = [...L.objectives]; objectifs[1] = OBJECTIF_2.apres;
const { error: eo } = await db.from("lessons").update({ objectives: objectifs }).eq("id", L.id);
if (eo) throw new Error(`objectifs : ${eo.message}`);

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
const [L2] = await g("lessons", "objectives", (q) => q.eq("id", L.id));
ok(L2.objectives[1] === OBJECTIF_2.apres, `objectif 2 : « ${L2.objectives[1]} »`);
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
