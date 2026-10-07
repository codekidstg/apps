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

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const BLOCS = [
  // ── 0. L'accroche : une question dont il n'a pas la réponse ─────────────
  texte(
    "<h3>Combien de seaux ?</h3>" +
    "<p>Il est six heures du matin au forage. La bassine de la maison est vide, et il lui faut <strong>40 litres</strong>.</p>" +
    "<p>Alors, combien de seaux ? Quatre ? Neuf ? <strong>Tu ne peux pas le savoir.</strong> C'est la pompe qui décide : un coup donne quatre litres, le suivant en donne douze.</p>" +
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
        "<p>Ta mère t'envoie au forage. La bassine de la maison fait <strong>40 litres</strong>, et elle est vide.</p>" +
        "<p>Quelqu'un a commencé le programme avant toi — mais il s'arrête à <strong>16 litres</strong>. La bassine est loin d'être pleine.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — fais-le remplir toute la bassine.<br>" +
        "🧰 <strong>Tu as</strong> — un programme qui marche déjà, et <strong>un seul nombre à changer</strong>.<br>" +
        "✅ <strong>C'est réussi quand</strong> — l'eau arrive au trait des 40 litres.</p>",
      starter_code:
        "litres = 0\n\n" +
        "while litres < 16:\n" +
        "    litres = litres + tirer()\n" +
        '    print("Dans la bassine :", litres, "litres")\n',
      // Le décor que ce programme fait bouger : l'eau monte d'un cran à chaque
      // tour de la boucle. Sans ce champ, le défi garde sa console noire.
      scene: { decor: "forage", reglages: { contenance: 40, prise_min: 8, prise_max: 8 }, plafond: 200 },
      hidden_tests:
        "import re\n" +
        'assert "while" in code, "Garde la boucle while : c est elle qui remplit la bassine."\n' +
        'assert "40" in code, "La bassine veut 40 litres : change le nombre dans la question."\n' +
        'assert output.count("Dans la bassine") == 5, "Avec 8 litres par coup, il faut 5 coups pour remplir 40 litres. Ton programme en donne " + str(output.count("Dans la bassine")) + "."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "40" in nombres, "Le cinquieme coup remplit la bassine : 40 litres."',
    },
  },

  // ── 2. L'explication, après le geste ────────────────────────────────────
  texte(
    "<h3>La boucle qui pose une question</h3>" +
    "<p>Tu connais déjà <code>for</code>. Il faut lui dire le nombre de tours d'avance : <code>for i in range(7)</code>, c'est sept tours, décidés par toi.</p>" +
    "<p><code>while</code> ne compte rien. <strong>Il pose une question avant chaque tour.</strong> Tant que la réponse est oui, il refait un tour. Dès qu'elle est non, il passe à la suite.</p>" +
    "<pre><code>litres = 0                     ← la valeur de départ\n" +
    "while litres &lt; 40:             ← la question\n" +
    "    litres = litres + tirer()  ← la ligne qui fait avancer</code></pre>" +
    "<p><strong>Trois morceaux, et il en manque un seul pour que tout casse.</strong> La valeur de départ existe avant la boucle, sinon Python ne sait pas de quoi tu parles. La ligne qui fait avancer est <em>dedans</em>, sinon la réponse ne change jamais.</p>" +
    "<p>Et le nombre de tours ? Tu ne l'as écrit nulle part. C'est la pompe qui l'a décidé.</p>" +
    "<p>Un mot sur <code>tirer()</code>, que tu vas revoir souvent : c'est une commande que je te prête. Elle donne un coup de pompe et remonte de l'eau — <strong>et on ne sait jamais combien</strong>. C'est elle qui rend la boucle imprévisible, et c'est pour ça qu'un <code>for</code> ne peut rien ici.</p>"
  ),

  // ── 3. Les trois morceaux, à remettre ───────────────────────────────────
  jeu({
    game_type: "fill_blank",
    title: "Les trois morceaux",
    template:
      "litres = [___]\n" +
      "[___] litres < 40:\n" +
      "    litres = litres [___] tirer()",
    blanks: ["0", "while", "+"],
  }),

  // ── La pompe capricieuse : éditeur vide, c'est à lui d'écrire ──────────
  // Le nombre de tours est tiré au sort, donc ni l'enfant ni personne ne peut
  // l'écrire d'avance. C'est la seule façon de PROUVER qu'un `for` ne suffit
  // pas — et la consigne l'invite à essayer, pour qu'il le voie.
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Ce matin, la pompe est capricieuse : un coup donne 4 litres, le suivant en donne 12. <strong>Tu ne peux pas savoir combien de seaux il te faudra</strong> — personne ne peut.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — remplir les 40 litres de la bassine, et annoncer combien de seaux il a fallu.<br>" +
        "🧰 <strong>Tu as</strong> — <code>tirer()</code>, qui donne le contenu d'un seau en litres. Et un éditeur vide : tout le programme est à toi.<br>" +
        "✅ <strong>C'est réussi quand</strong> — la bassine est pleine, et que ta dernière ligne annonce le nombre de seaux.</p>" +
        "<p>⚠️ Un <code>for i in range(...)</code> ne peut pas gagner ici. Essaie, pour voir ce qui se passe.</p>",
      scene: { decor: "forage", reglages: { contenance: 40, prise_min: 4, prise_max: 12 }, plafond: 200 },
      starter_code:
        "# La bassine fait 40 litres. tirer() te donne un seau.\n" +
        "# A toi d'ecrire le programme.\n",
      hidden_tests:
        "seaux = [e for e in _journal if e[\"quoi\"] == \"verser\"]\n" +
        "total = sum(e[\"litres\"] for e in seaux)\n" +
        'assert "while" in code, "Tu ne sais pas combien de seaux il faudra : seul un while peut decider tout seul quand s arreter."\n' +
        'assert total >= 40, "La bassine veut 40 litres, et ton programme s arrete a " + str(total) + "."\n' +
        'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
        'assert lignes, "Ton programme n affiche rien. Dis au moins combien de seaux il a fallu."\n' +
        'assert str(len(seaux)) in lignes[-1], "Il a fallu " + str(len(seaux)) + " seaux : ta derniere ligne doit l annoncer."',
    },
  },

  // ── 4. Vérification du mécanisme ────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Tu ne sais pas d'avance combien de tours il faudra. Tu prends quoi ?",
          choices: ["for", "while", "if"], answer: 1,
          explanation: "for réclame le nombre de tours d'avance. while se contente d'une question posée avant chaque tour." },
        { question: "Où doit se trouver la ligne qui fait avancer le niveau ?",
          choices: ["avant la boucle", "après la boucle", "dans la boucle"], answer: 2,
          explanation: "Dans la boucle : c'est à chaque tour que la valeur doit changer, sinon la question répond toujours la même chose." },
        { question: "Quand la question « litres < 40 » est-elle posée ?",
          choices: ["avant chaque tour", "une seule fois au début", "à la fin du programme"], answer: 0,
          explanation: "Avant chaque tour. C'est pour ça qu'une boucle while peut s'arrêter au bout de quatre tours comme au bout de onze." },
        { question: "litres vaut 40, et la question est « litres < 40 ». Combien de tours encore ?",
          choices: ["un dernier", "aucun", "deux"], answer: 1,
          explanation: "40 n'est pas plus petit que 40 : la réponse est non, la boucle s'arrête sans faire ce tour-là." },
      ],
    },
  },

  // ── 5. Le programme, dans l'ordre ───────────────────────────────────────
  jeu({
    game_type: "sort",
    title: "Remets le remplissage dans l'ordre",
    description: "Ce programme remplit la bassine jusqu'à ce qu'elle soit pleine, puis le dit.",
    hint: "Le niveau existe avant qu'on pose la question. Et la ligne qui fait avancer est à l'intérieur de la boucle.",
    items: [
      "litres = 0",
      "while litres < 40:",
      '    print("Un coup de pompe !")',
      "    litres = litres + tirer()",
      'print("La bassine est pleine")',
    ],
  }),

  // ── 6. Le piège de la séance ────────────────────────────────────────────
  texte(
    "<h3>La boucle qui ne finit plus</h3>" +
    "<p>Enlève la ligne qui fait avancer. <code>litres</code> reste à 0. La question « litres &lt; 40 » répond oui… et répond oui… et répond oui.</p>" +
    "<p><strong>Le programme ne s'arrête plus.</strong> Rien ne s'affiche, le bouton vert tourne dans le vide. Ça arrive à tous ceux qui écrivent des boucles, et ça arrivera à toi.</p>" +
    "<p>Deux choses à savoir, et tu n'auras plus peur :</p>" +
    "<p>1. Le bouton <strong>■ Arrêter</strong> est juste à côté du bouton vert. Il coupe le programme net.<br>" +
    "2. Au 200ᵉ coup de pompe, le programme s'arrête tout seul et te pose la question : <em>qu'est-ce qui devrait avancer ?</em></p>" +
    "<p>Une boucle sans fin n'est pas une catastrophe. C'est une ligne oubliée.</p>"
  ),

  // ── 7. Le piège en action ───────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "La bassine qui ne monte jamais",
    context: "Le programme devait remplir 40 litres. Il pompe pour toujours : il a fallu cliquer sur ■ Arrêter.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 3,
    fix: "    litres = litres + tirer()",
    explanation: "litres + tirer() calcule bien le nouveau niveau… puis le jette. Sans le signe =, rien n'est rangé : litres reste à 0, la question répond toujours oui, et la boucle ne s'arrête jamais.",
    instructions: [
      "litres = 0",
      "while litres < 40:",
      '    print("Un coup de pompe !")',
      "    litres + tirer()",
    ],
  }),

  // ── Ne pas déborder : la question peut parler de ce qui VA arriver ─────
  // `break` n'est pas enseigné, et c'est tant mieux : la seule issue est une
  // condition qui regarde le tour suivant. Un `while litres < 40` déborde à
  // 48, et le décor le montre — l'eau par terre et la terre qui fonce.
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>Tu as vu ce qui s'est passé : la bassine a un peu débordé. Normal — une boucle s'arrête <em>après</em> avoir dépassé, pas pile dessus.</p>" +
        "<p>Aujourd'hui le seau est grand : <strong>12 litres à chaque coup</strong>. La bassine n'en contient que 40, et l'eau qui déborde est perdue.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — mettre le plus d'eau possible dans la bassine, <strong>sans jamais la faire déborder</strong>.<br>" +
        "🧰 <strong>Tu as</strong> — <code>tirer()</code>, qui donne toujours 12 litres aujourd'hui.<br>" +
        "✅ <strong>C'est réussi quand</strong> — il n'y a pas une goutte par terre, et qu'on ne pouvait pas en mettre un de plus.</p>" +
        "<p>💡 Ta question ne doit plus parler de ce que la bassine contient, mais de ce qu'elle contiendrait <em>après</em> le prochain seau.</p>",
      scene: { decor: "forage", reglages: { contenance: 40, prise_min: 12, prise_max: 12 }, plafond: 200 },
      starter_code:
        "litres = 0\n\n" +
        "# Chaque seau fait 12 litres, la bassine en contient 40.\n" +
        "# Remplis au maximum, sans une goutte par terre.\n",
      hidden_tests:
        "seaux = [e for e in _journal if e[\"quoi\"] == \"verser\"]\n" +
        "total = sum(e[\"litres\"] for e in seaux)\n" +
        'assert "while" in code, "Il faut une boucle while : tu ne sais pas d avance combien de seaux tiennent dans la bassine."\n' +
        'assert total <= 40, "Ca a deborde : " + str(total) + " litres verses dans une bassine de 40. Ta question doit regarder le seau SUIVANT."\n' +
        'assert total >= 36, "Tu t es arrete trop tot : avec des seaux de 12 litres, on peut monter jusqu a 36 sans deborder. Toi, tu es a " + str(total) + "."',
    },
  },

  // ── 9. La deuxième forme : attendre quelqu'un ───────────────────────────
  texte(
    "<h3>La boucle qui attend quelqu'un</h3>" +
    "<p>Jusqu'ici tu savais où tu allais : 40 litres. Mais au marché, le matin, tu ne sais pas combien de clients viendront. Tu sers, et tu fermes quand il n'y a plus personne.</p>" +
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
        "<p>Tu tiens la boutique du quartier. Les clients arrivent les uns après les autres, et tu ne sais pas combien viendront aujourd'hui.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — saluer chaque client par son nom, jusqu'à ce qu'on tape <code>fin</code>. À la fermeture, annoncer combien sont passés.<br>" +
        "🧰 <strong>Tu as</strong> — <code>input()</code> pour demander, et le premier client est déjà écrit.<br>" +
        "✅ <strong>C'est réussi quand</strong> — chaque client a son bonjour, <strong>« fin » n'en reçoit pas</strong>, et le compte s'affiche à la fin.</p>",
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

  // ── 14. Le défi de la séance ────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "<p>C'est le soir. Avant de fermer, tu reprends le carnet de la journée : chaque vente, l'une après l'autre.</p>" +
        "<p>🎯 <strong>Ta mission</strong> — saisir les montants jusqu'à <code>fin</code>, puis annoncer le nombre de ventes et le total de la journée.<br>" +
        "🧰 <strong>Tu as</strong> — <code>int()</code> pour transformer un texte en nombre, et trois valeurs qui partent de zéro.<br>" +
        "✅ <strong>C'est réussi quand</strong> — les deux chiffres s'affichent, et que le programme ne plante pas sur le mot <code>fin</code>.</p>" +
        "<p>⚠️ « fin » n'est pas un nombre : compare d'abord, convertis ensuite.</p>",
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
      { left: "litres + tirer()", right: "Calcule, puis jette le résultat" },
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
  1: {
    // Le banc rejoue le prélude de la scène : `tirer()` doit exister ici comme
    // il existe dans le navigateur, sinon on testerait un autre programme.
    prelude: "def tirer():\n    return 8\n",
    cas: [
      { nom: "juste", attendu: "ok", code:
        "litres = 0\n\nwhile litres < 40:\n    litres = litres + tirer()\n    print(\"Dans la bassine :\", litres, \"litres\")\n" },
      { nom: "laisse la question a 16", attendu: "test raté", code:
        "litres = 0\n\nwhile litres < 16:\n    litres = litres + tirer()\n    print(\"Dans la bassine :\", litres, \"litres\")\n" },
      // Cinq tours écrits à la main : le compte tombe juste, et pourtant ce
      // n'est pas une boucle qui a décidé du nombre.
      { nom: "un for de cinq tours", attendu: "test raté", code:
        "litres = 0\n\nfor i in range(5):\n    litres = litres + tirer()\n    print(\"Dans la bassine :\", litres, \"litres\")\n" },
    ],
  },
  // Le banc rejoue un tirage FIXE : hors du navigateur, le hasard rendrait les
  // verdicts incomparables d'une exécution à l'autre.
  4: {
    prelude:
      "_journal = []\n" +
      "_suite = [7, 11, 5, 9, 12, 4]\n" +
      "def tirer():\n" +
      "    prise = _suite[len(_journal) % len(_suite)]\n" +
      '    _journal.append({"quoi": "verser", "litres": prise})\n' +
      "    return prise\n",
    cas: [
      { nom: "juste", attendu: "ok", code:
        "litres = 0\nseaux = 0\nwhile litres < 40:\n    litres = litres + tirer()\n    seaux = seaux + 1\n" +
        '    print("Dans la bassine :", litres, "litres")\nprint("Seaux :", seaux)\n' },
      // Le for ne peut pas gagner : il faut écrire un nombre de tours, et aucun
      // nombre n'est le bon quand la pompe décide.
      { nom: "un for de trois tours", attendu: "test raté", code:
        "litres = 0\nfor i in range(3):\n    litres = litres + tirer()\n" +
        '    print("Dans la bassine :", litres, "litres")\nprint("Seaux :", 3)\n' },
      { nom: "oublie d annoncer les seaux", attendu: "test raté", code:
        "litres = 0\nwhile litres < 40:\n    litres = litres + tirer()\n" +
        '    print("Niveau :", litres)\n' },
    ],
  },
  9: {
    prelude:
      "_journal = []\n" +
      "def tirer():\n" +
      '    _journal.append({"quoi": "verser", "litres": 12})\n' +
      "    return 12\n",
    cas: [
      { nom: "juste", attendu: "ok", code:
        "litres = 0\nwhile litres + 12 <= 40:\n    litres = litres + tirer()\n" +
        '    print("Dans la bassine :", litres, "litres")\n' },
      // La question regarde le présent au lieu du tour suivant : 48 litres dans
      // une bassine de 40, et le décor montre l'eau par terre.
      { nom: "regarde le present et deborde", attendu: "test raté", code:
        "litres = 0\nwhile litres < 40:\n    litres = litres + tirer()\n" +
        '    print("Dans la bassine :", litres, "litres")\n' },
      { nom: "s arrete trop tot", attendu: "test raté", code:
        "litres = 0\nwhile litres < 24:\n    litres = litres + tirer()\n" +
        '    print("Dans la bassine :", litres, "litres")\n' },
    ],
  },
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
  14: {
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
const A_ECRIRE = BLOCS;
const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${A_ECRIRE.length} blocs sur « ${L.title} » (${L.status})`);
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
