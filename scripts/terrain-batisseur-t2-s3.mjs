/**
 * Le Terrain — Bâtisseur, thème 2 séance 3 « Quand ça plante ».
 *
 *     node scripts/terrain-batisseur-t2-s3.mjs [--ecrire] [--refaire] [--banc]
 *
 * Sept exercices, et chacun ouvre une porte que les six autres laissent fermée.
 *
 *   1  Où va cette ligne ?        dans le try, dans le except, ou dehors
 *   1  Jusqu'où va la file ?      ce que l'erreur emporte derrière elle
 *   2  Le programme raconté       dérouler un try/except ligne par ligne
 *   2  Trois filets troués        trois façons de croire qu'on est protégé
 *   2  Le symptôme et sa cause    lire une panne et remonter à sa ligne
 *   3  La file du dimanche        cinq papiers, trois illisibles, à l'étal
 *   3  Le carnet qui ne meurt pas une saisie illisible n'arrête plus rien
 */
import { base, lecteur, kodi, jeu, verifier, appliquer, banc } from "./lib/terrain.mjs";

const db = base(), g = lecteur(db);
const LECON = "Quand ça plante";

// ── Garde-fous ───────────────────────────────────────────────────────────
const lisible = (p) => /^\d+$/.test(p.replace(/ /g, ""));
const DIMANCHE = ["2 400", "sept cents", "1800", "mille cinq", "trois mille"];
const SERVIS = DIMANCHE.filter(lisible), REFUSES = DIMANCHE.filter((p) => !lisible(p));
const CAISSE = SERVIS.reduce((a, p) => a + Number(p.replace(/ /g, "")), 0);
if (CAISSE !== 4200 || REFUSES.length !== 3) throw new Error(`caisse ${CAISSE}, ${REFUSES.length} refusés`);
if (DIMANCHE.length > 5) throw new Error("le décor ne montre que 5 billets");
// Un lot où presque tout est illisible : c'est ce qui rend le filet
// indispensable plutôt que décoratif.
if (REFUSES.length < SERVIS.length) throw new Error("pas assez de papiers illisibles pour que le filet compte");

const EXOS = [
  {
    palier: 1,
    title: "Où va cette ligne ?",
    description: "Douze lignes d'un programme à l'étal. Chacune a une seule bonne place.",
    blocs: [
      kodi(
        "<p>Un filet se range en trois endroits, et la place d'une ligne décide de tout :</p>" +
        "<p><strong>dans le try</strong> — ce qui peut casser, et ce qui ne doit surtout pas se faire si ça casse.<br>" +
        "<strong>dans le except</strong> — ce qu'on fait à la place.<br>" +
        "<strong>dehors</strong> — ce qui doit se faire dans tous les cas.</p>"
      ),
      {
        type: "drag_to_bin",
        content: {
          title: "Où va cette ligne ?",
          instruction: "Le programme encaisse des papiers. Range chaque ligne à sa place.",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "Ça peut casser ? → dans le try.",
              "Ça ne doit PAS se faire si ça casse ? → dans le try, juste après.",
              "C'est ce qu'on fait quand ça a cassé ? → dans le except.",
              "Ça doit se faire quoi qu'il arrive ? → dehors.",
            ],
          },
          bins: [
            { id: "try", label: "Dans le try", emoji: "🛡️", color: "#10b981" },
            { id: "except", label: "Dans le except", emoji: "🪂", color: "#FDB813" },
            { id: "dehors", label: "Dehors", emoji: "🚪", color: "#a78bfa" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "montant = int(papier)", correct: "try", hint: "C'est exactement la ligne qui peut mourir." },
            { id: "b", emoji: "2️⃣", label: "caisse = caisse + montant", correct: "try", hint: "Si la conversion a cassé, ce montant n'existe pas : cette ligne ne doit pas tourner." },
            { id: "c", emoji: "3️⃣", label: "encaisser(papier)", correct: "try", hint: "Le tiroir ne doit pas sonner pour un papier qu'on n'a pas su lire." },
            { id: "d", emoji: "4️⃣", label: "refuser(papier)", correct: "except", hint: "C'est ce qu'on fait à la place, quand ça a cassé." },
            { id: "e", emoji: "5️⃣", label: "refuses = refuses + 1", correct: "except", hint: "On ne compte un refus que s'il y a eu un refus." },
            { id: "f", emoji: "6️⃣", label: 'print("Papier illisible")', correct: "except", hint: "Un message qui ne vaut que dans le cas raté." },
            { id: "g", emoji: "7️⃣", label: "for papier in papiers:", correct: "dehors", hint: "La boucle contient le filet, pas l'inverse." },
            { id: "h", emoji: "8️⃣", label: "caisse = 0", correct: "dehors", hint: "Avant tout le monde, une seule fois." },
            { id: "i", emoji: "9️⃣", label: 'print("Caisse :", caisse)', correct: "dehors", hint: "À la toute fin, quand la file est passée." },
            { id: "j", emoji: "🔟", label: 'propre = papier.replace(" ", "")', correct: "try", hint: "Elle ne casse pas toute seule, mais elle prépare celle qui peut casser : on la met à l'abri avec." },
            { id: "k", emoji: "🅰️", label: "servis = servis + 1", correct: "try", hint: "On ne compte un client servi que si l'encaissement a vraiment eu lieu." },
            { id: "l", emoji: "🅱️", label: 'print("Boutique fermee")', correct: "dehors", hint: "Une seule fois, à la fin, quoi qu'il se soit passé." },
          ],
        },
      },
    ],
  },

  {
    palier: 1,
    title: "Jusqu'où va la file ?",
    description: "Dix situations. Le troisième papier est illisible — qui sera servi ?",
    blocs: [
      kodi(
        "<p>Cinq clients attendent. Le <strong>troisième</strong> tend un papier illisible.</p>" +
        "<p>Pour chaque client, dis s'il sera servi ou s'il rentrera chez lui. Réponds d'abord <em>sans filet</em>, puis <em>avec filet</em> — c'est la même file, deux programmes.</p>"
      ),
      {
        type: "swipe_sort",
        content: {
          title: "Servi, ou rentré chez lui ?",
          instruction: "Le 3e papier est illisible. Ce client-là, que lui arrive-t-il ?",
          helper: {
            title: "Comment décider ?",
            criteria: [
              "SANS filet : tout le monde avant le 3e est servi, le 3e et tous les suivants rentrent chez eux.",
              "AVEC filet : seul le 3e repart les mains vides — poliment, et les autres sont servis.",
              "Le 3e n'est jamais encaissé : son papier est illisible, filet ou pas.",
            ],
          },
          categories: [
            { id: "servi", label: "Servi", emoji: "💰", color: "#10b981" },
            { id: "rentre", label: "Rentré chez lui", emoji: "🚶", color: "#ef4444" },
          ],
          items: [
            { id: "a", emoji: "1️⃣", label: "SANS filet — le 1er client", correct: "servi", hint: "Il passe avant la panne : rien ne l'empêche." },
            { id: "b", emoji: "2️⃣", label: "SANS filet — le 2e client", correct: "servi", hint: "Toujours avant la panne." },
            { id: "c", emoji: "3️⃣", label: "SANS filet — le 3e client", correct: "rentre", hint: "C'est lui qui casse tout : son papier ne devient pas un nombre." },
            { id: "d", emoji: "4️⃣", label: "SANS filet — le 4e client", correct: "rentre", hint: "Le programme est mort au 3e. Le 4e n'a jamais été atteint." },
            { id: "e", emoji: "5️⃣", label: "SANS filet — le 5e client", correct: "rentre", hint: "Même chose : une erreur emporte toute la suite." },
            { id: "f", emoji: "6️⃣", label: "AVEC filet — le 1er client", correct: "servi", hint: "Le filet ne change rien quand tout va bien." },
            { id: "g", emoji: "7️⃣", label: "AVEC filet — le 3e client", correct: "rentre", hint: "Le filet ne rend pas son papier lisible : il le refuse poliment." },
            { id: "h", emoji: "8️⃣", label: "AVEC filet — le 4e client", correct: "servi", hint: "Et voilà ce que le filet a sauvé : lui." },
            { id: "i", emoji: "9️⃣", label: "AVEC filet — le 5e client", correct: "servi", hint: "Lui aussi. Deux clients de plus pour trois lignes de code." },
            { id: "j", emoji: "🔟", label: "AVEC filet — le 2e client", correct: "servi", hint: "Avant la panne, avec ou sans filet, c'est pareil." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Le programme raconté",
    description: "Six phrases sur une file de trois papiers, dont un illisible.",
    blocs: [
      {
        type: "text",
        content: {
          html:
            "<p>🤖 <strong>Kodi te parle</strong></p><p>Les papiers sont <code>[\"500\", \"mille\", \"700\"]</code>. Le programme est celui-ci.</p>" +
            "<pre><code>1  caisse = 0\n" +
            "2  for papier in papiers:\n" +
            "3      try:\n" +
            "4          caisse = caisse + int(papier)\n" +
            "5          encaisser(papier)\n" +
            "6      except ValueError:\n" +
            "7          refuser(papier)\n" +
            "8  print(caisse)</code></pre>" +
            "<p>Ne le modifie pas. Compte avec Python.</p>",
        },
      },
      {
        type: "fill_blank",
        content: {
          title: "Déroule la file",
          instruction: "Complète chaque phrase sur le programme affiché au-dessus.",
          sentences: [
            { id: "s1", before: "La boucle fait", after: "tours.", options: ["3", "2", "1"], correct: 0,
              explanation: "Un tour par papier, et le filet n'en saute aucun : il ne saute que la fin d'un tour." },
            { id: "s2", before: "La ligne 7 tourne", after: ".", options: ["une seule fois", "trois fois", "jamais"], correct: 0,
              explanation: "Une seule, au tour de « mille » — le seul papier qui casse." },
            { id: "s3", before: "La ligne 5 tourne", after: ".", options: ["deux fois", "trois fois", "une fois"], correct: 0,
              explanation: "Pour 500 et pour 700. Au tour de « mille », elle est sautée." },
            { id: "s4", before: "À la fin, caisse vaut", after: ".", options: ["1200", "1700", "2200"], correct: 0,
              explanation: "500 + 700. « mille » n'entre pas dans la caisse, et c'est exactement ce qu'on voulait." },
            { id: "s5", before: "Sans le try ni le except, la ligne 8 afficherait", after: ".",
              options: ["rien — le programme serait mort avant", "1200", "500"], correct: 0,
              explanation: "L'erreur au deuxième tour emporte la boucle, le print, et tout le reste." },
            { id: "s6", before: "Si « mille » était le dernier papier, la caisse vaudrait", after: ".",
              options: ["1200, la même chose", "1700", "0"], correct: 0,
              explanation: "L'ordre ne change rien quand il y a un filet. Sans filet, par contre, il changerait tout." },
          ],
        },
      },
    ],
  },

  {
    palier: 2,
    title: "Trois filets troués",
    description: "Trois programmes qui ont l'air protégés. Aucun ne l'est.",
    blocs: [
      kodi(
        "<p>Un <code>try</code> écrit ne veut pas dire protégé. Ces trois-là ont tous un filet, et tous les trois s'éteignent ou mentent.</p>"
      ),
      jeu({
        game_type: "bug_hunt",
        title: "Celui dont le filet est vide",
        context: "Le filet est écrit juste au-dessus. Et pourtant la boutique s'éteint sur le papier illisible.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 3,
        fix: "        caisse = caisse + int(papier)",
        explanation: "La ligne dangereuse est en dehors du try : l'abri est vide. Un filet ne protège que ce qu'on met dedans.",
        instructions: [
          "    try:",
          '        propre = papier.replace(" ", "")',
          "    except ValueError:",
          "    caisse = caisse + int(papier)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui attend la mauvaise erreur",
        context: "Le papier dit « mille ». Le filet est bien autour de la ligne. La boutique s'éteint quand même.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 2,
        fix: "    except ValueError:",
        explanation: "Ce filet attend une erreur de fichier. Celle qui arrive est une ValueError : il la laisse passer sans la voir. On nomme l'erreur qu'on attend, et il faut nommer la bonne.",
        instructions: [
          "    try:",
          "        caisse = caisse + int(papier)",
          "    except FileNotFoundError:",
          "        refuser(papier)",
        ],
      }),
      jeu({
        game_type: "bug_hunt",
        title: "Celui qui compte un refus comme un client",
        context: "La lumière reste allumée, personne ne plante. Et le soir, le patron compte cinq clients servis alors qu'il n'y en a eu que trois.",
        description: "Une seule ligne est fausse — clique dessus.",
        bug_index: 4,
        fix: "        refuses = refuses + 1",
        explanation: "Le filet attrape, puis incrémente le compteur des servis. Rattraper, c'est décider — et décider, c'est compter du bon côté.",
        instructions: [
          "    try:",
          "        caisse = caisse + int(papier)",
          "        servis = servis + 1",
          "    except ValueError:",
          "        servis = servis + 1",
        ],
      }),
    ],
  },

  {
    palier: 2,
    title: "Le symptôme et sa cause",
    description: "Sept pannes. Pour chacune, la ligne qui l'a provoquée.",
    blocs: [
      kodi("<p>Un programmeur ne devine pas : <strong>il lit le symptôme et il remonte à la cause</strong>. Ces sept-là reviennent dès qu'on pose un filet.</p>"),
      {
        type: "match",
        content: {
          title: "Le symptôme et sa cause",
          instruction: "Touche un symptôme, puis la cause qui va avec.",
          left_label: "Ce que tu vois",
          right_label: "Ce qui s'est passé",
          pairs: [
            { left: "La boutique s'éteint malgré le try", right: "La ligne dangereuse est restée en dehors" },
            { left: "Elle s'éteint, et le filet existe bien autour", right: "Le except attend une autre erreur que celle qui arrive" },
            { left: "Le tiroir sonne pour un papier illisible", right: "encaisser() est appelé après le except, pas dedans" },
            { left: "La caisse est plus grosse que la réalité", right: "Le except ajoute un montant inventé" },
            { left: "Le compte des servis est trop grand", right: "Le compteur monte aussi dans le except" },
            { left: "Personne ne sait combien de papiers ont été refusés", right: "Le except ne compte rien du tout" },
            { left: "Python refuse de lancer le programme", right: "Un except sans la moindre ligne en dessous" },
          ],
        },
      },
    ],
  },

  {
    palier: 3,
    title: "🏪 La file du dimanche",
    description: "Cinq papiers, trois illisibles. Sans filet, la caisse reste à zéro.",
    blocs: [
      kodi(
        "<p>Le dimanche, les clients écrivent plus mal que les autres jours. Sur cinq papiers, <strong>trois sont en toutes lettres</strong>.</p>" +
        "<p>Sans filet, le deuxième éteint tout et la caisse du jour est vide. Avec un filet, il reste quelque chose.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>Cinq papiers : <code>2 400</code>, <code>sept cents</code>, <code>1800</code>, <code>mille cinq</code>, <code>trois mille</code>.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — encaisser les lisibles, refuser les autres, et annoncer la caisse et le nombre de refusés.<br>" +
            "🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, <code>encaisser</code>, <code>refuser</code>, le filet et <code>.replace()</code>.<br>" +
            `✅ <strong>C'est réussi quand</strong> — la caisse affiche ${CAISSE}, avec ${REFUSES.length} papiers refusés, et que la lumière est restée allumée.</p>`,
          scene: { decor: "etal", reglages: { papiers: DIMANCHE }, plafond: 200 },
          starter_code:
            "caisse = 0\nrefuses = 0\n\n" +
            "# Trois papiers sur cinq vont casser. Le filet est la pour ca.\n",
          hidden_tests:
            "import re\n" +
            'enc = [e for e in _journal if e["quoi"] == "encaisser"]\n' +
            'ref = [e for e in _journal if e["quoi"] == "refuser"]\n' +
            'assert "try" in code and "except" in code, "Trois papiers illisibles : sans filet, tout s eteint au deuxieme."\n' +
            `assert len(enc) == ${SERVIS.length}, "Il y a ${SERVIS.length} papiers lisibles : ton programme en a encaisse " + str(len(enc)) + "."\n` +
            `assert len(ref) == ${REFUSES.length}, "Il y a ${REFUSES.length} papiers illisibles : ton programme en a refuse " + str(len(ref)) + "."\n` +
            'lignes = [l for l in output.split("\\n") if l.strip()]\n' +
            'nombres = re.findall(r"\\d+", " ".join(lignes[-3:]))\n' +
            `assert "${CAISSE}" in nombres, "La caisse du dimanche fait ${CAISSE} F. La fin de ta sortie montre : " + (" ".join(nombres) or "aucun nombre")\n` +
            `assert "${REFUSES.length}" in nombres, "Il faut annoncer les ${REFUSES.length} papiers refuses."`,
        },
      },
    ],
  },

  {
    palier: 3,
    title: "Le carnet qui ne meurt pas",
    description: "Une saisie illisible ne doit plus jamais arrêter ton carnet.",
    blocs: [
      kodi(
        "<p>Ton carnet de ventes mourait dès qu'on tapait de travers. Cette fois, il doit tenir — <strong>et dire ce qu'il n'a pas compris</strong>.</p>" +
        "<p>Attention à un détail : la question se repose <em>en dehors</em> du filet. Dedans, une saisie illisible la sauterait, et la boucle tournerait pour toujours.</p>"
      ),
      {
        type: "code_challenge",
        content: {
          language: "python",
          required: true,
          instructions:
            "<p>On saisit des montants l'un après l'autre jusqu'à <code>fin</code>. Certains ne sont pas des nombres.</p>" +
            "<p>🎯 <strong>Ta mission</strong> — additionner ce qui est lisible, dire <code>Je n'ai pas compris</code> sur le reste, et annoncer le total et le nombre de saisies incomprises.<br>" +
            "🧰 <strong>Tu as</strong> — la boucle qui attend, le filet, et deux compteurs.<br>" +
            "✅ <strong>C'est réussi quand</strong> — le programme ne meurt jamais, et que le total ignore ce qu'il n'a pas compris.</p>" +
            "<p>⚠️ Repose la question <strong>en dehors</strong> du filet.</p>",
          starter_code:
            "total = 0\n" +
            "incompris = 0\n" +
            'reponse = input("Montant (ou fin) : ")\n\n' +
            "# Tant que ce n'est pas fin : essaie d'ajouter, sinon compte et dis-le.\n",
          hidden_tests:
            "import re\n" +
            'assert "while" in code, "Tu ne sais pas combien de saisies il y aura."\n' +
            'assert "try" in code and "except" in code, "Une saisie illisible ne doit plus tuer le carnet."\n' +
            'assert output.lower().count("pas compris") == 2, "Deux saisies etaient illisibles : le message doit sortir deux fois."\n' +
            'nombres = re.findall(r"\\d+", output)\n' +
            'assert "3700" in nombres, "1200 + 2500 font 3700. Les mots ne comptent pas."\n' +
            'assert "2" in nombres, "Il faut annoncer les 2 saisies incomprises."',
        },
      },
    ],
  },
];

const PRELUDE_ETAL =
  "_journal = []\n" +
  "papiers = " + JSON.stringify(DIMANCHE) + "\n" +
  "def encaisser(p):\n" + '    _journal.append({"quoi": "encaisser", "papier": str(p)})\n' +
  "def refuser(p):\n" + '    _journal.append({"quoi": "refuser", "papier": str(p)})\n';

const SOLUTIONS = {
  "🏪 La file du dimanche": {
    prelude: PRELUDE_ETAL,
    cas: [
      { nom: "juste", attendu: "ok", code:
        "caisse = 0\nrefuses = 0\n" +
        "for papier in papiers:\n    try:\n" +
        '        p = papier.replace(" ", "")\n        caisse = caisse + int(p)\n        encaisser(papier)\n' +
        "    except ValueError:\n        refuses = refuses + 1\n        refuser(papier)\n" +
        'print("Caisse :", caisse)\nprint("Refuses :", refuses)\n' },
      { nom: "sans filet", attendu: "plante", code:
        "caisse = 0\nfor papier in papiers:\n" +
        '    p = papier.replace(" ", "")\n    caisse = caisse + int(p)\n    encaisser(papier)\n' +
        'print("Caisse :", caisse)\n' },
      { nom: "encaisse aussi les refuses", attendu: "test raté", code:
        "caisse = 0\nrefuses = 0\n" +
        "for papier in papiers:\n    try:\n" +
        '        p = papier.replace(" ", "")\n        caisse = caisse + int(p)\n' +
        "    except ValueError:\n        refuses = refuses + 1\n        refuser(papier)\n" +
        "    encaisser(papier)\n" +
        'print("Caisse :", caisse)\nprint("Refuses :", refuses)\n' },
    ],
  },
  "Le carnet qui ne meurt pas": {
    reponses: ["1200", "deux mille", "2500", "beaucoup", "fin"],
    cas: [
      { nom: "juste", attendu: "ok", code:
        "total = 0\nincompris = 0\n" +
        'reponse = input("Montant (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    try:\n        total = total + int(reponse)\n" +
        "    except ValueError:\n        incompris = incompris + 1\n" +
        '        print("Je n\'ai pas compris")\n' +
        '    reponse = input("Montant (ou fin) : ")\n' +
        'print("Total :", total)\nprint("Incompris :", incompris)\n' },
      { nom: "sans filet", attendu: "plante", code:
        "total = 0\n" +
        'reponse = input("Montant (ou fin) : ")\n' +
        'while reponse != "fin":\n    total = total + int(reponse)\n' +
        '    reponse = input("Montant (ou fin) : ")\n' +
        'print("Total :", total)\n' },
      { nom: "oublie de compter les incompris", attendu: "test raté", code:
        "total = 0\n" +
        'reponse = input("Montant (ou fin) : ")\n' +
        'while reponse != "fin":\n' +
        "    try:\n        total = total + int(reponse)\n" +
        "    except ValueError:\n" +
        '        print("Je n\'ai pas compris")\n' +
        '    reponse = input("Montant (ou fin) : ")\n' +
        'print("Total :", total)\n' },
    ],
  },
};

verifier(EXOS, {
  interdits: [/\bbreak\b/, /\bTrue\b/, /\bFalse\b/, /\bclass\b/, /(^|[\s(=+])f"/, /\+=/,
    /\.split\(/, /\.join\(/, /\.upper\(/, /\bopen\(/, /\bfinally\b/, /\braise\b/,
    /\.items\(/, /enumerate\(/, /[A-Za-z_]\w*\[\s*\d+\s*\]/],
  comptes: { "Où va cette ligne ?": 12, "Jusqu'où va la file ?": 10,
             "Le programme raconté": 6, "Le symptôme et sa cause": 7 },
});
for (const e of EXOS) for (const b of e.blocs) {
  const c = b.content ?? {};
  if (/except:/.test(JSON.stringify({ ...c, hidden_tests: undefined }))) throw new Error(`${e.title} : un except sans nom d'erreur`);
  if (b.type !== "code_challenge") continue;
  for (const champ of ["Ta mission", "Tu as", "C'est réussi quand"])
    if (!c.instructions.includes(champ)) throw new Error(`${e.title} : le sujet n'a pas de « ${champ} »`);
}
(process.argv.includes("--banc") ? console.error : console.log)(
  `✓ dimanche vérifié : ${CAISSE} F, ${SERVIS.length} servis, ${REFUSES.length} refusés`);

if (process.argv.includes("--banc")) { console.log(JSON.stringify(banc(EXOS, SOLUTIONS))); process.exit(0); }
await appliquer(db, g, LECON, EXOS, {
  ecrire: process.argv.includes("--ecrire"), refaire: process.argv.includes("--refaire"),
});
