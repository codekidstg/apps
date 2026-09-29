/**
 * Le Terrain — Bâtisseur, thème 1 séance 2 « Mes propres commandes ».
 *
 *     node scripts/terrain-batisseur-t1-s2.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : donner un nom à un morceau de programme avec
 * `def`, l'appeler avec des parenthèses, comprendre que DÉFINIR n'est pas
 * EXÉCUTER, et donner un réglage — le paramètre.
 *
 * Pas encore vu, donc interdit : `return` (séance suivante), les dictionnaires,
 * `while`, `elif`, l'indexation par position.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Mes propres commandes";

const EXOS = [
  {
    palier: 1,
    title: "Ça définit, ou ça exécute ?",
    description: "Douze lignes. Écrire une recette n'est pas cuisiner.",
    blocs: [
      kodi("<p>Écrire une recette, ce n'est pas cuisiner. <strong>Définir</strong> une fonction ne la fait pas tourner : ça la range sous son nom, pour plus tard.</p><p>C'est l'<strong>appel</strong> — le nom suivi de parenthèses — qui la fait travailler.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Définir, ou exécuter ?",
          instruction: "Cette ligne range la recette, ou elle cuisine ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Une ligne qui commence par def : elle DÉFINIT, elle n'exécute rien.",
              "Un nom suivi de parenthèses : c'est un APPEL, ça exécute.",
              "Un nom tout seul, sans parenthèses, ne fait rien du tout.",
              "print(...) et input(...) sont des appels : ce sont des fonctions déjà écrites.",
            ],
          },
          categories: [
            { id: "def", label: "Ça définit", emoji: "📝", color: "#a78bfa" },
            { id: "run", label: "Ça exécute", emoji: "▶️", color: "#10b981" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "def salut():",              correct: "def", hint: "def range la recette sous le nom salut. Rien ne s'affiche encore." },
            { id: "b", emoji: "2️⃣", label: "salut()",                   correct: "run", hint: "Le nom et les parenthèses : c'est l'appel, ça travaille." },
            { id: "c", emoji: "3️⃣", label: 'print("Bonjour")',          correct: "run", hint: "print est une fonction déjà écrite, et tu l'appelles." },
            { id: "d", emoji: "4️⃣", label: "def cadre(titre):",         correct: "def", hint: "Une définition, avec un réglage. Elle attend d'être appelée." },
            { id: "e", emoji: "5️⃣", label: 'cadre("MES NOTES")',        correct: "run", hint: "L'appel, avec sa valeur de réglage." },
            { id: "f", emoji: "6️⃣", label: "len(ma_liste)",             correct: "run", hint: "Encore une fonction déjà écrite, appelée." },
            { id: "g", emoji: "7️⃣", label: "def jouer_refrain():",      correct: "def", hint: "Le refrain est rangé, pas joué." },
            { id: "h", emoji: "8️⃣", label: "jouer_refrain()",           correct: "run", hint: "Et maintenant il sonne." },
            { id: "i", emoji: "9️⃣", label: "def total(prix):",          correct: "def", hint: "Une définition : trois mots rangés, zéro calcul." },
            { id: "j", emoji: "🔟", label: 'int(input("Ton age ? "))',  correct: "run", hint: "Deux appels d'un coup : input demande, int convertit." },
            { id: "k", emoji: "🅰️", label: "def ma_danse():",            correct: "def", hint: "Rangée sous son nom." },
            { id: "l", emoji: "🅱️", label: "ma_danse()",                 correct: "run", hint: "Exécutée, cette fois." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque mot et son rôle",
    description: "Sept écritures. Deux se ressemblent et ne font pas pareil.",
    blocs: [
      kodi("<p>Attention aux deux du milieu : le nom <strong>avec</strong> parenthèses et le nom <strong>sans</strong>. L'un travaille, l'autre ne fait strictement rien — et sans le moindre message.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque écriture et son rôle",
          instruction: "Touche une écriture, puis ce qu'elle fait.",
          left_label: "L'écriture",
          right_label: "Ce qu'elle fait",
          pairs: [
            { left: "def",             right: "Range un morceau sous un nom" },
            { left: "salut()",         right: "Le fait travailler maintenant" },
            { left: "salut",           right: "Ne fait rien, et ne dit rien" },
            { left: "(titre)",         right: "Le réglage que la fonction attend" },
            { left: 'cadre("MES NOTES")', right: "L'appel, avec son réglage" },
            { left: "Le décalage",     right: "Dit ce qui appartient à la fonction" },
            { left: "print",           right: "Une fonction que tu n'as pas écrite" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Qu'affiche ce programme ?",
    description: "Six programmes. Définir n'est pas exécuter.",
    blocs: [
      kodi("<p>Six petits programmes. À chaque fois, une seule question : <strong>qu'est-ce qui s'affiche, et dans quel ordre ?</strong></p><p>Souviens-toi : Python lit de haut en bas, et une définition ne fait que ranger.</p>"),
      {
        type: "quiz",
        content: {
          questions: [
            { question: 'print("A") — puis def f(): print("B") — puis print("C"). Qu\'affiche le programme ?',
              choices: ["A C", "A B C", "B A C"], answer: 0,
              explanation: "La définition range B sous le nom f, sans l'exécuter. Personne n'appelle f : B ne sort jamais." },
            { question: 'def f(): print("B") — puis f() — puis f(). Qu\'affiche le programme ?',
              choices: ["B", "B B", "rien"], answer: 1,
              explanation: "Deux appels, deux exécutions. C'est tout l'intérêt : écrire une fois, appeler autant qu'on veut." },
            { question: 'def salut(): print("Bonjour") — puis la ligne salut (sans parenthèses). Qu\'affiche-t-il ?',
              choices: ["une erreur rouge", "rien du tout", "Bonjour"], answer: 1,
              explanation: "Le nom seul désigne la fonction sans l'appeler. Aucun message : c'est un bug silencieux." },
            { question: "def cadre(titre): puis l'appel cadre(\"MES NOTES\") — que vaut titre dans la fonction ?",
              choices: ["titre", "rien", "MES NOTES"], answer: 2,
              explanation: "Le paramètre prend la valeur donnée à l'appel. C'est ça, le réglage." },
            { question: "def cadre(titre): appelé deux fois, avec MES NOTES puis MES OBJECTIFS — combien de fois la fonction est-elle écrite ?",
              choices: ["deux fois", "une seule fois", "trois fois"], answer: 1,
              explanation: "Écrite une fois, appelée deux. Changer le cadre, c'est changer un seul endroit." },
            { question: "Où faut-il écrire la définition d'une fonction ?",
              choices: ["après tous les appels", "avant le premier appel", "n'importe où"], answer: 1,
              explanation: "Python lit de haut en bas : appeler un nom qu'il n'a pas encore rangé donne un NameError." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deux fonctions muettes",
    description: "L'une ne part jamais, l'autre réclame son réglage.",
    blocs: [
      kodi("<p>Deux programmes qui ont l'air justes. L'un ne fait rien du tout et ne le dit pas ; l'autre devient rouge.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qu'on n'appelle jamais vraiment",
        context: "Le programme devait afficher Bonjour. Il ne s'affiche rien — et aucun message rouge.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "salut()",
        explanation: "Le nom tout seul désigne la fonction, il ne l'appelle pas. Sans parenthèses, Python range la valeur et passe à la suite, sans rien dire.",
        instructions: [
          "def salut():",
          '    print("Bonjour !")',
          "salut",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle à qui on oublie son réglage",
        context: "Le programme devient rouge : TypeError, il manque un argument.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: 'cadre("MES NOTES")',
        explanation: "La fonction attend un réglage : c'est écrit dans sa définition, entre les parenthèses. L'appel doit le lui donner.",
        instructions: [
          "def cadre(titre):",
          '    print("=====")',
          "    print(titre)",
          "cadre()",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur un programme à deux appels.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de six lignes. Il marche.</p>" +
            "<pre><code>1  def cadre(titre):\n" +
            '2      print("=====")\n' +
            "3      print(titre)\n" +
            '4  print("Debut")\n' +
            '5  cadre("MES NOTES")\n' +
            '6  cadre("MES OBJECTIFS")</code></pre>' +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le programme",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La toute première chose affichée est", after: ".",
              options: ["Debut", "=====", "MES NOTES"], correct: 0,
              explanation: "Les lignes 1 à 3 ne font que ranger la recette. La première exécution, c'est la ligne 4." },
            { id: "s2", before: "La ligne 2 s'exécute", after: "fois.",
              options: ["2", "1", "3"], correct: 0,
              explanation: "Une fois par appel, et il y a deux appels." },
            { id: "s3", before: "Au premier appel, titre vaut", after: ".",
              options: ["MES NOTES", "titre", "MES OBJECTIFS"], correct: 0,
              explanation: "Le paramètre prend la valeur écrite entre les parenthèses de l'appel." },
            { id: "s4", before: "En tout, le programme affiche", after: "lignes.",
              options: ["5", "6", "3"], correct: 0,
              explanation: "Debut, puis deux fois (une ligne de signes égal + un titre) : 1 + 2 + 2 = 5." },
            { id: "s5", before: "Pour passer les signes égal à des tirets, il faut modifier", after: ".",
              options: ["un seul endroit", "deux endroits", "tout le programme"], correct: 0,
              explanation: "La ligne 2, et elle seule. C'est exactement pour ça qu'on écrit une fonction." },
            { id: "s6", before: "Si on supprimait les lignes 5 et 6, le programme afficherait", after: ".",
              options: ["Debut seulement", "rien", "les deux cadres"], correct: 0,
              explanation: "Sans appel, la fonction reste rangée sans jamais travailler." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "L'affiche réglable",
    description: "Un seul cadre, trois affiches différentes.",
    blocs: [
      kodi("<p>Trois affiches pour le marché, toutes de la même forme : une ligne d'étoiles, le texte, une ligne d'étoiles.</p><p>Écris le cadre <strong>une seule fois</strong>, avec un réglage — puis appelle-le trois fois.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris la fonction affiche(texte) : une ligne de six etoiles, le texte, une autre ligne de six etoiles.\n" +
            "Appelle-la trois fois, avec RIZ, HUILE et SAVON.",
          starter_code: "# Une seule definition, trois appels.\n",
          hidden_tests:
            'compact = code.replace(" ", "")\n' +
            'assert "defaffiche(" in compact, "Ecris la fonction affiche(texte)."\n' +
            'assert code.count("affiche(") >= 4, "Une definition et trois appels : affiche apparait quatre fois."\n' +
            'lignes = [l.strip() for l in output.split("\\n") if l.strip()]\n' +
            'etoiles = [l for l in lignes if set(l) == {"*"}]\n' +
            'assert len(etoiles) == 6, "Trois affiches, deux lignes d etoiles chacune : six en tout. Ton programme en a " + str(len(etoiles)) + "."\n' +
            'for l in etoiles:\n' +
            '    assert len(l) == 6, "Chaque ligne fait six etoiles. Une des tiennes en compte " + str(len(l)) + "."\n' +
            'for mot in ["RIZ", "HUILE", "SAVON"]:\n' +
            '    assert mot in output, "Il manque l affiche " + mot + "."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "🎹 Ton refrain à toi",
    description: "Écris-le une fois, appelle-le trois fois.",
    blocs: [
      kodi("<p>Un refrain, c'est exactement une fonction : un morceau qu'on écrit une fois et qu'on rappelle à chaque fois qu'il revient.</p><p>Écris ton refrain, puis fais une chanson : refrain, couplet, refrain, couplet, refrain.</p>"),
      jeu({
        game_type: "python_piano",
        title: "Ton refrain à toi",
        instructions:
          "Ecris une fonction refrain() qui joue au moins trois notes. Appelle-la trois fois, en glissant des couplets differents entre les appels. Quinze notes au minimum.",
        min_notes: 15,
        tempo: 380,
        starter_code:
          "def refrain():\n    jouer(\"Sol\")\n    jouer(\"Mi\")\n    jouer(\"Do\")\n\nrefrain()\n\n# A toi : un couplet, puis le refrain, puis un autre couplet, puis le refrain.\n",
      }),
    ],
  },
];

const SOLUTIONS = {
  "L'affiche réglable": { cas: [
    { nom: "juste", attendu: "ok", code:
      'def affiche(texte):\n    print("******")\n    print(texte)\n    print("******")\n\naffiche("RIZ")\naffiche("HUILE")\naffiche("SAVON")\n' },
    { nom: "recopie trois fois sans fonction", attendu: "test raté", code:
      'print("******")\nprint("RIZ")\nprint("******")\nprint("******")\nprint("HUILE")\nprint("******")\nprint("******")\nprint("SAVON")\nprint("******")\n' },
    { nom: "cinq etoiles au lieu de six", attendu: "test raté", code:
      'def affiche(texte):\n    print("*****")\n    print(texte)\n    print("*****")\n\naffiche("RIZ")\naffiche("HUILE")\naffiche("SAVON")\n' },
    { nom: "oublie une affiche", attendu: "test raté", code:
      'def affiche(texte):\n    print("******")\n    print(texte)\n    print("******")\n\naffiche("RIZ")\naffiche("HUILE")\n' },
  ] },
};

verifier(EXOS, {
  interdits: [/\breturn\b/, /\bwhile\b/, /\belif\b/, /\.get\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Ça définit, ou ça exécute ?": 12, "Chaque mot et son rôle": 7, "Qu'affiche ce programme ?": 6, "Le programme raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
