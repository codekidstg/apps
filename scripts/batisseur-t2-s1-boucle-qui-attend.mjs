/**
 * Bâtisseur — thème 2, séance 1 : « La boucle qui attend ».
 *
 *     node scripts/batisseur-t2-s1-boucle-qui-attend.mjs [--ecrire] [--refaire] [--banc] [--avec-pirogue]
 *
 * Premier thème du Bâtisseur à ouvrir après « Manipuler des données », et
 * première séance d'un thème entièrement vide. Un seul outil neuf : `while`.
 * Une seule idée derrière : le nombre de tours n'appartient pas au
 * programmeur, il appartient au monde.
 *
 * La séance repose sur un jeu neuf, « La pirogue » — l'enfant écrit une boucle
 * et regarde le filet remonter tour par tour (spécification complète dans
 * `docs/jeu-pirogue.md`). Le moteur n'existe pas encore : les trois blocs de
 * jeu ne sont écrits en base qu'avec `--avec-pirogue`. Sans le drapeau, la
 * séance tient debout avec les moteurs existants — parce qu'un bloc `game`
 * dont le `game_type` n'a pas de composant rend la leçon IMPOSSIBLE à
 * terminer : `allBlocklyDone` exige que chaque bloc `game` soit résolu, et un
 * type inconnu n'affiche rien.
 *
 * Ce que le parcours a enseigné et qu'on peut donc utiliser : print, input,
 * int(), if/elif/else, for/range, les listes et .append(), def, return, None,
 * len(), les dictionnaires et .get(), != et les comparaisons, and/or/not.
 * Ce qu'il n'a JAMAIS montré à un enfant — relevé en base, pas supposé — et
 * qui reste donc interdit : while (c'est le sujet), break, True/False, +=,
 * .strip(), .split(), .lower(), try, open(), les f-strings, liste[0].
 * Conséquence assumée : pas de `while True`. On sort par la question, ce qui
 * est exactement la compétence annoncée par le thème.
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La boucle qui attend";
const AVEC_PIROGUE = process.argv.includes("--avec-pirogue");

// ── Garde-fous arithmétiques : un palier ne doit jamais se perdre au tirage ──
const PALIERS = [
  { n: 1, prise: [4, 12], objectif: 50, chavire: 70, minutes: null },
  { n: 2, prise: [10, 25], objectif: 50, chavire: 70, minutes: null },
  { n: 3, prise: [4, 12], objectif: 50, chavire: 70, minutes: 8 },
];
// Palier 1 : le pire cas doit rester SOUS le seuil — on ne peut pas chavirer,
// donc la seule façon de perdre est de s'arrêter trop tôt.
{
  const p = PALIERS[0], pire = p.objectif - 1 + p.prise[1];
  if (pire >= p.chavire) throw new Error(`palier 1 : le pire cas est ${pire} kg, il chavire à ${p.chavire}`);
}
// Palier 2 : le bon programme allège à 44 kg, donc 44 + la plus grosse prise
// doit tenir. Sinon le jeu se perd à la chance, et un jeu qui se perd à la
// chance n'enseigne rien.
{
  const p = PALIERS[1], pire = 44 + p.prise[1];
  if (pire >= p.chavire) throw new Error(`palier 2 : 44 + ${p.prise[1]} = ${pire}, il chavire à ${p.chavire}`);
  if (p.objectif - 1 + p.prise[1] < p.chavire) throw new Error("palier 2 : sans alléger, on ne peut pas chavirer — le palier n'enseigne rien");
}
// Palier 3 : huit coups doivent pouvoir suffire, sans être garantis.
{
  const p = PALIERS[2];
  if (p.minutes * p.prise[1] < p.objectif) throw new Error("palier 3 : même au mieux, 8 coups ne remplissent pas le filet");
  if (p.minutes * p.prise[0] >= p.objectif) throw new Error("palier 3 : même au pire, 8 coups remplissent le filet — la fermeture n'arrive jamais");
}

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

/** Un palier de « La pirogue ». La forme du content est figée par docs/jeu-pirogue.md. */
const pirogue = (p, { title, instructions, starter_code, exige, jeter_dispo = false }) => jeu({
  game_type: "pirogue",
  palier: p.n,
  title, instructions, starter_code, exige,
  prise: { min: p.prise[0], max: p.prise[1] },
  objectif_kg: p.objectif,
  chavire_kg: p.chavire,
  minutes_max: p.minutes,
  jeter_dispo,
  plafond_appels: 200,
  messages: {
    pas_assez: "Le marche refuse : il veut 50 kg. Ta boucle s'est arretee trop tot.",
    chavire: "Trop lourd d'un coup : la pirogue a verse. Allege avant de tirer.",
    trop_tard: "Le marche a ferme pendant que tu tirais encore.",
    sans_fin: "Ton filet n'a jamais bouge. Qu'est-ce qui devrait avancer ?",
  },
});

const BLOCS = [
  // ── 0. L'accroche : une question dont il n'a pas la réponse ─────────────
  texte(
    "<h3>Combien de coups de filet ?</h3>" +
    "<p>Il est cinq heures du matin sur le lac. Le marché ouvre à sept heures et il veut <strong>50 kg de poisson</strong>.</p>" +
    "<p>Alors, combien de coups de filet ? Quatre ? Neuf ? <strong>Tu ne peux pas le savoir.</strong> C'est le lac qui décide : un coup remonte trois poissons, le suivant en remonte douze.</p>" +
    "<p>Toutes tes boucles jusqu'ici commençaient par un nombre que tu écrivais toi-même. Aujourd'hui, ce nombre, personne ne te le donnera.</p>"
  ),

  // ── 1. Le geste, tout de suite — et il ne dépend d'aucun moteur ────────
  // La pirogue tenait ce rôle, et la séance ouvrait sur deux lectures les
  // jours où le moteur n'est pas là. Ce défi-ci est son jumeau sans animation :
  // la même boucle, avec une prise fixe. Il plante aussi, au passage, le
  // dépassement — 56 kg et non 50 — que le Terrain reprendra.
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Chaque coup de filet ramene 7 kg, et ce programme s'arrete a 20.\n" +
        "Le marche en veut 50 : change la question de la boucle, puis lance.",
      starter_code:
        "poids = 0\n\n" +
        "while poids < 20:\n" +
        "    poids = poids + 7\n" +
        '    print("Dans le filet :", poids, "kg")\n',
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Garde la boucle while : c est elle qui tire le filet."\n' +
        'assert "50" in code, "Le marche veut 50 kg : change le nombre dans la question."\n' +
        'assert output.count("Dans le filet") == 8, "Avec 7 kg par coup, il faut 8 coups pour depasser 50. Ton programme en donne " + str(output.count("Dans le filet")) + "."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "56" in nombres, "Le huitieme coup amene a 56 kg. Une boucle while depasse le seuil, elle ne tombe pas pile dessus."',
    },
  },

  // ── 2. Le même filet, mais c'est le lac qui décide ─────────────────────
  pirogue(PALIERS[0], {
    title: "La pirogue — remplir le filet",
    instructions:
      "A l'instant, chaque coup ramenait 7 kg. Sur le lac, c'est tirer() qui decide :\n" +
      "4 kg parfois, 12 kg parfois, et tu ne sais jamais lequel.\n" +
      "La meme boucle, donc, et le marche veut toujours 50 kg.",
    starter_code:
      "poids = 0\n\n" +
      "while poids < 20:\n" +
      '    poids = poids + tirer()\n' +
      '    print("Dans le filet :", poids, "kg")\n',
    exige: ["while"],
  }),

  // ── 2. L'explication, après le geste ────────────────────────────────────
  texte(
    "<h3>La boucle qui pose une question</h3>" +
    "<p>Tu connais déjà <code>for</code>. Il faut lui dire le nombre de tours d'avance : <code>for i in range(7)</code>, c'est sept tours, décidés par toi.</p>" +
    "<p><code>while</code> ne compte rien. <strong>Il pose une question avant chaque tour.</strong> Tant que la réponse est oui, il refait un tour. Dès qu'elle est non, il passe à la suite.</p>" +
    "<pre><code>poids = 0                      ← la valeur de départ\n" +
    "while poids &lt; 50:              ← la question\n" +
    "    poids = poids + tirer()    ← la ligne qui fait avancer</code></pre>" +
    "<p><strong>Trois morceaux, et il en manque un seul pour que tout casse.</strong> La valeur de départ existe avant la boucle, sinon Python ne sait pas de quoi tu parles. La ligne qui fait avancer est <em>dedans</em>, sinon la réponse ne change jamais.</p>" +
    "<p>Et le nombre de tours ? Tu ne l'as écrit nulle part. C'est le lac qui l'a décidé.</p>" +
    "<p>Un mot sur <code>tirer()</code>, que tu vas revoir souvent : c'est une commande que je te prête. Elle donne un coup de filet et ramène du poisson — <strong>et on ne sait jamais combien</strong>. C'est elle qui rend la boucle imprévisible, et c'est pour ça qu'un <code>for</code> ne peut rien ici.</p>"
  ),

  // ── 3. Les trois morceaux, à remettre ───────────────────────────────────
  jeu({
    game_type: "fill_blank",
    title: "Les trois morceaux",
    template:
      "poids = [___]\n" +
      "[___] poids < 50:\n" +
      "    poids = poids [___] tirer()",
    blanks: ["0", "while", "+"],
  }),

  // ── 4. Vérification du mécanisme ────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Tu ne sais pas d'avance combien de tours il faudra. Tu prends quoi ?",
          choices: ["for", "while", "if"], answer: 1,
          explanation: "for réclame le nombre de tours d'avance. while se contente d'une question posée avant chaque tour." },
        { question: "Où doit se trouver la ligne qui fait avancer le poids ?",
          choices: ["avant la boucle", "après la boucle", "dans la boucle"], answer: 2,
          explanation: "Dans la boucle : c'est à chaque tour que la valeur doit changer, sinon la question répond toujours la même chose." },
        { question: "Quand la question « poids < 50 » est-elle posée ?",
          choices: ["avant chaque tour", "une seule fois au début", "à la fin du programme"], answer: 0,
          explanation: "Avant chaque tour. C'est pour ça qu'une boucle while peut s'arrêter au bout de quatre tours comme au bout de onze." },
        { question: "poids vaut 50, et la question est « poids < 50 ». Combien de tours encore ?",
          choices: ["un dernier", "aucun", "deux"], answer: 1,
          explanation: "50 n'est pas plus petit que 50 : la réponse est non, la boucle s'arrête sans faire ce tour-là." },
      ],
    },
  },

  // ── 5. Le programme, dans l'ordre ───────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets la pêche dans l'ordre",
    description: "Ce programme tire le filet jusqu'à ce qu'il soit assez lourd, puis rentre.",
    hint: "Le poids existe avant qu'on pose la question. Et la ligne qui fait avancer est à l'intérieur de la boucle.",
    items: [
      "poids = 0",
      "while poids < 50:",
      '    print("Un coup de filet !")',
      "    poids = poids + tirer()",
      'print("Je rentre au marche")',
    ],
  }),

  // ── 6. Le piège de la séance ────────────────────────────────────────────
  texte(
    "<h3>La boucle qui ne finit plus</h3>" +
    "<p>Enlève la ligne qui fait avancer. <code>poids</code> reste à 0. La question « poids &lt; 50 » répond oui… et répond oui… et répond oui.</p>" +
    "<p><strong>Le programme ne s'arrête plus.</strong> Rien ne s'affiche, le bouton vert tourne dans le vide. Ça arrive à tous ceux qui écrivent des boucles, et ça arrivera à toi.</p>" +
    "<p>Deux choses à savoir, et tu n'auras plus peur :</p>" +
    "<p>1. Le bouton <strong>■ Arrêter</strong> est juste à côté du bouton vert. Il coupe le programme net.<br>" +
    "2. Dans la pirogue, au 200ᵉ coup de filet, le jeu s'arrête tout seul et te pose la question : <em>qu'est-ce qui devrait avancer ?</em></p>" +
    "<p>Une boucle sans fin n'est pas une catastrophe. C'est une ligne oubliée.</p>"
  ),

  // ── 7. Le piège en action ───────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Le filet qui ne remonte jamais",
    context: "Le programme devait tirer jusqu'à 50 kg. Il tire pour toujours : il a fallu cliquer sur ■ Arrêter.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 3,
    fix: "    poids = poids + tirer()",
    explanation: "poids + tirer() calcule bien le nouveau poids… puis le jette. Sans le signe =, rien n'est rangé : poids reste à 0, la question répond toujours oui, et la boucle ne s'arrête jamais.",
    instructions: [
      "poids = 0",
      "while poids < 50:",
      '    print("Un coup de filet !")',
      "    poids + tirer()",
    ],
  }),

  // ── 8. Palier 2 : décider à l'intérieur de la boucle ────────────────────
  pirogue(PALIERS[1], {
    title: "La pirogue — ne pas chavirer",
    instructions:
      "Aujourd'hui le lac est genereux : un coup de filet peut remonter 25 kg d'un coup.\n" +
      "La pirogue chavire a 70 kg. Tu peux rejeter des poissons a l'eau avec jeter(10).\n" +
      "Allege AVANT de tirer, pas apres : apres, il est trop tard.",
    starter_code:
      "poids = 0\n\n" +
      "while poids < 50:\n" +
      "    # Si la pirogue est deja lourde, allege avant le prochain coup.\n" +
      "    poids = poids + tirer()\n" +
      '    print("Dans le filet :", poids, "kg")\n',
    exige: ["while", "if", "jeter"],
    jeter_dispo: true,
  }),

  // ── 9. La deuxième forme : attendre quelqu'un ───────────────────────────
  texte(
    "<h3>La boucle qui attend quelqu'un</h3>" +
    "<p>Jusqu'ici tu savais où tu allais : 50 kg. Mais au marché, le matin, tu ne sais pas combien de clients viendront. Tu sers, et tu fermes quand il n'y a plus personne.</p>" +
    "<pre><code>reponse = input(\"Nom du client (ou fin) : \")\n\n" +
    "while reponse != \"fin\":\n" +
    "    print(\"Bonjour\", reponse)\n" +
    "    reponse = input(\"Nom du client (ou fin) : \")</code></pre>" +
    "<p><strong>La même question est écrite deux fois. C'est normal, et ce n'est pas une erreur.</strong></p>" +
    "<p>La première la pose <em>avant</em> le premier tour : sans elle, <code>reponse</code> n'existe pas encore et Python s'arrête tout de suite. La seconde la repose <em>à la fin de chaque tour</em> : sans elle, <code>reponse</code> garde la même valeur pour toujours — et tu connais la suite.</p>" +
    "<p>Le mot <code>\"fin\"</code> est la sortie. Écris-le dans la question, sinon personne ne saura comment fermer la boutique.</p>"
  ),

  // ── 10. On le fait soi-même ─────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ouvre la boutique. Pour chaque client, demande son nom et dis-lui bonjour.\n" +
        "Quand on tape fin, la boutique ferme : annonce combien de clients sont passes.\n" +
        "Attention : « fin » n'est pas un client. On ne lui dit pas bonjour.",
      starter_code:
        "clients = 0\n" +
        'reponse = input("Nom du client (ou fin) : ")\n\n' +
        "# Tant que ce n'est pas fin : dis bonjour, compte le client,\n" +
        "# et repose la question.\n",
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Tu ne sais pas combien de clients viendront : il faut une boucle while."\n' +
        'assert code.count("input(") >= 2, "La question doit etre posee deux fois : une avant la boucle, une a la fin de chaque tour."\n' +
        'assert "bonjour fin" not in output.lower(), "fin n est pas un client : la boutique ferme, elle ne le salue pas."\n' +
        'assert "Ama" in output, "Le premier client s appelle Ama, et ton programme doit le saluer."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "2" in nombres, "Deux clients sont passes avant fin. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")',
    },
  },

  // ── 11. La question posée une seule fois ────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Le client qui revient sans arrêt",
    context: "Le programme devait saluer chaque client jusqu'à « fin ». Il salue Ama, puis Ama, puis Ama…",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 3,
    fix: '    reponse = input("Nom du client (ou fin) : ")',
    explanation: "La question est posée une seule fois, avant la boucle. À l'intérieur, reponse ne change plus jamais : elle vaut Ama pour l'éternité. Il faut reposer la question à la fin de chaque tour.",
    instructions: [
      'reponse = input("Nom du client (ou fin) : ")',
      'while reponse != "fin":',
      '    print("Bonjour", reponse)',
      '    print("Client suivant !")',
    ],
  }),

  // ── 12. Consolidation ───────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Pourquoi écrit-on la même question input() deux fois ?",
          choices: ["Par sécurité, au cas où", "Une fois avant le premier tour, une fois à la fin de chaque tour", "C'est une erreur à corriger"], answer: 1,
          explanation: "Avant la boucle pour que la variable existe, et à la fin de chaque tour pour qu'elle change. Enlève l'une des deux et le programme casse — chaque fois d'une manière différente." },
        { question: 'La question est while reponse != "fin". Le client tape « Fin », avec un grand F.',
          choices: ["La boutique ferme quand même", "La boucle continue : pour Python, ce n'est pas le même mot", "Python corrige la majuscule tout seul"], answer: 1,
          explanation: "Python compare les textes lettre par lettre. « Fin » et « fin » sont deux mots différents pour lui. On réglera ça la semaine prochaine." },
        { question: "Tu as oublié la ligne qui fait avancer. Que fais-tu ?",
          choices: ["Je clique sur ■ Arrêter, puis j'ajoute la ligne", "Je ferme l'onglet", "J'attends que ça finisse"], answer: 0,
          explanation: "Ça ne finira pas tout seul. ■ Arrêter coupe le programme, et la ligne oubliée se rajoute en deux secondes." },
        { question: "« Affiche les 5 premiers clients de la liste. » for ou while ?",
          choices: ["while", "for", "Les deux marchent, c'est au choix"], answer: 1,
          explanation: "Cinq, c'est un nombre que tu connais d'avance : c'est le travail de for. while sert quand c'est le monde qui décide." },
      ],
    },
  },

  // ── 13. Palier 3 : deux raisons d'arrêter ───────────────────────────────
  pirogue(PALIERS[2], {
    title: "La pirogue — rentrer avant la fermeture",
    instructions:
      "Chaque coup de filet coute une minute, et le marche ferme dans 8 minutes.\n" +
      "Deux raisons d'arreter, donc : le filet est plein, OU il est trop tard.\n" +
      "Et apres la boucle, dis laquelle des deux t'a arrete.",
    starter_code:
      "poids = 0\n\n" +
      "# Deux conditions dans la meme question : sers-toi de and.\n" +
      "while poids < 50:\n" +
      "    poids = poids + tirer()\n\n" +
      "# Le filet est-il plein, ou le marche a-t-il ferme ?\n",
    exige: ["while", "and", "if"],
  }),

  // ── 14. Le défi de la séance ────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le carnet de la journee. A chaque vente, tape le montant en francs ; tape fin pour fermer.\n" +
        "A la fermeture, affiche le nombre de ventes et le total de la journee.\n" +
        "Attention : « fin » n'est pas un nombre. Compare d'abord, convertis ensuite.",
      starter_code:
        "total = 0\n" +
        "ventes = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n\n' +
        "# Tant que ce n'est pas fin : ajoute au total, compte la vente,\n" +
        "# et repose la question. Le montant arrive en texte : int() le convertit.\n",
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Tu ne sais pas combien de ventes tu feras : il faut une boucle while."\n' +
        'assert code.count("input(") >= 2, "La question doit etre posee deux fois : une avant la boucle, une a la fin de chaque tour."\n' +
        'assert "int(" in code, "Les montants arrivent en texte. Pour les additionner, il faut les convertir avec int()."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "4600" in nombres, "1500 + 800 + 2300 font 4600. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
        'assert "3" in nombres, "Trois ventes avant fin : ton programme doit annoncer leur nombre."',
    },
  },

  // ── 15. Les mots de la séance ───────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la séance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "while", right: "Tant que la réponse est oui, on refait un tour" },
      { left: "La ligne qui fait avancer", right: "Sans elle, la boucle ne s'arrête jamais" },
      { left: "poids + tirer()", right: "Calcule, puis jette le résultat" },
      { left: "■ Arrêter", right: "Couper un programme qui ne finit plus" },
      { left: "input écrit deux fois", right: "Une fois avant, une fois à chaque tour" },
    ],
  }),

  // ── 16. Ce qu'il sait faire, et le mur suivant ──────────────────────────
  texte(
    "<h3>Ce que tu sais faire maintenant</h3>" +
    "<p>Écrire un programme qui tourne <strong>sans savoir d'avance combien de tours il fera</strong>. Le laisser s'arrêter tout seul quand c'est assez, ou quand il est trop tard. Et le faire attendre quelqu'un — un client, une réponse — jusqu'à ce qu'on lui dise de fermer.</p>" +
    "<p>Tu sais aussi reconnaître une boucle sans fin, et tu sais qu'elle ne vient jamais d'un mystère : c'est une ligne qui n'avance pas.</p>" +
    "<h3>La semaine prochaine</h3>" +
    "<p>Ton carnet de ventes a un défaut, et tu l'as peut-être déjà vu. Le client tape <code>Fin</code> avec un grand F, ou <code>fin </code> avec un espace derrière, et la boutique ne ferme pas.</p>" +
    "<p>Pire : il tape <code>1 500</code> au lieu de <code>1500</code>, et ton programme s'arrête net. Pour Python, ces textes-là ne sont pas les mêmes — et il va falloir les mettre au travail.</p>"
  ),
];

// ── Le banc : bonnes et mauvaises solutions des défis de code ────────────
const SOLUTIONS = {
  1: { cas: [
    { nom: "juste", attendu: "ok", code:
      "poids = 0\n\nwhile poids < 50:\n    poids = poids + 7\n    print(\"Dans le filet :\", poids, \"kg\")\n" },
    { nom: "laisse la question a 20", attendu: "test raté", code:
      "poids = 0\n\nwhile poids < 20:\n    poids = poids + 7\n    print(\"Dans le filet :\", poids, \"kg\")\n" },
    // Huit tours écrits à la main : le compte tombe juste, et pourtant ce
    // n'est pas une boucle qui a décidé du nombre.
    { nom: "un for de huit tours", attendu: "test raté", code:
      "poids = 0\n\nfor i in range(8):\n    poids = poids + 7\n    print(\"Dans le filet :\", poids, \"kg\")\n" },
  ] },
  11: {
    reponses: ["Ama", "Kofi", "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "clients = 0\n" +
        'reponse = input("Nom du client (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        '    print("Bonjour", reponse)\n' +
        "    clients = clients + 1\n" +
        '    reponse = input("Nom du client (ou fin) : ")\n' +
        'print("Clients :", clients)\n' },
      // Le piège classique : la question posée en tête de boucle, donc « fin »
      // se fait saluer avant que la boucle s'arrête.
      { nom: "dit bonjour a fin", attendu: "test raté", code:
        "clients = 0\n" +
        'reponse = ""\n' +
        'while reponse != "fin":\n' +
        '    reponse = input("Nom du client (ou fin) : ")\n' +
        '    print("Bonjour", reponse)\n' +
        "    clients = clients + 1\n" +
        'print("Clients :", clients)\n' },
      // Celui-là pose bien la question deux fois, mais la repose AVANT de
      // saluer : « fin » se fait dire bonjour. C'est la faute la plus fine de
      // la séance, et la seule que le compte d'input() ne voit pas.
      { nom: "salue fin quand meme", attendu: "test raté", code:
        "clients = 0\n" +
        'reponse = input("Nom du client (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    clients = clients + 1\n" +
        '    reponse = input("Nom du client (ou fin) : ")\n' +
        '    print("Bonjour", reponse)\n' +
        'print("Clients :", clients)\n' },
      { nom: "oublie de compter", attendu: "test raté", code:
        'reponse = input("Nom du client (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        '    print("Bonjour", reponse)\n' +
        '    reponse = input("Nom du client (ou fin) : ")\n' },
      { nom: "un for sur trois clients", attendu: "test raté", code:
        'for nom in ["Ama", "Kofi"]:\n' +
        '    print("Bonjour", nom)\n' +
        'print("Clients :", 2)\n' },
    ],
  },
  15: {
    reponses: ["1500", "800", "2300", "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "total = 0\n" +
        "ventes = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    total = total + int(reponse)\n" +
        "    ventes = ventes + 1\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Ventes :", ventes)\n' +
        'print("Total :", total, "F")\n' },
      // Le piège de la séance : convertir avant de comparer. int("fin") plante.
      { nom: "convertit avant de comparer", attendu: "plante", code:
        "total = 0\n" +
        "ventes = 0\n" +
        'montant = int(input("Montant de la vente (ou fin) : "))\n' +
        "while montant != 0:\n" +
        "    total = total + montant\n" +
        "    ventes = ventes + 1\n" +
        '    montant = int(input("Montant de la vente (ou fin) : "))\n' +
        'print("Ventes :", ventes)\n' +
        'print("Total :", total, "F")\n' },
      { nom: "oublie le total", attendu: "test raté", code:
        "ventes = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    ventes = ventes + 1\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Ventes :", ventes)\n' },
    ],
  },
};

// ── Les objectifs et l'acquis : la leçon n'avait qu'un slogan ────────────
const OBJECTIFS = [
  "Écrire une boucle qui tourne sans savoir d'avance combien de tours elle fera",
  "Reconnaître les trois morceaux d'un while : la valeur de départ, la question, et la ligne qui fait avancer",
  "Comprendre qu'une boucle sans fin vient d'une valeur qui n'avance pas — et savoir l'arrêter",
  "Faire tourner un programme jusqu'à ce que la personne décide de s'arrêter, en reposant la question à chaque tour",
];
const ACQUIS = "écrire un programme qui s'arrête tout seul au bon moment, sans qu'on lui dise combien de fois répéter";

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };

// Ce que le parcours n'a jamais montré à un enfant n'a pas sa place ici.
// `while` est la seule nouveauté de la séance, et elle est voulue.
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\blambda\b/,
  /\+=/, /\.strip\(/, /\.split\(/, /\.lower\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
  /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/, /\[\s*\d+\s*\]/];
BLOCS.forEach((b, i) => {
  const visible = JSON.stringify({ ...b.content, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} (${b.type}) contient ${rx} — jamais enseigné dans le parcours`);
});

// Chaque bloc doit dire quelque chose.
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  if (b.type === "text" && (c.html ?? "").replace(/<[^>]+>/g, "").trim().length < 80) mauvais(`bloc ${i} : texte trop court`);
  if (b.type === "code_challenge") {
    if (!c.instructions) mauvais(`bloc ${i} : défi sans consigne`);
    if (!c.starter_code) mauvais(`bloc ${i} : défi sans amorce`);
    if (!c.hidden_tests) mauvais(`bloc ${i} : défi sans tests`);
    if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`bloc ${i} : l'amorce finit sur un bloc vide`);
  }
  if (b.type === "quiz") {
    // Le lecteur de SÉANCE mélange les choix (QuestReader : seededShuffle), au
    // contraire du lecteur d'entraînement. Le rang n'y décide donc rien — on
    // garde la règle par prudence, pour le jour où ce mélange disparaîtrait.
    const rangs = c.questions.map((q) => q.answer);
    if (new Set(rangs).size === 1) mauvais(`bloc ${i} : toutes les bonnes réponses au même rang`);
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
  if (c.game_type === "sort") {
    if (!c.items || c.items.length < 3 || !c.hint) mauvais(`bloc ${i} : tri d'ordre incomplet`);
    else if (new Set(c.items).size !== c.items.length) mauvais(`bloc ${i} : deux lignes identiques dans le tri`);
  }
  if (c.game_type === "memory") {
    const g1 = c.pairs.map((p) => p.left), d1 = c.pairs.map((p) => p.right);
    if (new Set(g1).size !== g1.length || new Set(d1).size !== d1.length) mauvais(`bloc ${i} : paires en double`);
  }
  // Le moteur découpe le gabarit sur « [___] » : autant de trous que de réponses,
  // sinon des cases s'affichent sans jamais pouvoir être justes.
  if (c.game_type === "fill_blank") {
    const trous = (c.template.match(/\[___\]/g) ?? []).length;
    if (trous !== c.blanks.length) mauvais(`bloc ${i} : ${trous} trous pour ${c.blanks.length} réponses`);
    if (c.blanks.some((x) => !x || x.length > 12)) mauvais(`bloc ${i} : une réponse trop longue pour la case (12 caractères)`);
  }
  // La pirogue : l'amorce doit tourner telle quelle, et les mots exigés doivent
  // avoir une chance d'être écrits par l'enfant.
  if (c.game_type === "pirogue") {
    if (!c.starter_code || !c.instructions) mauvais(`bloc ${i} : palier sans amorce ou sans consigne`);
    if (!c.exige?.length) mauvais(`bloc ${i} : palier sans mot exigé — un programme au hasard pourrait gagner`);
    if (c.objectif_kg >= c.chavire_kg) mauvais(`bloc ${i} : l'objectif dépasse le seuil de chavirement`);
    if (c.prise.min > c.prise.max) mauvais(`bloc ${i} : prise minimale plus grande que la maximale`);
    if (!c.plafond_appels) mauvais(`bloc ${i} : palier sans plafond d'appels — une boucle sans fin gèlerait l'onglet`);
    if (c.exige.includes("jeter") && !c.jeter_dispo) mauvais(`bloc ${i} : jeter() est exigé mais pas disponible`);
    if (c.exige.includes("and") && !c.minutes_max) mauvais(`bloc ${i} : deux conditions exigées, mais une seule a un seuil`);
  }
});

if (ACQUIS.length < 10 || ACQUIS.length > 160) mauvais(`acquis : ${ACQUIS.length} caractères, la base en veut entre 10 et 160`);
if (/^[A-ZÀ-Ý]/.test(ACQUIS) || ACQUIS.endsWith(".")) mauvais("acquis : ni majuscule au début ni point à la fin — il se range dans une phrase");
if (OBJECTIFS.length !== 4) mauvais(`${OBJECTIFS.length} objectifs, les séances réussies en portent 4`);

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
const nb = (t) => BLOCS.filter((b) => (b.content.game_type ?? b.type) === t).length;
dire(`✓ ${BLOCS.length} blocs · ${nb("code_challenge")} défis de code · ${nb("quiz")} quiz · ${nb("pirogue")} paliers de pirogue · ${nb("bug_hunt")} chasses au bug`);
dire("✓ vocabulaire, amorces, quiz, jeux, trous, paliers et acquis : vérifiés");

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

// Un bloc `game` dont le game_type n'a pas de composant rend la leçon
// infinissable : allBlocklyDone exige que chacun soit résolu, et un type
// inconnu n'affiche rien. Tant que le moteur n'existe pas, la pirogue reste
// écrite ici et absente de la base.
const A_ECRIRE = AVEC_PIROGUE ? BLOCS : BLOCS.filter((b) => b.content.game_type !== "pirogue");
const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${A_ECRIRE.length} blocs sur « ${L.title} » (${L.status})`);
console.log(AVEC_PIROGUE
  ? "⚠ --avec-pirogue : les 3 paliers sont inclus. Le moteur doit exister, sinon la leçon ne peut plus être terminée.\n"
  : `↷ ${BLOCS.length - A_ECRIRE.length} paliers de pirogue écrits mais NON insérés (moteur absent) — --avec-pirogue quand il existera.\n`);
A_ECRIRE.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(16)} ${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 56))}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const { error } = await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
  if (error) throw new Error(`suppression : ${error.message}`);
  console.log(`  ⟲ ${deja.length} blocs remplacés`);
}
const { error } = await db.from("lesson_blocks").insert(
  A_ECRIRE.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (error) throw new Error(error.message);

const { error: eo } = await db.from("lessons").update({ objectives: OBJECTIFS, acquis: ACQUIS }).eq("id", L.id);
if (eo) throw new Error(`objectifs : ${eo.message}`);

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = (await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id))).sort((a, b) => a.order_index - b.order_index);
ok(ap.length === A_ECRIRE.length, `${A_ECRIRE.length} blocs écrits (trouvé ${ap.length})`);
ok(ap.every((b, i) => b.order_index === i), "numérotation contiguë");
ok(ap.every((b) => b.content && Object.keys(b.content).length), "aucun bloc vide");
ok(ap.filter((b) => b.type === "code_challenge").every((b) => b.content.hidden_tests), "chaque défi garde ses tests");
const RENDUS = ["memory", "association", "sort", "fill_blank", "bug_hunt", "maze", "python_maze",
  "python_piano", "python_arcade", "telephone", "music", "kodi_output", "pattern_select",
  "pattern_build", "plan_builder", "deviens_ordinateur"];
const orphelins = ap.filter((b) => b.type === "game" && !RENDUS.includes(b.content.game_type));
ok(orphelins.length === 0, `aucun jeu sans moteur (${orphelins.map((b) => b.content.game_type).join(", ") || "aucun"})`);
const relu = (await g("lessons", "objectives,acquis", (q) => q.eq("id", L.id)))[0];
ok(relu.objectives?.length === 4, `4 objectifs en base (trouvé ${relu.objectives?.length ?? 0})`);
ok(relu.acquis === ACQUIS, "l'acquis est en base, au mot près");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
