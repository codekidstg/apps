/**
 * Le Terrain — Bâtisseur, thème 1 séance 3 « Fonctions qui répondent ».
 *
 *     node scripts/terrain-batisseur-t1-s3.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : `return` au lieu de `print`, le `None` que rend
 * une fonction qui n'a pas de return, la réutilisation du résultat dans un
 * calcul ou une condition, et le découpage en fonctions qui se passent des
 * valeurs.
 *
 * Pas encore vu, donc interdit : les dictionnaires, `while`, `elif`,
 * l'indexation par position.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Fonctions qui répondent";

// Garde-fou arithmétique : la moyenne annoncée doit être vraie.
const NOTES = [12, 15, 9, 16];
const SOMME = NOTES.reduce((a, b) => a + b, 0);
const MOYENNE = SOMME / NOTES.length;
if (SOMME !== 52 || MOYENNE !== 13) throw new Error(`notes : somme ${SOMME}, moyenne ${MOYENNE}`);

const EXOS = [
  {
    palier: 1,
    title: "Elle rend, ou elle affiche ?",
    description: "Douze fonctions. Une seule différence, et elle change tout.",
    blocs: [
      kodi("<p><strong>Afficher</strong>, c'est envoyer à l'écran : toi tu le vois, ton programme n'en garde rien.</p><p><strong>Rendre</strong>, c'est donner la valeur à celui qui appelle : elle reste dans le programme, et tu peux t'en servir.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Rendre, ou afficher ?",
          instruction: "Après cette fonction, la valeur est-elle récupérable ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Un return : la valeur revient à celui qui appelle — on peut la ranger.",
              "Un print sans return : la valeur part à l'écran et disparaît.",
              "Sans return, l'appel vaut None, même si quelque chose s'est affiché.",
              "Une fonction peut faire les deux — mais c'est le return qui décide de ce qu'elle rend.",
            ],
          },
          categories: [
            { id: "rend",    label: "Elle rend",    emoji: "↩️", color: "#10b981" },
            { id: "affiche", label: "Elle affiche", emoji: "🖨️", color: "#f97316" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "def f(): return 7",                     correct: "rend",    hint: "return 7 : l'appel vaut 7, et rien ne s'affiche." },
            { id: "b", emoji: "2️⃣", label: "def f(): print(7)",                     correct: "affiche", hint: "7 part à l'écran. L'appel, lui, vaut None." },
            { id: "c", emoji: "3️⃣", label: "def double(n): return n * 2",           correct: "rend",    hint: "Le double revient à l'appelant : on peut le calculer." },
            { id: "d", emoji: "4️⃣", label: "def double(n): print(n * 2)",           correct: "affiche", hint: "On voit le double, mais on ne peut plus s'en servir." },
            { id: "e", emoji: "5️⃣", label: "def total(prix): return somme",         correct: "rend",    hint: "La somme revient : on peut la comparer, l'additionner, la ranger." },
            { id: "f", emoji: "6️⃣", label: "def salut(): print(\"Bonjour\")",        correct: "affiche", hint: "Elle parle, elle ne répond pas." },
            { id: "g", emoji: "7️⃣", label: "def plus_cher(a, b): return a",         correct: "rend",    hint: "Elle rend un des deux : le programme saura lequel." },
            { id: "h", emoji: "8️⃣", label: "def cadre(titre): print(titre)",        correct: "affiche", hint: "Un cadre s'affiche — il n'y a rien à récupérer." },
            { id: "i", emoji: "9️⃣", label: "def moyenne(n): return s / len(n)",     correct: "rend",    hint: "La moyenne revient, prête à être comparée." },
            { id: "j", emoji: "🔟", label: "def compte(l): print(len(l))",          correct: "affiche", hint: "Le piège : le nombre s'affiche, mais l'appel vaut None." },
            { id: "k", emoji: "🅰️", label: "def mur(): return mur_devant()",         correct: "rend",    hint: "Elle rend ce qu'une autre fonction lui a rendu." },
            { id: "l", emoji: "🅱️", label: "def bonjour(nom): print(\"Salut\", nom)", correct: "affiche", hint: "Elle salue à l'écran, et ne rend rien." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque écriture et ce qu'elle donne",
    description: "Sept lignes. Le None s'y cache deux fois.",
    blocs: [
      kodi("<p>Une fonction sans <code>return</code> rend quand même quelque chose : <strong>None</strong>, le mot de Python pour « rien ».</p><p>C'est le piège de la séance : elle a l'air de marcher, puisqu'elle affiche.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque écriture et ce qu'elle donne",
          instruction: "Touche une ligne, puis ce qu'elle produit.",
          left_label: "La ligne",
          right_label: "Ce qu'elle donne",
          pairs: [
            { left: "return somme",              right: "La valeur revient à celui qui appelle" },
            { left: "x = f()  (f affiche)",      right: "x vaut None" },
            { left: "x = f()  (f rend 7)",       right: "x vaut 7" },
            { left: "print(f() + 1)  (f rend 7)", right: "Affiche 8" },
            { left: "None + 500",                right: "💥 TypeError" },
            { left: "Un return dans une boucle", right: "Quitte la fonction dès le premier tour" },
            { left: "total(panier)  seul sur sa ligne", right: "La valeur rendue est perdue" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "Deux appels imbriqués. Chacun devient sa valeur.",
    blocs: [
      kodi("<p>Un appel ne « part » pas faire son travail ailleurs : il <strong>devient</strong> sa valeur, à l'endroit même où il est écrit.</p><p>Déroule la ligne, morceau par morceau.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Chaque appel devient ce qu'il rend.",
        contexte: ["def double(n):", "    return n * 2", "", "def ajoute(a, b):", "    return a + b"],
        ligne: "print(ajoute(double(6), 8))",
        etapes: [
          { expression: "double(6)", choix: ["12", "6", "None", "double"], valeur: "12",
            explication: "double(6) devient 12, ici, dans la ligne. Rien ne s'affiche au passage." },
          { expression: "ajoute(12, 8)", choix: ["20", "128", "None"], valeur: "20",
            explication: "Les deux valeurs en place, ajoute rend 20 — et c'est ça que print reçoit." },
        ],
        sortie: "20",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux fonctions qui répondent mal",
    description: "L'une se tait, l'autre part trop tôt.",
    blocs: [
      kodi("<p>Aucune des deux ne devient rouge d'elle-même. La première rend <code>None</code> sans le dire ; la seconde rend une valeur — mais la mauvaise.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui affiche au lieu de rendre",
        context: "Le programme affiche bien 25, puis il devient rouge sur la ligne suivante : TypeError avec NoneType.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: "    return n * n",
        explanation: "Elle affiche 25 au passage, mais elle ne rend rien : resultat vaut None, et None + 5 est impossible.",
        instructions: [
          "def carre(n):",
          "    print(n * n)",
          "resultat = carre(5)",
          "print(resultat + 5)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui part au premier tour",
        context: "Le panier contient 1500, 800 et 2300. La fonction devait rendre 4600. Elle rend 1500.",
        description: "Une seule ligne est mal placée — clique dessus.",
        bug_index: 4,
        fix: "(cette ligne devait être AU NIVEAU du for, pas dedans)",
        explanation: "Le return est dans la boucle : il quitte la fonction dès le premier tour, avec le premier prix. Sorti du décalage, il rend le cumul complet.",
        instructions: [
          "def total(prix):",
          "    somme = 0",
          "    for p in prix:",
          "        somme = somme + p",
          "        return somme",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur deux fonctions qui se passent une valeur.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de sept lignes. Il marche.</p>" +
            "<pre><code>1  def total(notes):\n" +
            "2      s = 0\n" +
            "3      for n in notes:\n" +
            "4          s = s + n\n" +
            "5      return s\n" +
            "6  def moyenne(notes):\n" +
            "7      return total(notes) / len(notes)</code></pre>" +
            "<p>On l'appelle avec <code>[12, 15, 9, 16]</code>. Raconte ce qui se passe.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le programme",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "total rend", after: ".",
              options: ["52", "13", "4"], correct: 0,
              explanation: "12 + 15 + 9 + 16 font 52. C'est le cumul complet, parce que le return est sorti de la boucle." },
            { id: "s2", before: "moyenne rend", after: ".",
              options: ["13", "52", "4"], correct: 0,
              explanation: "52 divisé par 4 notes : 13." },
            { id: "s3", before: "moyenne recalcule-t-elle la somme ?", after: "",
              options: ["non, elle la demande à total", "oui, elle refait la boucle", "elle ne peut pas"], correct: 0,
              explanation: "C'est tout l'intérêt de découper : une fonction demande à l'autre au lieu de refaire son travail." },
            { id: "s4", before: "Si on remplaçait la ligne 5 par print(s), moyenne rendrait", after: ".",
              options: ["une erreur : None / 4", "13", "52"], correct: 0,
              explanation: "Sans return, l'appel total(notes) vaut None — et None divisé par 4 devient rouge." },
            { id: "s5", before: "Si le return de la ligne 5 était décalé dans la boucle, total rendrait", after: ".",
              options: ["12", "52", "0"], correct: 0,
              explanation: "Il quitterait la fonction au premier tour, avec la première note." },
            { id: "s6", before: "Le programme n'affiche", after: "de lui-même.",
              options: ["rien", "52", "13"], correct: 0,
              explanation: "Ces deux fonctions rendent, elles n'affichent pas. Sans un print à l'appel, l'écran reste vide." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "🎹 Le refrain qui se passe de main en main",
    description: "Une fonction rend les notes, une autre les joue.",
    blocs: [
      kodi("<p>Jusqu'ici ta fonction <em>jouait</em>. Cette fois, elle <strong>rend</strong> la liste des notes — et c'est une autre partie du programme qui les joue.</p><p>L'avantage : la même liste peut servir deux fois, ou être rallongée d'un seul coup.</p>"),
      jeu({
        game_type: "python_piano",
        title: "Le refrain qui se passe de main en main",
        instructions:
          "Ecris couplet() et refrain() : chacune REND une liste de notes, elle ne joue rien. Ensuite, une boucle joue refrain, couplet, refrain. Dix-huit notes au minimum.",
        min_notes: 18,
        tempo: 380,
        starter_code:
          'def refrain():\n    return ["Sol", "Mi", "Do"]\n\nfor n in refrain():\n    jouer(n)\n\n# A toi : couplet() qui REND ses notes, puis la chanson complete.\n',
      }),
    ],
  },

  {
    palier: 3,
    title: "Le bulletin de la classe",
    description: "Trois fonctions, chacune sa question, chacune sa réponse.",
    blocs: [
      kodi("<p>Quatre notes : 12, 15, 9 et 16. Trois questions différentes, donc trois fonctions — et chacune <strong>rend</strong> sa réponse.</p><p>La troisième ne recalcule rien : elle demande aux deux premières.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris trois fonctions qui RENDENT leur resultat :\n" +
            "total(notes) — la somme\n" +
            "moyenne(notes) — la somme divisee par le nombre de notes\n" +
            "verdict(notes) — le mot Recu si la moyenne atteint 10, sinon Ajourne\n" +
            "verdict ne doit PAS refaire le calcul : elle appelle moyenne.\n" +
            "Affiche ensuite le total, la moyenne et le verdict.",
          starter_code: "notes = [12, 15, 9, 16]\n\n# Trois fonctions, trois return. Les affichages viennent apres.\n",
          hidden_tests:
            'import re\n' +
            'compact = code.replace(" ", "")\n' +
            'assert "deftotal(" in compact, "Ecris la fonction total."\n' +
            'assert "defmoyenne(" in compact, "Ecris la fonction moyenne."\n' +
            'assert "defverdict(" in compact, "Ecris la fonction verdict."\n' +
            'assert code.count("return") >= 4, "Les trois fonctions doivent rendre — et verdict a deux cas."\n' +
            // Couper apres « def verdict( » lisait aussi les print de la fin :
            // la mauvaise solution passait. On extrait le vrai corps, au decalage.
            'corps = ""\n' +
            'dedans = False\n' +
            'for l in code.split("\\n"):\n' +
            '    if l.strip().startswith("def verdict("):\n' +
            '        dedans = True\n' +
            '        continue\n' +
            '    if dedans:\n' +
            '        if l.strip() and not l.startswith(" ") and not l.startswith("\\t"):\n' +
            '            break\n' +
            '        corps = corps + l + "\\n"\n' +
            'assert "moyenne(" in corps, "verdict doit APPELER moyenne au lieu de refaire le calcul."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "52" in nombres, "12 + 15 + 9 + 16 font 52."\n' +
            'assert "13" in nombres, "La moyenne est 13."\n' +
            'assert "Recu" in output, "La moyenne atteint 10 : le verdict est Recu."',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "Le bulletin de la classe": { cas: [
    { nom: "juste", attendu: "ok", code:
      'notes = [12, 15, 9, 16]\n\ndef total(notes):\n    s = 0\n    for n in notes:\n        s = s + n\n    return s\n\ndef moyenne(notes):\n    return total(notes) / len(notes)\n\ndef verdict(notes):\n    if moyenne(notes) >= 10:\n        return "Recu"\n    else:\n        return "Ajourne"\n\nprint("Total :", total(notes))\nprint("Moyenne :", moyenne(notes))\nprint("Verdict :", verdict(notes))\n' },
    { nom: "verdict refait le calcul", attendu: "test raté", code:
      'notes = [12, 15, 9, 16]\n\ndef total(notes):\n    s = 0\n    for n in notes:\n        s = s + n\n    return s\n\ndef moyenne(notes):\n    return total(notes) / len(notes)\n\ndef verdict(notes):\n    s = 0\n    for n in notes:\n        s = s + n\n    if s / len(notes) >= 10:\n        return "Recu"\n    else:\n        return "Ajourne"\n\nprint("Total :", total(notes))\nprint("Moyenne :", moyenne(notes))\nprint("Verdict :", verdict(notes))\n' },
    { nom: "total affiche au lieu de rendre", attendu: "plante", code:
      'notes = [12, 15, 9, 16]\n\ndef total(notes):\n    s = 0\n    for n in notes:\n        s = s + n\n    print(s)\n\ndef moyenne(notes):\n    return total(notes) / len(notes)\n\ndef verdict(notes):\n    if moyenne(notes) >= 10:\n        return "Recu"\n    else:\n        return "Ajourne"\n\nprint("Total :", total(notes))\nprint("Moyenne :", moyenne(notes))\nprint("Verdict :", verdict(notes))\n' },
    { nom: "return dans la boucle", attendu: "test raté", code:
      'notes = [12, 15, 9, 16]\n\ndef total(notes):\n    s = 0\n    for n in notes:\n        s = s + n\n        return s\n\ndef moyenne(notes):\n    return total(notes) / len(notes)\n\ndef verdict(notes):\n    if moyenne(notes) >= 10:\n        return "Recu"\n    else:\n        return "Ajourne"\n\nprint("Total :", total(notes))\nprint("Moyenne :", moyenne(notes))\nprint("Verdict :", verdict(notes))\n' },
  ] },
};

verifier(EXOS, {
  interdits: [/\bwhile\b/, /\belif\b/, /\.get\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Elle rend, ou elle affiche ?": 12, "Chaque écriture et ce qu'elle donne": 7, "Le programme raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
