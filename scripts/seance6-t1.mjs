/**
 * Séance 6 du Bâtisseur — T1 « Les listes ».
 *
 * Première séance du deuxième thème. Elle récolte la frustration semée la
 * semaine précédente par l'entraînement « Cinq variables pour rien », et
 * n'enseigne qu'une chose : une variable peut contenir plusieurs valeurs, et
 * le `for` les distribue.
 *
 * L'accès par indice (melodie[0]) est volontairement absent — voir le guide
 * mentor pour le pourquoi.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const LESSON_ID = "8c72492b-098e-40fe-9ff7-cabdaed20206";
const THEME_ID  = "d34e9e85-f171-47ab-8d03-045dd00a9f71";

// Frère Jacques — quatre phrases, chacune jouée deux fois. Trente-deux notes.
const FRERE_JACQUES = [
  "Do","Re","Mi","Do",  "Do","Re","Mi","Do",
  "Mi","Fa","Sol",      "Mi","Fa","Sol",
  "Sol","La","Sol","Fa","Mi","Do",  "Sol","La","Sol","Fa","Mi","Do",
  "Do","Sol","Do",      "Do","Sol","Do",
];
const TRENTE_DEUX_LIGNES = FRERE_JACQUES.map(n => `jouer("${n}")`).join("\n") + "\n";
const LISTE_PYTHON = "[" + FRERE_JACQUES.map(n => `"${n}"`).join(", ") + "]";

const BLOCS = [
  // ── 0–5 min · la frustration de la veille ─────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Cinq variables pour rien</h2>
<p>Hier soir, tu as écrit cinq lignes pour ranger cinq prix, puis une addition
longue comme le bras. Ça marchait. Et c'était ridicule — tu l'as senti en l'écrivant.</p>
<p>Maintenant imagine vingt articles. Ou deux cents.</p>
<p><strong>Aujourd'hui tu apprends à ranger autant de choses que tu veux dans une
seule variable.</strong></p>`,
    },
  },

  // ── 5–16 min · la douleur, chiffrée ───────────────────────────────────────
  {
    type: "game",
    content: {
      game_type: "python_piano",
      title: "Frère Jacques, en trente-deux lignes",
      instructions:
        "Voici Frere Jacques, note par note. Trente-deux appels, un par note. " +
        "Lance-le : ca marche. Regarde le nombre d'etoiles, et regarde l'objectif.",
      target: FRERE_JACQUES,
      par: 3,
      tempo: 360,
      starter_code: TRENTE_DEUX_LIGNES,
    },
  },

  // ── 16–30 min · la notion ─────────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Une boîte pour plusieurs choses</h2>
<p>Une <strong>liste</strong>, c'est une variable qui contient plusieurs valeurs,
dans l'ordre, entre crochets et séparées par des virgules :</p>
<pre><code>melodie = ["Do", "Re", "Mi", "Do"]
prix = [1500, 800, 2300]</code></pre>
<p>Une seule variable. Autant de valeurs que tu veux. Et pour les parcourir, tu
connais déjà la forme — c'est celle de la semaine dernière :</p>
<pre><code>for note in melodie:
    jouer(note)</code></pre>
<h3>Le <code>for</code> ne compte pas. Il distribue.</h3>
<p>C'est le point qui trompe tout le monde. Regarde les deux côte à côte, et
surtout regarde ce qu'ils <em>affichent</em> :</p>
<pre><code>for tour in range(3):        for note in melodie:
    print(tour)                  print(note)

0                            Do
1                            Re
2                            Mi</code></pre>
<p>À gauche, la variable <strong>compte</strong> : 0, 1, 2. À droite, elle
<strong>reçoit</strong> les valeurs de la liste, une par une.</p>
<p>Tu n'as pas à me croire — tu sais faire parler un programme depuis la semaine
dernière. Mets un <code>print</code> dans la boucle et regarde.</p>`,
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Combien de valeurs contient  couleurs = [\"rouge\", \"vert\", \"bleu\"]  ?",
          choices: ["Une seule, un long texte", "Trois", "Aucune, c'est vide"],
          answer: 1,
          explanation: "Trois valeurs séparées par des virgules, rangées dans une seule variable. C'est tout l'intérêt.",
        },
        {
          question: "Dans  for note in melodie:  que contient la variable note au premier tour ?",
          choices: ["0", "La première valeur de la liste", "La liste entière"],
          answer: 1,
          explanation: "Elle reçoit les valeurs une par une, dans l'ordre. Elle ne compte pas — elle distribue.",
        },
        {
          question: "melodie contient 5 notes. Combien de tours fait  for note in melodie:  ?",
          choices: ["4 tours", "5 tours", "Ça dépend de range"],
          answer: 1,
          explanation: "Un tour par valeur. Pas besoin de compter ni de connaître la longueur : la boucle s'arrête au bout de la liste.",
        },
        {
          question: "Quelle est la différence entre  range(3)  et une liste ?",
          choices: [
            "range fabrique des nombres, une liste contient ce que tu veux",
            "Il n'y en a aucune",
            "Une liste ne marche pas avec for",
          ],
          answer: 0,
          explanation: "range ne sait faire que des nombres qui se suivent. Une liste contient des textes, des prix, des notes — ce que tu veux, dans l'ordre que tu veux.",
        },
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "sort",
      title: "Remets le programme dans l'ordre",
      description: "Ce programme joue chaque note de la mélodie, puis dit au revoir une seule fois. Attention au décalage.",
      items: [
        'melodie = ["Do", "Mi", "Sol"]',
        "for note in melodie:",
        "    jouer(note)",
        'print("Fini !")',
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "fill_blank",
      title: "Complète le parcours",
      template: 'prix = [1500, 800, 2300]\n\n[___] p [___] prix:\n    print(p)',
      blanks: ["for", "in"],
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "La liste au lieu de la note",
      context: "Le programme devait jouer les trois notes. Il ne joue rien de correct.",
      description: "Une ligne est fausse. Clique dessus.",
      instructions: [
        'melodie = ["Do", "Mi", "Sol"]',
        "for note in melodie:",
        "    jouer(melodie)",
      ],
      bug_index: 2,
      fix: "    jouer(note)",
      explanation:
        "jouer(melodie) passe la LISTE ENTIERE a chaque tour, au lieu de la note du moment. " +
        "melodie est la boite ; note est ce que la boucle en sort. C'est note qu'il faut jouer.",
    },
  },

  // ── 30–38 min · le soulagement ────────────────────────────────────────────
  {
    type: "game",
    content: {
      game_type: "python_piano",
      title: "La même mélodie, en trois lignes",
      instructions:
        "Les trente-deux notes tiennent maintenant dans une seule variable. " +
        "A toi d'ecrire la boucle qui les joue. Puis change une note et reecoute : " +
        "une seule ligne a modifier, au lieu de trente-deux.",
      target: FRERE_JACQUES,
      par: 3,
      tempo: 360,
      starter_code: `melodie = ${LISTE_PYTHON}\n\n# A toi : joue chaque note de la liste\n`,
    },
  },

  // ── 38–48 min · ajouter et compter ────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Ajouter et compter</h2>
<p>Une liste n'est pas figée. On peut partir de rien et la remplir :</p>
<pre><code>ma_melodie = []

ma_melodie.append("Sol")
ma_melodie.append("Mi")
ma_melodie.append("Do")

print(ma_melodie)</code></pre>
<ul>
<li><code>[]</code> — une liste <strong>vide</strong>. Elle existe, elle ne contient rien encore.</li>
<li><code>.append(valeur)</code> — <strong>ajoute à la fin</strong>. C'est le mot anglais pour « accrocher au bout ».</li>
<li><code>len(ma_melodie)</code> — <strong>combien</strong> il y en a.</li>
</ul>
<h3>Le point qui ressemble à quelque chose que tu connais</h3>
<p>Le <code>[]</code> se met <strong>avant</strong>, une seule fois. Exactement comme
le <code>total = 0</code> de la semaine dernière. Si tu le remets à l'intérieur d'une
boucle, ta liste repart vide à chaque tour et tu ne gardes que la dernière valeur.</p>`,
    },
  },
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Fais ta liste de courses. Pars d'une liste vide, ajoute trois articles avec " +
        "append, puis affiche la liste et le nombre d'articles.",
      starter_code: "courses = []\n",
      hidden_tests: `import re
compact = code.replace(" ", "")
assert "courses=[]" in compact, "Commence par une liste vide : courses = []"
assert code.count("append") >= 3, "Ajoute trois articles, un par appel a .append()"
assert "len(" in compact, "Affiche aussi combien il y en a, avec len()"
nombres = re.findall(r"\\d+", output)
assert "3" in nombres, "Ton programme doit afficher 3 — le nombre d'articles. Il affiche : " + (" ".join(nombres) or "aucun nombre")`,
    },
  },

  // ── 48–62 min · la notion la plus dure du thème précédent, sur une liste ──
  {
    type: "text",
    content: {
      html: `
<h2>Un <code>si</code> à l'intérieur d'une boucle</h2>
<p>Tu sais parcourir une liste. Tu sais choisir avec <code>if</code>. Il ne reste
qu'à mettre l'un dans l'autre — et c'est la chose la plus difficile que tu aies
apprise jusqu'ici, alors prends ton temps.</p>
<pre><code>prix = [1500, 800, 2300]

for p in prix:
    if p > 2000:
        print("Article cher :", p)</code></pre>
<p>Lis-le à voix haute : <em>« pour chaque prix de la liste, si ce prix dépasse
2 000, alors préviens »</em>. Le <code>if</code> est <strong>dans</strong> la boucle :
il est reposé à chaque tour, sur la valeur du moment.</p>
<h3>Compte les décalages</h3>
<pre><code>for p in prix:          &lt;- 0 espace
    if p &gt; 2000:         &lt;- 4 espaces, dans la boucle
        print(...)       &lt;- 8 espaces, dans le si</code></pre>
<p>Chaque décalage veut dire « je suis à l'intérieur du précédent ». Ramène le
<code>if</code> à zéro espace et il ne s'exécutera plus qu'une fois, tout à la fin.</p>`,
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "L'alerte qui ne prévient qu'une fois",
      context: "Deux articles depassent 2 000 F. Le programme n'en signale qu'un — le dernier.",
      description: "Une ligne est mal placée. Clique dessus.",
      // total = 0 est présent : sans lui le programme aurait une seconde erreur,
      // et l'enfant chercherait celle-là au lieu du décalage.
      instructions: [
        "prix = [2500, 800, 2300]",
        "total = 0",
        "for p in prix:",
        "    total = total + p",
        "if p > 2000:",
        '    print("Article cher :", p)',
      ],
      bug_index: 4,
      fix: "    if p > 2000:",
      explanation:
        "Le if est colle a gauche : il est HORS de la boucle. Il attend la fin des trois tours " +
        "et ne teste alors que la derniere valeur de p. Decale-le de 4 espaces et il sera repose " +
        "a chaque article.",
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Où doit s'écrire  ma_liste = []  ?",
          choices: ["Avant la boucle", "Dans la boucle", "Après la boucle"],
          answer: 0,
          explanation: "Avant, et une seule fois — comme le total = 0. Dans la boucle, la liste repartirait vide à chaque tour.",
        },
        {
          question: "Que fait  .append(\"Do\")  ?",
          choices: ["Remplace toute la liste par Do", "Ajoute Do à la fin de la liste", "Cherche Do dans la liste"],
          answer: 1,
          explanation: "Il accroche la valeur au bout. La liste s'allonge d'un cran à chaque appel.",
        },
        {
          question: "Un if décalé de 4 espaces sous  for p in prix:  — combien de fois est-il testé ?",
          choices: ["Une fois, à la fin", "Une fois par valeur de la liste", "Jamais"],
          answer: 1,
          explanation: "Décalé, il est dans la boucle : il est reposé à chaque tour, sur la valeur du moment.",
        },
        {
          question: "Ta liste contient 7 notes. Que renvoie  len(melodie)  ?",
          choices: ["6", "7", "La dernière note"],
          answer: 1,
          explanation: "len compte les éléments. Sept notes, sept. Ce n'est pas un indice — juste un nombre.",
        },
      ],
    },
  },
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le panier du marche, la revanche. Les cinq prix sont deja dans une liste. " +
        "Affiche le total, et previens pour chaque article qui depasse 2 000 F " +
        "en affichant son prix. " +
        "Tu as tout ce qu'il faut : la liste, la boucle, l'accumulateur et le si.",
      starter_code:
        "prix = [1500, 800, 2300, 450, 1200]\n" +
        "total = 0\n\n" +
        "# A toi\n",
      hidden_tests: `import re
compact = code.replace(" ", "")
assert "forp" in compact or "for " in code, "Il faut une boucle for pour parcourir la liste."
assert "total=total+" in compact or "total+=" in compact, "Il manque le cumul : total = total + p"
assert "if" in code, "Il faut un if pour signaler les articles a plus de 2 000 F."
assert "2000" in compact, "Compare chaque prix a 2000."
nombres = re.findall(r"\\d+", output)
assert "6250" in nombres, "Le total des cinq prix est 6250. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")
assert "2300" in nombres, "Un seul article depasse 2 000 F : celui a 2300. Ton programme doit le signaler."`,
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
        { left: "[ ]",              right: "Une liste vide" },
        { left: "for x in liste",   right: "Prend chaque valeur" },
        { left: ".append(v)",       right: "Ajoute a la fin" },
        { left: "len(liste)",       right: "Combien d'elements" },
      ],
    },
  },
  {
    type: "text",
    content: {
      html: `
<h2>Ce que tu sais faire maintenant</h2>
<p>Ranger plusieurs valeurs dans une seule variable, les parcourir, en ajouter,
les compter — et poser une question sur chacune au passage.</p>
<p>Trente-deux lignes sont devenues trois. Et surtout : pour changer la mélodie,
tu modifies <strong>un seul endroit</strong>.</p>
<h3>Le mur suivant</h3>
<p>Cette semaine, tu vas devoir écrire trois fois exactement le même bloc de
lignes, à trois endroits différents de ton programme. Ça marchera. Ce sera
pénible — et cette fois une liste ne t'aidera pas.</p>
<p>La semaine prochaine, tu apprends à <strong>donner un nom à un morceau de
programme</strong>, pour ne plus jamais le réécrire.</p>`,
    },
  },
];

const ENTRAINEMENTS = [
  {
    title: "Une seule boîte pour tout",
    description: "Ce qu'est une liste, et ce que la boucle en fait.",
    xp_reward: 30,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Une variable, plusieurs valeurs</h3>
<p>Deux questions à se poser devant chaque liste : <strong>qu'est-ce qu'elle
contient</strong>, et <strong>que reçoit la variable de la boucle</strong> ?
Ce ne sont pas les mêmes réponses.</p>`,
        },
      },
      {
        type: "quiz",
        content: {
          questions: [
            {
              question: "Laquelle de ces lignes crée une liste de trois villes ?",
              choices: [
                'villes = "Lome" "Kara" "Sokode"',
                'villes = ["Lome", "Kara", "Sokode"]',
                'villes = Lome, Kara, Sokode',
              ],
              answer: 1,
              explanation: "Des crochets, des virgules, et chaque texte entre guillemets. C'est la forme à retenir.",
            },
            {
              question: "for ville in villes:  puis  print(ville)  décalé. Qu'affiche la première ligne ?",
              choices: ["0", "Lome", "villes"],
              answer: 1,
              explanation: "La variable reçoit la première valeur de la liste. Elle ne compte pas, elle distribue.",
            },
            {
              question: "Pourquoi une liste vaut-elle mieux que trois variables ville1, ville2, ville3 ?",
              choices: [
                "Elle est plus jolie",
                "On peut toutes les traiter avec une seule boucle",
                "Elle va plus vite",
              ],
              answer: 1,
              explanation: "C'est tout l'intérêt : un seul endroit à écrire, un seul endroit à modifier — que la liste ait trois valeurs ou deux cents.",
            },
            {
              question: "Que se passe-t-il si la liste est vide et qu'on écrit  for x in liste:  ?",
              choices: ["Le programme plante", "La boucle ne fait aucun tour", "Elle fait un tour à vide"],
              answer: 1,
              explanation: "Pas de valeur, pas de tour. C'est logique et ça ne provoque aucune erreur.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Le panier qui grandit",
    description: "Partir de rien, ajouter, compter.",
    xp_reward: 40,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Une liste qui se remplit</h3>
<p>On part de <code>[]</code>, une liste vide, et on accroche des valeurs au bout
avec <code>.append()</code>. Le <code>[]</code> se met <strong>avant</strong>, une
seule fois — comme le <code>total = 0</code>.</p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Un tontinier note les versements de la semaine. Pars d'une liste vide, " +
            "ajoute 1000, 1500 puis 2000, affiche la liste, puis le total et le nombre de versements.",
          starter_code: "versements = []\n",
          hidden_tests: `import re
compact = code.replace(" ", "")
assert "versements=[]" in compact, "Commence par une liste vide : versements = []"
assert code.count("append") >= 3, "Ajoute les trois versements avec .append()"
assert "len(" in compact, "Affiche le nombre de versements avec len()"
nombres = re.findall(r"\\d+", output)
assert "4500" in nombres, "Le total des trois versements est 4500. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")
assert "3" in nombres, "Affiche aussi le nombre de versements : 3."`,
        },
      },
    ],
  },
  {
    title: "🎹 Ta mélodie à toi",
    description: "Compose ce que tu veux — au moins huit notes.",
    xp_reward: 45,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>À toi de composer</h3>
<p>Plus de mélodie imposée. Range les notes que tu veux dans une liste, dans
l'ordre que tu veux, et fais-les jouer. Au moins huit.</p>
<p>Essaie de changer une seule note et de réécouter. C'est ça, le vrai pouvoir
d'une liste.</p>`,
        },
      },
      {
        // La contrainte CHECK de training_blocks n'accepte pas de nouveau type :
        // les jeux Python voyagent sous blockly_challenge + game_type.
        type: "blockly_challenge",
        content: {
          game_type: "python_piano",
          title: "Ta mélodie",
          instructions: "Compose une melodie d'au moins huit notes, puis fais-la jouer par une boucle.",
          min_notes: 8,
          tempo: 400,
          starter_code:
            'ma_melodie = ["Sol", "Mi", "Do"]\n\n' +
            "# Ajoute des notes, puis joue-les toutes\n",
        },
      },
    ],
  },
  {
    title: "Trois fois la même politesse",
    description: "Ça marche. C'est pénible. Et cette fois, une liste n'y peut rien.",
    xp_reward: 50,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Fais-le, même si c'est lourd</h3>
<p>Tu vas écrire un petit bulletin en trois sections. Chaque section commence par
le même cadre de trois lignes, mais elles sont séparées par du contenu différent.</p>
<p><strong>Retiens ce que tu ressens en recopiant ce cadre.</strong> On en reparle
à la prochaine séance.</p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Affiche trois sections. Chacune commence par un cadre : une ligne de signes =, " +
            "le titre, puis une autre ligne de signes =. Entre les cadres, affiche le contenu " +
            "de la section. Titres : MES MATIERES, MES NOTES, MES OBJECTIFS.",
          starter_code:
            'print("========================")\n' +
            'print("  MES MATIERES")\n' +
            'print("========================")\n' +
            'print("Maths, Francais, Anglais")\n\n' +
            "# A toi : les deux autres sections\n",
          hidden_tests: `lignes = [l for l in output.split("\\n")]
cadres = [l for l in lignes if l.strip().startswith("====")]
assert len(cadres) >= 6, "Il faut trois cadres, donc six lignes de signes =. Ton programme en affiche " + str(len(cadres)) + "."
for titre in ["MES MATIERES", "MES NOTES", "MES OBJECTIFS"]:
    assert titre in output, "Il manque la section " + titre + "."`,
        },
      },
      {
        type: "text",
        content: {
          html: `
<h3>Compte les lignes que tu as recopiées</h3>
<p>Trois fois le même cadre. Et si demain tu veux des tirets au lieu des égales,
il faut le changer partout.</p>
<p>Une liste ne résout rien ici : ce n'est pas une valeur qui se répète, c'est un
<strong>morceau de programme</strong>. Il existe une façon de lui donner un nom et
de l'appeler autant de fois qu'on veut. C'est la prochaine séance.</p>`,
        },
      },
    ],
  },
];

async function main() {
  const maj = await db.from("lessons").update({
    objectives: [
      "Ranger plusieurs valeurs dans une seule variable",
      "Parcourir une liste avec for — et comprendre qu'elle distribue au lieu de compter",
      "Ajouter avec append, compter avec len",
      "Poser un si à l'intérieur d'une boucle sur une liste",
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
  for (const e of ENTRAINEMENTS) console.log(`✓ « ${e.title} » — ${e.blocks.length} blocs`);
}

main().catch(e => { console.error("ÉCHEC :", e.message); process.exit(1); });
