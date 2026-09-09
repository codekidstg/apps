/**
 * Quatre corrections sur la séance 5 Explorateur — « La répétition ».
 *
 *     node scripts/explorateur-s5-corrections.mjs           aperçu seul
 *     node scripts/explorateur-s5-corrections.mjs --ecrire  applique
 *
 * 1. Le labyrinthe annonçait « maximum 6 blocs » alors que la solution en
 *    coûte 7 : dans Blockly, `controls_repeat_ext` sort de la boîte AVEC son
 *    bloc-nombre. L'enfant qui faisait exactement ce qu'on lui demandait
 *    voyait un badge rouge « 7/6 ⚠️ ».
 * 2. Le premier exercice donnait ses réponses dans ses propres commentaires
 *    (« ligne droite (5 cases) » → réponse 5). L'enfant recopiait.
 * 3. L'explication du bug_hunt parlait d'un corridor et d'un mur ; la grille
 *    dessinée est un 5×5 entièrement vide.
 * 4. Le second jeu de piano imprimait sa solution dans ses consignes.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l.includes("="))
    .map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()]),
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "La répétition — Kirikou dit moins pour faire plus";

const { data: lecon } = await db.from("lessons").select("id").eq("title", LECON).single();
const { data: blocs } = await db.from("lesson_blocks")
  .select("id, type, content, order_index").eq("lesson_id", lecon.id).order("order_index");

const par = (i) => blocs.find((b) => b.order_index === i);
const corrections = [];

// ── 1 · Le fill_blank ne doit plus donner ses réponses ──────────────────────
{
  const b = par(3);
  corrections.push({
    bloc: b, quoi: "fill_blank — les nombres ne sont plus écrits dans les commentaires",
    content: {
      ...b.content,
      template:
        "// Programme 1 — la version longue :\n" +
        "Avancer, Avancer, Avancer, Avancer, Avancer\n" +
        "// La même chose en version courte :\n" +
        "Répéter [___] fois : Avancer\n\n" +
        "// Programme 2 — le chemin de Kirikou, qui part face à l'Est :\n" +
        "//   ➡️ ➡️ ➡️ ➡️ ⬆️ ⬆️ ⬆️\n" +
        "Répéter [___] fois : Avancer\n" +
        "Tourner à gauche\n" +
        "Répéter [___] fois : Avancer",
    },
  });
}

// ── 2 · Le bug_hunt et son mur imaginaire ───────────────────────────────────
{
  const b = par(4);
  corrections.push({
    bloc: b, quoi: "bug_hunt — explication sans le mur qui n'existe pas",
    content: {
      ...b.content,
      explanation:
        "Le chemin fait 4 cases vers la droite, pas 2. Avec « Répéter 2 fois », " +
        "Kirikou s'arrête au milieu du couloir. Il monte ensuite les 4 cases correctement, " +
        "mais deux colonnes trop tôt : il arrive à gauche de l'étoile et la rate de deux cases.",
    },
  });
}

// ── 3 · La limite du labyrinthe, et le texte qui l'annonce ──────────────────
{
  const b = par(8);
  corrections.push({
    bloc: b, quoi: "labyrinthe — limite portée de 6 à 7 blocs",
    content: {
      ...b.content,
      max_blocks: 7,
      instructions:
        "Tu n'as que 7 blocs maximum. Sans Répéter il en faudrait 9 : impossible. " +
        "Attention, le bloc 🔁 Répéter compte pour deux — il arrive avec son nombre.",
    },
  });

  const t = par(7);
  corrections.push({
    bloc: t, quoi: "texte — « maximum 6 blocs » devient 7, avec la raison",
    content: {
      html: t.content.html
        .replace(/Maximum 6 blocs/g, "Maximum 7 blocs")
        .replace(
          /La solution sans Répéter nécessite 9 blocs\./,
          "La solution sans Répéter nécessite 9 blocs. Et attention : le bloc 🔁 Répéter compte pour deux, car il arrive avec son nombre.",
        ),
    },
  });
}

// ── 4 · Le piano qui donnait sa réponse ─────────────────────────────────────
{
  const b = par(11);
  corrections.push({
    bloc: b, quoi: "piano 2 — l'indice ne donne plus la solution",
    content: {
      ...b.content,
      steps: [
        "La mélodie à reproduire : Do, Mi, Sol, Do, Mi, Sol (6 notes)",
        "Sans Répéter, il faudrait 6 blocs — tu n'en as que 5 !",
        "Indice : écoute bien la mélodie. N'y a-t-il pas un motif qui revient ?",
      ],
    },
  });
}

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`SÉANCE 5 — « ${LECON} »\n`);
for (const c of corrections) {
  console.log(`  [${c.bloc.order_index}] ${c.bloc.type.padEnd(5)} ${c.quoi}`);
}

if (!ECRIRE) {
  console.log("\nDÉTAIL DES NOUVEAUX CONTENUS");
  for (const c of corrections) {
    console.log(`\n─── [${c.bloc.order_index}] ───`);
    const v = c.content.template ?? c.content.explanation ?? c.content.instructions ?? c.content.html ?? "";
    console.log(String(v).slice(0, 500));
    if (c.content.steps) console.log(c.content.steps.map((s) => "  · " + s).join("\n"));
    if (c.content.max_blocks) console.log(`  max_blocks = ${c.content.max_blocks}`);
  }
  console.log("\n(aperçu seul — relancer avec --ecrire pour appliquer)");
  process.exit(0);
}

console.log("\nApplication…");
for (const c of corrections) {
  const { error } = await db.from("lesson_blocks").update({ content: c.content }).eq("id", c.bloc.id);
  if (error) { console.error(`  ✗ [${c.bloc.order_index}] ${error.message}`); process.exit(1); }
  console.log(`  ✓ [${c.bloc.order_index}] ${c.quoi}`);
}
console.log("\nTerminé.");
