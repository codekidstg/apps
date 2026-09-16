/**
 * Bâtisseur, « Premiers pas » — les objectifs des quatre leçons publiées.
 *
 *     node scripts/batisseur-t0-objectifs.mjs           aperçu
 *     node scripts/batisseur-t0-objectifs.mjs --ecrire  applique
 *
 * Ces quatre leçons sont complètes — 15 à 17 blocs, 4 à 5 entraînements — mais
 * ne déclaraient qu'UN objectif chacune, quand « Les listes » en déclare quatre.
 * Trois de ces lignes empilaient d'ailleurs deux ou trois idées dans une seule
 * phrase : il s'agit donc surtout de les séparer.
 *
 * Depuis que « Ce que tu vas apprendre » lit la base et s'affiche pour toutes
 * les leçons, ces lignes sont ce qu'un ado voit en ouvrant sa séance. Elles
 * sont extraites du contenu réel de chaque leçon — pas inventées — pour ne rien
 * promettre que le cours ne tienne.
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
const THEME = "Premiers pas — écrire du code qui tourne";

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
  // Bloc 1 : lancer · blocs 3-6 : l'ordre et print · 7-10 : « casse-le », les
  // deux chasses au bug, ce qu'on voit quand ça plante · 12-14 : réparer, écrire.
  "Mon premier programme": [
    "Lancer un programme et lire ce qu'il affiche",
    "Écrire plusieurs print — et comprendre que l'ordre des lignes est l'ordre d'exécution",
    "Lire un message d'erreur sans paniquer : il dit à quelle ligne, et ce qui cloche",
    "Réparer un programme qui refuse de démarrer, puis en écrire un à soi",
  ],
  // Blocs 2-5 : la boîte étiquetée, x = x + 1, la boîte qui n'existe pas ·
  // 6-9 : texte contre nombre, "12"+"3", input qui rend du texte · 10-12 : convertir.
  "Garder une information": [
    "Ranger une information dans une variable, puis la réutiliser plus loin",
    "Distinguer le texte du nombre — et savoir que input rend toujours du texte",
    "Convertir avec int() avant de calculer, sinon Python colle au lieu d'additionner",
    "Reconnaître les deux pannes classiques : la boîte qui n'existe pas, et le calcul impossible",
  ],
  // Blocs 2-5 : si/sinon et le décalage · 6-9 : comparer, = contre == ·
  // 11 et 13 : une règle que le programme applique sans savoir ce qu'il rencontrera.
  "Choisir": [
    "Écrire une décision avec if et else — une seule branche s'exécute",
    "Comparer deux valeurs, et ne pas confondre = qui range avec == qui compare",
    "Comprendre que le décalage décide de ce qui est à l'intérieur du si",
    "Faire décider un programme qui ne sait pas d'avance ce qu'il va rencontrer",
  ],
  // Blocs 0-1 : quatre fois la même règle → une boucle · 3-5 : range et le
  // décalage · 7-8 : le tour en trop · 9-11 : l'erreur qui ne plante pas.
  "Répéter": [
    "Remplacer des lignes recopiées par une boucle for avec range",
    "Savoir que range(N) commence à 0 et s'arrête juste avant N — d'où le fameux tour en trop",
    "Placer ce qui se répète dans le décalage, et ce qui n'arrive qu'une fois en dehors",
    "Repérer une boucle qui ne plante pas, mais qui compte faux",
  ],
};

const themes = await g("themes", "id,title,level", (q) => q.eq("title", THEME).eq("level", "builder"));
if (themes.length !== 1) throw new Error(`${themes.length} thème(s) « ${THEME} » — attendu 1`);
const lecons = await g("lessons", "id,title,objectives,status", (q) => q.eq("theme_id", themes[0].id));

console.log(`${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — « ${THEME} »\n`);
for (const [titre, objectifs] of Object.entries(OBJECTIFS)) {
  const l = lecons.filter((x) => x.title === titre);
  if (l.length !== 1) throw new Error(`« ${titre} » : ${l.length} leçon(s) — attendu 1`);
  console.log(`── ${titre}  [${l[0].status}]`);
  console.log(`   avant : ${JSON.stringify(l[0].objectives)}`);
  objectifs.forEach((o, i) => console.log(`   après ${i + 1}. ${o}`));
  if (ECRIRE) {
    const { error } = await db.from("lessons").update({ objectives: objectifs }).eq("id", l[0].id);
    if (error) throw new Error(`${titre} : ${error.message}`);
    console.log("   ✓ écrit");
  }
  console.log();
}
if (!ECRIRE) { console.log("Rien n'a été écrit."); process.exit(0); }

const apres = await g("lessons", "title,objectives", (q) => q.eq("theme_id", themes[0].id));
console.log("── RELECTURE EN BASE ──");
for (const l of apres) console.log(`  ${l.objectives?.length ?? 0} objectif(s) — ${l.title}`);
