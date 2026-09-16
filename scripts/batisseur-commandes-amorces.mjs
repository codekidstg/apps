/**
 * « Mes propres commandes » — trois amorces qui plantaient, et une référence
 * en avant.
 *
 *     node scripts/batisseur-commandes-amorces.mjs --verifier <dossier>  écrit les amorces à contrôler
 *     node scripts/batisseur-commandes-amorces.mjs --ecrire              applique
 *
 * ── Ce qui n'allait pas ───────────────────────────────────────────────────
 * Trois exercices partaient de :
 *
 *     def cadre(titre):
 *         # A toi
 *
 * Un corps de fonction qui ne contient qu'un commentaire est une
 * IndentationError. L'enfant qui appuie sur ▶ pour explorer — ce que la séance
 * précédente lui a appris à faire, « Lance-le : ça marche » — reçoit une erreur
 * brute qui n'est pas la sienne. Les amorces donnent désormais la première
 * ligne réelle, comme le fait déjà le bloc 13 : ça tourne, et ça montre par où
 * commencer.
 *
 * Et la chasse au bug du bloc 6 appelait joue_refrain(), une fonction que
 * l'enfant n'écrit qu'au bloc 7 et qui n'était définie nulle part dans
 * l'extrait. On lui demandait de déboguer l'appel d'une fonction qu'il n'avait
 * jamais vu écrire — alors que c'est justement ce qu'on lui enseigne. Le
 * programme montré contient maintenant sa définition.
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
const DOSSIER = process.argv.includes("--verifier") ? process.argv[process.argv.indexOf("--verifier") + 1] : null;

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

const AMORCES = {
  bloc9:
    'def cadre(titre):\n    print("========================")\n    # A toi : le titre, puis une autre ligne de signes egal\n',
  entr1:
    'def titre(mot):\n    print("*****")\n    # A toi : le mot, puis une autre ligne de cinq etoiles\n',
  entr3:
    'panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef affiche_total(prix):\n    total = 0\n    # A toi : parcours prix, cumule dans total, puis affiche-le\n',
};

// Le programme du bloc 6, désormais autonome : la définition est montrée.
const BUG6_LIGNES = [
  "def joue_refrain():",
  "    for n in refrain:",
  "        jouer(n)",
  "",
  "for n in couplet1:",
  "    jouer(n)",
  "    joue_refrain()",
];
const BUG6_INDEX = BUG6_LIGNES.indexOf("    joue_refrain()");
if (BUG6_INDEX !== 6) throw new Error(`bug_index calculé ${BUG6_INDEX}, attendu 6`);

if (DOSSIER) {
  for (const [nom, code] of Object.entries(AMORCES)) fs.writeFileSync(`${DOSSIER}/amorce_${nom}.py`, code);
  console.log(`✓ ${Object.keys(AMORCES).length} amorces écrites dans ${DOSSIER}`);
  process.exit(0);
}

const L = (await g("lessons", "id", (q) => q.eq("title", "Mes propres commandes")))[0];
const bl = await g("lesson_blocks", "id,order_index,type,content", (q) => q.eq("lesson_id", L.id).order("order_index"));
const b6 = bl.find((b) => b.order_index === 6);
const b9 = bl.find((b) => b.order_index === 9);
if (b6?.content?.game_type !== "bug_hunt") throw new Error(`bloc 6 : ${b6?.content?.game_type}, attendu bug_hunt`);
if (b9?.type !== "code_challenge") throw new Error(`bloc 9 : ${b9?.type}, attendu code_challenge`);

const ents = await g("trainings", "id,title,order_index", (q) => q.eq("lesson_id", L.id).order("order_index"));
const cible = {};
for (const i of [1, 3]) {
  const e = ents.find((x) => x.order_index === i);
  const tb = await g("training_blocks", "id,type,content", (q) => q.eq("training_id", e.id));
  const cc = tb.find((b) => b.type === "code_challenge");
  if (!cc) throw new Error(`entraînement ${i} : pas de code_challenge`);
  cible[i] = cc;
}

const patches = [
  ["lesson_blocks", b9.id, { content: { ...b9.content, starter_code: AMORCES.bloc9 } },
    "bloc 9 — amorce qui tourne au lieu de planter"],
  ["training_blocks", cible[1].id, { content: { ...cible[1].content, starter_code: AMORCES.entr1 } },
    "entr. 1 — idem"],
  ["training_blocks", cible[3].id, { content: { ...cible[3].content, starter_code: AMORCES.entr3 } },
    "entr. 3 — idem, avec l'accumulateur en amorce"],
  ["lesson_blocks", b6.id, {
    content: {
      ...b6.content,
      instructions: BUG6_LIGNES,
      bug_index: BUG6_INDEX,
      context: "Le refrain devait venir une fois, apres le couplet. Il revient quatre fois de suite.",
      explanation: "L'appel est decale de 4 espaces : il est DANS la boucle, donc rejoue a chaque note du couplet — quatre fois. Ramene-le a gauche et il ne s'executera qu'une fois, apres le couplet.",
    },
  }, "bloc 6 — le programme montre maintenant la definition de joue_refrain"],
];

console.log(`${ECRIRE ? "ÉCRITURE" : "APERÇU"} — ${patches.length} correctifs\n`);
for (const [, , , libelle] of patches) console.log("  •", libelle);
if (!ECRIRE) { console.log("\nRien écrit."); process.exit(0); }

for (const [table, id, patch, libelle] of patches) {
  const { error } = await db.from(table).update(patch).eq("id", id);
  if (error) throw new Error(`${libelle} : ${error.message}`);
  console.log("  ✓", libelle);
}

console.log("\n── RELECTURE ──");
const ap9 = (await g("lesson_blocks", "content", (q) => q.eq("id", b9.id)))[0];
console.log("bloc 9 :\n" + ap9.content.starter_code.split("\n").map((l) => "    " + l).join("\n"));
const ap6 = (await g("lesson_blocks", "content", (q) => q.eq("id", b6.id)))[0];
console.log(`bloc 6 : bug_index=${ap6.content.bug_index} → « ${ap6.content.instructions[ap6.content.bug_index]} »  (fix : « ${ap6.content.fix} »)`);
