/**
 * « Fonctions qui répondent » — les cinq entraînements.
 *
 *     node scripts/batisseur-fonctions-entrainements.mjs           aperçu
 *     node scripts/batisseur-fonctions-entrainements.mjs --ecrire  applique
 *
 *   0. Affiche ou rend ?              obj. 1 — la distinction, et la substitution
 *   1. Le None silencieux             obj. 2 — le piège, reconnu puis réparé
 *   2. 🎹 Ton refrain qui répond      obj. 1 + 3 — en musique
 *   3. Une fonction qui en appelle    obj. 4 — décomposer
 *   4. Le prix sans nom               le mur suivant : les dictionnaires
 *
 * L'audit de « Les listes » avait trouvé que l'objectif le plus dur n'avait
 * AUCUN entraînement. Ici chaque objectif en a un, et le piège central — None —
 * a le sien.
 *
 * Contrainte respectée : l'indexation (`liste[0]`) n'est enseignée nulle part
 * dans le parcours. Le dernier entraînement devait à l'origine faire tenir deux
 * listes parallèles, noms et prix — impossible sans index. Il crée la même
 * douleur autrement : à chaque appel, l'enfant doit se rappeler lui-même quel
 * prix va avec quel nom.
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
const LECON = "Fonctions qui répondent";

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

// ── Garde-fous arithmétiques ───────────────────────────────────────────────
if (5 * 5 + 3 * 3 !== 34) throw new Error("carré : 25 + 9 doit faire 34");
const TTC = [1000, 2000, 500].map((p) => p + Math.floor(p / 10));
const totalTtc = TTC.reduce((a, b) => a + b, 0);
if (totalTtc !== 3850) throw new Error(`total TTC calculé ${totalTtc}, attendu 3850`);
console.log(`✓ carré 25 + 9 = 34 ; TTC ${TTC.join(" + ")} = ${totalTtc}`);

const kodi = (html) => ({ type: "text", content: { html: `<p>🤖 <strong>Kodi te parle</strong></p>${html}` } });
const jeu = (content) => ({ type: "blockly_challenge", content });

const ENTRAINEMENTS = [
  {
    title: "Affiche ou rend ?",
    description: "Deux gestes différents — et un appel qui devient une valeur.",
    xp_reward: 30,
    blocs: [
      kodi("<p>Une fonction qui <strong>affiche</strong> envoie à l'écran : toi tu le vois, ton programme n'en garde rien.</p><p>Une fonction qui <strong>rend</strong> te donne la valeur. Tu peux la ranger, la calculer, la comparer.</p>"),
      {
        type: "quiz",
        content: {
          questions: [
            { question: "def f(): print(7)  puis  x = f()  — que vaut x ?", choices: ["7", "None", "print"], answer: 1,
              explanation: "Elle affiche 7, mais ne rend rien. L'appel devient None." },
            { question: "def f(): return 7  puis  print(f() + 1)  — qu'affiche le programme ?", choices: ["8", "71", "None"], answer: 0,
              explanation: "f() devient 7, donc 7 + 1 fait 8. C'est ça, réutiliser un résultat." },
            { question: "total(panier)  écrit seul sur sa ligne — où va la valeur rendue ?", choices: ["Elle s'affiche", "Elle est perdue", "Dans une variable cachée"], answer: 1,
              explanation: "Personne ne la reçoit. Il faut la ranger : t = total(panier)." },
            { question: "Après un return, les lignes suivantes de la fonction…", choices: ["s'exécutent quand même", "ne s'exécutent jamais", "s'exécutent une fois sur deux"], answer: 1,
              explanation: "return quitte la fonction sur-le-champ." },
          ],
        },
      },
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Chaque appel devient ce qu'il rend.",
        contexte: ["def triple(n):", "    return n * 3"],
        ligne: "print(triple(4) + 1)",
        etapes: [
          { expression: "triple(4)", choix: ["12", "4", "None", "triple"], valeur: "12",
            explication: "triple(4) DEVIENT 12, à l'endroit même où il est écrit." },
          { expression: "12 + 1", choix: ["13", "121", "None"], valeur: "13",
            explication: "Et c'est 13 que print reçoit." },
        ],
        sortie: "13",
      }),
    ],
  },

  {
    title: "Le None silencieux",
    description: "Le bug qui n'affiche aucune erreur — et comment le reconnaître.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Ce programme affiche <strong>25</strong>, puis <strong>None</strong>. Les deux viennent de la même faute.</p><p>Aucune erreur rouge : c'est ce qui rend ce bug si difficile à voir.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Elle affiche, mais elle ne rend rien",
        context: "Le programme affiche 25, puis None. Une seule ligne explique les deux.",
        description: "Une ligne est fausse. Clique dessus.",
        bug_index: 1,
        fix: "    return n * n",
        explanation: "La fonction AFFICHE 25 au passage, mais elle ne rend rien : resultat vaut None, et c'est None qui s'affiche ensuite. Remplace print par return.",
        instructions: ["def carre(n):", "    print(n * n)", "resultat = carre(5)", "print(resultat)"],
      }),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions: "Repare la fonction pour qu'elle RENDE le carre, puis affiche la somme de carre(5) et carre(3).",
          starter_code: "def carre(n):\n    print(n * n)\n\n# A toi : fais-la rendre, puis affiche carre(5) + carre(3)\n",
          hidden_tests:
            'import re\n' +
            'assert "return" in code, "Remplace print par return."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "34" in nombres, "25 + 9 font 34. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
            'assert "None" not in output, "Il reste un None : une de tes fonctions ne rend toujours rien."',
        },
      },
    ],
  },

  {
    title: "🎹 Ton refrain qui répond",
    description: "Une fonction qui rend une liste de notes — et une chanson qui suit.",
    xp_reward: 40,
    blocs: [
      kodi("<p>La semaine dernière, ton refrain était une fonction qui <em>jouait</em>.</p><p>Cette fois, écris-en une qui <strong>rend</strong> la liste des notes. C'est ta boucle qui les joue — et tu peux réutiliser cette liste ailleurs.</p><p>Au moins douze notes en tout.</p>"),
      jeu({
        game_type: "python_piano",
        title: "Le refrain qui rend ses notes",
        instructions: "Ecris une fonction qui REND la liste des notes du refrain, puis joue-la entre tes couplets. Douze notes au minimum.",
        min_notes: 12,
        tempo: 380,
        starter_code:
          'def refrain():\n    return ["Sol", "Mi", "Do"]\n\nfor n in refrain():\n    jouer(n)\n\n# A toi : des couplets, et le refrain entre chacun\n',
      }),
    ],
  },

  {
    title: "Une fonction qui en appelle une autre",
    description: "Découper : chaque chose écrite une seule fois.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Quand une fonction rend une valeur, une autre peut la prendre.</p><p>Ici, <code>avec_taxe</code> sait ajouter la taxe à UN prix. À toi d'écrire celle qui s'en sert pour toute une liste — sans jamais réécrire le calcul de la taxe.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris total_ttc(prix) qui parcourt la liste, demande a avec_taxe() le prix de chaque article, cumule, et REND le total. Affiche-le ensuite.",
          starter_code:
            "paniers = [1000, 2000, 500]\n\ndef avec_taxe(prix):\n    return prix + prix // 10\n\n# A toi : total_ttc(prix), puis affiche son resultat\n",
          hidden_tests:
            'import re\n' +
            'compact = code.replace(" ", "")\n' +
            'assert "deftotal_ttc(" in compact, "Ecris une fonction total_ttc(prix)."\n' +
            'assert "return" in code, "Elle doit RENDRE le total, pas seulement l afficher."\n' +
            'assert "avec_taxe(" in compact.replace("defavec_taxe(prix)", ""), "total_ttc doit APPELER avec_taxe au lieu de refaire le calcul de la taxe."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "3850" in nombres, "1100 + 2200 + 550 font 3850. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")',
        },
      },
    ],
  },

  {
    title: "Le prix sans nom",
    description: "Ça marche. C'est fragile. Et une fonction n'y peut rien.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Tu vas afficher trois articles avec leur prix, proprement, grâce à une fonction qui rend la ligne écrite.</p><p>Ça va marcher. Fais attention à ce que tu dois retenir dans ta tête à chaque appel — on en reparle juste après.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris ligne(nom, prix) qui REND un texte du genre « Riz : 1500 F ». Appelle-la pour Riz a 1500, Huile a 2300 et Savon a 800, et affiche les trois lignes.",
          starter_code:
            'def ligne(nom, prix):\n    return nom + " : " + str(prix) + " F"\n\n# A toi : les trois appels, et leur affichage\n',
          hidden_tests:
            'assert "return" in code, "La fonction doit rendre le texte, pas l afficher."\n' +
            'for mot in ["Riz", "Huile", "Savon"]:\n' +
            '    assert mot in output, "Il manque " + mot + "."\n' +
            'for p in ["1500", "2300", "800"]:\n' +
            '    assert p in output, "Il manque le prix " + p + "."\n' +
            'assert output.count("F") >= 3, "Les trois lignes doivent etre affichees."',
        },
      },
      {
        type: "text",
        content: {
          html:
            "<h3>Ce que tu as dû retenir dans ta tête</h3>" +
            "<p>À chaque appel, c'est <strong>toi</strong> qui te souviens que 1500 va avec Riz, et 2300 avec Huile. Le programme, lui, n'en sait rien : il reçoit deux valeurs séparées et leur fait confiance.</p>" +
            "<p>Trois articles, ça va. Ajoutes-en dix, change un prix, intervertis deux lignes — et plus rien ne t'avertit.</p>" +
            "<p>La semaine prochaine, tu apprends à <strong>attacher le nom au prix</strong>, pour qu'ils ne se perdent plus jamais.</p>",
        },
      },
    ],
  },
];

// ── Garde-fou : les jeux de substitution doivent avoir une issue ───────────
let ko = 0;
for (const e of ENTRAINEMENTS) {
  for (const b of e.blocs) {
    const c = b.content;
    if (c?.game_type !== "deviens_ordinateur") continue;
    let ligne = c.ligne;
    c.etapes.forEach((et, i) => {
      if (!et.choix.includes(et.valeur)) { console.log(`⛔ ${e.title} étape ${i + 1} : « ${et.valeur} » absente des pastilles`); ko++; }
      if (ligne.indexOf(et.expression) === -1) { console.log(`⛔ ${e.title} étape ${i + 1} : « ${et.expression} » introuvable`); ko++; return; }
      ligne = ligne.replace(et.expression, et.valeur);
    });
  }
}
if (ko) throw new Error(`${ko} défaut(s) dans les jeux de substitution`);
console.log("✓ jeux de substitution : chaque étape a une issue");

// ── Application ────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("trainings", "id", (q) => q.eq("lesson_id", L.id));
if (deja.length) throw new Error(`${deja.length} entraînement(s) existent déjà — ce script n'écrase pas`);

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${ENTRAINEMENTS.length} entraînements\n`);
ENTRAINEMENTS.forEach((e, i) =>
  console.log(`  [${i}] ${e.title.padEnd(34)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

for (const [i, e] of ENTRAINEMENTS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: L.id, title: e.title, description: e.description, xp_reward: e.xp_reward, order_index: i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const { error: eb } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
  );
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
  console.log(`  ✓ [${i}] ${e.title}`);
}

// ── Relecture ──────────────────────────────────────────────────────────────
let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
const ap = await g("trainings", "id,title,order_index", (q) => q.eq("lesson_id", L.id).order("order_index"));
console.log("\n── RELECTURE ──");
ok(ap.length === 5, `5 entraînements (trouvé ${ap.length})`);
ok(ap.map((e) => e.order_index).every((v, i) => v === i), "séquence contiguë");
for (const e of ap) {
  const tb = await g("training_blocks", "order_index,type,content", (q) => q.eq("training_id", e.id).order("order_index"));
  const bon = tb.length > 0
    && tb.map((b) => b.order_index).every((v, i) => v === i)
    && tb.every((b) => b.content && Object.keys(b.content).length)
    && tb.filter((b) => b.type === "code_challenge").every((b) => !/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(b.content.starter_code ?? ""));
  ok(bon, `${e.title} — ${tb.length} blocs contigus, remplis, amorces saines`);
}
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
