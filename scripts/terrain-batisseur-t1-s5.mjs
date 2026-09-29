/**
 * Le Terrain — Bâtisseur, thème 1 séance 5 « 🏆 Jalon 1 — Le carnet de contacts ».
 *
 *     node scripts/terrain-batisseur-t1-s5.mjs [--ecrire] [--refaire] [--banc]
 *
 * Le Terrain d'un jalon ne rejoue pas une séance : il rejoue le THÈME. Listes,
 * commandes qu'on fabrique, fonctions qui répondent, carnets — les quatre se
 * croisent ici, parce que c'est exactement ce que le jalon demande d'assembler.
 *
 * Et comme le jalon se présente devant un parent, le dernier exercice est une
 * répétition générale sur le téléphone : le jour J, l'enfant ne découvre ni
 * l'écran, ni le trac.
 *
 * Particularité : les tests cachés tournent dans le même espace de noms que le
 * code de l'enfant. Au palier 3 on APPELLE donc sa fonction au lieu de relire
 * son texte — c'est la seule façon de vérifier qu'elle rend vraiment quelque
 * chose, et c'est le niveau d'exigence d'un jalon.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 Jalon 1 — Le carnet de contacts";

// Garde-fous arithmétiques : les nombres annoncés doivent être ceux-là.
const PRIX = { Savon: 800, Riz: 1500 };
if (PRIX.Savon * 2 + PRIX.Riz !== 3100) throw new Error("le total de la ligne n'est plus 3100");
const ORDRE = ["Fatou", "Ali"];
if (ORDRE.length !== 2) throw new Error("la liste ordre ne fait plus deux noms");

const PROGRAMME =
  '1  carnet = {"Ali": "670112233", "Fatou": "691445566"}\n' +
  '2  ordre = ["Fatou", "Ali"]\n' +
  "3\n" +
  "4  def numero_de(nom):\n" +
  '5      return carnet.get(nom, "inconnu")\n' +
  "6\n" +
  "7  for nom in ordre:\n" +
  "8      print(nom, numero_de(nom))\n" +
  '9  print(numero_de("Bintou"))';

const EXOS = [
  {
    palier: 1,
    title: "Liste ou carnet ?",
    description: "Douze besoins. Lequel des deux rangements les résout ?",
    blocs: [
      kodi("<p>C'est la première décision du jalon, et la plus importante : <strong>une liste</strong> garde un ordre, <strong>un carnet</strong> associe une étiquette à une valeur.</p><p>Douze besoins réels. Choisis le rangement qui répond.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Liste ou carnet ?",
          instruction: "Pour faire ça, tu prends une liste ou un carnet ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "S'il faut retenir QUI EST OÙ dans un ordre : une liste.",
              "S'il faut retrouver quelque chose PAR SON NOM : un carnet.",
              "Une liste se demande par sa position : amis[0].",
              "Un carnet se demande par son étiquette : numeros[\"Ali\"].",
            ],
          },
          categories: [
            { id: "liste",  label: "Une liste",  emoji: "📋", color: "#3b82f6" },
            { id: "carnet", label: "Un carnet",  emoji: "📒", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "🥇", label: "Savoir qui est arrivé le premier",         correct: "liste",  hint: "C'est une question de position : une liste garde l'ordre." },
            { id: "b", emoji: "📞", label: "Retrouver le numéro d'Ali",                 correct: "carnet", hint: "On cherche par le nom : carnet[\"Ali\"]." },
            { id: "c", emoji: "➕", label: "Ajouter un nom à la fin de la file",         correct: "liste",  hint: "Une file a une fin : c'est .append()." },
            { id: "d", emoji: "💰", label: "Savoir combien coûte le savon",             correct: "carnet", hint: "Chaque article est étiqueté par son nom." },
            { id: "e", emoji: "🔤", label: "Ranger les prénoms par ordre alphabétique", correct: "liste",  hint: "Ranger, c'est changer l'ordre : .sort() travaille sur une liste." },
            { id: "f", emoji: "🎂", label: "Retrouver l'âge de chaque élève",           correct: "carnet", hint: "Un prénom, un âge : deux choses associées." },
            { id: "g", emoji: "🎵", label: "Garder les notes d'une mélodie dans l'ordre", correct: "liste", hint: "Une mélodie jouée à l'envers n'est plus la même : l'ordre compte." },
            { id: "h", emoji: "🏳️", label: "Retrouver la capitale d'un pays",            correct: "carnet", hint: "Pays → capitale : l'étiquette et sa valeur." },
            { id: "i", emoji: "🔢", label: "Prendre le 3ᵉ nom de la file",              correct: "liste",  hint: "Le 3ᵉ, c'est une position : ordre[2]." },
            { id: "j", emoji: "❓", label: "Répondre « inconnu » si le nom n'est pas là", correct: "carnet", hint: "C'est exactement ce que fait .get() sur un carnet." },
            { id: "k", emoji: "🎟️", label: "Distribuer les tickets dans l'ordre d'arrivée", correct: "liste", hint: "Premier arrivé, premier servi : une liste." },
            { id: "l", emoji: "🔑", label: "Savoir quel mot de passe va avec quel compte", correct: "carnet", hint: "Deux choses qui vont ensemble, toujours un carnet." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Les mots du thème",
    description: "Sept mots appris depuis le début du thème.",
    blocs: [
      kodi("<p>Tout le thème en sept mots. Si tu les relies sans hésiter, le jalon est déjà à moitié gagné.</p>"),
      {
        type: "match",
        content: {
          title: "Les mots du thème",
          instruction: "Touche un mot, puis ce qu'il fait.",
          left_label: "Le mot",
          right_label: "Ce qu'il fait",
          pairs: [
            { left: "une liste",     right: "Range plusieurs choses dans un ordre" },
            { left: "un carnet",     right: "Associe une étiquette à une valeur" },
            { left: "def",           right: "Fabrique une commande, sans l'exécuter" },
            { left: "un paramètre",  right: "Le réglage qu'on donne à la commande" },
            { left: "return",        right: "Rend une réponse à celui qui a appelé" },
            { left: ".append()",     right: "Ajoute à la fin de la liste" },
            { left: ".get()",        right: "Demande sans risquer l'erreur rouge" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "Un carnet, une fonction, et une addition dans la même ligne.",
    blocs: [
      kodi("<p>Cette ligne fait travailler <strong>les deux</strong> : elle va chercher dans le carnet, puis elle passe le résultat à une commande.</p><p>Déroule-la de l'intérieur vers l'extérieur.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "De l'intérieur vers l'extérieur, quatre substitutions.",
        contexte: ['prix = {"Savon": 800, "Riz": 1500}', "def double(n):", "    return n * 2"],
        ligne: 'print(double(prix["Savon"]) + prix["Riz"])',
        etapes: [
          { expression: 'prix["Savon"]', choix: ["800", "1500", "Savon", "double"], valeur: "800",
            explication: "On commence par le plus à l'intérieur : la clé devient sa valeur." },
          { expression: "double(800)", choix: ["1600", "800", "None", "n * 2"], valeur: "1600",
            explication: "La fonction reçoit 800 comme réglage, et RETURN rend 1600 à l'endroit de l'appel." },
          { expression: 'prix["Riz"]', choix: ["1500", "800", "Riz"], valeur: "1500",
            explication: "L'autre clé devient sa valeur, à son tour." },
          { expression: "1600 + 1500", choix: ["3100", "2300", "16001500"], valeur: "3100",
            explication: "Et c'est 3100, un seul nombre, que print reçoit enfin." },
        ],
        sortie: "3100",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux jalons qui trébuchent",
    description: "Deux carnets de contacts presque justes. Chacun, une ligne.",
    blocs: [
      kodi("<p>Deux programmes de jalon, écrits par des enfants pressés. Le premier fait rouge, le second non — et c'est le second le plus dangereux.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui demande un numéro",
        context: "Le programme devait afficher le numéro d'Ali. Il affiche KeyError: 0.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 1,
        fix: 'print(numeros["Ali"])',
        explanation: "Un carnet ne se demande pas par position, mais par étiquette. Le 0 n'est pas une clé du carnet : Python ne le trouve pas.",
        instructions: [
          'numeros = {"Ali": "670112233", "Fatou": "691445566"}',
          "print(numeros[0])",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celle qui répond toujours pareil",
        context: "Le programme devait donner le numéro de Fatou. Il donne celui d'Ali — et il donnerait celui d'Ali pour n'importe qui.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    return carnet[nom]",
        explanation: "La fonction a un paramètre, nom, mais elle ne s'en servait pas : elle allait chercher Ali en dur. Un paramètre qu'on n'utilise pas est un réglage qu'on ignore.",
        instructions: [
          'carnet = {"Ali": "670112233", "Fatou": "691445566"}',
          "def numero_de(nom):",
          '    return carnet["Ali"]',
          'print(numero_de("Fatou"))',
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Raconte le carnet de contacts",
    description: "Six phrases sur un vrai programme de jalon.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voilà un carnet de contacts qui marche. Neuf lignes, et les quatre notions du thème dedans.</p>" +
            `<pre><code>${PROGRAMME}</code></pre>` +
            "<p>Ne le modifie pas. Raconte-le — c'est ce que le jalon te demandera de faire à voix haute.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le programme",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La boucle de la ligne 7 parcourt", after: ".",
              options: ["la liste ordre", "le carnet", "les deux à la fois"], correct: 0,
              explanation: "C'est ce qui est écrit après le mot in : ordre." },
            { id: "s2", before: "La toute première ligne affichée commence par", after: ".",
              options: ["Ali", "Fatou", "Bintou"], correct: 1,
              explanation: "Le carnet commence par Ali, mais c'est la LISTE qui mène la boucle — et elle commence par Fatou." },
            { id: "s3", before: "La ligne 8 s'exécute", after: ".",
              options: ["9 fois", "une fois", "2 fois"], correct: 2,
              explanation: "Un tour par nom de la liste, et la liste en compte deux." },
            { id: "s4", before: "La ligne 9 affiche", after: ".",
              options: ["inconnu", "une erreur rouge", "rien du tout"], correct: 0,
              explanation: "Bintou n'est pas au carnet, mais .get a une réponse de secours." },
            { id: "s5", before: "Si la ligne 5 utilisait des crochets au lieu de .get, la ligne 9", after: ".",
              options: ["afficherait None", "arrêterait tout en rouge", "ne changerait pas"], correct: 1,
              explanation: "Des crochets sur une clé absente, c'est un KeyError : le programme s'arrête net devant le parent." },
            { id: "s6", before: "Ce qui décide de l'ORDRE d'affichage, c'est", after: ".",
              options: ["le carnet", "la fonction", "la liste"], correct: 2,
              explanation: "Le carnet sait où sont les numéros ; c'est la liste qui dit dans quel ordre les demander." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le nom qu'on ne trouve pas",
    description: "Une fonction qui répond, même quand elle ne sait pas.",
    blocs: [
      kodi("<p>Le jour du jalon, quelqu'un demandera un nom qui n'est pas au carnet. Ton programme ne doit pas devenir rouge : il doit répondre.</p><p>Écris une fonction <code>numero_de(nom)</code> qui <strong>rend</strong> le numéro, ou <code>\"inconnu\"</code>. Puis appelle-la deux fois.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris une fonction numero_de(nom) qui RENDS le numero du contact,\n" +
            "ou le mot inconnu si le nom n'est pas au carnet.\n" +
            "Affiche ensuite le numero d'Ali, puis la reponse pour Bintou.",
          starter_code:
            'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n\n' +
            "def numero_de(nom):\n" +
            "    # A toi : rends le numero, ou inconnu\n" +
            "    return \"\"\n\n" +
            "# Puis appelle-la deux fois, et affiche les reponses\n",
          hidden_tests:
            'assert "def numero_de" in code, "Il faut une fonction appelee numero_de."\n' +
            'assert "return" in code, "Une fonction qui repond utilise return."\n' +
            'reponse = numero_de("Ali")\n' +
            'assert reponse is not None, "numero_de ne rend rien : il manque un return (print ne rend pas)."\n' +
            'assert reponse == "670112233", "numero_de(\'Ali\') doit rendre 670112233, pas " + str(reponse) + "."\n' +
            'assert numero_de("Moussa") == "678998877", "Ta fonction doit se servir de son parametre : pour Moussa elle doit rendre SON numero."\n' +
            'assert numero_de("Bintou") == "inconnu", "Pour un nom absent, numero_de doit rendre le mot inconnu, sans planter."\n' +
            'assert "670112233" in output, "Affiche le numero d Ali."\n' +
            'assert "inconnu" in output, "Affiche aussi la reponse pour Bintou."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "📱 La répétition générale",
    description: "Ton carnet sur le téléphone, comme le jour du jalon.",
    blocs: [
      kodi("<p>La répétition générale. Le même téléphone que le jalon, le même écran que verra ton parent.</p><p>Un titre, <strong>cinq contacts au moins</strong> sortis d'un carnet par une boucle, et un message final. Refais-le jusqu'à ce que ça coule tout seul — c'est fait pour.</p>"),
      jeu({
        game_type: "telephone",
        title: "La répétition générale",
        instructions:
          "Fabrique ton carnet, puis affiche-le sur le telephone : un titre, au moins CINQ contacts affiches par une boucle, et un message a la fin.\nLe message doit dire combien de contacts contient ton carnet — sers-toi de len().",
        min_contacts: 5,
        starter_code:
          "carnet = {\n" +
          '    "Ali": "670112233",\n' +
          '    "Fatou": "691445566",\n' +
          "    # ajoute les tiens, au moins cinq en tout\n" +
          "}\n\n" +
          'ecran.titre("Mon carnet")\n\n' +
          "# Une boucle pour les contacts, puis un message avec len(carnet)\n",
      }),
    ],
  },
];

const SOLUTIONS = {
  "Le nom qu'on ne trouve pas": { cas: [
    { nom: "juste avec .get", attendu: "ok", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    return carnet.get(nom, \"inconnu\")\n" +
      'print(numero_de("Ali"))\nprint(numero_de("Bintou"))\n' },
    { nom: "juste avec if in", attendu: "ok", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    if nom in carnet:\n        return carnet[nom]\n    return \"inconnu\"\n" +
      'print(numero_de("Ali"))\nprint(numero_de("Bintou"))\n' },
    { nom: "affiche au lieu de rendre", attendu: "test raté", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    print(carnet.get(nom, \"inconnu\"))\n" +
      'numero_de("Ali")\nnumero_de("Bintou")\n' },
    { nom: "ignore son parametre", attendu: "test raté", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    return carnet.get(\"Ali\", \"inconnu\")\n" +
      'print(numero_de("Ali"))\nprint(numero_de("Bintou"))\n' },
    { nom: "crochets nus : plante sur l absent", attendu: "plante", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    return carnet[nom]\n" +
      'print(numero_de("Ali"))\nprint(numero_de("Bintou"))\n' },
    { nom: "oublie d afficher", attendu: "test raté", code:
      'carnet = {"Ali": "670112233", "Fatou": "691445566", "Moussa": "678998877"}\n' +
      "def numero_de(nom):\n    return carnet.get(nom, \"inconnu\")\n" },
  ] },
};

verifier(EXOS, {
  interdits: [/\bwhile\b/, /\belif\b/],
  comptes: { "Liste ou carnet ?": 12, "Les mots du thème": 7, "Raconte le carnet de contacts": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
