/**
 * Les quatre entraînements de « Quand ça plante ».
 *
 *     node scripts/batisseur-t2-s3-entrainements.mjs [--ecrire] [--refaire] [--banc]
 *
 * Un par objectif :
 *
 *   0. Avec filet, sans filet     obj. 2 — une erreur emporte toute la suite
 *   1. Ce qui est sauté           obj. 3 — où s'arrête le try quand ça casse
 *   2. Rattraper n'est pas ignorer obj. 4 — un except qui ne décide rien
 *   3. Le compteur de refus       obj. 1 — le filet qui sert à quelque chose
 */
import { base, lecteur, kodi, banc, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Quand ça plante";

// ── Garde-fous ───────────────────────────────────────────────────────────
const nettoyable = (p) => /^\d+$/.test(p.replace(/[ F.]/g, ""));
const FILE = ["1200", "quatre cents", "2 300", "mille", "900"];
const SERVIS = FILE.filter(nettoyable), REFUSES = FILE.filter((p) => !nettoyable(p));
const CAISSE = SERVIS.reduce((a, p) => a + Number(p.replace(/[ F.]/g, "")), 0);
if (CAISSE !== 4400 || REFUSES.length !== 2) throw new Error(`caisse ${CAISSE}, ${REFUSES.length} refusés`);
if (FILE.length > 5) throw new Error("le décor ne montre que 5 billets");

const EXOS = [
  {
    title: "Avec filet, sans filet",
    description: "Douze situations. Dans chacune, la file continue — ou tout s'éteint.",
    xp: 30,
    blocs: [
      kodi("<p>Une erreur non rattrapée n'arrête pas la ligne : elle arrête <strong>tout ce qui vient après</strong>.</p><p>Avec un filet, elle n'arrête que le tour en cours. Range chaque situation du bon côté.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "La file continue, ou tout s'éteint ?",
          instruction: "Après ça, le client suivant sera-t-il servi ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Pas d'erreur du tout → la file continue, évidemment.",
              "Une erreur DANS un try, avec un except qui l'attend → le tour s'arrête, la file continue.",
              "Une erreur sans filet, ou hors du try → tout s'éteint.",
              "Un except qui attend une AUTRE erreur que celle qui arrive ne rattrape rien.",
            ],
          },
          categories: [
            { id: "continue", label: "La file continue", emoji: "🟢", color: "#10b981" },
            { id: "eteint", label: "Tout s'éteint", emoji: "💡", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Un papier lisible, sans filet", correct: "continue", hint: "Aucune erreur : il n'y a rien à rattraper." },
            { id: "b", emoji: "2️⃣", label: "Un papier illisible, sans filet", correct: "eteint", hint: "C'est le cas de la séance : la boutique s'éteint, les suivants rentrent chez eux." },
            { id: "c", emoji: "3️⃣", label: "Un papier illisible, dans un try avec except ValueError", correct: "continue", hint: "Le filet attrape, le tour s'arrête, la boucle repart." },
            { id: "d", emoji: "4️⃣", label: "int() appelé APRÈS le except, sur un papier illisible", correct: "eteint", hint: "Hors du try, rien n'est protégé — même si le filet est juste au-dessus." },
            { id: "e", emoji: "5️⃣", label: "Un papier lisible, dans un try", correct: "continue", hint: "Le filet ne gêne pas quand tout va bien : il attend, c'est tout." },
            { id: "f", emoji: "6️⃣", label: "Un papier vide, dans un try avec except ValueError", correct: "continue", hint: "Un texte vide ne devient pas un nombre : c'est bien une ValueError, et elle est attendue." },
            { id: "g", emoji: "7️⃣", label: "Le try est écrit, mais la ligne dangereuse est restée dehors", correct: "eteint", hint: "Un abri qui ne contient rien n'abrite personne." },
            { id: "h", emoji: "8️⃣", label: "Un papier illisible, avec except FileNotFoundError", correct: "eteint", hint: "Le filet attend une autre erreur que celle qui arrive : il laisse passer." },
            { id: "i", emoji: "9️⃣", label: "Un papier nettoyé avant d'être converti", correct: "continue", hint: "Nettoyé, il devient un nombre : aucune erreur à rattraper." },
            { id: "j", emoji: "🔟", label: "« deux mille » nettoyé puis converti, sans filet", correct: "eteint", hint: "Aucun nettoyage ne sauve celui-là. Sans filet, c'est fini." },
            { id: "k", emoji: "🅰️", label: "Le except contient refuser(papier)", correct: "continue", hint: "Le filet attrape et décide : exactement son travail." },
            { id: "l", emoji: "🅱️", label: "Le except est écrit, mais le papier est lisible", correct: "continue", hint: "Il ne se passe rien de spécial : le filet n'a pas servi, et c'est très bien." },
          ],
        },
      },
    ],
  },

  {
    title: "Ce qui est sauté",
    description: "Six phrases sur un filet de trois lignes, dont une casse.",
    xp: 40,
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Le papier vaut <code>\"mille\"</code>. Voici ce que fait le programme, ligne par ligne.</p>" +
            "<pre><code>1  try:\n" +
            "2      montant = int(papier)\n" +
            "3      caisse = caisse + montant\n" +
            "4      encaisser(papier)\n" +
            "5  except ValueError:\n" +
            "6      refuser(papier)\n" +
            "7  print(\"Client suivant\")</code></pre>" +
            "<p>Ne le modifie pas. Suis Python du doigt.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Qui tourne, qui est sauté",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La ligne 2", after: ".", options: ["casse", "tourne normalement", "est sautée"], correct: 0,
              explanation: "int(\"mille\") est impossible : c'est là que ça casse." },
            { id: "s2", before: "La ligne 3", after: ".", options: ["est sautée", "tourne quand même", "casse aussi"], correct: 0,
              explanation: "Dès qu'une ligne casse dans un try, Python saute tout le reste du try." },
            { id: "s3", before: "La ligne 4", after: ".", options: ["est sautée", "tourne", "casse"], correct: 0,
              explanation: "Et c'est heureux : le tiroir ne sonne pas pour un papier qu'on n'a pas su lire." },
            { id: "s4", before: "La ligne 6", after: ".", options: ["tourne", "est sautée", "casse"], correct: 0,
              explanation: "C'est le except, et il ne tourne QUE quand l'erreur attendue est arrivée." },
            { id: "s5", before: "La ligne 7", after: ".", options: ["tourne", "est sautée", "casse"], correct: 0,
              explanation: "Elle est en dehors du try, après le except : le programme a repris son cours normal." },
            { id: "s6", before: "Si le papier valait « 1200 », la ligne 6", after: ".", options: ["serait sautée", "tournerait aussi", "casserait"], correct: 0,
              explanation: "Pas d'erreur, pas de except. Le filet reste au repos." },
          ],
        },
      },
    ],
  },

  {
    title: "Rattraper n'est pas ignorer",
    description: "Sept façons de remplir un except. Toutes ne se valent pas.",
    xp: 40,
    blocs: [
      kodi("<p>Un filet qui attrape sans rien décider rend le programme <strong>silencieux et faux</strong> : la lumière reste allumée, et la caisse ment.</p><p>Relie chaque except à ce qu'il coûte vraiment.</p>"),
      {
        type: "match",
        content: {
          title: "Qu'est-ce que ça coûte ?",
          instruction: "Touche un except, puis ce qu'il coûte.",
          left_label: "Dans le except",
          right_label: "Ce que ça coûte",
          pairs: [
            { left: "refuser(papier)", right: "Rien : le client est prévenu, le patron aussi" },
            { left: "caisse = caisse + 0", right: "Le papier disparaît sans laisser de trace" },
            { left: "encaisser(papier)", right: "Le tiroir sonne pour de l'argent jamais reçu" },
            { left: "refuses = refuses + 1", right: "On sait combien, mais le client n'est pas prévenu" },
            { left: "caisse = caisse + 1000", right: "Un montant inventé entre dans la caisse" },
            { left: 'print("Papier illisible")', right: "Le mentor voit le problème dans la console" },
            { left: "Un except vide d'instructions", right: "Python refuse même de lancer le programme" },
          ],
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Un seul papier, et il est illisible : <code>\"mille\"</code>. Ton filet doit faire deux choses, pas une.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — rattraper l'erreur, afficher <code>Papier illisible</code>, et laisser la caisse à zéro.<br>" +
            "🧰 <strong>Tu as</strong> — <code>try</code>, <code>except ValueError</code>, et la caisse déjà posée.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le programme ne meurt pas, le message s'affiche, et la caisse vaut toujours 0.</p>",
          starter_code:
            "caisse = 0\n" +
            'papier = "mille"\n\n' +
            "# Essaie de l'encaisser. Si ca casse, dis-le — et n'invente rien.\n",
          hidden_tests:
            "import re\n" +
            'assert "try" in code and "except" in code, "Sans filet, le programme meurt sur ce papier."\n' +
            'assert "illisible" in output.lower(), "Le filet doit DIRE ce qu il a attrape."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "0" in nombres or "caisse" not in output.lower(), "La caisse doit rester a 0 : on n invente pas un montant."\n' +
            'assert caisse == 0, "La caisse vaut " + str(caisse) + " alors qu aucun papier n a ete encaisse."',
        },
      },
    ],
  },

  {
    title: "Le compteur de refus",
    description: "Cinq papiers, deux illisibles, et un patron qui veut des chiffres.",
    xp: 50,
    blocs: [
      kodi("<p>Un filet qui décide, c'est bien. Un filet qui <strong>compte</strong>, c'est ce qu'un patron demande le soir.</p><p>Combien j'ai encaissé, et combien de papiers je n'ai pas pu lire ?</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            `<p>Cinq papiers sur le comptoir, et deux écrits en toutes lettres : <code>quatre cents</code> et <code>mille</code>.</p>` +
            "<p>🎯 <strong>Ta mission</strong> — encaisser ceux qui se laissent lire, refuser les autres, et annoncer trois chiffres : la caisse, les servis, les refusés.<br>" +
            "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, <code>encaisser</code>, <code>refuser</code>, le filet, et <code>.replace()</code> pour les espaces.<br>" +
            `✅ <strong>C'est réussi quand</strong> — la caisse affiche ${CAISSE}, avec ${SERVIS.length} servis et ${REFUSES.length} refusés.</p>`,
          scene: { decor: "etal", reglages: { papiers: FILE }, plafond: 200 },
          starter_code:
            "caisse = 0\nservis = 0\nrefuses = 0\n\n" +
            "# Essaie d'encaisser chaque papier. Si ca casse, refuse et compte.\n",
          hidden_tests:
            "import re\n" +
            'enc = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
            'ref = [e for e in _journal if e["quoi"] == "refuser"]\n' +
            'assert "try" in code and "except" in code, "Deux papiers illisibles : sans filet, tout s eteint au deuxieme."\n' +
            `assert len(enc) == ${SERVIS.length}, "Il y a ${SERVIS.length} papiers lisibles : ton programme en a encaisse " + str(len(enc)) + "."\n` +
            `assert len(ref) == ${REFUSES.length}, "Il y a ${REFUSES.length} papiers illisibles : ton programme en a refuse " + str(len(ref)) + "."\n` +
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'final = " ".join(lignes[-3:])\n' +
            'nombres = re.findall(r"\\d+", final)\n' +
            `assert "${CAISSE}" in nombres, "La caisse fait ${CAISSE} F. La fin de ta sortie montre : " + (" ".join(nombres) or "aucun nombre")\n` +
            `assert "${SERVIS.length}" in nombres and "${REFUSES.length}" in nombres, "Il faut annoncer les servis ET les refuses."`,
        },
      },
    ],
  },
];

const PRELUDE_ETAL =
  "_journal = []\n" +
  "papiers = " + JSON.stringify(FILE) + "\n" +
  "def encaisser(p):\n" + '    _journal.append({"quoi": "encaisser", "papier": str(p)})\n' +
  "def refuser(p):\n" + '    _journal.append({"quoi": "refuser", "papier": str(p)})\n';

const SOLUTIONS = {
  "Rattraper n'est pas ignorer": { cas: [
    { nom: "juste", attendu: "ok", code:
      'caisse = 0\npapier = "mille"\ntry:\n    caisse = caisse + int(papier)\nexcept ValueError:\n    print("Papier illisible")\n' },
    { nom: "sans filet", attendu: "plante", code:
      'caisse = 0\npapier = "mille"\ncaisse = caisse + int(papier)\n' },
    // Le filet attrape, se tait, et invente un montant : la caisse ment.
    { nom: "invente un montant", attendu: "test raté", code:
      'caisse = 0\npapier = "mille"\ntry:\n    caisse = caisse + int(papier)\nexcept ValueError:\n    caisse = caisse + 1000\n    print("Papier illisible")\n' },
  ] },
  "Le compteur de refus": {
    prelude: PRELUDE_ETAL,
    cas: [
      { nom: "juste", attendu: "ok", code:
        "caisse = 0\nservis = 0\nrefuses = 0\n" +
        "for papier in papiers:\n    try:\n" +
        '        p = papier.replace(" ", "")\n        caisse = caisse + int(p)\n' +
        "        servis = servis + 1\n        encaisser(papier)\n" +
        "    except ValueError:\n        refuses = refuses + 1\n        refuser(papier)\n" +
        'print("Caisse :", caisse)\nprint("Servis :", servis)\nprint("Refuses :", refuses)\n' },
      { nom: "sans filet", attendu: "plante", code:
        "caisse = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    caisse = caisse + int(p)\n    encaisser(papier)\n' +
        'print("Caisse :", caisse)\n' },
      { nom: "oublie de nettoyer l espace", attendu: "test raté", code:
        "caisse = 0\nservis = 0\nrefuses = 0\n" +
        "for papier in papiers:\n    try:\n" +
        "        caisse = caisse + int(papier)\n        servis = servis + 1\n        encaisser(papier)\n" +
        "    except ValueError:\n        refuses = refuses + 1\n        refuser(papier)\n" +
        'print("Caisse :", caisse)\nprint("Servis :", servis)\nprint("Refuses :", refuses)\n' },
    ],
  },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\.split\(/, /\.join\(/, /\.upper\(/, /\bopen\(/, /\bfinally\b/, /\braise\b/,
  /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
for (const e of EXOS) {
  if (e.palier !== undefined) mauvais(`${e.title} : pas de palier sur un entraînement de parcours`);
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
      if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`${e.title} : amorce finissant sur un bloc vide`);
      for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
        if (!c.instructions.includes(champ)) mauvais(`${e.title} : le sujet n'a pas de « ${champ} »`);
    }
  }
}
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${EXOS.length} entraînements · caisse vérifiée : ${CAISSE} F, ${SERVIS.length} servis, ${REFUSES.length} refusés`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquerParcours(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
