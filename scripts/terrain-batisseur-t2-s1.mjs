/**
 * Le Terrain — Bâtisseur, thème 2 séance 1 « La boucle qui attend ».
 *
 *     node scripts/terrain-batisseur-t2-s1.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : les trois morceaux d'un `while` (la valeur de
 * départ, la question posée avant chaque tour, la ligne qui fait avancer), la
 * boucle sans fin et le bouton ■ Arrêter, la boucle qui attend quelqu'un avec
 * la question reposée à chaque tour, et le mot de sortie.
 *
 * Sept exercices, et chacun ouvre une porte que les six autres laissent fermée.
 * Les quatre entraînements du parcours comptent les tours et choisissent la
 * boucle ; ici on fait autre chose :
 *
 *   1  Combien de tours ?        les trois morceaux DÉCIDENT du nombre de tours,
 *                                y compris zéro tour et jamais
 *   1  Avant, dans, après        où va chaque ligne — le décalage, pas le mot
 *   2  Le tour de trop           une boucle s'arrête APRÈS le seuil, pas dessus
 *   2  Trois boucles sans fin    trois causes différentes, aucune n'est l'oubli
 *                                du signe = déjà vu en séance
 *   2  Le symptôme et sa cause   lire une panne et remonter à la ligne fautive
 *   3  Deux raisons d'arrêter    deux conditions dans la même question
 *   3  Le carnet de la journée   while + si + trois accumulateurs
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La boucle qui attend";

// ── Garde-fous arithmétiques ─────────────────────────────────────────────
// La bassine : 8 seaux de 4 litres s'arrêtent à 32, sous les 40 litres. C'est
// la pompe qui arrête l'enfant, pas la bassine — et c'est tout l'intérêt.
const BASSINE = 40, SEAU = 4, QUOTA = 8;
if (QUOTA * SEAU >= BASSINE) throw new Error(`${QUOTA} seaux de ${SEAU} litres remplissent la bassine : la deuxième condition ne sert à rien`);
const NIVEAU_FINAL = QUOTA * SEAU;
// Le carnet : trois ventes, un total, une plus grosse.
const VENTES = [1500, 2300, 800];
const TOTAL = VENTES.reduce((a, b) => a + b, 0);
const PLUS_GROSSE = Math.max(...VENTES);
if (TOTAL !== 4600) throw new Error(`total ${TOTAL}, attendu 4600`);
if (PLUS_GROSSE !== 2300) throw new Error(`plus grosse vente ${PLUS_GROSSE}, attendu 2300`);
// La plus grosse ne doit pas être la dernière : sinon un programme qui garde
// simplement la dernière valeur passerait pour juste.
if (PLUS_GROSSE === VENTES[VENTES.length - 1]) throw new Error("la plus grosse vente est la dernière — un programme faux passerait");

const EXOS = [
  {
    palier: 1,
    title: "Combien de tours ?",
    description: "Douze petites boucles. Range chacune sous le nombre de tours qu'elle fera.",
    blocs: [
      kodi(
        "<p>Chaque carte est une boucle, décrite par ses trois morceaux :</p>" +
        "<pre><code>départ 0 · tant que &lt; 30 · ajoute 10</code></pre>" +
        "<p>Elle part de 0, elle s'arrête dès qu'elle atteint 30, et chaque tour ajoute 10.</p>" +
        "<p>Tu n'as pas besoin de l'ordinateur : ces trois morceaux suffisent à savoir combien de tours elle fera. Et parfois la réponse est <em>aucun</em>, parfois c'est <em>jamais</em>.</p>"
      ),
      {
        type: "drag_to_bin",
        content: {
          title: "Combien de tours ?",
          instruction: "Chaque carte dit son départ, là où elle s'arrête, et ce qu'elle ajoute à chaque tour.",
          helper: {
            title: "Comment compter ?",
            criteria: [
              "Commence par le départ : s'il a déjà atteint le seuil, c'est zéro tour.",
              "Sinon, ajoute, repose la question, et compte.",
              "Si rien ne change à chaque tour, la question répond oui pour toujours.",
            ],
          },
          bins: [
            { id: "zero", label: "Aucun tour", emoji: "⛔", color: "#64748b" },
            { id: "trois", label: "3 tours", emoji: "3️⃣", color: "#FDB813" },
            { id: "cinq", label: "5 tours", emoji: "5️⃣", color: "#10b981" },
            { id: "jamais", label: "Jamais fini", emoji: "♾️", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "🪣", label: "départ 0 · tant que < 30 · ajoute 10", correct: "trois", hint: "10, 20, 30. À 30 la question répond non." },
            { id: "b", emoji: "🪣", label: "départ 0 · tant que < 50 · ajoute 10", correct: "cinq", hint: "10, 20, 30, 40, 50." },
            { id: "c", emoji: "🪣", label: "départ 0 · tant que < 15 · ajoute 5", correct: "trois", hint: "5, 10, 15 — et 15 n'est pas plus petit que 15." },
            { id: "d", emoji: "🪣", label: "départ 0 · tant que < 25 · ajoute 5", correct: "cinq", hint: "5, 10, 15, 20, 25." },
            { id: "e", emoji: "🪣", label: "départ 10 · tant que < 40 · ajoute 10", correct: "trois", hint: "Le départ n'est pas 0 : 20, 30, 40." },
            { id: "f", emoji: "🪣", label: "départ 5 · tant que < 30 · ajoute 5", correct: "cinq", hint: "10, 15, 20, 25, 30." },
            { id: "g", emoji: "🛑", label: "départ 30 · tant que < 30 · ajoute 10", correct: "zero", hint: "30 n'est pas plus petit que 30 : la question répond non avant le premier tour." },
            { id: "h", emoji: "🛑", label: "départ 50 · tant que < 50 · ajoute 10", correct: "zero", hint: "Même piège : la boucle ne démarre jamais." },
            { id: "i", emoji: "🛑", label: "départ 12 · tant que < 10 · ajoute 1", correct: "zero", hint: "On est déjà au-delà. Une boucle peut très bien faire zéro tour." },
            { id: "j", emoji: "♾️", label: "départ 0 · tant que < 30 · ajoute 0", correct: "jamais", hint: "Rien n'avance : 0 reste plus petit que 30 pour l'éternité." },
            { id: "k", emoji: "♾️", label: "départ 20 · tant que < 50 · ajoute 0", correct: "jamais", hint: "Le départ est plus haut, mais rien n'avance : c'est pareil." },
            { id: "l", emoji: "♾️", label: "départ 0 · tant que < 1 · ajoute 0", correct: "jamais", hint: "Il manque si peu… et pourtant rien ne bouge. ■ Arrêter." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Avant, dans, après",
    description: "Neuf lignes, et la même boucle. Chacune a une seule bonne place.",
    blocs: [
      kodi(
        "<p>Dans une boucle, <strong>la place d'une ligne change tout</strong> — et la place, en Python, c'est le décalage du début de ligne.</p>" +
        "<p>Une ligne décalée vers la droite est <em>dans</em> la boucle : elle se répète. Collée à gauche, elle est <em>dehors</em> : elle ne passe qu'une fois.</p>"
      ),
      {
        type: "swipe_sort",
        content: {
          title: "Où va cette ligne ?",
          instruction: "Le programme sert des clients jusqu'à « fin ». Cette ligne va où ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Ce qui doit exister avant qu'on pose la question → avant la boucle.",
              "Ce qui doit se répéter à chaque client → dans la boucle.",
              "Ce qui ne se dit qu'une fois, à la fermeture → après la boucle.",
              "Un compteur se met à zéro AVANT, et avance DEDANS.",
            ],
          },
          categories: [
            { id: "avant", label: "Avant la boucle", emoji: "⬆️", color: "#FDB813" },
            { id: "dans", label: "Dans la boucle", emoji: "🔁", color: "#a78bfa" },
            { id: "apres", label: "Après la boucle", emoji: "⬇️", color: "#10b981" },
          ],
          items: [
            { id: "a", emoji: "0️⃣", label: "clients = 0", correct: "avant", hint: "Un compteur part de zéro une seule fois. Dedans, il repartirait de zéro à chaque tour." },
            { id: "b", emoji: "❓", label: "La toute première question au client", correct: "avant", hint: "Sans elle, la question de la boucle parle d'une variable qui n'existe pas encore." },
            { id: "c", emoji: "👋", label: 'print("Bonjour", reponse)', correct: "dans", hint: "Chaque client est salué : ça se répète." },
            { id: "d", emoji: "➕", label: "clients = clients + 1", correct: "dans", hint: "Un client de plus à chaque tour. Dehors, le compte resterait à 1." },
            { id: "e", emoji: "🔄", label: "La question reposée à la fin du tour", correct: "dans", hint: "C'est elle qui fait avancer la boucle. Dehors, le même client reviendrait sans arrêt." },
            { id: "f", emoji: "💰", label: "total = total + int(reponse)", correct: "dans", hint: "Chaque vente s'ajoute au total : une fois par tour." },
            { id: "g", emoji: "📢", label: 'print("Clients :", clients)', correct: "apres", hint: "On annonce le compte quand la boutique est fermée, pas à chaque client." },
            { id: "h", emoji: "🔒", label: 'print("Boutique fermee")', correct: "apres", hint: "Une seule fois, à la fin : si c'était dedans, elle fermerait à chaque client." },
            { id: "i", emoji: "0️⃣", label: "total = 0", correct: "avant", hint: "Comme le compteur : une remise à zéro dedans effacerait tout à chaque tour." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le tour de trop",
    description: "Six phrases sur une boucle qui dépasse — et c'est normal.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p>" +
            "<p>Le vendeur veut 2000 F dans sa caisse. Chaque client lui en apporte 700.</p>" +
            "<pre><code>1  argent = 0\n" +
            "2  clients = 0\n" +
            "3  while argent &lt; 2000:\n" +
            "4      argent = argent + 700\n" +
            "5      clients = clients + 1\n" +
            "6  print(clients, argent)</code></pre>" +
            "<p>Ne le modifie pas. Déroule-le, et regarde bien le dernier tour.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Le tour de trop",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La boucle fait", after: "tours.",
              options: ["3", "2", "4"], correct: 0,
              explanation: "700, puis 1400, puis 2100. Au quatrième passage, 2100 n'est plus plus petit que 2000." },
            { id: "s2", before: "À la fin, argent vaut", after: ".",
              options: ["2100", "2000", "1400"], correct: 0,
              explanation: "Et c'est la grande leçon : une boucle while s'arrête APRÈS avoir dépassé le seuil, jamais pile dessus." },
            { id: "s3", before: "Le vendeur voulait 2000 F. Il en a", after: ".",
              options: ["100 de plus", "exactement 2000", "100 de moins"], correct: 0,
              explanation: "Le dernier client a payé en entier : on ne lui a pas rendu 100 F pour tomber juste." },
            { id: "s4", before: "La question de la ligne 3 est posée", after: "fois.",
              options: ["4", "3", "1"], correct: 0,
              explanation: "Trois fois oui, puis une quatrième pour entendre non. C'est cette dernière qui arrête tout." },
            { id: "s5", before: "Si chaque client apportait 1000 F, la boucle ferait", after: "tours.",
              options: ["2", "3", "1"], correct: 0,
              explanation: "1000, puis 2000. Et 2000 n'est pas plus petit que 2000 : deux tours, pile sur le seuil cette fois." },
            { id: "s6", before: "Si on remplaçait la ligne 3 par « argent < 100 », la boucle ferait", after: ".",
              options: ["un seul tour", "aucun tour", "jamais fini"], correct: 0,
              explanation: "0 est plus petit que 100 : un tour. Après, 700 dépasse largement, et c'est fini." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Trois boucles qui ne finissent pas",
    description: "Trois programmes, trois causes différentes. Aucune n'est la même.",
    blocs: [
      kodi(
        "<p>Une boucle sans fin ne vient jamais d'un mystère. Elle vient toujours de la même chose : <strong>la réponse à la question ne change pas</strong>.</p>" +
        "<p>Mais il y a plusieurs façons de ne rien faire changer. En voici trois, et tu les rencontreras toutes les trois.</p>"
      ),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui recule",
        context: "Le programme devait verser jusqu'à 50 litres. Le niveau descend : 0, puis -4, puis -8…",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    litres = litres + 4",
        explanation: "La ligne fait bien avancer quelque chose — mais dans le mauvais sens. Elle s'éloigne du seuil à chaque tour, et la question répondra oui pour toujours.",
        instructions: [
          "litres = 0",
          "while litres < 50:",
          "    litres = litres - 4",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui fait avancer la mauvaise chose",
        context: "Le programme devait s'arrêter au bout de 5 tours. Il tourne sans fin, et pourtant une ligne fait bien avancer.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "    tours = tours + 1",
        explanation: "La question parle de tours. La ligne qui avance parle de litres. Les deux sont justes séparément — mais rien ne fait bouger ce que la question regarde.",
        instructions: [
          "litres = 0",
          "tours = 0",
          "while tours < 5:",
          "    litres = litres + 4",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui avance trop tard",
        context: "Le programme affiche « Un coup de filet ! » sans jamais s'arrêter. La bonne ligne existe — elle est juste à la mauvaise place.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "    poids = poids + 10",
        explanation: "La ligne est collée à gauche : elle est DEHORS. Elle attend sagement que la boucle finisse pour s'exécuter — et la boucle ne finit pas, justement parce qu'elle attend.",
        instructions: [
          "poids = 0",
          "while poids < 50:",
          '    print("Un coup de filet !")',
          "poids = poids + 10",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le symptôme et sa cause",
    description: "Sept pannes de boucle. Pour chacune, la ligne qui l'a provoquée.",
    blocs: [
      kodi(
        "<p>Un programmeur ne devine pas : <strong>il lit le symptôme et il remonte à la cause</strong>.</p>" +
        "<p>Ces sept pannes-là, tu les verras toutes. Autant savoir d'avance où regarder.</p>"
      ),
      {
        type: "match",
        content: {
          title: "Le symptôme et sa cause",
          instruction: "Touche un symptôme, puis la cause qui va avec.",
          left_label: "Ce que tu vois",
          right_label: "Ce qui s'est passé",
          pairs: [
            { left: "Python dit : name 'reponse' is not defined", right: "La question n'a pas été posée avant la boucle" },
            { left: "Le même client est salué sans arrêt", right: "La question n'est pas reposée dans la boucle" },
            { left: "« fin » se fait dire bonjour", right: "On repose la question avant d'afficher, au lieu d'après" },
            { left: "La boutique ferme tout de suite", right: "La réponse valait déjà « fin » au départ" },
            { left: "Le client tape « Fin » et rien ne ferme", right: "Pour Python, « Fin » et « fin » sont deux mots différents" },
            { left: "Le compteur reste à 1", right: "Il avance en dehors de la boucle" },
            { left: "Le programme tourne et n'affiche rien", right: "La ligne qui fait avancer manque — il faut ■ Arrêter" },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Deux raisons d'arrêter",
    description: "La bassine, ou la pompe. La première des deux gagne.",
    blocs: [
      kodi(
        "<p>Au forage, deux choses peuvent t'arrêter : <strong>la bassine est pleine</strong>, ou <strong>la pompe ne te donne plus rien</strong>.</p>" +
        "<p>Les deux tiennent dans la même question, avec <code>and</code> : on continue tant que la bassine n'est pas pleine ET qu'il te reste des seaux.</p>" +
        "<p>À la fin, il faut savoir laquelle des deux t'a arrêté — et un <code>si</code> après la boucle le dit.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            `La bassine fait ${BASSINE} litres, ton seau en contient ${SEAU}, et la pompe ne donne que ${QUOTA} seaux par personne.\n` +
            "Affiche le niveau apres chaque seau.\n" +
            "A la fin, affiche Bassine pleine si elle est pleine, ou Plus de seaux si la pompe t'a arrete.",
          starter_code:
            "litres = 0\n" +
            "seaux = 0\n\n" +
            "# Deux conditions dans la meme question : sers-toi de and.\n",
          hidden_tests:
            "import re\n" +
            'assert "while" in code, "Tu ne sais pas d avance laquelle des deux t arretera : c est une boucle while."\n' +
            'assert "and" in code, "Deux raisons d arreter tiennent dans la meme question, avec and."\n' +
            'assert "if" in code, "Apres la boucle, un si doit dire laquelle des deux t a arrete."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            `assert "${NIVEAU_FINAL}" in nombres, "${QUOTA} seaux de ${SEAU} litres font ${NIVEAU_FINAL} litres : c est la que la pompe t arrete. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n` +
            'assert "plus de seaux" in output.lower(), "C est la pompe qui t a arrete, pas la bassine : affiche Plus de seaux."\n' +
            `assert "bassine pleine" not in output.lower(), "La bassine n est pas pleine : ${NIVEAU_FINAL} litres sur ${BASSINE}."`,
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le carnet de la journée",
    description: "Compter, totaliser, et retenir la plus grosse. Trois choses à la fois.",
    blocs: [
      kodi(
        "<p>Le carnet du soir ne se contente pas d'un total. Le patron veut trois chiffres : <strong>combien de ventes</strong>, <strong>le total</strong>, et <strong>la plus grosse de la journée</strong>.</p>" +
        "<p>Trois choses à retenir, donc trois valeurs qui partent de zéro avant la boucle. Et pour la plus grosse, un <code>si</code> à l'intérieur : elle ne change que quand on fait mieux.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "A chaque vente, demande le montant en francs. On tape fin pour fermer la boutique.\n" +
            "A la fermeture, affiche le nombre de ventes, le total de la journee, et la plus grosse vente.\n" +
            "Attention : « fin » n'est pas un nombre. Compare d'abord, convertis ensuite.",
          starter_code:
            "ventes = 0\n" +
            "total = 0\n" +
            "record = 0\n" +
            'reponse = input("Montant de la vente (ou fin) : ")\n\n' +
            "# Dans la boucle : compte, ajoute au total, et garde le record\n" +
            "# s'il est battu. Puis repose la question.\n",
          hidden_tests:
            "import re\n" +
            'assert "while" in code, "Tu ne sais pas combien de ventes tu feras : c est une boucle while."\n' +
            'assert code.count("input(") >= 2, "La question doit etre posee deux fois : une avant la boucle, une a la fin de chaque tour."\n' +
            'assert "int(" in code, "Les montants arrivent en texte : int() les transforme en nombres."\n' +
            'assert "if" in code, "La plus grosse vente demande une comparaison : un si dans la boucle."\n' +
            // On ne lit que la fin de la sortie : les montants tapés sont réaffichés
            // par le terminal, et 2300 y apparaîtrait sans qu'aucun calcul soit juste.
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'final = " ".join(lignes[-4:])\n' +
            'nombres = re.findall(r"\\d+", final)\n' +
            `assert "${VENTES.length}" in nombres, "Trois ventes avant fin : ton programme doit les compter."\n` +
            `assert "${TOTAL}" in nombres, "1500 + 2300 + 800 font ${TOTAL}. La fin de ta sortie montre : " + (" ".join(nombres) or "aucun nombre")\n` +
            `assert "${PLUS_GROSSE}" in nombres, "La plus grosse vente de la journee est ${PLUS_GROSSE}, et elle n est pas la derniere : il faut la retenir quand elle passe."`,
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "Deux raisons d'arrêter": { cas: [
    { nom: "juste", attendu: "ok", code:
      "litres = 0\nseaux = 0\n" +
      `while litres < ${BASSINE} and seaux < ${QUOTA}:\n` +
      `    litres = litres + ${SEAU}\n` +
      "    seaux = seaux + 1\n" +
      '    print("Niveau :", litres)\n' +
      `if litres >= ${BASSINE}:\n` +
      '    print("Bassine pleine")\n' +
      "else:\n" +
      '    print("Plus de seaux")\n' },
    // Une seule condition : la pompe est ignorée, la bassine finit pleine, et
    // le message est faux. Le programme s'arrête quand même — c'est ce qui rend
    // l'erreur difficile à voir sans le message.
    { nom: "oublie la pompe", attendu: "test raté", code:
      "litres = 0\nseaux = 0\n" +
      `while litres < ${BASSINE}:\n` +
      `    litres = litres + ${SEAU}\n` +
      "    seaux = seaux + 1\n" +
      '    print("Niveau :", litres)\n' +
      'print("Bassine pleine")\n' },
    { nom: "oublie le message", attendu: "test raté", code:
      "litres = 0\nseaux = 0\n" +
      `while litres < ${BASSINE} and seaux < ${QUOTA}:\n` +
      `    litres = litres + ${SEAU}\n` +
      "    seaux = seaux + 1\n" +
      '    print("Niveau :", litres)\n' },
  ] },
  "Le carnet de la journée": {
    reponses: [...VENTES.map(String), "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "ventes = 0\ntotal = 0\nrecord = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    montant = int(reponse)\n" +
        "    ventes = ventes + 1\n" +
        "    total = total + montant\n" +
        "    if montant > record:\n" +
        "        record = montant\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Ventes :", ventes)\nprint("Total :", total, "F")\nprint("Plus grosse :", record)\n' },
      // Le piège de la séance : convertir avant de comparer. int("fin") plante.
      { nom: "convertit avant de comparer", attendu: "plante", code:
        "ventes = 0\ntotal = 0\nrecord = 0\n" +
        'montant = int(input("Montant de la vente (ou fin) : "))\n' +
        "while montant != 0:\n" +
        "    ventes = ventes + 1\n" +
        "    total = total + montant\n" +
        "    if montant > record:\n" +
        "        record = montant\n" +
        '    montant = int(input("Montant de la vente (ou fin) : "))\n' +
        'print("Ventes :", ventes)\nprint("Total :", total)\nprint("Plus grosse :", record)\n' },
      // Garde la DERNIÈRE vente au lieu de la plus grosse. Le programme tourne,
      // les deux premiers chiffres sont justes, et seul le troisième ment.
      { nom: "garde la derniere au lieu du record", attendu: "test raté", code:
        "ventes = 0\ntotal = 0\nrecord = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    montant = int(reponse)\n" +
        "    ventes = ventes + 1\n" +
        "    total = total + montant\n" +
        "    if montant > 0:\n" +
        "        record = montant\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Ventes :", ventes)\nprint("Total :", total, "F")\nprint("Plus grosse :", record)\n' },
      { nom: "oublie le total", attendu: "test raté", code:
        "ventes = 0\nrecord = 0\n" +
        'reponse = input("Montant de la vente (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    montant = int(reponse)\n" +
        "    ventes = ventes + 1\n" +
        "    if montant > record:\n" +
        "        record = montant\n" +
        '    reponse = input("Montant de la vente (ou fin) : ")\n' +
        'print("Ventes :", ventes)\nprint("Plus grosse :", record)\n' },
    ],
  },
};

// `while` est enseigné par la séance : il sort de la liste des interdits. Le
// reste de ce que le parcours n'a jamais montré y reste.
verifier(EXOS, {
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\.strip\(/, /\.split\(/, /\.lower\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
    /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Combien de tours ?": 12, "Avant, dans, après": 9, "Le tour de trop": 6, "Le symptôme et sa cause": 7 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
