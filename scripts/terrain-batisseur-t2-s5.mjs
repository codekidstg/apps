/**
 * Le Terrain — Bâtisseur, thème 2, « 🏆 Jalon 2 ».
 *
 *     node scripts/terrain-batisseur-t2-s5.mjs [--ecrire] [--refaire] [--banc]
 *
 * Un jalon n'a pas d'entraînements de parcours — c'est la règle de la maison,
 * et le Jalon 1 la suivait déjà. Seulement de la salle de jeu, en libre
 * service, pour s'échauffer avant ou se rattraper après.
 *
 * Ces sept-là ne font rien de neuf : ils rejouent les QUATRE séances du thème
 * ensemble, ce qu'aucun exercice de séance ne pouvait faire.
 *
 *   1  De quelle semaine vient cette ligne ?  remettre le thème en ordre
 *   1  Ce carnet est-il prêt ?                lire la grille sur du code
 *   2  Le programme raconté                   dérouler le carnet entier
 *   2  Trois jalons qui trébuchent            les trois pièges du thème réunis
 *   2  Le symptôme et sa cause                quatre semaines de pannes
 *   3  Le carnet du mentor                    relire, nettoyer, ajouter, sauver
 *   3  Le record de la classe                 relire des nombres, comparer, garder
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 Jalon 2 — Carnet de notes qui sauvegarde";

const HIER = ["Ama 14", "Kofi 11", "Yawa 16"];
const NOTES = ["14", "11", "16", "13"];
const RECORD = Math.max(...NOTES.map(Number));
if (RECORD !== 16) throw new Error(`record ${RECORD}, attendu 16`);
// Le record ne doit pas être la dernière note : sinon un programme qui garde
// simplement la dernière valeur passerait pour juste.
if (String(RECORD) === NOTES[NOTES.length - 1]) throw new Error("le record est la dernière note — un programme faux passerait");
const cahier = (depart) => ({ decor: "cahier", reglages: depart ? { cahier_depart: depart } : {}, plafond: 200 });

const EXOS = [
  {
    palier: 1,
    title: "De quelle semaine vient cette ligne ?",
    description: "Douze lignes, quatre semaines. Le thème entier, remis en ordre.",
    blocs: [
      kodi(
        "<p>Quatre semaines, quatre outils : la boucle qui attend, les textes qu'on nettoie, le filet qui rattrape, le cahier qui garde.</p>" +
        "<p>Le jalon les demande tous les quatre. Vérifie que tu sais encore lequel fait quoi.</p>"
      ),
      {
        type: "drag_to_bin",
        content: {
          title: "Quelle semaine ?",
          instruction: "Cette ligne vient de quelle séance du thème ?",
          helper: {
            title: "Les quatre semaines",
            criteria: [
              "Semaine 1 — la boucle qui attend : while, et la question posée à chaque tour.",
              "Semaine 2 — les textes : .lower(), .strip(), .replace().",
              "Semaine 3 — le filet : try, except, refuser.",
              "Semaine 4 — le cahier : open, write, read, close, split.",
            ],
          },
          bins: [
            { id: "boucle", label: "La boucle", emoji: "⏳", color: "#FDB813" },
            { id: "textes", label: "Les textes", emoji: "🧽", color: "#10b981" },
            { id: "filet", label: "Le filet", emoji: "🪂", color: "#a78bfa" },
            { id: "cahier", label: "Le cahier", emoji: "📓", color: "#60a5fa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: 'while reponse != "fin":', correct: "boucle", hint: "Tant que ce n'est pas le mot de sortie." },
            { id: "b", emoji: "2️⃣", label: "mot = mot.strip()", correct: "textes", hint: "Les espaces aux deux bouts." },
            { id: "c", emoji: "3️⃣", label: "except ValueError:", correct: "filet", hint: "Le nom de l'erreur qu'on attend." },
            { id: "d", emoji: "4️⃣", label: 'f = open("carnet.txt", "w")', correct: "cahier", hint: "Ouvrir pour écrire." },
            { id: "e", emoji: "5️⃣", label: "reponse = input(...)   (la deuxième fois)", correct: "boucle", hint: "La question reposée à chaque tour : c'est ce qui fait avancer." },
            { id: "f", emoji: "6️⃣", label: 'papier.replace(" ", "")', correct: "textes", hint: "Ce qui gêne au milieu." },
            { id: "g", emoji: "7️⃣", label: "try:", correct: "filet", hint: "Essaie — et si ça casse…" },
            { id: "h", emoji: "8️⃣", label: 'contenu.split("\\n")', correct: "cahier", hint: "Redécouper ce que read() a rendu d'un bloc." },
            { id: "i", emoji: "9️⃣", label: "f.close()", correct: "cahier", hint: "Sans lui, rien n'arrive sur le papier." },
            { id: "j", emoji: "🔟", label: "mot = mot.lower()", correct: "textes", hint: "Les majuscules mises à plat." },
            { id: "k", emoji: "🅰️", label: "refuser(papier)", correct: "filet", hint: "Ce qu'on fait du cas raté." },
            { id: "l", emoji: "🅱️", label: "litres = litres + tirer()", correct: "boucle", hint: "La ligne qui fait avancer. Sans elle, ça ne finit jamais." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Ce carnet est-il prêt ?",
    description: "Dix carnets presque finis. Lequel passerait le jalon ?",
    blocs: [
      kodi(
        "<p>La grille du jalon tient en une phrase : <strong>ferme-le, rouvre-le, tout est encore là</strong>.</p>" +
        "<p>Pour chacun de ces carnets, dis s'il passe — ou ce qui lui manque encore.</p>"
      ),
      {
        type: "swipe_sort",
        content: {
          title: "Il passe le jalon ?",
          instruction: "Ce carnet, tel qu'il est écrit, passerait-il ?",
          helper: {
            title: "Les cinq critères, en raccourci",
            criteria: [
              "Il relit au démarrage, et il survit au premier jour.",
              "Il accepte des notes jusqu'à « fin », et les range propres.",
              "Il sauve tout avant de se terminer.",
              "Ferme, rouvre : rien n'a bougé.",
            ],
          },
          categories: [
            { id: "passe", label: "Il passe", emoji: "✅", color: "#10b981" },
            { id: "rate", label: "Il rate", emoji: "❌", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Il relit, ajoute, sauve, et survit au premier jour", correct: "passe", hint: "Les quatre critères y sont." },
            { id: "b", emoji: "2️⃣", label: "Il ajoute et sauve, mais ne relit jamais au démarrage", correct: "rate", hint: "Le lendemain, il écrase hier." },
            { id: "c", emoji: "3️⃣", label: "Il relit et ajoute, mais ne sauve pas", correct: "rate", hint: "Tout s'évapore à la fermeture." },
            { id: "d", emoji: "4️⃣", label: "Il fait tout, mais ouvre en « w » avant de lire", correct: "rate", hint: "Le piège du thème : il vide avant de regarder." },
            { id: "e", emoji: "5️⃣", label: "Il fait tout, mais oublie f.close()", correct: "rate", hint: "Le cahier reste blanc, et personne ne s'en rend compte le jour même." },
            { id: "f", emoji: "6️⃣", label: "Il fait tout, mais meurt le tout premier jour", correct: "rate", hint: "Il manque le filet FileNotFoundError." },
            { id: "g", emoji: "7️⃣", label: "Il fait tout, et range les notes avec .strip()", correct: "passe", hint: "Et en plus il nettoie : c'est le sixième critère." },
            { id: "h", emoji: "8️⃣", label: "Il fait tout, mais compte « fin » comme une note", correct: "rate", hint: "« fin » n'est pas un élève." },
            { id: "i", emoji: "9️⃣", label: "Il fait tout, mais écrit les notes sans \\n", correct: "rate", hint: "Tout se retrouve sur une seule ligne : au relire, il n'y a plus qu'une note." },
            { id: "j", emoji: "🔟", label: "Il fait tout, et affiche le total à la fin", correct: "passe", hint: "Afficher le total n'est pas exigé, mais ça ne casse rien." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur le carnet entier, celui que le jalon demande.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Le cahier contient deux notes. Le programme tourne, et on tape « Essi 13 » puis « fin ».</p>" +
            "<pre><code> 1  try:\n" +
            " 2      f = open(\"carnet.txt\", \"r\")\n" +
            " 3      contenu = f.read()\n" +
            " 4      f.close()\n" +
            " 5  except FileNotFoundError:\n" +
            " 6      contenu = \"\"\n" +
            " 7  notes = []\n" +
            " 8  for l in contenu.split(\"\\n\"):\n" +
            " 9      if l != \"\":\n" +
            "10          notes.append(l)\n" +
            "11  reponse = input(\"Note : \")\n" +
            "12  while reponse != \"fin\":\n" +
            "13      notes.append(reponse.strip())\n" +
            "14      reponse = input(\"Note : \")\n" +
            "15  g = open(\"carnet.txt\", \"w\")\n" +
            "16  for n in notes:\n" +
            "17      g.write(n + \"\\n\")\n" +
            "18  g.close()</code></pre>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule le carnet",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Après la ligne 10, notes contient", after: "éléments.",
              options: ["2", "0", "3"], correct: 0,
              explanation: "Les deux notes relues du cahier, et rien d'autre pour l'instant." },
            { id: "s2", before: "La ligne 9 sert à", after: ".",
              options: ["jeter la ligne vide laissée par le dernier \\n", "compter les notes", "nettoyer les espaces"], correct: 0,
              explanation: "Le dernier retour à la ligne laisse un morceau vide après le découpage. Sans ce si, il entrerait dans la liste." },
            { id: "s3", before: "La ligne 13 tourne", after: "fois.",
              options: ["1", "2", "0"], correct: 0,
              explanation: "Une seule note est tapée avant « fin »." },
            { id: "s4", before: "Juste après la ligne 15, le cahier contient", after: ".",
              options: ["rien", "2 notes", "3 notes"], correct: 0,
              explanation: "Le « w » vient de le vider. Sans danger : les trois notes sont en mémoire, dans notes." },
            { id: "s5", before: "À la fin, le cahier contient", after: "lignes.",
              options: ["3", "2", "1"], correct: 0,
              explanation: "Les deux d'hier et celle d'aujourd'hui." },
            { id: "s6", before: "Si la ligne 5 était « except ValueError », le programme", after: " le premier jour.",
              options: ["mourrait", "marcherait pareil", "créerait le cahier"], correct: 0,
              explanation: "Le filet attendrait la mauvaise erreur. Un fichier absent lève FileNotFoundError, pas ValueError." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Trois jalons qui trébuchent",
    description: "Trois carnets presque bons. Chacun rate sur un seul détail.",
    blocs: [
      kodi("<p>Aucun de ces trois ne plante. Tous les trois perdent quelque chose, et c'est bien le problème : <strong>un carnet qui ment ne fait aucun bruit</strong>.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui range « fin » dans le cahier",
        context: "Le carnet marche, il sauve tout. Et chaque soir, une ligne « fin » de plus s'ajoute au cahier.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: '    reponse = input("Note : ")',
        explanation: "La note est ajoutée AVANT que la question ne soit reposée, donc « fin » entre dans la liste avant que la boucle ne s'arrête. On repose la question en dernier, toujours.",
        instructions: [
          'while reponse != "fin":',
          "    notes.append(reponse)",
          '    reponse = input("Note : ")',
          "    notes.append(reponse)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui garde la ligne vide",
        context: "Chaque jour, le cahier gagne une ligne vide de plus. Au bout d'une semaine, il y en a sept.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: '    if l != "":',
        explanation: "Le dernier \\n du cahier laisse un morceau vide après le découpage. Sans le si, il est rangé comme une note — et réécrit, et redécoupé, chaque jour.",
        instructions: [
          "notes = []",
          'for l in contenu.split("\\n"):',
          "    if l == l:",
          "        notes.append(l)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui sauve une note sur deux",
        context: "On tape quatre notes. Le cahier n'en contient que la dernière.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: 'g = open("carnet.txt", "w")',
        explanation: "L'ouverture en « w » est à l'intérieur de la boucle : elle vide le cahier à chaque tour. On ouvre une fois, avant la boucle.",
        instructions: [
          "for n in notes:",
          '    g = open("carnet.txt", "w")',
          '    g.write(n + "\\n")',
          "    g.close()",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le symptôme et sa cause",
    description: "Sept pannes, quatre semaines. Pour chacune, la ligne qui l'a provoquée.",
    blocs: [
      kodi("<p>Les sept pannes que le jalon peut te réserver. Elles viennent toutes des quatre semaines du thème — aucune n'est nouvelle.</p>"),
      {
        type: "match",
        content: {
          title: "Le symptôme et sa cause",
          instruction: "Touche un symptôme, puis la cause qui va avec.",
          left_label: "Ce que tu vois",
          right_label: "Ce qui s'est passé",
          pairs: [
            { left: "Le programme redemande sans fin", right: "La question n'est pas reposée dans la boucle" },
            { left: "Une note « FIN » est rangée dans le cahier", right: "On compare sans avoir mis le mot en minuscules" },
            { left: "Le programme meurt le tout premier jour", right: "Il manque le filet FileNotFoundError" },
            { left: "Les notes d'hier ont disparu", right: "On a ouvert en « w » avant d'avoir lu" },
            { left: "Le cahier est resté blanc", right: "On a oublié f.close()" },
            { left: "Tout est sur une seule ligne", right: "Il manque les \\n à la fin de chaque note" },
            { left: "Une note porte des espaces en trop", right: "On l'a rangée sans .strip()" },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📓 Le carnet du mentor",
    description: "Le jalon en entier, mais avec des notes tapées n'importe comment.",
    blocs: [
      kodi(
        "<p>Le même carnet que le jalon, et un mentor pressé qui tape de travers : <code>  Essi 13  </code> avec des espaces partout.</p>" +
        "<p>Les quatre semaines sont demandées en même temps : la boucle, le nettoyage, le filet, le cahier.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Le cahier contient trois notes. On en ajoute deux, tapées avec des espaces autour.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — relire le cahier (même s'il n'existe pas), accepter des notes jusqu'à <code>fin</code> en les rangeant propres, tout sauver, et annoncer le total.<br>" +
            "🧰 <strong>Tu as</strong> — les quatre semaines du thème, et rien de neuf.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le cahier contient 5 notes sans espaces parasites, et qu'aucune d'hier n'a disparu.</p>",
          scene: cahier(HIER),
          starter_code:
            "# Relis, accepte des notes propres jusqu'a fin, sauve tout, annonce le total.\n",
          hidden_tests:
            "import re\n" +
            'assert "try" in code and "FileNotFoundError" in code, "Le premier jour, le cahier n existe pas."\n' +
            'assert ".strip(" in code, "Les notes arrivent avec des espaces autour."\n' +
            'assert ".split(" in code, "Relire rend un seul texte."\n' +
            'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
            'garde = _vrai_open("carnet.txt").read()\n' +
            'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
            'assert "  Essi" not in garde, "La note est rangee avec ses espaces : nettoie-la avant."\n' +
            'for n in ["Ama", "Kofi", "Yawa", "Essi", "Kodjo"]:\n' +
            '    assert n in garde, "Il manque " + n + " dans le cahier."\n' +
            'assert len(lignes) == 5, "Le cahier doit contenir 5 lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "5" in nombres, "Ton programme doit annoncer le total : 5 notes."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📓 Le record de la classe",
    description: "Relire des nombres, trouver le meilleur, et le garder.",
    blocs: [
      kodi(
        "<p>Cette fois le cahier ne contient que des notes, une par ligne : <code>14</code>, <code>11</code>, <code>16</code>, <code>13</code>.</p>" +
        "<p>Le mentor veut connaître la meilleure, et qu'elle reste écrite quelque part.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Le cahier contient quatre nombres, un par ligne.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — relire les notes, trouver la meilleure, l'afficher, puis l'ajouter au cahier sur une ligne de plus.<br>" +
            "🧰 <strong>Tu as</strong> — les deux recettes, <code>.split()</code>, <code>int()</code>, <code>str()</code>, et un <code>si</code> pour comparer.<br>" +
            `✅ <strong>C'est réussi quand</strong> — le programme affiche ${RECORD}, et que le cahier contient les ${NOTES.length} notes <strong>plus</strong> le record.</p>` +
            "<p>💡 La meilleure n'est pas la dernière : il faut vraiment comparer.</p>",
          scene: cahier(NOTES),
          starter_code:
            "# Relis les notes, trouve la meilleure, affiche-la,\n" +
            "# puis ajoute-la au cahier sur une ligne de plus.\n",
          hidden_tests:
            "import re\n" +
            'assert "if" in code, "Trouver la meilleure demande une comparaison."\n' +
            'assert "int(" in code and "str(" in code, "Un cahier ne contient que du texte : il faut convertir dans les deux sens."\n' +
            'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
            'garde = _vrai_open("carnet.txt").read()\n' +
            'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
            `assert len(lignes) == ${NOTES.length + 1}, "Le cahier doit contenir ${NOTES.length} notes plus le record, soit ${NOTES.length + 1} lignes. Il en a " + str(len(lignes)) + "."\n` +
            `assert lignes[-1].strip().endswith("${RECORD}"), "La derniere ligne doit porter le record, ${RECORD}. Elle dit : " + repr(lignes[-1])\n` +
            'nombres = re.findall(r"\\d+", output)\n' +
            `assert "${RECORD}" in nombres, "Ton programme doit afficher ${RECORD}."`,
        },
      },
    ],
  },
];

const PRELUDE = (depart) =>
  "import os, tempfile\n" +
  "os.chdir(tempfile.mkdtemp())\n" +
  "_vrai_open = open\n" +
  `_f = _vrai_open("carnet.txt", "w")\n_f.write(${JSON.stringify(depart.join("\n") + "\n")})\n_f.close()\n`;

const LIRE =
  "try:\n" +
  '    f = open("carnet.txt", "r")\n    contenu = f.read()\n    f.close()\n' +
  "except FileNotFoundError:\n" +
  '    contenu = ""\n' +
  'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n';

const SOLUTIONS = {
  "📓 Le carnet du mentor": {
    prelude: PRELUDE(HIER),
    reponses: ["  Essi 13  ", "Kodjo 15 ", "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        LIRE +
        'reponse = input("Note : ")\n' +
        'while reponse != "fin":\n    notes.append(reponse.strip())\n    reponse = input("Note : ")\n' +
        'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.close()\n' +
        'print("Total :", len(notes))\n' },
      { nom: "oublie de nettoyer", attendu: "test raté", code:
        LIRE +
        'reponse = input("Note : ")\n' +
        'while reponse != "fin":\n    notes.append(reponse)\n    reponse = input("Note : ")\n' +
        'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.close()\n' +
        'print("Total :", len(notes))\n' },
    ],
  },
  "📓 Le record de la classe": {
    prelude: PRELUDE(NOTES),
    cas: [
      { nom: "juste", attendu: "ok", code:
        'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
        'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n' +
        "record = 0\nfor n in notes:\n    if int(n) > record:\n        record = int(n)\n" +
        'print("Record :", record)\n' +
        'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.write(str(record) + "\\n")\ng.close()\n' },
      // Garde la dernière au lieu de la meilleure : 13 au lieu de 16.
      { nom: "garde la derniere note", attendu: "test raté", code:
        'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
        'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n' +
        "record = 0\nfor n in notes:\n    if int(n) > 0:\n        record = int(n)\n" +
        'print("Record :", record)\n' +
        'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.write(str(record) + "\\n")\ng.close()\n' },
      { nom: "oublie d ajouter le record au cahier", attendu: "test raté", code:
        'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
        'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n' +
        "record = 0\nfor n in notes:\n    if int(n) > record:\n        record = int(n)\n" +
        'print("Record :", record)\n' +
        'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.close()\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\bwith\b/, /\.upper\(/, /\bfinally\b/, /\braise\b/, /\.items\(/, /enumerate\(/],
  comptes: { "De quelle semaine vient cette ligne ?": 12, "Ce carnet est-il prêt ?": 10,
             "Le programme raconté": 6, "Le symptôme et sa cause": 7 },
});
for (const e of EXOS) for (const b of e.blocs) {
  const c = b.content ?? {};
  if (/except:/.test(JSON.stringify({ ...c, hidden_tests: undefined }))) throw new Error(`${e.title} : except sans nom`);
  if (b.type !== "code_challenge") continue;
  for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
    if (!c.instructions.includes(champ)) throw new Error(`${e.title} : le sujet n'a pas de « ${champ} »`);
}
(process.argv.includes("--banc") ? console.error : console.log)(
  `✓ record vérifié : ${RECORD}, et ce n'est pas la dernière note`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
