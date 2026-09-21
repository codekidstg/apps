/**
 * Explorateur, thème musique — le nouveau cadre : titre du thème, titres des
 * six séances, leurs objectifs, leur ordre, et les chapitres « Séance N — ».
 *
 *     node scripts/explorateur-musique-titres.mjs           aperçu
 *     node scripts/explorateur-musique-titres.mjs --ecrire  applique
 *
 * L'audit avait trouvé deux thèmes superposés : des titres et des objectifs qui
 * promettaient des conditions et des paramètres, un contenu qui ne faisait que
 * des boucles. Le thème devient le pont vers Python qu'il aurait dû être : la
 * boucle poussée à fond, puis mes propres blocs, puis leurs réglages, et un
 * projet final qui valide le tout.
 *
 * Deux leçons changent de place plutôt que de titre seulement : « La boucle
 * musicale » contient déjà des boucles imbriquées — elle devient la séance 2 et
 * garde son contenu en attendant sa réécriture ; « Le rythme à paramètre »
 * descend en séance 4, où son titre devient enfin vrai.
 *
 * Au passage, une leçon Python perd son calendrier : « tu reconnais novembre »
 * supposait que tous les enfants font la musique en novembre.
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
async function maj(table, id, champs) {
  const { error } = await db.from(table).update(champs).eq("id", id);
  if (error) throw new Error(`${table} ${id} : ${error.message}`);
}

const THEME = {
  avant: "Je compose de la musique avec des boucles",
  title: "Je compose de la musique avec mes propres blocs",
  description: "Aller plus loin avec les boucles, créer mes propres blocs musicaux et les régler, puis composer seul le morceau de la veillée.",
};

// `avant` : le titre actuel en base. La ligne est retrouvée par son ancien OU
// son nouveau titre, pour que le script puisse être relancé sans dégât.
const SEANCES = [
  {
    avant: "Le tambour qui répète", chapitre: 0, xp: 50,
    titre: "Le tambour qui répète",
    objectifs: [
      "Retrouver, dans un rythme de tambour, la boucle et le motif utilisés avec Kirikou",
      "Entendre qu'une boucle joue exactement ce que joueraient les blocs recopiés",
      "Prévoir combien de sons joue une boucle : les tours × les sons du motif",
    ],
  },
  {
    avant: "La boucle musicale", chapitre: 1, xp: 60,
    titre: "La boucle dans la boucle",
    objectifs: [
      "Mettre une boucle à l'intérieur d'une autre pour répéter un motif qui se répète déjà",
      "Prévoir le nombre de sons avant d'écouter : 3 tours de 4 sons, 12 sons",
      "Choisir quelle boucle va dedans et laquelle va dehors",
    ],
  },
  {
    avant: "Quand le Griot choisit", chapitre: 2, xp: 70,
    titre: "Mon refrain a un nom",
    objectifs: [
      "Reconnaître le moment où la boucle ne suffit plus : un refrain qui revient entre des couplets différents",
      "Créer mon bloc « refrain » une seule fois, puis l'appeler partout où il revient",
      "Comprendre que créer le bloc ne joue rien : c'est l'appel qui le fait sonner",
    ],
  },
  {
    avant: "Le rythme à paramètre", chapitre: 3, xp: 80,
    titre: "Le rythme à paramètre",
    objectifs: [
      "Donner un réglage à mon bloc : le même rythme, joué sur une autre note à chaque appel",
      "Ne pas confondre le réglage de mon bloc avec le nombre de tours d'une boucle",
      "Remplacer trois blocs presque pareils par un seul bloc réglable",
    ],
  },
  {
    avant: "Mon concert de code", chapitre: 4, xp: 90,
    titre: "Le plan du compositeur",
    objectifs: [
      "Écrire le plan d'un morceau (intro, couplets, refrain, final) avant de poser un bloc",
      "Choisir pour chaque partie l'outil qui convient : boucle, bloc à moi, bloc réglé, ou notes posées une à une",
      "Vérifier mon programme avec la liste de critères du projet — la répétition générale",
    ],
  },
  {
    avant: "Ma première vraie chanson", chapitre: 5, xp: 120,
    titre: "🏆 La veillée du Griot — mon morceau, de A à Z",
    // Un projet ne s'énonce pas en objectifs d'enseignement mais en critères de
    // réussite. Les chiffres du critère 5 sont provisoires : ils seront calés
    // en résolvant le projet avant d'en écrire le contenu.
    objectifs: [
      "Mon plan est écrit avant le code : une intro, au moins 3 refrains séparés par des couplets, un final",
      "Un refrain à moi, appelé au moins 3 fois — jamais deux fois de suite",
      "Un tambour réglable, appelé avec au moins 2 réglages différents",
      "Une boucle dans une boucle, chacune d'au moins 2 tours",
      "Un vrai morceau : au moins 40 sons, avec 30 blocs au plus",
      "Je présente mon morceau à mon mentor : où est mon refrain, ce que règle mon tambour, ce que fait ma boucle dans la boucle",
    ],
  },
];

const PYTHON = {
  avant: "Ma première boucle for — tu reconnais novembre !",
  titre: "Ma première boucle for — tu reconnais le tambour !",
};

// ── Garde-fous ──────────────────────────────────────────────────────────────
const themes = await g("themes", "id,title,description,status", (q) => q.eq("level", "explorer").eq("order_index", 1));
if (themes.length !== 1) throw new Error(`${themes.length} thème(s) explorateur à l'ordre 1 — attendu 1`);
const T = themes[0];
if (![THEME.avant, THEME.title].includes(T.title)) throw new Error(`thème inattendu : « ${T.title} »`);

const chapitres = await g("chapters", "id,title,order_index", (q) => q.eq("theme_id", T.id).order("order_index"));
if (chapitres.length !== 6 || !chapitres.every((c, i) => c.order_index === i)) {
  throw new Error(`chapitres : ${chapitres.map((c) => c.order_index).join(",")} — attendu 0 à 5`);
}
const lecons = await g("lessons", "id,title,chapter_id,status,xp_reward,objectives", (q) => q.eq("theme_id", T.id));
if (lecons.length !== 6) throw new Error(`${lecons.length} leçons — attendu 6`);

const plan = SEANCES.map((s) => {
  const l = lecons.filter((x) => x.title === s.avant || x.title === s.titre);
  if (l.length !== 1) throw new Error(`« ${s.avant} » : ${l.length} leçon(s) trouvée(s)`);
  if (l[0].status !== "draft") throw new Error(`« ${l[0].title} » n'est pas en brouillon — refus par prudence`);
  return { ...s, lecon: l[0], chap: chapitres[s.chapitre] };
});
if (new Set(plan.map((p) => p.lecon.id)).size !== 6) throw new Error("deux séances visent la même leçon");

const pythons = await g("lessons", "id,title", (q) => q.in("title", [PYTHON.avant, PYTHON.titre]));
if (pythons.length !== 1) throw new Error(`leçon Python « for » : ${pythons.length} trouvée(s)`);

// ── Aperçu ──────────────────────────────────────────────────────────────────
console.log(`${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"}\n`);
console.log(`Thème : « ${T.title} » → « ${THEME.title} »`);
console.log(`        ${THEME.description}\n`);
for (const p of plan) {
  const bouge = p.lecon.chapter_id !== p.chap.id ? `  (déplacée depuis « ${chapitres.find((c) => c.id === p.lecon.chapter_id)?.title} »)` : "";
  console.log(`S${p.chapitre + 1}  « ${p.lecon.title} » → « ${p.titre} »  ${p.xp} XP${bouge}`);
  p.objectifs.forEach((o) => console.log(`      · ${o}`));
}
console.log(`\nPython : « ${pythons[0].title} » → « ${PYTHON.titre} »`);

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

// ── Écriture ────────────────────────────────────────────────────────────────
await maj("themes", T.id, { title: THEME.title, description: THEME.description });
for (const p of plan) {
  await maj("lessons", p.lecon.id, { title: p.titre, chapter_id: p.chap.id, xp_reward: p.xp, objectives: p.objectifs });
  const nomChapitre = p.chapitre === 5 ? "Séance 6 — La veillée du Griot (projet)" : `Séance ${p.chapitre + 1} — ${p.titre}`;
  await maj("chapters", p.chap.id, { title: nomChapitre });
}
await maj("lessons", pythons[0].id, { title: PYTHON.titre });

// ── Relecture : on ne croit pas le script sur parole ────────────────────────
let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE EN BASE ──");
const [T2] = await g("themes", "title,description", (q) => q.eq("id", T.id));
ok(T2.title === THEME.title, `thème : « ${T2.title} »`);
const ch2 = await g("chapters", "id,title,order_index", (q) => q.eq("theme_id", T.id).order("order_index"));
const l2 = await g("lessons", "id,title,chapter_id,xp_reward,objectives", (q) => q.eq("theme_id", T.id));
for (const c of ch2) {
  const dedans = l2.filter((l) => l.chapter_id === c.id);
  const attendu = SEANCES[c.order_index];
  ok(dedans.length === 1 && dedans[0].title === attendu.titre && dedans[0].objectives?.length === attendu.objectifs.length,
    `${c.title}  ←  « ${dedans.map((l) => l.title).join(" + ")} » (${dedans[0]?.objectives?.length ?? 0} objectifs)`);
}
const [py] = await g("lessons", "title", (q) => q.eq("id", pythons[0].id));
ok(py.title === PYTHON.titre, `Python : « ${py.title} »`);
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
