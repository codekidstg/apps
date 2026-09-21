/**
 * Le défi « majeur / mineur » de la leçon « Choisir » (Bâtisseur) : son test
 * refusait la meilleure réponse.
 *
 * Le programme de départ écrit `if age = 18:` — un seul =, qui range au lieu
 * de comparer. Le test exigeait `==`. Or la réponse juste est `age >= 18` :
 * avec `==`, un enfant de 20 ans serait déclaré mineur. L'enfant qui écrivait
 * `>=` se voyait refuser avec « il faut deux signes égal ».
 *
 * Le nouveau test accepte tout signe qui compare, et garde la leçon : un seul
 * = range une valeur, il ne compare pas. Avant d'écrire, il passe par le
 * correcteur (scripts/banc-correcteur.py) sur cinq programmes.
 *
 *     node scripts/choisir-test-majeur.mjs                                   vérifie, sans rien écrire
 *     node scripts/choisir-test-majeur.mjs --ecrire --sauvegarde=avant.json  écrit, après avoir gardé l'existant
 */
import fs from "fs";
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const ANCIEN_MESSAGE = "Dans un if, il faut deux signes egal pour comparer.";
const NOUVEAUX_TESTS = String.raw`import re
assert re.search(r"if\s.*(==|!=|>=|<=|>|<)", code), "Dans un if, il faut un signe qui compare : == pour egal, >= pour au moins. Un seul = range une valeur, il ne compare pas."
assert "majeur" in output.lower() or "mineur" in output.lower(), "Le programme ne va pas jusqu'au bout."`;

const programme = (condition, decale = true) =>
  `age = int(input("Ton age ? "))\n\nif ${condition}:\n    print("Tu es majeur.")\nelse:\n${decale ? "    " : ""}print("Tu es mineur.")\n`;

// Ce que le nouveau test doit accepter, et refuser.
const CAS = [
  { nom: "age >= 18, la bonne logique", code: programme("age >= 18"), reponses: ["20"], attendu: "ok" },
  { nom: "age == 18, la réparation du signe seul", code: programme("age == 18"), reponses: ["18"], attendu: "ok" },
  { nom: "age > 17", code: programme("age > 17"), reponses: ["18"], attendu: "ok" },
  { nom: "le code de départ, sans réparation", code: programme("age = 18", false), reponses: ["18"], attendu: "plante" },
  { nom: "sans if du tout", code: "print(\"Tu es majeur.\")\n", reponses: [], attendu: "test raté" },
];

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n")
  .filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ecrire = process.argv.includes("--ecrire");
const sauvegarde = process.argv.find((a) => a.startsWith("--sauvegarde="))?.split("=")[1];
if (ecrire && !sauvegarde) {
  console.error("--ecrire demande --sauvegarde=<fichier> : l'existant doit être gardé avant d'écrire.");
  process.exit(1);
}

// 1. Le défi, retrouvé par son ancien message — un seul doit correspondre.
const { data: lecon } = await db.from("lessons").select("id").eq("title", "Choisir").single();
const { data: blocs, error } = await db.from("lesson_blocks").select("id, content").eq("lesson_id", lecon.id).eq("type", "code_challenge");
if (error) throw new Error(error.message);
const visés = blocs.filter((b) => String(b.content?.hidden_tests ?? "").includes(ANCIEN_MESSAGE));
const deja = blocs.filter((b) => b.content?.hidden_tests === NOUVEAUX_TESTS);
if (deja.length) {
  console.log("Le test est déjà corrigé. Rien à faire.");
  process.exit(0);
}
if (visés.length !== 1) {
  console.error(`${visés.length} défis portent l'ancien test : il en faut exactement un. Rien n'est écrit.`);
  process.exit(1);
}
const bloc = visés[0];

// 2. Le correcteur : l'ancien test, puis le nouveau, sur les cinq programmes.
const passe = (tests) => {
  const r = spawnSync("python3", ["scripts/banc-correcteur.py"], {
    input: JSON.stringify(CAS.map((c) => ({ code: c.code, tests, reponses: c.reponses }))), encoding: "utf8",
  });
  if (r.status !== 0) throw new Error(`Le banc Python a échoué : ${r.stderr}`);
  return JSON.parse(r.stdout);
};
const avant = passe(bloc.content.hidden_tests);
const apres = passe(NOUVEAUX_TESTS);
let ecarts = 0;
CAS.forEach((c, i) => {
  const bon = apres[i].verdict === c.attendu;
  if (!bon) ecarts++;
  console.log(`${bon ? "OK   " : "ÉCART"} ${c.nom.padEnd(40)} ancien test : ${avant[i].verdict.padEnd(10)} nouveau : ${apres[i].verdict}`);
});
if (ecarts) {
  console.error("Le nouveau test ne se comporte pas comme prévu : rien n'est écrit.");
  process.exit(1);
}
if (!ecrire) {
  console.log("\nAperçu seulement. Pour écrire : --ecrire --sauvegarde=<fichier>");
  process.exit(0);
}

// 3. L'existant d'abord, puis le nouveau test, puis la relecture.
fs.writeFileSync(sauvegarde, JSON.stringify([{ table: "lesson_blocks", id: bloc.id, content: bloc.content }], null, 1));
const { error: eEcriture } = await db.from("lesson_blocks").update({ content: { ...bloc.content, hidden_tests: NOUVEAUX_TESTS } }).eq("id", bloc.id);
if (eEcriture) throw new Error(eEcriture.message);
const { data: relu } = await db.from("lesson_blocks").select("content").eq("id", bloc.id).single();
console.log(relu.content.hidden_tests === NOUVEAUX_TESTS ? `\nTest corrigé et relu en base. Existant gardé dans ${sauvegarde}.` : "\nRELECTURE DIFFÉRENTE : à vérifier.");
