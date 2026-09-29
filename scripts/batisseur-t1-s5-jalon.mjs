/**
 * Bâtisseur — thème 1, séance 5 : « 🏆 Jalon 1 — Le carnet de contacts ».
 *
 *     node scripts/batisseur-t1-s5-jalon.mjs [--ecrire] [--refaire] [--banc]
 *
 * Ce n'est pas un cours : c'est un projet, et il se présente DEVANT UN PARENT.
 * Tout est écrit pour ce moment-là — y compris le script de la démonstration,
 * parce qu'un enfant de treize ans devant son père ne sait pas quoi dire.
 *
 * Le carnet s'affiche sur un téléphone (moteur `telephone`). Règle qui tient
 * tout : le téléphone est un CADRE, pas un programme. Il ne met rien en forme
 * tout seul — l'enfant appelle `ecran.titre`, `ecran.contact`, `ecran.message`
 * avec ce que ses propres fonctions lui rendent. C'est l'illustration physique
 * de l'objectif du jalon : les fonctions RENDENT, le téléphone AFFICHE.
 *
 * Les quatre objectifs sont les quatre critères de réussite, et ils sont
 * affichés à l'enfant dès le deuxième bloc : on ne cache pas la grille.
 */
import { base, lecteur, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "🏆 Jalon 1 — Le carnet de contacts";

const texte = (html) => ({ type: "text", content: { html } });
const jeu = (content) => ({ type: "game", content });

const DEPART =
  'carnet = {"Ama": "90 12 34 56", "Kofi": "91 22 33 44"}\n';

const BLOCS = [
  // ── 0. Ce que c'est ───────────────────────────────────────────────────
  texte(
    "<h3>Ton premier jalon</h3>" +
    "<p>Depuis cinq semaines tu apprends des outils. Aujourd'hui, tu fabriques quelque chose avec — et tu le <strong>montres</strong>.</p>" +
    "<p>Un carnet de contacts : on y ajoute quelqu'un, on cherche un numéro, on liste tout le monde. Il s'affichera sur un téléphone, à l'écran.</p>" +
    "<p>Aucun outil nouveau aujourd'hui. Tout ce dont tu as besoin, tu l'as déjà : les dictionnaires, les fonctions qui rendent, <code>.get()</code>, et la boucle.</p>"
  ),

  // ── 1. La grille, montrée d'avance ────────────────────────────────────
  texte(
    "<h3>Ce qui compte pour réussir</h3>" +
    "<p>Quatre choses, et tu les connais avant de commencer. Un jalon n'est pas une surprise.</p>" +
    "<pre><code>1. Ajouter, chercher et lister marchent tous les trois\n" +
    "2. Chercher quelqu'un d'inconnu ne fait PAS planter le carnet\n" +
    "3. Lister un carnet vide dit qu'il est vide — pas une erreur\n" +
    "4. Chaque opération est une fonction qui REND, pas qui affiche</code></pre>" +
    "<p>Le quatrième est le plus important, et c'est celui qu'on oublie le plus. Une fonction qui <code>print</code> ne sert qu'une fois : à l'écran. Une fonction qui <code>return</code> sert partout — y compris à remplir un téléphone.</p>"
  ),

  // ── 2. Allumer l'écran : petit, et réussi tout de suite ───────────────
  texte(
    "<h3>D'abord, allume l'écran</h3>" +
    "<p>Trois mots suffisent à parler au téléphone :</p>" +
    "<pre><code>ecran.titre(\"Le carnet de Samuel\")\n" +
    "ecran.contact(\"Ama\", \"90 12 34 56\")\n" +
    "ecran.message(\"Contact inconnu\")</code></pre>" +
    "<p>Le téléphone ne décide de rien : il dessine ce que tu lui donnes. Mets ton prénom dans le titre, et fais apparaître les deux contacts du carnet de départ.</p>"
  ),
  jeu({
    game_type: "telephone",
    title: "Allume ton carnet",
    instructions:
      "Mets TON prenom dans le titre, puis affiche les deux contacts du carnet.\nUne boucle suffit — n'ecris pas les contacts un par un.",
    min_contacts: 2,
    starter_code: DEPART + '\necran.titre("Le carnet de ...")\n\n# A toi : une boucle qui affiche chaque contact.\n',
  }),

  // ── 3-4. Ajouter ──────────────────────────────────────────────────────
  texte(
    "<h3>Ajouter — et rendre le carnet</h3>" +
    "<p>La fonction reçoit le carnet, y range le nouveau contact, et <strong>rend le carnet</strong>. Elle n'affiche rien.</p>" +
    "<p>Pourquoi rendre le carnet plutôt que de l'afficher ? Parce que la suite du programme en a besoin : pour le lister, pour y chercher, pour le montrer sur le téléphone.</p>"
  ),
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ecris ajouter(carnet, nom, numero) : elle range le contact et REND le carnet.\n" +
        "Sers-t'en pour ajouter Michael au 92 33 44 55, puis affiche le nombre de contacts.",
      starter_code: DEPART + "\n# ajouter(carnet, nom, numero) doit rendre le carnet.\n",
      hidden_tests:
        'import re\n' +
        'compact = code.replace(" ", "")\n' +
        'assert "defajouter(" in compact, "Ecris la fonction ajouter(carnet, nom, numero)."\n' +
        'assert "return" in code, "ajouter doit RENDRE le carnet, pas l afficher."\n' +
        'nombres = re.findall(r"\\d+", output)\n' +
        'assert "3" in nombres, "Apres l ajout de Michael, le carnet compte 3 contacts."',
    },
  },

  // ── 5-6. Chercher sans planter ────────────────────────────────────────
  texte(
    "<h3>Chercher — sans jamais planter</h3>" +
    "<p>C'est le critère numéro 2, et c'est celui qui impressionnera ton parent.</p>" +
    "<p>Si tu écris <code>carnet[nom]</code> et que le nom n'y est pas, tout s'arrête en rouge. Devant quelqu'un, c'est raté. Avec <code>.get(nom, \"Contact inconnu\")</code>, le programme continue et <strong>répond poliment</strong>.</p>" +
    "<p>Un programme qui prévoit ce qui peut mal tourner, c'est ça, un vrai programme.</p>"
  ),
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ecris chercher(carnet, nom) : elle REND le numero, ou le texte Contact inconnu si la personne n'y est pas.\n" +
        "Sers-t'en deux fois : pour Ama, puis pour Fatou qui n'est pas dans le carnet.",
      starter_code: DEPART + "\n# chercher(carnet, nom) rend le numero, ou Contact inconnu.\n",
      hidden_tests:
        'compact = code.replace(" ", "")\n' +
        'assert "defchercher(" in compact, "Ecris la fonction chercher(carnet, nom)."\n' +
        'assert "return" in code, "chercher doit RENDRE sa reponse."\n' +
        'assert ".get(" in code, "Pour ne jamais planter, passe par .get() avec une reponse de secours."\n' +
        'assert "90 12 34 56" in output, "Le numero d Ama doit s afficher."\n' +
        'assert "inconnu" in output.lower(), "Fatou n est pas au carnet : il faut le dire, sans planter."',
    },
  },

  // ── 7-8. Lister, même vide ────────────────────────────────────────────
  texte(
    "<h3>Lister — même quand il n'y a personne</h3>" +
    "<p>Troisième critère, et le plus vicieux : un carnet <strong>vide</strong>.</p>" +
    "<p>Une boucle sur un carnet vide ne tourne aucun tour. Elle n'affiche donc rien — et un écran vide, pour celui qui regarde, ressemble à une panne.</p>" +
    "<p>Un bon programme dit ce qui se passe : <em>« Aucun contact »</em>. Ça se teste avec <code>len(carnet)</code>.</p>"
  ),
  {
    type: "code_challenge",
    content: {
      language: "python",
      required: true,
      instructions:
        "Ecris lister(carnet) : elle REND une liste de phrases, une par contact — et si le carnet est vide, elle rend une liste contenant la phrase Aucun contact.\n" +
        "Essaie-la sur le carnet normal, puis sur un carnet vide, et affiche chaque phrase.",
      starter_code: DEPART + "vide = {}\n\n# lister(carnet) rend des phrases. Le carnet vide a droit a la sienne.\n",
      hidden_tests:
        'compact = code.replace(" ", "")\n' +
        'assert "deflister(" in compact, "Ecris la fonction lister(carnet)."\n' +
        'assert "return" in code, "lister doit RENDRE ses phrases."\n' +
        'assert "len(" in code, "Pour savoir si le carnet est vide, compte-le : len(carnet)."\n' +
        'assert "Ama" in output, "Le carnet normal doit lister Ama."\n' +
        'assert "Kofi" in output, "Et Kofi."\n' +
        'assert "Aucun contact" in output, "Le carnet vide doit annoncer : Aucun contact."',
    },
  },

  // ── 9. Le script de la démonstration ──────────────────────────────────
  texte(
    "<h3>Maintenant, tout ensemble — et tu montres</h3>" +
    "<p>Tes trois fonctions marchent. Le téléphone va les afficher.</p>" +
    "<p><strong>Ce que tu diras à ton parent</strong>, dans cet ordre — apprends-le, ça dure une minute :</p>" +
    "<pre><code>1. « Voilà mon carnet. » → tu lances, les contacts apparaissent\n" +
    "2. « Donne-moi un prénom et un numéro. » → tu les tapes, il apparaît\n" +
    "3. « Donne-moi le nom de quelqu'un qui n'est pas dedans. »\n" +
    "   → le téléphone répond « Contact inconnu » au lieu de planter</code></pre>" +
    "<p>Le troisième geste est le plus fort. N'importe qui sait faire marcher un programme quand tout va bien. Toi, tu as <strong>prévu ce qui peut mal tourner</strong> — et c'est exactement ce que font les développeurs qu'on paie.</p>"
  ),

  // ── 10. Le jalon ──────────────────────────────────────────────────────
  jeu({
    game_type: "telephone",
    title: "🏆 Le carnet de contacts",
    instructions:
      "Le jalon. Reprends tes trois fonctions, puis fais tourner le carnet :\n" +
      "1. le titre avec ton prenom\n" +
      "2. demande un prenom et un numero, ajoute-les\n" +
      "3. affiche TOUS les contacts avec une boucle\n" +
      "4. demande un nom a chercher, et affiche la reponse — meme si la personne n'y est pas",
    min_contacts: 3,
    doit_afficher: ["inconnu"],
    par: 20,
    starter_code:
      DEPART + "\n" +
      "def ajouter(carnet, nom, numero):\n    carnet[nom] = numero\n    return carnet\n\n" +
      'def chercher(carnet, nom):\n    return carnet.get(nom, "Contact inconnu")\n\n' +
      'ecran.titre("Le carnet de ...")\n\n' +
      "# A toi : demander, ajouter, tout afficher, puis chercher.\n",
  }),

  // ── 11. La grille, à cocher avant de montrer ──────────────────────────
  {
    type: "quiz",
    content: {
      questions: [
        { question: "Ton carnet cherche un nom absent. Que doit-il faire ?",
          choices: ["s'arrêter en rouge", "afficher Contact inconnu", "ajouter la personne"], answer: 1,
          explanation: "Devant quelqu'un, un écran rouge, c'est raté. Le programme doit répondre, même pour dire qu'il ne sait pas." },
        { question: "Tu listes un carnet vide. L'écran doit…",
          choices: ["annoncer qu'il est vide", "rester vide", "afficher une erreur"], answer: 0,
          explanation: "Un écran vide ressemble à une panne. Un bon programme dit ce qui se passe." },
        { question: "ajouter() doit-elle afficher le carnet ?",
          choices: ["oui, sinon on ne voit rien", "non : elle le rend, et c'est le téléphone qui affiche"], answer: 1,
          explanation: "Une fonction qui affiche ne sert qu'une fois. Une fonction qui rend sert partout — c'est le quatrième critère." },
        { question: "Pourquoi le téléphone n'affiche-t-il rien tout seul ?",
          choices: ["il est cassé", "parce que c'est ton code qui le remplit", "il faut payer"], answer: 1,
          explanation: "Le téléphone est un cadre. Tout ce qu'on y voit vient de tes appels à ecran.titre, ecran.contact et ecran.message." },
      ],
    },
  },

  // ── 12. Ce que tu as fait, et la suite ────────────────────────────────
  texte(
    "<h3>Ce que tu viens de faire</h3>" +
    "<p>Tu as écrit un programme qui garde des informations, qui répond à trois questions différentes, et qui <strong>ne plante pas</strong> quand on lui demande n'importe quoi. Et tu l'as montré.</p>" +
    "<p>Tes trois fonctions rendent leur résultat au lieu de l'afficher. C'est pour ça que le même carnet a pu servir à la console <em>et</em> au téléphone, sans qu'une ligne change. Beaucoup de gens qui codent depuis des années n'ont pas compris ça.</p>" +
    "<h3>La suite</h3>" +
    "<p>Ton carnet oublie tout dès qu'on ferme la page : il vit dans la mémoire, comme tout ce que tu as écrit jusqu'ici.</p>" +
    "<p>Au thème suivant, tu apprendras à <strong>garder les choses pour de bon</strong> — et ton carnet se souviendra de ses contacts même après extinction.</p>"
  ),
];

const SOLUTIONS = {
  5: { cas: [
    { nom: "juste", attendu: "ok", code: DEPART + "\ndef ajouter(carnet, nom, numero):\n    carnet[nom] = numero\n    return carnet\n\ncarnet = ajouter(carnet, \"Michael\", \"92 33 44 55\")\nprint(\"Contacts :\", len(carnet))\n" },
    { nom: "affiche au lieu de rendre", attendu: "test raté", code: DEPART + "\ndef ajouter(carnet, nom, numero):\n    carnet[nom] = numero\n    print(carnet)\n\najouter(carnet, \"Michael\", \"92 33 44 55\")\n" },
    { nom: "oublie d ajouter", attendu: "test raté", code: DEPART + "\ndef ajouter(carnet, nom, numero):\n    return carnet\n\ncarnet = ajouter(carnet, \"Michael\", \"92 33 44 55\")\nprint(\"Contacts :\", len(carnet))\n" },
  ] },
  7: { cas: [
    { nom: "juste", attendu: "ok", code: DEPART + '\ndef chercher(carnet, nom):\n    return carnet.get(nom, "Contact inconnu")\n\nprint(chercher(carnet, "Ama"))\nprint(chercher(carnet, "Fatou"))\n' },
    { nom: "crochets : plante sur Fatou", attendu: "plante", code: DEPART + '\ndef chercher(carnet, nom):\n    return carnet[nom]\n\nprint(chercher(carnet, "Ama"))\nprint(chercher(carnet, "Fatou"))\n' },
    { nom: "affiche au lieu de rendre", attendu: "test raté", code: DEPART + '\ndef chercher(carnet, nom):\n    print(carnet.get(nom, "Contact inconnu"))\n\nchercher(carnet, "Ama")\nchercher(carnet, "Fatou")\n' },
  ] },
  9: { cas: [
    { nom: "juste", attendu: "ok", code: DEPART + 'vide = {}\n\ndef lister(carnet):\n    if len(carnet) == 0:\n        return ["Aucun contact"]\n    phrases = []\n    for nom in carnet:\n        phrases = phrases + [nom + " : " + carnet[nom]]\n    return phrases\n\nfor p in lister(carnet):\n    print(p)\nfor p in lister(vide):\n    print(p)\n' },
    { nom: "oublie le carnet vide", attendu: "test raté", code: DEPART + 'vide = {}\n\ndef lister(carnet):\n    phrases = []\n    for nom in carnet:\n        phrases = phrases + [nom + " : " + carnet[nom]]\n    return phrases\n\nfor p in lister(carnet):\n    print(p)\nfor p in lister(vide):\n    print(p)\n' },
    { nom: "affiche au lieu de rendre", attendu: "test raté", code: DEPART + 'vide = {}\n\ndef lister(carnet):\n    for nom in carnet:\n        print(nom, carnet[nom])\n\nlister(carnet)\nlister(vide)\n' },
  ] },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
const INTERDITS = [/\bwhile\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\[\s*\d+\s*\]/, /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/];
BLOCS.forEach((b, i) => {
  const c = b.content ?? {};
  const visible = JSON.stringify({ ...c, hidden_tests: undefined });
  for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`bloc ${i} contient ${rx} — jamais enseigné`);
  if (b.type === "text" && (c.html ?? "").replace(/<[^>]+>/g, "").trim().length < 80) mauvais(`bloc ${i} : texte trop court`);
  if (b.type === "code_challenge") {
    if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`bloc ${i} : défi incomplet`);
    if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`bloc ${i} : l'amorce finit sur un bloc vide`);
  }
  if (b.type === "quiz") {
    const rangs = c.questions.map((q) => q.answer);
    if (new Set(rangs).size === 1) mauvais(`bloc ${i} : toutes les bonnes réponses au même rang`);
    for (const q of c.questions) {
      if (!q.choices[q.answer]) mauvais(`bloc ${i} : question sans bonne réponse`);
      if (!q.explanation) mauvais(`bloc ${i} : question sans explication`);
    }
  }
  // Le téléphone n'affiche que ce que l'enfant lui donne : sans consigne ni
  // amorce, il ne saurait pas par quoi commencer.
  if (c.game_type === "telephone") {
    if (!c.instructions) mauvais(`bloc ${i} : téléphone sans consigne`);
    if (!c.starter_code?.includes("ecran.titre")) mauvais(`bloc ${i} : l'amorce doit montrer ecran.titre`);
    if (!c.min_contacts) mauvais(`bloc ${i} : téléphone sans critère de réussite`);
  }
});
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${BLOCS.length} blocs · ${BLOCS.filter((b) => b.type === "code_challenge").length} défis · ${BLOCS.filter((b) => b.content.game_type === "telephone").length} téléphones · ${BLOCS.filter((b) => b.type === "quiz").length} quiz`);

if (process.argv.includes("--banc")) {
  const exos = Object.keys(SOLUTIONS).map((i) => ({ palier: 1, title: `bloc ${i}`, blocs: [BLOCS[Number(i)]] }));
  const sols = Object.fromEntries(Object.entries(SOLUTIONS).map(([i, s]) => [`bloc ${i}`, s]));
  console.log(JSON.stringify(banc(exos, sols)));
  process.exit(0);
}

// ── Application ──────────────────────────────────────────────────────────
const lecons = await g("lessons", "id,title,theme_id", (q) => q.eq("title", LECON));
if (lecons.length !== 1) throw new Error(`${lecons.length} leçon(s) « ${LECON} »`);
const L = lecons[0];
const deja = await g("lesson_blocks", "id", (q) => q.eq("lesson_id", L.id));
if (deja.length && !process.argv.includes("--refaire")) throw new Error(`${deja.length} bloc(s) existent déjà — --refaire`);

const ECRIRE = process.argv.includes("--ecrire");
console.log(`\n${ECRIRE ? "ÉCRITURE" : "APERÇU (--ecrire pour appliquer)"} — ${BLOCS.length} blocs sur « ${L.title} »\n`);
BLOCS.forEach((b, i) => console.log(`  [${String(i).padStart(2)}] ${(b.content.game_type ?? b.type).padEnd(16)} ${(b.content.title ?? (b.content.html ?? "").replace(/<[^>]+>/g, " ").trim().slice(0, 56))}`));
if (!ECRIRE) { console.log("\nRien n'a été écrit."); process.exit(0); }

if (deja.length) await db.from("lesson_blocks").delete().eq("lesson_id", L.id);
const { error } = await db.from("lesson_blocks").insert(
  BLOCS.map((b, i) => ({ lesson_id: L.id, theme_id: L.theme_id, type: b.type, content: b.content, order_index: i })),
);
if (error) throw new Error(error.message);

let pb = 0; const ok = (c, m) => { console.log(`  ${c ? "✓" : "⛔"} ${m}`); if (!c) pb++; };
console.log("\n── RELECTURE ──");
const ap = (await g("lesson_blocks", "order_index,type,content", (q) => q.eq("lesson_id", L.id))).sort((a, b) => a.order_index - b.order_index);
ok(ap.length === BLOCS.length, `${BLOCS.length} blocs écrits (trouvé ${ap.length})`);
ok(ap.every((b, i) => b.order_index === i), "numérotation contiguë");
ok(ap.filter((b) => b.type === "code_challenge").every((b) => b.content.hidden_tests), "chaque défi garde ses tests");
ok(ap.filter((b) => b.content.game_type === "telephone").length === 2, "les deux téléphones sont là");
console.log(pb === 0 ? "\n✅ TOUT EST BON" : `\n⛔ ${pb} PROBLÈME(S)`);
process.exit(pb === 0 ? 0 : 1);
