/**
 * Contenu de la séance 5 du thème T0 Bâtisseur — « Le bug qui ne dit rien ».
 *
 * Dernière séance du thème : une méthode (faire parler le programme), une seule
 * notion neuve (l'accumulateur, reportée depuis la séance 4), et la synthèse.
 * Le jeu d'ouverture réutilise volontairement la grille du « Grand couloir »
 * que l'enfant a fait la veille — c'est son code, saboté d'un tour.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter(l => l.includes("="))
    .map(l => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim()])
);
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const LESSON_ID = "c6ec150c-0158-43d5-b64d-19a95779ddb8";
const THEME_ID  = "88495cc2-af2b-47ea-9a8e-9f2ef1a8316b";

// Grille du « Grand couloir » : U de quinze pas, reprise à l'identique.
const COULOIR_WALLS = [];
for (let x = 1; x <= 4; x++) for (let y = 1; y <= 4; y++) COULOIR_WALLS.push({ x, y });

const BLOCS = [
  // ── 0–5 min · reprise ─────────────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Il tourne. Il est faux.</h2>
<p>La semaine dernière, tu as découvert quelque chose de désagréable : un programme peut
tourner sans le moindre message rouge <strong>et donner un résultat faux</strong>.</p>
<p>Tu sais maintenant que « pas de rouge » ne veut plus dire « c'est bon ». Reste la vraie
question — celle d'aujourd'hui : <strong>comment trouve-t-on un bug qui ne dit rien ?</strong></p>`,
    },
  },

  // ── 5–17 min · son propre code, saboté ────────────────────────────────────
  {
    type: "game",
    content: {
      game_type: "python_maze",
      title: "Kirikou n'arrive plus",
      instructions:
        "Voici ta solution du grand couloir. Elle tourne. Aucun message rouge. " +
        "Et Kirikou s'arrete juste a cote de l'etoile. Trouve pourquoi.",
      grid_size: 6,
      start: { x: 0, y: 0, dir: "E" },
      goal:  { x: 0, y: 5 },
      walls: COULOIR_WALLS,
      par: 4,
      starter_code:
        "for tour in range(14):\n" +
        "    if mur_devant():\n" +
        "        tourne_droite()\n" +
        "    avance()\n",
    },
  },

  // ── 17–30 min · la méthode ────────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Faire parler le programme</h2>
<p>Kirikou s'arrête à un pas de l'étoile, et le programme n'a rien dit. Il n'avait rien à
dire : <strong>il a fait exactement ce que tu as écrit.</strong></p>
<p>Un programme ne se trompe jamais. Le bug est toujours dans l'écart entre ce que tu as
écrit et ce que tu voulais dire. Pour voir cet écart, il n'y a qu'un geste :
<strong>obliger le programme à raconter ce qu'il fait</strong>, tour par tour.</p>
<pre><code>for tour in range(14):
    print("tour", tour)
    if mur_devant():
        tourne_droite()
    avance()</code></pre>
<p>Lance-le. Le dernier tour affiché est <code>13</code>. Quatorze tours, de 0 à 13.
Il en fallait quinze.</p>
<h3>La méthode, en trois gestes</h3>
<ul>
<li><strong>Attendu</strong> — écris d'abord ce que tu attends. Ici : quinze pas.</li>
<li><strong>Obtenu</strong> — fais parler le programme, et lis ce qu'il fait vraiment.</li>
<li><strong>Compare</strong> — l'endroit où les deux se séparent, c'est là qu'est le bug.</li>
</ul>
<p>Ce mouchard n'est pas de la triche et ne restera pas dans ton programme. On le pose,
il parle, on l'enlève. Les développeurs font ça toute la journée.</p>`,
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Un print place dans une boucle affiche 0, 1, 2, 3. Combien de tours la boucle a-t-elle faits ?",
          choices: ["3 tours", "4 tours", "5 tours"],
          answer: 1,
          explanation: "Quatre nombres affichés, donc quatre passages. On compte les lignes, pas le dernier nombre.",
        },
        {
          question: "Dans  for tour in range(14):  quel est le dernier nombre affiché par  print(tour)  ?",
          choices: ["13", "14", "15"],
          answer: 0,
          explanation: "On part de 0 et on s'arrête juste avant 14. Quatorze tours, dernier numéro 13. C'est l'off-by-one de la semaine dernière.",
        },
        {
          question: "Où faut-il écrire le print pour voir ce qui se passe à CHAQUE tour ?",
          choices: ["Avant la boucle", "Décalé, à l'intérieur de la boucle", "Après la boucle, collé à gauche"],
          answer: 1,
          explanation: "Seul ce qui est décalé sous le for est répété. Collé à gauche, le print attend la fin et ne parle qu'une fois.",
        },
        {
          question: "Tu attends 15 pas. La trace s'arrête à 13. Que faut-il conclure ?",
          choices: [
            "Le programme est cassé, il faut tout réécrire",
            "Il manque un tour : range(14) doit devenir range(15)",
            "Kirikou est bloqué par un mur",
          ],
          answer: 1,
          explanation: "Attendu 15, obtenu 14 tours. L'écart est d'exactement un tour, et il se répare avec un seul chiffre.",
        },
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "Le mouchard mal placé",
      context: "On voulait suivre chaque tour. Le programme n'affiche qu'un seul nombre.",
      description: "Une ligne est mal placée. Clique dessus.",
      instructions: [
        "for tour in range(5):",
        "    avance()",
        "print(tour)",
      ],
      bug_index: 2,
      fix: "    print(tour)",
      explanation:
        "print est colle a gauche : il est HORS de la boucle. Il attend la fin des cinq tours " +
        "et n'affiche que la derniere valeur. Decale-le de 4 espaces et il parlera a chaque tour.",
    },
  },
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ce programme dit bonjour quatre fois, mais on ne voit pas ou il en est. " +
        "Fais-le parler : ajoute dans la boucle une ligne qui affiche le numero du tour.",
      starter_code: 'for tour in range(4):\n    print("Bonjour")\n',
      // La regex accepte aussi bien print(tour) que print("tour", tour) — la
      // forme montree dans le cours. Un test sur isdigit() rejetait la seconde.
      hidden_tests: `import re
nombres = re.findall(r"\\d+", output)
assert nombres, "On ne voit aucun numero de tour. Ajoute un print(tour) DANS la boucle, decale de 4 espaces."
assert nombres[:4] == ["0","1","2","3"], "Le programme doit afficher les tours 0, 1, 2 puis 3. Pour l'instant : " + " ".join(nombres)`,
    },
  },

  // ── 30–45 min · l'accumulateur ────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Une variable qui se souvient</h2>
<p>Jusqu'ici, une variable contenait <em>une</em> chose : un prénom, un prix, un numéro de
tour. Tu vas en fabriquer une d'un genre nouveau — une variable dont la valeur
<strong>dépend de tout ce qui s'est passé avant elle</strong>.</p>
<pre><code>total = 0

for tour in range(3):
    total = total + 500

print(total)</code></pre>
<p>Trois pièces, et leur place compte autant que leur contenu :</p>
<ul>
<li><code>total = 0</code> — <strong>avant</strong> la boucle. On part de zéro, une seule fois.</li>
<li><code>total = total + 500</code> — <strong>dans</strong> la boucle. À chaque tour, on ajoute.</li>
<li><code>print(total)</code> — <strong>après</strong> la boucle. Quand tout est fini.</li>
</ul>
<h3>La ligne qui choque</h3>
<p><code>total = total + 500</code> ressemble à une équation impossible. Ce n'en est pas une.
En Python, le signe <code>=</code> ne veut pas dire « est égal à ». Il veut dire
<strong>« range dans »</strong>.</p>
<p>Python calcule d'abord la droite, avec l'ancienne valeur, puis range le résultat dans
<code>total</code> :</p>
<pre><code>tour 0 :  0 + 500  =  500
tour 1 :  500 + 500  =  1000
tour 2 :  1000 + 500  =  1500</code></pre>
<p>Et si tu ne me crois pas — tu sais quoi faire maintenant. Pose un <code>print(total)</code>
dans la boucle, et regarde-le monter.</p>`,
    },
  },
  {
    type: "game",
    content: {
      game_type: "sort",
      title: "Remets l'accumulateur dans l'ordre",
      description: "Ce programme additionne trois fois 500 F, puis affiche le total une seule fois. Attention à ce qui est décalé.",
      items: [
        "total = 0",
        "for tour in range(3):",
        "    total = total + 500",
        "print(total)",
      ],
    },
  },
  {
    type: "game",
    content: {
      game_type: "fill_blank",
      title: "La ligne qui cumule",
      template: "total = [___]\n\nfor tour in range(3):\n    total = [___] + 500\n\nprint(total)",
      blanks: ["0", "total"],
    },
  },
  {
    type: "game",
    content: {
      game_type: "bug_hunt",
      title: "Le total qui ne monte pas",
      context: "On voulait additionner quatre fois 250 F. Le programme affiche 250.",
      description: "Une ligne est fausse. Clique dessus.",
      instructions: [
        "total = 0",
        "for tour in range(4):",
        "    total = 250",
        "print(total)",
      ],
      bug_index: 2,
      fix: "    total = total + 250",
      explanation:
        "total = 250 REMPLACE la valeur a chaque tour au lieu de l'augmenter. A la fin il reste " +
        "250, comme si les trois premiers tours n'avaient jamais existe. Pour cumuler, il faut " +
        "repartir de l'ancienne valeur : total = total + 250.",
    },
  },
  {
    type: "quiz",
    content: {
      questions: [
        {
          question: "Où doit s'écrire  total = 0  ?",
          choices: ["Avant la boucle", "Dans la boucle", "Après la boucle"],
          answer: 0,
          explanation: "Avant, et une seule fois. Dans la boucle, il remettrait le compteur à zéro à chaque tour.",
        },
        {
          question: "total part de 0, puis  total = total + 100  s'exécute trois fois. Que vaut total à la fin ?",
          choices: ["100", "300", "0"],
          answer: 1,
          explanation: "0 + 100 = 100, puis 100 + 100 = 200, puis 200 + 100 = 300. Chaque tour repart de la valeur précédente.",
        },
        {
          question: "Que veut dire le signe = dans  total = total + 1  ?",
          choices: [
            "« est égal à » — c'est une équation",
            "« range dans » — Python calcule la droite, puis stocke à gauche",
            "« compare avec » — comme ==",
          ],
          answer: 1,
          explanation: "C'est pour ça que la ligne n'est pas absurde. La droite est calculée avec l'ancienne valeur, le résultat écrase l'ancienne.",
        },
        {
          question: "Un programme cumule mais affiche toujours la même chose. Quel est le premier geste ?",
          choices: [
            "Tout réécrire depuis le début",
            "Poser un print(total) dans la boucle et regarder ce qu'il fait",
            "Changer le nombre de tours",
          ],
          answer: 1,
          explanation: "Attendu, obtenu, compare. On ne devine pas un bug silencieux : on fait parler le programme.",
        },
      ],
    },
  },

  // ── 45–60 min · la synthèse du thème ──────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le panier du marche. Ton programme demande le prix de 3 articles, un par un, " +
        "les additionne, puis affiche le total. Et si le total depasse 5000 F, il previent : " +
        "Attention, tu depasses le budget ! Tout ce qu'il te faut, tu l'as appris ce mois-ci.",
      starter_code:
        "total = 0\n\n" +
        "for article in range(3):\n" +
        '    prix = int(input("Prix de l\'article : "))\n\n' +
        'print("Total :", total, "F")\n',
      hidden_tests: `compact = code.replace(" ", "")
assert "for" in code, "Il faut une boucle for pour les 3 articles."
assert "input" in code, "Il faut demander chaque prix avec input."
assert "total=total+" in compact or "total+=" in compact, "Il manque le cumul : total = total + prix. Sans lui, le total reste a zero."
assert "if" in code, "Il faut un if pour prevenir quand le budget est depasse."
assert "5000" in code, "Le budget est de 5000 F : ton if doit comparer le total a 5000."
assert len(output.strip()) > 0, "Ton programme n'affiche rien."`,
    },
  },

  // ── 60–65 min · bilan ─────────────────────────────────────────────────────
  {
    type: "text",
    content: {
      html: `
<h2>Ce que « ça marche » veut dire maintenant</h2>
<p>Il y a un mois, « ça marche » voulait dire : pas de message rouge. Tu sais depuis la
semaine dernière que ça ne suffit pas.</p>
<p>À partir d'aujourd'hui, <strong>« ça marche » veut dire : j'ai vérifié que le programme
fait ce que j'attendais.</strong> Et pour vérifier, tu as une méthode — attendu, obtenu,
compare.</p>
<p>C'est la seule chose de ce thème que tu utiliseras encore dans dix ans.</p>`,
    },
  },
  {
    type: "game",
    content: {
      game_type: "memory",
      title: "Les mots de la seance",
      description: "Retourne les cartes et retrouve les paires.",
      pairs: [
        { left: "total = 0",           right: "Avant la boucle" },
        { left: "total = total + 1",   right: "Dans la boucle" },
        { left: "print(total)",        right: "Apres la boucle" },
        { left: "=",                   right: "Range dans" },
      ],
    },
  },
  {
    type: "text",
    content: {
      html: `
<h2>Fin du premier thème</h2>
<p>Tu sais faire afficher, garder une information, choisir, répéter — et maintenant cumuler
et déboguer. Avec ça, tu peux déjà écrire de vrais petits programmes.</p>
<p>Mais tu vas vite buter sur un mur. Essaie de faire le total de <strong>vingt</strong>
articles avec ce que tu sais : il te faudrait vingt variables, et vingt lignes pour les
additionner.</p>
<p>C'est exactement le problème que résout le thème suivant. La semaine prochaine, tu
apprends à ranger plusieurs choses dans <strong>une seule</strong> variable.</p>`,
    },
  },
];

const ENTRAINEMENTS = [
  {
    title: "Attendu ou obtenu ?",
    description: "Lire une trace et repérer le tour exact où le programme dérape.",
    xp_reward: 30,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>On ne devine pas un bug</h3>
<p>Quand un programme est faux sans planter, la seule question qui compte est :
<strong>à quel moment ce qu'il fait cesse de ressembler à ce que j'attendais ?</strong></p>`,
        },
      },
      {
        type: "quiz",
        content: {
          questions: [
            {
              question: "Tu attends 6 tours. La trace affiche 0 1 2 3 4. Que s'est-il passé ?",
              choices: ["Six tours, tout va bien", "Cinq tours seulement : il en manque un", "Le programme a planté"],
              answer: 1,
              explanation: "Cinq nombres affichés = cinq tours. On compte les lignes, jamais le dernier nombre.",
            },
            {
              question: "Un compteur devrait monter 10, 20, 30. La trace affiche 10, 10, 10. Où est le bug ?",
              choices: [
                "La boucle ne fait qu'un tour",
                "La ligne remplace la valeur au lieu de l'ajouter",
                "Le print est mal placé",
              ],
              answer: 1,
              explanation: "Trois lignes affichées, donc trois tours : la boucle marche. C'est le cumul qui écrase au lieu d'ajouter.",
            },
            {
              question: "La trace ne montre qu'une seule ligne alors que la boucle fait 5 tours. Pourquoi ?",
              choices: [
                "Le print est collé à gauche, hors de la boucle",
                "range(5) ne fait qu'un tour",
                "Python n'affiche que la dernière ligne",
              ],
              answer: 0,
              explanation: "Hors de la boucle, le print attend la fin des cinq tours et ne parle qu'une fois.",
            },
            {
              question: "Quel est le tout premier geste devant un programme faux qui ne plante pas ?",
              choices: [
                "Réécrire le programme depuis le début",
                "Écrire ce qu'on attend, puis faire parler le programme",
                "Changer les nombres au hasard jusqu'à ce que ça marche",
              ],
              answer: 1,
              explanation: "Attendu, obtenu, compare. Changer au hasard peut faire disparaître le symptôme sans réparer le bug.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Le total qui ment",
    description: "Trois pièces, trois places. Une seule combinaison donne le bon total.",
    xp_reward: 35,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>La place compte autant que la ligne</h3>
<p>Un accumulateur, c'est trois lignes justes — mais chacune à son étage. Une seule mal
placée, et le programme tourne quand même en donnant n'importe quoi.</p>`,
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Complète l'accumulateur",
          template: "total = [___]\n\nfor tour in range(5):\n    total = [___] + 200\n\nprint(total)",
          blanks: ["0", "total"],
        },
      },
      {
        type: "quiz",
        content: {
          questions: [
            {
              question: "Si on écrit  total = 0  À L'INTÉRIEUR de la boucle, qu'affiche le programme à la fin ?",
              choices: ["Le total complet", "Seulement la dernière valeur ajoutée", "Zéro"],
              answer: 1,
              explanation: "Le compteur est remis à zéro à chaque tour. Il ne reste que ce qui a été ajouté au dernier tour.",
            },
            {
              question: "Si  print(total)  est écrit DANS la boucle au lieu d'après, que se passe-t-il ?",
              choices: [
                "Le total est faux",
                "Le total est bon, mais il s'affiche à chaque tour",
                "Le programme plante",
              ],
              answer: 1,
              explanation: "Le calcul reste juste : c'est seulement l'affichage qui se répète. Utile pour déboguer, encombrant pour le résultat final.",
            },
            {
              question: "total part de 0, puis  total = total + 200  cinq fois. Résultat ?",
              choices: ["200", "1000", "1200"],
              answer: 1,
              explanation: "Cinq tours à 200 : 200, 400, 600, 800, 1000.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "La chasse silencieuse",
    description: "Un programme sans le moindre message rouge, et pourtant faux.",
    xp_reward: 40,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Aucun rouge, et pourtant</h3>
<p>Ce programme devrait afficher le cumul des cinq versements d'un tontinier : 5 × 1000 F,
soit <strong>5000 F</strong>. Il tourne parfaitement. Il se trompe.</p>
<p>Fais-le parler avant de le corriger.</p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Cinq versements de 1000 F. Le total affiche doit etre 5000. " +
            "Repare le programme sans changer le nombre de tours.",
          starter_code:
            "total = 0\n\n" +
            "for versement in range(5):\n" +
            "    total = 1000\n\n" +
            'print("Total de la tontine :", total, "F")\n',
          hidden_tests: `import re
nombres = re.findall(r"\\d+", output)
assert nombres, "Ton programme n'affiche aucun nombre."
assert "5000" in nombres, "Le total doit etre 5000 F. Ton programme affiche : " + " ".join(nombres) + ". Regarde bien la ligne dans la boucle : est-ce qu'elle ajoute, ou est-ce qu'elle remplace ?"
assert "range(5)" in code.replace(" ", ""), "Le nombre de tours ne doit pas changer : il y a bien cinq versements."`,
        },
      },
    ],
  },
  {
    title: "Cinq variables pour rien",
    description: "Ça marche. C'est absurde. La semaine prochaine, on répare ça.",
    xp_reward: 50,
    blocks: [
      {
        type: "text",
        content: {
          html: `
<h3>Fais-le, même si c'est pénible</h3>
<p>Voici cinq prix, chacun dans sa propre variable. Ton travail : afficher leur total.</p>
<p>Tu vas y arriver — et tu vas trouver ça ridicule. C'est fait exprès.
<strong>Retiens ce que tu ressens en l'écrivant</strong>, on en reparle à la prochaine séance.</p>`,
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Affiche le total de ces cinq prix. Tu n'as pas encore l'outil pour faire court : " +
            "fais-le a la main, et compte le nombre de lignes que ca te demande.",
          starter_code:
            "prix1 = 1500\n" +
            "prix2 = 800\n" +
            "prix3 = 2300\n" +
            "prix4 = 450\n" +
            "prix5 = 1200\n\n",
          hidden_tests: `import re
nombres = re.findall(r"\\d+", output)
assert nombres, "Ton programme n'affiche rien."
assert "6250" in nombres, "Le total des cinq prix est 6250. Ton programme affiche : " + " ".join(nombres)`,
        },
      },
      {
        type: "text",
        content: {
          html: `
<h3>Maintenant imagine vingt articles</h3>
<p>Vingt variables. Vingt noms à inventer. Une addition longue comme le bras. Et si un prix
change de place, tout est à réécrire.</p>
<p>Il existe une façon de ranger cinq prix — ou cinq mille — dans <strong>une seule</strong>
variable. C'est le sujet de la prochaine séance.</p>`,
        },
      },
    ],
  },
];

// ── Écriture ─────────────────────────────────────────────────────────────────
async function main() {
  const maj = await db.from("lessons").update({
    title: "🔧 Le bug qui ne dit rien",
    objectives: [
      "Trouver un bug qui ne provoque aucun message d'erreur",
      "Faire parler un programme avec print pour comparer attendu et obtenu",
      "Cumuler des valeurs dans une boucle avec un accumulateur",
    ],
    status: "published",
  }).eq("id", LESSON_ID);
  if (maj.error) throw new Error("lessons: " + maj.error.message);

  await db.from("lesson_blocks").delete().eq("lesson_id", LESSON_ID);
  const blocs = BLOCS.map((b, i) => ({
    lesson_id: LESSON_ID, theme_id: THEME_ID,
    order_index: i, type: b.type, content: b.content,
  }));
  const insB = await db.from("lesson_blocks").insert(blocs);
  if (insB.error) throw new Error("lesson_blocks: " + insB.error.message);

  const anciens = await db.from("trainings").select("id").eq("lesson_id", LESSON_ID);
  for (const t of anciens.data ?? []) {
    await db.from("training_blocks").delete().eq("training_id", t.id);
  }
  await db.from("trainings").delete().eq("lesson_id", LESSON_ID);

  for (let i = 0; i < ENTRAINEMENTS.length; i++) {
    const e = ENTRAINEMENTS[i];
    const ins = await db.from("trainings").insert({
      lesson_id: LESSON_ID, title: e.title, description: e.description,
      xp_reward: e.xp_reward, order_index: i,
    }).select("id").single();
    if (ins.error) throw new Error(`training « ${e.title} » : ${ins.error.message}`);

    const tb = e.blocks.map((b, j) => ({
      training_id: ins.data.id, order_index: j, type: b.type, content: b.content,
    }));
    const insTB = await db.from("training_blocks").insert(tb);
    if (insTB.error) throw new Error(`blocs de « ${e.title} » : ${insTB.error.message}`);
  }

  console.log(`✓ ${BLOCS.length} blocs de cours`);
  for (const e of ENTRAINEMENTS) console.log(`✓ entraînement « ${e.title} » — ${e.blocks.length} blocs`);
}

main().catch(e => { console.error("ÉCHEC :", e.message); process.exit(1); });
