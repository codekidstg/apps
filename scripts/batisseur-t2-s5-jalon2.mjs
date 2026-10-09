/**
 * Bâtisseur — thème 2, séance 5 : « 🏆 Jalon 2 — Carnet de notes qui sauvegarde ».
 *
 *     node scripts/batisseur-t2-s5-jalon2.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce n'est pas une séance de plus, c'est l'épreuve où l'enfant prouve qu'il
 * sait faire sans qu'on le tienne. Les règles du jalon, appliquées à la lettre :
 *
 *   — Aucune notion nouvelle. Tout ce qu'il faut a été vu dans le thème :
 *     while, les textes, try/except, open/write/read/close, split.
 *   — Un cahier des charges, pas un tutoriel. On dit ce que le programme doit
 *     faire ; on ne dit jamais comment.
 *   — Une grille de critères, montrée DÈS LE DEUXIÈME BLOC. On ne cache pas
 *     la grille, et c'est l'enfant qui la coche.
 *   — Un filet, pas une solution : quand il bloque, un indice qui relance.
 *   — Une production montrable, et le script pour la montrer.
 *
 * Le critère de réussite tient en une phrase, et c'est la seule qui compte :
 * ferme le programme, rouvre-le, tout est encore là.
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 Jalon 2 — Carnet de notes qui sauvegarde";

// ── Garde-fous ───────────────────────────────────────────────────────────
const HIER = ["Ama 14", "Kofi 11", "Yawa 16"];
const AUJOURDHUI = ["Essi 13", "Kodjo 15"];
const TOTAL = HIER.length + AUJOURDHUI.length;
if (TOTAL !== 5) throw new Error(`${TOTAL} notes attendues au total`);
const CONTENU_HIER = HIER.join("\n") + "\n";

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });
const cahier = () => ({ decor: "cahier", reglages: {}, plafond: 200 });

const CRITERES = [
  "il relit le cahier au démarrage, et affiche ce qu'il contient",
  "il accepte des notes tant qu'on ne tape pas « fin »",
  "il sauve tout avant de se terminer",
  "il ne plante pas le tout premier jour, quand le cahier n'existe pas encore",
  "on le ferme, on le rouvre, et rien n'a été perdu",
];

const BLOCS = [
  // ── 0. Ce que c'est ────────────────────────────────────────────────────
  texte(
    "<h3>Ton deuxième jalon</h3>" +
    "<p>Depuis cinq semaines tu apprends des outils : la boucle qui attend, les textes qu'on nettoie, le filet qui rattrape, le cahier qui garde.</p>" +
    "<p>Aujourd'hui, <strong>aucun outil nouveau</strong>. Tu fabriques quelque chose avec ceux que tu as, et tu le montres.</p>" +
    "<p>Un carnet de notes. On y ajoute des élèves, il garde tout, et <strong>il s'en souvient le lendemain</strong>. C'est la seule chose qui compte : ferme-le, rouvre-le, et tout est encore là.</p>"
  ),

  // ── 1. La grille, montrée d'avance ─────────────────────────────────────
  texte(
    "<h3>La grille — tu la coches toi-même</h3>" +
    "<p>On ne te cache pas comment on juge. Voici les cinq critères, et tu peux vérifier chacun tout seul, sans attendre personne :</p>" +
    "<ol>" + CRITERES.map((c) => `<li>${c.charAt(0).toUpperCase()}${c.slice(1)}</li>`).join("") + "</ol>" +
    "<p>Le cinquième est le vrai. Les quatre autres sont là pour y arriver.</p>" +
    "<p>Tu vas y aller par étapes : trois petits bouts d'abord, puis le programme entier.</p>"
  ),

  // ── 2. Étape 1 : il se souvient ────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p><strong>Première étape.</strong> Le cahier contient déjà les notes d'hier.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — relire le cahier au démarrage et afficher chaque note, une par ligne.<br>" +
        "🧰 <strong>Tu as</strong> — tout ce que tu sais depuis la semaine dernière. Rien de neuf.<br>" +
        `✅ <strong>C'est réussi quand</strong> — les ${HIER.length} notes d'hier s'affichent.</p>`,
      scene: cahier(),
      starter_code: "# Relis le cahier et affiche ce qu'il contient.\n",
      hidden_tests:
        'assert ".split(" in code, "read() rend un seul texte : il faut le redecouper en lignes."\n' +
        'for n in ["Ama", "Kofi", "Yawa"]:\n' +
        '    assert n in output, "Il manque " + n + " dans ton affichage."',
    },
  },

  // ── 3. Étape 2 : il accepte des notes ──────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p><strong>Deuxième étape.</strong> On oublie le cahier une minute : on s'occupe de la saisie.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — demander des notes l'une après l'autre, jusqu'à ce qu'on tape <code>fin</code>, puis annoncer combien on en a reçues.<br>" +
        "🧰 <strong>Tu as</strong> — la boucle qui attend, et une liste pour ranger.<br>" +
        `✅ <strong>C'est réussi quand</strong> — « fin » n'est pas compté comme une note, et que le compte est juste.</p>`,
      starter_code:
        "notes = []\n\n" +
        "# Demande des notes jusqu'a fin, range-les, puis annonce combien.\n",
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Tu ne sais pas combien de notes on te donnera : c est une boucle while."\n' +
        'assert code.count("input(") >= 2, "La question doit etre posee avant la boucle et a chaque tour."\n' +
        'assert "fin" not in output.lower().split("notes")[-1], "fin n est pas une note : elle ne doit pas etre rangee."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        `assert "${AUJOURDHUI.length}" in nombres, "Deux notes ont ete donnees avant fin."`,
    },
  },

  // ── 4. Le piège qui fait rater ce jalon ────────────────────────────────
  texte(
    "<h3>Le piège qui fait rater ce jalon</h3>" +
    "<p>Il y en a un, un seul, et il a déjà coûté cher à beaucoup de monde. Le voici en entier :</p>" +
    "<pre><code>f = open(\"carnet.txt\", \"w\")   ← au démarrage du programme</code></pre>" +
    "<p>Cette ligne-là, posée au début, <strong>arrache les pages avant que tu aies lu quoi que ce soit</strong>. Ton programme marchera très bien toute la séance — et le lendemain, le cahier sera vide.</p>" +
    "<p>L'ordre d'une journée ne se discute pas : <strong>on relit au matin, on travaille, on sauve à la fin.</strong></p>"
  ),

  // ── 5. Le piège en action ──────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Celui qui perd hier sans le savoir",
    context: "Le programme tourne parfaitement. Les notes s'ajoutent, tout s'affiche. Et le lendemain, le cahier ne contient plus que la dernière journée.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 0,
    fix: 'f = open("carnet.txt", "r")',
    explanation: "Le « w » du démarrage a effacé hier avant même la première lecture. Au matin, on ouvre en « r ». Le « w », c'est à la fin, quand on a quelque chose à garder.",
    instructions: [
      'f = open("carnet.txt", "w")',
      "contenu = f.read()",
      "f.close()",
      'notes = contenu.split("\\n")',
    ],
  }),

  // ── 6. Étape 3 : il sauve ──────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p><strong>Troisième étape.</strong> La liste des notes est déjà là, en mémoire. Il faut qu'elle survive.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — sauver les notes dans le cahier, une par ligne, sans rien perdre.<br>" +
        "🧰 <strong>Tu as</strong> — la recette d'écriture, et <code>\\n</code> pour passer à la ligne.<br>" +
        `✅ <strong>C'est réussi quand</strong> — le cahier contient les ${TOTAL} notes, chacune sur sa ligne.</p>` +
        "<p>💡 Un seul <code>open</code> pour toute la liste. Rouvrir à chaque tour effacerait les précédentes.</p>",
      scene: cahier(),
      starter_code:
        `notes = ${JSON.stringify([...HIER, ...AUJOURDHUI])}\n\n` +
        "# Sauve-les toutes dans le cahier, une par ligne.\n",
      hidden_tests:
        'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
        'garde = _vrai_open("carnet.txt").read()\n' +
        'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
        `assert len(lignes) == ${TOTAL}, "Le cahier doit contenir ${TOTAL} lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n` +
        'for n in ["Ama", "Kofi", "Yawa", "Essi", "Kodjo"]:\n' +
        '    assert n in garde, "Il manque " + n + " dans le cahier."',
    },
  },

  // ── 7. Le jalon : les trois étapes dans un seul programme ──────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p><strong>Le carnet, en entier.</strong> Les trois morceaux que tu viens d'écrire, dans le bon ordre, dans un seul programme.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — écrire le carnet de notes complet :</p>" +
        "<ol>" +
        "<li>au démarrage, relire le cahier et dire combien de notes il contenait ;</li>" +
        "<li>demander des notes jusqu'à <code>fin</code> ;</li>" +
        "<li>tout sauver, et annoncer le nouveau total.</li>" +
        "</ol>" +
        "<p>🧰 <strong>Tu as</strong> — les cinq semaines du thème. Aucun outil nouveau.<br>" +
        `✅ <strong>C'est réussi quand</strong> — le cahier contient les ${HIER.length} notes d'hier <strong>et</strong> les nouvelles, et que le programme ne plante pas si le cahier n'existe pas.</p>` +
        "<p>⚠️ Relis <strong>avant</strong> d'ouvrir en <code>\"w\"</code>. C'est le piège, et c'est le seul.</p>",
      scene: cahier(),
      starter_code:
        "# 1. Relire le cahier (il peut ne pas exister).\n" +
        "# 2. Demander des notes jusqu'a fin.\n" +
        "# 3. Tout sauver, et annoncer le total.\n",
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Tu ne sais pas combien de notes on te donnera."\n' +
        'assert "try" in code and "except" in code, "Le premier jour, le cahier n existe pas : il faut un filet."\n' +
        'assert ".split(" in code, "Relire rend un seul texte : il faut le redecouper."\n' +
        'assert ".close(" in code, "Un cahier qu on ne ferme pas ne garde rien."\n' +
        'garde = _vrai_open("carnet.txt").read()\n' +
        'lignes = [l for l in garde.split("\\n") if l.strip()]\n' +
        'for n in ["Ama", "Kofi", "Yawa"]:\n' +
        '    assert n in garde, "Tu as perdu " + n + " : relis le cahier AVANT de l ouvrir en w."\n' +
        'for n in ["Essi", "Kodjo"]:\n' +
        '    assert n in garde, "La note " + n + " n a pas ete sauvee."\n' +
        `assert len(lignes) == ${TOTAL}, "Le cahier doit contenir ${TOTAL} lignes. Il en a " + str(len(lignes)) + " : " + repr(garde)\n` +
        'nombres = re.findall(r"\\d+", output)\n' +
        `assert "${TOTAL}" in nombres, "Ton programme doit annoncer le nouveau total : ${TOTAL} notes."`,
    },
  },

  // ── 8. Le filet, si ça bloque ──────────────────────────────────────────
  texte(
    "<h3>Si tu bloques vingt minutes</h3>" +
    "<p>Ce n'est pas la solution, c'est une question à te poser. Prends-les dans l'ordre, arrête-toi dès que l'une te débloque.</p>" +
    "<ul>" +
    "<li><strong>Rien ne s'affiche au démarrage ?</strong> As-tu bien ouvert en <code>\"r\"</code> — et pas en <code>\"w\"</code> ?</li>" +
    "<li><strong>Le programme meurt tout de suite ?</strong> Le cahier existe-t-il ? Où est ton filet ?</li>" +
    "<li><strong>Les notes d'hier ont disparu ?</strong> À quel moment ouvres-tu en <code>\"w\"</code> ? Avant ou après avoir lu ?</li>" +
    "<li><strong>Le cahier est vide à la fin ?</strong> L'as-tu refermé ?</li>" +
    "<li><strong>Tout est sur une seule ligne ?</strong> Où sont les <code>\\n</code> ?</li>" +
    "</ul>" +
    "<p>Et si aucune ne t'aide, appelle — mais seulement après les avoir toutes essayées.</p>"
  ),

  // ── 9. Coche toi-même ──────────────────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "La grille, dans l'ordre où tu la vérifies",
    description: "Remets les cinq vérifications dans l'ordre où tu peux les faire, de la première à la dernière.",
    hint: "On ne peut pas vérifier qu'un carnet se souvient avant de l'avoir rempli une première fois.",
    items: [
      "1. Je lance : les notes d'hier s'affichent",
      "2. Je tape deux notes, puis fin",
      "3. Le programme annonce le nouveau total",
      "4. Je relance le programme",
      "5. Mes deux notes sont toujours là",
    ],
  }),

  // ── 10. Le montrer ─────────────────────────────────────────────────────
  texte(
    "<h3>Montre-le à quelqu'un</h3>" +
    "<p>Un jalon qui ne se montre pas a raté sa cible. Voici quoi dire, dans l'ordre — ça dure une minute, et tu n'as pas à improviser :</p>" +
    "<ol>" +
    "<li>« J'ai fait un carnet de notes. Regarde ce qu'il a gardé d'hier. » <em>(tu lances, les notes s'affichent)</em></li>" +
    "<li>« Donne-moi un nom et une note. » <em>(tu laisses la personne la taper)</em></li>" +
    "<li>« Maintenant je ferme tout. » <em>(tu tapes fin)</em></li>" +
    "<li>« Et je rouvre. » <em>(tu relances — sa note est là)</em></li>" +
    "</ol>" +
    "<p>C'est le quatrième moment qui compte. Celui où la personne en face comprend que <strong>ton programme se souvient</strong>.</p>"
  ),

  // ── 11. Ce que tu viens de prouver ─────────────────────────────────────
  texte(
    "<h3>Ce que tu viens de prouver</h3>" +
    "<p>Que tu sais écrire un programme qui <strong>tient debout</strong> : il tourne tant qu'on a besoin de lui, il accepte ce qu'un humain tape de travers, il ne meurt pas sur une surprise, et il n'oublie rien.</p>" +
    "<p>C'est exactement le nom du thème que tu viens de terminer. Et ce n'est pas un hasard.</p>" +
    "<h3>La suite</h3>" +
    "<p>Le prochain thème s'appelle <strong>« Je crée des jeux »</strong>. Devine le nombre, une aventure dont tu écris les chemins, un programme à qui on parle.</p>" +
    "<p>Tout ce que tu viens d'apprendre va servir : une partie attend le joueur, un joueur tape n'importe quoi, et un score se garde d'une partie à l'autre.</p>"
  ),
];

// ── Le banc ──────────────────────────────────────────────────────────────
const PRELUDE = (prerempli) =>
  "import os, tempfile\n" +
  "os.chdir(tempfile.mkdtemp())\n" +
  "_vrai_open = open\n" +
  "_journal = []\n" +
  (prerempli ? `_f = _vrai_open("carnet.txt", "w")\n_f.write(${JSON.stringify(CONTENU_HIER)})\n_f.close()\n` : "");

const LIRE = (dedans) =>
  "try:\n" +
  '    f = open("carnet.txt", "r")\n    contenu = f.read()\n    f.close()\n' +
  "except FileNotFoundError:\n" +
  '    contenu = ""\n' +
  "notes = []\n" +
  'for l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n' +
  (dedans ?? "");

const SOLUTIONS = {
  2: { prelude: PRELUDE(true), cas: [
    { nom: "juste", attendu: "ok", code:
      LIRE("for n in notes:\n    print(n)\n") },
    { nom: "oublie de decouper", attendu: "test raté", code:
      'f = open("carnet.txt", "r")\nprint(f.read())\nf.close()\n' },
  ] },
  3: {
    prelude: PRELUDE(false),
    reponses: [...AUJOURDHUI, "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "notes = []\n" +
        'reponse = input("Note (ou fin) : ")\n' +
        'while reponse != "fin":\n    notes.append(reponse)\n    reponse = input("Note (ou fin) : ")\n' +
        'print("Notes recues :", len(notes))\n' },
      { nom: "compte fin comme une note", attendu: "test raté", code:
        "notes = []\n" +
        'reponse = ""\n' +
        'while reponse != "fin":\n    reponse = input("Note (ou fin) : ")\n    notes.append(reponse)\n' +
        'print("Notes recues :", len(notes))\n' },
    ],
  },
  6: { prelude: PRELUDE(false), cas: [
    { nom: "juste", attendu: "ok", code:
      `notes = ${JSON.stringify([...HIER, ...AUJOURDHUI])}\n` +
      'f = open("carnet.txt", "w")\nfor n in notes:\n    f.write(n + "\\n")\nf.close()\n' },
    { nom: "rouvre a chaque tour", attendu: "test raté", code:
      `notes = ${JSON.stringify([...HIER, ...AUJOURDHUI])}\n` +
      'for n in notes:\n    f = open("carnet.txt", "w")\n    f.write(n + "\\n")\n    f.close()\n' },
  ] },
  7: {
    prelude: PRELUDE(true),
    reponses: [...AUJOURDHUI, "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        LIRE('print("Hier :", len(notes), "notes")\n' +
          'reponse = input("Note (ou fin) : ")\n' +
          'while reponse != "fin":\n    notes.append(reponse)\n    reponse = input("Note (ou fin) : ")\n' +
          'f = open("carnet.txt", "w")\nfor n in notes:\n    f.write(n + "\\n")\nf.close()\n' +
          'print("Total :", len(notes))\n') },
      // Le piège du jalon, en vrai : il ouvre en "w" avant d'avoir relu, et
      // les notes d'hier disparaissent sans un mot.
      { nom: "ouvre en w avant de relire", attendu: "test raté", code:
        'f = open("carnet.txt", "w")\nnotes = []\n' +
        'reponse = input("Note (ou fin) : ")\n' +
        'while reponse != "fin":\n    notes.append(reponse)\n    reponse = input("Note (ou fin) : ")\n' +
        'for n in notes:\n    f.write(n + "\\n")\nf.close()\n' +
        'print("Total :", len(notes))\n' },
      { nom: "oublie le filet du premier jour", attendu: "test raté", code:
        'f = open("carnet.txt", "r")\ncontenu = f.read()\nf.close()\n' +
        'notes = []\nfor l in contenu.split("\\n"):\n    if l != "":\n        notes.append(l)\n' +
        'reponse = input("Note (ou fin) : ")\n' +
        'while reponse != "fin":\n    notes.append(reponse)\n    reponse = input("Note (ou fin) : ")\n' +
        'f = open("carnet.txt", "w")\nfor n in notes:\n    f.write(n + "\\n")\nf.close()\n' +
        'print("Total :", len(notes))\n' },
    ],
  },
};

const OBJECTIFS = CRITERES.slice(0, 4).map((c) => `Réussi si ${c}`);
const ACQUIS = "fabriquer seul un carnet qui garde ce qu'on lui confie, et le retrouver intact le lendemain";

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\bwith\b/, /\.upper\(/, /\bfinally\b/, /\braise\b/, /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  const visible = JSON.stringify({ ...c, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} contient ${rx} — jamais enseigné`);
  if (b.type === "text" && (c.html ?? "").replace(/<[^>]+>/g, "").trim().length < 80) mauvais(`bloc ${i} : texte trop court`);
  if (b.type === "code_challenge") {
    if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`bloc ${i} : défi incomplet`);
    if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`bloc ${i} : l'amorce finit sur un bloc vide`);
    for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
      if (!c.instructions.includes(champ)) mauvais(`bloc ${i} : le sujet n'a pas de « ${champ} »`);
  }
  if (c.game_type === "bug_hunt") {
    if (!c.instructions?.[c.bug_index] || c.instructions[c.bug_index] === c.fix) mauvais(`bloc ${i} : chasse au bug incohérente`);
    if (!c.explanation) mauvais(`bloc ${i} : sans explication`);
  }
  if (c.game_type === "sort" && (!c.items || new Set(c.items).size !== c.items.length || !c.hint))
    mauvais(`bloc ${i} : tri incomplet`);
});
// Un jalon n'enseigne rien de neuf : aucun bloc ne doit introduire un mot que
// le thème n'a pas déjà donné.
const NEUF = [/\.sort\(/, /\.join\(/, /\.split\("\s*,/, /\bdict\(/, /\bset\(/, /\blambda\b/];
BLOCS.forEach((b, i) => {
  const visible = JSON.stringify({ ...b.content, hidden_tests: undefined });
  for (const rx of NEUF) if (rx.test(visible)) mauvais(`bloc ${i} : ${rx} est une notion neuve — interdit dans un jalon`);
});
if (!BLOCS[1].content.html.includes(CRITERES[4].slice(3))) mauvais("la grille ne montre pas le critère décisif");
if (ACQUIS.length < 10 || ACQUIS.length > 160) mauvais(`acquis : ${ACQUIS.length} caractères`);
if (/^[A-ZÀ-Ý]/.test(ACQUIS) || ACQUIS.endsWith(".")) mauvais("acquis : ni majuscule ni point final");

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${BLOCS.length} blocs · ${BLOCS.filter((b) => b.type === "code_challenge").length} étapes de code · ${CRITERES.length} critères · aucune notion neuve`);
dire(`✓ ${HIER.length} notes d'hier + ${AUJOURDHUI.length} du jour = ${TOTAL} lignes au cahier`);

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
ok(ap.filter((b) => b.type === "code_challenge").every((b) => b.content.hidden_tests), "chaque étape garde ses tests");
const relu = (await g("lessons", "objectives,acquis,status", (q) => q.eq("id", L.id)))[0];
ok(relu.objectives?.length === 4 && relu.acquis === ACQUIS && relu.status === "published", "objectifs, acquis et statut");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
