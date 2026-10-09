/**
 * Les quatre entraînements de « Se souvenir — les fichiers ».
 *
 *     node scripts/batisseur-t2-s4-entrainements.mjs [--ecrire] [--refaire] [--banc]
 *
 *   0. Ce qui survit, ce qui s'évapore   obj. 1 — variable contre fichier
 *   1. Les deux recettes                 obj. 1 et 2 — écrire, relire, redécouper
 *   2. Le « w » qui efface               obj. 3 — le piège du mode d'ouverture
 *   3. Le tout premier matin             obj. 4 — le fichier qui n'existe pas
 */
import { base, lecteur, kodi, banc, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Se souvenir — les fichiers";

const HIER = ["Ama 14", "Kofi 11", "Yawa 16"];
const cahier = (depart) => ({ decor: "cahier", reglages: depart ? { cahier_depart: depart } : {}, plafond: 200 });

const EXOS = [
  {
    title: "Ce qui survit, ce qui s'évapore",
    description: "Douze choses. Après la fin du programme, lesquelles sont encore là ?",
    xp: 30,
    blocs: [
      kodi("<p>Une variable vit <strong>le temps du programme</strong>. Un fichier vit <strong>plus longtemps que lui</strong>.</p><p>Tout est là, et c'est la seule idée de la séance. Range chaque chose du bon côté.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Demain matin, c'est encore là ?",
          instruction: "Le programme s'est terminé. Et ça ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Rangé dans une variable, une liste, un dictionnaire → ça s'évapore.",
              "Écrit dans un fichier ET refermé → ça reste.",
              "Écrit dans un fichier mais jamais refermé → ça s'évapore quand même.",
              "Affiché avec print → ça n'a jamais été gardé nulle part.",
            ],
          },
          categories: [
            { id: "reste", label: "C'est encore là", emoji: "📓", color: "#10b981" },
            { id: "evapore", label: "Évaporé", emoji: "💨", color: "#64748b" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "caisse = 4300", correct: "evapore", hint: "Une variable, et rien d'autre." },
            { id: "b", emoji: "2️⃣", label: 'f.write("Ama 14") puis f.close()', correct: "reste", hint: "Écrit et refermé : c'est posé sur le papier." },
            { id: "c", emoji: "3️⃣", label: 'print("Ama 14")', correct: "evapore", hint: "Afficher n'est pas garder : le texte passe à l'écran et s'en va." },
            { id: "d", emoji: "4️⃣", label: "notes = [\"Ama 14\", \"Kofi 11\"]", correct: "evapore", hint: "Une liste est une variable comme une autre." },
            { id: "e", emoji: "5️⃣", label: 'f.write("Ama 14") sans f.close()', correct: "evapore", hint: "Tant que le cahier reste ouvert, rien n'arrive sur le papier." },
            { id: "f", emoji: "6️⃣", label: "Un fichier écrit la semaine dernière", correct: "reste", hint: "Il attend sagement depuis sept jours." },
            { id: "g", emoji: "7️⃣", label: "total = total + 500", correct: "evapore", hint: "Encore une variable." },
            { id: "h", emoji: "8️⃣", label: "Les trois lignes d'un fichier refermé", correct: "reste", hint: "Un fichier ne perd pas ses lignes en route." },
            { id: "i", emoji: "9️⃣", label: "notes.append(\"Yawa 16\")", correct: "evapore", hint: "Ajouter à une liste, c'est toucher une variable." },
            { id: "j", emoji: "🔟", label: "Un fichier ouvert en \"w\" puis refermé sans rien écrire", correct: "evapore", hint: "Le « w » a vidé le fichier. Il reste bien un fichier… mais il est vide." },
            { id: "k", emoji: "🅰️", label: "Le contenu lu avec read() et rangé dans une variable", correct: "evapore", hint: "La variable s'évapore. Le fichier, lui, est toujours là — mais la question porte sur la variable." },
            { id: "l", emoji: "🅱️", label: "Un fichier auquel on n'a pas touché du tout", correct: "reste", hint: "Ce qu'on ne touche pas ne risque rien." },
          ],
        },
      },
    ],
  },

  {
    title: "Les deux recettes",
    description: "Sept lignes à relier à leur rôle, puis un cahier à écrire et à relire.",
    xp: 40,
    blocs: [
      kodi("<p>Écrire : on ouvre en <code>\"w\"</code>, on écrit, on referme. Relire : on ouvre en <code>\"r\"</code>, on lit, on referme.</p><p>Six lignes, deux recettes, et une septième qui ne sert qu'après.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque ligne et son rôle",
          instruction: "Touche une ligne, puis son rôle.",
          left_label: "La ligne",
          right_label: "Ce qu'elle fait",
          pairs: [
            { left: 'f = open("carnet.txt", "w")', right: "Vide le cahier et le prépare à être écrit" },
            { left: 'f = open("carnet.txt", "r")', right: "Ouvre le cahier pour le lire, sans l'abîmer" },
            { left: 'f.write("Ama 14")', right: "Pose une note, mais pas encore sur le papier" },
            { left: "f.close()", right: "Referme, et c'est là que tout est vraiment écrit" },
            { left: "contenu = f.read()", right: "Rend tout le cahier en un seul grand texte" },
            { left: 'contenu.split("\\n")', right: "Recoupe ce grand texte en liste de lignes" },
            { left: "len(lignes)", right: "Dit combien de lignes on a récupérées" },
          ],
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Deux recettes dans le même programme : écrire, puis relire ce qu'on vient d'écrire.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — écrire les deux notes dans le cahier, une par ligne, puis le relire et afficher combien il en contient.<br>" +
            "🧰 <strong>Tu as</strong> — les deux recettes, <code>\\n</code> pour aller à la ligne, et <code>.split()</code> pour redécouper.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le programme annonce 2 notes, et qu'elles sont vraiment dans le cahier.</p>",
          scene: cahier(),
          starter_code:
            'notes = ["Ama 14", "Kofi 11"]\n\n' +
            "# Ecris-les, referme, puis relis et compte.\n",
          hidden_tests:
            "import re\n" +
            'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
            'assert ".split(" in code, "read() rend un seul texte : il faut le redecouper."\n' +
            'garde = _vrai_open("carnet.txt").read()\n' +
            'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
            'assert len(lignes) == 2, "Le cahier doit contenir 2 lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "2" in nombres, "Ton programme doit annoncer 2 notes."',
        },
      },
    ],
  },

  {
    title: "Le « w » qui efface",
    description: "Six phrases sur un programme qui perd tout sans le savoir.",
    xp: 40,
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Le cahier contient déjà trois notes d'hier. Voici le programme de ce matin.</p>" +
            "<pre><code>1  f = open(\"carnet.txt\", \"w\")\n" +
            "2  contenu = f.read()\n" +
            "3  f.close()</code></pre>" +
            "<p>Il n'écrit rien. Il ne fait qu'ouvrir, lire, et refermer. Déroule-le quand même.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Ce que la ligne 1 a déjà fait",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Juste après la ligne 1, le cahier contient", after: ".",
              options: ["rien du tout", "les trois notes d'hier", "une ligne vide"], correct: 0,
              explanation: "Le « w » arrache les pages à l'ouverture, avant même qu'on écrive." },
            { id: "s2", before: "Les notes d'hier sont", after: ".",
              options: ["perdues pour toujours", "encore là", "dans une variable"], correct: 0,
              explanation: "Un fichier vidé ne se récupère pas. C'est le piège qui coûte le plus cher." },
            { id: "s3", before: "La ligne 2", after: ".",
              options: ["fait planter le programme", "rend un texte vide", "rend les trois notes"], correct: 0,
              explanation: "Un cahier ouvert en écriture ne se lit pas : Python refuse." },
            { id: "s4", before: "Pour relire sans rien casser, la ligne 1 devait être", after: ".",
              options: ['open("carnet.txt", "r")', 'open("carnet.txt", "w")', "read(\"carnet.txt\")"], correct: 0,
              explanation: "r comme read. Deux lettres, et les notes d'hier sont sauvées." },
            { id: "s5", before: "Le bon moment pour ouvrir en « w », c'est", after: ".",
              options: ["quand on a quelque chose à sauver", "au démarrage du programme", "juste avant de lire"], correct: 0,
              explanation: "On relit au matin, on travaille, on sauve à la fin. Dans cet ordre." },
            { id: "s6", before: "Si la ligne 1 ouvrait en « r » et que le fichier n'existait pas, le programme", after: ".",
              options: ["mourrait", "créerait le fichier", "continuerait"], correct: 0,
              explanation: "C'est le cas du tout premier matin — et c'est le sujet de l'entraînement suivant." },
          ],
        },
      },
    ],
  },

  {
    title: "Le tout premier matin",
    description: "Le jour où le cahier n'existe pas encore, le programme doit tenir debout.",
    xp: 50,
    blocs: [
      kodi("<p>Le premier jour, il n'y a pas de cahier. <code>open(..., \"r\")</code> ne trouve rien, et ton programme meurt — tu connais ce genre de mort depuis la semaine dernière.</p><p>Même filet, autre nom d'erreur : <code>FileNotFoundError</code>.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Ce programme doit marcher <strong>les deux jours</strong> : celui où le cahier n'existe pas, et tous les suivants.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — relire le cahier s'il existe, partir d'un cahier vide sinon, puis annoncer combien de notes il contenait.<br>" +
            "🧰 <strong>Tu as</strong> — la recette de lecture, et <code>except FileNotFoundError</code>.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le programme annonce 0 note au lieu de mourir.</p>" +
            "<p>💡 Ici, le cahier n'existe pas. C'est voulu : c'est ton premier matin.</p>",
          scene: cahier(),
          starter_code:
            "# Le cahier n'existe pas encore. Ton programme doit tenir quand meme.\n",
          hidden_tests:
            "import re\n" +
            'assert "try" in code and "FileNotFoundError" in code, "Sans filet, open() en lecture tue le programme le premier jour."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "0" in nombres, "Le premier matin, le cahier contient 0 note : ton programme doit l annoncer."',
        },
      },
    ],
  },
];

const PRELUDE = (prerempli) =>
  "import os, tempfile\n" +
  "os.chdir(tempfile.mkdtemp())\n" +
  "_vrai_open = open\n" +
  (prerempli ? `_f = _vrai_open("carnet.txt", "w")\n_f.write(${JSON.stringify(HIER.join("\n") + "\n")})\n_f.close()\n` : "");

const SOLUTIONS = {
  "Les deux recettes": { prelude: PRELUDE(false), cas: [
    { nom: "juste", attendu: "ok", code:
      'notes = ["Ama 14", "Kofi 11"]\nf = open("carnet.txt", "w")\n' +
      'for n in notes:\n    f.write(n + "\\n")\nf.close()\n' +
      'g = open("carnet.txt", "r")\ncontenu = g.read()\ng.close()\n' +
      'lignes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        lignes.append(l)\n' +
      'print("Notes :", len(lignes))\n' },
    { nom: "oublie les retours a la ligne", attendu: "test raté", code:
      'notes = ["Ama 14", "Kofi 11"]\nf = open("carnet.txt", "w")\n' +
      "for n in notes:\n    f.write(n)\nf.close()\n" +
      'g = open("carnet.txt", "r")\ncontenu = g.read()\ng.close()\n' +
      'print("Notes :", len(contenu.split("\\n")))\n' },
  ] },
  "Le tout premier matin": { prelude: PRELUDE(false), cas: [
    { nom: "juste", attendu: "ok", code:
      "try:\n" +
      '    f = open("carnet.txt", "r")\n    contenu = f.read()\n    f.close()\n' +
      "except FileNotFoundError:\n" +
      '    contenu = ""\n' +
      'lignes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        lignes.append(l)\n' +
      'print("Notes :", len(lignes))\n' },
    { nom: "sans filet", attendu: "plante", code:
      'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
      'print("Notes :", len(contenu.split("\\n")))\n' },
    { nom: "cree le fichier au lieu de rattraper", attendu: "test raté", code:
      'f = open("carnet.txt", "w")\nf.close()\n' +
      'g = open("carnet.txt", "r")\ncontenu = g.read()\ng.close()\n' +
      'print("Notes :", len(contenu.split("\\n")))\n' },
  ] },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\bwith\b/, /\.upper\(/, /\bfinally\b/, /\braise\b/, /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
for (const e of EXOS) {
  if (!e.xp) mauvais(`${e.title} : un entraînement de parcours paie en XP`);
  for (const b of e.blocs) {
    const c = b.content ?? {};
    const visible = JSON.stringify({ ...c, hidden_tests: undefined });
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx}`);
    if (/except:/.test(visible)) mauvais(`${e.title} : un except sans nom d'erreur`);
    for (const it of c.items ?? []) {
      if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
      if (!(c.categories ?? c.bins ?? []).some((x) => x.id === it.correct)) mauvais(`${e.title} : bac inexistant`);
    }
    for (const v of (c.categories ?? c.bins ?? []).filter((x) => !(c.items ?? []).some((i) => i.correct === x.id)))
      mauvais(`${e.title} : le bac « ${v.label} » n'attend rien`);
    for (const s of c.sentences ?? []) {
      if (!s.options?.[s.correct] || !s.explanation) mauvais(`${e.title} : phrase incomplète`);
      if (new Set(s.options).size !== s.options.length) mauvais(`${e.title} : deux options identiques`);
    }
    if (c.pairs) {
      if (new Set(c.pairs.map((p) => p.left)).size !== c.pairs.length) mauvais(`${e.title} : paires de même gauche`);
      if (new Set(c.pairs.map((p) => p.right)).size !== c.pairs.length) mauvais(`${e.title} : paires insolubles`);
    }
    if (b.type === "code_challenge") {
      if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`${e.title} : défi incomplet`);
      for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
        if (!c.instructions.includes(champ)) mauvais(`${e.title} : le sujet n'a pas de « ${champ} »`);
    }
  }
}
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
(process.argv.includes("--banc") ? console.error : console.log)(`✓ ${EXOS.length} entraînements de parcours`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquerParcours(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
