/**
 * Les quatre entraînements de la séance 4 Explorateur — « Le débogage ».
 *
 *     node scripts/explorateur-s4-entrainements.mjs           aperçu seul
 *     node scripts/explorateur-s4-entrainements.mjs --ecrire  écrit en base
 *
 * La séance enseigne cinq choses : ce qu'est un bug, les trois types d'erreur
 * (direction, compte, ordre), la méthode du détective — lire, tracer,
 * comparer, corriger —, l'inférence symptôme → cause, et le fait que déboguer
 * occupe la moitié du métier.
 *
 * Ses trois jeux — `bug_hunt`, `sort`, `maze` — n'existent pas côté
 * entraînement : la contrainte CHECK de `training_blocks` ne les accepte pas.
 * Chaque geste est donc reconstruit avec la palette disponible :
 *
 *   bug_hunt (cliquer l'instruction fautive) → fill_blank en deux temps,
 *     localiser PUIS corriger — ce que le jeu d'origine ne demande pas.
 *   la méthode « tracer »                    → match programme ↔ trajet en
 *     flèches, exactement l'inverse de l'exercice de S3, où l'enfant lisait
 *     un trajet pour écrire le programme.
 *   la taxonomie des trois types             → drag_to_bin, jamais pratiquée
 *     dans la leçon alors qu'elle y est nommée.
 *
 * Aucun quiz : la leçon en contient déjà quinze questions.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Le débogage — Deviens détective du code";

// ── 1 · 30 XP — reconnaître un bug ──────────────────────────────────────────
const bugOuPas = {
  titre: "Bug, ou pas bug ?",
  description: "Un programme laid qui marche n'est pas un bug. Six situations à trancher.",
  xp: 30,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Un bug, ce n'est pas « un programme mal écrit ». C'est un programme qui <strong>ne fait pas ce qu'on voulait</strong>.</p><p>Un programme peut être long, maladroit, plein de détours — s'il amène Kirikou sur l'étoile, il n'a pas de bug.</p><p>Six situations. Laquelle est un vrai bug ?</p>` } },
    {
      type: "swipe_sort",
      content: {
        title: "Bug, ou pas bug ?",
        instruction: "Clique sur la bonne catégorie pour chaque situation.",
        helper: {
          title: "Comment décider ?",
          criteria: [
            "🎯 La seule question : Kirikou finit-il là où tu voulais ?",
            "✅ OUI → pas de bug, même si le programme est long ou bizarre",
            "🐛 NON → c'est un bug, même si le programme a l'air propre",
          ],
        },
        categories: [
          { id: "bug", label: "C'est un bug", emoji: "🐛", color: "#ef4444" },
          { id: "ok", label: "Ça marche", emoji: "✅", color: "#10b981" },
        ],
        items: [
          { id: "descend", emoji: "⬇️", label: "Kirikou devait monter vers l'étoile — il est descendu", correct: "bug",
            hint: "Il ne finit pas où tu voulais : c'est un bug de direction." },
          { id: "long", emoji: "📜", label: "Le programme fait 8 instructions au lieu de 5, mais Kirikou arrive pile sur l'étoile", correct: "ok",
            hint: "Long n'est pas faux. Le résultat est celui qu'on voulait : aucun bug. On pourra le raccourcir plus tard, c'est un autre sujet." },
          { id: "trop-tot", emoji: "🛑", label: "Kirikou s'arrête une case avant l'étoile", correct: "bug",
            hint: "Bonne direction, mauvais endroit : c'est un bug de compte, il manque un Avancer." },
          { id: "demi-tour", emoji: "🔄", label: "Kirikou tourne deux fois de suite, repart, et atteint l'étoile", correct: "ok",
            hint: "Deux virages font un demi-tour — c'est inutile, mais il arrive quand même. Pas de bug." },
          { id: "puits", emoji: "🕳️", label: "Kirikou tombe dans le puits", correct: "bug",
            hint: "Il ne devait évidemment pas finir là. C'est le bug du tout premier exemple de la séance." },
          { id: "trois", emoji: "🎯", label: "Tu voulais 3 cases, tu as écrit 3 Avancer, Kirikou fait 3 cases", correct: "ok",
            hint: "Ce que tu voulais et ce qui se passe coïncident. C'est la définition d'un programme sans bug." },
        ],
      },
    },
  ],
};

// ── 2 · 35 XP — la taxonomie de la séance ───────────────────────────────────
const typeDeBug = {
  titre: "Quel type de bug ?",
  description: "Direction, compte ou ordre : classe six erreurs dans la bonne famille.",
  xp: 35,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Un détective ne cherche pas au hasard : il commence par <strong>nommer le type d'erreur</strong>. Il y en a trois, tu les as vus dans la séance :</p><p>🔴 <strong>Mauvaise instruction</strong> — tourner du mauvais côté, ou avancer là où il fallait tourner.<br/>🟡 <strong>Trop ou pas assez</strong> — le bon geste, mais pas le bon nombre de fois.<br/>🟣 <strong>Ordre inversé</strong> — les bonnes instructions, mal rangées.</p><p>💡 L'astuce : s'il part du mauvais côté, c'est la direction. S'il part du bon côté mais s'arrête mal, c'est le compte.</p>` } },
    {
      type: "drag_to_bin",
      content: {
        title: "Range chaque erreur dans sa famille",
        bins: [
          { id: "direction", label: "Mauvaise instruction", emoji: "🔴", color: "#ef4444" },
          { id: "compte",    label: "Trop ou pas assez",    emoji: "🟡", color: "#f59e0b" },
          { id: "ordre",     label: "Ordre inversé",         emoji: "🟣", color: "#a78bfa" },
        ],
        items: [
          { id: "droite-gauche", emoji: "↩️", label: "Le programme dit « Tourner à droite » là où il fallait tourner à gauche", correct: "direction",
            hint: "L'instruction elle-même est fausse : c'est le bug de direction, le plus visible — Kirikou part à l'opposé." },
          { id: "trois-quatre", emoji: "🔢", label: "Il y a 3 « Avancer », il en fallait 4", correct: "compte",
            hint: "La bonne instruction, répétée le mauvais nombre de fois. Kirikou s'arrête une case trop tôt." },
          { id: "tourne-avant", emoji: "🔀", label: "Le programme tourne d'abord et avance ensuite, alors qu'il fallait avancer d'abord", correct: "ordre",
            hint: "Les deux instructions sont bonnes, elles sont juste inversées. Kirikou part dans le mur dès le début." },
          { id: "depasse", emoji: "🏃", label: "Kirikou avance 6 fois et dépasse l'étoile de 2 cases", correct: "compte",
            hint: "Trop d'Avancer. Même famille que « pas assez » : le compte est faux, la direction est bonne." },
          { id: "avancer-tourner", emoji: "🧭", label: "Le programme met « Avancer » à l'endroit où il fallait « Tourner »", correct: "direction",
            hint: "Ce n'est pas une question de nombre : l'instruction n'est pas la bonne du tout." },
          { id: "bon-desordre", emoji: "🧩", label: "Kirikou fait le bon nombre de pas et les bons virages, mais pas dans le bon ordre", correct: "ordre",
            hint: "Rien à ajouter, rien à changer : il suffit de remettre les instructions dans le bon ordre." },
        ],
      },
    },
  ],
};

// ── 3 · 40 XP — l'étape « tracer », en miroir de la séance 3 ────────────────
const tracer = {
  titre: "Trace le programme",
  description: "Exécute chaque programme dans ta tête et retrouve le trajet de Kirikou.",
  xp: 40,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>La deuxième étape du détective, c'est <strong>tracer</strong> : suivre le programme instruction par instruction et regarder où Kirikou arrive vraiment.</p><p>À la séance précédente, tu lisais un trajet pour écrire le programme. <strong>Aujourd'hui c'est l'inverse</strong> : tu lis le programme et tu retrouves le trajet. C'est exactement ce geste qui permet de repérer un bug.</p><p>Dans les quatre programmes, Kirikou part <strong>face à l'Est ➡️</strong>.</p>` } },
    {
      type: "match",
      content: {
        title: "Programme → trajet",
        left_label: "Le programme",
        right_label: "Le trajet obtenu",
        pairs: [
          { left: "Avancer · Avancer · Tourner à gauche · Avancer", right: "➡️➡️⬆️" },
          { left: "Avancer · Tourner à droite · Avancer · Avancer", right: "➡️⬇️⬇️" },
          { left: "Avancer · Avancer · Avancer", right: "➡️➡️➡️" },
          { left: "Tourner à gauche · Avancer · Avancer", right: "⬆️⬆️" },
        ],
      },
    },
    { type: "text", content: { html: `<p>💡 Remarque le dernier : <strong>trois instructions, deux cases seulement</strong>. Tourner ne déplace pas Kirikou — c'est le piège que tu as travaillé à la séance des virages.</p>` } },
  ],
};

// ── 4 · 45 XP — localiser PUIS corriger ─────────────────────────────────────
const rapport = {
  titre: "Le rapport du détective",
  description: "Deux programmes buggés : trouve l'erreur, nomme-la, corrige-la.",
  xp: 45,
  blocs: [
    { type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p><p>Dans la séance, tu cliquais sur l'instruction fautive. Ici on va plus loin : un vrai détective ne se contente pas de <em>désigner</em> le coupable, il dit <strong>ce qu'il fallait faire à la place</strong>.</p><p>Deux affaires à résoudre. Trace le programme avec ton doigt avant de répondre.</p>` } },
    {
      type: "fill_blank",
      content: {
        title: "Deux affaires à résoudre",
        sentences: [
          { id: "a1", before: "🕵️ Affaire 1 — Kirikou doit avancer de 5 cases en ligne droite. Le programme reçu est : Avancer · Avancer · Avancer · Avancer. En l'exécutant, Kirikou parcourt", after: "cases.",
            options: ["4", "5", "3"], correct: 0,
            explanation: "Quatre instructions « Avancer », donc quatre cases. Il en manque une pour arriver à cinq." },
          { id: "a2", before: "Il s'arrête donc une case trop tôt : c'est un bug de", after: ".",
            options: ["compte", "direction", "ordre"], correct: 0,
            explanation: "La direction est bonne — il va bien tout droit. C'est le nombre de fois qui est faux : bug de compte." },
          { id: "a3", before: "Pour le corriger, il faut", after: ".",
            options: ["ajouter un Avancer", "remplacer un Avancer par un Tourner", "changer l'ordre des instructions"], correct: 0,
            explanation: "Rien à déplacer ni à remplacer : il manque simplement une instruction. Cinq « Avancer » et l'affaire est close." },
          { id: "b1", before: "🕵️ Affaire 2 — Kirikou part face à l'Est. L'étoile est 2 cases à droite, puis 3 cases vers le haut. Le programme reçu est : 1. Avancer · 2. Avancer · 3. Tourner à droite · 4. Avancer · 5. Avancer · 6. Avancer. L'erreur se trouve à la ligne", after: ".",
            options: ["3", "1", "6"], correct: 0,
            explanation: "Les deux premiers Avancer sont corrects. C'est au virage que tout bascule : la ligne 3 envoie Kirikou du mauvais côté." },
          { id: "b2", before: "À la place, il fallait écrire", after: ".",
            options: ["Tourner à gauche", "Avancer", "Tourner à droite deux fois"], correct: 0,
            explanation: "Kirikou regarde l'Est. Pour monter vers le Nord, il recule d'un cran dans le cycle NORD → EST → SUD → OUEST : c'est un virage à gauche." },
          { id: "b3", before: "Sans cette correction, Kirikou part vers", after: "au lieu de monter.",
            options: ["le bas", "la gauche", "la droite"], correct: 0,
            explanation: "Tourner à droite depuis l'Est donne le Sud, c'est-à-dire le bas de l'écran — exactement le mauvais sens." },
        ],
      },
    },
    { type: "text", content: { html: `<p>🏆 <strong>Affaires classées.</strong></p><p>Tu viens de faire les quatre étapes du détective : lire le programme, tracer le trajet, comparer avec ce qu'on voulait, corriger l'instruction fautive.</p><p>Les développeurs professionnels passent entre 30 et 50 % de leur temps à faire exactement ça.</p>` } },
  ],
};

const ENTRAINEMENTS = [bugOuPas, typeDeBug, tracer, rapport];

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`SÉANCE 4 — « ${LECON} »\n`);
for (const [i, e] of ENTRAINEMENTS.entries()) {
  const mecas = e.blocs.filter((b) => b.type !== "text").map((b) => b.type);
  console.log(`  ${i + 1}. ${String(e.xp).padStart(3)} XP  ${e.titre.padEnd(26)} ${e.blocs.length} blocs · ${mecas.join(", ")}`);
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
