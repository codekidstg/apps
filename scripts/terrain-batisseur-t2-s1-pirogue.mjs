/**
 * Le Terrain — « La boucle qui attend », les trois variantes de la pirogue.
 *
 *     node scripts/terrain-batisseur-t2-s1-pirogue.mjs [--ecrire] [--refaire]
 *
 * Lot séparé, et pour une raison précise : le moteur `pirogue` n'existe pas
 * encore (spécification dans `docs/jeu-pirogue.md`). Ce script REFUSE d'écrire
 * tant qu'aucun lecteur ne connaît le game_type — il le vérifie lui-même dans
 * le code de l'application, il ne le suppose pas. Un bloc de jeu sans
 * composant ne s'affiche pas, et l'exercice deviendrait un cul-de-sac.
 *
 * Il s'ajoute aux sept exercices déjà en place sans les toucher : son propre
 * `order_index` commence à 200, là où le lot principal s'arrête à 106.
 *
 * Les trois paliers de la SÉANCE font déjà : remplir le filet, ne pas
 * chavirer, rentrer avant la fermeture. Ces trois variantes-là ouvrent ce que
 * la séance laisse fermé :
 *
 *   1  Le filet déjà plein   une boucle peut faire ZÉRO tour
 *   2  La pirogue qui fuit   un tour peut contenir plusieurs changements,
 *                            et c'est le résultat net qui compte
 *   3  La journée complète   trois raisons d'arrêter, et un elif pour dire
 *                            laquelle a gagné
 */
import fs from "fs";
import { base, lecteur, kodi, jeu, verifier } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La boucle qui attend";
const DEPART = 200;

// ── Le verrou : le moteur existe-t-il vraiment ? ─────────────────────────
// Lu dans le code de l'application, jamais supposé. Les deux lecteurs sont
// ceux qui affichent un bloc `game` / `blockly_challenge`.
const LECTEURS = [
  "src/app/[locale]/eleve/entrainement/[trainingId]/TrainingReader.tsx",
  "src/app/[locale]/eleve/quete/[lessonId]/QuestReader.tsx",
];
const MOTEUR_PRET = LECTEURS.some((f) => {
  try { return fs.readFileSync(f, "utf8").includes("pirogue"); } catch { return false; }
});

// ── Les trois variantes ──────────────────────────────────────────────────
const PIROGUE = (c) => jeu({
  game_type: "pirogue",
  chavire_kg: 70,
  plafond_appels: 200,
  messages: {
    pas_assez: "Le marche refuse : il veut 50 kg. Ta boucle s'est arretee trop tot.",
    chavire: "Trop lourd d'un coup : la pirogue a verse. Allege avant de tirer.",
    trop_tard: "Le marche a ferme pendant que tu tirais encore.",
    sans_fin: "Ton filet n'a jamais bouge. Qu'est-ce qui devrait avancer ?",
  },
  ...c,
});

const EXOS = [
  {
    palier: 1,
    title: "🛶 Le filet déjà plein",
    description: "Le meilleur jour de pêche est celui où tu ne pêches pas.",
    blocs: [
      kodi(
        "<p>Hier soir, tu as laissé <strong>55 kg</strong> de poisson dans la pirogue. Le marché en veut 50.</p>" +
        "<p>Écris ta boucle quand même — exactement la même que d'habitude — et regarde combien de coups de filet elle donne.</p>" +
        "<p>Ici, la valeur de départ ne vient pas de toi : c'est le poisson d'hier. Mais la question, elle, se pose pareil. <strong>Avant le premier tour.</strong></p>"
      ),
      PIROGUE({
        palier: 1,
        title: "Le filet déjà plein",
        instructions:
          "Il y a deja du poisson a bord : la variable poids existe, et elle ne vaut pas 0.\n" +
          "Ecris la boucle qui tire jusqu'a 50 kg, puis dis si tu as du pecher aujourd'hui.\n" +
          "Affiche Journee tranquille si tu n'as pas eu besoin de tirer, Bonne peche sinon.",
        starter_code:
          'print("Deja a bord :", poids, "kg")\n\n' +
          "# La meme boucle que d'habitude. Puis un si, pour raconter la journee.\n",
        depart_kg: 55,
        prise: { min: 4, max: 12 },
        objectif_kg: 50,
        minutes_max: null,
        jeter_dispo: false,
        exige: ["while", "if"],
        coups_attendus: 0,
        explication: "La question est posée avant le premier tour — pas après. Comme 55 n'est pas plus petit que 50, la réponse est non tout de suite : la boucle fait zéro tour, et ton programme continue sans avoir rien fait. Une boucle qui ne tourne jamais n'est pas une boucle cassée.",
      }),
    ],
  },

  {
    palier: 2,
    title: "🛶 La pirogue qui fuit",
    description: "Tu tires du poisson, et l'eau en remporte. Qui gagne ?",
    blocs: [
      kodi(
        "<p>La coque est fendue. À chaque coup de filet, l'eau qui entre fait repartir <strong>3 kg</strong> de poisson par la fente.</p>" +
        "<p>Ton tour de boucle a donc deux lignes qui changent le poids : une qui ajoute, une qui enlève. <code>fuite()</code> te dit combien tu perds.</p>" +
        "<p>Ça avance quand même — mais plus lentement que tu ne le crois. Compte tes coups de filet, tu vas être surpris.</p>"
      ),
      PIROGUE({
        palier: 2,
        title: "La pirogue qui fuit",
        instructions:
          "Chaque tour : tu tires avec tirer(), et tu perds ce que fuite() t'annonce.\n" +
          "Remplis quand meme jusqu'a 50 kg, et affiche le poids apres chaque tour.\n" +
          "A la fin, affiche le nombre de coups de filet qu'il t'a fallu.",
        starter_code:
          "poids = 0\n" +
          "coups = 0\n\n" +
          "# Deux lignes changent le poids dans le meme tour : + tirer() et - fuite()\n",
        prise: { min: 4, max: 12 },
        fuite_kg: 3,
        objectif_kg: 50,
        minutes_max: null,
        jeter_dispo: false,
        exige: ["while", "fuite"],
        explication: "Un tour de boucle n'est pas obligé de ne faire qu'une chose. Ce qui compte, ce n'est pas combien tu tires : c'est ce qu'il reste à bord à la fin du tour. Quatre kilos tirés et trois perdus, ça avance d'un seul — et il en faut beaucoup, des tours comme celui-là.",
      }),
    ],
  },

  {
    palier: 3,
    title: "🛶 La journée complète",
    description: "Le filet, la pirogue, et l'heure. Trois choses à surveiller en même temps.",
    blocs: [
      kodi(
        "<p>Tout en même temps, pour de vrai : le marché veut <strong>50 kg</strong>, la pirogue chavire à <strong>70</strong>, et le marché ferme dans <strong>8 minutes</strong>.</p>" +
        "<p>Deux conditions dans la question avec <code>and</code>, une décision dans la boucle pour alléger avant de couler, et après la boucle un <code>elif</code> pour raconter comment la journée s'est terminée.</p>" +
        "<p>C'est la pêche de fin de thème. Rejoue-la : le lac ne donne jamais deux fois la même chose.</p>"
      ),
      PIROGUE({
        palier: 3,
        title: "La journée complète",
        instructions:
          "Le marche veut 50 kg. La pirogue chavire a 70. Le marche ferme dans 8 minutes,\n" +
          "et chaque coup de filet coute une minute. Tu peux alleger avec jeter(10).\n" +
          "Apres la boucle, dis ce qui s'est passe : Bonne journee, ou Le marche a ferme.",
        starter_code:
          "poids = 0\n\n" +
          "# Deux raisons d'arreter dans la question. Un si dans la boucle pour\n" +
          "# alleger AVANT de tirer. Un si apres la boucle pour raconter.\n",
        prise: { min: 4, max: 25 },
        objectif_kg: 50,
        minutes_max: 8,
        jeter_dispo: true,
        exige: ["while", "and", "if", "jeter"],
        explication: "Trois surveillances dans un seul programme, et chacune a sa place : ce qui arrête la boucle va dans la question, ce qui évite la catastrophe va dans la boucle, et ce qui raconte va après. Range-les autrement et rien ne marche.",
      }),
    ],
  },
];

// ── Garde-fous arithmétiques : aucune variante ne se perd au tirage ──────
{
  const [v1, v2, v3] = EXOS.map((e) => e.blocs[1].content);
  // V1 : le départ doit déjà dépasser l'objectif, sinon il n'y a pas zéro tour.
  if (v1.depart_kg < v1.objectif_kg) throw new Error(`variante 1 : départ ${v1.depart_kg} kg sous l'objectif ${v1.objectif_kg} — la boucle tournerait`);
  if (v1.coups_attendus !== 0) throw new Error("variante 1 : elle n'enseigne la boucle à zéro tour que si zéro coup est attendu");
  // V2 : la fuite doit être strictement plus petite que la plus petite prise,
  // sinon le poids peut stagner ou reculer, et la boucle ne finit jamais.
  if (v2.fuite_kg >= v2.prise.min) throw new Error(`variante 2 : une fuite de ${v2.fuite_kg} kg contre une prise minimale de ${v2.prise.min} — la boucle pourrait ne jamais finir`);
  const piresCoups = Math.ceil(v2.objectif_kg / (v2.prise.min - v2.fuite_kg));
  if (piresCoups >= v2.plafond_appels) throw new Error(`variante 2 : jusqu'à ${piresCoups} coups, le plafond est à ${v2.plafond_appels}`);
  if (v2.objectif_kg - 1 + v2.prise.max >= v2.chavire_kg) throw new Error("variante 2 : elle peut chavirer, et ce n'est pas son sujet");
  // V3 : le bon programme allège à 44 kg — 44 + la plus grosse prise doit tenir.
  if (44 + v3.prise.max >= v3.chavire_kg) throw new Error(`variante 3 : 44 + ${v3.prise.max} = ${44 + v3.prise.max}, elle chavire à ${v3.chavire_kg}`);
  // Les deux fins doivent rester possibles : huit coups peuvent suffire, ou non.
  if (v3.minutes_max * v3.prise.max < v3.objectif_kg) throw new Error("variante 3 : le filet ne peut jamais se remplir à temps");
  if (v3.minutes_max * v3.prise.min >= v3.objectif_kg) throw new Error("variante 3 : le marché ne peut jamais fermer avant le filet plein");
}

verifier(EXOS, {
  paliers: [1, 2, 3],
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\.strip\(/, /\.split\(/, /\.lower\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
    /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
});
for (const e of EXOS) {
  const c = e.blocs[1].content;
  if (!c.exige?.length) throw new Error(`${e.title} : palier sans mot exigé`);
  if (c.exige.includes("jeter") && !c.jeter_dispo) throw new Error(`${e.title} : jeter() exigé mais pas disponible`);
  if (c.exige.includes("and") && !c.minutes_max) throw new Error(`${e.title} : and exigé mais une seule condition a un seuil`);
  if (c.exige.includes("fuite") && !c.fuite_kg) throw new Error(`${e.title} : fuite() exigé mais aucune fuite`);
  if (!c.explication) throw new Error(`${e.title} : palier sans explication de fin`);
}
console.log("✓ garde-fous arithmétiques des trois variantes : vérifiés");

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];

const toutes = await g("trainings", "id,title,palier,order_index,libre_service", (q) => q.eq("lesson_id", L.id));
const deja = toutes.filter((t) => t.order_index >= DEPART);
const ECRIRE = process.argv.includes("--ecrire");
const REFAIRE = process.argv.includes("--refaire");

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${EXOS.length} variantes de pirogue`);
console.log(`Séance « ${L.title} » — ${toutes.length} exercices existants conservés\n`);
EXOS.forEach((e, i) => console.log(`  [P${e.palier}] ${String(DEPART + i).padStart(3)} ${e.title.padEnd(26)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

if (!MOTEUR_PRET) {
  console.log(`\n⛔ LE MOTEUR N'EXISTE PAS ENCORE.`);
  console.log(`   Aucun des lecteurs ne connaît le game_type « pirogue » :`);
  LECTEURS.forEach((f) => console.log(`     ${f}`));
  console.log(`   Écrire maintenant donnerait trois exercices invisibles et impossibles à réussir.`);
  console.log(`   La spécification est dans docs/jeu-pirogue.md — relance ce script quand elle sera livrée.`);
  process.exit(ECRIRE ? 1 : 0);
}

if (deja.length && !REFAIRE) throw new Error(`${deja.length} variante(s) existent déjà — --refaire pour les remplacer`);
if (!ECRIRE) { console.log("\n✓ Le moteur est là. Rien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const joues = await g("training_progress", "id", (q) => q.in("training_id", deja.map((t) => t.id)));
  if (joues.length) throw new Error(`${joues.length} progression(s) d'élève sur ces variantes — --refaire refusé`);
  const { error } = await db.from("trainings").delete().in("id", deja.map((t) => t.id));
  if (error) throw new Error(`suppression : ${error.message}`);
  console.log(`  ⟲ ${deja.length} variantes remplacées (personne n'y avait joué)`);
}

for (const [i, e] of EXOS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: L.id, title: e.title, description: e.description,
    xp_reward: 0, libre_service: true, palier: e.palier, order_index: DEPART + i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const { error: eb } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
  );
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
  console.log(`  ✓ [P${e.palier}] ${e.title}`);
}

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = await g("trainings", "id,title,palier,xp_reward,order_index", (q) => q.eq("lesson_id", L.id).gte("order_index", DEPART).order("order_index"));
ok(ap.length === EXOS.length, `${EXOS.length} variantes écrites (trouvé ${ap.length})`);
ok(ap.every((e) => e.xp_reward === 0), "aucune ne paie en XP — c'est de la salle de jeu");
ok(ap.map((e) => e.palier).join() === "1,2,3", `paliers 1, 2, 3 (trouvé ${ap.map((e) => e.palier).join(", ")})`);
const intacts = await g("trainings", "id", (q) => q.eq("lesson_id", L.id).lt("order_index", DEPART));
ok(intacts.length === toutes.length - deja.length, `les ${toutes.length - deja.length} exercices précédents sont intacts`);
for (const e of ap) {
  const tb = await g("training_blocks", "order_index,content", (q) => q.eq("training_id", e.id).order("order_index"));
  ok(tb.length === 2 && tb.every((b) => b.content && Object.keys(b.content).length), `${e.title} — 2 blocs remplis`);
}
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
