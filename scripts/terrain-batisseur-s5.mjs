/**
 * Le Terrain — Bâtisseur, séance 5 « 🔧 Le bug qui ne dit rien ».
 *
 *     node scripts/terrain-batisseur-s5.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce que la séance a enseigné : un programme peut tourner sans message rouge et
 * donner un résultat faux ; on le fait parler avec des `print` pour comparer
 * l'attendu et l'obtenu ; et l'accumulateur — `total = 0` avant la boucle,
 * `total = total + x` dedans, `print(total)` après.
 *
 * Tout le thème 0 est disponible ici : variables, `int()`, `if`/`else`, `for`,
 * `range`, `"*" * n`. Restent interdits : `while`, les fonctions, les listes,
 * `elif`.
 *
 * C'est la dernière séance du thème : son Terrain sert aussi de révision, et
 * ses deux derniers exercices demandent deux choses à la fois.
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🔧 Le bug qui ne dit rien";

// Garde-fou arithmétique : les totaux annoncés doivent être vrais.
const TIRELIRE = 7 * 150;
if (TIRELIRE !== 1050) throw new Error(`tirelire : 7 × 150 doit faire 1050, pas ${TIRELIRE}`);
const ETOILES = [1, 2, 3, 4, 5].reduce((a, b) => a + b, 0);
if (ETOILES !== 15) throw new Error(`pyramide : 1+2+3+4+5 doit faire 15, pas ${ETOILES}`);

const EXOS = [
  {
    palier: 1,
    title: "Avant, dans, ou après ?",
    description: "Douze lignes. Une seule place est la bonne.",
    blocs: [
      kodi("<p>Un accumulateur tient en trois moments : on prépare la boîte <strong>avant</strong>, on l'augmente <strong>dans</strong> la boucle, on la lit <strong>après</strong>.</p><p>Se tromper de moment ne fait jamais de rouge. Ça fait juste un résultat faux.</p>"),
      {
        type: "drag_to_bin",
        content: {
          title: "Où va cette ligne ?",
          instruction: "Choisis une ligne, puis son moment.",
          bins: [
            { id: "avant", emoji: "1️⃣", label: "Avant la boucle", color: "#10b981" },
            { id: "dans",  emoji: "🔁", label: "Dans la boucle",  color: "#FDB813" },
            { id: "apres", emoji: "3️⃣", label: "Après la boucle", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "📦", label: "total = 0",                        correct: "avant", hint: "Une seule fois, au départ. Dans la boucle, le compteur repartirait de zéro à chaque tour." },
            { id: "b", emoji: "➕", label: "total = total + 500",              correct: "dans",  hint: "C'est le geste qui cumule : il doit se répéter." },
            { id: "c", emoji: "👀", label: 'print("Total :", total)',          correct: "apres", hint: "On lit le total quand tout est compté. Dedans, il s'afficherait à chaque tour." },
            { id: "d", emoji: "🔢", label: "compteur = 0",                     correct: "avant", hint: "Comme toute boîte qui cumule : préparée une seule fois." },
            { id: "e", emoji: "➕", label: "compteur = compteur + 1",          correct: "dans",  hint: "Un de plus à chaque tour : c'est bien dedans." },
            { id: "f", emoji: "🏁", label: 'print("=== DEBUT ===")',           correct: "avant", hint: "Un titre s'affiche une fois, avant que ça commence." },
            { id: "g", emoji: "🏁", label: 'print("=== FIN ===")',             correct: "apres", hint: "Une fois, quand tout est fini." },
            { id: "h", emoji: "❓", label: 'prix = int(input("Prix ? "))',     correct: "dans",  hint: "On demande un prix par article : la question se répète." },
            { id: "i", emoji: "🐞", label: 'print("Tour", tour, "→", total)',  correct: "dans",  hint: "Faire parler la boucle n'a de sens que dedans : c'est là qu'on voit le total grandir." },
            { id: "j", emoji: "⚠️", label: "if total > 5000:",                 correct: "apres", hint: "On prévient quand le total est complet, pas pendant qu'il se remplit." },
            { id: "k", emoji: "📦", label: "budget = 5000",                    correct: "avant", hint: "Une valeur fixe se pose une fois, au départ." },
            { id: "l", emoji: "🧮", label: "total = total + prix",             correct: "dans",  hint: "Le cumul, encore : à chaque article rencontré." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Chaque symptôme et sa cause",
    description: "Sept programmes malades. Sept diagnostics.",
    blocs: [
      kodi("<p>Un programme ne se trompe jamais : il fait exactement ce que tu as écrit. Le bug est toujours dans l'écart entre ce que tu voulais et ce que tu as écrit.</p><p>Relie chaque symptôme à sa cause.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque symptôme et sa cause",
          pairs: [
            { left: "Un print dans la boucle affiche 0 1 2 3", right: "La boucle a fait quatre tours" },
            { left: "Aucun rouge, et le résultat est faux",    right: "Un bug silencieux" },
            { left: "total = 0 est écrit dans la boucle",      right: "Le compteur repart de zéro à chaque tour" },
            { left: "total = 250 au lieu de total = total + 250", right: "On écrase au lieu de cumuler" },
            { left: "print(total) est décalé dans la boucle",  right: "Le total s'affiche à chaque tour" },
            { left: "Kirikou s'arrête à un pas de l'étoile",   right: "Il manque un tour de boucle" },
            { left: "Attendu et obtenu",                       right: "Les deux choses qu'on compare pour trouver un bug" },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Deviens l'ordinateur",
    description: "Deux tours de cumul. Que vaut la boîte ?",
    blocs: [
      kodi("<p>La boucle a tourné deux fois, et chaque tour a ajouté 250.</p><p>Déroule la dernière ligne morceau par morceau.</p>"),
      jeu({
        game_type: "deviens_ordinateur",
        title: "Deviens l'ordinateur",
        description: "Le cumul se lit après la boucle.",
        contexte: ["total = 0", "for tour in range(2):", "    total = total + 250"],
        ligne: "print(total + 500)",
        etapes: [
          { expression: "total", choix: ["500", "250", "0", "750"], valeur: "500",
            explication: "Deux tours à 250 : 0 + 250 = 250, puis 250 + 250 = 500. La boîte garde le cumul." },
          { expression: "500 + 500", choix: ["1000", "500500", "250"], valeur: "1000",
            explication: "Et on ajoute encore 500 au moment de l'affichage." },
        ],
        sortie: "1000",
      }),
    ],
  },

  {
    palier: 2,
    title: "Deux cumuls cassés",
    description: "Ni rouge ni message. Juste deux résultats faux.",
    blocs: [
      kodi("<p>Trois articles à 250 F. Les deux programmes devaient afficher <strong>750</strong>.</p><p>Ni l'un ni l'autre ne devient rouge. Trouve la ligne fautive dans chacun.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui écrase",
        context: "Trois articles à 250 F. Le programme affiche 250 au lieu de 750.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    total = total + 250",
        explanation: "Ranger 250 efface ce qu'il y avait avant. Pour cumuler, il faut prendre ce qui est dedans et y ajouter.",
        instructions: [
          "total = 0",
          "for tour in range(3):",
          "    total = 250",
          "print(total)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui parle trop",
        context: "Le total est juste, mais le programme affiche 250, puis 500, puis 750. On ne voulait que le dernier.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "print(total)",
        explanation: "Décalée, la lecture appartient à la boucle et se répète. Sortie du décalage, elle ne parle qu'une fois, à la fin.",
        instructions: [
          "total = 0",
          "for tour in range(3):",
          "    total = total + 250",
          "    print(total)",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le cumul raconté",
    description: "Six phrases sur un programme qui compte.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme qui compte. Il marche.</p>" +
            "<pre><code>1  total = 0\n" +
            "2  for tour in range(4):\n" +
            "3      total = total + 300\n" +
            '4  print("Total :", total)</code></pre>' +
            "<p>Ne le modifie pas. Raconte-le.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Raconte le cumul",
          sentences: [
            { id: "s1", before: "À la fin, le programme affiche", after: ".",
              options: ["1200", "300", "4"], correct: 0,
              explanation: "Quatre tours à 300 : 300, 600, 900, 1200." },
            { id: "s2", before: "La ligne 1 s'exécute", after: ".",
              options: ["une seule fois", "quatre fois", "après la boucle"], correct: 0,
              explanation: "Elle est avant la boucle : elle prépare la boîte une seule fois." },
            { id: "s3", before: "Si on déplaçait la ligne 1 dans la boucle, l'affichage serait", after: ".",
              options: ["300", "1200", "0"], correct: 0,
              explanation: "La boîte repartirait de zéro à chaque tour : il ne resterait que le dernier ajout." },
            { id: "s4", before: "Si on décalait la ligne 4 dans la boucle, elle s'afficherait", after: ".",
              options: ["quatre fois", "une fois", "jamais"], correct: 0,
              explanation: "Tout ce qui est décalé sous la boucle se répète à chaque tour." },
            { id: "s5", before: "Si la ligne 3 devenait total = 300, l'affichage serait", after: ".",
              options: ["300", "1200", "0"], correct: 0,
              explanation: "Ranger 300 écrase le cumul : à la fin, il ne reste que le dernier." },
            { id: "s6", before: "Aucune de ces erreurs ne ferait", after: ".",
              options: ["de message rouge", "changer le résultat", "planter la boucle"], correct: 0,
              explanation: "C'est tout le sujet de la séance : le programme tourne, et il est faux." },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La tirelire de la semaine",
    description: "Sept jours, 150 F par jour, et un objectif.",
    blocs: [
      kodi("<p>Chaque jour de la semaine, tu mets <strong>150 F</strong> dans la tirelire. Sept jours.</p><p>Ton programme annonce le total à la fin — et si la tirelire dépasse <strong>1 000 F</strong>, il ajoute <code>Objectif atteint !</code></p><p>Trois choses à placer au bon moment : préparer, cumuler, lire.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Sept jours, 150 F par jour. Affiche le total a la fin, avec le mot Total. Si le total depasse 1000, affiche aussi Objectif atteint !",
          starter_code: "# Prepare la boite, cumule dans la boucle, lis apres.\n",
          hidden_tests:
            'import re\n' +
            'assert "for" in code and "range(" in code, "Il faut une boucle : for et range."\n' +
            'assert "if" in code, "Il faut une decision pour l objectif."\n' +
            'assert "Total" in output or "total" in output, "Ta phrase doit contenir le mot Total."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "1050" in nombres, "Sept jours a 150 F font 1050. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
            'assert "Objectif" in output, "1050 depasse 1000 : le programme doit aussi dire Objectif atteint !"\n' +
            'assert output.count("Total") <= 1 and output.count("total") <= 1, "Le total ne se lit qu une fois, apres la boucle — pas a chaque tour."',
        },
      },
    ],
  },

  {
    palier: 3,
    title: "La pyramide qui se compte",
    description: "Dessiner, et compter ce qu'on a dessiné.",
    blocs: [
      kodi("<p>Deux choses à la fois, et c'est le dernier défi du thème.</p><p>Dessine la pyramide qui monte — une étoile, puis deux, jusqu'à cinq — <strong>et</strong> annonce à la fin combien d'étoiles tu as posées en tout.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Affiche cinq lignes : une etoile, puis deux, puis trois, quatre, cinq. Ensuite, affiche une derniere ligne contenant le mot Etoiles et le nombre total d etoiles posees.",
          starter_code: "# Une boucle qui dessine ET qui compte.\n",
          hidden_tests:
            'import re\n' +
            'assert "for" in code and "range(" in code, "Il faut une boucle."\n' +
            'lignes = [l.strip() for l in output.split("\\n") if l.strip()]\n' +
            'etoiles = [l for l in lignes if set(l) == {"*"}]\n' +
            'assert etoiles == ["*", "**", "***", "****", "*****"], "Les cinq lignes attendues vont de une a cinq etoiles. Ton programme affiche : " + " / ".join(etoiles)\n' +
            'assert "Etoiles" in output or "etoiles" in output, "La derniere ligne doit contenir le mot Etoiles."\n' +
            'derniere = lignes[-1]\n' +
            'assert "15" in re.findall(r"\\d+", derniere), "1+2+3+4+5 font 15. Ta derniere ligne annonce : " + derniere',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "La tirelire de la semaine": {
    cas: [
      { nom: "juste", attendu: "ok", code:
        'total = 0\nfor jour in range(7):\n    total = total + 150\nprint("Total :", total, "F")\nif total > 1000:\n    print("Objectif atteint !")\n' },
      { nom: "ecrase au lieu de cumuler", attendu: "test raté", code:
        'total = 0\nfor jour in range(7):\n    total = 150\nprint("Total :", total, "F")\nif total > 1000:\n    print("Objectif atteint !")\n' },
      { nom: "remet a zero dans la boucle", attendu: "test raté", code:
        'for jour in range(7):\n    total = 0\n    total = total + 150\nprint("Total :", total, "F")\nif total > 1000:\n    print("Objectif atteint !")\n' },
      { nom: "lit le total a chaque tour", attendu: "test raté", code:
        'total = 0\nfor jour in range(7):\n    total = total + 150\n    print("Total :", total, "F")\nif total > 1000:\n    print("Objectif atteint !")\n' },
      { nom: "oublie l objectif", attendu: "test raté", code:
        'total = 0\nfor jour in range(7):\n    total = total + 150\nprint("Total :", total, "F")\n' },
    ],
  },
  "La pyramide qui se compte": {
    cas: [
      { nom: "juste", attendu: "ok", code:
        'total = 0\nfor tour in range(5):\n    print("*" * (tour + 1))\n    total = total + tour + 1\nprint("Etoiles :", total)\n' },
      { nom: "pyramide a l envers", attendu: "test raté", code:
        'total = 0\nfor tour in range(5):\n    print("*" * (5 - tour))\n    total = total + 5 - tour\nprint("Etoiles :", total)\n' },
      { nom: "compte faux", attendu: "test raté", code:
        'total = 0\nfor tour in range(5):\n    print("*" * (tour + 1))\n    total = total + tour\nprint("Etoiles :", total)\n' },
      { nom: "oublie le compte", attendu: "test raté", code:
        'for tour in range(5):\n    print("*" * (tour + 1))\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bwhile\b/, /\bdef\b/, /\belif\b/, /\bstr\(/, /\.append/, /\[\s*0\s*\]/],
  comptes: { "Avant, dans, ou après ?": 12, "Chaque symptôme et sa cause": 7, "Le cumul raconté": 6 },
});

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, { ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire") });
