/**
 * Le Terrain — Bâtisseur, séance 3 « Choisir ».
 *
 *     node scripts/terrain-batisseur-s3.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : `if` et `else`, les six signes de comparaison,
 * la différence entre `=` qui range et `==` qui compare, et le décalage qui
 * décide de ce qui est à l'intérieur du si.
 *
 * Pas encore vu, donc interdit : `for`, `while`, `elif`, les fonctions, les
 * listes. La séance 2 reste disponible — variables, `int()`, `input()`.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Choisir";

const EXOS = [
  {
    palier: 1,
    title: "Vrai ou faux ?",
    description: "Douze comparaisons. Python répond par oui ou par non.",
    blocs: [
      kodi("<p>Une comparaison ne calcule rien : elle <strong>tranche</strong>. Vrai, ou faux.</p><p>Douze comparaisons t'attendent. Deux d'entre elles cachent un piège que tu connais déjà depuis la séance dernière.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Vrai ou faux ?",
          instruction: "Cette comparaison, elle répond quoi ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "== demande « est-ce égal ? », != demande « est-ce différent ? »",
              ">= et <= acceptent aussi l'égalité : 3 >= 3 est vrai.",
              "Deux textes ne sont égaux que s'ils s'écrivent exactement pareil, majuscules comprises.",
              "Un nombre et un texte ne sont jamais égaux : 0 n'est pas \"0\".",
            ],
          },
          categories: [
            { id: "v", label: "Vrai", emoji: "✅", color: "#10b981" },
            { id: "f", label: "Faux", emoji: "❌", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "5 > 3",             correct: "v", hint: "5 est bien plus grand que 3." },
            { id: "b", emoji: "2️⃣", label: "10 == 10",          correct: "v", hint: "Deux fois le même nombre : égaux." },
            { id: "c", emoji: "3️⃣", label: '"kodi" == "Kodi"',  correct: "f", hint: "Le piège de la majuscule : pour Python, ce ne sont pas les mêmes textes." },
            { id: "d", emoji: "4️⃣", label: "7 != 7",            correct: "f", hint: "!= demande « est-ce différent ? ». Sept et sept, non." },
            { id: "e", emoji: "5️⃣", label: "3 >= 3",            correct: "v", hint: ">= accepte l'égalité : plus grand OU égal." },
            { id: "f", emoji: "6️⃣", label: "2 < 1",             correct: "f", hint: "2 n'est pas plus petit que 1." },
            { id: "g", emoji: "7️⃣", label: "12 <= 12",          correct: "v", hint: "Plus petit ou égal : l'égalité suffit." },
            { id: "h", emoji: "8️⃣", label: '"oui" != "non"',    correct: "v", hint: "Ces deux textes sont bien différents." },
            { id: "i", emoji: "9️⃣", label: "100 > 99",          correct: "v", hint: "Cent passe devant quatre-vingt-dix-neuf." },
            { id: "j", emoji: "🔟", label: '0 == "0"',          correct: "f", hint: "Le second est du texte. Un nombre et un texte ne sont jamais égaux." },
            { id: "k", emoji: "🅰️", label: "15 < 15",           correct: "f", hint: "< tout seul refuse l'égalité. Il aurait fallu <=." },
            { id: "l", emoji: "🅱️", label: "9 >= 10",           correct: "f", hint: "Neuf n'est ni plus grand ni égal à dix." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque signe et sa question",
    description: "Sept signes. Deux se ressemblent et ne font pas du tout pareil.",
    blocs: [
      kodi("<p>Le signe le plus dangereux de la séance est <code>=</code>. Il ne pose aucune question : il range.</p><p>Relie chaque signe à ce qu'il fait vraiment.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque signe et sa question",
          pairs: [
            { left: "=",     right: "Range dans la boîte — ne demande rien" },
            { left: "==",    right: "Est-ce que c'est égal ?" },
            { left: "!=",    right: "Est-ce que c'est différent ?" },
            { left: ">",     right: "Est-ce que c'est plus grand ?" },
            { left: "<=",    right: "Plus petit, ou égal ?" },
            { left: "if",    right: "Si c'est vrai, fais ce qui est décalé en dessous" },
            { left: "else:", right: "Sinon, fais l'autre bloc" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Quelle branche s'exécute ?",
    description: "Six programmes. Une seule branche part à chaque fois.",
    blocs: [
      kodi("<p>Dans une décision, <strong>une seule</strong> branche s'exécute — jamais les deux.</p><p>Six programmes. Dis ce qui s'affiche, exactement.</p>"),
      {
        type: "quiz",
        content: {
          questions: [
            { question: 'note = 14, puis if note >= 10: print("Recu") else: print("Ajourne") — qu\'affiche le programme ?',
              choices: ["Recu", "Ajourne", "Recu puis Ajourne"], answer: 0,
              explanation: "14 est plus grand que 10 : la première branche part, et l'autre est sautée." },
            { question: 'note = 10, même programme — qu\'affiche-t-il ?',
              choices: ["Recu", "Ajourne", "Rien"], answer: 0,
              explanation: ">= accepte l'égalité. Avec exactement 10, c'est encore Recu." },
            { question: 'mot = "Kodi", puis if mot == "kodi": print("Ouvert") else: print("Ferme")',
              choices: ["Ferme", "Ouvert", "Les deux"], answer: 0,
              explanation: "La majuscule change tout : les deux textes ne sont pas égaux, donc c'est le sinon." },
            { question: 'age = 20, puis if age > 18: print("A") puis, DÉCALÉ AUSSI, print("B") — qu\'affiche-t-il ?',
              choices: ["A puis B", "A seulement", "B seulement"], answer: 0,
              explanation: "Tout ce qui est décalé sous le si appartient au si. Les deux lignes partent ensemble." },
            { question: 'age = 10, même programme avec A et B décalés sous le si',
              choices: ["Rien", "B seulement", "A puis B"], answer: 0,
              explanation: "La condition est fausse : tout le bloc décalé est sauté, les deux lignes avec." },
            { question: 'age = 10, mais cette fois print("B") n\'est PAS décalé — qu\'affiche-t-il ?',
              choices: ["B seulement", "Rien", "A puis B"], answer: 0,
              explanation: "Sans décalage, B ne fait plus partie du si : il s'exécute dans tous les cas. C'est le décalage qui décide." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux décisions cassées",
    description: "L'une devient rouge, l'autre laisse tout le monde entrer.",
    blocs: [
      kodi("<p>Deux portiers. Le premier refuse de démarrer, le second laisse passer n'importe qui.</p><p>Une seule ligne est fausse dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le portier qui devient rouge",
        context: "On tape 20, et le programme devient rouge : TypeError. Pourtant la décision est bien écrite.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 0,
        fix: 'age = int(input("Ton age ? "))',
        explanation: "input rend du texte. Comparer du texte à un nombre est impossible : il faut convertir avec int avant de comparer.",
        instructions: [
          'age = input("Ton age ? ")',
          "if age >= 18:",
          '    print("Entrez.")',
          "else:",
          '    print("Trop jeune.")',
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Le portier trop gentil",
        context: "Aucun message rouge. Mais tout le monde entre, même avec un mauvais mot de passe.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 4,
        fix: '    print("Refuse.")',
        explanation: "Les deux branches disaient la même chose : la décision ne servait à rien. Un programme peut être faux sans jamais devenir rouge.",
        instructions: [
          'mot = input("Mot de passe ? ")',
          'if mot == "kodi":',
          '    print("Bienvenue !")',
          "else:",
          '    print("Bienvenue !")',
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le portier raconté",
    description: "Six phrases sur un programme qui décide.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un portier en cinq lignes. Il marche.</p>" +
            '<pre><code>1  mot = input("Mot de passe ? ")\n' +
            '2  if mot == "kodi":\n' +
            '3      print("Bienvenue !")\n' +
            "4  else:\n" +
            '5      print("Refuse.")</code></pre>' +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le portier",
          sentences: [
            { id: "s1", before: "Si on tape kodi, le programme affiche", after: ".",
              options: ["Bienvenue !", "Refuse.", "les deux"], correct: 0,
              explanation: "La comparaison est vraie : la première branche part, l'autre est sautée." },
            { id: "s2", before: "Si on tape Kodi avec un K majuscule, il affiche", after: ".",
              options: ["Refuse.", "Bienvenue !", "une erreur"], correct: 0,
              explanation: "Pour Python, Kodi et kodi ne sont pas le même texte." },
            { id: "s3", before: "Le signe == à la ligne 2 sert à", after: ".",
              options: ["comparer", "ranger dans la boîte", "additionner"], correct: 0,
              explanation: "Un seul = rangerait quelque chose dans mot. Deux = posent une question." },
            { id: "s4", before: "Les deux print sont décalés parce qu'ils sont", after: ".",
              options: ["à l'intérieur d'une branche", "plus importants", "des commentaires"], correct: 0,
              explanation: "Le décalage dit ce qui appartient au si et ce qui appartient au sinon." },
            { id: "s5", before: "Les deux branches s'exécutent", after: ".",
              options: ["jamais ensemble", "toujours ensemble", "au hasard"], correct: 0,
              explanation: "Une décision choisit un chemin. L'autre est sauté, toujours." },
            { id: "s6", before: "Un mot de passe écrit dans le programme est", after: ".",
              options: ["lisible par tous ceux qui ouvrent le code", "bien caché", "chiffré"], correct: 0,
              explanation: "Tu l'as trouvé toi-même en lisant le code, en séance. Un vrai développeur ne fait jamais ça." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le portier du club",
    description: "Un mot de passe, deux réponses possibles.",
    blocs: [
      kodi("<p>À toi d'écrire le portier. Il demande le mot de passe, puis il tranche.</p><p>Le mot de passe est <code>griot</code>. Les deux réponses doivent être différentes — c'est tout l'intérêt d'une décision.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Demande le mot de passe. Si c'est griot, affiche une phrase contenant Bienvenue. Sinon, affiche une phrase contenant Refuse.",
          starter_code: 'mot = input("Mot de passe ? ")\n\n# A toi : la decision, et les deux reponses\n',
          hidden_tests:
            'assert "if" in code, "Il faut une decision : if."\n' +
            'assert "else" in code, "Et un sinon : else."\n' +
            'assert "==" in code, "On compare avec ==, pas avec un seul = qui rangerait."\n' +
            // Une seule execution ne montre qu'une branche : c'est dans le code
            // qu'on voit si l'autre dit autre chose.
            'assert "Bienvenue" in code and "Refuse" in code, "Tes deux reponses doivent etre differentes : une avec Bienvenue, une avec Refuse."\n' +
            'dit = "\\n".join(l for l in output.split("\\n") if "?" not in l)\n' +
            'assert ("Bienvenue" in dit) != ("Refuse" in dit), "Une seule des deux reponses doit sortir — jamais les deux, jamais aucune."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le prix selon la quantité",
    description: "À partir de dix articles, le prix baisse. Et dix, c'est dedans.",
    blocs: [
      kodi("<p>Au marché en gros : l'article coûte <strong>500 F</strong>, mais <strong>à partir de dix</strong>, il passe à <strong>400 F</strong>.</p><p>« À partir de dix » veut dire que dix est compris. C'est exactement là que la plupart des programmes se trompent — la quantité de l'amorce vaut dix, et elle ne doit pas changer.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "La quantite est deja rangee : ne change pas cette ligne. A partir de 10 articles le prix unitaire est 400 F, sinon 500 F. Affiche le total, avec le mot Total dans ta phrase.",
          starter_code: "quantite = 10\n\n# A toi : la decision, le calcul, et la phrase\n",
          hidden_tests:
            'import re\n' +
            'assert "quantite = 10" in code.replace(" ", " "), "Garde la ligne quantite = 10 telle quelle."\n' +
            'assert "if" in code and "else" in code, "Il faut une decision : if et else."\n' +
            'assert "400" in code and "500" in code, "Les deux prix doivent apparaitre : 400 et 500."\n' +
            'assert "Total" in output or "total" in output, "Ta phrase doit contenir le mot Total."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "4000" in nombres, "A dix articles, le prix est deja de 400 F : le total est 4000. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "Le portier du club": {
    reponses: ["griot"],
    cas: [
      { nom: "juste, bon mot", attendu: "ok", code:
        'mot = input("Mot de passe ? ")\nif mot == "griot":\n    print("Bienvenue !")\nelse:\n    print("Refuse.")\n' },
      { nom: "juste, mauvais mot", attendu: "ok", reponses: ["kodi"], code:
        'mot = input("Mot de passe ? ")\nif mot == "griot":\n    print("Bienvenue !")\nelse:\n    print("Refuse.")\n' },
      { nom: "les deux branches disent pareil", attendu: "test raté", code:
        'mot = input("Mot de passe ? ")\nif mot == "griot":\n    print("Bienvenue !")\nelse:\n    print("Bienvenue !")\n' },
      { nom: "sans sinon", attendu: "test raté", code:
        'mot = input("Mot de passe ? ")\nif mot == "griot":\n    print("Bienvenue !")\n' },
      { nom: "un seul = au lieu de ==", attendu: "plante", code:
        'mot = input("Mot de passe ? ")\nif mot = "griot":\n    print("Bienvenue !")\nelse:\n    print("Refuse.")\n' },
    ],
  },
  "Le prix selon la quantité": {
    cas: [
      { nom: "juste (seuil inclus, 4000)", attendu: "ok", code:
        'quantite = 10\nif quantite >= 10:\n    prix = 400\nelse:\n    prix = 500\nprint("Total :", quantite * prix, "F")\n' },
      { nom: "seuil exclusif (> au lieu de >=)", attendu: "test raté", code:
        'quantite = 10\nif quantite > 10:\n    prix = 400\nelse:\n    prix = 500\nprint("Total :", quantite * prix, "F")\n' },
      { nom: "sans decision", attendu: "test raté", code:
        'quantite = 10\nprint("Total :", quantite * 400, "F")\n' },
      { nom: "sans le mot Total", attendu: "test raté", code:
        'quantite = 10\nif quantite >= 10:\n    prix = 400\nelse:\n    prix = 500\nprint(quantite * prix)\n' },
      { nom: "a change la quantite", attendu: "test raté", code:
        'quantite = 20\nif quantite >= 10:\n    prix = 400\nelse:\n    prix = 500\nprint("Total :", quantite * prix, "F")\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bfor\b/, /\bwhile\b/, /\bdef\b/, /\belif\b/, /\brange\(/, /\bstr\(/, /\.append/, /\[\s*0\s*\]/],
  comptes: { "Vrai ou faux ?": 12, "Chaque signe et sa question": 7, "Quelle branche s'exécute ?": 6, "Le portier raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
