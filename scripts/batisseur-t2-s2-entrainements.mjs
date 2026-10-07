/**
 * Les quatre entraînements de « Les textes qui travaillent ».
 *
 *     node scripts/batisseur-t2-s2-entrainements.mjs [--ecrire] [--refaire] [--banc]
 *
 * Un par objectif de la séance :
 *
 *   0. Quel outil pour quelle saleté ?   obj. 3 — la casse, les bords, le milieu
 *   1. Range la réponse                  obj. 2 — une commande qui rend ne change rien
 *   2. Le marché mal écrit               obj. 1 — nettoyer pour de vrai, à l'étal
 *   3. Le portier qui ne se trompe plus  obj. 4 — nettoyer AVANT de comparer
 */
import { base, lecteur, kodi, banc, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les textes qui travaillent";

// ── Garde-fou arithmétique ───────────────────────────────────────────────
const PAPIERS = ["3000", "1 200", "450F", "2.350"];
const propre = (p) => p.replace(/[ F.]/g, "");
const CAISSE = PAPIERS.reduce((a, p) => a + Number(propre(p)), 0);
if (CAISSE !== 7000) throw new Error(`caisse ${CAISSE}, attendu 7000`);
for (const p of PAPIERS) if (!/^\d+$/.test(propre(p))) throw new Error(`« ${p} » ne se nettoie pas`);

const EXOS = [
  {
    title: "Quel outil pour quelle saleté ?",
    description: "Douze textes mal tapés. Chacun appelle un outil, et un seul.",
    xp: 30,
    blocs: [
      kodi("<p>Trois saletés, trois outils. <strong>La casse</strong> se règle avec <code>.lower()</code>, <strong>les bords</strong> avec <code>.strip()</code>, et <strong>ce qui gêne au milieu</strong> avec <code>.replace()</code>.</p><p>Range chaque texte sous l'outil qui le sauve.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Quel outil le sauve ?",
          instruction: "Ce texte est sale. Quel outil le nettoie ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Des MAJUSCULES qui gênent → .lower()",
              "Des espaces au DÉBUT ou à la FIN → .strip()",
              "Quelque chose AU MILIEU du texte → .replace()",
              "Regarde où est la saleté, pas ce que le texte veut dire.",
            ],
          },
          categories: [
            { id: "lower", label: ".lower()", emoji: "🔡", color: "#FDB813" },
            { id: "strip", label: ".strip()", emoji: "✂️", color: "#a78bfa" },
            { id: "replace", label: ".replace()", emoji: "🧽", color: "#10b981" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: '"FIN"', correct: "lower", hint: "Tout est en majuscules : il faut tout mettre en petites lettres." },
            { id: "b", emoji: "2️⃣", label: '"  fin"', correct: "strip", hint: "Deux espaces au début, rien au milieu." },
            { id: "c", emoji: "3️⃣", label: '"1 500"', correct: "replace", hint: "L'espace est entre les chiffres : au milieu." },
            { id: "d", emoji: "4️⃣", label: '"Ama"', correct: "lower", hint: "Une majuscule au début suffit à rendre deux mots différents." },
            { id: "e", emoji: "5️⃣", label: '"1500F"', correct: "replace", hint: "Le F est collé au nombre : il faut l'enlever de l'intérieur." },
            { id: "f", emoji: "6️⃣", label: '"fin "', correct: "strip", hint: "Un espace à la fin, qu'on ne voit même pas." },
            { id: "g", emoji: "7️⃣", label: '"3.000"', correct: "replace", hint: "Le point des milliers est au milieu du nombre." },
            { id: "h", emoji: "8️⃣", label: '"OUI"', correct: "lower", hint: "Encore des majuscules." },
            { id: "i", emoji: "9️⃣", label: '"Bonjour  "', correct: "strip", hint: "Les espaces sont tout à la fin." },
            { id: "j", emoji: "🔟", label: '"2 000 000"', correct: "replace", hint: "Deux espaces, et tous les deux au milieu." },
            { id: "k", emoji: "🅰️", label: '"KOFI"', correct: "lower", hint: "Un prénom crié : .lower() le calme." },
            { id: "l", emoji: "🅱️", label: '" oui "', correct: "strip", hint: "Un espace de chaque côté : c'est exactement le travail de .strip()." },
          ],
        },
      },
    ],
  },

  {
    title: "Range la réponse",
    description: "Sept lignes. Trois ne font rien du tout, et c'est invisible.",
    xp: 40,
    blocs: [
      kodi("<p>Une commande de texte ne change jamais le texte : elle en <strong>rend un neuf</strong>.</p><p>Si tu ne ranges pas sa réponse, elle part à la poubelle — sans rouge, sans message, sans rien.</p>"),
      {
        type: "match",
        content: {
          title: "Qu'est-ce que cette ligne fait vraiment ?",
          instruction: "Touche une ligne, puis ce qu'elle fait.",
          left_label: "La ligne",
          right_label: "Ce qu'elle fait vraiment",
          pairs: [
            { left: "mot.lower()", right: "Calcule, puis jette le résultat" },
            { left: "mot = mot.lower()", right: "Range le résultat dans mot" },
            { left: 'propre = papier.replace(" ", "")', right: "Range le résultat sous un nouveau nom" },
            { left: "print(mot.strip())", right: "Affiche le résultat sans le garder" },
            { left: "int(propre)", right: "Transforme un texte en nombre" },
            { left: 'mot == "fin"', right: "Pose une question : oui ou non" },
            { left: 'mot = "fin"', right: "Écrase ce qu'il y avait dans mot" },
          ],
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Un client a crié son mot de passe en majuscules, avec des espaces partout : <code>\"  BONSOIR  \"</code>.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — l'afficher propre : <code>bonsoir</code>, sans espace et sans majuscule.<br>" +
            "🧰 <strong>Tu as</strong> — <code>.strip()</code> et <code>.lower()</code>, et la ligne du mot est déjà écrite.<br>" +
            "✅ <strong>C'est réussi quand</strong> — la sortie affiche exactement <code>bonsoir</code>.</p>" +
            "<p>💡 Chaque nettoyage doit être rangé, sinon il ne sert à rien.</p>",
          starter_code:
            'mot = "  BONSOIR  "\n\n' +
            "# Enleve les espaces, mets en petites lettres, puis affiche.\n",
          hidden_tests:
            'assert ".strip(" in code, "Les espaces des deux bouts s enlevent avec .strip()."\n' +
            'assert ".lower(" in code, "Les majuscules se calment avec .lower()."\n' +
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'assert lignes, "Ton programme n affiche rien."\n' +
            'assert lignes[-1] == "bonsoir", "Il faut afficher exactement bonsoir. Ton programme affiche : " + repr(lignes[-1])',
        },
      },
    ],
  },

  {
    title: "Le marché mal écrit",
    description: "Quatre papiers, trois saletés différentes, une caisse à faire tomber juste.",
    xp: 40,
    blocs: [
      kodi("<p>Au marché, personne n'écrit comme un ordinateur. Un espace ici, un <code>F</code> collé là, un point des milliers.</p><p>Ton programme doit encaisser tout le monde — <strong>sans refuser personne</strong>.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Quatre clients t'ont tendu leur papier : <code>3000</code>, <code>1 200</code>, <code>450F</code>, <code>2.350</code>.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — encaisser les quatre, et annoncer la caisse.<br>" +
            "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, la commande <code>encaisser(papier)</code>, et <code>.replace()</code> autant de fois qu'il le faut.<br>" +
            `✅ <strong>C'est réussi quand</strong> — personne n'est refusé et que la caisse affiche ${CAISSE}.</p>`,
          scene: { decor: "etal", reglages: { papiers: PAPIERS }, plafond: 200 },
          starter_code:
            "caisse = 0\n\n" +
            "# Trois saletes se promenent dans ces papiers : l'espace, le F, le point.\n",
          hidden_tests:
            'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
            'assert code.count(".replace(") >= 3, "Trois saletes differentes demandent trois nettoyages."\n' +
            `assert len(encaisses) == ${PAPIERS.length}, "Les ${PAPIERS.length} clients doivent etre encaisses. Ton programme en a servi " + str(len(encaisses)) + "."\n` +
            `assert "${CAISSE}" in output, "La caisse fait ${CAISSE} F. Verifie chaque nettoyage."`,
        },
      },
    ],
  },

  {
    title: "Le portier qui ne se trompe plus",
    description: "Le mot de passe est « ouvre ». Écrit n'importe comment, il doit marcher.",
    xp: 50,
    blocs: [
      kodi("<p>Un portier qui refuse le bon mot parce qu'il est écrit en majuscules, ce n'est pas un portier sévère : c'est un programme mal écrit.</p><p>Nettoie <strong>avant</strong> de comparer, et à <strong>chaque</strong> tour.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>La porte s'ouvre avec le mot <code>ouvre</code>. Mais les gens tapent <code>OUVRE</code>, <code>Ouvre</code>, ou <code> ouvre </code> avec des espaces.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — redemander tant que ce n'est pas le bon mot, puis annoncer que la porte est ouverte. Toutes les écritures du mot doivent marcher.<br>" +
            "🧰 <strong>Tu as</strong> — <code>.strip()</code>, <code>.lower()</code>, et la boucle de la semaine dernière.<br>" +
            "✅ <strong>C'est réussi quand</strong> — un mauvais mot fait redemander une fois, et que <code> OUVRE </code> ouvre la porte.</p>" +
            "<p>⚠️ Le mot arrive sale à <strong>chaque</strong> tour, pas seulement au premier.</p>",
          starter_code:
            'mot = input("Mot de passe : ")\n\n' +
            "# Nettoie-le, compare-le, et redemande tant que ce n'est pas ouvre.\n",
          hidden_tests:
            'assert ".lower(" in code, "Les majuscules doivent etre mises a plat."\n' +
            'assert ".strip(" in code, "Les espaces autour doivent sauter."\n' +
            'assert "while" in code, "Tant que ce n est pas le bon mot, il faut redemander."\n' +
            'assert "ouverte" in output.lower(), "Quand le mot est bon, la porte s ouvre : affiche que la porte est ouverte."\n' +
            'assert output.lower().count("refuse") == 1, "Un seul mot etait faux : le portier ne refuse qu une fois."',
        },
      },
    ],
  },
];

const PRELUDE_ETAL =
  "_journal = []\n" +
  "papiers = " + JSON.stringify(PAPIERS) + "\n" +
  "def encaisser(papier):\n" +
  '    _journal.append({"quoi": "encaisser", "papier": str(papier)})\n' +
  "def refuser(papier):\n" +
  '    _journal.append({"quoi": "refuser", "papier": str(papier)})\n';

const SOLUTIONS = {
  "Range la réponse": { cas: [
    { nom: "juste", attendu: "ok", code:
      'mot = "  BONSOIR  "\nmot = mot.strip()\nmot = mot.lower()\nprint(mot)\n' },
    { nom: "nettoie mais jette", attendu: "test raté", code:
      'mot = "  BONSOIR  "\nmot.strip()\nmot.lower()\nprint(mot)\n' },
    { nom: "oublie les majuscules", attendu: "test raté", code:
      'mot = "  BONSOIR  "\nmot = mot.strip()\nprint(mot)\n' },
  ] },
  "Le marché mal écrit": {
    prelude: PRELUDE_ETAL,
    cas: [
      { nom: "juste", attendu: "ok", code:
        "caisse = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    p = p.replace("F", "")\n    p = p.replace(".", "")\n' +
        "    caisse = caisse + int(p)\n    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "oublie le F", attendu: "plante", code:
        "caisse = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    p = p.replace(".", "")\n' +
        "    caisse = caisse + int(p)\n    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "refuse au lieu de nettoyer", attendu: "test raté", code:
        "caisse = 0\nfor papier in papiers:\n" +
        "    refuser(papier)\n" +
        'print("Caisse :", caisse)\n' },
    ],
  },
  "Le portier qui ne se trompe plus": {
    reponses: ["bonjour", "  OUVRE  "],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'mot = input("Mot de passe : ")\nmot = mot.strip()\nmot = mot.lower()\n' +
        'while mot != "ouvre":\n    print("Refuse.")\n' +
        '    mot = input("Mot de passe : ")\n    mot = mot.strip()\n    mot = mot.lower()\n' +
        'print("La porte est ouverte")\n' },
      // Il nettoie une seule fois, avant la boucle : le deuxième mot arrive
      // sale, et la porte ne s'ouvre jamais.
      { nom: "ne nettoie qu au premier tour", attendu: "saisie manquante", code:
        'mot = input("Mot de passe : ")\nmot = mot.strip()\nmot = mot.lower()\n' +
        'while mot != "ouvre":\n    print("Refuse.")\n' +
        '    mot = input("Mot de passe : ")\n' +
        'print("La porte est ouverte")\n' },
      { nom: "oublie strip", attendu: "saisie manquante", code:
        'mot = input("Mot de passe : ")\nmot = mot.lower()\n' +
        'while mot != "ouvre":\n    print("Refuse.")\n' +
        '    mot = input("Mot de passe : ")\n    mot = mot.lower()\n' +
        'print("La porte est ouverte")\n' },
    ],
  },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\.split\(/, /\.join\(/, /\.upper\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
  /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
for (const e of EXOS) {
  if (e.palier !== undefined) mauvais(`${e.title} : un entraînement de parcours ne porte pas de palier`);
  if (!e.xp) mauvais(`${e.title} : un entraînement de parcours paie en XP`);
  for (const b of e.blocs) {
    const c = b.content ?? {};
    const visible = JSON.stringify({ ...c, hidden_tests: undefined });
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — jamais enseigné`);
    for (const it of c.items ?? []) {
      if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
      if (!(c.categories ?? c.bins ?? []).some((x) => x.id === it.correct)) mauvais(`${e.title} : « ${it.label} » vise un bac inexistant`);
    }
    for (const v of (c.categories ?? c.bins ?? []).filter((x) => !(c.items ?? []).some((i) => i.correct === x.id)))
      mauvais(`${e.title} : le bac « ${v.label} » n'attend aucun élément`);
    if (c.pairs) {
      if (new Set(c.pairs.map((p) => p.left)).size !== c.pairs.length) mauvais(`${e.title} : deux paires de même gauche`);
      if (new Set(c.pairs.map((p) => p.right)).size !== c.pairs.length) mauvais(`${e.title} : deux paires de même droite — insoluble`);
    }
    if (c.helper && (!c.helper.title || !c.helper.criteria?.length)) mauvais(`${e.title} : helper mal formé`);
    if (b.type === "code_challenge") {
      if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`${e.title} : défi incomplet`);
      if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`${e.title} : l'amorce finit sur un bloc vide`);
      for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
        if (!c.instructions.includes(champ)) mauvais(`${e.title} : le sujet n'a pas de « ${champ} »`);
    }
  }
}
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${EXOS.length} entraînements de parcours · caisse vérifiée : ${CAISSE} F`);
dire("✓ vocabulaire, bacs, indices, paires, sujets et amorces : vérifiés");

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquerParcours(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
