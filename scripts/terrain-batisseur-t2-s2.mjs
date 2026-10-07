/**
 * Le Terrain — Bâtisseur, thème 2 séance 2 « Les textes qui travaillent ».
 *
 *     node scripts/terrain-batisseur-t2-s2.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : .lower() pour la casse, .strip() pour les
 * bords, .replace() pour le milieu — et qu'aucun des trois ne change le texte,
 * ils en rendent un neuf.
 *
 * Sept exercices, et chacun ouvre une porte que les six autres laissent fermée.
 * Le deuxième est le plus important de tout le lot : il casse la croyance que
 * .strip() sauve int(). Python tolère déjà les espaces AUTOUR d'un nombre —
 * c'est l'espace du milieu qui tue. Tant qu'un enfant ne l'a pas vu de ses
 * yeux, il nettoie au hasard.
 *
 *   1  Le texte après l'outil     ce que chaque commande rend, exactement
 *   1  Ça passe, ou ça meurt      quand int() vit et quand il meurt
 *   2  Le programme raconté       dérouler un nettoyage ligne par ligne
 *   2  Trois nettoyages inutiles  trois façons de croire qu'on a nettoyé
 *   2  Le symptôme et sa cause    lire une panne de texte et remonter à sa ligne
 *   3  La caisse de la semaine    cinq papiers, trois saletés, à l'étal
 *   3  La fiche du client         nettoyer un mot ET un nombre dans le même programme
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les textes qui travaillent";

// ── Garde-fous arithmétiques ─────────────────────────────────────────────
const SEMAINE = ["5000", "2 500", "1750F", "3.250", "900"];
const propre = (p) => p.replace(/[ F.]/g, "");
const TOTAL = SEMAINE.reduce((a, p) => a + Number(propre(p)), 0);
if (TOTAL !== 13400) throw new Error(`total ${TOTAL}, attendu 13400`);
for (const p of SEMAINE) if (!/^\d+$/.test(propre(p))) throw new Error(`« ${p} » ne se nettoie pas`);
// Le décor ne sait empiler que cinq billets : au-delà, l'enfant encaisserait
// sans que la pile bouge.
if (SEMAINE.length > 5) throw new Error(`${SEMAINE.length} papiers, le décor n'en montre que 5`);

const EXOS = [
  {
    palier: 1,
    title: "Le texte après l'outil",
    description: "Douze lignes. Range chacune sous ce qu'elle rend vraiment.",
    blocs: [
      kodi(
        "<p>Chaque outil rend un texte — pas toujours celui qu'on croit.</p>" +
        "<p><code>.strip()</code> ne touche pas aux majuscules. <code>.replace()</code> qui ne trouve rien ne change rien. Range chaque ligne sous son résultat exact.</p>"
      ),
      {
        type: "drag_to_bin",
        content: {
          title: "Qu'est-ce que ça rend ?",
          instruction: "Le résultat exact de chaque ligne.",
          helper: {
            title: "Comment décider ?",
            criteria: [
              ".lower() ne touche qu'aux majuscules.",
              ".strip() ne touche qu'aux espaces du début et de la fin.",
              ".replace(a, b) ne touche qu'à ce qu'il trouve — s'il ne trouve rien, rien ne change.",
            ],
          },
          bins: [
            { id: "fin", label: '"fin"', emoji: "🔡", color: "#FDB813" },
            { id: "FIN", label: '"FIN"', emoji: "🔠", color: "#a78bfa" },
            { id: "n1500", label: '"1500"', emoji: "💰", color: "#10b981" },
            { id: "rien", label: "Rien ne change", emoji: "🪨", color: "#64748b" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: '"FIN".lower()', correct: "fin", hint: "Les majuscules tombent." },
            { id: "b", emoji: "2️⃣", label: '" fin ".strip()', correct: "fin", hint: "Les deux espaces sautent." },
            { id: "c", emoji: "3️⃣", label: '"Fin".lower()', correct: "fin", hint: "Une seule majuscule, mais elle compte." },
            { id: "d", emoji: "4️⃣", label: '" FIN ".strip()', correct: "FIN", hint: "Les espaces partent, les majuscules restent : strip ne les voit pas." },
            { id: "e", emoji: "5️⃣", label: '"FIN".strip()', correct: "FIN", hint: "Aucun espace à enlever : le texte ressort tel quel." },
            { id: "f", emoji: "6️⃣", label: '"fin".replace("f", "F")', correct: "FIN", hint: "Attention : chaque f devient F, y compris celui du milieu… il n'y en a qu'un." },
            { id: "g", emoji: "7️⃣", label: '"1 500".replace(" ", "")', correct: "n1500", hint: "L'espace du milieu disparaît, les morceaux se recollent." },
            { id: "h", emoji: "8️⃣", label: '"1500F".replace("F", "")', correct: "n1500", hint: "Le F collé s'en va." },
            { id: "i", emoji: "9️⃣", label: '"1.500".replace(".", "")', correct: "n1500", hint: "Le point des milliers s'en va." },
            { id: "j", emoji: "🔟", label: '"1500".strip()', correct: "n1500", hint: "Rien à enlever aux bords : le nombre ressort entier." },
            { id: "k", emoji: "🅰️", label: '"1 500".replace("F", "")', correct: "rien", hint: "Il cherche un F… et il n'y en a pas. L'espace, lui, est toujours là." },
            { id: "l", emoji: "🅱️", label: '"fin".lower()', correct: "rien", hint: "C'est déjà tout en petites lettres : la ligne ne change rien." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Ça passe, ou ça meurt ?",
    description: "Douze conversions. L'une d'elles va te surprendre.",
    blocs: [
      kodi(
        "<p><code>int()</code> transforme un texte en nombre — quand il peut.</p>" +
        "<p>Mais il est plus tolérant qu'on ne le croit sur certaines choses, et impitoyable sur d'autres. <strong>Devine avant de regarder l'indice.</strong></p>"
      ),
      {
        type: "swipe_sort",
        content: {
          title: "int() survit-il ?",
          instruction: "Cette ligne passe, ou elle tue le programme ?",
          helper: {
            title: "La règle, une fois pour toutes",
            criteria: [
              "int() TOLÈRE les espaces au début et à la fin : int(\" 2000 \") vaut 2000.",
              "int() MEURT sur un espace au milieu : int(\"2 000\") est impossible.",
              "Il meurt aussi sur une lettre, un point, un tiret, ou un texte vide.",
              "C'est pour ça que .strip() ne sauve pas int() — mais .replace() si.",
            ],
          },
          categories: [
            { id: "ok", label: "Ça passe", emoji: "✅", color: "#10b981" },
            { id: "ko", label: "Ça meurt", emoji: "💥", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: 'int("2000")', correct: "ok", hint: "Des chiffres collés : le cas facile." },
            { id: "b", emoji: "2️⃣", label: 'int("  2000  ")', correct: "ok", hint: "La surprise : les espaces AUTOUR sont tolérés. int() les ignore tout seul." },
            { id: "c", emoji: "3️⃣", label: 'int("2 000")', correct: "ko", hint: "L'espace est AU MILIEU. Celui-là tue." },
            { id: "d", emoji: "4️⃣", label: 'int("2000F")', correct: "ko", hint: "Une lettre collée au nombre : impossible." },
            { id: "e", emoji: "5️⃣", label: 'int("2.000")', correct: "ko", hint: "Le point des milliers n'est pas un chiffre." },
            { id: "f", emoji: "6️⃣", label: 'int("deux mille")', correct: "ko", hint: "Aucun nettoyage ne sauvera celui-là. Retiens-le." },
            { id: "g", emoji: "7️⃣", label: 'int("")', correct: "ko", hint: "Un papier vide ne contient aucun nombre." },
            { id: "h", emoji: "8️⃣", label: 'int("0")', correct: "ok", hint: "Zéro est un nombre comme un autre." },
            { id: "i", emoji: "9️⃣", label: 'int("2 000".replace(" ", ""))', correct: "ok", hint: "On a enlevé l'espace du milieu avant : int() est content." },
            { id: "j", emoji: "🔟", label: 'int("2 000".strip())', correct: "ko", hint: "strip n'a rien trouvé aux bords. L'espace du milieu est toujours là." },
            { id: "k", emoji: "🅰️", label: 'int("2-000")', correct: "ko", hint: "Un tiret au milieu, même punition." },
            { id: "l", emoji: "🅱️", label: 'int("900 ")', correct: "ok", hint: "Un espace à la fin seulement : toléré." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur un nettoyage de six lignes.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de six lignes. Il marche.</p>" +
            '<pre><code>1  papier = "  1 500 F  "\n' +
            "2  papier = papier.strip()\n" +
            '3  papier = papier.replace(" ", "")\n' +
            '4  papier.replace("F", "")\n' +
            "5  montant = int(papier)\n" +
            "6  print(montant)</code></pre>" +
            "<p>Ne le modifie pas. Déroule-le, ligne par ligne — et regarde bien la ligne 4.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule le nettoyage",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Après la ligne 2, papier vaut", after: ".",
              options: ['"1 500 F"', '"1500F"', '"  1 500 F  "'], correct: 0,
              explanation: "strip enlève les espaces des deux bouts, et seulement ceux-là." },
            { id: "s2", before: "Après la ligne 3, papier vaut", after: ".",
              options: ['"1500F"', '"1 500F"', '"1500 F"'], correct: 0,
              explanation: "Tous les espaces du milieu disparaissent d'un coup : replace les remplace tous." },
            { id: "s3", before: "Après la ligne 4, papier vaut", after: ".",
              options: ['"1500F" — rien n\'a changé', '"1500"', '"1500 "'], correct: 0,
              explanation: "La ligne calcule bien « 1500 »… et jette le résultat. Il manque « papier = » devant." },
            { id: "s4", before: "À la ligne 5, int() reçoit", after: ".",
              options: ['"1500F"', '"1500"', "1500"], correct: 0,
              explanation: "Et c'est exactement le problème : il reçoit encore le F." },
            { id: "s5", before: "Donc la ligne 5", after: ".",
              options: ["fait mourir le programme", "marche très bien", "affiche 1500"], correct: 0,
              explanation: "Une lettre collée au nombre : int() s'arrête net. La ligne 6 ne sera jamais atteinte." },
            { id: "s6", before: "Pour réparer, il faut écrire la ligne 4", after: ".",
              options: ['papier = papier.replace("F", "")', 'papier.replace("F", "") = papier', "int(papier)"], correct: 0,
              explanation: "Ranger la réponse, c'est tout ce qui manquait. Trois caractères." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Trois nettoyages qui ne servent à rien",
    description: "Trois programmes, trois façons différentes de croire qu'on a nettoyé.",
    blocs: [
      kodi(
        "<p>Les erreurs de texte les plus coûteuses ne font pas de rouge tout de suite. Le programme a l'air de nettoyer, et il ne nettoie rien.</p>" +
        "<p>En voici trois, et tu les feras toutes les trois un jour.</p>"
      ),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui remplace un espace par un espace",
        context: "Le papier dit « 1 500 ». Le programme devient rouge, alors qu'il nettoie bien quelque chose.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: '    papier = papier.replace(" ", "")',
        explanation: "Il remplace chaque espace… par un espace. Le texte ressort identique. Le deuxième argument doit être VIDE, entre deux guillemets collés.",
        instructions: [
          'papier = "1 500"',
          '    papier = papier.replace(" ", " ")',
          "    print(int(papier))",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui convertit l'original",
        context: "Le nettoyage est parfait, rangé dans « propre ». Et pourtant le programme meurt.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    print(int(propre))",
        explanation: "On a bien fabriqué un texte propre… puis on a converti l'ancien. Le texte nettoyé est resté dans son coin, inutilisé.",
        instructions: [
          'papier = "1 500"',
          '    propre = papier.replace(" ", "")',
          "    print(int(papier))",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui prend le mauvais outil",
        context: "Le papier dit « 1 500 ». Le programme nettoie, range le résultat, et meurt quand même.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: '    papier = papier.replace(" ", "")',
        explanation: "strip ne regarde que les deux bouts du texte. L'espace est au milieu : il ne le voit même pas. C'est replace qu'il fallait.",
        instructions: [
          'papier = "1 500"',
          "    papier = papier.strip()",
          "    print(int(papier))",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le symptôme et sa cause",
    description: "Sept pannes de texte. Pour chacune, la ligne qui l'a provoquée.",
    blocs: [
      kodi(
        "<p>Un programmeur ne devine pas : <strong>il lit le symptôme et il remonte à la cause</strong>.</p>" +
        "<p>Ces sept-là reviennent sans cesse dès qu'un humain tape quelque chose.</p>"
      ),
      {
        type: "match",
        content: {
          title: "Le symptôme et sa cause",
          instruction: "Touche un symptôme, puis la cause qui va avec.",
          left_label: "Ce que tu vois",
          right_label: "Ce qui s'est passé",
          pairs: [
            { left: "La boutique ne ferme pas sur « FIN »", right: "Le mot n'a pas été mis en petites lettres" },
            { left: "Elle ne ferme pas sur « fin » avec un espace", right: "Les bords n'ont pas été enlevés" },
            { left: "int() meurt sur « 1 500 »", right: "L'espace du milieu est resté" },
            { left: "Le nettoyage n'a servi à rien", right: "Le résultat n'a pas été rangé" },
            { left: "Un seul papier fait planter le total", right: "On a converti l'original au lieu du propre" },
            { left: "« 2000 » == 2000 répond non", right: "Un texte et un nombre ne sont jamais égaux" },
            { left: "Le programme refuse absolument tout le monde", right: "On compare à un mot écrit en majuscules" },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "🏪 La caisse de la semaine",
    description: "Cinq papiers, trois saletés, et un total qui doit tomber juste.",
    blocs: [
      kodi(
        "<p>Toute la semaine est sur le comptoir : cinq papiers, écrits par cinq personnes différentes.</p>" +
        "<p>Un espace, un <code>F</code>, un point. Et deux papiers propres, pour voir si ton nettoyage ne les abîme pas.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Les cinq papiers de la semaine : <code>5000</code>, <code>2 500</code>, <code>1750F</code>, <code>3.250</code>, <code>900</code>.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — encaisser les cinq, et annoncer le total de la semaine.<br>" +
            "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, <code>encaisser(papier)</code>, et <code>.replace()</code>.<br>" +
            `✅ <strong>C'est réussi quand</strong> — les cinq clients sont servis et que la caisse affiche ${TOTAL}.</p>` +
            "<p>💡 Un nettoyage qui ne trouve rien ne casse rien : tu peux l'appliquer à tous les papiers, même aux propres.</p>",
          scene: { decor: "etal", reglages: { papiers: SEMAINE }, plafond: 200 },
          starter_code:
            "total = 0\n\n" +
            "# Cinq papiers, trois saletes possibles. Nettoie, additionne, encaisse.\n",
          hidden_tests:
            'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
            'assert code.count(".replace(") >= 3, "Trois saletes differentes demandent trois nettoyages."\n' +
            `assert len(encaisses) == ${SEMAINE.length}, "Les ${SEMAINE.length} papiers doivent etre encaisses. Ton programme en a servi " + str(len(encaisses)) + "."\n` +
            `assert "${TOTAL}" in output, "Le total de la semaine fait ${TOTAL} F."`,
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La fiche du client",
    description: "Un nom et un âge, tapés de travers tous les deux.",
    blocs: [
      kodi(
        "<p>À l'inscription, le client donne son nom puis son âge. Il tape vite, et les deux arrivent sales — mais pas de la même façon.</p>" +
        "<p>Un nom se nettoie comme un mot. Un âge se nettoie comme un nombre. <strong>Deux saletés, deux outils.</strong></p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Le client tape son nom, puis son âge. Le nom arrive en majuscules avec des espaces ; l'âge arrive avec un espace au milieu.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — afficher une ligne propre : le nom en petites lettres, puis l'âge comme un nombre, puis le mot <code>ans</code>.<br>" +
            "🧰 <strong>Tu as</strong> — <code>.strip()</code>, <code>.lower()</code>, <code>.replace()</code> et <code>int()</code>.<br>" +
            "✅ <strong>C'est réussi quand</strong> — la dernière ligne contient le nom propre, l'âge en nombre, et le mot ans.</p>" +
            "<p>⚠️ L'âge doit être un vrai nombre, pas un texte : il faudra pouvoir l'additionner un jour.</p>",
          starter_code:
            'nom = input("Ton nom : ")\n' +
            'age = input("Ton age : ")\n\n' +
            "# Le nom se nettoie comme un mot, l'age comme un nombre.\n",
          hidden_tests:
            'assert ".lower(" in code, "Le nom arrive en majuscules."\n' +
            'assert ".strip(" in code, "Le nom arrive avec des espaces autour."\n' +
            'assert ".replace(" in code, "L age a un espace au milieu : seul replace l enleve."\n' +
            'assert "int(" in code, "L age doit devenir un vrai nombre."\n' +
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'derniere = lignes[-1]\n' +
            'assert "ama" in derniere, "Le nom propre est ama, tout en petites lettres."\n' +
            'assert "AMA" not in derniere, "Il reste des majuscules dans le nom."\n' +
            'assert "12" in derniere, "L age nettoye vaut 12."\n' +
            'assert "ans" in derniere, "La ligne doit se terminer par le mot ans."',
        },
      },
    ],
  },
];

const PRELUDE_ETAL =
  "_journal = []\n" +
  "papiers = " + JSON.stringify(SEMAINE) + "\n" +
  "def encaisser(papier):\n" +
  '    _journal.append({"quoi": "encaisser", "papier": str(papier)})\n' +
  "def refuser(papier):\n" +
  '    _journal.append({"quoi": "refuser", "papier": str(papier)})\n';

const SOLUTIONS = {
  "🏪 La caisse de la semaine": {
    prelude: PRELUDE_ETAL,
    cas: [
      { nom: "juste", attendu: "ok", code:
        "total = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    p = p.replace("F", "")\n    p = p.replace(".", "")\n' +
        "    total = total + int(p)\n    encaisser(papier)\n" +
        'print("Total :", total)\n' },
      { nom: "oublie le point", attendu: "plante", code:
        "total = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    p = p.replace("F", "")\n' +
        "    total = total + int(p)\n    encaisser(papier)\n" +
        'print("Total :", total)\n' },
      { nom: "nettoie mais convertit l original", attendu: "plante", code:
        "total = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    p = p.replace("F", "")\n    p = p.replace(".", "")\n' +
        "    total = total + int(papier)\n    encaisser(papier)\n" +
        'print("Total :", total)\n' },
    ],
  },
  "La fiche du client": {
    reponses: ["  AMA  ", "1 2"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'nom = input("Ton nom : ")\nage = input("Ton age : ")\n' +
        "nom = nom.strip()\nnom = nom.lower()\n" +
        'age = age.replace(" ", "")\nage = int(age)\n' +
        'print(nom, age, "ans")\n' },
      { nom: "oublie de nettoyer l age", attendu: "plante", code:
        'nom = input("Ton nom : ")\nage = input("Ton age : ")\n' +
        "nom = nom.strip()\nnom = nom.lower()\nage = int(age)\n" +
        'print(nom, age, "ans")\n' },
      { nom: "laisse les majuscules du nom", attendu: "test raté", code:
        'nom = input("Ton nom : ")\nage = input("Ton age : ")\n' +
        "nom = nom.strip()\n" +
        'age = age.replace(" ", "")\nage = int(age)\n' +
        'print(nom, age, "ans")\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\.split\(/, /\.join\(/, /\.upper\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
    /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Le texte après l'outil": 12, "Ça passe, ou ça meurt ?": 12,
             "Le programme raconté": 6, "Le symptôme et sa cause": 7 },
});
for (const e of EXOS) for (const b of e.blocs) {
  if (b.type !== "code_challenge") continue;
  for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
    if (!b.content.instructions.includes(champ)) throw new Error(`${e.title} : le sujet n'a pas de « ${champ} »`);
}
(process.argv.includes("--banc") ? console.error : console.log)(`✓ total de la semaine vérifié : ${TOTAL} F · tous les papiers se nettoient`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
