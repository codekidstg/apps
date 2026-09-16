/**
 * Bâtisseur, « Manipuler des données » — séance 3 : Fonctions qui répondent.
 *
 *     node scripts/batisseur-fonctions-qui-repondent.mjs           aperçu
 *     node scripts/batisseur-fonctions-qui-repondent.mjs --ecrire  applique
 *
 * La séance 2 se termine sur une promesse littérale — « La semaine prochaine,
 * tes fonctions apprennent à rendre leur résultat au lieu de l'afficher. Ce
 * sera un seul mot à ajouter. » — et sur une frustration construite exprès :
 * l'enfant a écrit affiche_total(), voit 4600 et 4400 à l'écran, et ne peut pas
 * faire comparer les deux paniers par son programme.
 *
 * Cette séance ouvre donc sur ce code exact, et tient la promesse au bloc 1 :
 * un mot, et le programme répond enfin.
 *
 * ── Les quatre objectifs, et où ils vivent ────────────────────────────────
 *   1. Rendre un résultat avec return       blocs 1, 2, 3, 4, 5
 *   2. Une fonction sans return rend None   blocs 6, 7, 11, 12
 *   3. Réutiliser le résultat               blocs 1, 5, 8, 13
 *   4. Découper en fonctions                blocs 9, 10, 13
 *
 * Aucun objectif décoratif — c'est le défaut que l'audit de S7 avait trouvé, et
 * celui que « Les listes » frôlait avec len().
 *
 * ── Les défauts des voisines, corrigés d'avance ───────────────────────────
 *   · aucune amorce ne se termine par un corps réduit à un commentaire
 *     (IndentationError — trois cas trouvés dans « Mes propres commandes ») ;
 *   · aucune référence en avant (bloc 6 de la séance 2 appelait une fonction
 *     que l'enfant n'avait jamais vu écrire) ;
 *   · les tests vérifient la SORTIE, pas seulement la présence de mots-clés ;
 *   · le labyrinthe est simulé ici même avant écriture, avec la stratégie que
 *     l'enfant est censé écrire.
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
const AMA = [1500, 800, 2300], KOFI = [1200, 2500, 700];
const tAma = AMA.reduce((a, b) => a + b, 0), tKofi = KOFI.reduce((a, b) => a + b, 0);
if (tAma !== 4600 || tKofi !== 4400) throw new Error(`totaux ${tAma}/${tKofi}, attendus 4600/4400`);
if (!(tAma > tKofi)) throw new Error("Ama doit être le plus cher, sinon la conclusion du bloc 1 est fausse");
const PANIER = [1500, 800, 2300, 450, 1200];
const tot = PANIER.reduce((a, b) => a + b, 0), moy = tot / PANIER.length;
if (tot !== 6250 || moy !== 1250) throw new Error(`total ${tot}, moyenne ${moy} — attendus 6250 et 1250`);
console.log(`✓ Ama ${tAma} > Kofi ${tKofi} ; panier ${tot}, moyenne ${moy} (entière)`);

// ── Garde-fou labyrinthe : la stratégie de l'enfant atteint-elle le but ? ──
const DELTA = { N: [0, -1], E: [1, 0], S: [0, 1], W: [-1, 0] };
const DROITE = { N: "E", E: "S", S: "W", W: "N" };

function murs(n, libres) {
  const s = new Set(libres.map(([x, y]) => `${x},${y}`));
  const w = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (!s.has(`${x},${y}`)) w.push({ x, y });
  return w;
}
/** Le couloir en L : vers l'est, puis vers le bas. */
const LIBRES = [[0,0],[1,0],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]];
const MAZE = {
  grid_size: 6,
  start: { x: 0, y: 0, dir: "E" },
  goal: { x: 4, y: 4 },
  walls: murs(6, LIBRES),
};

/** Exactement ce que l'enfant est censé écrire : si mur devant → tourner, sinon avancer. */
function simuleStrategie(cfg, tours) {
  const mur = new Set(cfg.walls.map((w) => `${w.x},${w.y}`));
  let { x, y, dir } = cfg.start;
  const murDevant = () => {
    const [dx, dy] = DELTA[dir];
    const nx = x + dx, ny = y + dy;
    return nx < 0 || ny < 0 || nx >= cfg.grid_size || ny >= cfg.grid_size || mur.has(`${nx},${ny}`);
  };
  for (let i = 0; i < tours; i++) {
    if (murDevant()) dir = DROITE[dir];
    else { const [dx, dy] = DELTA[dir]; x += dx; y += dy; }
  }
  return { x, y, arrive: x === cfg.goal.x && y === cfg.goal.y };
}
/**
 * Le nombre de tours doit être EXACT : quatre avancées, un virage, quatre
 * avancées. Un tour de trop et la règle continue de s'appliquer sur le but —
 * mur dessous, mur à gauche, elle tourne jusqu'à retrouver la case d'où le
 * robot vient, et il repart en arrière. L'API ne propose pas d'`arrive()` pour
 * sortir de la boucle, et `while` n'arrive qu'au thème suivant.
 */
const TOURS = 9;
const fin = simuleStrategie(MAZE, TOURS);
if (!fin.arrive) throw new Error(`la stratégie « si mur devant, tourne » finit en (${fin.x},${fin.y}) au lieu de (${MAZE.goal.x},${MAZE.goal.y})`);
console.log(`✓ labyrinthe : la stratégie attendue atteint le but en ${TOURS} tours`);

// ── Les blocs ──────────────────────────────────────────────────────────────
const txt = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const BLOCS = [
  txt(`<h2>Un seul mot</h2>
<p>Hier, tu as écrit une fonction qui affiche le total d'un panier. Tu l'as appelée pour Ama, puis pour Kofi. <strong>4600</strong> et <strong>4400</strong> se sont affichés.</p>
<p>Puis on t'a demandé lequel des deux est le plus cher — et ton programme n'a pas pu répondre. Le nombre partait à l'écran et disparaissait.</p>
<p>On t'avait promis que ce serait <strong>un seul mot à ajouter</strong>. Le voici : <code>return</code>.</p>`),

  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ta fonction d'hier est la. Fais-la RENDRE le total au lieu de l'afficher : remplace print(somme) par return somme. Ensuite, range les deux totaux dans deux variables et ecris le if qui dit qui a le panier le plus cher.",
      starter_code:
        "panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef total(prix):\n    somme = 0\n    for p in prix:\n        somme = somme + p\n    print(somme)\n\n# A toi : le return, puis la comparaison\n",
      hidden_tests:
        'assert "return" in code, "Remplace print(somme) par return somme."\n' +
        'assert "if" in code, "Il faut un if pour comparer les deux totaux."\n' +
        'assert "Ama" in output, "Ton programme doit annoncer le nom du panier le plus cher. Ama fait 4600, Kofi 4400."\n' +
        'assert output.count("Ama") >= 1, "Le verdict doit apparaitre a l ecran."',
    },
  },

  txt(`<h2>Afficher n'est pas rendre</h2>
<p><strong>Afficher</strong>, c'est envoyer à l'écran. Toi tu le vois — ton programme, lui, n'en garde rien.</p>
<p><strong>Rendre</strong>, c'est donner la valeur à celui qui a appelé. Elle reste dans le programme, et tu peux en faire quelque chose.</p>
<pre>def total(prix):        def total(prix):
    ...                     ...
    print(somme)            return somme

total(panier)           t = total(panier)
→ 4600 à l'écran        → t vaut 4600, utilisable</pre>
<h3>Tu en utilises déjà</h3>
<p><code>len(ma_liste)</code> ne t'affiche rien : il te <strong>rend</strong> un nombre. <code>int("12")</code> te rend 12. Et dans le labyrinthe Python, <code>mur_devant()</code> ne t'affiche rien non plus — il te rend <strong>Vrai ou Faux</strong>.</p>
<p>C'est exactement ce que tu viens de faire faire à la tienne.</p>`),

  {
    type: "quiz",
    content: {
      questions: [
        { question: "def f(): print(5)  puis  x = f()  — que vaut x ?", choices: ["5", "None", "f"], answer: 1,
          explanation: "La fonction affiche 5, mais elle ne rend rien. L'appel devient None." },
        { question: "def f(): return 5  puis  x = f()  — que vaut x ?", choices: ["None", "5", "return 5"], answer: 1,
          explanation: "return donne la valeur à celui qui appelle. x vaut 5, et tu peux calculer avec." },
        { question: "Que se passe-t-il APRÈS un return, dans la même fonction ?", choices: ["Les lignes suivantes s'exécutent quand même", "La fonction s'arrête aussitôt", "Python affiche une erreur"], answer: 1,
          explanation: "return quitte la fonction immédiatement. Ce qui suit dans la fonction ne s'exécute jamais." },
        { question: "mur_devant() te rend quoi ?", choices: ["Vrai ou Faux", "Rien, il affiche", "Le nombre de murs"], answer: 0,
          explanation: "C'est une fonction qui répond. Tu t'en sers depuis le labyrinthe Python sans y avoir pensé." },
      ],
    },
  },

  jeu({
    game_type: "sort",
    title: "Définir, rendre, réutiliser",
    description: "Ce programme calcule un double, puis s'en sert. Attention au décalage.",
    hint: "Le return est la dernière ligne de la fonction ; la capture vient après l'appel.",
    items: ["def double(n):", "    return n * 2", "resultat = double(21)", "print(resultat)"],
  }),

  jeu({
    game_type: "deviens_ordinateur",
    title: "Deviens l'ordinateur",
    description: "Chaque appel devient ce qu'il rend. À toi de dire quoi.",
    contexte: ["def double(n):", "    return n * 2", "", "def ajoute(a, b):", "    return a + b"],
    ligne: "print(ajoute(double(5), 3))",
    etapes: [
      { expression: "double(5)", choix: ["10", "5", "None", "double"], valeur: "10",
        explication: "double(5) ne fait pas 5 × 2 « quelque part » : il DEVIENT 10, ici, dans la ligne." },
      { expression: "ajoute(10, 3)", choix: ["13", "103", "None"], valeur: "13",
        explication: "Une fois les deux valeurs en place, ajoute rend 13. C'est lui que print reçoit." },
    ],
    sortie: "13",
    explanation: "Un appel n'est pas une action à côté : c'est une valeur, à la place où il est écrit.",
  }),

  txt(`<h2>None, le silence qui ment</h2>
<p>Une fonction qui n'a pas de <code>return</code> rend quand même quelque chose : <strong><code>None</code></strong>. C'est le mot de Python pour « rien ».</p>
<p>Le piège, c'est qu'elle a l'air de marcher. Elle affiche son résultat, tu le vois — et pourtant l'appel ne vaut rien.</p>
<pre>def total(prix):
    ...
    print(somme)      ← affiche 4600

t = total(panier)     ← t vaut None
print(t + 500)        💥 TypeError</pre>
<p>Le message parlera de <code>NoneType</code>. Quand tu le vois, la question à te poser est toujours la même : <strong>ma fonction rend-elle quelque chose ?</strong></p>`),

  jeu({
    game_type: "deviens_ordinateur",
    title: "La fonction qui a oublié de répondre",
    description: "Celle-ci affiche. Regarde ce que son appel devient.",
    contexte: ["panier_ama = [1500, 800, 2300]", "", "def total(prix):", "    somme = 0", "    for p in prix:", "        somme = somme + p", "    print(somme)"],
    ligne: "resultat = total(panier_ama) + 500",
    etapes: [
      { expression: "total(panier_ama)", choix: ["4600", "None", "panier_ama"], valeur: "None",
        explication: "Elle AFFICHE bien 4600 — tu le vois à l'écran. Mais elle ne rend rien : l'appel devient None." },
      { expression: "None + 500", choix: ["5100", "500", "TypeError"], valeur: "TypeError",
        explication: "On ne peut pas additionner None. C'est le fameux « unsupported operand type(s) ... NoneType »." },
    ],
    sortie: "4600, puis 💥 TypeError",
    explanation: "Voir un nombre à l'écran ne prouve pas que la fonction le rend. Affiché n'est pas rendu.",
  }),

  jeu({
    game_type: "python_maze",
    title: "La fonction qui décide",
    instructions:
      "Ecris une fonction ou_aller() qui REND \"tourne\" s'il y a un mur devant, et \"avance\" sinon. Puis sers-t'en dans une boucle de NEUF tours — compte le chemin : quatre cases, un virage, quatre cases.",
    steps: [
      "mur_devant() est deja une fonction qui repond : elle te rend Vrai ou Faux",
      "Ta fonction doit rendre un mot, pas l'afficher",
      "Dans la boucle, compare ce qu'elle rend : if ou_aller() == \"tourne\"",
      "Neuf tours exactement — un de plus et Kirikou repart en arriere",
    ],
    ...MAZE,
    par: 9,
    starter_code:
      'def ou_aller():\n    if mur_devant():\n        return "tourne"\n    return "avance"\n\n# A toi : la boucle de NEUF tours qui utilise ce que ou_aller() rend\n',
  }),

  txt(`<h2>Une fonction peut en appeler une autre</h2>
<p>Quand une fonction rend une valeur, une autre fonction peut la prendre. C'est là que ça devient intéressant : on découpe un gros problème en petits morceaux qui se passent des valeurs.</p>
<pre>def total(prix):
    ...
    return somme

def moyenne(prix):
    return total(prix) / len(prix)     ← elle appelle total et se sert du résultat</pre>
<p><code>moyenne</code> ne recalcule pas la somme : elle demande à <code>total</code> de le faire. Une seule addition écrite dans tout le programme.</p>
<p>C'est ça, « découper » : pas écrire moins, mais écrire <strong>chaque chose une seule fois</strong>.</p>`),

  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Trois fonctions qui se passent des valeurs. total() est deja ecrite et rend la somme. Ecris moyenne(prix) qui utilise total(), puis verdict(m) qui rend \"Cher\" si la moyenne depasse 1000 et \"Raisonnable\" sinon. Affiche le total, la moyenne, puis le verdict.",
      starter_code:
        "panier = [1500, 800, 2300, 450, 1200]\n\ndef total(prix):\n    somme = 0\n    for p in prix:\n        somme = somme + p\n    return somme\n\n# A toi : moyenne(prix), puis verdict(m)\n",
      hidden_tests:
        'import re\n' +
        'compact = code.replace(" ", "")\n' +
        'assert "defmoyenne(prix)" in compact, "Ecris une fonction moyenne(prix)."\n' +
        'assert "defverdict(" in compact, "Ecris une fonction verdict(m)."\n' +
        'assert code.count("return") >= 3, "Les trois fonctions doivent rendre leur resultat."\n' +
        'assert "total(" in compact.replace("deftotal(prix)", ""), "moyenne doit APPELER total au lieu de refaire l addition."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "6250" in nombres, "Le total du panier est 6250. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
        'assert "1250" in nombres, "La moyenne des cinq prix est 1250."\n' +
        'assert "Cher" in output, "1250 depasse 1000 : le verdict est Cher."',
    },
  },

  jeu({
    game_type: "bug_hunt",
    title: "La fonction qui ne rend que le premier",
    context: "Le panier contient cinq prix. La fonction n'en rend qu'un seul — le premier.",
    description: "Une ligne est mal placée. Clique dessus.",
    bug_index: 4,
    fix: "    return somme",
    explanation:
      "Le return est DANS la boucle : il quitte la fonction des le premier tour, avec 1500. Ramene-le au niveau du for — il rendra alors la somme complete.",
    instructions: [
      "def total(prix):",
      "    somme = 0",
      "    for p in prix:",
      "        somme = somme + p",
      "        return somme",
    ],
  }),

  {
    type: "quiz",
    content: {
      questions: [
        { question: "Une fonction sans return — que vaut son appel ?", choices: ["0", "None", "Une erreur rouge"], answer: 1,
          explanation: "None, et sans le moindre message. C'est ce qui rend ce bug si difficile à voir." },
        { question: "Un return placé dans une boucle for — que se passe-t-il ?", choices: ["Il rend la dernière valeur", "Il quitte la fonction au premier tour", "Il rend une liste"], answer: 1,
          explanation: "return quitte la fonction immédiatement, même au milieu d'une boucle." },
        { question: "total(panier)  écrit seul sur une ligne — que devient le résultat ?", choices: ["Il s'affiche", "Il est perdu", "Il est rangé automatiquement"], answer: 1,
          explanation: "La valeur est rendue… et personne ne la reçoit. Il faut la ranger : t = total(panier)." },
        { question: "moyenne() appelle total(). Combien de fois l'addition est-elle écrite ?", choices: ["Une seule fois", "Deux fois", "Autant que d'appels"], answer: 0,
          explanation: "C'est tout l'intérêt de découper : chaque chose écrite une seule fois." },
      ],
    },
  },

  txt(`<h2>La revanche d'Ama et Kofi</h2>
<p>Au début de la séance, tu as ajouté un mot et ton programme a pu répondre.</p>
<p>Maintenant fais-le proprement : une fonction qui rend le total, une fonction qui rend <em>le nom</em> du panier le plus cher. Et le programme dit qui gagne — sans que tu aies rien calculé à la main.</p>`),

  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ecris total(prix) qui REND la somme, puis plus_cher(nom_a, prix_a, nom_b, prix_b) qui REND le nom du panier le plus cher. Affiche ensuite le resultat de plus_cher pour Ama et Kofi.",
      starter_code:
        'panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef total(prix):\n    somme = 0\n    # A toi : cumule, puis rends la somme\n    return somme\n\n# A toi : plus_cher(...), puis affiche son resultat\n',
      hidden_tests:
        'compact = code.replace(" ", "")\n' +
        'assert "defplus_cher(" in compact, "Ecris une fonction plus_cher."\n' +
        'assert code.count("return") >= 3, "total et plus_cher doivent rendre leur resultat (dont les deux cas du if)."\n' +
        'assert "Ama" in output, "Ama fait 4600, Kofi 4400 : ton programme doit afficher Ama."\n' +
        'assert "4600" not in output or "Ama" in output, "Affiche le nom du gagnant, pas seulement les totaux."',
    },
  },

  jeu({
    game_type: "memory",
    title: "Les mots de la seance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "return", right: "Rendre la valeur" },
      { left: "None", right: "Elle n'a rien rendu" },
      { left: "t = total(p)", right: "Ranger ce qui est rendu" },
      { left: "mur_devant()", right: "Une fonction qui repond" },
    ],
  }),

  txt(`<h2>Ce que tu sais faire maintenant</h2>
<p>Faire rendre une valeur à une fonction, la ranger, la réutiliser dans un calcul ou dans une condition — et découper un problème en fonctions qui se passent des résultats.</p>
<p>Tu sais aussi reconnaître <code>None</code> : la fonction qui affiche mais ne rend pas.</p>
<h3>Le mur suivant</h3>
<p>Cette semaine, tu vas garder deux listes en parallèle : les prix, et les noms des articles. Le troisième prix va avec le troisième nom.</p>
<p>Ça marchera — tant que tu ne te trompes pas d'un cran. Ajoute un article au milieu, et tout se décale.</p>
<p>La semaine prochaine, tu apprends à <strong>attacher le nom au prix</strong>, pour qu'ils ne se perdent plus jamais.</p>`),
];

// 17 et non 16 : un court texte « La revanche d'Ama et Kofi » précède le grand
// exercice final, comme « Les listes » place un texte avant le sien.
if (BLOCS.length !== 17) throw new Error(`${BLOCS.length} blocs, attendu 17`);

// ── Application ────────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id,objectives,status", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} » — attendu 1`);
const L = lecons[0];
if ((L.objectives?.length ?? 0) !== 4) throw new Error("la leçon doit avoir ses 4 objectifs avant qu'on la remplisse");

const existants = await g("lesson_blocks", "id", (q) => q.eq("lesson_id", L.id));
if (existants.length) throw new Error(`${existants.length} bloc(s) existent déjà — ce script n'écrase pas`);

console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs\n`);
BLOCS.forEach((b, i) => {
  const j = b.content?.game_type;
  const quoi = j ?? b.type;
  const titre = b.content?.title ?? (b.type === "text" ? (String(b.content.html).match(/<h2>(.*?)<\/h2>/)?.[1] ?? "") : "");
  console.log(`  [${String(i).padStart(2)}] ${quoi.padEnd(20)} ${titre}`);
});

if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

const lignes = BLOCS.map((b, i) => ({
  lesson_id: L.id, theme_id: L.theme_id, order_index: i, type: b.type, content: b.content,
}));
const { error } = await db.from("lesson_blocks").insert(lignes);
if (error) throw new Error(`insertion : ${error.message}`);

const apres = await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id).order("order_index"));
console.log(`\n── RELECTURE — ${apres.length} blocs ──`);
const idx = apres.map((b) => b.order_index);
console.log(idx.every((v, i) => v === i) ? "  ✓ séquence contiguë" : `  ⛔ ${idx.join(",")}`);
console.log(apres.every((b) => b.content && Object.keys(b.content).length) ? "  ✓ tous remplis" : "  ⛔ bloc vide");
const amorces = apres.filter((b) => b.type === "code_challenge").map((b) => b.content.starter_code ?? "");
console.log(amorces.every((a) => !/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(a)) ? "  ✓ aucune amorce ne finit sur un corps vide" : "  ⛔ amorce suspecte");
console.log("\nTerminé. Les entraînements restent à écrire.");
