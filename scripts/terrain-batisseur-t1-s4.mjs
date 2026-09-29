/**
 * Le Terrain — Bâtisseur, thème 1 séance 4 « Les dictionnaires ».
 *
 *     node scripts/terrain-batisseur-t1-s4.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : la clé et la valeur, lire avec des crochets,
 * ajouter et modifier avec la même ligne, le KeyError d'une clé absente et le
 * `.get()` qui l'évite, le parcours `for nom in carnet` qui donne les CLÉS, et
 * `len()`.
 *
 * Le dernier palier utilise le téléphone : c'est le moteur du jalon, et le
 * rencontrer ici en libre service évite de le découvrir le jour de la
 * présentation devant un parent.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les dictionnaires";

// Garde-fou arithmétique.
const CARNET = { Riz: 1500, Huile: 2300, Savon: 800, Sucre: 700 };
const CHERS = Object.values(CARNET).filter((p) => p > 1000).length;
if (CHERS !== 2) throw new Error(`${CHERS} articles au-dessus de 1000, attendu 2`);

const EXOS = [
  {
    palier: 1,
    title: "Ça marche, ou ça casse ?",
    description: "Douze lignes. Le carnet ne connaît que le Riz et l'Huile.",
    blocs: [
      kodi("<p>Le carnet de départ : <code>prix = {\"Riz\": 1500, \"Huile\": 2300}</code>.</p><p>Douze lignes. Certaines tournent, d'autres arrêtent tout — et ce n'est pas toujours celles qu'on croit.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Ça marche, ou ça casse ?",
          instruction: "Sur ce carnet, cette ligne passe ou devient rouge ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Lire une clé qui existe : ça marche.",
              "Lire une clé absente avec des crochets : KeyError, tout s'arrête.",
              "ÉCRIRE une clé absente : ça l'ajoute, ça ne plante jamais.",
              ".get() ne plante jamais, même sur une clé absente.",
            ],
          },
          categories: [
            { id: "ok", label: "Ça marche", emoji: "✅", color: "#10b981" },
            { id: "ko", label: "Ça casse",  emoji: "💥", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: 'prix["Riz"]',                    correct: "ok", hint: "La clé existe : on obtient 1500." },
            { id: "b", emoji: "2️⃣", label: 'prix["Pain"]',                   correct: "ko", hint: "Clé absente, lecture avec crochets : KeyError, tout s'arrête." },
            { id: "c", emoji: "3️⃣", label: 'prix["Pain"] = 500',             correct: "ok", hint: "Le piège : ÉCRIRE une clé absente ne plante pas — ça la crée." },
            { id: "d", emoji: "4️⃣", label: 'prix.get("Pain")',               correct: "ok", hint: ".get() ne plante jamais : il rend None." },
            { id: "e", emoji: "5️⃣", label: 'prix.get("Pain", "inconnu")',    correct: "ok", hint: "Et avec une réponse de secours, il rend « inconnu »." },
            { id: "f", emoji: "6️⃣", label: 'prix["Riz"] = 1600',             correct: "ok", hint: "La clé existe : la nouvelle valeur remplace l'ancienne." },
            { id: "g", emoji: "7️⃣", label: "len(prix)",                      correct: "ok", hint: "Compter un carnet marche toujours, même vide." },
            { id: "h", emoji: "8️⃣", label: "for nom in prix:",               correct: "ok", hint: "On parcourt les clés. Un carnet vide fait zéro tour, sans erreur." },
            { id: "i", emoji: "9️⃣", label: 'prix["Huile"] + prix["Riz"]',    correct: "ok", hint: "Deux clés qui existent : 2300 + 1500." },
            { id: "j", emoji: "🔟", label: 'prix["Huile"] + prix["Lait"]',   correct: "ko", hint: "La deuxième n'existe pas : KeyError avant même l'addition." },
            { id: "k", emoji: "🅰️", label: 'prix.get("Riz") + 100',           correct: "ok", hint: "La clé existe : .get rend 1500, et l'addition passe." },
            { id: "l", emoji: "🅱️", label: 'prix.get("Pain") + 100',          correct: "ko", hint: "Le piège de .get : sans réponse de secours il rend None, et None + 100 est impossible." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque geste et son effet",
    description: "Sept lignes de carnet. Deux se ressemblent beaucoup.",
    blocs: [
      kodi("<p>La même écriture sert à <strong>ajouter</strong> et à <strong>modifier</strong> : c'est la présence de la clé qui décide.</p><p>Relie chaque ligne à ce qu'elle fait vraiment.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque geste et son effet",
          instruction: "Touche une ligne, puis ce qu'elle fait.",
          left_label: "La ligne",
          right_label: "Son effet",
          pairs: [
            { left: 'prix["Riz"]',                 right: "Rend 1500 — si la clé existe" },
            { left: 'prix["Pain"] = 500',          right: "Crée la clé Pain" },
            { left: 'prix["Riz"] = 1600',          right: "Écrase l'ancien prix du Riz" },
            { left: 'prix.get("Pain", "inconnu")', right: "Répond sans jamais planter" },
            { left: "len(prix)",                   right: "Rend le nombre de clés" },
            { left: "for nom in prix:",            right: "Donne les étiquettes, une par une" },
            { left: "prix[nom]",                   right: "Va chercher la valeur sous l'étiquette" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "Le carnet grandit, puis la ligne se déroule.",
    blocs: [
      kodi("<p>Un article s'ajoute, puis on calcule. Déroule la ligne morceau par morceau — et souviens-toi que <code>len</code> compte les <strong>clés</strong>.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Une clé devient sa valeur ; len compte les clés.",
        contexte: ['prix = {"Riz": 1500, "Huile": 2300}', 'prix["Savon"] = 800'],
        ligne: 'print(len(prix) * prix["Savon"])',
        etapes: [
          { expression: "len(prix)", choix: ["3", "2", "800", "prix"], valeur: "3",
            explication: "Deux clés au départ, plus Savon qui vient d'être créée : trois." },
          { expression: 'prix["Savon"]', choix: ["800", "Savon", "3"], valeur: "800",
            explication: "La clé devient sa valeur, là où elle est écrite." },
          { expression: "3 * 800", choix: ["2400", "3800", "38"], valeur: "2400",
            explication: "Et c'est 2400 que print reçoit." },
        ],
        sortie: "2400",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux carnets qui mentent",
    description: "Aucun ne devient rouge. Les deux se trompent.",
    blocs: [
      kodi("<p>Les erreurs de carnet les plus coûteuses ne font pas de rouge : elles donnent un résultat faux, et l'on ne s'en aperçoit que bien plus tard.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui ne range rien",
        context: "Le programme devait ajouter le Sucre à 700. Le carnet en compte toujours deux.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: 'prix["Sucre"] = 700',
        explanation: "Un seul = range, deux == comparent. La ligne posait une question au lieu d'ajouter — et personne n'écoutait la réponse.",
        instructions: [
          'prix = {"Riz": 1500, "Huile": 2300}',
          'prix["Sucre"] == 700',
          "print(len(prix))",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui affiche tout le carnet",
        context: "Le programme devait afficher « Riz 1500 », puis « Huile 2300 ». Il affiche deux fois le carnet entier.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    print(nom, prix[nom])",
        explanation: "Dans la boucle, nom est une étiquette. Afficher prix affiche tout le carnet, à chaque tour : il fallait aller chercher la valeur sous l'étiquette.",
        instructions: [
          'prix = {"Riz": 1500, "Huile": 2300}',
          "for nom in prix:",
          "    print(nom, prix)",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le carnet raconté",
    description: "Six phrases sur un carnet qui grandit et qu'on parcourt.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de six lignes. Il marche.</p>" +
            '<pre><code>1  prix = {"Riz": 1500, "Huile": 2300}\n' +
            '2  prix["Savon"] = 800\n' +
            '3  prix["Riz"] = 1600\n' +
            "4  total = 0\n" +
            "5  for nom in prix:\n" +
            "6      total = total + prix[nom]</code></pre>" +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le carnet",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "Après la ligne 3, le carnet contient", after: "articles.",
              options: ["3", "4", "2"], correct: 0,
              explanation: "La ligne 2 ajoute Savon. La ligne 3 modifie Riz, elle n'ajoute rien." },
            { id: "s2", before: "Après la ligne 3, le Riz vaut", after: ".",
              options: ["1600", "1500", "les deux"], correct: 0,
              explanation: "Une clé ne garde qu'une valeur : la nouvelle écrase l'ancienne." },
            { id: "s3", before: "La boucle de la ligne 5 fait", after: "tours.",
              options: ["3", "2", "6"], correct: 0,
              explanation: "Un tour par clé, et il y en a trois." },
            { id: "s4", before: "À chaque tour, nom contient", after: ".",
              options: ["une étiquette", "un prix", "les deux"], correct: 0,
              explanation: "Une boucle sur un carnet parcourt ses clés. Le prix se demande avec prix[nom]." },
            { id: "s5", before: "À la fin, total vaut", after: ".",
              options: ["4700", "4600", "3900"], correct: 0,
              explanation: "1600 + 2300 + 800 : le Riz compte pour sa NOUVELLE valeur." },
            { id: "s6", before: "Si la ligne 3 était supprimée, total vaudrait", after: ".",
              options: ["4600", "4700", "1600"], correct: 0,
              explanation: "Le Riz resterait à 1500 : cent francs de moins." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Les articles qui dépassent",
    description: "Parcourir, comparer, et n'annoncer que ce qui compte.",
    blocs: [
      kodi("<p>Un carnet de quatre articles. Le marchand ne veut voir que ceux qui dépassent <strong>1 000 F</strong>, et savoir combien ils sont.</p><p>Une boucle, un si, un compteur.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Parcours le carnet. Pour chaque article qui coute PLUS de 1000 F, affiche son nom et son prix.\n" +
            "A la fin, affiche combien d'articles depassent, avec le mot Total.",
          starter_code:
            'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\n\n' +
            "# Une boucle, un si, un compteur.\n",
          hidden_tests:
            'import re\n' +
            'assert "for" in code, "Il faut une boucle sur le carnet."\n' +
            'assert "if" in code, "Il faut un si pour ne garder que ceux qui depassent."\n' +
            'assert "Riz" in output and "Huile" in output, "Le Riz et l Huile depassent 1000 : ils doivent apparaitre."\n' +
            'assert "Savon" not in output and "Sucre" not in output, "Le Savon et le Sucre sont en dessous de 1000 : ils ne doivent PAS apparaitre."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "2" in nombres, "Deux articles depassent 1000."\n' +
            'assert "Total" in output or "total" in output, "La derniere ligne doit contenir le mot Total."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📱 Le carnet sur le téléphone",
    description: "Ton carnet s'affiche pour de vrai — répétition du jalon.",
    blocs: [
      kodi("<p>Le même carnet, mais affiché sur un téléphone. Trois mots suffisent : <code>ecran.titre</code>, <code>ecran.contact</code>, <code>ecran.message</code>.</p><p>Le téléphone ne décide de rien : il dessine ce que ton programme lui donne. C'est le moteur du jalon — autant le rencontrer maintenant.</p>"),
      jeu({
        game_type: "telephone",
        title: "Le carnet sur le téléphone",
        instructions:
          "Affiche le carnet du marche sur le telephone : un titre, puis chaque article avec son prix, avec UNE boucle.\nEnsuite, demande AU CARNET le prix du Pain : il n'y est pas, alors affiche le mot inconnu au lieu de planter.",
        min_contacts: 4,
        doit_afficher: ["inconnu"],
        starter_code:
          'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\n\n' +
          'ecran.titre("Le marche")\n\n' +
          "# Une boucle pour les quatre articles, puis le Pain demande avec .get()\n",
      }),
    ],
  },
];

const SOLUTIONS = {
  "Les articles qui dépassent": { cas: [
    { nom: "juste", attendu: "ok", code:
      'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\ncombien = 0\nfor nom in prix:\n    if prix[nom] > 1000:\n        print(nom, prix[nom])\n        combien = combien + 1\nprint("Total :", combien)\n' },
    { nom: "affiche tout le carnet", attendu: "test raté", code:
      'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\nfor nom in prix:\n    print(nom, prix[nom])\nprint("Total :", 4)\n' },
    { nom: "seuil a 700 au lieu de 1000", attendu: "test raté", code:
      'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\ncombien = 0\nfor nom in prix:\n    if prix[nom] > 700:\n        print(nom, prix[nom])\n        combien = combien + 1\nprint("Total :", combien)\n' },
    { nom: "oublie le compte", attendu: "test raté", code:
      'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800, "Sucre": 700}\nfor nom in prix:\n    if prix[nom] > 1000:\n        print(nom, prix[nom])\n' },
  ] },
};

verifier(EXOS, {
  interdits: [/\bwhile\b/, /\belif\b/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Ça marche, ou ça casse ?": 12, "Chaque geste et son effet": 7, "Le carnet raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
