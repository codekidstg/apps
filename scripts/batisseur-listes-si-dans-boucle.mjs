/**
 * « Les listes » — la marche qui manquait, et l'entraînement qui manquait.
 *
 *     node scripts/batisseur-listes-si-dans-boucle.mjs           aperçu
 *     node scripts/batisseur-listes-si-dans-boucle.mjs --ecrire  applique
 *
 * L'audit de la leçon a trouvé deux trous, tous deux sur le MÊME objectif —
 * celui que la leçon désigne elle-même comme « la chose la plus difficile que
 * tu aies apprise jusqu'ici » : poser un si à l'intérieur d'une boucle.
 *
 *   1. Aucun des quatre entraînements ne le rejoue. Ils portent sur les listes,
 *      append/len, la composition libre, et la répétition qui prépare les
 *      fonctions. Le geste le plus dur n'était réactivé nulle part.
 *
 *   2. Dans la leçon, il n'a qu'un seul vrai exercice d'application — le bloc
 *      13 — qui empile d'un coup liste + for + accumulateur + if + comparaison.
 *      Entre la chasse au bug (où l'enfant ne fait que CLIQUER une ligne) et ce
 *      bloc (où il écrit tout), il n'y a aucune marche. Qui échoue ne sait pas
 *      laquelle des cinq choses a cassé.
 *
 * Et un troisième point, mineur : l'objectif annonce « compter avec len », mais
 * len n'était jamais EMPLOYÉ — seulement affiché, récité, apparié. Ici il sert
 * à compter des réussites accumulées avec append : le patron exact du Jalon 1.
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
async function u(t, id, patch) {
  const { error } = await db.from(t).update(patch).eq("id", id);
  if (error) throw new Error(error.message);
}

// ── Garde-fou arithmétique : les tests doivent discriminer la vraie faute ───
const TEMPS = [31, 28, 35, 33, 27];
const chauds = TEMPS.filter((t) => t > 32);
const dehors = TEMPS[TEMPS.length - 1] > 32 ? 1 : 0; // si le si sort de la boucle
if (chauds.length !== 2) throw new Error(`attendu 2 jours chauds, calculé ${chauds.length}`);
if (dehors !== 0) throw new Error("un si hors boucle signalerait quelque chose : le test ne discrimine plus");
console.log(`✓ températures ${TEMPS.join(", ")} → ${chauds.length} alertes (${chauds.join(", ")}) ; si hors boucle → ${dehors} alerte`);

const NOTES = [12, 8, 15, 6, 11];
const reussites = NOTES.filter((n) => n >= 10);
if (reussites.length !== 3) throw new Error(`attendu 3 réussites, calculé ${reussites.length}`);
console.log(`✓ notes ${NOTES.join(", ")} → ${reussites.length} réussites (${reussites.join(", ")})`);

// ── 1. Le bloc intermédiaire, inséré avant le bloc 13 ──────────────────────
const BLOC_MARCHE = {
  language: "python",
  required: true,
  instructions:
    "La liste et la boucle sont deja ecrites. Tu n'as qu'UNE chose a ajouter : un si, a l'interieur de la boucle, qui affiche le mot Chaud et la temperature quand elle depasse 32.",
  starter_code:
    'temperatures = [31, 28, 35, 33, 27]\n\nfor t in temperatures:\n    print("Jour :", t)\n    # A toi : ton si ici, au meme decalage que le print\n',
  hidden_tests:
    'assert "if" in code, "Il faut un si."\n' +
    'assert "32" in code.replace(" ", ""), "Compare la temperature a 32."\n' +
    'alertes = [l for l in output.split("\\n") if "Chaud" in l]\n' +
    'assert len(alertes) != 0, "Aucune alerte. Si ton si est colle a gauche, il sort de la boucle : il ne teste alors que la derniere temperature, 27, qui ne depasse pas 32. Decale-le comme le print."\n' +
    'assert len(alertes) == 2, "Deux jours depassent 32 degres (35 et 33). Ton programme en signale " + str(len(alertes)) + "."\n' +
    'jointes = " ".join(alertes)\n' +
    'assert "35" in jointes and "33" in jointes, "Les deux jours chauds sont 35 et 33 — affiche la temperature a cote du mot Chaud."',
};

// ── 2. Le cinquième entraînement ───────────────────────────────────────────
const ENTRAINEMENT = {
  title: "Une question sur chaque valeur",
  description: "Le geste le plus dur de la séance : un si posé à l'intérieur de la boucle.",
  xp_reward: 40,
  blocs: [
    {
      type: "text",
      content: {
        html:
          "<p>🤖 <strong>Kodi te parle</strong></p>" +
          "<p>Parcourir une liste, tu sais faire. Choisir avec <code>if</code>, tu sais faire.</p>" +
          "<p>Les mettre l'un dans l'autre, c'est autre chose — et tout se joue sur le <strong>décalage</strong>. Décalé, le si est reposé à chaque valeur. Collé à gauche, il attend la fin et ne juge que la dernière.</p>",
      },
    },
    {
      type: "blockly_challenge",
      content: {
        game_type: "sort",
        title: "Remets le programme dans l'ordre",
        description: "Ce programme signale chaque note au-dessus de 10, puis dit « Fini » une seule fois.",
        hint: "Deux décalages : le si est dans la boucle, et le print est dans le si.",
        items: [
          "notes = [12, 8, 15]",
          "for n in notes:",
          "    if n >= 10:",
          '        print("Reussi :", n)',
          'print("Fini")',
        ],
      },
    },
    {
      type: "text",
      content: {
        html: "<p>🔍 Maintenant écris-le toi-même — et cette fois, garde ce que tu trouves.</p>",
      },
    },
    {
      type: "code_challenge",
      content: {
        language: "python",
        required: true,
        instructions:
          "Parcours les notes. Chaque note au-dessus ou egale a 10 est une reussite : ajoute-la dans la liste reussites avec append. A la fin, affiche la liste des reussites, puis combien il y en a avec len().",
        starter_code:
          "notes = [12, 8, 15, 6, 11]\nreussites = []\n\n# A toi\n",
        hidden_tests:
          'import re\n' +
          'compact = code.replace(" ", "")\n' +
          'assert "for" in code, "Il faut une boucle pour parcourir les notes."\n' +
          'assert "if" in code, "Il faut un si pour ne garder que les reussites."\n' +
          'assert "append" in code, "Ajoute chaque reussite avec .append()"\n' +
          'assert "len(" in compact, "Affiche combien il y en a, avec len()"\n' +
          'nombres = re.findall(r"\\d+", output)\n' +
          'assert "3" in nombres, "Trois notes atteignent 10 : 12, 15 et 11. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
          'for n in ["12", "15", "11"]:\n' +
          '    assert n in nombres, "Il manque " + n + " dans tes reussites."\n' +
          'assert "8" not in nombres and "6" not in nombres, "8 et 6 sont sous 10 : ils ne doivent pas figurer dans les reussites."',
      },
    },
  ],
};

// ── Application ────────────────────────────────────────────────────────────
const L = (await g("lessons", "id,title", (q) => q.eq("title", "Les listes")))[0];
if (!L) throw new Error("leçon « Les listes » introuvable");

const blocs = await g("lesson_blocks", "id,order_index,type,content", (q) => q.eq("lesson_id", L.id).order("order_index"));
const b13 = blocs.find((b) => b.order_index === 13);
if (b13?.type !== "code_challenge") throw new Error(`bloc 13 : ${b13?.type}, attendu code_challenge (le panier du marché)`);
if (blocs.length !== 16) throw new Error(`${blocs.length} blocs, attendu 16 — la leçon a changé`);

const ents = await g("trainings", "id,title,order_index", (q) => q.eq("lesson_id", L.id).order("order_index"));
if (ents.length !== 4) throw new Error(`${ents.length} entraînements, attendu 4`);
if (ents.some((e) => e.title === ENTRAINEMENT.title)) throw new Error("l'entraînement existe déjà");

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"}\n`);
console.log("  • nouveau bloc 13 « la marche » — un si à ajouter, tout le reste est écrit");
console.log("    (les blocs 13, 14, 15 deviennent 14, 15, 16)");
console.log(`  • nouvel entraînement [4] « ${ENTRAINEMENT.title} » — ${ENTRAINEMENT.blocs.length} blocs`);
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

// On décale en descendant : jamais deux blocs sur le même index en cours de route.
for (const i of [15, 14, 13]) {
  const b = blocs.find((x) => x.order_index === i);
  await u("lesson_blocks", b.id, { order_index: i + 1 });
}
const { error: eIns } = await db.from("lesson_blocks").insert({
  lesson_id: L.id, theme_id: null, order_index: 13, type: "code_challenge", content: BLOC_MARCHE,
});
if (eIns) {
  // theme_id est peut-être obligatoire : on le reprend d'un bloc voisin.
  const { data: voisin } = await db.from("lesson_blocks").select("theme_id").eq("id", b13.id).single();
  const { error: e2 } = await db.from("lesson_blocks").insert({
    lesson_id: L.id, theme_id: voisin?.theme_id ?? null, order_index: 13, type: "code_challenge", content: BLOC_MARCHE,
  });
  if (e2) throw new Error(`insertion du bloc : ${e2.message}`);
}
console.log("  ✓ bloc intermédiaire inséré");

const { data: nouvelEnt, error: eEnt } = await db.from("trainings").insert({
  lesson_id: L.id, title: ENTRAINEMENT.title, description: ENTRAINEMENT.description,
  xp_reward: ENTRAINEMENT.xp_reward, order_index: 4,
}).select("id").single();
if (eEnt) throw new Error(`entraînement : ${eEnt.message}`);
const { error: eBlocs } = await db.from("training_blocks").insert(
  ENTRAINEMENT.blocs.map((b, j) => ({ training_id: nouvelEnt.id, type: b.type, content: b.content, order_index: j })),
);
if (eBlocs) throw new Error(`blocs de l'entraînement : ${eBlocs.message}`);
console.log("  ✓ entraînement créé");

// ── Relecture : on ne croit pas le script sur parole ───────────────────────
const apres = await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id).order("order_index"));
console.log(`\n── RELECTURE — ${apres.length} blocs ──`);
for (const b of apres.slice(10)) {
  const c = b.content ?? {};
  console.log(`  [${b.order_index}] ${b.type}${c.game_type ? "/" + c.game_type : ""} · ${String(c.title ?? c.instructions ?? "").slice(0, 60)}`);
}
const entApres = await g("trainings", "title,order_index", (q) => q.eq("lesson_id", L.id).order("order_index"));
console.log(`\n── ${entApres.length} entraînements ──`);
for (const e of entApres) console.log(`  [${e.order_index}] ${e.title}`);
