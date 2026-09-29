/**
 * Le Terrain — Bâtisseur, thème 1 séance 1 « Les listes ».
 *
 *     node scripts/terrain-batisseur-t1-s1.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : ranger plusieurs valeurs dans une variable,
 * les parcourir avec `for` — qui distribue au lieu de compter —, ajouter avec
 * `.append()`, compter avec `len()`, et poser un `if` à l'intérieur de la
 * boucle.
 *
 * Pas encore vu, donc interdit : `def`, `return`, les dictionnaires, et
 * l'indexation par position (`liste[0]`), qui n'est enseignée nulle part.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les listes";

// Garde-fou arithmétique : les comptes annoncés sont calculés, pas recopiés.
const LISTES = [
  ["a", "[1500, 800, 2300]", 3], ["b", "[]", 0],
  ["c", '["Do", "Mi", "Sol", "La", "Si"]', 5], ["d", "[12]", 1],
  ["e", '["Lome", "Kara", "Sokode"]', 3], ["f", "[0, 0, 0, 0, 0]", 5],
  ["g", '["un seul texte, avec des virgules"]', 1], ["h", "[7, 7, 7]", 3],
  ["i", '["a", "b", "c", "d", "e"]', 5], ["j", '[""]', 1],
  ["k", "[1, 2, 3, 4, 5]", 5], ["l", '["Ama", "Kofi", "Fatou"]', 3],
];
/**
 * Compter les valeurs d'une liste écrite en toutes lettres.
 *
 * Couper sur toutes les virgules donne un faux compte dès qu'un texte en
 * contient une — et c'est justement le piège que l'exercice enseigne. Le
 * compteur doit donc lire les guillemets, comme Python le fait.
 */
function valeursDe(texte) {
  const dedans = texte.slice(1, -1).trim();
  if (!dedans) return 0;
  let n = 1, guillemets = false;
  for (const c of dedans) {
    if (c === '"') guillemets = !guillemets;
    else if (c === "," && !guillemets) n++;
  }
  return n;
}
for (const [id, texte, n] of LISTES) {
  const compte = valeursDe(texte);
  if (compte !== n) throw new Error(`${id} : ${texte} contient ${compte} valeurs, ${n} annoncées`);
}

const EXOS = [
  {
    palier: 1,
    title: "Combien de valeurs ?",
    description: "Douze listes. Compte ce qu'il y a dedans, pas les caractères.",
    blocs: [
      kodi("<p>Une liste tient dans une seule variable, mais elle contient plusieurs valeurs — séparées par des <strong>virgules</strong>.</p><p>Attention : une virgule <em>dans</em> un texte ne sépare rien du tout.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de valeurs ?",
          instruction: "Choisis une liste, puis son nombre de valeurs.",
          bins: [
            { id: "0", emoji: "⬜", label: "Vide",         color: "#64748b" },
            { id: "1", emoji: "1️⃣", label: "1 valeur",     color: "#10b981" },
            { id: "3", emoji: "3️⃣", label: "3 valeurs",    color: "#FDB813" },
            { id: "5", emoji: "5️⃣", label: "5 valeurs",    color: "#a78bfa" },
          ],
          items: LISTES.map(([id, texte, n]) => ({
            id, emoji: "📋", label: texte, correct: String(n),
            hint: n === 0 ? "Deux crochets et rien entre : une liste vide, qu'on remplira plus tard."
              : n === 1 && texte.includes(",") ? "Le piège : la virgule est DANS le texte. Un seul élément, entre guillemets."
              : `${n} valeur${n > 1 ? "s" : ""}, séparées par ${n - 1} virgule${n > 2 ? "s" : ""}.`,
          })),
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque geste et son effet",
    description: "Sept gestes de liste, et ce qu'ils font vraiment.",
    blocs: [
      kodi("<p>Sept gestes que tu viens d'apprendre. Deux se ressemblent : celui qui <em>compte</em> et celui qui <em>distribue</em>.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque geste et son effet",
          instruction: "Touche une ligne de code, puis ce qu'elle fait.",
          left_label: "La ligne",
          right_label: "Son effet",
          pairs: [
            { left: "ma_liste = []",            right: "Fabrique une liste vide, à remplir" },
            { left: "ma_liste.append(1500)",    right: "Ajoute une valeur à la fin" },
            { left: "len(ma_liste)",            right: "Rend le nombre de valeurs" },
            { left: "for p in prix:",           right: "Donne chaque valeur, l'une après l'autre" },
            { left: "for i in range(3):",       right: "Donne 0, puis 1, puis 2" },
            { left: "total = total + p",        right: "Cumule, tour après tour" },
            { left: "if p > 2000:",             right: "Ne s'occupe que de certaines valeurs" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "La liste grandit sous tes yeux. Que vaut la ligne ?",
    blocs: [
      kodi("<p>Trois articles dans le panier, puis un quatrième qu'on ajoute.</p><p>Déroule la dernière ligne morceau par morceau.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "append change la liste ; len la mesure.",
        contexte: ["courses = [\"riz\", \"huile\", \"savon\"]", "courses.append(\"sucre\")"],
        ligne: "print(len(courses) * 500)",
        etapes: [
          { expression: "len(courses)", choix: ["4", "3", "500", "courses"], valeur: "4",
            explication: "Trois au départ, plus celui qu'on vient d'ajouter : quatre." },
          { expression: "4 * 500", choix: ["2000", "4500", "45"], valeur: "2000",
            explication: "Quatre articles à 500 F : 2000 F. C'est ça que print reçoit." },
        ],
        sortie: "2000",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux boucles qui se trompent",
    description: "L'une répète la liste entière, l'autre compte de travers.",
    blocs: [
      kodi("<p>Dans une boucle, la variable du tour prend <strong>une</strong> valeur à la fois. Se tromper là-dessus ne fait jamais de rouge — ça donne juste un résultat absurde.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui affiche tout à chaque tour",
        context: "Le programme devait afficher les trois prix, un par ligne. Il affiche trois fois la liste entière.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    print(p)",
        explanation: "Dans la boucle, p est UNE valeur. Afficher prix affiche toute la liste, à chaque tour.",
        instructions: [
          "prix = [1500, 800, 2300]",
          "for p in prix:",
          "    print(prix)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui remet le total à zéro",
        context: "Trois prix : 1500, 800 et 2300. Le programme devait afficher 4600. Il affiche 2300.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 2,
        fix: "(cette ligne devait être AVANT la boucle)",
        explanation: "Remis à zéro à chaque tour, le total ne garde que le dernier prix. Il se prépare une seule fois, avant.",
        instructions: [
          "prix = [1500, 800, 2300]",
          "for p in prix:",
          "    total = 0",
          "    total = total + p",
          "print(total)",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "La liste racontée",
    description: "Six phrases sur un programme qui trie les prix.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de six lignes. Il marche.</p>" +
            "<pre><code>1  prix = [2500, 800, 2300]\n" +
            "2  total = 0\n" +
            "3  for p in prix:\n" +
            "4      total = total + p\n" +
            "5      if p > 2000:\n" +
            '6          print("Cher :", p)</code></pre>' +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte la liste",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La boucle fait", after: "tours.",
              options: ["3", "6", "2"], correct: 0,
              explanation: "Un tour par valeur de la liste : trois valeurs, trois tours." },
            { id: "s2", before: "La ligne 4 s'exécute", after: "fois.",
              options: ["3", "2", "1"], correct: 0,
              explanation: "Elle est dans la boucle, sans condition : elle passe à chaque tour." },
            { id: "s3", before: "La ligne 6 s'exécute", after: "fois.",
              options: ["2", "3", "1"], correct: 0,
              explanation: "Seuls 2500 et 2300 dépassent 2000. 800 ne déclenche rien." },
            { id: "s4", before: "À la fin, total vaut", after: ".",
              options: ["5600", "4800", "2500"], correct: 0,
              explanation: "2500 + 800 + 2300 font 5600. Le cumul ne dépend pas du si." },
            { id: "s5", before: "Si on déplaçait la ligne 2 dans la boucle, total vaudrait", after: ".",
              options: ["2300", "5600", "0"], correct: 0,
              explanation: "Remis à zéro à chaque tour, il ne garderait que le dernier prix." },
            { id: "s6", before: "La ligne 5 est décalée sous la boucle, donc elle", after: ".",
              options: ["se pose à chaque tour", "ne se pose qu'une fois", "ne se pose jamais"], correct: 0,
              explanation: "Le décalage décide de ce qui se répète — la question se repose pour chaque prix." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le panier qui se remplit",
    description: "Partir de rien, ajouter, compter, cumuler.",
    blocs: [
      kodi("<p>Cette fois la liste part <strong>vide</strong>. C'est toi qui la remplis.</p><p>Quatre articles, puis trois choses à annoncer : le nombre, le total, et le plus cher.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Pars d'une liste vide. Ajoute les prix 1500, 800, 2300 et 400 avec append.\n" +
            "Affiche ensuite le nombre d'articles, le total, et le prix le plus cher — chaque phrase sur sa ligne.",
          starter_code: "panier = []\n\n# Quatre append, puis une boucle pour le total et le plus cher.\n",
          hidden_tests:
            'import re\n' +
            'assert code.count(".append(") >= 4, "Les quatre prix s ajoutent avec append."\n' +
            'assert "for" in code, "Il faut une boucle pour cumuler et comparer."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "4" in nombres, "Le panier contient 4 articles."\n' +
            'assert "5000" in nombres, "1500 + 800 + 2300 + 400 font 5000. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
            'assert "2300" in nombres, "Le plus cher est 2300."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "🎹 La mélodie en liste",
    description: "Douze notes dans une variable, une boucle pour les jouer.",
    blocs: [
      kodi("<p>Douze appels à <code>jouer</code>, c'est douze lignes. Douze notes dans une liste, c'est <strong>deux</strong>.</p><p>Compose ta mélodie : au moins douze notes, rangées dans une liste, jouées par une seule boucle.</p>"),
      jeu({
        game_type: "python_piano",
        title: "La mélodie en liste",
        instructions:
          "Range au moins douze notes dans une liste, puis joue-les avec UNE boucle. Change ensuite une note et reecoute : un seul endroit a modifier.",
        min_notes: 12,
        tempo: 380,
        starter_code: 'melodie = ["Do", "Mi", "Sol"]\n\nfor n in melodie:\n    jouer(n)\n\n# A toi : allonge la melodie jusqu\'a douze notes au moins.\n',
      }),
    ],
  },
];

const SOLUTIONS = {
  "Le panier qui se remplit": { cas: [
    { nom: "juste", attendu: "ok", code:
      'panier = []\npanier.append(1500)\npanier.append(800)\npanier.append(2300)\npanier.append(400)\ntotal = 0\nrecord = 0\nfor p in panier:\n    total = total + p\n    if p > record:\n        record = p\nprint("Articles :", len(panier))\nprint("Total :", total)\nprint("Le plus cher :", record)\n' },
    { nom: "oublie un article", attendu: "test raté", code:
      'panier = []\npanier.append(1500)\npanier.append(800)\npanier.append(2300)\ntotal = 0\nfor p in panier:\n    total = total + p\nprint("Articles :", len(panier))\nprint("Total :", total)\nprint("Le plus cher :", 2300)\n' },
    { nom: "sans boucle", attendu: "test raté", code:
      'panier = []\npanier.append(1500)\npanier.append(800)\npanier.append(2300)\npanier.append(400)\nprint("Articles :", 4)\nprint("Total :", 5000)\nprint("Le plus cher :", 2300)\n' },
  ] },
};

verifier(EXOS, {
  // `{"` attraperait la sérialisation JSON de tous les blocs : le dictionnaire
  // se repère à `.get(`. Et l'indexation, c'est un NOM suivi d'un crochet —
  // « [12] » tout seul est une liste parfaitement légitime.
  interdits: [/\bdef\b/, /\breturn\b/, /\bwhile\b/, /\.get\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/, /\belif\b/],
  comptes: { "Combien de valeurs ?": 12, "Chaque geste et son effet": 7, "La liste racontée": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
