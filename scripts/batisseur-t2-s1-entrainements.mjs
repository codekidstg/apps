/**
 * Les quatre entraînements de « La boucle qui attend ».
 *
 *     node scripts/batisseur-t2-s1-entrainements.mjs [--ecrire] [--refaire] [--banc]
 *
 * Un entraînement par objectif de la séance, dans l'ordre des objectifs :
 *
 *   0. for ou while ?          obj. 1 — le nombre de tours est-il connu ?
 *   1. Les trois morceaux      obj. 2 — départ, question, avancement
 *   2. Combien de tours ?      obj. 3 — dérouler une boucle, et la panne
 *   3. Le cadenas              obj. 4 — attendre quelqu'un, et le compter
 *
 * `while` est désormais enseigné : il est donc autorisé ici, contrairement aux
 * entraînements des thèmes précédents. Tout le reste de la liste des interdits
 * tient : ni break, ni True/False, ni try, ni .strip(), ni les f-strings.
 */
import { base, lecteur, kodi, banc, appliquerParcours } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "La boucle qui attend";

// ── Garde-fous arithmétiques : les comptes annoncés doivent tomber juste ──
const BIDON = 20, SEAU = 4;
const VERSEMENTS = Math.ceil(BIDON / SEAU);
if (VERSEMENTS !== 5) throw new Error(`${VERSEMENTS} versements, attendu 5`);
if (VERSEMENTS * SEAU !== BIDON) throw new Error("le dernier seau doit remplir le bidon pile — sinon le niveau final n'est plus 20");

const EXOS = [
  {
    title: "for ou while ?",
    description: "Douze tâches. Chacune appelle une boucle, et une seule.",
    xp: 30,
    blocs: [
      kodi("<p>Une seule question à se poser, et elle ne change jamais : <strong>est-ce que je connais le nombre de tours d'avance ?</strong></p><p>« Les cinq premiers » : je le connais. « Jusqu'à ce qu'il réponde » : je ne le connais pas, et personne ne me le dira.</p>"),
      {
        type: "swipe_sort",
        content: {
          title: "for ou while ?",
          instruction: "Pour faire ça, il te faut quelle boucle ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Je connais le nombre de tours d'avance → for.",
              "C'est une liste, une plage de nombres, un carnet → for.",
              "C'est une personne, une condition, un seuil qui décide → while.",
              "Si tu ne peux pas écrire le nombre de tours, c'est while.",
            ],
          },
          categories: [
            { id: "for", label: "Une boucle for", emoji: "🔢", color: "#FDB813" },
            { id: "while", label: "Une boucle while", emoji: "⏳", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "Afficher les cinq premiers noms de la liste", correct: "for", hint: "Cinq : le nombre est écrit dans la consigne." },
            { id: "b", emoji: "2️⃣", label: "Demander le mot de passe jusqu'à ce qu'il soit bon", correct: "while", hint: "Une personne décide. Elle peut réussir du premier coup, ou au dixième." },
            { id: "c", emoji: "3️⃣", label: "Dire bonjour à chaque élève de la classe", correct: "for", hint: "Un tour par élève : la liste donne le nombre." },
            { id: "d", emoji: "4️⃣", label: "Tirer le filet jusqu'à 50 kg de poisson", correct: "while", hint: "C'est le lac qui décide du poids de chaque prise." },
            { id: "e", emoji: "5️⃣", label: "Afficher la table de multiplication de 9", correct: "for", hint: "Dix lignes, connues d'avance." },
            { id: "f", emoji: "6️⃣", label: "Servir les clients jusqu'à ce qu'il n'y ait plus personne", correct: "while", hint: "Le matin, tu ne sais pas combien viendront." },
            { id: "g", emoji: "7️⃣", label: "Calculer le total des sept ventes du carnet", correct: "for", hint: "Sept : le carnet le dit." },
            { id: "h", emoji: "8️⃣", label: "Ajouter des pièces jusqu'à atteindre 2000 F", correct: "while", hint: "Un seuil à atteindre, pas un nombre de tours." },
            { id: "i", emoji: "9️⃣", label: "Lire les douze lignes du cahier", correct: "for", hint: "Douze lignes, et elles sont déjà toutes là." },
            { id: "j", emoji: "🔟", label: "Recommencer le jeu tant que l'enfant veut rejouer", correct: "while", hint: "C'est lui qui décide quand ça s'arrête, pas ton programme." },
            { id: "k", emoji: "🅰️", label: "Compter de 1 à 20", correct: "for", hint: "De 1 à 20 : vingt tours, écrits noir sur blanc." },
            { id: "l", emoji: "🅱️", label: "Attendre que l'eau bouille", correct: "while", hint: "Tu ne sais pas combien de minutes. Tu regardes, et tu attends." },
          ],
        },
      },
    ],
  },

  {
    title: "Les trois morceaux",
    description: "Le départ, la question, l'avancement — et ce qui arrive s'il en manque un.",
    xp: 40,
    blocs: [
      kodi("<p>Une boucle <code>while</code> tient sur trois morceaux, et aucun n'est décoratif.</p><p>Enlève le premier, Python ne sait pas de quoi tu parles. Enlève le troisième, la boucle ne finit plus.</p>"),
      {
        type: "match",
        content: {
          title: "Chaque morceau et son rôle",
          instruction: "Touche un morceau, puis son rôle.",
          left_label: "Le morceau",
          right_label: "Son rôle",
          pairs: [
            { left: "litres = 0", right: "La valeur de départ, avant la boucle" },
            { left: "while litres < 20:", right: "La question, posée avant chaque tour" },
            { left: "litres = litres + 4", right: "La ligne qui fait avancer, à l'intérieur" },
            { left: "La question répond oui", right: "On refait un tour" },
            { left: "La question répond non", right: "La boucle s'arrête, le programme continue" },
            { left: "litres + 4", right: "Calcule, puis jette : rien n'avance" },
            { left: "■ Arrêter", right: "Le seul recours quand ça ne finit plus" },
          ],
        },
      },
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Le bidon fait 20 litres, et ton seau en contient 4.\n" +
            "Verse jusqu'a ce que le bidon soit plein : affiche le niveau apres chaque seau,\n" +
            "puis annonce combien de seaux il a fallu.",
          starter_code:
            "litres = 0\n" +
            "seaux = 0\n\n" +
            "# Les trois morceaux sont la : il manque la question et l'avancement.\n",
          hidden_tests:
            "import re\n" +
            'assert "while" in code, "Le bidon se remplit jusqu a un seuil : c est une boucle while."\n' +
            'assert code.count("print(") <= 3, "Cinq print recopies, ce n est pas une boucle."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            `assert "${BIDON}" in nombres, "Le bidon fait ${BIDON} litres : le dernier niveau affiche doit etre ${BIDON}. Ton programme affiche : " + (" ".join(nombres) or "aucun nombre")\n` +
            `assert "${VERSEMENTS}" in nombres, "Il faut ${VERSEMENTS} seaux de ${SEAU} litres pour remplir ${BIDON} litres, et ton programme doit l annoncer."`,
        },
      },
    ],
  },

  {
    title: "Combien de tours ?",
    description: "Déroule un programme à la main, puis retrouve celui qui ne finit pas.",
    xp: 40,
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Voici un programme de six lignes. Il marche.</p>" +
            "<pre><code>1  poids = 0\n" +
            "2  tours = 0\n" +
            "3  while poids &lt; 30:\n" +
            "4      poids = poids + 10\n" +
            "5      tours = tours + 1\n" +
            "6  print(tours, poids)</code></pre>" +
            "<p>Ne le modifie pas. Déroule-le dans ta tête, ligne par ligne.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule la boucle",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La boucle fait", after: "tours.",
              options: ["3", "4", "30"], correct: 0,
              explanation: "10, puis 20, puis 30. Au quatrième passage la question répond non." },
            { id: "s2", before: "La question de la ligne 3 est posée", after: "fois.",
              options: ["4", "3", "1"], correct: 0,
              explanation: "Trois fois oui, et une quatrième fois pour obtenir non. C'est la question qui arrête la boucle, et il faut bien la poser pour l'entendre." },
            { id: "s3", before: "À la fin, poids vaut", after: ".",
              options: ["30", "20", "40"], correct: 0,
              explanation: "Le troisième tour l'amène à 30. Et 30 n'est pas plus petit que 30." },
            { id: "s4", before: "La ligne 6 affiche", after: ".",
              options: ["3 30", "30 3", "4 40"], correct: 0,
              explanation: "tours d'abord, poids ensuite : dans l'ordre où ils sont écrits." },
            { id: "s5", before: "Si on supprimait la ligne 4, la boucle", after: ".",
              options: ["ne s'arrêterait jamais", "ferait un seul tour", "ne démarrerait pas"],
              correct: 0,
              explanation: "poids resterait à 0, et 0 est toujours plus petit que 30. C'est la ligne qui fait avancer." },
            { id: "s6", before: "Si la ligne 1 passait après la ligne 3, Python", after: ".",
              options: ["s'arrêterait : il ne connaît pas poids", "marcherait pareil", "mettrait poids à 0 tout seul"],
              correct: 0,
              explanation: "La question parle de poids. La valeur de départ doit donc exister AVANT qu'on la pose." },
          ],
        },
      },
      {
        type: "blockly_challenge",
        content: {
          game_type: "bug_hunt",
          title: "Celui qui repart de zéro",
          context: "Le programme devait verser jusqu'à 30 litres. Il verse pour toujours, et le niveau reste à 10.",
          description: "Une seule ligne est fausse — clique dessus.",
          bug_index: 2,
          fix: '    print("Un seau de plus")',
          explanation: "La remise à zéro est à l'intérieur de la boucle : à chaque tour, le travail du tour précédent est effacé. Le niveau monte à 10, revient à 0, remonte à 10… pour toujours.",
          instructions: [
            "litres = 0",
            "while litres < 30:",
            "    litres = 0",
            "    litres = litres + 10",
          ],
        },
      },
    ],
  },

  {
    title: "Le cadenas",
    description: "Un programme qui attend la bonne réponse — et qui compte les essais.",
    xp: 50,
    blocs: [
      kodi("<p>Le magasin est fermé par un cadenas à mot de passe. Le programme ne s'arrête pas sur une mauvaise réponse : <strong>il redemande</strong>.</p><p>Et il compte, parce que le patron veut savoir combien de fois on s'est trompé.</p>"),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "Demande le mot de passe jusqu'a ce que ce soit kodi.\n" +
            "A chaque mauvaise reponse, affiche : Essaie encore\n" +
            "Quand c'est bon, affiche : Ouvert — puis le nombre d'essais qu'il a fallu.",
          starter_code:
            "essais = 0\n" +
            'mot = input("Mot de passe : ")\n\n' +
            "# Tant que ce n'est pas le bon mot : compte l'essai, dis Essaie encore,\n" +
            "# et redemande. Le reste vient apres la boucle.\n",
          hidden_tests:
            "import re\n" +
            'assert "while" in code, "Tu ne sais pas combien d essais il faudra : c est une boucle while."\n' +
            'assert code.count("input(") >= 2, "La question doit etre posee deux fois : une avant la boucle, une a chaque mauvaise reponse."\n' +
            'assert output.lower().count("essaie encore") == 2, "Deux mauvaises reponses, donc Essaie encore exactement deux fois. Ton programme l affiche " + str(output.lower().count("essaie encore")) + " fois."\n' +
            'assert "ouvert" in output.lower(), "Quand le mot est bon, le cadenas s ouvre : affiche Ouvert."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "3" in nombres, "Il a fallu 3 essais : ton programme doit l annoncer."',
        },
      },
    ],
  },
];

const SOLUTIONS = {
  "Les trois morceaux": { cas: [
    { nom: "juste", attendu: "ok", code:
      "litres = 0\nseaux = 0\nwhile litres < 20:\n    litres = litres + 4\n    seaux = seaux + 1\n    print(\"Niveau :\", litres)\nprint(\"Seaux :\", seaux)\n" },
    { nom: "un for de cinq tours", attendu: "test raté", code:
      "litres = 0\nfor i in range(5):\n    litres = litres + 4\n    print(\"Niveau :\", litres)\nprint(\"Seaux :\", 5)\n" },
    { nom: "oublie de compter les seaux", attendu: "test raté", code:
      "litres = 0\nwhile litres < 20:\n    litres = litres + 4\n    print(\"Niveau :\", litres)\n" },
  ] },
  "Le cadenas": {
    reponses: ["ama", "1234", "kodi"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "essais = 0\n" +
        'mot = input("Mot de passe : ")\n' +
        'while mot != "kodi":\n' +
        "    essais = essais + 1\n" +
        '    print("Essaie encore")\n' +
        '    mot = input("Mot de passe : ")\n' +
        "essais = essais + 1\n" +
        'print("Ouvert")\nprint("Essais :", essais)\n' },
      // Celui-là redemande AVANT de juger : il dit « Essaie encore » même quand
      // le mot est bon. Le compte d'input() ne le voit pas ; la sortie, oui.
      { nom: "gronde meme quand c est bon", attendu: "test raté", code:
        "essais = 0\n" +
        'mot = ""\n' +
        'while mot != "kodi":\n' +
        '    mot = input("Mot de passe : ")\n' +
        "    essais = essais + 1\n" +
        '    print("Essaie encore")\n' +
        'print("Ouvert")\nprint("Essais :", essais)\n' },
      { nom: "oublie de compter", attendu: "test raté", code:
        'mot = input("Mot de passe : ")\n' +
        'while mot != "kodi":\n' +
        '    print("Essaie encore")\n' +
        '    mot = input("Mot de passe : ")\n' +
        'print("Ouvert")\n' },
    ],
  },
};

// ── Garde-fous ───────────────────────────────────────────────────────────
let ko = 0; const mauvais = (m) => { console.log(`⛔ ${m}`); ko++; };
// `while` est enseigné par la séance : il sort de la liste. Le reste tient.
const INTERDITS = [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
  /\.strip\(/, /\.split\(/, /\.lower\(/, /\btry\b/, /\bexcept\b/, /\bopen\(/,
  /\.items\(/, /\.keys\(/, /\.values\(/, /enumerate\(/, /\bzip\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/];
for (const e of EXOS) {
  if (e.palier !== undefined) mauvais(`${e.title} : un entraînement de parcours ne porte pas de palier`);
  if (!e.xp) mauvais(`${e.title} : un entraînement de parcours paie en XP`);
  for (const b of e.blocs) {
    const c = b.content ?? {};
    const visible = JSON.stringify({ ...c, hidden_tests: undefined });
    for (const rx of INTERDITS) if (rx.test(visible)) mauvais(`[${e.title}] contient ${rx} — jamais enseigné`);
    for (const it of c.items ?? []) {
      if (!it.hint) mauvais(`${e.title} : « ${it.label} » sans indice`);
      if (!(c.categories ?? c.bins ?? []).some((x) => x.id === it.correct)) mauvais(`${e.title} : « ${it.label} » vise un bac inexistant`);
    }
    for (const v of (c.categories ?? c.bins ?? []).filter((x) => !(c.items ?? []).some((i) => i.correct === x.id)))
      mauvais(`${e.title} : le bac « ${v.label} » n'attend aucun élément`);
    for (const s of c.sentences ?? []) {
      if (!s.options?.[s.correct]) mauvais(`${e.title} : phrase ${s.id} sans bonne réponse`);
      if (new Set(s.options).size !== s.options.length) mauvais(`${e.title} : phrase ${s.id} a deux options identiques`);
      if (!s.explanation) mauvais(`${e.title} : phrase ${s.id} sans explication`);
    }
    if (c.pairs) {
      const g1 = c.pairs.map((p) => p.left), d1 = c.pairs.map((p) => p.right);
      if (new Set(g1).size !== g1.length) mauvais(`${e.title} : deux paires ont la même gauche`);
      if (new Set(d1).size !== d1.length) mauvais(`${e.title} : deux paires ont la même droite — insoluble`);
    }
    if (c.helper && (!c.helper.title || !Array.isArray(c.helper.criteria) || !c.helper.criteria.length))
      mauvais(`${e.title} : helper mal formé`);
    if (c.game_type === "bug_hunt") {
      if (!c.instructions?.[c.bug_index]) mauvais(`${e.title} : bug_index hors des lignes`);
      else if (c.instructions[c.bug_index] === c.fix) mauvais(`${e.title} : la réparation répète la ligne fautive`);
      if (!c.explanation) mauvais(`${e.title} : chasse au bug sans explication`);
    }
    if (b.type === "code_challenge") {
      if (!c.instructions || !c.starter_code || !c.hidden_tests) mauvais(`${e.title} : défi incomplet`);
      if (/:\s*\n(\s*#[^\n]*\n)*\s*$/.test(c.starter_code ?? "")) mauvais(`${e.title} : l'amorce finit sur un bloc vide`);
    }
  }
}
if (ko) throw new Error(`${ko} défaut(s) — rien n'a été écrit`);
const dire = process.argv.includes("--banc") ? console.error : console.log;
dire(`✓ ${EXOS.length} entraînements de parcours · ${VERSEMENTS} seaux de ${SEAU} litres remplissent ${BIDON} litres`);
dire("✓ vocabulaire, bacs, indices, paires, phrases et amorces : vérifiés");

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquerParcours(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
