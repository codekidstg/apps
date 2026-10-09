/**
 * Bâtisseur — thème 2, séance 4 : « Se souvenir — les fichiers ».
 *
 *     node scripts/batisseur-t2-s4-se-souvenir.mjs [--ecrire] [--refaire] [--banc]
 *
 * La séance 3 s'est terminée sur une phrase : « ton carnet tient debout… et
 * puis tu fermes la fenêtre, et tout a disparu ». Celle-ci commence là.
 *
 * L'enfant écrit de VRAIS fichiers. Trois faits vérifiés dans le navigateur
 * avant d'écrire une ligne de cours, parce que tout en dépend :
 *
 *   1. open() marche dans le Python de l'application.
 *   2. Un fichier écrit survit d'une exécution à l'autre — relancer le
 *      programme, c'est rouvrir le carnet, et les données sont là.
 *   3. Sans close(), le fichier reste VIDE. Le piège n'est pas théorique.
 *
 * Deux recettes de trois lignes, pas six outils en vrac :
 *
 *   écrire : open(nom, "w") · write(texte) · close()
 *   relire : open(nom, "r") · read()       · close()
 *
 * Et `.split("\n")` arrive enfin — il était gardé pour ici depuis la séance 2,
 * parce que relire un cahier oblige à redécouper des lignes.
 *
 * Le piège central : "w" EFFACE avant d'écrire. Sauver au démarrage détruit
 * exactement ce qu'on voulait garder.
 *
 * Restent interdits : with, les f-strings, break, True/False, += et liste[0].
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Se souvenir — les fichiers";

// ── Garde-fous ───────────────────────────────────────────────────────────
const NOTES = ["Ama 14", "Kofi 11", "Yawa 16"];
if (NOTES.length > 4) throw new Error("le cahier dessiné ne montre que 4 lignes");
const CONTENU = NOTES.join("\n");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });
const cahier = () => ({ decor: "cahier", reglages: {}, plafond: 200 });

const BLOCS = [
  // ── 0. L'accroche : tout a disparu ─────────────────────────────────────
  texte(
    "<h3>Tu fermes la fenêtre, et tout a disparu</h3>" +
    "<p>Ton carnet de la semaine dernière tient debout. Il encaisse, il refuse, il compte, il ne meurt plus sur un papier illisible.</p>" +
    "<p>Et puis tu fermes le programme. <strong>La caisse, les ventes, les refus : évaporés.</strong> Demain matin, tu recommences à zéro, comme si la journée d'hier n'avait jamais eu lieu.</p>" +
    "<p>Tout ce que tu as rangé dans une variable vit le temps du programme, et pas une seconde de plus. Pour garder, il faut écrire — dans un <strong>fichier</strong>.</p>"
  ),

  // ── 1. Le geste : le cahier reste vide ─────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Ce programme ouvre un cahier, écrit une note dedans, et annonce fièrement que c'est fait. <strong>Pourtant le cahier est vide.</strong></p>" +
        "<p>🎯 <strong>Ta mission</strong> — faire que la note soit vraiment dans le cahier.<br>" +
        "🧰 <strong>Tu as</strong> — une ligne à ajouter : <code>f.close()</code>. Tant qu'un cahier reste ouvert, ce qu'on y écrit n'est pas encore posé sur le papier.<br>" +
        "✅ <strong>C'est réussi quand</strong> — la ligne apparaît dans le cahier, sur la table.</p>",
      scene: cahier(),
      starter_code:
        'f = open("carnet.txt", "w")\n' +
        'f.write("Ama 14")\n' +
        'print("Ecrit !")\n',
      hidden_tests:
        'assert ".close(" in code, "Un cahier qu on laisse ouvert ne garde rien : il faut le fermer."\n' +
        'garde = _vrai_open("carnet.txt").read()\n' +
        'assert garde == "Ama 14", "Le cahier devrait contenir Ama 14. Il contient : " + repr(garde)',
    },
  },

  // ── 2. L'explication, après le geste ───────────────────────────────────
  texte(
    "<h3>Deux recettes de trois lignes</h3>" +
    "<p>Un fichier, c'est un cahier posé sur la table. On l'ouvre, on s'en sert, on le referme. Toujours dans cet ordre, toujours trois lignes.</p>" +
    "<pre><code># ÉCRIRE\n" +
    'f = open("carnet.txt", "w")   ← w comme « write » : on va écrire\n' +
    'f.write("Ama 14")\n' +
    "f.close()                     ← sans ça, rien n'est posé sur le papier</code></pre>" +
    "<pre><code># RELIRE\n" +
    'f = open("carnet.txt", "r")   ← r comme « read » : on va lire\n' +
    "contenu = f.read()\n" +
    "f.close()</code></pre>" +
    "<p>Et la grande nouvelle : <strong>ce que tu écris reste là après la fin du programme.</strong> Relance-le demain, le cahier t'attend avec ce que tu y as mis.</p>"
  ),

  // ── 3. Les mots des deux recettes ──────────────────────────────────────
  jeu({
    game_type: "fill_blank",
    title: "Les deux recettes",
    template:
      "# pour écrire\n" +
      'f = open("carnet.txt", "[___]")\n' +
      'f.write("Ama 14")\n' +
      "f.[___]()\n" +
      "# pour relire\n" +
      'g = open("carnet.txt", "[___]")\n' +
      "contenu = g.[___]()",
    blanks: ["w", "close", "r", "read"],
  }),

  // ── 4. Vérification du mécanisme ───────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Où vit ce qu'on range dans une variable ?",
          choices: ["Dans un fichier, pour toujours", "Le temps du programme, et pas plus", "Dans la mémoire de l'ordinateur, même éteint"], answer: 1,
          explanation: "C'est pour ça qu'on écrit dans un fichier : une variable s'évapore quand le programme se termine." },
        { question: "Tu écris dans un cahier mais tu oublies f.close(). Que contient le fichier ?",
          choices: ["Rien du tout", "La note", "Un morceau de la note"], answer: 0,
          explanation: "Vérifié : sans close(), le fichier reste vide. Tant qu'il est ouvert, rien n'est posé sur le papier." },
        { question: 'À quoi sert le "r" dans open("carnet.txt", "r") ?',
          choices: ["À dire qu'on veut lire", "À dire qu'on veut écrire", "À ranger le fichier"], answer: 0,
          explanation: "r comme read, lire. w comme write, écrire. Deux lettres, deux intentions très différentes." },
        { question: "Tu relances ton programme demain. Le fichier écrit hier…",
          choices: ["a disparu avec le programme", "est toujours là, avec ce que tu y as mis"], answer: 1,
          explanation: "C'est toute la différence entre une variable et un fichier. L'un s'évapore, l'autre attend." },
      ],
    },
  },

  // ── 5. Il écrit tout ───────────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Trois élèves ont donné leur note : <code>Ama 14</code>, <code>Kofi 11</code>, <code>Yawa 16</code>. Il faut les garder pour demain.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — écrire les trois notes dans le cahier, une par ligne.<br>" +
        "🧰 <strong>Tu as</strong> — la recette d'écriture, et <code>\\n</code> à la fin d'une note pour passer à la ligne suivante.<br>" +
        "✅ <strong>C'est réussi quand</strong> — les trois lignes sont dans le cahier, et qu'il est refermé.</p>" +
        "<p>💡 Un seul <code>open</code> suffit pour les trois écritures : on ouvre, on écrit trois fois, on ferme.</p>",
      scene: cahier(),
      starter_code:
        'notes = ["Ama 14", "Kofi 11", "Yawa 16"]\n\n' +
        "# Ouvre le cahier, ecris les trois notes, referme-le.\n",
      hidden_tests:
        'assert ".close(" in code, "Le cahier doit etre referme, sinon rien n est garde."\n' +
        'garde = _vrai_open("carnet.txt").read()\n' +
        'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
        `assert len(lignes) == ${NOTES.length}, "Le cahier doit contenir ${NOTES.length} lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n` +
        'for n in ["Ama", "Kofi", "Yawa"]:\n' +
        '    assert n in garde, "Il manque " + n + " dans le cahier."',
    },
  },

  // ── 6. L'ordre des lignes ──────────────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets la recette dans l'ordre",
    description: "Ce programme garde une note pour demain.",
    hint: "On ouvre avant d'écrire, et on referme après. Un cahier qu'on n'a pas ouvert ne s'écrit pas ; un cahier qu'on ne ferme pas ne garde rien.",
    items: [
      'f = open("carnet.txt", "w")',
      'f.write("Ama 14")',
      "f.close()",
      'print("C\'est garde pour demain")',
    ],
  }),

  // ── 7. Le piège de la séance ───────────────────────────────────────────
  texte(
    "<h3>Le « w » efface tout</h3>" +
    "<p>Voici le piège, et il est redoutable parce qu'il ne fait aucun bruit.</p>" +
    "<p><code>open(\"carnet.txt\", \"w\")</code> ne se contente pas d'ouvrir le cahier : <strong>il arrache toutes les pages avant que tu écrives quoi que ce soit.</strong> Même si tu n'écris rien ensuite.</p>" +
    "<pre><code># le matin, au démarrage du programme\n" +
    'f = open("carnet.txt", "w")   💥 tout ce qu\'il y avait est perdu\n' +
    "f.close()</code></pre>" +
    "<p>Donc on n'ouvre jamais en <code>\"w\"</code> au début d'un programme « pour voir ». On ouvre en <code>\"w\"</code> <strong>au moment où on a quelque chose à sauver</strong>, et pas avant.</p>" +
    "<p>Le bon ordre d'une journée : <strong>relire au matin, travailler, sauver le soir.</strong></p>"
  ),

  // ── 8. Le piège en action ──────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Celui qui efface son cahier au réveil",
    context: "Hier, trois notes ont été sauvées. Ce matin, le programme démarre et le cahier est vide. Personne n'a rien effacé — pourtant.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 0,
    fix: 'f = open("carnet.txt", "r")',
    explanation: "Ouvrir en « w » arrache les pages avant même d'écrire. Au démarrage, on ouvre en « r » pour relire. Le « w », c'est le soir, quand on a quelque chose à garder.",
    instructions: [
      'f = open("carnet.txt", "w")',
      "contenu = f.read()",
      "f.close()",
      'print("Hier j\'avais :", contenu)',
    ],
  }),

  // ── 9. Relire, et retrouver ses lignes ─────────────────────────────────
  texte(
    "<h3>Relire, c'est recoller les morceaux</h3>" +
    "<p><code>read()</code> te rend <strong>tout le cahier d'un seul bloc</strong> — un seul grand texte, avec les retours à la ligne dedans :</p>" +
    "<pre><code>\"Ama 14\\nKofi 11\\nYawa 16\"</code></pre>" +
    "<p>Pour retrouver tes trois notes séparées, il faut le découper là où ça revient à la ligne. C'est le travail de <code>.split()</code> :</p>" +
    "<pre><code>lignes = contenu.split(\"\\n\")\n" +
    "→ [\"Ama 14\", \"Kofi 11\", \"Yawa 16\"]</code></pre>" +
    "<p>Et te voilà avec une liste, celle que tu sais parcourir depuis des semaines. Le cahier est redevenu de la mémoire.</p>"
  ),

  // ── 10. Relire et compter ──────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Le cahier contient les notes d'hier. Tu arrives le matin, et tu veux savoir combien d'élèves ont été notés.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — relire le cahier, afficher chaque note sur sa ligne, puis annoncer combien il y en a.<br>" +
        "🧰 <strong>Tu as</strong> — la recette de lecture, <code>.split(\"\\n\")</code> pour redécouper, et la boucle <code>for</code>.<br>" +
        `✅ <strong>C'est réussi quand</strong> — les ${NOTES.length} notes s'affichent et que le compte est annoncé.</p>` +
        "<p>⚠️ Ouvre en <code>\"r\"</code>. En <code>\"w\"</code>, tu effacerais ce que tu viens chercher.</p>",
      scene: cahier(),
      starter_code:
        "# Le cahier contient deja les notes d'hier.\n" +
        "# Relis-le, decoupe-le en lignes, affiche-les, et compte.\n",
      hidden_tests:
        "import re\n" +
        'assert \'"r"\' in code or "\\u0027r\\u0027" in code, "Ouvre le cahier en lecture : le mode r."\n' +
        'assert ".split(" in code, "read() rend un seul grand texte : .split() le redecoupe en lignes."\n' +
        'for n in ["Ama", "Kofi", "Yawa"]:\n' +
        '    assert n in output, "Il manque " + n + " dans ton affichage."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        `assert "${NOTES.length}" in nombres, "Il y a ${NOTES.length} notes dans le cahier : ton programme doit l annoncer."`,
    },
  },

  // ── 11. Le cahier qui n'existe pas encore ──────────────────────────────
  texte(
    "<h3>Et le tout premier matin ?</h3>" +
    "<p>Le jour où tu lances ton programme pour la première fois, le cahier n'existe pas. <code>open(\"carnet.txt\", \"r\")</code> ne trouve rien, et ton programme meurt — tu connais ce genre de mort depuis la semaine dernière.</p>" +
    "<pre><code>try:\n" +
    '    f = open("carnet.txt", "r")\n' +
    "    contenu = f.read()\n" +
    "    f.close()\n" +
    "except FileNotFoundError:\n" +
    "    contenu = \"\"        ← premier jour : on part d'un cahier vide</code></pre>" +
    "<p><code>FileNotFoundError</code>, c'est le nom de cette erreur-là : « ce fichier n'existe pas ». Le filet que tu as appris la semaine dernière marche exactement pareil — seul le nom de l'erreur change.</p>"
  ),

  // ── 12. Consolidation ──────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: 'Tu ouvres en "w" au démarrage, sans rien écrire. Que devient le cahier ?',
          choices: ["Il ne change pas", "Il est vidé", "Il est protégé"], answer: 1,
          explanation: "Le « w » arrache les pages à l'ouverture, avant même le premier write. C'est le piège de la séance." },
        { question: "read() te rend quoi, exactement ?",
          choices: ["Une liste de lignes", "Un seul grand texte avec les retours à la ligne dedans", "La première ligne"], answer: 1,
          explanation: "Un seul bloc. C'est .split() qui le redécoupe en liste." },
        { question: "Le bon ordre d'une journée de programme ?",
          choices: ["Sauver au matin, relire le soir", "Relire au matin, travailler, sauver le soir", "Sauver au matin et le soir"], answer: 1,
          explanation: "On relit ce qu'on avait, on travaille, et on sauve quand on a quelque chose à garder." },
        { question: "Le tout premier jour, le fichier n'existe pas. Quel filet poses-tu ?",
          choices: ["except FileNotFoundError", "except ValueError", "aucun, ça marche tout seul"], answer: 0,
          explanation: "Même filet que la semaine dernière, autre nom d'erreur. On nomme toujours celle qu'on attend." },
      ],
    },
  },

  // ── 13. Le carnet qui traverse la nuit ─────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Le programme complet d'une journée, celui que le jalon te demandera. Trois temps, dans cet ordre.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — relire le cahier au démarrage, ajouter la note du jour <code>Essi 13</code>, puis tout sauver.<br>" +
        "🧰 <strong>Tu as</strong> — les deux recettes, <code>.split(\"\\n\")</code>, <code>.append()</code> et le filet <code>FileNotFoundError</code>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — le cahier contient les notes d'hier <strong>et</strong> celle d'aujourd'hui, sans rien avoir perdu.</p>" +
        "<p>⚠️ Relis d'abord. Si tu ouvres en <code>\"w\"</code> avant d'avoir lu, tu effaces hier.</p>",
      scene: cahier(),
      starter_code:
        "# 1. Relis le cahier (il peut ne pas exister le premier jour).\n" +
        "# 2. Ajoute la note du jour : Essi 13\n" +
        "# 3. Sauve tout, une note par ligne.\n",
      hidden_tests:
        'assert ".split(" in code, "Relire rend un seul texte : il faut le redecouper."\n' +
        'assert ".close(" in code, "Le cahier doit etre referme, sinon rien n est garde."\n' +
        'garde = _vrai_open("carnet.txt").read()\n' +
        'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
        'assert "Essi" in garde, "La note du jour, Essi 13, doit etre dans le cahier."\n' +
        'for n in ["Ama", "Kofi", "Yawa"]:\n' +
        '    assert n in garde, "Tu as efface " + n + " : relis AVANT d ouvrir en w."\n' +
        'assert len(lignes) == 4, "Le cahier doit contenir 4 lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)',
    },
  },

  // ── 14. Les mots de la séance ──────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la séance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: 'open(nom, "w")', right: "Arrache les pages, puis écrit" },
      { left: 'open(nom, "r")', right: "Ouvre pour relire, sans rien abîmer" },
      { left: "f.close()", right: "Sans lui, le cahier reste vide" },
      { left: 'contenu.split("\\n")', right: "Recolle un grand texte en liste de lignes" },
      { left: "except FileNotFoundError", right: "Le tout premier matin, le cahier n'existe pas" },
    ],
  }),

  // ── 15. Ce qu'il sait faire, et le jalon ───────────────────────────────
  texte(
    "<h3>Ce que tu sais faire maintenant</h3>" +
    "<p>Garder. C'est un mot court, et c'est énorme : ton programme n'oublie plus rien quand on le ferme. Il relit au matin ce qu'il a écrit la veille, il ajoute la journée, et il sauve.</p>" +
    "<p>Tu sais aussi que le <code>\"w\"</code> est une arme : il efface avant d'écrire, et il faut le sortir au bon moment.</p>" +
    "<h3>La semaine prochaine : ton deuxième jalon</h3>" +
    "<p>Plus de leçon. Plus d'outil nouveau. <strong>Un cahier de notes qui sauvegarde</strong>, écrit par toi, du début à la fin.</p>" +
    "<p>On te donnera ce qu'il doit faire, pas comment le faire. Et il sera réussi sur un seul critère, celui que tu peux vérifier toi-même : <strong>ferme-le, rouvre-le, et tout est encore là.</strong></p>"
  ),
];

// ── Le banc ──────────────────────────────────────────────────────────────
// Les défis écrivent de vrais fichiers : hors du navigateur, on les range dans
// un dossier temporaire pour ne rien semer dans le dépôt.
const PRELUDE = (prerempli) =>
  "import os, tempfile\n" +
  "os.chdir(tempfile.mkdtemp())\n" +
  "_vrai_open = open\n" +
  "_journal = []\n" +
  "notes = []\n" +
  "def ajouter(t):\n    notes.append(t)\n    return notes\n" +
  "def fermer():\n    pass\n" +
  (prerempli ? `_f = _vrai_open("carnet.txt", "w")\n_f.write(${JSON.stringify(CONTENU)})\n_f.close()\n` : "");

const SOLUTIONS = {
  1: { prelude: PRELUDE(false), cas: [
    { nom: "juste", attendu: "ok", code:
      'f = open("carnet.txt", "w")\nf.write("Ama 14")\nf.close()\nprint("Ecrit !")\n' },
    { nom: "oublie de fermer", attendu: "test raté", code:
      'f = open("carnet.txt", "w")\nf.write("Ama 14")\nprint("Ecrit !")\n' },
  ] },
  5: { prelude: PRELUDE(false), cas: [
    { nom: "juste", attendu: "ok", code:
      'notes = ["Ama 14", "Kofi 11", "Yawa 16"]\nf = open("carnet.txt", "w")\n' +
      'for n in notes:\n    f.write(n + "\\n")\nf.close()\n' },
    // Rouvrir en "w" à chaque tour arrache les pages trois fois : seule la
    // dernière note survit.
    { nom: "rouvre en w a chaque tour", attendu: "test raté", code:
      'notes = ["Ama 14", "Kofi 11", "Yawa 16"]\nfor n in notes:\n' +
      '    f = open("carnet.txt", "w")\n    f.write(n + "\\n")\n    f.close()\n' },
    { nom: "oublie les retours a la ligne", attendu: "test raté", code:
      'notes = ["Ama 14", "Kofi 11", "Yawa 16"]\nf = open("carnet.txt", "w")\n' +
      "for n in notes:\n    f.write(n)\nf.close()\n" },
  ] },
  10: { prelude: PRELUDE(true), cas: [
    { nom: "juste", attendu: "ok", code:
      'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
      'lignes = contenu.split("\\n")\ncombien = 0\n' +
      "for l in lignes:\n    print(l)\n    combien = combien + 1\n" +
      'print("Notes :", combien)\n' },
    { nom: "ouvre en w et efface tout", attendu: "plante", code:
      'f = open("carnet.txt", "w")\ncontenu = f.read()\nf.close()\n' +
      'lignes = contenu.split("\\n")\nprint("Notes :", len(lignes))\n' },
  ] },
  13: { prelude: PRELUDE(true), cas: [
    { nom: "juste", attendu: "ok", code:
      "try:\n" +
      '    f = open("carnet.txt", "r")\n    contenu = f.read()\n    f.close()\n' +
      "except FileNotFoundError:\n" +
      '    contenu = ""\n' +
      'lignes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        lignes.append(l)\n' +
      'lignes.append("Essi 13")\n' +
      'f = open("carnet.txt", "w")\nfor l in lignes:\n    f.write(l + "\\n")\nf.close()\n' },
    // Le piège de la séance, en vrai : il ouvre en "w" avant d'avoir relu.
    { nom: "sauve avant de relire", attendu: "test raté", code:
      'f = open("carnet.txt", "w")\nf.write("Essi 13\\n")\nf.close()\n' },
  ] },
};

const OBJECTIFS = [
  "Écrire dans un fichier pour que les données survivent à la fin du programme",
  "Relire un fichier au démarrage et le redécouper en lignes avec .split()",
  "Comprendre que le mode \"w\" efface le fichier avant d'écrire, et quand l'utiliser",
  "Rattraper l'absence de fichier le premier jour avec except FileNotFoundError",
];
const ACQUIS = "garder le travail d'un programme pour le retrouver intact le lendemain, au lieu de tout recommencer";

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\bwith\b/, /\.upper\(/, /\bfinally\b/, /\braise\b/, /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  const visible = JSON.stringify({ ...c, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} (${c.game_type ?? b.type}) contient ${rx} — jamais enseigné`);
  if (/except\s*:/.test(visible)) mauvais(`bloc ${i} : un except sans nom d'erreur`);
  if (b.type === "text" && (c.html ?? "").replace(/<[^>]+>/g, "").trim().length < 80) mauvais(`bloc ${i} : texte trop court`);
  if (b.type === "code_challenge") {
    if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`bloc ${i} : défi incomplet`);
    if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`bloc ${i} : l'amorce finit sur un bloc vide`);
    for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
      if (!c.instructions.includes(champ)) mauvais(`bloc ${i} : le sujet n'a pas de « ${champ} »`);
  }
  if (b.type === "quiz") {
    if (new Set(c.questions.map((q) => q.answer)).size === 1) mauvais(`bloc ${i} : toutes les bonnes réponses au même rang`);
    for (const q of c.questions) {
      if (!q.choices[q.answer]) mauvais(`bloc ${i} : question sans bonne réponse`);
      if (new Set(q.choices).size !== q.choices.length) mauvais(`bloc ${i} : deux choix identiques`);
      if (!q.explanation) mauvais(`bloc ${i} : question sans explication`);
    }
  }
  if (c.game_type === "bug_hunt") {
    if (!c.instructions?.[c.bug_index]) mauvais(`bloc ${i} : bug_index hors des lignes`);
    else if (c.instructions[c.bug_index] === c.fix) mauvais(`bloc ${i} : la réparation répète la ligne fautive`);
    if (!c.explanation) mauvais(`bloc ${i} : chasse au bug sans explication`);
  }
  if (c.game_type === "sort" && (!c.items || new Set(c.items).size !== c.items.length || !c.hint))
    mauvais(`bloc ${i} : tri d'ordre incomplet`);
  if (c.pairs) {
    if (new Set(c.pairs.map((p) => p.left)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même gauche`);
    if (new Set(c.pairs.map((p) => p.right)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même droite`);
  }
  if (c.game_type === "fill_blank") {
    const trous = (c.template.match(/\[___\]/g) ?? []).length;
    if (trous !== c.blanks.length) mauvais(`bloc ${i} : ${trous} trous pour ${c.blanks.length} réponses`);
  }
  if (c.scene && c.scene.decor !== "cahier") mauvais(`bloc ${i} : décor inattendu`);
});
if (ACQUIS.length < 10 || ACQUIS.length > 160) mauvais(`acquis : ${ACQUIS.length} caractères`);
if (/^[A-ZÀ-Ý]/.test(ACQUIS) || ACQUIS.endsWith(".")) mauvais("acquis : ni majuscule ni point final");
if (OBJECTIFS.length !== 4) mauvais(`${OBJECTIFS.length} objectifs, il en faut 4`);

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
const nb = (t) => BLOCS.filter((b) => (b.content.game_type ?? b.type) === t).length;
dire(`✓ ${BLOCS.length} blocs · ${nb("code_challenge")} défis · ${nb("quiz")} quiz · ${BLOCS.filter((b) => b.content.scene).length} scènes · ${nb("bug_hunt")} chasse au bug`);
dire(`✓ ${NOTES.length} notes, ${NOTES.length + 1} lignes au cahier après le défi final`);

if (process.argv.includes("--banc")) {
  const exos = Object.keys(SOLUTIONS).map((i) => ({ palier: 1, title: `bloc ${i}`, blocs: [BLOCS[Number(i)]] }));
  const sols = Object.fromEntries(Object.entries(SOLUTIONS).map(([i, s]) => [`bloc ${i}`, s]));
  console.log(JSON.stringify(banc(exos, sols)));
  process.exit(0);
}

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id,status", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("lesson_blocks", "id", (q) => q.eq("lesson_id", L.id));
if (deja.length && !process.argv.includes("--refaire"))
  throw new Error(`${deja.length} bloc(s) existent déjà — --refaire pour les remplacer`);

const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs sur « ${L.title} » (${L.status})\n`);
BLOCS.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(16)}${b.content.scene ? "📓 " : "   "}${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 48))}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const { error } = await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
  if (error) throw new Error(`suppression : ${error.message}`);
  console.log(`  ⟲ ${deja.length} blocs remplacés`);
}
const { error } = await db.from("lesson_blocks").insert(
  BLOCS.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (error) throw new Error(error.message);
const { error: eo } = await db.from("lessons").update({ objectives: OBJECTIFS, acquis: ACQUIS, status: "published" }).eq("id", L.id);
if (eo) throw new Error(`objectifs : ${eo.message}`);

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = (await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id))).sort((a, b) => a.order_index - b.order_index);
ok(ap.length === BLOCS.length, `${BLOCS.length} blocs écrits (trouvé ${ap.length})`);
ok(ap.every((b, i) => b.order_index === i), "numérotation contiguë");
ok(ap.filter((b) => b.type === "code_challenge").every((b) => b.content.hidden_tests), "chaque défi garde ses tests");
const relu = (await g("lessons", "objectives,acquis,status", (q) => q.eq("id", L.id)))[0];
ok(relu.objectives?.length === 4 && relu.acquis === ACQUIS && relu.status === "published", "objectifs, acquis et statut");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
