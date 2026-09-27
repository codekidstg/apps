/**
 * Le Terrain — Bâtisseur, séance 4 « Répéter ».
 *
 *     node scripts/terrain-batisseur-s4.mjs [--ecrire] [--refaire] [--banc]
 *
 * C'est la séance où Samuel avait « maîtrisé » le range en réussissant un
 * glisser-déposer dont les étiquettes donnaient la réponse, puis buté dessus en
 * séance. Les trois barreaux hauts sont donc ici : dérouler tour par tour,
 * réparer une boucle qui compte faux, produire une boucle qui dessine.
 *
 * Ce que la séance a enseigné : `for tour in range(N)`, le compte qui part de 0
 * et s'arrête avant N, le décalage qui décide de ce qui se répète, le `if` dans
 * la boucle, et `"*" * 3` qui répète un texte.
 *
 * Pas encore vu, donc interdit : `while`, les fonctions, les listes, `elif`,
 * `range` à deux arguments.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Répéter";

// Garde-fou arithmétique : les comptes annoncés dans les bacs doivent être vrais.
const TOURS = [
  ["a", "range(3) : Salut",                       3],
  ["b", "range(4) : Salut",                       4],
  ["c", "range(6) : Salut",                       6],
  ["d", "range(3) : A puis B (les deux décalés)", 6],
  ["e", "range(1) : A, B, C (tous décalés)",      3],
  ["f", "range(3) : A — puis Fin en dehors",      4],
  ["g", "range(5) : A — puis Fin en dehors",      6],
  ["h", "range(2) : A — puis Fin en dehors",      3],
  ["i", "range(2) : A, B (les deux décalés)",     4],
  ["j", "range(2) : A, B, C (tous décalés)",      6],
  ["k", "range(1) : A, B, C — puis Fin en dehors", 4],
  ["l", "range(1) : A, B, C, D, E — puis Fin en dehors", 6],
];
const ATTENDU = { a: 3, b: 4, c: 6, d: 6, e: 3, f: 4, g: 6, h: 3, i: 4, j: 6, k: 4, l: 6 };
for (const [id, , n] of TOURS) if (ATTENDU[id] !== n) throw new Error(`compte incohérent pour ${id}`);

const INDICES = {
  a: "Trois tours, une ligne par tour.",
  b: "Quatre tours, une ligne par tour.",
  c: "Six tours, une ligne par tour.",
  d: "Deux lignes décalées × trois tours = six.",
  e: "Un seul tour, mais trois lignes dedans.",
  f: "Trois tours, plus la ligne du dehors qui ne passe qu'une fois.",
  g: "Cinq tours, plus la ligne du dehors.",
  h: "Deux tours, plus la ligne du dehors.",
  i: "Deux lignes décalées × deux tours.",
  j: "Trois lignes décalées × deux tours.",
  k: "Trois lignes dans un seul tour, plus celle du dehors.",
  l: "Cinq lignes dans un seul tour, plus celle du dehors.",
};

const EXOS = [
  {
    palier: 1,
    title: "Ça affiche combien de lignes ?",
    description: "Douze boucles. Le décalage change tout.",
    blocs: [
      kodi("<p>Ce qui est <strong>décalé</strong> sous la boucle se répète. Ce qui ne l'est pas ne passe qu'une fois.</p><p>Douze boucles. Combien de lignes chacune affiche-t-elle ?</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de lignes ?",
          instruction: "Choisis une boucle, puis son bac.",
          bins: [
            { id: "3", emoji: "3️⃣", label: "3 lignes", color: "#10b981" },
            { id: "4", emoji: "4️⃣", label: "4 lignes", color: "#FDB813" },
            { id: "6", emoji: "6️⃣", label: "6 lignes", color: "#a78bfa" },
          ],
          items: TOURS.map(([id, label, n]) => ({ id, emoji: "🔁", label, correct: String(n), hint: INDICES[id] })),
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque boucle et sa sortie",
    description: "Sept boucles. Écris-les dans ta tête avant de relier.",
    blocs: [
      kodi("<p><code>range(3)</code> ne dit pas « trois fois » : il fabrique <strong>0, 1, 2</strong>. La variable du tour prend ces valeurs, l'une après l'autre.</p><p>Relie chaque boucle à ce qu'elle affiche.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque boucle et sa sortie",
          pairs: [
            { left: "range(3), print(tour)",            right: "0 puis 1 puis 2" },
            { left: "range(3), print(tour + 1)",        right: "1 puis 2 puis 3" },
            { left: "range(2), print(\"Ok\")",           right: "Ok puis Ok" },
            { left: 'range(4), print("*" * tour)',      right: "rien, puis *, **, ***" },
            { left: 'range(3), print("*" * (tour + 1))', right: "*, puis **, puis ***" },
            { left: "range(1), print(tour)",            right: "0, et c'est tout" },
            { left: "range(5), print(tour)",            right: "0 1 2 3 4" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "Troisième tour d'une boucle. Que vaut la ligne ?",
    blocs: [
      kodi("<p>On est au <strong>troisième tour</strong> : la variable <code>tour</code> vaut 2, pas 3 — elle a commencé à zéro.</p><p>Déroule la ligne morceau par morceau.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Au troisième tour, tour vaut 2.",
        contexte: ["for tour in range(5):", "    # nous sommes au 3e tour"],
        ligne: 'print("*" * (tour + 1))',
        etapes: [
          { expression: "tour", choix: ["2", "3", "5", "tour"], valeur: "2",
            explication: "Premier tour 0, deuxième 1, troisième 2. C'est tout le piège du range." },
          { expression: "(2 + 1)", choix: ["3", "21", "2"], valeur: "3",
            explication: "On ajoute 1 pour que le premier tour dessine déjà une étoile." },
          { expression: '"*" * 3', choix: ['"***"', '"*3"', '"3"'], valeur: '"***"',
            explication: "Entre un texte et un nombre, le * ne multiplie pas : il répète le texte." },
        ],
        sortie: "***",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux boucles qui comptent faux",
    description: "Aucune ne devient rouge. Les deux se trompent.",
    blocs: [
      kodi("<p>Depuis cette séance, tu sais qu'un programme peut tourner sans le moindre rouge et donner un résultat faux.</p><p>En voici deux. Une ligne fausse dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le compte qui commence mal",
        context: "Ce programme devait afficher les tours de 1 à 5. Il affiche 0, 1, 2, 3, 4.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "    print(tour + 1)",
        explanation: "range(5) fabrique 0, 1, 2, 3, 4. Pour compter à partir de 1, on affiche tour + 1. Le nombre de tours, lui, était bon.",
        instructions: [
          "for tour in range(5):",
          "    print(tour)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "La ligne de trop",
        context: "Le programme devait dire Fini une seule fois, à la fin. Il le dit trois fois.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: 'print("Fini")',
        explanation: "Décalée, la ligne appartient à la boucle et repasse à chaque tour. Sortie du décalage, elle ne passe qu'une fois.",
        instructions: [
          "for tour in range(3):",
          '    print("Tour", tour)',
          '    print("Fini")',
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "La boucle racontée",
    description: "Six phrases sur une boucle de quatre tours.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici une boucle. Elle marche.</p>" +
            '<pre><code>1  print("=== DEBUT ===")\n' +
            "2  for tour in range(4):\n" +
            '3      print("Tour", tour)\n' +
            '4  print("=== FIN ===")</code></pre>' +
            "<p>Ne la modifie pas. Raconte-la.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte la boucle",
          sentences: [
            { id: "s1", before: "La ligne 3 s'exécute", after: "fois.",
              options: ["4", "3", "5"], correct: 0,
              explanation: "range(4) fabrique quatre nombres : 0, 1, 2, 3." },
            { id: "s2", before: "Au premier tour, tour vaut", after: ".",
              options: ["0", "1", "4"], correct: 0,
              explanation: "Le compte part toujours de zéro." },
            { id: "s3", before: "Au dernier tour, tour vaut", after: ".",
              options: ["3", "4", "5"], correct: 0,
              explanation: "range(4) s'arrête juste avant 4. Le dernier est 3." },
            { id: "s4", before: "La ligne 4 s'exécute", after: ".",
              options: ["une seule fois, à la fin", "quatre fois", "jamais"], correct: 0,
              explanation: "Elle n'est pas décalée : elle ne fait pas partie de la boucle." },
            { id: "s5", before: "En tout, le programme affiche", after: "lignes.",
              options: ["6", "4", "5"], correct: 0,
              explanation: "Une ligne de début, quatre tours, une ligne de fin : six." },
            { id: "s6", before: "Si on décalait la ligne 4 sous la boucle, elle s'afficherait", after: ".",
              options: ["quatre fois", "une fois", "jamais"], correct: 0,
              explanation: "Le décalage est la seule chose qui décide de ce qui se répète." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La table de 7",
    description: "Dix lignes, une boucle, et le piège du zéro.",
    blocs: [
      kodi("<p>La table de 7, de <strong>7 × 1</strong> jusqu'à <strong>7 × 10</strong>, une ligne par résultat.</p><p>Souviens-toi que ton compteur part de zéro : si tu l'oublies, ta table commencera par 0 et s'arrêtera à 63.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Affiche la table de 7, de 7 x 1 jusqu'a 7 x 10, une ligne par resultat. Utilise une boucle — pas dix print.",
          starter_code: "# Une boucle, dix lignes.\n",
          hidden_tests:
            'import re\n' +
            'assert "for" in code and "range(" in code, "Il faut une boucle : for et range."\n' +
            'assert code.count("print(") <= 2, "Dix print recopies, ce n est pas une boucle. Une seule ligne d affichage suffit."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'for attendu in ["7", "14", "21", "28", "35", "42", "49", "56", "63", "70"]:\n' +
            '    assert attendu in nombres, "Il manque " + attendu + " dans ta table."\n' +
            'assert "0" not in nombres, "Ta table commence a 0 : ton compteur part de zero, pense a ajouter 1."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La pyramide qui descend",
    description: "Cinq lignes d'étoiles, de la plus longue à la plus courte.",
    blocs: [
      kodi("<p>En séance, tu as dessiné une pyramide qui monte. Celle-ci <strong>descend</strong> :</p><pre><code>*****\n****\n***\n**\n*</code></pre><p>Même outil, autre calcul. C'est le compteur qui doit travailler à l'envers.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Affiche cinq lignes d'etoiles : cinq, puis quatre, puis trois, puis deux, puis une. Utilise une boucle.",
          starter_code: "# Le compteur monte. A toi de le faire descendre.\n",
          hidden_tests:
            'assert "for" in code and "range(" in code, "Il faut une boucle : for et range."\n' +
            'assert code.count("print(") <= 2, "Cinq print recopies, ce n est pas une boucle."\n' +
            'lignes = [l.strip() for l in output.split("\\n") if l.strip()]\n' +
            'assert len(lignes) == 5, "Il faut cinq lignes. Ton programme en affiche " + str(len(lignes)) + "."\n' +
            'attendu = ["*****", "****", "***", "**", "*"]\n' +
            'assert lignes == attendu, "L ordre attendu est 5, 4, 3, 2, 1 etoiles. Ton programme affiche : " + " / ".join(lignes)',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "La table de 7": {
    cas: [
      { nom: "juste", attendu: "ok", code: 'for tour in range(10):\n    print(7 * (tour + 1))\n' },
      { nom: "part de zero", attendu: "test raté", code: 'for tour in range(10):\n    print(7 * tour)\n' },
      { nom: "s arrete a 63", attendu: "test raté", code: 'for tour in range(9):\n    print(7 * (tour + 1))\n' },
      { nom: "dix print recopies", attendu: "test raté", code: [1,2,3,4,5,6,7,8,9,10].map((i) => `print(${7 * i})`).join("\n") + "\n" },
    ],
  },
  "La pyramide qui descend": {
    cas: [
      { nom: "juste", attendu: "ok", code: 'for tour in range(5):\n    print("*" * (5 - tour))\n' },
      { nom: "monte au lieu de descendre", attendu: "test raté", code: 'for tour in range(5):\n    print("*" * (tour + 1))\n' },
      { nom: "une ligne vide au debut", attendu: "test raté", code: 'for tour in range(5):\n    print("*" * (4 - tour))\n' },
      { nom: "quatre lignes", attendu: "test raté", code: 'for tour in range(4):\n    print("*" * (4 - tour))\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bwhile\b/, /\bdef\b/, /\belif\b/, /\bstr\(/, /\.append/, /\[\s*0\s*\]/],
  comptes: { "Ça affiche combien de lignes ?": 12, "Chaque boucle et sa sortie": 7, "La boucle racontée": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
