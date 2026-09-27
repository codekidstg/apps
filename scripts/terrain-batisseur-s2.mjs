/**
 * Le Terrain — Bâtisseur, séance 2 « Garder une information ».
 *
 *     node scripts/terrain-batisseur-s2.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : la variable comme une boîte, `=` qui range,
 * `int()` qui convertit, `input()` qui rend TOUJOURS du texte, le `+` qui colle
 * deux textes, et les deux pannes classiques — la boîte qui n'existe pas
 * (NameError) et le calcul impossible (TypeError).
 *
 * Pas encore vu, donc interdit ici : `if`, `for`, `while`, les fonctions, les
 * listes, `str()`, et le `*` qui répète un texte (il arrive à la séance 4).
 */
import { base, lecteur, kodi, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const ECRIRE = process.argv.includes("--ecrire");
const LECON = "Garder une information";

const EXOS = [
  {
    palier: 1,
    title: "Python voit quoi ?",
    description: "Douze valeurs. Il ne voit pas ce que tu vois.",
    blocs: [
      kodi("<p>Pour toi, <code>12</code> et <code>\"12\"</code> se ressemblent. Pour Python, ce sont deux mondes différents : l'un se calcule, l'autre se colle.</p><p>Douze valeurs. Dis ce que Python voit.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Python voit quoi ?",
          instruction: "Un nombre qui se calcule, ou du texte qui se colle ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Des guillemets autour → c'est du texte, même si ce sont des chiffres.",
              "Pas de guillemets, que des chiffres → c'est un nombre.",
              "input(...) rend TOUJOURS du texte, même quand on tape 12.",
              "int(...) transforme le texte en nombre.",
            ],
          },
          categories: [
            { id: "n", label: "Un nombre", emoji: "🔢", color: "#10b981" },
            { id: "t", label: "Du texte",  emoji: "💬", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: '12',                              correct: "n", hint: "Pas de guillemets, que des chiffres : un nombre." },
            { id: "b", emoji: "2️⃣", label: '"12"',                            correct: "t", hint: "Les guillemets en font du texte, même si ça ressemble à un nombre." },
            { id: "c", emoji: "3️⃣", label: '"bonjour"',                       correct: "t", hint: "Du texte, sans hésitation." },
            { id: "d", emoji: "4️⃣", label: 'int("12")',                       correct: "n", hint: "int transforme le texte en nombre. C'est tout son travail." },
            { id: "e", emoji: "5️⃣", label: 'input("Ton age ? ")',             correct: "t", hint: "Le piège central de la séance : input rend toujours du texte, même quand tu tapes 12." },
            { id: "f", emoji: "6️⃣", label: '12 + 3',                          correct: "n", hint: "Deux nombres additionnés : encore un nombre. 15." },
            { id: "g", emoji: "7️⃣", label: '"12" + "3"',                      correct: "t", hint: "Deux textes collés : « 123 ». C'est toujours du texte." },
            { id: "h", emoji: "8️⃣", label: '2026 - 2014',                     correct: "n", hint: "Une soustraction entre nombres donne un nombre." },
            { id: "i", emoji: "9️⃣", label: '"J\'ai " + "12 ans"',             correct: "t", hint: "Du texte collé à du texte." },
            { id: "j", emoji: "🔟", label: 'int(input("Ton age ? "))',        correct: "n", hint: "input rend du texte, int le convertit. Le geste complet." },
            { id: "k", emoji: "🅰️", label: 'age  (après age = 12)',           correct: "n", hint: "La boîte contient ce qu'on y a rangé : un nombre." },
            { id: "l", emoji: "🅱️", label: 'prix  (après prix = "500")',      correct: "t", hint: "Avec les guillemets, on a rangé du texte dans la boîte." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque geste et son effet",
    description: "Sept lignes, sept effets. Deux se ressemblent beaucoup.",
    blocs: [
      kodi("<p>Sept gestes que tu viens d'apprendre. À chacun son effet exact.</p><p>Attention aux deux qui se ressemblent : ranger, et se servir de ce qu'il y a dedans.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque geste et son effet",
          pairs: [
            { left: "age = 12",       right: "Range 12 dans la boîte age" },
            { left: "age = age + 1",  right: "Prend ce qu'il y a dedans, ajoute 1, remet" },
            { left: "int(annee)",     right: "Transforme le texte en nombre" },
            { left: 'input("Ton age ? ")', right: "Demande, et rend toujours du texte" },
            { left: "NameError",      right: "La boîte n'existe pas, ou son nom est mal écrit" },
            { left: "TypeError",      right: "Un calcul entre un nombre et du texte" },
            { left: '"12" + "3"',     right: "Donne 123, collé bout à bout" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "La boîte a changé deux fois. Que contient-elle ?",
    blocs: [
      kodi("<p>Une boîte ne garde qu'une chose à la fois : quand on range du neuf, l'ancien est perdu.</p><p>Suis les deux premières lignes dans ta tête, puis dis ce que devient chaque morceau.</p>"),
      {
        type: "blockly_challenge",
        content: {
          game_type: "deviens_ordinateur",
          title: "Deviens l'ordinateur",
          description: "Une boîte vaut ce qu'on y a rangé en dernier.",
          contexte: ["age = 12", "age = age + 5"],
          ligne: 'print(age + 1)',
          etapes: [
            { expression: "age", choix: ["17", "12", "13", "age"], valeur: "17",
              explication: "12 au départ, puis age + 5 range 17. L'ancien 12 est perdu." },
            { expression: "17 + 1", choix: ["18", "171", "116"], valeur: "18",
              explication: "Deux nombres : ça s'additionne. C'est 18 que print reçoit." },
          ],
          sortie: "18",
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Les deux pannes classiques",
    description: "Le calcul impossible, et la boîte qui n'existe pas.",
    blocs: [
      kodi("<p>Deux programmes, deux pannes — exactement les deux que tu rencontreras le plus souvent cette année.</p>"),
      {
        type: "blockly_challenge",
        content: {
          game_type: "bug_hunt",
          title: "Le calcul impossible",
          context: "Le client paie 200 F de frais en plus. Le programme ne donne pas 700 pour un prix de 500 : il devient rouge, TypeError.",
          description: "Une seule ligne est fausse — clique dessus.",
          bug_index: 0,
          fix: 'prix = int(input("Le prix ? "))',
          explanation: "input rend du texte. Ajouter 200 à du texte est impossible : il faut convertir avec int avant de calculer.",
          instructions: [
            'prix = input("Le prix ? ")',
            "total = prix + 200",
            'print("A payer :", total)',
          ],
        },
      },
      {
        type: "blockly_challenge",
        content: {
          game_type: "bug_hunt",
          title: "La boîte qui n'existe pas",
          context: "Le programme demande bien le prénom, puis devient rouge : NameError.",
          description: "Une seule ligne est fausse — clique dessus.",
          bug_index: 1,
          fix: 'print("Bonjour " + prenom)',
          explanation: "Une lettre de travers, et ce n'est plus la même boîte : Python ne connaît aucune boîte nommée prenon.",
          instructions: [
            'prenom = input("Ton prenom ? ")',
            'print("Bonjour " + prenon)',
            'print("A bientot !")',
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le calculateur raconté",
    description: "Quatre lignes. Raconte ce que chacune fabrique.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un calculateur d'âge, en quatre lignes. Il marche.</p>" +
            '<pre><code>1  annee = input("Ton annee de naissance ? ")\n' +
            "2  annee = int(annee)\n" +
            "3  age = 2026 - annee\n" +
            '4  print("Tu as", age, "ans.")</code></pre>' +
            "<p>Ne le modifie pas. Raconte-le : six phrases à compléter.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le calculateur",
          sentences: [
            { id: "s1", before: "Après la ligne 1, la boîte annee contient", after: ".",
              options: ["du texte", "un nombre", "rien"], correct: 0,
              explanation: "input rend toujours du texte, même quand on tape 2014." },
            { id: "s2", before: "La ligne 2 sert à", after: ".",
              options: ["transformer ce texte en nombre", "demander l'année", "afficher l'année"], correct: 0,
              explanation: "int prend le texte « 2014 » et en fait le nombre 2014." },
            { id: "s3", before: "Sans la ligne 2, la ligne 3", after: ".",
              options: ["devient rouge : TypeError", "affiche 0", "marche quand même"], correct: 0,
              explanation: "On ne peut pas soustraire du texte à un nombre. C'est le calcul impossible." },
            { id: "s4", before: "Après la ligne 2, l'ancien contenu de annee est", after: ".",
              options: ["perdu", "gardé à côté", "recopié dans age"], correct: 0,
              explanation: "Une boîte ne garde qu'une chose : ranger du neuf efface l'ancien." },
            { id: "s5", before: "Si on écrivait anne à la ligne 3, le rouge dirait", after: ".",
              options: ["NameError", "TypeError", "rien du tout"], correct: 0,
              explanation: "Une boîte nommée anne n'existe pas : Python ne la connaît pas." },
            { id: "s6", before: "Pour quelqu'un né en 2014, la ligne 4 affiche", after: ".",
              options: ["Tu as 12 ans.", "Tu as 2014 ans.", "Tu as annee ans."], correct: 0,
              explanation: "2026 - 2014 fait 12, et c'est le contenu de age qui s'affiche, pas son nom." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Ta fiche d'identité",
    description: "Trois lignes, deux questions, un calcul.",
    blocs: [
      kodi("<p>Un programme qui te connaît : il demande ton prénom et ton année de naissance, puis il parle de toi.</p><p>Souviens-toi : ce que rend <code>input</code> est du texte. Pour calculer, il faut convertir.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Demande le prenom, puis l'annee de naissance. Affiche ensuite trois lignes :\n" +
            "Bonjour <prenom> !\n" +
            "Tu as <age> ans.   (nous sommes en 2026)\n" +
            "Dans 10 ans tu auras <age + 10> ans.",
          starter_code: 'prenom = input("Ton prenom ? ")\n\n# A toi : l\'annee, la conversion, et les trois lignes\n',
          hidden_tests:
            'assert code.count("input(") >= 2, "Il faut deux questions : le prenom et l annee."\n' +
            'assert "int(" in code, "Sans int, tu ne peux pas calculer un age."\n' +
            // Chercher le prenom dans toute la sortie le trouvait dans l'echo de
            // la question posee : un programme qui ne saluait personne passait.
            'lignes_code = [l for l in code.split("\\n") if "print(" in l]\n' +
            'assert any("prenom" in l for l in lignes_code), "Un de tes print doit utiliser prenom : ton programme ne salue personne."\n' +
            'affiche = "\\n".join(l for l in output.split("\\n") if "?" not in l)\n' +
            'assert "12" in affiche, "Pour quelqu un ne en 2014, l age est 12. Ton programme ne l affiche pas."\n' +
            'assert "22" in affiche, "Dans 10 ans, cette personne aura 22 ans."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le panier du marché",
    description: "Trois prix, un total. Et un piège de conversion.",
    blocs: [
      kodi("<p>Au marché, trois articles. Ton programme demande leur prix un par un, puis annonce le total.</p><p>Trois boîtes, trois conversions, une addition. Prends ton temps sur les conversions : c'est là que tout se joue.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Demande le prix de trois articles, un par un. Affiche ensuite le total, avec le mot Total dans ta phrase.",
          starter_code: '# Trois questions, trois conversions, une addition.\n',
          hidden_tests:
            'import re\n' +
            'assert code.count("input(") >= 3, "Il faut demander trois prix, un par un."\n' +
            'assert code.count("int(") >= 3, "Chaque prix doit etre converti avant d etre additionne."\n' +
            'assert "Total" in output or "total" in output, "Ta phrase doit contenir le mot Total."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "2000" in nombres, "500 + 1200 + 300 font 2000. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "Ta fiche d'identité": {
    reponses: ["Ama", "2014"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'prenom = input("Ton prenom ? ")\nannee = int(input("Ton annee ? "))\nage = 2026 - annee\nprint("Bonjour " + prenom + " !")\nprint("Tu as", age, "ans.")\nprint("Dans 10 ans tu auras", age + 10, "ans.")\n' },
      { nom: "sans conversion", attendu: "test raté", code:
        'prenom = input("Ton prenom ? ")\nannee = input("Ton annee ? ")\nprint("Bonjour " + prenom + " !")\n' },
      { nom: "oublie les 10 ans", attendu: "test raté", code:
        'prenom = input("Ton prenom ? ")\nannee = int(input("Ton annee ? "))\nprint("Bonjour " + prenom + " !")\nprint("Tu as", 2026 - annee, "ans.")\n' },
      { nom: "ne salue pas", attendu: "test raté", code:
        'prenom = input("Ton prenom ? ")\nannee = int(input("Ton annee ? "))\nage = 2026 - annee\nprint("Tu as", age, "ans.")\nprint("Dans 10 ans tu auras", age + 10, "ans.")\n' },
    ],
  },
  "Le panier du marché": {
    reponses: ["500", "1200", "300"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'a = int(input("Prix 1 ? "))\nb = int(input("Prix 2 ? "))\nc = int(input("Prix 3 ? "))\nprint("Total :", a + b + c, "F")\n' },
      { nom: "sans conversion", attendu: "test raté", code:
        'a = input("Prix 1 ? ")\nb = input("Prix 2 ? ")\nc = input("Prix 3 ? ")\nprint("Total :", a + b + c)\n' },
      { nom: "deux prix seulement", attendu: "test raté", code:
        'a = int(input("Prix 1 ? "))\nb = int(input("Prix 2 ? "))\nprint("Total :", a + b)\n' },
      { nom: "sans le mot Total", attendu: "test raté", code:
        'a = int(input("Prix 1 ? "))\nb = int(input("Prix 2 ? "))\nc = int(input("Prix 3 ? "))\nprint(a + b + c)\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bif\b/, /\bfor\b/, /\bwhile\b/, /\bdef\b/, /\belse\s*:/, /\brange\(/, /\bstr\(/, /\.append/, /(?<!=)==(?!=)/, /\[\s*0\s*\]/],
  comptes: { "Python voit quoi ?": 12, "Chaque geste et son effet": 7, "Le calculateur raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: ECRIRE, refaire: process.argv.includes("--refaire") });
