/**
 * Séance 7 du Bâtisseur — T1 « Mes propres commandes ».
 *
 * Une notion : donner un nom à un morceau de programme. Le paramètre n'est pas
 * présenté comme une nouveauté mais comme le passage de l'autre côté de
 * `print(...)`, que l'enfant appelle depuis six semaines.
 *
 * Le bloc répété du jeu d'ouverture mélange trois natures d'action —
 * print, boucle, silence — pour qu'aucune liste ne puisse le factoriser.
 * `return` est réservé à la séance 8.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const LESSON_ID = "ca8a29b7-8e04-4faa-bcf1-80597d5cb08e";
const THEME_ID  = "d34e9e85-f171-47ab-8d03-045dd00a9f71";

const C1 = ["Do", "Re", "Mi", "Do"];
const C2 = ["Mi", "Fa", "Sol", "Mi"];
const C3 = ["Sol", "La", "Sol", "Fa"];
const R  = ["Sol", "Sol", "Mi", "Do"];

// Jeu 1 : un silence AVANT chaque refrain — trois endroits à modifier.
const CIBLE_1 = [...C1, "", ...R, "", ...C2, "", ...R, "", ...C3, "", ...R, ""];
// Jeu 2 : un silence de plus À LA FIN — un seul endroit, grâce à la fonction.
const CIBLE_2 = [...C1, "", ...R, "", "", ...C2, "", ...R, "", "", ...C3, "", ...R, "", ""];

const LISTES = [
  `couplet1 = ${JSON.stringify(C1).replace(/"/g, '"')}`,
  `couplet2 = ${JSON.stringify(C2)}`,
  `couplet3 = ${JSON.stringify(C3)}`,
  `refrain  = ${JSON.stringify(R)}`,
].join("\n").replace(/,(\S)/g, ", $1");

const BLOC_REFRAIN = [
  'print("--- REFRAIN ---")',
  "for n in refrain:",
  "    jouer(n)",
  "silence()",
].join("\n");

const COUPLET = (n) => `for n in couplet${n}:\n    jouer(n)`;

const JEU1_DEPART =
  LISTES + "\n\n" +
  [1, 2, 3].map(i => COUPLET(i) + "\n" + BLOC_REFRAIN).join("\n\n") + "\n";

const JEU2_DEPART =
  LISTES + "\n\n" +
  [1, 2, 3].map(i => COUPLET(i) + "\nsilence()\n" + BLOC_REFRAIN).join("\n\n") +
  "\n\n# A toi : ecris une fonction joue_refrain(), appelle-la trois fois,\n" +
  "# puis ajoute le silence supplementaire — a un seul endroit.\n";

const BLOCS = [
  // ── 0–3 min · une question, pas un discours ───────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Trois fois le même cadre</h2>
<p>Hier tu as écrit trois sections, chacune encadrée par les mêmes trois lignes.</p>
<p><strong>Une seule question :</strong> si tu voulais des tirets au lieu des signes
égal, combien d'endroits devrais-tu modifier ?</p>
<p>Garde ta réponse en tête. On y revient à la fin de la séance.</p>`,
    },
  },

  // ── 3–15 min · la douleur, incassable par une liste ───────────────────────
  {
    type: "game",
    content: {
      game_type: "python_piano",
      title: "Le refrain, trois fois recopié",
      instructions:
        "Une chanson : trois couplets, et entre chacun le meme refrain. Lance-la pour l'entendre. " +
        "Puis fais ce changement : ajoute un silence() JUSTE AVANT chaque annonce de refrain. " +
        "Compte les endroits que tu dois toucher.",
      target: CIBLE_1,
      tempo: 340,
      starter_code: JEU1_DEPART,
    },
  },

  // ── 15–30 min · la notion ─────────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Tu en utilises depuis six semaines</h2>
<p>Regarde ces lignes. Tu les as toutes écrites :</p>
<pre><code>print("Salut")
int(input("Ton age : "))
range(5)
len(ma_liste)
jouer("Do")</code></pre>
<p>Un nom, des parenthèses, parfois quelque chose entre les parenthèses.
<strong>Ça s'appelle une fonction.</strong> Tu t'en sers depuis ton premier
programme sans le savoir.</p>
<p>Aujourd'hui, tu passes de l'autre côté : <strong>tu en fabriques une.</strong></p>

<h3>Donner un nom à un morceau de programme</h3>
<pre><code>def joue_refrain():
    print("--- REFRAIN ---")
    for n in refrain:
        jouer(n)
    silence()</code></pre>
<ul>
<li><code>def</code> — « définis ». Puis le nom que tu choisis, des parenthèses, deux-points.</li>
<li>Tout ce qui est <strong>décalé en dessous</strong> appartient à la fonction. Comme
pour le <code>if</code> et le <code>for</code> : deux-points, puis décalage. C'est la
quatrième fois que tu vois cette règle.</li>
</ul>
<p>Ensuite, tu l'appelles autant de fois que tu veux :</p>
<pre><code>joue_refrain()
joue_refrain()
joue_refrain()</code></pre>

<h3>Définir n'est pas exécuter</h3>
<p>C'est le piège numéro un. Écrire un <code>def</code> ne fait <em>rien</em> : ça
range le bloc dans un tiroir. Rien ne se passe tant que tu ne l'appelles pas.</p>
<p>Tu sais faire parler un programme — regarde dans quel ordre :</p>
<pre><code>print("A")

def salut():
    print("B")

print("C")
salut()
print("D")</code></pre>
<p>Sortie : <strong>A</strong> · <strong>C</strong> · <strong>B</strong> · <strong>D</strong></p>
<p>Le <code>B</code> arrive en troisième. Python a lu la définition, l'a mise de côté
sans l'exécuter, a continué jusqu'au <code>C</code>, puis a sauté dans la fonction au
moment de l'appel.</p>`,
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Qu'affiche ce programme ?  print(\"A\")  /  def f(): print(\"B\")  /  print(\"C\")",
          choices: ["A B C", "A C", "B A C"],
          answer: 1,
          explanation: "A puis C. Le B ne s'affiche jamais : la fonction est définie mais jamais appelée. Définir n'est pas exécuter.",
        },
        {
          question: "Après  def salut():  , qu'est-ce qui appartient à la fonction ?",
          choices: [
            "Toutes les lignes jusqu'à la fin du programme",
            "Uniquement les lignes décalées en dessous",
            "La ligne suivante seulement",
          ],
          answer: 1,
          explanation: "Deux-points, puis décalage — la même règle que le if et le for. Dès qu'une ligne revient à gauche, elle est hors de la fonction.",
        },
        {
          question: "Laquelle de ces lignes APPELLE la fonction salut ?",
          choices: ["salut", "salut()", "def salut()"],
          answer: 1,
          explanation: "Les parenthèses font l'appel. Sans elles, Python regarde la fonction et passe à la suite — sans rien faire et sans rien dire.",
        },
        {
          question: "Pourquoi écrire une fonction plutôt que recopier le bloc trois fois ?",
          choices: [
            "Le programme va plus vite",
            "Pour ne modifier qu'un seul endroit quand ça change",
            "C'est obligatoire en Python",
          ],
          answer: 1,
          explanation: "C'est la vraie raison. Écrit une fois, appelé partout : le jour où le bloc change, tu touches un endroit au lieu de trois.",
        },
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "sort",
      title: "Définir, puis appeler",
      description: "Ce programme dit bonjour une fois. Attention à l'ordre et au décalage.",
      items: [
        "def salut():",
        '    print("Bonjour")',
        '    print("Ca va ?")',
        "salut()",
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "fill_blank",
      title: "Définir et appeler",
      template: '[___] salut():\n    print("Bonjour")\n\nsalut[___]',
      blanks: ["def", "()"],
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "Le refrain qui revient quatre fois",
      context: "Le refrain devait venir apres le couplet. Il revient quatre fois de suite.",
      description: "Une ligne est mal placée. Clique dessus.",
      instructions: [
        'couplet1 = ["Do", "Re", "Mi", "Do"]',
        "for n in couplet1:",
        "    jouer(n)",
        "    joue_refrain()",
      ],
      bug_index: 3,
      fix: "joue_refrain()",
      explanation:
        "L'appel est decale de 4 espaces : il est DANS la boucle, donc rejoue a chaque note du " +
        "couplet — quatre fois. Ramene-le a gauche et il ne s'executera qu'une fois, apres le couplet.",
    },
  },

  // ── 30–40 min · ce que seule une fonction permet ──────────────────────────
  {
    type: "game",
    content: {
      game_type: "python_piano",
      title: "Une fois écrit, changé partout",
      instructions:
        "Meme chanson, avec le silence que tu viens d'ajouter. Nouveau changement : " +
        "le refrain doit se terminer par DEUX silences au lieu d'un. " +
        "Avant de le faire trois fois : ecris une fonction joue_refrain(), appelle-la " +
        "trois fois, puis fais le changement — a un seul endroit.",
      target: CIBLE_2,
      tempo: 340,
      starter_code: JEU2_DEPART,
    },
  },

  // ── 40–52 min · le paramètre ──────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Le réglage</h2>
<p>Ta fonction fait toujours exactement la même chose. C'est parfait pour un refrain —
un refrain qui changerait ne serait plus un refrain.</p>
<p>Mais regarde à nouveau les fonctions que tu utilises depuis six semaines :</p>
<pre><code>print("Salut")      len(ma_liste)      jouer("Do")</code></pre>
<p>Elles ont toutes quelque chose <strong>entre les parenthèses</strong>. Ce quelque
chose, c'est le réglage : <code>print</code> ne sait pas quoi afficher tant que tu ne
le lui donnes pas.</p>
<p>Tu sais déjà t'en servir. Voici comment on en fabrique une :</p>
<pre><code>def cadre(titre):
    print("========================")
    print("  " + titre)
    print("========================")

cadre("MES MATIERES")
cadre("MES NOTES")</code></pre>
<p><code>titre</code> est un <strong>trou</strong> dans le bloc. À chaque appel, ce que
tu mets entre les parenthèses vient remplir le trou.</p>
<h3>Deux noms, une seule chose</h3>
<p>Dans <code>cadre("MES NOTES")</code>, le texte s'appelle <code>"MES NOTES"</code>.
Une fois à l'intérieur de la fonction, il s'appelle <code>titre</code>. C'est la même
chose vue de deux endroits — comme <code>note</code> dans la boucle de la semaine
dernière, qui recevait tour à tour chaque valeur de la liste.</p>`,
    },
  },
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ecris la fonction cadre(titre) : une ligne de signes egal, le titre, une autre " +
        "ligne de signes egal. Puis appelle-la deux fois, avec MES MATIERES et MES NOTES.",
      starter_code: "def cadre(titre):\n    # A toi\n",
      hidden_tests: `compact = code.replace(" ", "")
assert "defcadre(titre)" in compact, "La fonction doit s'appeler cadre et prendre un parametre titre."
assert 'cadre("MESMATIERES")' in compact or "cadre('MESMATIERES')" in compact, "Appelle cadre avec MES MATIERES."
assert 'cadre("MESNOTES")' in compact or "cadre('MESNOTES')" in compact, "Appelle cadre avec MES NOTES."
cadres = [l for l in output.split("\\n") if l.strip().startswith("====")]
assert len(cadres) >= 4, "Deux appels, deux cadres, donc quatre lignes de signes egal. Ton programme en affiche " + str(len(cadres)) + "."
assert "MES MATIERES" in output and "MES NOTES" in output, "Les deux titres doivent apparaitre."`,
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "Le programme qui ne dit pas bonjour",
      context: "Le programme ne dit rien. Et il n'affiche aucune erreur non plus.",
      description: "Une ligne est incomplète. Clique dessus.",
      instructions: [
        "def salut():",
        '    print("Bonjour !")',
        "",
        "salut",
      ],
      bug_index: 3,
      fix: "salut()",
      explanation:
        "Sans les parentheses, Python regarde la fonction et passe a la suite. Il ne l'appelle pas. " +
        "Aucune erreur, aucun affichage : c'est le bug le plus silencieux des fonctions. " +
        "Les parentheses, c'est ce qui declenche.",
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "def cadre(titre):  puis  cadre(\"MES NOTES\")  — que vaut titre à l'intérieur ?",
          choices: ["titre", "MES NOTES", "Rien, il est vide"],
          answer: 1,
          explanation: "Ce que tu mets entre les parenthèses vient remplir le trou. Deux noms, une seule chose.",
        },
        {
          question: "Tu écris  salut  sans parenthèses. Que se passe-t-il ?",
          choices: [
            "Une erreur rouge s'affiche",
            "Rien du tout, en silence",
            "La fonction s'exécute quand même",
          ],
          answer: 1,
          explanation: "Python regarde la fonction, ne l'appelle pas, et continue. Aucun message. C'est pour ça que ce bug est difficile à trouver.",
        },
        {
          question: "Combien de fois peux-tu appeler une fonction que tu as définie ?",
          choices: ["Une seule", "Autant de fois que tu veux", "Trois au maximum"],
          answer: 1,
          explanation: "C'est tout l'intérêt : écrite une fois, appelée partout. Et le jour où elle change, tu modifies un seul endroit.",
        },
        {
          question: "Où faut-il écrire la définition d'une fonction ?",
          choices: [
            "N'importe où, Python s'arrange",
            "Avant le premier appel",
            "Toujours à la fin du programme",
          ],
          answer: 1,
          explanation: "Python lit de haut en bas. Il doit connaître la fonction avant qu'on la lui demande.",
        },
      ],
    },
  },

  // ── 52–62 min · la revanche ───────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Ton bulletin, la revanche</h2>
<p>Souviens-toi de la question du début : <em>combien d'endroits pour passer des
signes égal aux tirets ?</em></p>
<p>Hier, la réponse était <strong>trois</strong>. Avec <code>cadre(titre)</code>, elle
devient <strong>un</strong>.</p>
<p>Réécris ton bulletin : trois sections, chacune avec son cadre et son contenu — mais
le cadre n'existe plus qu'à un seul endroit du programme.</p>`,
    },
  },
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ton bulletin, en trois sections : MES MATIERES, MES NOTES, MES OBJECTIFS. " +
        "Chacune encadree, chacune suivie de son contenu. Le cadre ne doit etre ecrit " +
        "qu'une seule fois dans tout le programme.",
      starter_code:
        "def cadre(titre):\n" +
        '    print("========================")\n' +
        '    print("  " + titre)\n' +
        '    print("========================")\n\n' +
        "# A toi : les trois sections\n",
      hidden_tests: `compact = code.replace(" ", "")
assert "defcadre(titre)" in compact, "Garde la fonction cadre(titre)."
assert compact.count('print("========================")') <= 2, "Le cadre ne doit exister qu'a un seul endroit : dans la fonction."
for titre in ["MES MATIERES", "MES NOTES", "MES OBJECTIFS"]:
    assert titre in output, "Il manque la section " + titre + "."
cadres = [l for l in output.split("\\n") if l.strip().startswith("====")]
assert len(cadres) >= 6, "Trois sections, donc six lignes de signes egal. Ton programme en affiche " + str(len(cadres)) + "."
lignes = [l for l in output.split("\\n") if l.strip()]
assert len(lignes) >= 12, "Chaque section doit aussi avoir son contenu, pas seulement son cadre."`,
    },
  },

  // ── 62–65 min · bilan ─────────────────────────────────────────────────────
  {
    type: "game",
    content: {
      game_type: "memory",
      title: "Les mots de la seance",
      description: "Retourne les cartes et retrouve les paires.",
      pairs: [
        { left: "def",        right: "Definir un bloc" },
        { left: "salut()",    right: "L'appeler" },
        { left: "salut",      right: "Ne fait rien" },
        { left: "(titre)",    right: "Le reglage" },
      ],
    },
  },
  {
    type: "text",
    content: {
      html: `
<h2>Ce que tu sais faire maintenant</h2>
<p>Donner un nom à un morceau de programme, l'appeler autant de fois que tu veux, et
lui passer un réglage. Trois endroits à modifier sont devenus un.</p>
<h3>Le mur suivant</h3>
<p>Cette semaine, tu vas écrire une fonction qui calcule le total d'un panier et
l'affiche. Puis on te demandera lequel de deux paniers est le plus cher.</p>
<p>Et tu ne pourras pas répondre. Ta fonction <strong>affiche</strong> le total —
elle ne te le <strong>rend</strong> pas. Tu ne peux rien en faire.</p>
<p>La semaine prochaine, tes fonctions apprennent à répondre.</p>`,
    },
  },
];

const ENTRAINEMENTS = [
  {
    title: "Définir ou appeler ?",
    description: "Deux gestes différents, et un piège silencieux.",
    xp_reward: 30,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Deux gestes, pas un</h3>
<p><strong>Définir</strong>, c'est ranger un bloc dans un tiroir : rien ne s'exécute.
<strong>Appeler</strong>, c'est ouvrir le tiroir. Les parenthèses font toute la
différence — et leur oubli ne provoque aucune erreur.</p>`,
        },
      },
      {
        type: "quiz",
        content: {
          questions: [
            {
              question: "def bonjour():  puis  print(\"Fin\")  — qu'affiche le programme ?",
              choices: ["Bonjour puis Fin", "Fin seulement", "Rien"],
              answer: 1,
              explanation: "La fonction est définie mais jamais appelée. Seul le print s'exécute.",
            },
            {
              question: "Quelle ligne exécute réellement la fonction  compte  ?",
              choices: ["compte", "compte()", "def compte()"],
              answer: 1,
              explanation: "Les parenthèses déclenchent. Sans elles, Python regarde et passe son chemin.",
            },
            {
              question: "Ton appel est décalé de 4 espaces sous  for n in couplet:  . Que se passe-t-il ?",
              choices: [
                "Il s'exécute une fois après la boucle",
                "Il s'exécute à chaque tour de la boucle",
                "Une erreur d'indentation",
              ],
              answer: 1,
              explanation: "Décalé, il est dans la boucle : un appel par tour. C'est la même règle de décalage que pour le if.",
            },
            {
              question: "Peux-tu appeler une fonction avant de l'avoir définie ?",
              choices: ["Oui, Python s'arrange", "Non, il faut la définir avant", "Seulement si elle est courte"],
              answer: 1,
              explanation: "Python lit de haut en bas. La définition doit venir avant le premier appel.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Le cadre qui sert partout",
    description: "Une fonction, quatre appels, un seul endroit à modifier.",
    xp_reward: 40,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Écrit une fois, appelé partout</h3>
<p>Le vrai gain n'est pas d'écrire moins. C'est de n'avoir <strong>qu'un seul
endroit</strong> à modifier le jour où le bloc change.</p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris une fonction titre(mot) qui affiche le mot entoure d'etoiles : " +
            "une ligne de 5 etoiles, le mot, une ligne de 5 etoiles. " +
            "Appelle-la pour LUNDI, MARDI, MERCREDI et JEUDI.",
          starter_code: "def titre(mot):\n    # A toi\n",
          hidden_tests: `compact = code.replace(" ", "")
assert "deftitre(mot)" in compact, "La fonction doit s'appeler titre et prendre un parametre mot."
for j in ["LUNDI", "MARDI", "MERCREDI", "JEUDI"]:
    assert j in output, "Il manque " + j + "."
etoiles = [l for l in output.split("\\n") if l.strip().startswith("*")]
assert len(etoiles) >= 8, "Quatre appels, huit lignes d'etoiles. Ton programme en affiche " + str(len(etoiles)) + "."`,
        },
      },
    ],
  },
  {
    title: "🎹 Ta chanson avec refrain",
    description: "Compose couplets et refrain — le refrain écrit une seule fois.",
    xp_reward: 45,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>À toi la chanson</h3>
<p>Invente tes couplets et ton refrain. Le refrain doit être écrit dans une
<strong>fonction</strong>, et appelé entre chaque couplet.</p>
<p>Quand ça te plaît : change une note du refrain et réécoute. Un seul endroit, et
toute la chanson suit.</p>`,
        },
      },
      {
        type: "blockly_challenge",
        content: {
          game_type: "python_piano",
          title: "Ta chanson",
          instructions:
            "Ecris une fonction pour ton refrain, des couplets, et fais jouer le tout. " +
            "Au moins seize notes en tout.",
          min_notes: 16,
          tempo: 380,
          starter_code:
            'refrain = ["Sol", "Sol", "Mi"]\n\n' +
            "def joue_refrain():\n" +
            "    for n in refrain:\n" +
            "        jouer(n)\n" +
            "    silence()\n\n" +
            "# A toi : tes couplets, et joue_refrain() entre chacun\n",
        },
      },
    ],
  },
  {
    title: "La fonction qui ne répond pas",
    description: "Elle affiche. Elle ne rend rien. Et ça va te manquer.",
    xp_reward: 50,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Deux paniers</h3>
<p>Ama et Kofi ont chacun fait leurs courses. Tu vas écrire une fonction qui affiche
le total d'un panier, et l'appeler pour chacun.</p>
<p>Ça va marcher. Et juste après, on te posera une question à laquelle tu ne pourras
pas répondre. <strong>C'est fait exprès.</strong></p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris une fonction affiche_total(prix) qui calcule et affiche le total d'une " +
            "liste de prix. Appelle-la sur le panier d'Ama, puis sur celui de Kofi.",
          starter_code:
            "panier_ama  = [1500, 800, 2300]\n" +
            "panier_kofi = [1200, 2500, 700]\n\n" +
            "def affiche_total(prix):\n" +
            "    # A toi\n",
          hidden_tests: `import re
compact = code.replace(" ", "")
assert "defaffiche_total(prix)" in compact, "La fonction doit s'appeler affiche_total et prendre un parametre prix."
assert "affiche_total(panier_ama)" in compact, "Appelle la fonction sur le panier d'Ama."
assert "affiche_total(panier_kofi)" in compact, "Appelle la fonction sur le panier de Kofi."
nombres = re.findall(r"\\d+", output)
assert "4600" in nombres, "Le panier d'Ama fait 4600. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")
assert "4400" in nombres, "Le panier de Kofi fait 4400."`,
        },
      },
      {
        type: "text",
        content: {
          html: `
<h3>Maintenant, la question</h3>
<p><strong>Lequel des deux paniers est le plus cher ?</strong></p>
<p>Tu vois les deux totaux à l'écran, donc tu peux répondre <em>toi</em>. Mais essaie
de faire répondre <strong>le programme</strong> : écris un <code>if</code> qui compare
les deux totaux.</p>
<p>Tu ne peux pas. Ta fonction <strong>affiche</strong> le total — elle ne te le
<strong>donne</strong> pas. Le nombre part à l'écran et disparaît ; il n'en reste rien
dans ton programme.</p>
<p>Pour comparer, tu devrais recalculer les deux totaux à côté, hors de la fonction.
C'est absurde : le calcul est déjà écrit.</p>
<p>La semaine prochaine, tes fonctions apprennent à <strong>rendre</strong> leur
résultat au lieu de l'afficher. Ce sera un seul mot à ajouter.</p>`,
        },
      },
    ],
  },
];

async function main() {
  const maj = await db.from("lessons").update({
    objectives: [
      "Reconnaître qu'on utilise des fonctions depuis le premier programme",
      "Définir un bloc avec def et l'appeler",
      "Comprendre que définir n'est pas exécuter",
      "Donner un paramètre à sa fonction",
    ],
    status: "published",
  }).eq("id", LESSON_ID);
  if (maj.error) throw new Error("lessons: " + maj.error.message);

  await db.from("lesson_blocks").delete().eq("lesson_id", LESSON_ID);
  const insB = await db.from("lesson_blocks").insert(
    BLOCS.map((b, i) => ({ lesson_id: LESSON_ID, theme_id: THEME_ID, order_index: i, type: b.type, content: b.content }))
  );
  if (insB.error) throw new Error("lesson_blocks: " + insB.error.message);

  const anciens = await db.from("trainings").select("id").eq("lesson_id", LESSON_ID);
  for (const t of anciens.data ?? []) await db.from("training_blocks").delete().eq("training_id", t.id);
  await db.from("trainings").delete().eq("lesson_id", LESSON_ID);

  for (let i = 0; i < ENTRAINEMENTS.length; i++) {
    const e = ENTRAINEMENTS[i];
    const ins = await db.from("trainings").insert({
      lesson_id: LESSON_ID, title: e.title, description: e.description,
      xp_reward: e.xp_reward, order_index: i,
    }).select("id").single();
    if (ins.error) throw new Error(`training « ${e.title} » : ${ins.error.message}`);

    const insTB = await db.from("training_blocks").insert(
      e.blocks.map((b, j) => ({ training_id: ins.data.id, order_index: j, type: b.type, content: b.content }))
    );
    if (insTB.error) throw new Error(`blocs de « ${e.title} » : ${insTB.error.message}`);
  }

  console.log(`✓ ${BLOCS.length} blocs de cours`);
  console.log(`  cible jeu 1 : ${CIBLE_1.length} temps · cible jeu 2 : ${CIBLE_2.length} temps`);
  for (const e of ENTRAINEMENTS) console.log(`✓ « ${e.title} » — ${e.blocks.length} blocs`);
}

main().catch(e => { console.error("ÉCHEC :", e.message); process.exit(1); });
