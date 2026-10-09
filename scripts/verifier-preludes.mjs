/**
 * Est-ce que les préludes des scènes tournent vraiment ?
 *
 *     node scripts/verifier-preludes.mjs
 *
 * Né d'une panne réelle. Les bancs des séances écrivent leur prélude À LA
 * MAIN, en copie de celui de l'application. Le jour où le générateur a produit
 * `_depart = null` — du JavaScript, pas du Python —, les bancs étaient tous au
 * vert et TOUS les exercices sans cahier de départ mouraient sur un NameError
 * avant la première ligne de l'enfant.
 *
 * Ce script ne teste donc pas des solutions : il teste le GÉNÉRATEUR. Il lit
 * chaque scène déclarée en base, demande à `preludes.ts` le prélude réel, et
 * le fait tourner dans un vrai Python avec un programme vide. Si le prélude
 * casse, il casse ici, pas devant un enfant.
 */
import { execFileSync } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { base, lecteur } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const THEME = process.argv[2] ?? "Un programme qui tient debout";

// On compile le vrai module de préludes : pas de copie, pas de paraphrase.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "preludes-"));
const js = path.join(tmp, "preludes.mjs");
execFileSync("npx", ["esbuild", "src/components/eleve/scenes/preludes.ts",
  "--format=esm", "--platform=node", `--outfile=${js}`], { stdio: "pipe" });
const { preludeDe, COLLECTE } = await import(js);

const theme = (await g("themes", "id,title", (q) => q.eq("title", THEME)))[0];
if (!theme) throw new Error(`thème « ${THEME} » introuvable`);
const chaps = await g("chapters", "id", (q) => q.eq("theme_id", theme.id));
const lecons = await g("lessons", "id,title,order_index", (q) => q.in("chapter_id", chaps.map((c) => c.id)));
lecons.sort((a, b) => a.order_index - b.order_index);

const cas = [], etiquettes = [];
for (const l of lecons) {
  const blocs = await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", l.id));
  const tr = await g("trainings", "id,title", (q) => q.eq("lesson_id", l.id));
  const tous = [...blocs.filter((b) => b.type === "code_challenge").map((b) => [`${l.title} · bloc ${b.order_index}`, b.content])];
  for (const t of tr) {
    const tb = await g("training_blocks", "type,content", (q) => q.eq("training_id", t.id));
    for (const b of tb.filter((x) => x.type === "code_challenge")) tous.push([`${l.title} · « ${t.title} »`, b.content]);
  }
  for (const [ou, c] of tous) {
    if (!c.scene) continue;
    etiquettes.push(`${ou} [${c.scene.decor}]`);
    // Programme vide : on ne juge que le prélude. Et l'amorce de l'exercice
    // juste après, parce qu'une amorce doit toujours pouvoir tourner telle
    // quelle — c'est ce que l'enfant voit en arrivant.
    cas.push({ code: "", tests: "", reponses: [], prelude: preludeDe(c.scene) });
    // Le worker garde ses globales et REJOUE le prélude à chaque exécution,
    // et à chaque saisie. Un prélude qui enveloppe une fonction de Python doit
    // donc survivre à son propre rejeu — sinon il finit par s'appeler
    // lui-même. C'est arrivé, et une seule exécution ne le voyait pas.
    etiquettes.push(`${ou} [prélude rejoué]`);
    cas.push({ code: preludeDe(c.scene) + "\n_t = open('_essai.txt', 'w')\n_t.write('x')\n_t.close()\n",
               tests: "", reponses: [], prelude: preludeDe(c.scene) });
    // Une amorce a le droit de planter — c'est même parfois toute la leçon,
    // comme la boutique qui s'éteint avant qu'on ait posé le filet. Mais alors
    // la consigne doit le DIRE : un enfant ne doit jamais rencontrer un écran
    // rouge qu'on ne lui a pas annoncé.
    const annonce = /s'éteint|plante|meurt|est vide|ne marche pas|s'arrête|devient rouge/i.test(c.instructions ?? "");
    etiquettes.push(`${ou} [amorce${annonce ? ", panne annoncée" : ""}]`);
    cas.push({ code: c.starter_code ?? "", tests: "", reponses: [], prelude: preludeDe(c.scene) });
  }
}

if (!cas.length) { console.log("Aucune scène dans ce thème."); process.exit(0); }
const sortie = execFileSync("python3", ["scripts/banc-correcteur.py"], { input: JSON.stringify(cas), encoding: "utf8" });
const verdicts = JSON.parse(sortie);

let ko = 0;
verdicts.forEach((v, i) => {
  // Une amorce a le droit de réclamer une saisie : elle est incomplète par
  // nature. Elle n'a jamais le droit de planter.
  const estAmorce = etiquettes[i].includes("[amorce");
  const annoncee = etiquettes[i].includes("panne annoncée");
  const bon = v.verdict === "ok"
    || (estAmorce && v.verdict === "saisie manquante")   // incomplète par nature
    || (estAmorce && annoncee && v.verdict === "plante"); // panne voulue, et dite
  if (!bon) { ko++; console.log(`  ⛔ ${etiquettes[i]}\n     ${v.verdict} : ${String(v.detail).slice(0, 120)}`); }
});
console.log(ko === 0
  ? `✅ ${verdicts.length} préludes et amorces tournent — ${COLLECTE ? Object.keys(COLLECTE).length : 0} décors connus`
  : `\n⛔ ${ko} prélude(s) ou amorce(s) en panne sur ${verdicts.length}`);
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(ko === 0 ? 0 : 1);
