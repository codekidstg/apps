/**
 * Bâtisseur — thème 2, séance 3 : « Quand ça plante ».
 *
 *     node scripts/batisseur-t2-s3-quand-ca-plante.mjs [--ecrire] [--refaire] [--banc]
 *
 * La séance 2 s'est terminée sur le papier qui résiste : « deux mille ». Aucun
 * nettoyage ne le sauve, et `int()` meurt dessus à chaque fois. Celle-ci
 * commence exactement là.
 *
 * Un seul outil neuf : `try / except ValueError`. Et une seule idée derrière,
 * que le décor de l'étal montre mieux que n'importe quelle phrase :
 *
 *   une erreur non rattrapée n'arrête pas la ligne, elle éteint tout ce
 *   qui vient après.
 *
 * Le piège central n'est pas la syntaxe, c'est la tentation : un `except` qui
 * ne fait rien rend le programme silencieux et faux. Rattraper n'est pas
 * ignorer — il faut dire ce qu'on fait du cas refusé.
 *
 * `except` tout court n'est pas enseigné : seulement `except ValueError`. Un
 * filet qui attrape tout attrape aussi les erreurs qu'on voulait voir, et
 * c'est une leçon d'Architecte, pas de Bâtisseur.
 *
 * Restent interdits : .split(), .join(), les f-strings, open(), break,
 * True/False, += et liste[0].
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Quand ça plante";

// ── Garde-fous arithmétiques ─────────────────────────────────────────────
const nettoyable = (p) => /^\d+$/.test(p.replace(/[ F.]/g, ""));
const valeur = (p) => Number(p.replace(/[ F.]/g, ""));
const bilan = (ps) => ({
  servis: ps.filter(nettoyable).length,
  refuses: ps.filter((p) => !nettoyable(p)).length,
  caisse: ps.filter(nettoyable).reduce((a, p) => a + valeur(p), 0),
});

const FILE_1 = ["2000", "1 500", "deux mille", "800"];
const FILE_2 = ["3000", "deux mille", "1 500", "cinq cents", "750"];
const B1 = bilan(FILE_1), B2 = bilan(FILE_2);
if (B1.caisse !== 4300 || B1.refuses !== 1) throw new Error(`file 1 : ${B1.caisse} F et ${B1.refuses} refusé(s)`);
if (B2.caisse !== 5250 || B2.refuses !== 2) throw new Error(`file 2 : ${B2.caisse} F et ${B2.refuses} refusé(s)`);
// Chaque file doit contenir au moins un papier IMPOSSIBLE à nettoyer : sans
// lui, le filet ne sert à rien et la séance n'a pas d'objet.
for (const [nom, f] of [["file 1", FILE_1], ["file 2", FILE_2]])
  if (f.every(nettoyable)) throw new Error(`${nom} : aucun papier ne résiste, le try/except est décoratif`);
// Et le décor ne sait empiler que cinq billets.
for (const f of [FILE_1, FILE_2]) if (f.length > 5) throw new Error(`${f.length} papiers, le décor n'en montre que 5`);

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });
const etal = (papiers) => ({ decor: "etal", reglages: { papiers }, plafond: 200 });

const BLOCS = [
  // ── 0. L'accroche : la boutique éteinte ────────────────────────────────
  texte(
    "<h3>Le papier qui a éteint la boutique</h3>" +
    "<p>La semaine dernière, tu as appris à nettoyer les papiers sales. Tu les as tous sauvés — sauf un. Un client avait écrit <strong>deux mille</strong>, en toutes lettres.</p>" +
    "<p>Enlève les espaces, mets en petites lettres, essaie tout ce que tu veux : <code>int()</code> meurt dessus à chaque fois.</p>" +
    "<p>Et ce n'est pas le pire. Quand <code>int()</code> meurt, <strong>il n'emporte pas seulement sa ligne : il emporte tout ce qui devait venir après</strong>. Les clients de la file n'ont jamais été servis. Ils sont rentrés chez eux.</p>"
  ),

  // ── 1. Le geste : mettre les lignes dangereuses à l'abri ───────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Le filet est déjà posé dans ton programme — <code>try</code> en haut, <code>except</code> en bas. Mais <strong>les deux lignes qui peuvent casser sont restées dehors</strong>, et la boutique s'éteint quand même.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — mettre à l'abri les deux lignes dangereuses, pour que toute la file passe.<br>" +
        "🧰 <strong>Tu as</strong> — le filet déjà écrit. Aucune ligne nouvelle à inventer : il faut <strong>décaler deux lignes vers la droite</strong>, de quatre espaces, pour qu'elles entrent dans le <code>try</code>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — la lumière reste allumée, trois clients sont encaissés et le quatrième est refusé poliment.</p>",
      scene: etal(FILE_1),
      starter_code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        "    try:\n" +
        '        propre = papier.replace(" ", "")\n' +
        "    except ValueError:\n" +
        "        refuser(papier)\n" +
        "    caisse = caisse + int(propre)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n',
      hidden_tests:
        'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
        'refuses = [e for e in _journal if e["quoi"] == "refuser"]\n' +
        `assert len(encaisses) == ${B1.servis}, "Il y a ${B1.servis} papiers lisibles : ton programme en a encaisse " + str(len(encaisses)) + "."\n` +
        `assert len(refuses) == ${B1.refuses}, "Le papier illisible doit etre refuse poliment, pas oublie."\n` +
        `assert "${B1.caisse}" in output, "La caisse doit afficher ${B1.caisse} : seuls les papiers lisibles comptent."`,
    },
  },

  // ── 2. L'explication, après le geste ───────────────────────────────────
  texte(
    "<h3>Essaie — et si ça casse, fais ça</h3>" +
    "<p><code>try</code> veut dire « essaie ». <code>except</code> veut dire « si ça a cassé ». C'est tout.</p>" +
    "<pre><code>try:\n" +
    "    montant = int(papier)   ← la ligne qui peut mourir\n" +
    "    encaisser(papier)\n" +
    "except ValueError:\n" +
    "    refuser(papier)         ← ce qu'on fait à la place</code></pre>" +
    "<p>Sans filet, l'erreur arrête <strong>tout le programme</strong>. Avec le filet, elle arrête seulement <strong>le tour en cours</strong>, et la boucle continue avec le client suivant.</p>" +
    "<p><code>ValueError</code>, c'est le nom de cette erreur-là : « ce texte ne peut pas devenir un nombre ». On nomme l'erreur qu'on attend, pour ne pas attraper celles qu'on n'avait pas prévues.</p>"
  ),

  // ── 3. Les trois mots à leur place ─────────────────────────────────────
  jeu({
    game_type: "fill_blank",
    title: "Le filet, mot à mot",
    template:
      "[___]:\n" +
      "    montant = int(papier)\n" +
      "[___] ValueError:\n" +
      "    refuser(papier)",
    blanks: ["try", "except"],
  }),

  // ── 4. Vérification du mécanisme ───────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Sans filet, un papier illisible arrête quoi ?",
          choices: ["Seulement la ligne qui a cassé", "Tout le programme, et la suite n'arrive jamais", "Rien, le programme continue"], answer: 1,
          explanation: "C'est toute la leçon : l'erreur emporte la suite. Les clients d'après ne sont jamais servis." },
        { question: "Avec un try / except dans une boucle, un papier illisible arrête quoi ?",
          choices: ["Le tour en cours, et la boucle continue", "Tout le programme quand même", "La boucle entière"], answer: 0,
          explanation: "Le filet ne sauve pas le papier : il sauve les suivants." },
        { question: "À quoi sert le mot ValueError après except ?",
          choices: ["À décorer", "À dire quelle erreur on attend", "À afficher un message"], answer: 1,
          explanation: "On nomme l'erreur qu'on attend. Un filet qui attrape tout attrape aussi ce qu'on n'avait pas prévu." },
        { question: "Où faut-il mettre la ligne qui peut casser ?",
          choices: ["Dans le try", "Dans le except", "Après le except"], answer: 0,
          explanation: "Le try est l'abri. Ce qui est dehors n'est pas protégé, même si le filet est juste à côté." },
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
        "<p>Même file, éditeur vide. Quatre papiers, dont un que personne ne peut lire.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — encaisser tous ceux qui sont lisibles, refuser l'autre, et annoncer la caisse. La boutique ne doit pas s'éteindre.<br>" +
        "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, <code>encaisser(papier)</code>, <code>refuser(papier)</code>, et le filet <code>try / except ValueError</code>.<br>" +
        `✅ <strong>C'est réussi quand</strong> — la lumière reste allumée et que la caisse affiche ${B1.caisse}.</p>` +
        "<p>💡 Nettoie d'abord, convertis ensuite — et mets les deux à l'abri.</p>",
      scene: etal(FILE_1),
      starter_code:
        "caisse = 0\n\n" +
        "# Pour chaque papier : essaie de l'encaisser, et si ca casse, refuse-le.\n",
      hidden_tests:
        'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
        'refuses = [e for e in _journal if e["quoi"] == "refuser"]\n' +
        'assert "try" in code, "Sans filet, un seul papier illisible eteint la boutique."\n' +
        'assert "except" in code, "Un try sans except ne protege rien."\n' +
        `assert len(encaisses) == ${B1.servis}, "Il y a ${B1.servis} papiers lisibles : ton programme en a encaisse " + str(len(encaisses)) + "."\n` +
        `assert len(refuses) == ${B1.refuses}, "Le papier illisible doit etre refuse, pas oublie."\n` +
        `assert "${B1.caisse}" in output, "La caisse doit afficher ${B1.caisse}."`,
    },
  },

  // ── 6. L'ordre des lignes ──────────────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets le filet dans l'ordre",
    description: "Ce programme sert un client, et survit à son papier illisible.",
    hint: "Le filet se pose avant la ligne dangereuse, jamais après. Et ce qu'on fait en cas de casse vient tout à la fin.",
    items: [
      "try:",
      '    montant = int(papier)',
      "    encaisser(papier)",
      "except ValueError:",
      "    refuser(papier)",
    ],
  }),

  // ── 7. Le piège de la séance ───────────────────────────────────────────
  texte(
    "<h3>Rattraper n'est pas ignorer</h3>" +
    "<p>Le filet est posé, la boutique reste allumée, le programme ne devient jamais rouge. Tout va bien ?</p>" +
    "<pre><code>except ValueError:\n" +
    "    caisse = caisse + 0       ← on fait semblant\n" +
    "    encaisser(papier)         ← pire : on encaisse quand même</code></pre>" +
    "<p>Un <code>except</code> qui ne dit rien de ce qu'il attrape est <strong>le pire des deux mondes</strong> : le programme a l'air de marcher, et il se trompe en silence. Le soir, la caisse ne tombe pas juste, et personne ne sait pourquoi.</p>" +
    "<p>Un filet sert à <strong>décider</strong> quoi faire du cas raté — le refuser, le compter, le mettre de côté. Pas à faire comme s'il n'avait pas existé.</p>"
  ),

  // ── 8. Le piège en action ──────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Celui qui encaisse les papiers illisibles",
    context: "La lumière reste allumée, et pourtant la caisse du soir est fausse de 2 000 F. Personne ne comprend pourquoi.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 4,
    fix: "        refuser(papier)",
    explanation: "Le filet attrape bien l'erreur… puis encaisse le papier quand même, comme si de rien n'était. Le client n'a pourtant rien payé de lisible. Rattraper, c'est décider — pas faire semblant.",
    instructions: [
      "    try:",
      "        caisse = caisse + int(papier)",
      "        encaisser(papier)",
      "    except ValueError:",
      "        encaisser(papier)",
    ],
  }),

  // ── 9. Ce qui est sauté dans le try ────────────────────────────────────
  texte(
    "<h3>Ce qui vient après l'erreur, dans le try</h3>" +
    "<p>Regarde bien ces trois lignes à l'abri :</p>" +
    "<pre><code>try:\n" +
    "    montant = int(papier)   ← elle casse ici\n" +
    "    caisse = caisse + montant\n" +
    "    encaisser(papier)       ← jamais appelée\n" +
    "except ValueError:\n" +
    "    refuser(papier)</code></pre>" +
    "<p>Quand la première casse, <strong>les deux suivantes sont sautées</strong>. Python ne reprend pas où il s'est arrêté : il saute directement au <code>except</code>.</p>" +
    "<p>C'est une bonne nouvelle, et c'est voulu : la caisse n'est pas augmentée, et le tiroir ne sonne pas pour un papier qu'on n'a pas pu lire.</p>"
  ),

  // ── 10. Le deuxième piège : encaisser hors du filet ────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Celui qui fait sonner le tiroir pour rien",
    context: "Le papier est illisible, il est bien refusé… et le tiroir sonne quand même.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 4,
    fix: "        encaisser(papier)",
    explanation: "La ligne est en dehors du try : elle s'exécute dans tous les cas, même quand le papier vient d'être refusé. Ce qui doit être sauté en cas d'erreur doit se trouver DANS l'abri.",
    instructions: [
      "    try:",
      "        caisse = caisse + int(papier)",
      "    except ValueError:",
      "        refuser(papier)",
      "    encaisser(papier)",
    ],
  }),

  // ── 11. Le défi de la séance : compter les deux ────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>La file du soir : cinq papiers, et <strong>deux</strong> que personne ne peut lire — <code>deux mille</code> et <code>cinq cents</code>, écrits en toutes lettres.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — encaisser les lisibles, refuser les autres, puis annoncer trois chiffres : la caisse, le nombre de clients servis, et le nombre de papiers refusés.<br>" +
        "🧰 <strong>Tu as</strong> — le filet, et deux compteurs à faire monter.<br>" +
        `✅ <strong>C'est réussi quand</strong> — la caisse affiche ${B2.caisse}, avec ${B2.servis} servis et ${B2.refuses} refusés.</p>` +
        "<p>💡 Un patron veut savoir combien de papiers il n'a pas pu lire. C'est à ça que sert un filet qui décide.</p>",
      scene: etal(FILE_2),
      starter_code:
        "caisse = 0\n" +
        "servis = 0\n" +
        "refuses = 0\n\n" +
        "# Essaie d'encaisser. Si ca casse, refuse et compte-le.\n",
      hidden_tests:
        "import re\n" +
        'enc = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
        'ref = [e for e in _journal if e["quoi"] == "refuser"]\n' +
        'assert "try" in code and "except" in code, "Deux papiers illisibles : sans filet, la boutique s eteint au deuxieme."\n' +
        `assert len(enc) == ${B2.servis}, "Il y a ${B2.servis} papiers lisibles : ton programme en a encaisse " + str(len(enc)) + "."\n` +
        `assert len(ref) == ${B2.refuses}, "Il y a ${B2.refuses} papiers illisibles : ton programme en a refuse " + str(len(ref)) + "."\n` +
        'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
        'final = " ".join(lignes[-3:])\n' +
        'nombres = re.findall(r"\\d+", final)\n' +
        `assert "${B2.caisse}" in nombres, "La caisse du soir fait ${B2.caisse} F. La fin de ta sortie montre : " + (" ".join(nombres) or "aucun nombre")\n` +
        `assert "${B2.servis}" in nombres, "Il faut annoncer les ${B2.servis} clients servis."\n` +
        `assert "${B2.refuses}" in nombres, "Il faut annoncer les ${B2.refuses} papiers refuses."`,
    },
  },

  // ── 12. Consolidation ──────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Dans un try de trois lignes, la première casse. Les deux autres ?",
          choices: ["Elles tournent quand même", "Elles sont sautées", "Elles tournent après le except"], answer: 1,
          explanation: "Python saute directement au except. C'est voulu : on n'encaisse pas un papier qu'on n'a pas su lire." },
        { question: "Un except qui ne fait rien du tout, c'est…",
          choices: ["Bien : le programme ne plante plus", "Dangereux : il se trompe en silence", "Impossible à écrire"], answer: 1,
          explanation: "La caisse est fausse et personne ne le sait. Un filet sert à décider, pas à faire semblant." },
        { question: "Où mettre encaisser(papier) pour qu'il ne sonne jamais pour rien ?",
          choices: ["Dans le try, après la conversion", "Après le except", "Dans le except"], answer: 0,
          explanation: "Dans l'abri : si la conversion casse, la ligne est sautée et le tiroir reste fermé." },
        { question: "Le filet sauve-t-il le papier illisible ?",
          choices: ["Oui, il le transforme en nombre", "Non : il sauve les clients SUIVANTS"], answer: 1,
          explanation: "« deux mille » restera illisible pour toujours. Ce que tu sauves, c'est la suite de la file." },
      ],
    },
  },

  // ── 13. Le carnet qui ne meurt plus ────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Ton carnet de ventes de la semaine dernière mourait dès qu'on tapait n'importe quoi. Répare-le.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — saisir des montants jusqu'à <code>fin</code>. Si ce n'est pas un nombre, dire <code>Je n'ai pas compris</code> et continuer. À la fermeture, annoncer le total.<br>" +
        "🧰 <strong>Tu as</strong> — la boucle de la séance 1, le filet de celle-ci, et <code>int()</code>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — une saisie illisible ne tue plus le programme, et que le total ne compte que les vrais montants.</p>" +
        "<p>⚠️ Repose la question <strong>en dehors</strong> du filet. Si tu la mets dedans, une saisie illisible saute la question — et la boucle tourne pour toujours. Tu connais le bouton.</p>",
      starter_code:
        "total = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n\n' +
        "# Tant que ce n'est pas fin : essaie d'ajouter au total,\n" +
        "# et si ca casse, dis-le et continue.\n",
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Tu ne sais pas combien de ventes tu feras : il faut une boucle while."\n' +
        'assert "try" in code and "except" in code, "Une saisie illisible ne doit plus tuer le programme."\n' +
        'assert "compris" in output.lower(), "Quand la saisie est illisible, ton programme doit le dire."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "3500" in nombres, "2000 + 1500 font 3500. Le mot illisible ne compte pas dans le total."',
    },
  },

  // ── 14. Les mots de la séance ──────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la séance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "try:", right: "Essaie ces lignes-là" },
      { left: "except ValueError:", right: "Si ça a cassé, fais plutôt ça" },
      { left: "Une erreur sans filet", right: "Éteint tout ce qui vient après" },
      { left: "Un except vide", right: "Se trompe en silence" },
      { left: "La ligne d'après, dans le try", right: "Sautée quand la première casse" },
    ],
  }),

  // ── 15. Ce qu'il sait faire, et le mur suivant ─────────────────────────
  texte(
    "<h3>Ce que tu sais faire maintenant</h3>" +
    "<p>Écrire un programme qui <strong>survit à n'importe quoi</strong>. Quelqu'un tape « deux mille », une lettre, rien du tout : ton programme refuse poliment, compte le refus, et sert le client suivant.</p>" +
    "<p>Tu sais aussi qu'un filet qui ne décide rien est pire qu'une erreur : au moins, l'erreur se voit.</p>" +
    "<h3>La semaine prochaine</h3>" +
    "<p>Ton carnet tient debout. Il encaisse, il refuse, il compte, il ne meurt plus.</p>" +
    "<p>Et puis tu fermes la fenêtre. <strong>Tout a disparu.</strong> La caisse, les ventes, les refus : évaporés. Demain matin, tu recommences à zéro, comme si la journée d'hier n'avait jamais eu lieu.</p>" +
    "<p>La semaine prochaine, tu apprends à <strong>garder</strong>.</p>"
  ),
];

// ── Le banc ──────────────────────────────────────────────────────────────
const PRELUDE_ETAL = (papiers) =>
  "_journal = []\n" +
  "papiers = " + JSON.stringify(papiers) + "\n" +
  "def encaisser(papier):\n" +
  '    _journal.append({"quoi": "encaisser", "papier": str(papier)})\n' +
  "def refuser(papier):\n" +
  '    _journal.append({"quoi": "refuser", "papier": str(papier)})\n';

const JUSTE_1 =
  "caisse = 0\n" +
  "for papier in papiers:\n" +
  "    try:\n" +
  '        propre = papier.replace(" ", "")\n' +
  "        caisse = caisse + int(propre)\n" +
  "        encaisser(papier)\n" +
  "    except ValueError:\n" +
  "        refuser(papier)\n" +
  'print("Caisse :", caisse)\n';

const SOLUTIONS = {
  1: { prelude: PRELUDE_ETAL(FILE_1), cas: [
    { nom: "juste", attendu: "ok", code: JUSTE_1 },
    // L'amorce telle quelle : le filet est posé, mais à côté de la plaque.
    { nom: "les lignes restent dehors", attendu: "plante", code:
      "caisse = 0\nfor papier in papiers:\n    try:\n" +
      '        propre = papier.replace(" ", "")\n' +
      "    except ValueError:\n        refuser(papier)\n" +
      "    caisse = caisse + int(propre)\n    encaisser(papier)\n" +
      'print("Caisse :", caisse)\n' },
    { nom: "encaisse aussi les refuses", attendu: "test raté", code:
      "caisse = 0\nfor papier in papiers:\n    try:\n" +
      '        propre = papier.replace(" ", "")\n        caisse = caisse + int(propre)\n' +
      "    except ValueError:\n        refuser(papier)\n" +
      "    encaisser(papier)\n" +
      'print("Caisse :", caisse)\n' },
  ] },
  5: { prelude: PRELUDE_ETAL(FILE_1), cas: [
    { nom: "juste", attendu: "ok", code: JUSTE_1 },
    { nom: "sans filet", attendu: "plante", code:
      "caisse = 0\nfor papier in papiers:\n" +
      '    propre = papier.replace(" ", "")\n    caisse = caisse + int(propre)\n    encaisser(papier)\n' +
      'print("Caisse :", caisse)\n' },
    { nom: "oublie de refuser", attendu: "test raté", code:
      "caisse = 0\nfor papier in papiers:\n    try:\n" +
      '        propre = papier.replace(" ", "")\n        caisse = caisse + int(propre)\n        encaisser(papier)\n' +
      "    except ValueError:\n        caisse = caisse + 0\n" +
      'print("Caisse :", caisse)\n' },
  ] },
  11: { prelude: PRELUDE_ETAL(FILE_2), cas: [
    { nom: "juste", attendu: "ok", code:
      "caisse = 0\nservis = 0\nrefuses = 0\n" +
      "for papier in papiers:\n    try:\n" +
      '        propre = papier.replace(" ", "")\n        caisse = caisse + int(propre)\n' +
      "        servis = servis + 1\n        encaisser(papier)\n" +
      "    except ValueError:\n        refuses = refuses + 1\n        refuser(papier)\n" +
      'print("Caisse :", caisse)\nprint("Servis :", servis)\nprint("Refuses :", refuses)\n' },
    { nom: "oublie de compter les refuses", attendu: "test raté", code:
      "caisse = 0\nservis = 0\n" +
      "for papier in papiers:\n    try:\n" +
      '        propre = papier.replace(" ", "")\n        caisse = caisse + int(propre)\n' +
      "        servis = servis + 1\n        encaisser(papier)\n" +
      "    except ValueError:\n        refuser(papier)\n" +
      'print("Caisse :", caisse)\nprint("Servis :", servis)\n' },
  ] },
  13: {
    reponses: ["2000", "deux mille", "1500", "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "total = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    try:\n        total = total + int(reponse)\n" +
        "    except ValueError:\n" +
        '        print("Je n\'ai pas compris")\n' +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Total :", total)\n' },
      { nom: "sans filet", attendu: "plante", code:
        "total = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    total = total + int(reponse)\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Total :", total)\n' },
      { nom: "rattrape sans rien dire", attendu: "test raté", code:
        "total = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    try:\n        total = total + int(reponse)\n" +
        "    except ValueError:\n        total = total + 0\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Total :", total)\n' },
    ],
  },
};

const OBJECTIFS = [
  "Rattraper une erreur avec try / except pour que le programme continue",
  "Comprendre qu'une erreur non rattrapée arrête tout ce qui vient après, pas seulement sa ligne",
  "Savoir que ce qui suit l'erreur dans le try est sauté — et placer ses lignes en conséquence",
  "Rattraper n'est pas ignorer : décider ce qu'on fait du cas refusé, et le compter",
];
const ACQUIS = "écrire un programme qui survit quand quelqu'un tape n'importe quoi, au lieu de s'arrêter net";

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
// try/except est enseigné ici. `except` tout court reste dehors : on nomme
// toujours l'erreur qu'on attend.
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\.split\(/, /\.join\(/, /\.upper\(/, /\bopen\(/, /\bfinally\b/, /\braise\b/,
  /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  const visible = JSON.stringify({ ...c, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} (${c.game_type ?? b.type}) contient ${rx} — jamais enseigné`);
  // Un except anonyme attraperait aussi les erreurs qu'on voulait voir.
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
    mauvais(`bloc ${i} : tri d'ordre incomplet ou répétitif`);
  if (c.pairs) {
    if (new Set(c.pairs.map((p) => p.left)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même gauche`);
    if (new Set(c.pairs.map((p) => p.right)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même droite`);
  }
  if (c.game_type === "fill_blank") {
    const trous = (c.template.match(/\[___\]/g) ?? []).length;
    if (trous !== c.blanks.length) mauvais(`bloc ${i} : ${trous} trous pour ${c.blanks.length} réponses`);
  }
  if (c.scene && c.scene.reglages.papiers.length > 5) mauvais(`bloc ${i} : plus de 5 papiers pour 5 billets`);
});
if (ACQUIS.length < 10 || ACQUIS.length > 160) mauvais(`acquis : ${ACQUIS.length} caractères`);
if (/^[A-ZÀ-Ý]/.test(ACQUIS) || ACQUIS.endsWith(".")) mauvais("acquis : ni majuscule ni point final");
if (OBJECTIFS.length !== 4) mauvais(`${OBJECTIFS.length} objectifs, il en faut 4`);

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
const nb = (t) => BLOCS.filter((b) => (b.content.game_type ?? b.type) === t).length;
dire(`✓ ${BLOCS.length} blocs · ${nb("code_challenge")} défis · ${nb("quiz")} quiz · ${BLOCS.filter((b) => b.content.scene).length} scènes · ${nb("bug_hunt")} chasses au bug`);
dire(`✓ files vérifiées : ${B1.caisse} F (${B1.servis} servis, ${B1.refuses} refusé) · ${B2.caisse} F (${B2.servis} servis, ${B2.refuses} refusés)`);

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
BLOCS.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(16)}${b.content.scene ? "🏪 " : "   "}${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 50))}`));
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
const RENDUS = ["memory", "association", "sort", "fill_blank", "bug_hunt", "deviens_ordinateur"];
ok(ap.filter((b) => b.type === "game").every((b) => RENDUS.includes(b.content.game_type)), "aucun jeu sans moteur");
const relu = (await g("lessons", "objectives,acquis,status", (q) => q.eq("id", L.id)))[0];
ok(relu.objectives?.length === 4 && relu.acquis === ACQUIS && relu.status === "published", "objectifs, acquis et statut");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
