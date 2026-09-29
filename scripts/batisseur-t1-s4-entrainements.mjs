/**
 * Les cinq entraînements de « Les dictionnaires ».
 *
 *     node scripts/batisseur-t1-s4-entrainements.mjs [--ecrire] [--refaire] [--banc]
 *
 * Un entraînement par objectif, et le piège central — la clé qui n'existe pas —
 * a le sien. Le dernier prépare le jalon : un carnet qu'on interroge sans
 * jamais le faire planter.
 *
 *   0. Nom ou position ?        obj. 4 — choisir l'outil selon la question
 *   1. La clé qui manque        obj. 3 — KeyError, puis .get()
 *   2. 🎹 Le carnet du griot    obj. 1 — retrouver par le nom, en musique
 *   3. Le carnet qui grandit    obj. 2 — ajouter, modifier, parcourir
 *   4. Trois questions, un seul carnet   le mur suivant : le jalon
 */
import { base, lecteur, kodi, jeu, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Les dictionnaires";

// Garde-fous arithmétiques.
const STOCK = { Riz: 12, Huile: 5, Savon: 20 };
const TOTAL_STOCK = Object.values(STOCK).reduce((a, b) => a + b, 0);
if (TOTAL_STOCK !== 37) throw new Error(`stock total ${TOTAL_STOCK}, attendu 37`);

const EXOS = [
  {
    title: "Nom ou position ?",
    description: "Douze questions. Chacune appelle un outil, et un seul.",
    xp_reward: 30,
    blocs: [
      kodi("<p>Ce n'est pas une affaire de goût : c'est la <strong>question posée</strong> qui décide de l'outil.</p><p>« Donne-moi le troisième » appelle une liste. « Combien coûte le savon » appelle un dictionnaire.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "Liste, ou dictionnaire ?",
          instruction: "Pour répondre à cette question, il te faut quoi ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "La question parle d'un ORDRE ou d'un NOMBRE → une liste suffit.",
              "La question cherche par un NOM → un dictionnaire.",
              "« Le premier », « tous », « combien y en a-t-il » → liste.",
              "« Celui qui s'appelle… », « combien coûte… » → dictionnaire.",
            ],
          },
          categories: [
            { id: "liste", label: "Une liste", emoji: "📋", color: "#FDB813" },
            { id: "dico",  label: "Un dictionnaire", emoji: "📒", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Combien coûte le savon ?",                     correct: "dico",  hint: "On cherche par le nom de l'article : c'est une clé." },
            { id: "b", emoji: "2️⃣", label: "Combien d'articles y a-t-il en tout ?",         correct: "liste", hint: "Un simple compte : pas besoin d'étiquettes." },
            { id: "c", emoji: "3️⃣", label: "Quel est le prix du téléphone d'Ama ?",         correct: "dico",  hint: "Par le nom, encore. Ama est la clé." },
            { id: "d", emoji: "4️⃣", label: "Donne-moi tous les prénoms de la classe",       correct: "liste", hint: "On veut tout, dans l'ordre : une liste fait ça très bien." },
            { id: "e", emoji: "5️⃣", label: "Le Pain est-il au catalogue ?",                 correct: "dico",  hint: "On demande si une clé existe." },
            { id: "f", emoji: "6️⃣", label: "Quelle est la plus grande note de la classe ?", correct: "liste", hint: "On parcourt des valeurs pour en comparer : une liste suffit." },
            { id: "g", emoji: "7️⃣", label: "Quel est le numéro de téléphone de Kofi ?",     correct: "dico",  hint: "Le nom mène au numéro : clé et valeur." },
            { id: "h", emoji: "8️⃣", label: "Affiche les cinq derniers scores du jeu",       correct: "liste", hint: "Un ordre, encore : le dernier vient après l'avant-dernier." },
            { id: "i", emoji: "9️⃣", label: "Combien de jours de pluie en septembre ?",      correct: "liste", hint: "On compte : aucune étiquette n'est nécessaire." },
            { id: "j", emoji: "🔟", label: "Combien pèse le sac de Michael ?",              correct: "dico",  hint: "Par le nom du propriétaire." },
            { id: "k", emoji: "🅰️", label: "Quelle matière Samuel préfère-t-il ?",           correct: "dico",  hint: "Samuel est la clé, sa matière est la valeur." },
            { id: "l", emoji: "🅱️", label: "Range les prix du plus petit au plus grand",     correct: "liste", hint: "Ranger, c'est une affaire d'ordre : la liste." },
          ],
        },
      },
    ],
  },

  {
    title: "La clé qui manque",
    description: "Le rouge arrive d'un coup. Et le geste qui l'évite.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Demander une clé qui n'existe pas arrête le programme net : <code>KeyError</code>.</p><p>Ce n'est pas un bug silencieux — c'est du rouge tout de suite. Reste à savoir <strong>quand</strong> il faut se protéger.</p>"),
      jeu({
        game_type: "bug_hunt",
        title: "Le vendeur qui tape n'importe quoi",
        context: "Le carnet connaît le Riz et l'Huile. Le vendeur tape « Pain » : le programme devient rouge au lieu de répondre poliment.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: '    print(prix.get(article, "article inconnu"))',
        explanation: "Les crochets exigent que la clé existe. .get() accepte l'absence et rend la réponse de secours qu'on lui donne.",
        instructions: [
          'prix = {"Riz": 1500, "Huile": 2300}',
          'article = input("Quel article ? ")',
          "    print(prix[article])",
        ],
      }),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Le carnet ne connait ni le Pain ni le Lait. Affiche le prix du Riz, puis celui du Pain, puis celui du Lait — sans que le programme devienne rouge. Pour un article inconnu, affiche le mot inconnu.",
          starter_code: 'prix = {"Riz": 1500, "Huile": 2300}\n\n# Trois demandes, aucune ligne rouge.\n',
          hidden_tests:
            'import re\n' +
            'assert code.count(".get(") >= 2, "Les deux articles absents doivent passer par .get()."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "1500" in nombres, "Le prix du Riz est 1500."\n' +
            'assert output.lower().count("inconnu") >= 2, "Le Pain ET le Lait sont inconnus : deux fois le mot inconnu."',
        },
      },
    ],
  },

  {
    title: "🎹 Le carnet du griot",
    description: "Chaque mot du griot a sa note. Retrouve-les par leur nom.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Le griot a noté ses sons dans un carnet : chaque <strong>nom</strong> mène à une <strong>note</strong>.</p><p>Tu n'as plus à te souvenir de l'ordre — tu demandes par le nom, et tu joues.</p>"),
      jeu({
        game_type: "python_piano",
        title: "Le carnet du griot",
        instructions:
          "Le carnet des sons est ecrit. Joue la phrase : appel, reponse, appel, reponse, final — en allant chercher chaque note par son nom dans le carnet. Douze notes au minimum.",
        min_notes: 12,
        tempo: 380,
        starter_code:
          'sons = {"appel": "Do", "reponse": "Mi", "final": "Sol"}\n\n' +
          'jouer(sons["appel"])\n\n' +
          "# A toi : la suite de la phrase, en demandant chaque note par son nom.\n",
      }),
    ],
  },

  {
    title: "Le carnet qui grandit",
    description: "Ajouter, corriger, et tout relire — sans se tromper d'un cran.",
    xp_reward: 40,
    blocs: [
      kodi("<p>Un carnet vit : on y ajoute, on y corrige, on le relit en entier.</p><p>Et contrairement à deux listes côte à côte, rien ne se décale jamais.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Le stock du magasin. Ajoute le Sucre avec 8 sacs, corrige l'Huile qui passe a 9, puis affiche chaque article avec son stock, une ligne par article, et pour finir le nombre total de sacs, avec le mot Total.",
          starter_code:
            'stock = {"Riz": 12, "Huile": 5, "Savon": 20}\n\n' +
            "# Ajoute, corrige, puis parcours le carnet.\n",
          hidden_tests:
            'import re\n' +
            'assert "for" in code, "Il faut une boucle pour lister : une seule ligne d affichage."\n' +
            'assert code.count("print(") <= 3, "Quatre print recopies, ce n est pas une boucle."\n' +
            'for mot in ["Riz", "Huile", "Savon", "Sucre"]:\n' +
            '    assert mot in output, "Il manque " + mot + " dans ta liste."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "9" in nombres, "L Huile a ete corrigee a 9 : c est 9 qui doit s afficher."\n' +
            'assert "5" not in nombres, "L ancien stock de l Huile (5) ne doit plus apparaitre : une cle ne garde qu une valeur."\n' +
            'assert "49" in nombres, "12 + 9 + 20 + 8 font 49. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n' +
            'assert "Total" in output or "total" in output, "La derniere ligne doit contenir le mot Total."',
        },
      },
    ],
  },

  {
    title: "Trois questions, un seul carnet",
    description: "Trois fonctions qui répondent — la répétition générale du jalon.",
    xp_reward: 50,
    blocs: [
      kodi("<p>Un vrai programme ne mélange pas tout : chaque question a sa fonction, et chaque fonction <strong>rend</strong> sa réponse.</p><p>C'est exactement ce que le jalon de la semaine prochaine te demandera. Autant s'y faire la main maintenant.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Ecris trois fonctions qui RENDENT leur resultat :\n" +
            "prix_de(carnet, nom) — le prix, ou le mot inconnu si l'article n'y est pas\n" +
            "le_plus_cher(carnet) — le NOM de l'article le plus cher\n" +
            "combien(carnet) — le nombre d'articles\n" +
            "Puis affiche : le prix du Savon, le prix du Pain, le nom du plus cher, et le nombre d'articles.",
          starter_code:
            'carnet = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
            "# Trois fonctions, trois return. Ensuite seulement, les quatre affichages.\n",
          hidden_tests:
            'import re\n' +
            'compact = code.replace(" ", "")\n' +
            'assert "defprix_de(" in compact, "Ecris la fonction prix_de."\n' +
            'assert "defle_plus_cher(" in compact, "Ecris la fonction le_plus_cher."\n' +
            'assert "defcombien(" in compact, "Ecris la fonction combien."\n' +
            'assert code.count("return") >= 3, "Les trois fonctions doivent RENDRE leur resultat, pas l afficher."\n' +
            'assert ".get(" in code, "prix_de doit supporter un article absent : .get()."\n' +
            'assert "for" in code, "le_plus_cher doit parcourir le carnet pour comparer."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "800" in nombres, "Le Savon coute 800."\n' +
            'assert "inconnu" in output.lower(), "Le Pain n est pas au carnet : prix_de doit rendre inconnu."\n' +
            'assert "Huile" in output, "Le plus cher est l Huile, a 2300."\n' +
            'assert "3" in nombres, "Le carnet compte 3 articles."',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "La clé qui manque": { cas: [
    { nom: "juste", attendu: "ok", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix.get("Pain", "inconnu"))\nprint(prix.get("Lait", "inconnu"))\n' },
    { nom: "un seul get", attendu: "test raté", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix.get("Pain", "inconnu"))\n' },
    { nom: "crochets partout", attendu: "plante", code: 'prix = {"Riz": 1500, "Huile": 2300}\nprint(prix["Riz"])\nprint(prix["Pain"])\n' },
  ] },
  "Le carnet qui grandit": { cas: [
    { nom: "juste", attendu: "ok", code:
      'stock = {"Riz": 12, "Huile": 5, "Savon": 20}\nstock["Sucre"] = 8\nstock["Huile"] = 9\ntotal = 0\nfor nom in stock:\n    print(nom, ":", stock[nom])\n    total = total + stock[nom]\nprint("Total :", total)\n' },
    { nom: "oublie la correction", attendu: "test raté", code:
      'stock = {"Riz": 12, "Huile": 5, "Savon": 20}\nstock["Sucre"] = 8\ntotal = 0\nfor nom in stock:\n    print(nom, ":", stock[nom])\n    total = total + stock[nom]\nprint("Total :", total)\n' },
    { nom: "liste les cles sans les valeurs", attendu: "test raté", code:
      'stock = {"Riz": 12, "Huile": 5, "Savon": 20}\nstock["Sucre"] = 8\nstock["Huile"] = 9\nfor nom in stock:\n    print(nom)\nprint("Total :", 49)\n' },
  ] },
  "Trois questions, un seul carnet": { cas: [
    { nom: "juste", attendu: "ok", code:
      'carnet = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
      'def prix_de(carnet, nom):\n    return carnet.get(nom, "inconnu")\n\n' +
      "def le_plus_cher(carnet):\n    gagnant = \"\"\n    record = 0\n    for nom in carnet:\n        if carnet[nom] > record:\n            record = carnet[nom]\n            gagnant = nom\n    return gagnant\n\n" +
      "def combien(carnet):\n    return len(carnet)\n\n" +
      'print(prix_de(carnet, "Savon"))\nprint(prix_de(carnet, "Pain"))\nprint(le_plus_cher(carnet))\nprint("Articles :", combien(carnet))\n' },
    { nom: "prix_de plante sur l absent", attendu: "plante", code:
      'carnet = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
      "def prix_de(carnet, nom):\n    return carnet[nom]\n\n" +
      "def le_plus_cher(carnet):\n    gagnant = \"\"\n    record = 0\n    for nom in carnet:\n        if carnet[nom] > record:\n            record = carnet[nom]\n            gagnant = nom\n    return gagnant\n\n" +
      "def combien(carnet):\n    return len(carnet)\n\n" +
      'print(prix_de(carnet, "Savon"))\nprint(prix_de(carnet, "Pain"))\nprint(le_plus_cher(carnet))\nprint("Articles :", combien(carnet))\n' },
    { nom: "le plus cher rend le prix au lieu du nom", attendu: "test raté", code:
      'carnet = {"Riz": 1500, "Huile": 2300, "Savon": 800}\n\n' +
      'def prix_de(carnet, nom):\n    return carnet.get(nom, "inconnu")\n\n' +
      "def le_plus_cher(carnet):\n    record = 0\n    for nom in carnet:\n        if carnet[nom] > record:\n            record = carnet[nom]\n    return record\n\n" +
      "def combien(carnet):\n    return len(carnet)\n\n" +
      'print(prix_de(carnet, "Savon"))\nprint(prix_de(carnet, "Pain"))\nprint(le_plus_cher(carnet))\nprint("Articles :", combien(carnet))\n' },
  ] },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bwhile\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\[\s*\d+\s*\]/, /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/];
for (const e of EXOS) {
  for (const b of e.blocs) {
    const visible = JSON.stringify({ ...b.content, hidden_tests: undefined });
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — jamais enseigné`);
    const c = b.content ?? {};
    for (const it of c.items ?? []) {
      if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
      if (!(c.categories ?? []).some((x) => x.id === it.correct)) mauvais(`${e.title} : « ${it.label} » vise un bac inexistant`);
    }
    if (c.helper && (!c.helper.title || !Array.isArray(c.helper.criteria))) mauvais(`${e.title} : helper mal formé`);
    if (c.game_type === "bug_hunt" && (!c.instructions?.[c.bug_index] || c.instructions[c.bug_index] === c.fix))
      mauvais(`${e.title} : chasse au bug incohérente`);
    if (b.type === "code_challenge" && /:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? ""))
      mauvais(`${e.title} : l'amorce finit sur un bloc vide`);
  }
}
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${EXOS.length} entraînements · stock corrigé : 12 + 9 + 20 + 8 = 49`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("trainings", "id,libre_service", (q) => q.eq("lesson_id", L.id).eq("libre_service", false));
if (deja.length && !process.argv.includes("--refaire"))
  throw new Error(`${deja.length} entraînement(s) existent déjà — --refaire pour les remplacer`);

const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${EXOS.length} entraînements sur « ${L.title} »\n`);
EXOS.forEach((e, i) => console.log(`  [${i}] ${e.title.padEnd(34)} ${e.blocs.map((b) => b.content.game_type ?? b.type).join(", ")}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) {
  const joues = await g("training_progress", "id", (q) => q.in("training_id", deja.map((t) => t.id)));
  if (joues.length) throw new Error(`${joues.length} progression(s) d'élève — --refaire refusé`);
  await db.from("trainings").delete().in("id", deja.map((t) => t.id));
}
for (const [i, e] of EXOS.entries()) {
  const { data, error } = await db.from("trainings").insert({
    lesson_id: L.id, title: e.title, description: e.description, xp_reward: e.xp_reward, order_index: i,
  }).select("id").single();
  if (error) throw new Error(`${e.title} : ${error.message}`);
  const { error: eb } = await db.from("training_blocks").insert(
    e.blocs.map((b, j) => ({ training_id: data.id, type: b.type, content: b.content, order_index: j })),
  );
  if (eb) throw new Error(`${e.title} (blocs) : ${eb.message}`);
  console.log(`  ✓ [${i}] ${e.title}`);
}
console.log("\n✅ ÉCRIT");
