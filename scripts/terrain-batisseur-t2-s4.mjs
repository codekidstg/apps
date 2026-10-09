/**
 * Le Terrain — Bâtisseur, thème 2 séance 4 « Se souvenir — les fichiers ».
 *
 *     node scripts/terrain-batisseur-t2-s4.mjs [--ecrire] [--refaire] [--banc]
 *
 *   1  Après cette ligne, le cahier contient…  l'effet exact de chaque geste
 *   1  « w » ou « r » ?                        choisir le mode selon l'intention
 *   2  Le programme raconté                    dérouler une journée complète
 *   2  Trois cahiers perdus                    trois façons de tout effacer
 *   2  Le symptôme et sa cause                 lire une panne de fichier
 *   3  Le journal de la semaine                relire, ajouter, sauver
 *   3  Le compteur qui se souvient             un nombre qui traverse la nuit
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Se souvenir — les fichiers";

const HIER = ["Ama 14", "Kofi 11", "Yawa 16"];
const cahier = (depart) => ({ decor: "cahier", reglages: depart ? { cahier_depart: depart } : {}, plafond: 200 });
if (HIER.length > 4) throw new Error("le cahier dessiné ne montre que 4 lignes");

const EXOS = [
  {
    palier: 1,
    title: "Après cette ligne, le cahier contient…",
    description: "Douze gestes. Le cahier contenait trois notes avant chacun d'eux.",
    blocs: [
      kodi(
        "<p>Avant chaque ligne, le cahier contient les trois notes d'hier : <code>Ama 14</code>, <code>Kofi 11</code>, <code>Yawa 16</code>.</p>" +
        "<p>Range chaque geste sous ce que le cahier contient <strong>juste après</strong>.</p>"
      ),
      {
        type: "drag_to_bin",
        content: {
          title: "Et après, il contient quoi ?",
          instruction: "Le cahier contenait 3 notes. Après ce geste ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Ouvrir en « w » vide le cahier, immédiatement, même sans écrire.",
              "Ouvrir en « r » ne touche à rien.",
              "write() ne pose rien tant qu'on n'a pas fermé.",
              "Lire ne change jamais le cahier.",
            ],
          },
          bins: [
            { id: "trois", label: "Les 3 notes", emoji: "📓", color: "#10b981" },
            { id: "vide", label: "Rien du tout", emoji: "🗒️", color: "#ef4444" },
            { id: "une", label: "Une seule note", emoji: "📄", color: "#FDB813" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: 'f = open("carnet.txt", "r")', correct: "trois", hint: "Lire ne touche à rien." },
            { id: "b", emoji: "2️⃣", label: 'f = open("carnet.txt", "w")', correct: "vide", hint: "Le piège de la séance : le « w » vide avant même d'écrire." },
            { id: "c", emoji: "3️⃣", label: 'open("carnet.txt", "w") puis close(), sans écrire', correct: "vide", hint: "On a vidé, et on n'a rien remis. Le cahier existe, mais il est blanc." },
            { id: "d", emoji: "4️⃣", label: "contenu = f.read() sur un cahier ouvert en « r »", correct: "trois", hint: "Lire, c'est regarder : ça ne change rien." },
            { id: "e", emoji: "5️⃣", label: 'open("w"), write("Essi 13"), close()', correct: "une", hint: "Vidé, puis une seule note écrite." },
            { id: "f", emoji: "6️⃣", label: 'open("w"), write("Essi 13") — sans close()', correct: "vide", hint: "Vidé à l'ouverture, et la note n'est jamais arrivée sur le papier." },
            { id: "g", emoji: "7️⃣", label: "f.close() sur un cahier ouvert en « r »", correct: "trois", hint: "Refermer après avoir lu ne change rien." },
            { id: "h", emoji: "8️⃣", label: "Un programme qui ne touche pas au fichier", correct: "trois", hint: "Ce qu'on ne touche pas ne bouge pas." },
            { id: "i", emoji: "9️⃣", label: 'open("w"), write les 3 notes, close()', correct: "trois", hint: "Vidé puis réécrit à l'identique : on retombe sur ses pieds." },
            { id: "j", emoji: "🔟", label: 'open("w") trois fois de suite, une note à chaque fois', correct: "une", hint: "Chaque ouverture en « w » efface la précédente. Seule la dernière survit." },
            { id: "k", emoji: "🅰️", label: "lignes = contenu.split(\"\\n\")", correct: "trois", hint: "Découper une variable ne touche pas au fichier." },
            { id: "l", emoji: "🅱️", label: "notes.append(\"Essi 13\") sur la liste relue", correct: "trois", hint: "La liste grandit en mémoire. Le cahier, lui, attend qu'on le sauve." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "« w » ou « r » ?",
    description: "Dix intentions. Chacune appelle un mode d'ouverture, et un seul.",
    blocs: [
      kodi("<p>Deux lettres, deux intentions. <code>\"w\"</code> comme <em>write</em> : j'ai quelque chose à garder, et j'accepte d'effacer ce qu'il y avait. <code>\"r\"</code> comme <em>read</em> : je viens juste regarder.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Tu ouvres avec quoi ?",
          instruction: "Pour faire ça, tu ouvres le cahier en…",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Je viens CHERCHER quelque chose → « r ».",
              "Je viens DÉPOSER quelque chose, et j'accepte de remplacer → « w ».",
              "Dans le doute au démarrage d'un programme : « r ». Toujours.",
            ],
          },
          categories: [
            { id: "r", label: 'Mode "r"', emoji: "👀", color: "#a78bfa" },
            { id: "w", label: 'Mode "w"', emoji: "✍️", color: "#FDB813" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Afficher les notes d'hier au démarrage", correct: "r", hint: "On vient chercher, pas déposer." },
            { id: "b", emoji: "2️⃣", label: "Sauver la liste complète à la fin du programme", correct: "w", hint: "On dépose, et on accepte de remplacer l'ancienne version." },
            { id: "c", emoji: "3️⃣", label: "Compter combien de notes sont déjà enregistrées", correct: "r", hint: "Compter, c'est regarder." },
            { id: "d", emoji: "4️⃣", label: "Écrire la toute première note du tout premier jour", correct: "w", hint: "Il n'y a rien à effacer, et « w » crée le fichier au passage." },
            { id: "e", emoji: "5️⃣", label: "Vérifier qu'une note est bien dans le cahier", correct: "r", hint: "Vérifier n'est pas modifier." },
            { id: "f", emoji: "6️⃣", label: "Remplacer tout le contenu par une nouvelle liste", correct: "w", hint: "Remplacer : c'est exactement ce que « w » fait." },
            { id: "g", emoji: "7️⃣", label: "Relire avant d'ajouter la note du jour", correct: "r", hint: "D'abord relire. Le « w » viendra après, quand on aura tout." },
            { id: "h", emoji: "8️⃣", label: "Afficher le cahier à un parent qui regarde par-dessus l'épaule", correct: "r", hint: "Montrer, c'est lire." },
            { id: "i", emoji: "9️⃣", label: "Effacer volontairement tout le cahier", correct: "w", hint: "Ouvrir en « w » et refermer suffit à tout vider. C'est le seul cas où c'est voulu." },
            { id: "j", emoji: "🔟", label: "Savoir si le cahier existe, sans rien y changer", correct: "r", hint: "Et s'il n'existe pas, c'est le filet FileNotFoundError qui répond." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur une journée complète : relire, ajouter, sauver.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Le cahier contient trois notes d'hier. Voici la journée entière, en sept lignes.</p>" +
            "<pre><code>1  f = open(\"carnet.txt\", \"r\")\n" +
            "2  contenu = f.read()\n" +
            "3  f.close()\n" +
            "4  notes = contenu.split(\"\\n\")\n" +
            "5  notes.append(\"Essi 13\")\n" +
            "6  g = open(\"carnet.txt\", \"w\")\n" +
            "7  for n in notes:\n" +
            "8      g.write(n + \"\\n\")\n" +
            "9  g.close()</code></pre>" +
            "<p>Ne le modifie pas. Suis-le ligne par ligne.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule la journée",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Après la ligne 3, le cahier contient", after: ".",
              options: ["toujours les 3 notes", "rien", "4 notes"], correct: 0,
              explanation: "On a seulement lu. Le « r » ne touche à rien." },
            { id: "s2", before: "Après la ligne 5, la liste notes contient", after: "éléments.",
              options: ["4", "3", "1"], correct: 0,
              explanation: "Les trois relues, plus celle du jour. En mémoire, pour l'instant." },
            { id: "s3", before: "Juste après la ligne 6, le cahier contient", after: ".",
              options: ["rien du tout", "les 3 notes", "les 4 notes"], correct: 0,
              explanation: "Le « w » a vidé. Et c'est sans danger ICI, parce qu'on a déjà tout en mémoire." },
            { id: "s4", before: "Si le programme s'arrêtait brutalement entre la ligne 6 et la ligne 9, on aurait perdu", after: ".",
              options: ["tout", "une note", "rien"], correct: 0,
              explanation: "C'est le court moment de danger : le cahier est vide et rien n'est encore réécrit." },
            { id: "s5", before: "À la fin, le cahier contient", after: "lignes.",
              options: ["4", "3", "5"], correct: 0,
              explanation: "Les trois d'hier et celle d'aujourd'hui, chacune sur sa ligne." },
            { id: "s6", before: "Si on déplaçait la ligne 6 tout en haut du programme, on perdrait", after: ".",
              options: ["les 3 notes d'hier", "rien", "la note du jour"], correct: 0,
              explanation: "Le piège du thème : vider avant d'avoir lu. L'ordre n'est pas négociable." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Trois cahiers perdus",
    description: "Trois programmes. Les trois effacent quelque chose sans le vouloir.",
    blocs: [
      kodi("<p>Perdre un fichier ne fait aucun bruit. Pas d'erreur rouge, pas de message : juste des pages blanches, le lendemain.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui vide avant de lire",
        context: "Hier, trois notes. Ce matin, le programme affiche « 0 note » et le cahier est blanc.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 0,
        fix: 'f = open("carnet.txt", "r")',
        explanation: "Le « w » a arraché les pages avant la lecture. Au démarrage, on ouvre toujours en « r ».",
        instructions: [
          'f = open("carnet.txt", "w")',
          "contenu = f.read()",
          "f.close()",
          'print("Notes :", len(contenu))',
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui rouvre à chaque tour",
        context: "Le programme sauve trois notes. Le cahier n'en contient qu'une : la dernière.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: 'f = open("carnet.txt", "w")',
        explanation: "Ouvrir en « w » à l'intérieur de la boucle vide le cahier à chaque tour. On ouvre UNE fois, avant la boucle, et on ferme après.",
        instructions: [
          "for n in notes:",
          '    f = open("carnet.txt", "w")',
          '    f.write(n + "\\n")',
          "    f.close()",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui oublie de refermer",
        context: "Le programme écrit les trois notes, annonce que c'est fait, et le cahier reste vide.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "f.close()",
        explanation: "Tant que le cahier n'est pas refermé, ce qu'on y a écrit n'arrive pas sur le papier. La ligne qui annonce est là ; celle qui garde manque.",
        instructions: [
          'f = open("carnet.txt", "w")',
          "for n in notes:",
          '    f.write(n + "\\n")',
          'print("C\'est garde !")',
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le symptôme et sa cause",
    description: "Sept pannes de fichier. Pour chacune, la ligne qui l'a provoquée.",
    blocs: [
      kodi("<p>Un programmeur ne devine pas : <strong>il lit le symptôme et il remonte à la cause</strong>. Celles-ci reviennent dès qu'un programme garde quelque chose.</p>"),
      {
        type: "match",
        content: {
          title: "Le symptôme et sa cause",
          instruction: "Touche un symptôme, puis la cause qui va avec.",
          left_label: "Ce que tu vois",
          right_label: "Ce qui s'est passé",
          pairs: [
            { left: "Le cahier est vide alors qu'on a écrit dedans", right: "On ne l'a jamais refermé" },
            { left: "Il ne reste que la dernière note", right: "On rouvre en « w » à chaque tour de boucle" },
            { left: "Les notes d'hier ont disparu au démarrage", right: "On a ouvert en « w » avant d'avoir lu" },
            { left: "Le programme meurt le tout premier jour", right: "Il manque le filet FileNotFoundError" },
            { left: "Tout est écrit sur une seule ligne", right: "Il manque les \\n à la fin de chaque note" },
            { left: "Python refuse de lire le fichier", right: "Il a été ouvert en « w », pas en « r »" },
            { left: "Une ligne vide apparaît à la fin de la liste", right: "Le dernier \\n laisse un morceau vide après le découpage" },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📓 Le journal de la semaine",
    description: "Relire, ajouter deux notes, sauver. Sans rien perdre.",
    blocs: [
      kodi(
        "<p>Le geste complet d'une journée, celui que le jalon te demandera : <strong>relire au matin, travailler, sauver le soir</strong>.</p>" +
        "<p>Le cahier contient trois notes. Tu en ajoutes deux. Il doit en contenir cinq.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Le cahier contient déjà <code>Ama 14</code>, <code>Kofi 11</code>, <code>Yawa 16</code>. Aujourd'hui, deux élèves de plus : <code>Essi 13</code> et <code>Kodjo 15</code>.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — relire le cahier, ajouter les deux notes du jour, tout sauver, et annoncer le total.<br>" +
            "🧰 <strong>Tu as</strong> — les deux recettes, <code>.split()</code>, <code>.append()</code>.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le cahier contient les 5 notes, et qu'aucune d'hier n'a disparu.</p>" +
            "<p>⚠️ Relis <strong>avant</strong> d'ouvrir en <code>\"w\"</code>.</p>",
          scene: cahier(HIER),
          starter_code:
            'du_jour = ["Essi 13", "Kodjo 15"]\n\n' +
            "# Relis, ajoute les deux, sauve tout, annonce le total.\n",
          hidden_tests:
            "import re\n" +
            'assert ".split(" in code, "Relire rend un seul texte : il faut le redecouper."\n' +
            'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
            'garde = _vrai_open("carnet.txt").read()\n' +
            'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
            'for n in ["Ama", "Kofi", "Yawa"]:\n' +
            '    assert n in garde, "Tu as perdu " + n + " : relis AVANT d ouvrir en w."\n' +
            'for n in ["Essi", "Kodjo"]:\n' +
            '    assert n in garde, "La note " + n + " n a pas ete sauvee."\n' +
            'assert len(lignes) == 5, "Le cahier doit contenir 5 lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "5" in nombres, "Ton programme doit annoncer le total : 5 notes."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📓 Le compteur qui se souvient",
    description: "Un seul nombre, mais il doit traverser la nuit.",
    blocs: [
      kodi(
        "<p>Pas de liste cette fois : <strong>un seul nombre</strong>. Le nombre de fois qu'on a lancé le programme.</p>" +
        "<p>Il est dans le cahier, il vaut <code>7</code>. À la fin de ce lancement, il doit valoir 8 — et 9 au suivant.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Le cahier contient un seul nombre : <code>7</code>. C'est le nombre de lancements précédents.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — relire ce nombre, l'augmenter de 1, l'afficher, et le sauver pour la prochaine fois.<br>" +
            "🧰 <strong>Tu as</strong> — les deux recettes, <code>int()</code> pour transformer le texte en nombre, et <code>str()</code> pour le retransformer en texte avant de l'écrire.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le programme affiche 8, et que le cahier contient 8.</p>" +
            "<p>💡 Un fichier ne contient que du texte. Un nombre doit être converti dans les deux sens.</p>",
          scene: cahier(["7"]),
          starter_code:
            "# Relis le nombre, ajoute 1, affiche-le, et sauve-le.\n",
          hidden_tests:
            "import re\n" +
            'assert "int(" in code, "Le cahier rend du texte : int() en fait un nombre."\n' +
            'assert "str(" in code, "On n ecrit que du texte dans un cahier : str() reconvertit le nombre."\n' +
            'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
            'garde = _vrai_open("carnet.txt").read().strip()\n' +
            'assert garde == "8", "Le cahier doit contenir 8. Il contient : " + repr(garde)\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "8" in nombres, "Ton programme doit afficher 8."',
        },
      },
    ],
  },
];

const PRELUDE = (depart) =>
  "import os, tempfile\n" +
  "os.chdir(tempfile.mkdtemp())\n" +
  "_vrai_open = open\n" +
  (depart ? `_f = _vrai_open("carnet.txt", "w")\n_f.write(${JSON.stringify(depart.join("\n") + "\n")})\n_f.close()\n` : "");

const LIRE =
  'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
  'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n';

const SOLUTIONS = {
  "📓 Le journal de la semaine": { prelude: PRELUDE(HIER), cas: [
    { nom: "juste", attendu: "ok", code:
      'du_jour = ["Essi 13", "Kodjo 15"]\n' + LIRE +
      "for n in du_jour:\n    notes.append(n)\n" +
      'g = open("carnet.txt", "w")\nfor n in notes:\n    g.write(n + "\\n")\ng.close()\n' +
      'print("Total :", len(notes))\n' },
    { nom: "sauve avant de relire", attendu: "test raté", code:
      'du_jour = ["Essi 13", "Kodjo 15"]\n' +
      'g = open("carnet.txt", "w")\nfor n in du_jour:\n    g.write(n + "\\n")\ng.close()\n' +
      'print("Total :", 2)\n' },
  ] },
  "📓 Le compteur qui se souvient": { prelude: PRELUDE(["7"]), cas: [
    { nom: "juste", attendu: "ok", code:
      'f = open("carnet.txt", "r")\nnombre = int(f.read())\nf.close()\n' +
      'nombre = nombre + 1\nprint("Lancements :", nombre)\n' +
      'g = open("carnet.txt", "w")\ng.write(str(nombre))\ng.close()\n' },
    { nom: "oublie de sauver", attendu: "test raté", code:
      'f = open("carnet.txt", "r")\nnombre = int(f.read())\nf.close()\n' +
      'nombre = nombre + 1\nprint("Lancements :", nombre)\n' },
    { nom: "ecrit le nombre sans str", attendu: "plante", code:
      'f = open("carnet.txt", "r")\nnombre = int(f.read())\nf.close()\n' +
      'nombre = nombre + 1\nprint("Lancements :", nombre)\n' +
      'g = open("carnet.txt", "w")\ng.write(nombre)\ng.close()\n' },
  ] },
};

verifier(EXOS, {
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\bwith\b/, /\.upper\(/, /\bfinally\b/, /\braise\b/, /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Après cette ligne, le cahier contient…": 12, "« w » ou « r » ?": 10,
             "Le programme raconté": 6, "Le symptôme et sa cause": 7 },
});
for (const e of EXOS) for (const b of e.blocs) {
  const c = b.content ?? {};
  if (/except:/.test(JSON.stringify({ ...c, hidden_tests: undefined }))) throw new Error(`${e.title} : except sans nom`);
  if (b.type !== "code_challenge") continue;
  for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
    if (!c.instructions.includes(champ)) throw new Error(`${e.title} : le sujet n'a pas de « ${champ} »`);
}
(process.argv.includes("--banc") ? console.error : console.log)("✓ cahiers de départ déclarés sur les deux défis du palier 3");

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
