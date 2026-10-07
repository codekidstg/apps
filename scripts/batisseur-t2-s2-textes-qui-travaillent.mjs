/**
 * Bâtisseur — thème 2, séance 2 : « Les textes qui travaillent ».
 *
 *     node scripts/batisseur-t2-s2-textes-qui-travaillent.mjs [--ecrire] [--refaire] [--banc]
 *
 * La séance part de deux blessures que « La boucle qui attend » a laissées, et
 * qu'elle annonce en toutes lettres : l'enfant tape « Fin » avec un grand F et
 * la boutique ne ferme pas ; il tape « 1 500 » et son programme meurt.
 *
 * Trois outils neufs, et chacun a son terrain propre :
 *
 *   .lower() et .strip()  →  comparer un MOT tapé par un humain
 *   .replace(a, b)        →  nettoyer un NOMBRE tapé par un humain
 *
 * Cette séparation n'est pas cosmétique : `.strip()` ne sauve PAS `int()`.
 * Python tolère déjà les espaces autour d'un nombre — vérifié, pas supposé.
 * Ce qui tue `int()`, c'est l'espace au milieu, le F collé, le point des
 * milliers. Les mélanger enseignerait un faux problème.
 *
 * `.split()` est laissé dehors exprès : il appartient à la séance 4, où relire
 * un cahier oblige à redécouper des lignes.
 *
 * Le piège central est le même que celui de la séance 1 (`litres + tirer()`
 * sans le `=`) et que celui de « Fonctions qui répondent » : une commande qui
 * RÉPOND ne change rien toute seule. Troisième rencontre du même concept.
 *
 * Relevé en base avant d'écrire : aucune méthode de texte n'a jamais été
 * montrée à un enfant. Restent donc interdits .split(), .join(), .upper(),
 * les f-strings, try/except, open(), break, True/False, += et liste[0].
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les textes qui travaillent";

// ── Garde-fous arithmétiques : les caisses annoncées doivent tomber juste ──
const SALES_1 = ["2000", "1 500", "2 500", "800"];
const SALES_2 = ["2000", "1 500", "1500F", "3.000"];
const propre = (p) => p.replace(/ /g, "").replace(/F/g, "").replace(/\./g, "");
const CAISSE_1 = SALES_1.reduce((a, p) => a + Number(propre(p)), 0);
const CAISSE_2 = SALES_2.reduce((a, p) => a + Number(propre(p)), 0);
if (CAISSE_1 !== 6800) throw new Error(`première caisse ${CAISSE_1}, attendu 6800`);
if (CAISSE_2 !== 8000) throw new Error(`seconde caisse ${CAISSE_2}, attendu 8000`);
// Le premier lot ne porte qu'une seule saleté : un seul .replace() suffit, et
// c'est ce qui le rend abordable. Le second en porte trois.
if (SALES_1.some((p) => /[F.]/.test(p))) throw new Error("le premier lot doit n'avoir que des espaces");
if (!SALES_2.some((p) => p.includes("F")) || !SALES_2.some((p) => p.includes("."))) {
  throw new Error("le second lot doit porter les trois saletés");
}
// Et aucun des deux ne doit contenir un papier que le nettoyage ne sauve pas :
// le programme planterait, et ce n'est pas le sujet de cette séance-ci.
for (const p of [...SALES_1, ...SALES_2]) {
  if (!/^\d+$/.test(propre(p))) throw new Error(`« ${p} » ne se nettoie pas — c'est le sujet de la séance 3`);
}

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });
const etal = (papiers) => ({ decor: "etal", reglages: { papiers }, plafond: 200 });

const BLOCS = [
  // ── 0. L'accroche : les deux blessures d'hier ──────────────────────────
  texte(
    "<h3>Deux papiers ont fait rater ta boutique</h3>" +
    "<p>Hier, ton programme fermait la boutique quand on tapait <code>fin</code>. Un client a écrit <code>FIN</code>, en grand. La boutique est restée ouverte toute la nuit.</p>" +
    "<p>Et quand un autre a écrit <code>1 500</code> au lieu de <code>1500</code>, ton programme est mort sur place.</p>" +
    "<p>Ce n'est pas ta faute, et ce n'est pas la leur. <strong>Un texte tapé par un humain n'est jamais propre.</strong> Aujourd'hui, tu apprends à le nettoyer avant de t'en servir.</p>"
  ),

  // ── 1. Le geste, tout de suite : un seul mot à ajouter ─────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Le soir, la boutique ferme quand quelqu'un tape le mot <code>fin</code>. Ton programme marche — mais le client a écrit <strong><code>FIN</code></strong>, en majuscules, et il n'a pas voulu fermer.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — fais-la fermer, que le mot soit écrit en grand ou en petit.<br>" +
        "🧰 <strong>Tu as</strong> — <code>.lower()</code>, qui rend le même texte tout en petites lettres. <code>\"FIN\".lower()</code> rend <code>\"fin\"</code>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — la boutique ferme du premier coup, sans gronder personne.</p>",
      starter_code:
        'mot = input("Mot de fermeture : ")\n\n' +
        'while mot != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n\n' +
        'print("Boutique fermee")\n',
      hidden_tests:
        'assert ".lower(" in code, "Il te faut .lower() : c est lui qui met tout en petites lettres."\n' +
        'assert "fermee" in output.lower(), "La boutique doit finir par fermer."\n' +
        'assert "pas le bon mot" not in output, "FIN est le bon mot, ecrit en grand : ton programme ne doit pas gronder le client."',
    },
  },

  // ── 2. L'explication, après le geste ───────────────────────────────────
  texte(
    "<h3>Trois outils, et chacun son travail</h3>" +
    "<p>Un humain tape vite, en majuscules, avec des espaces en trop. Python, lui, compare lettre par lettre : pour lui, <code>\"Fin\"</code> et <code>\"fin\"</code> sont deux mots différents.</p>" +
    "<pre><code>\"FIN\".lower()        → \"fin\"      tout en petites lettres\n" +
    "\"  fin \".strip()     → \"fin\"      les espaces aux deux bouts\n" +
    "\"1 500\".replace(\" \", \"\")  → \"1500\"   ce qui gêne au milieu</code></pre>" +
    "<p><strong>Et voici ce qu'il faut retenir avant tout le reste : ces trois-là ne changent rien.</strong> Ils <em>rendent</em> un texte neuf.</p>" +
    "<pre><code>mot.lower()          ← le résultat part à la poubelle\n" +
    "mot = mot.lower()    ← le résultat est rangé</code></pre>" +
    "<p>Tu connais déjà ce piège. C'est le même que <code>litres + tirer()</code> sans le signe <code>=</code>, la semaine dernière.</p>"
  ),

  // ── 3. Les trois outils à leur place ───────────────────────────────────
  jeu({
    game_type: "fill_blank",
    title: "Chaque saleté, son outil",
    // Les deux premiers trous se remplissaient indifféremment par strip ou
    // lower : les deux ordres donnent « fin », et le moteur n'en acceptait
    // qu'un. Chaque trou a donc maintenant sa consigne au-dessus, et une seule
    // réponse possible.
    template:
      "# enlever les espaces des bouts\n" +
      'mot = "  fin  ".[___]()\n' +
      "# calmer les majuscules\n" +
      'cri = "FIN".[___]()\n' +
      "# enlever l'espace du milieu\n" +
      'prix = "1 500".[___](" ", "")',
    blanks: ["strip", "lower", "replace"],
  }),

  // ── 4. Vérification du mécanisme ───────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: 'Pour Python, est-ce que "Fin" et "fin" sont le même mot ?',
          choices: ["Oui, c'est le même mot", "Non : ce ne sont pas les mêmes lettres", "Seulement si on les compare"], answer: 1,
          explanation: "Python compare lettre par lettre, et F n'est pas f. C'est pour ça que ta boutique n'a pas fermé." },
        { question: "mot vaut « FIN ». Après la ligne mot.lower(), que vaut mot ?",
          choices: ["FIN, il n'a pas changé", "fin", "rien du tout"], answer: 0,
          explanation: "La commande a bien rendu « fin »… et personne ne l'a rangé. Il fallait écrire mot = mot.lower()." },
        { question: 'Que rend "  fin  ".strip() ?',
          choices: ["fin", "  fin  ", "FIN"], answer: 0,
          explanation: "strip enlève les espaces aux deux bouts, et seulement aux bouts." },
        { question: 'Que rend "1 500".replace(" ", "") ?',
          choices: ["1 500", "1500", "1-500"], answer: 1,
          explanation: "On remplace chaque espace par rien du tout. Les deux morceaux se recollent." },
      ],
    },
  },

  // ── 5. Il écrit tout : une seule saleté, un seul outil ─────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>C'est le marché. Quatre clients t'ont tendu leur papier, et trois d'entre eux ont écrit leur montant avec un espace au milieu : <code>1 500</code>, <code>2 500</code>.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — encaisser les quatre papiers, et annoncer le total de la caisse.<br>" +
        "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, la commande <code>encaisser(papier)</code> qui fait sonner le tiroir, et <code>.replace(\" \", \"\")</code>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — les quatre clients sont servis et que la caisse affiche le bon total.</p>" +
        "<p>💡 Nettoie d'abord, convertis ensuite. <code>int()</code> ne pardonne pas un espace au milieu.</p>",
      scene: etal(SALES_1),
      starter_code:
        "caisse = 0\n\n" +
        "# Pour chaque papier de la liste : nettoie-le, ajoute-le a la caisse,\n" +
        "# et appelle encaisser(papier).\n",
      hidden_tests:
        'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
        'assert ".replace(" in code, "Un espace au milieu tue int(). Il faut l enlever avec .replace()."\n' +
        'assert "for" in code, "Les papiers sont dans une liste : une boucle for les parcourt."\n' +
        `assert len(encaisses) == ${SALES_1.length}, "Les ${SALES_1.length} clients doivent etre encaisses. Ton programme en a servi " + str(len(encaisses)) + "."\n` +
        `assert "${CAISSE_1}" in output, "La caisse doit afficher ${CAISSE_1}. Verifie que tu additionnes bien chaque montant nettoye."`,
    },
  },

  // ── 6. Nettoyer avant de comparer : l'ordre des lignes ─────────────────
  jeu({
    game_type: "sort",
    title: "Nettoyer, puis comparer",
    description: "Ce programme ferme la boutique quel que soit la façon dont le mot est écrit.",
    hint: "On ne peut pas comparer un texte avant de l'avoir nettoyé — et chaque nettoyage doit être rangé.",
    items: [
      'mot = input("Mot de fermeture : ")',
      "mot = mot.strip()",
      "mot = mot.lower()",
      'if mot == "fin":',
      '    print("Boutique fermee")',
    ],
  }),

  // ── 7. Le piège de la séance ───────────────────────────────────────────
  texte(
    "<h3>Le résultat qu'on jette</h3>" +
    "<p>C'est l'erreur que tout le monde fait, et elle ne laisse aucune trace : <strong>pas de rouge, pas de message</strong>. Le programme tourne, et il se trompe en silence.</p>" +
    "<pre><code>papier = \"1 500\"\n" +
    "papier.replace(\" \", \"\")   ← calcule « 1500 », puis le jette\n" +
    "int(papier)              💥 le papier contient toujours l'espace</code></pre>" +
    "<p>Une commande qui <strong>rend</strong> quelque chose ne change rien toute seule. Si tu ne ranges pas sa réponse, elle est perdue.</p>" +
    "<p>Tu as déjà rencontré ça deux fois : <code>return</code> qui ne s'affiche pas, et <code>litres + tirer()</code> qui n'avance pas. C'est la même règle, pour la troisième fois.</p>"
  ),

  // ── 8. Le piège en action ──────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Le nettoyage qui part à la poubelle",
    context: "Le papier dit « 1 500 ». Le programme devait afficher 1500. Il devient rouge.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 1,
    fix: '    papier = papier.replace(" ", "")',
    explanation: "La ligne calcule bien « 1500 »… et jette le résultat. Sans « papier = » devant, le papier garde son espace, et int() meurt dessus.",
    instructions: [
      'papier = "1 500"',
      '    papier.replace(" ", "")',
      "    print(int(papier))",
    ],
  }),

  // ── 9. Comparer deux textes ────────────────────────────────────────────
  texte(
    "<h3>« 2000 » n'est pas 2000</h3>" +
    "<p>Regarde bien ces deux lignes :</p>" +
    "<pre><code>\"2000\"     un texte — ce que tape le client\n" +
    "2000       un nombre — ce qu'on peut additionner</code></pre>" +
    "<p>Pour Python, ce sont <strong>deux choses différentes</strong>. <code>\"2000\" == 2000</code> répond non. C'est pour ça que <code>int()</code> existe : il transforme le texte en nombre.</p>" +
    "<p>Et l'ordre ne se discute pas : <strong>on nettoie le texte, puis on le convertit.</strong> Dans l'autre sens, <code>int()</code> meurt avant d'avoir vu le nettoyage.</p>"
  ),

  // ── 10. Pareils, pour Python ? ─────────────────────────────────────────
  jeu({
    game_type: "association",
    title: "Pareils pour Python ?",
    description: "Relie chaque comparaison à sa réponse.",
    pairs: [
      { left: '"fin" et "Fin"', right: "Différents — la majuscule compte" },
      { left: '"fin" et "fin "', right: "Différents — un espace invisible à la fin" },
      { left: '"FIN".lower() et "fin"', right: "Pareils — tout est en petites lettres" },
      { left: '" fin ".strip() et "fin"', right: "Pareils — les bords sont enlevés" },
      { left: '"2000" et 2000', right: "Différents — un texte n'est pas un nombre" },
      { left: '"2 000".replace(" ", "") et "2000"', right: "Pareils — l'espace du milieu est parti" },
    ],
  }),

  // ── 11. Comparer à côté de la plaque ───────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Celui qui compare au mauvais mot",
    context: "Le client tape « FIN », puis « fin », puis « Fin ». La boutique ne ferme jamais.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 1,
    fix: '    if mot.lower() == "fin":',
    explanation: ".lower() met le mot de l'enfant tout en petites lettres. Le comparer à « FIN » écrit en grand ne peut donc jamais marcher : il faut comparer à « fin ».",
    instructions: [
      'mot = input("Mot de fermeture : ")',
      '    if mot.lower() == "FIN":',
      '        print("Boutique fermee")',
    ],
  }),

  // ── 12. Consolidation ──────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: 'Pourquoi int("1 500") fait-il mourir le programme ?',
          choices: ["Le nombre est trop grand", "À cause de l'espace au milieu", "Parce qu'il y a des guillemets"], answer: 1,
          explanation: "Python veut des chiffres collés. L'espace du milieu l'arrête net." },
        { question: 'Est-ce que .strip() sauve int("1 500") ?',
          choices: ["Non : strip ne touche que les deux bouts", "Oui, il enlève tous les espaces", "Seulement si l'espace est au début"], answer: 0,
          explanation: "strip nettoie les bords, pas le milieu. Ici c'est .replace() qu'il faut — et c'est pour ça que les deux existent." },
        { question: "Le client tape « FIN ». Quel outil te sauve ?",
          choices: [".replace()", ".lower()", "int()"], answer: 1,
          explanation: "Une histoire de majuscules : .lower() met tout au même niveau avant de comparer." },
        { question: 'Le client tape «  fin  » avec des espaces. Quel outil te sauve ?',
          choices: [".strip()", ".replace()", "aucun"], answer: 0,
          explanation: "Des espaces aux deux bouts : c'est exactement le travail de .strip()." },
      ],
    },
  },

  // ── 13. Le défi de la séance : trois saletés d'un coup ─────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>C'est le soir, et les papiers de la journée sont pires que ce matin : <code>1 500</code> avec un espace, <code>1500F</code> avec un F collé, <code>3.000</code> avec un point.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — encaisser les quatre papiers malgré tout, et annoncer la caisse du soir.<br>" +
        "🧰 <strong>Tu as</strong> — <code>.replace()</code>, qu'on peut appeler plusieurs fois de suite : une fois par saleté.<br>" +
        "✅ <strong>C'est réussi quand</strong> — personne n'est refusé et que la caisse tombe juste.</p>",
      scene: etal(SALES_2),
      starter_code:
        "caisse = 0\n\n" +
        "# Trois saletes a enlever : l'espace, le F, le point.\n" +
        "# Nettoie chaque papier, additionne, et encaisse.\n",
      hidden_tests:
        'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
        'assert code.count(".replace(") >= 3, "Trois saletes differentes, donc trois nettoyages : l espace, le F et le point."\n' +
        `assert len(encaisses) == ${SALES_2.length}, "Les ${SALES_2.length} papiers doivent etre encaisses. Ton programme en a servi " + str(len(encaisses)) + "."\n` +
        `assert "${CAISSE_2}" in output, "La caisse du soir fait ${CAISSE_2} F. Verifie chaque nettoyage."`,
    },
  },

  // ── 14. Le cadenas qui pardonne tout ───────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Dernière chose avant de rentrer : la boutique doit fermer sur le mot <code>fin</code>, <strong>écrit n'importe comment</strong>. En grand, en petit, avec des espaces autour — tout doit marcher.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — redemander le mot tant que ce n'est pas <code>fin</code>, et accepter toutes ses écritures.<br>" +
        "🧰 <strong>Tu as</strong> — <code>.strip()</code> pour les bords, <code>.lower()</code> pour les majuscules, et la boucle de la semaine dernière.<br>" +
        "✅ <strong>C'est réussi quand</strong> — un mot qui n'est pas fin fait redemander, et que «  FIN  » ferme la boutique.</p>",
      starter_code:
        'mot = input("Mot de fermeture : ")\n\n' +
        "# Nettoie le mot AVANT de le comparer, et redemande tant que ce n'est pas fin.\n",
      hidden_tests:
        'assert ".lower(" in code, "Les majuscules doivent etre mises a plat : .lower()."\n' +
        'assert ".strip(" in code, "Les espaces autour doivent sauter : .strip()."\n' +
        'assert "while" in code, "Tant que ce n est pas le bon mot, il faut redemander."\n' +
        'assert "fermee" in output.lower(), "La boutique doit finir par fermer."\n' +
        'assert output.lower().count("pas le bon mot") == 1, "Un seul mot etait faux : ton programme doit gronder une seule fois."',
    },
  },

  // ── 15. Les mots de la séance ──────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la séance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: ".lower()", right: "Tout en petites lettres" },
      { left: ".strip()", right: "Les espaces aux deux bouts" },
      { left: '.replace(" ", "")', right: "Ce qui gêne au milieu" },
      { left: "mot = mot.lower()", right: "Le seul qui range la réponse" },
      { left: '"2000"', right: "Un texte, pas un nombre" },
    ],
  }),

  // ── 16. Ce qu'il sait faire, et le mur suivant ─────────────────────────
  texte(
    "<h3>Ce que tu sais faire maintenant</h3>" +
    "<p>Prendre ce qu'une personne a tapé — de travers, en majuscules, avec des espaces partout — et le rendre utilisable par ton programme. Comparer des mots sans te faire avoir par une majuscule. Et transformer un texte en nombre sans mourir dessus.</p>" +
    "<p>Tu sais aussi qu'une commande qui rend quelque chose ne change rien toute seule. Pour la troisième fois.</p>" +
    "<h3>La semaine prochaine</h3>" +
    "<p>Il reste un papier dans ta pile, et celui-là résiste à tout. Un client a écrit <strong><code>deux mille</code></strong>.</p>" +
    "<p>Enlève les espaces : <code>deuxmille</code>. Mets-le en petites lettres : <code>deux mille</code>. Essaie tous les nettoyages que tu veux — <code>int()</code> mourra dessus, à chaque fois.</p>" +
    "<p><strong>La semaine prochaine, tu n'apprendras pas à nettoyer mieux. Tu apprendras à empêcher ton programme de mourir.</strong></p>"
  ),
];

// ── Le banc : bonnes et mauvaises solutions des quatre défis ─────────────
const PRELUDE_ETAL = (papiers) =>
  "_journal = []\n" +
  "papiers = " + JSON.stringify(papiers) + "\n" +
  "def encaisser(papier):\n" +
  '    _journal.append({"quoi": "encaisser", "papier": str(papier)})\n' +
  "def refuser(papier):\n" +
  '    _journal.append({"quoi": "refuser", "papier": str(papier)})\n';

const SOLUTIONS = {
  1: {
    reponses: ["FIN"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'mot = input("Mot de fermeture : ")\n' +
        'while mot.lower() != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        'print("Boutique fermee")\n' },
      // Sans .lower(), « FIN » n'est pas reconnu : le programme redemande, et
      // la liste des réponses s'épuise. C'est exactement ce que l'enfant voit
      // à l'écran — une boutique qui ne ferme jamais.
      { nom: "sans lower", attendu: "saisie manquante", code:
        'mot = input("Mot de fermeture : ")\n' +
        'while mot != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        'print("Boutique fermee")\n' },
      { nom: "lower pose mais jete", attendu: "saisie manquante", code:
        'mot = input("Mot de fermeture : ")\n' +
        'while mot != "fin":\n' +
        "    mot.lower()\n" +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        'print("Boutique fermee")\n' },
    ],
  },
  5: {
    prelude: PRELUDE_ETAL(SALES_1),
    cas: [
      { nom: "juste", attendu: "ok", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        '    propre = papier.replace(" ", "")\n' +
        "    caisse = caisse + int(propre)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "oublie de nettoyer", attendu: "plante", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        "    caisse = caisse + int(papier)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "nettoie mais jette le resultat", attendu: "plante", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        '    papier.replace(" ", "")\n' +
        "    caisse = caisse + int(papier)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "oublie d encaisser", attendu: "test raté", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        '    propre = papier.replace(" ", "")\n' +
        "    caisse = caisse + int(propre)\n" +
        'print("Caisse :", caisse)\n' },
    ],
  },
  13: {
    prelude: PRELUDE_ETAL(SALES_2),
    cas: [
      { nom: "juste", attendu: "ok", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        '    propre = papier.replace(" ", "")\n' +
        '    propre = propre.replace("F", "")\n' +
        '    propre = propre.replace(".", "")\n' +
        "    caisse = caisse + int(propre)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
      { nom: "oublie le point", attendu: "plante", code:
        "caisse = 0\n" +
        "for papier in papiers:\n" +
        '    propre = papier.replace(" ", "")\n' +
        '    propre = propre.replace("F", "")\n' +
        "    caisse = caisse + int(propre)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\n' },
    ],
  },
  14: {
    reponses: ["bonsoir", "  FIN  "],
    cas: [
      { nom: "juste", attendu: "ok", code:
        'mot = input("Mot de fermeture : ")\n' +
        "mot = mot.strip()\n" +
        "mot = mot.lower()\n" +
        'while mot != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        "    mot = mot.strip()\n" +
        "    mot = mot.lower()\n" +
        'print("Boutique fermee")\n' },
      // Il nettoie avant la boucle, mais plus jamais ensuite : le deuxième mot
      // arrive sale, et la boutique ne ferme pas.
      { nom: "ne nettoie qu une fois", attendu: "saisie manquante", code:
        'mot = input("Mot de fermeture : ")\n' +
        "mot = mot.strip()\n" +
        "mot = mot.lower()\n" +
        'while mot != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        'print("Boutique fermee")\n' },
      { nom: "oublie strip", attendu: "saisie manquante", code:
        'mot = input("Mot de fermeture : ")\n' +
        "mot = mot.lower()\n" +
        'while mot != "fin":\n' +
        '    print("Ce n\'est pas le bon mot.")\n' +
        '    mot = input("Mot de fermeture : ")\n' +
        "    mot = mot.lower()\n" +
        'print("Boutique fermee")\n' },
    ],
  },
};

// ── Les objectifs et l'acquis ────────────────────────────────────────────
const OBJECTIFS = [
  "Nettoyer un texte tapé par un humain avant de s'en servir : les majuscules, les bords, le milieu",
  "Comprendre qu'une commande de texte rend un texte neuf, et qu'il faut ranger sa réponse",
  "Choisir l'outil selon la saleté — .lower() et .strip() pour comparer un mot, .replace() pour sauver un nombre",
  "Savoir pourquoi « 2000 » n'est pas 2000, et nettoyer avant de convertir",
];
const ACQUIS = "nettoyer ce qu'une personne a tapé pour que le programme le comprenne, même écrit de travers";

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
// .lower(), .strip() et .replace() sont enseignés ici : ils sortent de la liste.
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\.split\(/, /\.join\(/, /\.upper\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
  /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  const visible = JSON.stringify({ ...c, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} (${c.game_type ?? b.type}) contient ${rx} — jamais enseigné`);
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
  if (c.game_type === "sort" && (!c.items || c.items.length < 3 || !c.hint || new Set(c.items).size !== c.items.length))
    mauvais(`bloc ${i} : tri d'ordre incomplet ou répétitif`);
  if (c.pairs) {
    if (new Set(c.pairs.map((p) => p.left)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même gauche`);
    if (new Set(c.pairs.map((p) => p.right)).size !== c.pairs.length) mauvais(`bloc ${i} : deux paires de même droite — insoluble`);
  }
  if (c.game_type === "fill_blank") {
    const trous = (c.template.match(/\[___\]/g) ?? []).length;
    if (trous !== c.blanks.length) mauvais(`bloc ${i} : ${trous} trous pour ${c.blanks.length} réponses`);
    if (c.blanks.some((x) => !x || x.length > 12)) mauvais(`bloc ${i} : une réponse trop longue pour la case`);
  }
  if (c.scene && c.scene.decor !== "etal") mauvais(`bloc ${i} : décor inattendu (${c.scene.decor})`);
});
if (ACQUIS.length < 10 || ACQUIS.length > 160) mauvais(`acquis : ${ACQUIS.length} caractères, la base en veut entre 10 et 160`);
if (/^[A-ZÀ-Ý]/.test(ACQUIS) || ACQUIS.endsWith(".")) mauvais("acquis : ni majuscule au début ni point à la fin");
if (OBJECTIFS.length !== 4) mauvais(`${OBJECTIFS.length} objectifs, les séances réussies en portent 4`);

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
const nb = (t) => BLOCS.filter((b) => (b.content.game_type ?? b.type) === t).length;
dire(`✓ ${BLOCS.length} blocs · ${nb("code_challenge")} défis de code · ${nb("quiz")} quiz · ${BLOCS.filter((b) => b.content.scene).length} scènes · ${nb("bug_hunt")} chasses au bug`);
dire(`✓ caisses vérifiées : ${CAISSE_1} F le matin, ${CAISSE_2} F le soir · tous les papiers se nettoient`);

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
BLOCS.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(16)}${b.content.scene ? "🏪 " : "   "}${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 52))}`));
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
ok(relu.objectives?.length === 4 && relu.acquis === ACQUIS, "objectifs et acquis en base");
ok(relu.status === "published", `publiée comme la séance 1 (trouvé ${relu.status})`);
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
