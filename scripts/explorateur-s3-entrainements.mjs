/**
 * Les quatre entraînements de la séance 3 Explorateur — « Gauche ou droite ? ».
 *
 *     node scripts/explorateur-s3-entrainements.mjs           aperçu seul
 *     node scripts/explorateur-s3-entrainements.mjs --ecrire  écrit en base
 *
 * La séance n'enseigne pas les conditions malgré ce qu'annonce son brief :
 * elle enseigne l'orientation. Les quatre entraînements suivent donc ses
 * cinq notions réelles — les quatre directions, l'astuce de la main, la
 * rotation en chaîne, la méthode « observer, tracer, traduire », et la
 * différence entre avancer et tourner.
 *
 * Quatre mécaniques distinctes, aucun quiz : la leçon en contient déjà quatre,
 * et un quiz teste la mémoire là où ces exercices testent le geste.
 *
 * Pas de labyrinthe : le type est réservé aux leçons. Pas de `blockly_challenge`
 * non plus — il rend l'atelier « Kodi parle », dont la validation compare des
 * chaînes de caractères à l'identique. Un enfant de neuf ans y perdrait sur
 * une majuscule.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Gauche ou droite ?";

// ── 1 · 30 XP — la confusion fondatrice ─────────────────────────────────────
const bouger = {
  titre: "Ça bouge, ou ça tourne ?",
  description: "Avancer déplace Kirikou. Tourner ne le déplace pas. Trie les six cartes.",
  xp: 30,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Il y a une chose que les débutants confondent tout le temps : <strong>avancer</strong> et <strong>tourner</strong> ne font pas la même chose.</p><p>L'une déplace Kirikou d'une case. L'autre le laisse exactement où il est, et change seulement la direction de son regard.</p><p>Six cartes. Trois décrivent une commande, trois décrivent ce qui s'est passé. À toi de trier.</p>` } },
    {
      type: "swipe_sort",
      content: {
        title: "Déplacement ou changement de direction ?",
        instruction: "Clique sur la bonne catégorie pour chaque carte.",
        helper: {
          title: "Comment décider ?",
          criteria: [
            "👣 Si Kirikou finit sur une AUTRE case → c'est un déplacement",
            "🔄 Si Kirikou finit sur la MÊME case → c'est un virage",
            "💡 Tourner, même dix fois, ne fait jamais avancer d'une seule case",
          ],
        },
        categories: [
          { id: "bouge", label: "Il change de case", emoji: "👣", color: "#10b981" },
          { id: "tourne", label: "Il reste sur place", emoji: "🔄", color: "#a78bfa" },
        ],
        items: [
          { id: "avancer", emoji: "⬆️", label: "« Avancer »", correct: "bouge",
            hint: "Avancer fait passer Kirikou sur la case suivante — il change bien d'endroit." },
          { id: "gauche", emoji: "↰", label: "« Tourner à gauche »", correct: "tourne",
            hint: "Il pivote sur lui-même. Sa case ne change pas, seul son regard change." },
          { id: "deux-droites", emoji: "↱", label: "« Tourner à droite, puis encore à droite »", correct: "tourne",
            hint: "Deux virages, toujours la même case. Il regarde maintenant dans la direction opposée — mais il n'a pas bougé." },
          { id: "case23", emoji: "🧭", label: "Kirikou était sur la case 2, il est maintenant sur la case 3", correct: "bouge",
            hint: "La case a changé : c'est forcément un déplacement, donc un « Avancer »." },
          { id: "nord-est", emoji: "👀", label: "Kirikou regardait le Nord, il regarde maintenant l'Est", correct: "tourne",
            hint: "Seul son regard a changé de direction. C'est un virage à droite." },
          { id: "meme-endroit", emoji: "📍", label: "Kirikou est au même endroit, mais il ne regarde plus au même endroit", correct: "tourne",
            hint: "Même case, autre direction : c'est la définition exacte d'un virage." },
        ],
      },
    },
  ],
};

// ── 2 · 35 XP — la boussole dans la tête ────────────────────────────────────
const boussole = {
  titre: "La boussole dans la tête",
  description: "Où regarde Kirikou après ses virages ? Huit situations à classer.",
  xp: 35,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Le cycle des directions, dans le sens des aiguilles d'une montre :</p><p style="text-align:center"><strong>NORD ⬆️ → EST ➡️ → SUD ⬇️ → OUEST ⬅️ → NORD ⬆️</strong></p><p>Tourner à <strong>droite</strong>, c'est avancer d'un cran dans ce cycle. Tourner à <strong>gauche</strong>, c'est reculer d'un cran.</p><p>⚠️ Attention aux cartes où Kirikou regarde vers le <strong>Sud</strong> : il te fait face, donc <em>sa</em> gauche est <em>ta</em> droite. Sers-toi de l'astuce de la main !</p>` } },
    {
      type: "drag_to_bin",
      content: {
        title: "Où regarde-t-il à la fin ?",
        bins: [
          { id: "nord",  label: "NORD",  emoji: "⬆️", color: "#3b82f6" },
          { id: "est",   label: "EST",   emoji: "➡️", color: "#f97316" },
          { id: "sud",   label: "SUD",   emoji: "⬇️", color: "#ef4444" },
          { id: "ouest", label: "OUEST", emoji: "⬅️", color: "#10b981" },
        ],
        items: [
          { id: "n-d", emoji: "⬆️", label: "Il regarde le Nord, il tourne à droite", correct: "est",
            hint: "Dans le cycle, après NORD à droite vient EST." },
          { id: "n-g", emoji: "⬆️", label: "Il regarde le Nord, il tourne à gauche", correct: "ouest",
            hint: "À gauche, on recule dans le cycle : avant NORD, il y a OUEST." },
          { id: "s-d", emoji: "⬇️", label: "Il regarde le Sud, il tourne à droite", correct: "ouest",
            hint: "Kirikou te fait face ! Sa droite part vers TA gauche, c'est-à-dire l'OUEST. Après SUD dans le cycle vient bien OUEST." },
          { id: "s-g", emoji: "⬇️", label: "Il regarde le Sud, il tourne à gauche", correct: "est",
            hint: "Il te fait face : sa gauche part vers TA droite, l'EST. Avant SUD dans le cycle, il y a EST." },
          { id: "e-dd", emoji: "➡️", label: "Il regarde l'Est, il tourne à droite 2 fois", correct: "ouest",
            hint: "Deux virages du même côté font toujours demi-tour. L'opposé de l'EST, c'est l'OUEST." },
          { id: "o-ggg", emoji: "⬅️", label: "Il regarde l'Ouest, il tourne à gauche 3 fois", correct: "nord",
            hint: "Trois virages à gauche font le même effet qu'un seul à droite. OUEST à droite donne NORD." },
          { id: "e-gggg", emoji: "➡️", label: "Il regarde l'Est, il tourne à gauche 4 fois", correct: "est",
            hint: "Quatre virages font un tour complet : il revient exactement d'où il partait." },
          { id: "s-dd", emoji: "⬇️", label: "Il regarde le Sud, il tourne à droite 2 fois", correct: "nord",
            hint: "Demi-tour depuis le SUD : il regarde le NORD." },
        ],
      },
    },
  ],
};

// ── 3 · 40 XP — observer et tracer ──────────────────────────────────────────
const lireChemin = {
  titre: "Lis le chemin",
  description: "Associe chaque trajet en flèches à la suite d'instructions qui le décrit.",
  xp: 40,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Avant de poser le moindre bloc, les développeurs <strong>lisent</strong> le chemin. C'est l'étape que tu as apprise : observer, puis tracer.</p><p>Dans les quatre trajets ci-dessous, Kirikou part toujours <strong>face à l'Est ➡️</strong>, comme dans les labyrinthes de la séance.</p><p>💡 Compte les flèches d'une même direction : elles te donnent le nombre de cases. Chaque changement de direction est un virage.</p>` } },
    {
      type: "match",
      content: {
        title: "Trajet → instructions",
        left_label: "Le trajet",
        right_label: "Les instructions",
        pairs: [
          { left: "➡️➡️⬆️⬆️⬆️", right: "Avance 2 · tourne à gauche · avance 3" },
          { left: "➡️➡️➡️⬇️",   right: "Avance 3 · tourne à droite · avance 1" },
          { left: "➡️⬇️⬇️➡️➡️", right: "Avance 1 · tourne à droite · avance 2 · tourne à gauche · avance 2" },
          { left: "➡️➡️⬆️➡️",   right: "Avance 2 · tourne à gauche · avance 1 · tourne à droite · avance 1" },
        ],
      },
    },
    { type: "text", content: { html: `<p>✅ Tu viens de faire ce que fait un développeur devant un labyrinthe : <strong>lire le chemin avant d'écrire le programme</strong>.</p><p>Les deux derniers trajets forment un <strong>S</strong> — exactement le serpent du défi bonus de la séance.</p>` } },
  ],
};

// ── 4 · 45 XP — traduire, l'exercice où l'enfant produit ────────────────────
const ecrirePlan = {
  titre: "Écris le plan de Kirikou",
  description: "À toi de composer l'itinéraire complet, virage par virage.",
  xp: 45,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Tu as observé, tu as tracé. Il reste la troisième étape : <strong>traduire</strong> le chemin en instructions.</p><p>C'est ce que tu vas faire ici — deux itinéraires complets, du départ à l'étoile ⭐.</p><p>✋ Garde l'astuce de la main sous le coude : pointe ta main dans la direction de Kirikou avant de choisir gauche ou droite.</p>` } },
    {
      type: "fill_blank",
      content: {
        title: "Complète les deux itinéraires",
        sentences: [
          { id: "a1", before: "Itinéraire 1 — Kirikou part face à l'Est ➡️. L'étoile est 3 cases à droite, puis 2 cases vers le haut. Il avance d'abord de", after: "cases.",
            options: ["3", "2", "5"], correct: 0,
            explanation: "L'étoile est à 3 cases sur la droite, et Kirikou regarde déjà dans cette direction : il avance de 3 cases sans tourner." },
          { id: "a2", before: "Ensuite, pour se tourner vers le haut, il tourne à", after: ".",
            options: ["gauche", "droite"], correct: 0,
            explanation: "Il regarde l'Est. Dans le cycle NORD → EST → SUD → OUEST, on recule d'un cran pour aller de l'EST au NORD : c'est un virage à gauche." },
          { id: "a3", before: "Enfin, il avance de", after: "cases et atteint l'étoile ⭐.",
            options: ["2", "3", "1"], correct: 0,
            explanation: "Il reste 2 cases à monter. Le plan complet fait : avance 3 · tourne à gauche · avance 2." },
          { id: "b1", before: "Itinéraire 2 — Kirikou part encore face à l'Est ➡️. Cette fois l'étoile est 2 cases à droite, puis 3 cases vers le BAS. Il avance de", after: "cases.",
            options: ["2", "3", "4"], correct: 0,
            explanation: "Deux cases vers la droite, toujours dans la direction où il regarde." },
          { id: "b2", before: "Pour se tourner vers le bas, il tourne à", after: ".",
            options: ["droite", "gauche"], correct: 0,
            explanation: "Piège ! Tu viens de tourner à gauche pour monter — mais pour DESCENDRE depuis l'Est, on avance d'un cran dans le cycle : EST → SUD, donc à droite." },
          { id: "b3", before: "Il avance de", after: "cases, et il y est.",
            options: ["3", "2", "4"], correct: 0,
            explanation: "Trois cases vers le bas. Le plan complet : avance 2 · tourne à droite · avance 3." },
        ],
      },
    },
    { type: "text", content: { html: `<p>🏆 <strong>Tu viens d'écrire deux programmes entiers.</strong></p><p>Observer, tracer, traduire : c'est exactement la méthode que suivent les développeurs devant un problème qu'ils n'ont jamais vu.</p>` } },
  ],
};

const ENTRAINEMENTS = [bouger, boussole, lireChemin, ecrirePlan];

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`SÉANCE 3 — « ${LECON} »\n`);
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const mecas = e.blocs.filter((b) => b.type !== "text").map((b) => b.type);
  console.log(`  ${i + 1}. ${String(e.xp).padStart(3)} XP  ${e.titre.padEnd(30)} ${e.blocs.length} blocs · ${mecas.join(", ")}`);
}
const mecaniques = new Set(ENTRAINEMENTS.flatMap((e) => e.blocs.filter((b) => b.type !== "text").map((b) => b.type)));
console.log(`\n  ${mecaniques.size} mécaniques distinctes : ${[...mecaniques].join(", ")}`);
console.log(`  XP : ${ENTRAINEMENTS.map((e) => e.xp).join(" · ")}`);

if (!ECRIRE) {
  console.log("\n(aperçu seul — relancer avec --ecrire pour écrire en base)");
  process.exit(0);
}

// ── Écriture ────────────────────────────────────────────────────────────────
const { data: lecon, error: eL } = await db.from("lessons").select("id").eq("title", LECON).single();
if (eL || !lecon) { console.error("Leçon introuvable :", eL?.message); process.exit(1); }

const { data: existants } = await db.from("trainings").select("id, title").eq("lesson_id", lecon.id);
if (existants?.length) {
  console.error(`\n⚠ ${existants.length} entraînement(s) existent déjà sur cette leçon :`);
  for (const x of existants) console.error(`   · ${x.title}`);
  console.error("Rien n'a été écrit — supprimez-les d'abord si vous voulez repartir de zéro.");
  process.exit(1);
}

console.log("\nÉcriture…");
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data: tr, error } = await db.from("trainings").insert({
    lesson_id: lecon.id, title: e.titre, description: e.description,
    xp_reward: e.xp, order_index: i,
  }).select("id").single();
  if (error) { console.error(`  ✗ ${e.titre} : ${error.message}`); process.exit(1); }

  const blocs = e.blocs.map((b, j) => ({ training_id: tr.id, type: b.type, content: b.content, order_index: j }));
  const { error: eB } = await db.from("training_blocks").insert(blocs);
  if (eB) { console.error(`  ✗ blocs de « ${e.titre} » : ${eB.message}`); process.exit(1); }
  console.log(`  ✓ ${String(e.xp).padStart(3)} XP  ${e.titre}  (${blocs.length} blocs)`);
}
console.log("\nTerminé.");
