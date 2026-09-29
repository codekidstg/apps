/**
 * Bâtisseur — thème 1, séance 4 : « Les dictionnaires ».
 *
 *     node scripts/batisseur-t1-s4-dictionnaires.mjs [--ecrire] [--refaire] [--banc]
 *
 * La séance précédente laisse l'enfant devant un mur, écrit noir sur blanc :
 * « deux listes en parallèle… ajoute un article au milieu, et tout se décale.
 * La semaine prochaine, tu apprends à attacher le nom au prix. » Cette séance
 * commence exactement là.
 *
 * Elle suit la charpente des trois précédentes : on PRATIQUE d'abord (le
 * deuxième bloc est déjà un défi de code), l'explication vient après et
 * s'appuie sur ce qu'on vient de faire, le piège de la séance a son propre
 * moment, et la dernière ligne annonce le mur suivant.
 *
 * Ce que le parcours a enseigné et qu'on peut donc utiliser : print, input,
 * int(), if/else, for/range, les listes et leur parcours, def, les paramètres,
 * return, None, len(). Ce qu'il n'a JAMAIS enseigné et qui reste interdit :
 * l'indexation par position (liste[0]), while, les classes, les f-strings.
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les dictionnaires";

// ── Garde-fous arithmétiques : les nombres du cours doivent être vrais ────
const CARNET = { Riz: 1500, Huile: 2300, Savon: 800 };
const TOTAL = Object.values(CARNET).reduce((a, b) => a + b, 0);
if (TOTAL !== 4600) throw new Error(`le carnet totalise ${TOTAL}, attendu 4600`);
if (CARNET.Riz + CARNET.Savon !== 2300) throw new Error("Riz + Savon doit faire 2300");

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const BLOCS = [
  // ── 0. L'accroche : reprendre le mur laissé la semaine dernière ────────
  texte(
    "<h3>Le troisième prix va avec le troisième nom</h3>" +
    "<p>La semaine dernière, tu gardais deux listes côte à côte : les noms d'un côté, les prix de l'autre. Ça marchait — tant que tu ne te trompais pas d'un cran.</p>" +
    "<p>Ajoute un article au milieu, et tout se décale. C'est <strong>toi</strong> qui te souvenais que 1500 allait avec Riz. Le programme, lui, n'en savait rien.</p>" +
    "<p>Aujourd'hui, tu attaches le nom au prix. Un seul signe nouveau : les <strong>accolades</strong>.</p>"
  ),

  // ── 1. On pratique tout de suite ───────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le carnet des prix est deja ecrit : chaque nom est colle a son prix.\n" +
        "1. Affiche le prix de l'Huile.\n" +
        "2. Ajoute le Sucre a 700, puis affiche son prix.",
      starter_code:
        'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
        '# 1. Le prix de l\'Huile : sers-toi de son nom entre crochets.\n\n' +
        "# 2. Ajoute le Sucre a 700, puis affiche-le.\n",
      hidden_tests:
        'import re\n' +
        'assert "prix[" in code, "Pour lire une valeur, on ecrit le nom entre crochets : prix[\\"Huile\\"]."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "2300" in nombres, "Le prix de l Huile est 2300. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
        'assert "700" in nombres, "Le Sucre coute 700, et son prix doit s afficher lui aussi."',
    },
  },

  // ── 2. L'explication, appuyée sur ce qui vient d'être fait ─────────────
  texte(
    "<h3>Une boîte à étiquettes</h3>" +
    "<p>Une <strong>liste</strong>, c'est une file : les valeurs sont rangées dans l'ordre, et on les parcourt du début à la fin.</p>" +
    "<p>Un <strong>dictionnaire</strong>, c'est un carnet : chaque valeur est collée à une étiquette, et on la retrouve par son étiquette. L'étiquette s'appelle la <strong>clé</strong>.</p>" +
    "<pre><code>prix = {\"Riz\": 1500, \"Huile\": 2300}\n" +
    "        ↑ la clé      ↑ la valeur</code></pre>" +
    "<p>Pour <strong>lire</strong> : <code>prix[\"Riz\"]</code> vaut 1500.<br>" +
    "Pour <strong>ajouter</strong> : <code>prix[\"Sucre\"] = 700</code>.<br>" +
    "Pour <strong>modifier</strong> : <code>prix[\"Riz\"] = 1600</code> — l'ancien prix est perdu, comme dans une boîte.</p>" +
    "<p>Et surtout : <strong>l'ordre n'a plus aucune importance</strong>. Ajoute un article au milieu, rien ne se décale. C'est toute la différence.</p>"
  ),

  // ── 3. Vérification ───────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: 'prix = {"Riz": 1500} — comment lire le prix du Riz ?',
          choices: ['prix("Riz")', 'prix["Riz"]', "prix.Riz"], answer: 1,
          explanation: "Des crochets, et la clé entre guillemets. Les parenthèses, c'est pour appeler une fonction." },
        { question: 'prix["Sucre"] = 700 sur un carnet qui n\'a pas de Sucre — que se passe-t-il ?',
          choices: ["Le Sucre est ajouté au carnet", "Une erreur rouge", "Rien du tout"], answer: 0,
          explanation: "La même ligne sert à ajouter et à modifier : si la clé n'existe pas, elle est créée." },
        { question: 'prix["Riz"] = 1600 sur un carnet où Riz valait 1500 — que vaut Riz ensuite ?',
          choices: ["1500 et 1600", "1600", "1500"], answer: 1,
          explanation: "Une clé ne garde qu'une valeur : la nouvelle écrase l'ancienne, comme dans une boîte." },
        { question: "Tu ajoutes un article au milieu du carnet. Les autres prix…",
          choices: ["se décalent d'un cran", "ne bougent pas", "sont effacés"], answer: 1,
          explanation: "C'est exactement ce que le dictionnaire répare : chaque valeur tient à sa clé, pas à sa position." },
      ],
    },
  },

  // ── 4. Remettre le programme dans l'ordre ─────────────────────────────
  jeu({
    game_type: "sort",
    title: "Créer, ajouter, lire",
    description: "Ce programme fabrique un carnet, l'agrandit, puis s'en sert.",
    hint: "On ne peut pas lire une clé qui n'a pas encore été ajoutée.",
    items: [
      'prix = {"Riz": 1500}',
      'prix["Huile"] = 2300',
      'prix["Savon"] = 800',
      'print(prix["Huile"])',
    ],
  }),

  // ── 5. Dérouler une ligne, morceau par morceau ────────────────────────
  jeu({
    game_type: "deviens_ordinateur",
    title: "Deviens l'ordinateur",
    description: "Chaque clé devient sa valeur, là où elle est écrite.",
    contexte: ['prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}'],
    ligne: 'print(prix["Riz"] + prix["Savon"])',
    etapes: [
      { expression: 'prix["Riz"]', choix: ["1500", "Riz", "800", "None"], valeur: "1500",
        explication: "La clé Riz devient sa valeur, 1500, à l'endroit même où elle est écrite." },
      { expression: 'prix["Savon"]', choix: ["800", "Savon", "2300"], valeur: "800",
        explication: "Pareil pour Savon : la clé disparaît, la valeur reste." },
      { expression: "1500 + 800", choix: ["2300", "1500800", "None"], valeur: "2300",
        explication: "Deux nombres : ça s'additionne. C'est 2300 que print reçoit." },
    ],
    sortie: "2300",
  }),

  // ── 6. Le piège de la séance ──────────────────────────────────────────
  texte(
    "<h3>La clé qui n'existe pas</h3>" +
    "<p>Demande une clé absente, et Python s'arrête net :</p>" +
    "<pre><code>prix[\"Pain\"]\n💥 KeyError: 'Pain'</code></pre>" +
    "<p>Ce n'est pas un bug silencieux : c'est du rouge, tout de suite. Le message donne même la clé fautive entre guillemets.</p>" +
    "<p>Pour poser la question <em>sans risquer le rouge</em>, il existe un autre geste :</p>" +
    "<pre><code>prix.get(\"Pain\")            → None\n" +
    "prix.get(\"Pain\", \"inconnu\")   → inconnu</code></pre>" +
    "<p><code>.get()</code> ne plante jamais. Sans deuxième argument il rend <strong>None</strong> — que tu connais depuis la semaine dernière. Avec un deuxième argument, il rend ce que tu veux à la place.</p>"
  ),

  // ── 7. Le piège en action ─────────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "Le carnet qui plante",
    context: "Le vendeur tape « Pain », un article que le carnet ne connaît pas. Le programme devient rouge : KeyError.",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 2,
    fix: '    print("Prix :", prix.get(article, "article inconnu"))',
    explanation: "Avec des crochets, une clé absente arrête tout. Avec .get() et une réponse de secours, le programme continue et dit poliment qu'il ne connaît pas l'article.",
    instructions: [
      'prix = {"Riz": 1500, "Huile": 2300}',
      'article = input("Quel article ? ")',
      '    print("Prix :", prix[article])',
    ],
  }),

  // ── 8. On le fait soi-même ────────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le carnet ne connait pas le Pain. Ton programme doit l'annoncer sans devenir rouge :\n" +
        "affiche le prix du Riz, puis celui du Pain — et pour le Pain, affiche le mot inconnu.",
      starter_code:
        'prix = {"Riz": 1500, "Huile": 2300}\n\n' +
        "# Le Riz, puis le Pain. Le Pain n'est pas dans le carnet : utilise .get()\n",
      hidden_tests:
        'import re\n' +
        'assert ".get(" in code, "Pour une cle qui peut manquer, on utilise .get() — les crochets feraient planter le programme."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "1500" in nombres, "Le prix du Riz est 1500."\n' +
        'assert "inconnu" in output.lower(), "Pour le Pain, ton programme doit afficher le mot inconnu au lieu de planter."',
    },
  },

  // ── 9. Parcourir tout le carnet ───────────────────────────────────────
  texte(
    "<h3>Passer tout le carnet en revue</h3>" +
    "<p>Une boucle sur un dictionnaire parcourt ses <strong>clés</strong>, une par une :</p>" +
    "<pre><code>for nom in prix:\n" +
    "    print(nom, \"coûte\", prix[nom], \"F\")</code></pre>" +
    "<p>À chaque tour, <code>nom</code> prend une étiquette, et <code>prix[nom]</code> va chercher ce qu'il y a dessous. C'est la même boucle que sur une liste — sauf qu'ici tu as les deux à la fois : l'étiquette <em>et</em> la valeur.</p>" +
    "<p>Et <code>len(prix)</code> te dit combien d'articles contient le carnet.</p>"
  ),

  // ── 10. Le défi du parcours ───────────────────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Affiche chaque article du carnet avec son prix, une ligne par article, puis le total des trois prix sur une derniere ligne contenant le mot Total.",
      starter_code:
        'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
        "# Une boucle pour lister, un accumulateur pour le total.\n",
      hidden_tests:
        'import re\n' +
        'assert "for" in code, "Il faut une boucle : une ligne d affichage ecrite une seule fois."\n' +
        'assert code.count("print(") <= 3, "Trois print recopies, ce n est pas une boucle."\n' +
        'for mot in ["Riz", "Huile", "Savon"]:\n' +
        '    assert mot in output, "Il manque " + mot + " dans ta liste."\n' +
        // Verifier les noms ne suffit pas : un programme qui liste les cles sans
        // aller chercher les valeurs passait le test.
        'for p in ["1500", "2300", "800"]:\n' +
        '    assert p in output, "Il manque le prix " + p + " : la cle seule ne suffit pas, il faut aller chercher sa valeur."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        `assert "${TOTAL}" in nombres, "1500 + 2300 + 800 font ${TOTAL}. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n` +
        'assert "Total" in output or "total" in output, "La derniere ligne doit contenir le mot Total."',
    },
  },

  // ── 11. La boucle mal comprise ────────────────────────────────────────
  jeu({
    game_type: "bug_hunt",
    title: "La boucle qui affiche des étiquettes",
    context: "Le programme devait afficher « Riz coûte 1500 ». Il affiche « Riz coûte Riz ».",
    description: "Une seule ligne est fausse — clique dessus.",
    bug_index: 2,
    fix: '    print(nom, "coûte", prix[nom])',
    explanation: "Dans la boucle, nom est l'étiquette — pas la valeur. Pour obtenir le prix, il faut aller le chercher sous l'étiquette : prix[nom].",
    instructions: [
      'prix = {"Riz": 1500, "Huile": 2300}',
      "for nom in prix:",
      '    print(nom, "coûte", nom)',
    ],
  }),

  // ── 12. Consolidation ─────────────────────────────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: 'prix["Pain"] sur un carnet sans Pain — que se passe-t-il ?',
          choices: ["Le programme rend None", "Le programme devient rouge : KeyError", "Le Pain est créé"], answer: 1,
          explanation: "Les crochets exigent que la clé existe. C'est .get() qui accepte l'absence." },
        { question: 'prix.get("Pain", "inconnu") sur le même carnet — que rend cet appel ?',
          choices: ["inconnu", "None", "KeyError"], answer: 0,
          explanation: "Le deuxième argument est la réponse de secours : elle sert quand la clé manque." },
        { question: "for nom in prix — que prend la variable nom à chaque tour ?",
          choices: ["la valeur", "la clé", "les deux à la fois"], answer: 1,
          explanation: "Une boucle sur un dictionnaire parcourt ses clés. La valeur se demande avec prix[nom]." },
        { question: "Tu veux retrouver le prix d'un article par son nom. Liste ou dictionnaire ?",
          choices: ["une liste", "un dictionnaire", "les deux marchent pareil"], answer: 1,
          explanation: "La question qu'on pose décide de l'outil : « par son nom » appelle un dictionnaire." },
      ],
    },
  },

  // ── 13. Liste ou dictionnaire ? ───────────────────────────────────────
  texte(
    "<h3>Liste ou dictionnaire — la question décide</h3>" +
    "<p>Ce n'est pas une affaire de goût. Regarde la question que tu poses à tes données :</p>" +
    "<pre><code>« Combien d'articles ? »              → une liste suffit\n" +
    "« Donne-les-moi tous, dans l'ordre »  → une liste\n" +
    "« Combien coûte le Savon ? »          → un dictionnaire\n" +
    "« Le Pain est-il au catalogue ? »     → un dictionnaire</code></pre>" +
    "<p>Dès que tu cherches <strong>par un nom</strong>, la liste t'oblige à compter des positions — et c'est là que tout se décale. Le dictionnaire, lui, ne compte rien.</p>"
  ),

  // ── 14. Le défi final : le carnet en petit ────────────────────────────
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Le carnet du marche, en trois gestes. Ecris trois fonctions qui RENDENT leur resultat :\n" +
        "ajouter(carnet, nom, montant) — range le prix et rend le carnet\n" +
        "chercher(carnet, nom) — rend le prix, ou le mot inconnu si l'article n'y est pas\n" +
        "combien(carnet) — rend le nombre d'articles\n" +
        "Ensuite, sers-t'en : ajoute le Sucre a 700, cherche le Sucre, cherche le Pain, et affiche le nombre d'articles.",
      starter_code:
        'carnet = {"Riz": 1500, "Huile": 2300}\n\n' +
        "# Trois fonctions a ecrire : ajouter, chercher, combien.\n" +
        "# Chacune recoit le carnet, et RENDS son resultat.\n",
      hidden_tests:
        'import re\n' +
        'compact = code.replace(" ", "")\n' +
        'assert "defajouter(" in compact, "Ecris la fonction ajouter."\n' +
        'assert "defchercher(" in compact, "Ecris la fonction chercher."\n' +
        'assert "defcombien(" in compact, "Ecris la fonction combien."\n' +
        'assert code.count("return") >= 3, "Les trois fonctions doivent RENDRE leur resultat, pas l afficher."\n' +
        'assert ".get(" in code, "chercher doit supporter un article absent : .get() avec une reponse de secours."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "700" in nombres, "Le Sucre coute 700 : ton programme doit le retrouver."\n' +
        'assert "inconnu" in output.lower(), "Le Pain n est pas au carnet : chercher doit rendre inconnu."\n' +
        'assert "3" in nombres, "Apres l ajout du Sucre, le carnet compte 3 articles."',
    },
  },

  // ── 15. Les mots de la séance ─────────────────────────────────────────
  jeu({
    game_type: "memory",
    title: "Les mots de la séance",
    description: "Retourne les cartes et retrouve les paires.",
    pairs: [
      { left: "La clé", right: "L'étiquette du carnet" },
      { left: 'prix["Sucre"] = 700', right: "Ajoute ou modifie" },
      { left: "KeyError", right: "La clé n'existe pas" },
      { left: ".get(nom, \"inconnu\")", right: "Demander sans planter" },
      { left: "for nom in prix", right: "Parcourt les clés" },
    ],
  }),

  // ── 16. Ce que tu sais faire, et le mur suivant ───────────────────────
  texte(
    "<h3>Ce que tu sais faire maintenant</h3>" +
    "<p>Attacher une valeur à un nom, la retrouver par ce nom, ajouter, modifier, parcourir tout le carnet — et poser une question sans risquer le rouge, grâce à <code>.get()</code>.</p>" +
    "<p>Tu sais aussi choisir : dès que la question commence par « lequel » ou « combien coûte le… », c'est un dictionnaire qu'il te faut.</p>" +
    "<h3>La semaine prochaine</h3>" +
    "<p>Tu as tout ce qu'il faut pour un vrai programme. La prochaine séance n'apporte aucun outil nouveau : elle te demande d'en faire quelque chose qui tienne debout — <strong>un carnet de contacts</strong> où l'on ajoute, où l'on cherche, et qui ne plante jamais, même quand on lui demande quelqu'un qu'il ne connaît pas.</p>" +
    "<p>Ce sera ton premier jalon.</p>"
  ),
];

// ── Le banc : bonnes et mauvaises solutions des quatre défis de code ─────
const SOLUTIONS = {
  1: { cas: [
    { nom: "juste", attendu: "ok", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nprint(prix["Huile"])\nprix["Sucre"] = 700\nprint(prix["Sucre"])\n' },
    { nom: "oublie le sucre", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nprint(prix["Huile"])\n' },
    { nom: "affiche tout le carnet", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nprint(prix)\n' },
  ] },
  8: { cas: [
    { nom: "juste", attendu: "ok", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix.get("Pain", "inconnu"))\n' },
    { nom: "crochets sur le Pain", attendu: "plante", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix["Pain"])\n' },
    { nom: "get sans reponse de secours", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix.get("Pain"))\n' },
  ] },
  10: { cas: [
    { nom: "juste", attendu: "ok", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\ntotal = 0\nfor nom in prix:\n    print(nom, "coute", prix[nom])\n    total = total + prix[nom]\nprint("Total :", total)\n' },
    { nom: "affiche les cles sans les prix", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nfor nom in prix:\n    print(nom)\nprint("Total :", 4600)\n' },
    { nom: "trois print recopies", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nprint("Riz", 1500)\nprint("Huile", 2300)\nprint("Savon", 800)\nprint("Total :", 4600)\n' },
    { nom: "oublie le total", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300, "Savon": 800}\nfor nom in prix:\n    print(nom, "coute", prix[nom])\n' },
  ] },
  14: { cas: [
    { nom: "juste", attendu: "ok", code:
      'carnet = {"Riz": 1500, "Huile": 2300}\n\n' +
      "def ajouter(carnet, nom, montant):\n    carnet[nom] = montant\n    return carnet\n\n" +
      'def chercher(carnet, nom):\n    return carnet.get(nom, "inconnu")\n\n' +
      "def combien(carnet):\n    return len(carnet)\n\n" +
      'carnet = ajouter(carnet, "Sucre", 700)\nprint(chercher(carnet, "Sucre"))\nprint(chercher(carnet, "Pain"))\nprint("Articles :", combien(carnet))\n' },
    { nom: "chercher plante sur l absent", attendu: "plante", code:
      'carnet = {"Riz": 1500, "Huile": 2300}\n\n' +
      "def ajouter(carnet, nom, montant):\n    carnet[nom] = montant\n    return carnet\n\n" +
      "def chercher(carnet, nom):\n    return carnet[nom]\n\n" +
      "def combien(carnet):\n    return len(carnet)\n\n" +
      'carnet = ajouter(carnet, "Sucre", 700)\nprint(chercher(carnet, "Sucre"))\nprint(chercher(carnet, "Pain"))\nprint("Articles :", combien(carnet))\n' },
    { nom: "affiche au lieu de rendre", attendu: "test raté", code:
      'carnet = {"Riz": 1500, "Huile": 2300}\n\n' +
      "def ajouter(carnet, nom, montant):\n    carnet[nom] = montant\n\n" +
      'def chercher(carnet, nom):\n    print(carnet.get(nom, "inconnu"))\n\n' +
      "def combien(carnet):\n    print(len(carnet))\n\n" +
      'ajouter(carnet, "Sucre", 700)\nchercher(carnet, "Sucre")\nchercher(carnet, "Pain")\ncombien(carnet)\n' },
  ] },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0;
const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };

// Ce que le parcours n'a jamais enseigné n'a pas sa place ici.
const INTERDITS = [/\bwhile\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\blambda\b/, /\[\s*\d+\s*\]/, /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/];
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
    const rangs = c.questions.map((q) => q.answer);
    if (new Set(rangs).size === 1) mauvais(`bloc ${i} : toutes les bonnes réponses au même rang — le moteur ne mélange pas`);
    for (const q of c.questions) {
      if (!q.choices[q.answer]) mauvais(`bloc ${i} : question sans bonne réponse`);
      if (new Set(q.choices).size !== q.choices.length) mauvais(`bloc ${i} : deux choix identiques`);
      if (!q.explanation) mauvais(`bloc ${i} : question sans explication`);
    }
  }
  if (c.game_type === "bug_hunt") {
    if (!c.instructions?.[c.bug_index]) mauvais(`bloc ${i} : bug_index hors des lignes`);
    else if (c.instructions[c.bug_index] === c.fix) mauvais(`bloc ${i} : la réparation répète la ligne fautive`);
  }
  if (c.game_type === "sort" && (!c.items || c.items.length < 3 || !c.hint)) mauvais(`bloc ${i} : tri d'ordre incomplet`);
  if (c.game_type === "memory") {
    const g1 = c.pairs.map((p) => p.left), d1 = c.pairs.map((p) => p.right);
    if (new Set(g1).size !== g1.length || new Set(d1).size !== d1.length) mauvais(`bloc ${i} : paires en double`);
  }
  if (c.game_type === "deviens_ordinateur") {
    let ligne = c.ligne;
    c.etapes.forEach((et, k) => {
      if (!et.choix.includes(et.valeur)) mauvais(`bloc ${i} étape ${k + 1} : valeur absente des pastilles`);
      if (ligne.indexOf(et.expression) === -1) { mauvais(`bloc ${i} étape ${k + 1} : « ${et.expression} » introuvable`); return; }
      ligne = ligne.replace(et.expression, et.valeur);
    });
    const m = /^print\((.*)\)$/.exec(ligne);
    const rendu = m ? m[1].replace(/^"(.*)"$/, "$1") : null;
    if (rendu !== String(c.sortie)) mauvais(`bloc ${i} : la ligne finit sur ${ligne}, sortie annoncée « ${c.sortie} »`);
  }
});

if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${BLOCS.length} blocs · ${BLOCS.filter((b) => b.type === "code_challenge").length} défis de code · ${BLOCS.filter((b) => b.type === "quiz").length} quiz · ${BLOCS.filter((b) => b.type === "game").length} jeux`);
dire(`✓ vocabulaire, amorces, quiz, jeux et substitutions : vérifiés (total du carnet : ${TOTAL})`);

if (process.argv.includes("--banc")) {
  const exos = Object.entries(SOLUTIONS).map(([i, s]) => ({ palier: 1, title: `bloc ${i}`, blocs: [BLOCS[Number(i)]] }));
  const sols = Object.fromEntries(Object.entries(SOLUTIONS).map(([i, s]) => [`bloc ${i}`, s]));
  console.log(JSON.stringify(banc(exos, sols)));
  process.exit(0);
}

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("lesson_blocks", "id", (q) => q.eq("lesson_id", L.id));
if (deja.length && !process.argv.includes("--refaire"))
  throw new Error(`${deja.length} bloc(s) existent déjà — --refaire pour les remplacer`);

const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs sur « ${L.title} »\n`);
BLOCS.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(20)} ${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 52))}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const { error } = await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
  if (error) throw new Error(`suppression : ${error.message}`);
  console.log(`  ⟲ ${deja.length} blocs remplacés`);
}
const { error } = await db.from("lesson_blocks").insert(
  // `lesson_blocks` porte aussi le thème : la colonne est obligatoire.
  BLOCS.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (error) throw new Error(error.message);

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = (await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id))).sort((a, b) => a.order_index - b.order_index);
ok(ap.length === BLOCS.length, `${BLOCS.length} blocs écrits (trouvé ${ap.length})`);
ok(ap.every((b, i) => b.order_index === i), "numérotation contiguë");
ok(ap.every((b) => b.content && Object.keys(b.content).length), "aucun bloc vide");
ok(ap.filter((b) => b.type === "code_challenge").every((b) => b.content.hidden_tests), "chaque défi garde ses tests");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
