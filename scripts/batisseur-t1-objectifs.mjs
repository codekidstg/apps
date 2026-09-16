/**
 * Bâtisseur, thème « Manipuler des données » — les objectifs des trois séances
 * restées vides.
 *
 *     node scripts/batisseur-t1-objectifs.mjs           aperçu
 *     node scripts/batisseur-t1-objectifs.mjs --ecrire  applique
 *
 * Les deux séances rédigées du thème portent quatre objectifs chacune, et
 * chacune en consacre un à désamorcer une idée fausse — « comprendre qu'un for
 * distribue au lieu de compter », « comprendre que définir n'est pas exécuter ».
 * Les trois séances vides n'avaient qu'une phrase, et c'étaient des slogans :
 * « Décomposer un problème au lieu d'empiler des lignes » ne nomme même pas
 * `return`, qui est pourtant tout le sujet de la séance.
 *
 * On n'écrit pas une leçon à partir d'un slogan — c'est la raison pour laquelle
 * ces trois-là sont restées vides. Voici leur spécification, au format des deux
 * qui ont réussi.
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
const THEME = "Manipuler des données";

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

const OBJECTIFS = {
  "Fonctions qui répondent": [
    "Rendre un résultat avec return, au lieu de l'afficher",
    "Comprendre qu'une fonction sans return rend None — et reconnaître ce None quand il apparaît",
    "Réutiliser le résultat d'une fonction dans un calcul ou dans une condition",
    "Découper un problème en fonctions qui se passent des valeurs, au lieu d'empiler des lignes",
  ],
  "Les dictionnaires": [
    "Associer un nom à une information, et retrouver l'information à partir du nom",
    "Ajouter, modifier, et parcourir tout le dictionnaire pour en lister le contenu",
    "Savoir ce qui se passe quand la clé n'existe pas — et l'éviter avec .get()",
    "Choisir entre une liste et un dictionnaire selon la question qu'on pose aux données",
  ],
  // Un jalon ne s'énonce pas en objectifs d'enseignement mais en critères
  // d'acceptation : ce qui doit marcher pour qu'on le déclare réussi.
  "🏆 Jalon 1 — Le carnet de contacts": [
    "Réussi si ajouter, chercher et lister fonctionnent sur les cas de test",
    "Chercher un contact qui n'existe pas ne doit pas faire planter le carnet",
    "Lister un carnet vide doit annoncer qu'il est vide, pas afficher une erreur",
    "Chaque opération du carnet est une fonction qui rend un résultat, pas qui l'affiche",
  ],
};

const themes = await g("themes", "id,title,level", (q) => q.eq("title", THEME).eq("level", "builder"));
if (themes.length !== 1) throw new Error(`${themes.length} thème(s) « ${THEME} » — attendu 1`);
const themeId = themes[0].id;

const lecons = await g("lessons", "id,title,objectives,status", (q) => q.eq("theme_id", themeId));

console.log(`${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — thème « ${THEME} »\n`);

for (const [titre, objectifs] of Object.entries(OBJECTIFS)) {
  const l = lecons.filter((x) => x.title === titre);
  if (l.length !== 1) throw new Error(`« ${titre} » : ${l.length} leçon(s) trouvée(s) — attendu 1`);
  const lecon = l[0];
  if (lecon.status !== "draft") throw new Error(`« ${titre} » n'est pas en draft (${lecon.status}) — refus par prudence`);

  console.log(`── ${titre}  [${lecon.status}]`);
  console.log(`   avant : ${JSON.stringify(lecon.objectives)}`);
  objectifs.forEach((o, i) => console.log(`   après ${i + 1}. ${o}`));

  if (ECRIRE) {
    const { error } = await db.from("lessons").update({ objectives: objectifs }).eq("id", lecon.id);
    if (error) throw new Error(`${titre} : ${error.message}`);
    console.log("   ✓ écrit");
  }
  console.log();
}

if (!ECRIRE) { console.log("Rien n'a été écrit."); process.exit(0); }

// Relecture : on ne croit pas le script sur parole.
const apres = await g("lessons", "title,objectives", (q) => q.eq("theme_id", themeId));
console.log("── RELECTURE EN BASE ──");
for (const l of apres) console.log(`  ${(l.objectives?.length ?? 0)} objectif(s) — ${l.title}`);
