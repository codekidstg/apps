/**
 * Les corrigés des défis de code, pour les mentors et la direction.
 *
 * Chaque défi de code (code_challenge) reçoit son corrigé : un programme écrit
 * au niveau de l'enfant — les variables du code de départ, rien que ce que la
 * leçon a déjà montré. La fiche de l'exercice l'affiche au mentor quand un
 * enfant appuie sur « Je bloque ici » (src/lib/questions/corrige.ts).
 *
 * Il est rangé dans corriges_exercices (migration 033), que seul le serveur
 * lit : jamais dans le contenu de l'exercice, qui part vers l'enfant.
 *
 * Avant toute écriture, chaque corrigé passe par le correcteur, rejoué en
 * Python (scripts/banc-correcteur.py) avec les tests tels qu'ils sont en
 * base ; le code de départ, lui, doit échouer — sinon le défi se validerait
 * tout seul. Un seul écart, et rien n'est écrit.
 *
 * Les trois défis sans tests (« lance ce programme et réponds-lui ») sont
 * des défis d'exploration : ils n'ont pas de corrigé.
 *
 *     node scripts/corriges-defis-code.mjs                                   vérifie, sans rien écrire
 *     node scripts/corriges-defis-code.mjs --ecrire --sauvegarde=avant.json  écrit, après avoir gardé l'existant
 */
import fs from "fs";
import { spawnSync } from "child_process";
import { createClient } from "@supabase/supabase-js";

const CORRIGES = [
  {
    id: "24e9ee3f-1c96-47c0-9967-4131cbe69edf", table: "training_blocks",
    titre: "0.0 Mon premier programme › Ta carte de visite parlante",
    reponses: ["Ama"],
    solution: "prenom = input(\"Comment tu t'appelles ? \")\nprint(\"Bonjour \" + prenom + \" !\")\nprint(\"Moi, j'apprends a programmer en Python.\")\n",
  },
  {
    id: "5ca4f899-02ff-4fae-ad44-8e44b301d776", table: "training_blocks",
    titre: "0.0 Mon premier programme › Le grand chantier",
    reponses: [],
    solution: "print(\"=== MON CARNET ===\")\nprint(\"Aujourd'hui j'apprends Python.\")\nprint(\"C'est ma premiere semaine.\")\nprint(\"Et je repare deja des bugs !\")\nprint(\"=== FIN ===\")\n",
  },
  {
    id: "31f30eaf-697d-4e12-aced-2ebbfe3a49a7", table: "lesson_blocks",
    titre: "0.0 Mon premier programme",
    reponses: [],
    solution: "print(\"Programme de bienvenue\")\nprint(\"Installe-toi confortablement.\")\nprint(\"On commence dans une minute.\")\n",
  },
  {
    id: "65cf7d3d-bef3-46a8-a63c-ae050159911a", table: "lesson_blocks",
    titre: "0.0 Mon premier programme",
    reponses: [],
    solution: "print(\"Je m'appelle Kofi.\")\nprint(\"J'ai 12 ans.\")\nprint(\"Plus tard, je veux creer des jeux video.\")\n",
  },
  {
    id: "221254ef-7f9a-4b1b-bab6-71beb7916308", table: "lesson_blocks",
    titre: "0.0 Mon premier programme",
    reponses: [],
    solution: "print(\"Je suis un programme.\")\nprint(\"Je m'appelle Kodi.\")\nprint(\"Je sais afficher du texte et faire des calculs.\")\nprint(\"Voici ma blague :\")\nprint(\"Pourquoi l'ordinateur va chez le docteur ?\")\nprint(\"Parce qu'il a attrape un virus !\")\n",
  },
  {
    id: "8f4ca868-286a-48ec-ba51-f3652edec9f7", table: "training_blocks",
    titre: "1.1 Garder une information › La calculette cassée",
    reponses: ["6560"],
    solution: "print(\"=== CONVERTISSEUR FCFA ===\")\nprix = int(input(\"Prix en FCFA : \"))\neuros = prix / 656\nprint(\"Ca fait\", euros, \"euros.\")\n",
  },
  {
    id: "e4ca39bb-0718-4081-822a-9a6abbd46d0e", table: "lesson_blocks",
    titre: "1.1 Garder une information",
    reponses: ["5"],
    solution: "print(\"=== CALCULATRICE ===\")\nnombre = int(input(\"Donne-moi un nombre : \"))\nresultat = nombre + 10\nprint(\"Le resultat est\", resultat)\n",
  },
  {
    id: "47b82f24-7f8e-4ab4-9d21-ff4606f1af2f", table: "lesson_blocks",
    titre: "1.1 Garder une information",
    reponses: ["4"],
    solution: "nombre = int(input(\"Donne-moi un nombre : \"))\nprint(\"Le double :\", nombre * 2)\nprint(\"Le triple :\", nombre * 3)\nprint(\"Le carre :\", nombre * nombre)\n",
  },
  {
    id: "2811c915-7102-42d3-8f65-4ac3840a7f5b", table: "lesson_blocks",
    titre: "1.1 Garder une information",
    reponses: ["1312"],
    solution: "prix = int(input(\"Prix en FCFA : \"))\nprint(\"En euros :\", prix / 656)\nprint(\"Pour 3 articles :\", prix * 3, \"FCFA\")\n",
  },
  {
    id: "4c36e26a-3026-4dc2-95ab-a18e3b5c7b54", table: "training_blocks",
    titre: "2.2 Choisir › Le portier cassé",
    reponses: ["ouvre-toi"],
    solution: "mot = input(\"Mot de passe ? \")\n\nif mot == \"ouvre-toi\":\n    print(\"Entre, ami.\")\nelse:\n    print(\"Va-t'en.\")\n",
  },
  {
    id: "aa825f73-249a-4768-8fb9-8457fdc763fe", table: "lesson_blocks",
    titre: "2.2 Choisir",
    reponses: ["20"],
    solution: "age = int(input(\"Ton age ? \"))\n\nif age >= 18:\n    print(\"Tu es majeur.\")\nelse:\n    print(\"Tu es mineur.\")\n",
  },
  {
    id: "17ad3271-75b0-4ab2-89d6-1e9fc96fd5cc", table: "lesson_blocks",
    titre: "2.2 Choisir",
    reponses: ["jour"],
    solution: "reponse = input(\"Tu preferes le jour ou la nuit ? \")\n\nif reponse == \"jour\":\n    print(\"Tu es comme le soleil : debout de bonne heure !\")\nelse:\n    print(\"Tu es comme la chouette : tu vis la nuit !\")\n",
  },
  {
    id: "43916e76-e2b9-4c16-a382-92245d1d403a", table: "lesson_blocks",
    titre: "3.3 Répéter",
    reponses: [],
    solution: "print(\"Compte a rebours du lancement :\")\n\nfor tour in range(5):\n    print(5 - tour)\n\nprint(\"Decollage !\")\n",
  },
  {
    id: "216f452a-12ac-4bc6-86e5-ab343137c090", table: "lesson_blocks",
    titre: "3.3 Répéter",
    reponses: [],
    solution: "for tour in range(5):\n    print(\"*\" * (tour + 1))\n",
  },
  {
    id: "27d9a903-b902-47ef-8caf-3f8fd017f0e7", table: "training_blocks",
    titre: "4.4 🔧 Le bug qui ne dit rien › La chasse silencieuse",
    reponses: [],
    solution: "total = 0\n\nfor versement in range(5):\n    total = total + 1000\n\nprint(\"Total de la tontine :\", total, \"F\")\n",
  },
  {
    id: "7d37902d-b9e8-4d9f-b5ca-d1fbe143b677", table: "training_blocks",
    titre: "4.4 🔧 Le bug qui ne dit rien › Cinq variables pour rien",
    reponses: [],
    solution: "prix1 = 1500\nprix2 = 800\nprix3 = 2300\nprix4 = 450\nprix5 = 1200\n\ntotal = prix1 + prix2 + prix3 + prix4 + prix5\nprint(\"Total :\", total, \"F\")\n",
  },
  {
    id: "196315c8-b539-46a7-b992-54c89e3bc199", table: "lesson_blocks",
    titre: "4.4 🔧 Le bug qui ne dit rien",
    reponses: [],
    solution: "for tour in range(4):\n    print(\"Tour\", tour)\n    print(\"Bonjour\")\n",
  },
  {
    id: "1c2c4ec7-20c2-4b9e-a2b3-c4cdecfb18c2", table: "lesson_blocks",
    titre: "4.4 🔧 Le bug qui ne dit rien",
    reponses: ["2000", "2500", "1000"],
    solution: "total = 0\n\nfor article in range(3):\n    prix = int(input(\"Prix de l'article : \"))\n    total = total + prix\n\nprint(\"Total :\", total, \"F\")\n\nif total > 5000:\n    print(\"Attention, tu depasses le budget !\")\n",
  },
  {
    id: "e0f410b3-9c79-486b-b0d0-8ab7ce1427da", table: "training_blocks",
    titre: "0.0 Les listes › Le panier qui grandit",
    reponses: [],
    solution: "versements = []\nversements.append(1000)\nversements.append(1500)\nversements.append(2000)\n\nprint(versements)\n\ntotal = 0\nfor v in versements:\n    total = total + v\n\nprint(\"Total :\", total, \"F\")\nprint(\"Nombre de versements :\", len(versements))\n",
  },
  {
    id: "04ea757e-5771-409c-a34c-c2bbbee20d90", table: "training_blocks",
    titre: "0.0 Les listes › Trois fois la même politesse",
    reponses: [],
    solution: "print(\"========================\")\nprint(\"  MES MATIERES\")\nprint(\"========================\")\nprint(\"Maths, Francais, Anglais\")\n\nprint(\"========================\")\nprint(\"  MES NOTES\")\nprint(\"========================\")\nprint(\"Maths : 15, Francais : 12, Anglais : 14\")\n\nprint(\"========================\")\nprint(\"  MES OBJECTIFS\")\nprint(\"========================\")\nprint(\"Progresser en anglais et finir mon jeu en Python\")\n",
  },
  {
    id: "932ed5d6-90d1-43e1-9b30-77f81b08ca38", table: "training_blocks",
    titre: "0.0 Les listes › Une question sur chaque valeur",
    reponses: [],
    solution: "notes = [12, 8, 15, 6, 11]\nreussites = []\n\nfor note in notes:\n    if note >= 10:\n        reussites.append(note)\n\nprint(\"Reussites :\", reussites)\nprint(\"Nombre de reussites :\", len(reussites))\n",
  },
  {
    id: "cf0044b2-5fdb-45f3-bb81-4f4811cab538", table: "lesson_blocks",
    titre: "0.0 Les listes",
    reponses: [],
    solution: "courses = []\ncourses.append(\"riz\")\ncourses.append(\"tomates\")\ncourses.append(\"pain\")\n\nprint(courses)\nprint(\"Nombre d'articles :\", len(courses))\n",
  },
  {
    id: "bd3ae0ca-4b61-43fa-ae91-c47f057af32e", table: "lesson_blocks",
    titre: "0.0 Les listes",
    reponses: [],
    solution: "temperatures = [31, 28, 35, 33, 27]\n\nfor t in temperatures:\n    print(\"Jour :\", t)\n    if t > 32:\n        print(\"Chaud :\", t)\n",
  },
  {
    id: "c7eeb4d5-0136-4f9b-8cb9-e44f49ba1da0", table: "lesson_blocks",
    titre: "0.0 Les listes",
    reponses: [],
    solution: "prix = [1500, 800, 2300, 450, 1200]\ntotal = 0\n\nfor p in prix:\n    total = total + p\n    if p > 2000:\n        print(\"Attention, cet article depasse 2000 F :\", p)\n\nprint(\"Total :\", total, \"F\")\n",
  },
  {
    id: "cfae9b8d-cc7e-425d-9939-9d7d52105acf", table: "training_blocks",
    titre: "1.1 Mes propres commandes › Le cadre qui sert partout",
    reponses: [],
    solution: "def titre(mot):\n    print(\"*****\")\n    print(mot)\n    print(\"*****\")\n\ntitre(\"LUNDI\")\ntitre(\"MARDI\")\ntitre(\"MERCREDI\")\ntitre(\"JEUDI\")\n",
  },
  {
    id: "523cf23c-6ab2-44db-8362-0b97577208da", table: "training_blocks",
    titre: "1.1 Mes propres commandes › La fonction qui ne répond pas",
    reponses: [],
    solution: "panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef affiche_total(prix):\n    total = 0\n    for p in prix:\n        total = total + p\n    print(\"Total :\", total, \"F\")\n\naffiche_total(panier_ama)\naffiche_total(panier_kofi)\n",
  },
  {
    id: "8847683b-b2aa-42fd-b272-6d96f2f7fe61", table: "lesson_blocks",
    titre: "1.1 Mes propres commandes",
    reponses: [],
    solution: "def cadre(titre):\n    print(\"========================\")\n    print(\"  \" + titre)\n    print(\"========================\")\n\ncadre(\"MES MATIERES\")\ncadre(\"MES NOTES\")\n",
  },
  {
    id: "901addd5-086f-478b-995b-98b617c36271", table: "lesson_blocks",
    titre: "1.1 Mes propres commandes",
    reponses: [],
    solution: "def cadre(titre):\n    print(\"========================\")\n    print(\"  \" + titre)\n    print(\"========================\")\n\ncadre(\"MES MATIERES\")\nprint(\"Maths, Francais, Anglais\")\n\ncadre(\"MES NOTES\")\nprint(\"Maths : 15, Francais : 12, Anglais : 14\")\n\ncadre(\"MES OBJECTIFS\")\nprint(\"Progresser en anglais et finir mon jeu en Python\")\n",
  },
  {
    id: "65a74f61-ff89-4fcd-b48c-ad3d21cc2f44", table: "lesson_blocks",
    titre: "2.2 Fonctions qui répondent",
    reponses: [],
    solution: "panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef total(prix):\n    somme = 0\n    for p in prix:\n        somme = somme + p\n    return somme\n\ntotal_ama = total(panier_ama)\ntotal_kofi = total(panier_kofi)\n\nif total_ama > total_kofi:\n    print(\"Le panier d'Ama est le plus cher.\")\nelse:\n    print(\"Le panier de Kofi est le plus cher.\")\n",
  },
  {
    id: "2efbe702-bcfb-40ff-adb7-277c08b33aa8", table: "training_blocks",
    titre: "2.2 Fonctions qui répondent › Une fonction qui en appelle une autre",
    reponses: [],
    solution: "paniers = [1000, 2000, 500]\n\ndef avec_taxe(prix):\n    return prix + prix // 10\n\ndef total_ttc(prix):\n    total = 0\n    for p in prix:\n        total = total + avec_taxe(p)\n    return total\n\nprint(\"Total TTC :\", total_ttc(paniers), \"F\")\n",
  },
  {
    id: "8840c10e-011f-42f0-98b5-98cb39a4a6dd", table: "training_blocks",
    titre: "2.2 Fonctions qui répondent › Le prix sans nom",
    reponses: [],
    solution: "def ligne(nom, prix):\n    return nom + \" : \" + str(prix) + \" F\"\n\nprint(ligne(\"Riz\", 1500))\nprint(ligne(\"Huile\", 2300))\nprint(ligne(\"Savon\", 800))\n",
  },
  {
    id: "2b7edd54-caa6-4701-b77a-1fd8f1512761", table: "training_blocks",
    titre: "2.2 Fonctions qui répondent › Le None silencieux",
    reponses: [],
    solution: "def carre(n):\n    return n * n\n\nprint(carre(5) + carre(3))\n",
  },
  {
    id: "c8427014-f503-44d8-8624-85b96144d35c", table: "lesson_blocks",
    titre: "2.2 Fonctions qui répondent",
    reponses: [],
    solution: "panier = [1500, 800, 2300, 450, 1200]\n\ndef total(prix):\n    somme = 0\n    for p in prix:\n        somme = somme + p\n    return somme\n\ndef moyenne(prix):\n    return total(prix) / len(prix)\n\ndef verdict(m):\n    if m > 1000:\n        return \"Cher\"\n    else:\n        return \"Raisonnable\"\n\nm = moyenne(panier)\nprint(\"Total :\", total(panier))\nprint(\"Moyenne :\", m)\nprint(\"Verdict :\", verdict(m))\n",
  },
  {
    id: "53d23a5d-a7c0-401a-b316-7aa4110b69bc", table: "lesson_blocks",
    titre: "2.2 Fonctions qui répondent",
    reponses: [],
    solution: "panier_ama  = [1500, 800, 2300]\npanier_kofi = [1200, 2500, 700]\n\ndef total(prix):\n    somme = 0\n    for p in prix:\n        somme = somme + p\n    return somme\n\ndef plus_cher(nom_a, prix_a, nom_b, prix_b):\n    if prix_a > prix_b:\n        return nom_a\n    else:\n        return nom_b\n\ngagnant = plus_cher(\"Ama\", total(panier_ama), \"Kofi\", total(panier_kofi))\nprint(\"Le panier le plus cher est celui de\", gagnant)\n",
  }
];

const env = Object.fromEntries(fs.readFileSync(".env.local", "utf8").split("\n")
  .filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")).trim(), l.slice(l.indexOf("=") + 1).trim().replace(/^"|"$/g, "")]));
const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const ecrire = process.argv.includes("--ecrire");
const sauvegarde = process.argv.find((a) => a.startsWith("--sauvegarde="))?.split("=")[1];
if (ecrire && !sauvegarde) {
  console.error("--ecrire demande --sauvegarde=<fichier> : l'existant doit être gardé avant d'écrire.");
  process.exit(1);
}
const colonne = (table) => (table === "lesson_blocks" ? "lesson_block_id" : "training_block_id");

// 1. Les défis tels qu'ils sont en base.
const blocs = new Map();
for (const table of ["lesson_blocks", "training_blocks"]) {
  const ids = CORRIGES.filter((c) => c.table === table).map((c) => c.id);
  const { data, error } = await db.from(table).select("id, type, content").in("id", ids);
  if (error) throw new Error(`${table} : ${error.message}`);
  for (const b of data) blocs.set(b.id, b);
}
const manquants = CORRIGES.filter((c) => !blocs.has(c.id) || blocs.get(c.id).type !== "code_challenge" || !blocs.get(c.id).content?.hidden_tests);
if (manquants.length) {
  console.error("Défis introuvables, réécrits ou sans tests — rien n'est écrit :");
  for (const m of manquants) console.error(`  ${m.titre} (${m.id})`);
  process.exit(1);
}

// 2. Le correcteur : chaque corrigé passe, chaque code de départ échoue.
const cas = CORRIGES.flatMap((c) => {
  const contenu = blocs.get(c.id).content;
  return [
    { code: c.solution, tests: contenu.hidden_tests, reponses: c.reponses },
    { code: contenu.starter_code ?? "", tests: contenu.hidden_tests, reponses: c.reponses },
  ];
});
const banc = spawnSync("python3", ["scripts/banc-correcteur.py"], { input: JSON.stringify(cas), encoding: "utf8" });
if (banc.status !== 0) throw new Error(`Le banc Python a échoué : ${banc.stderr}`);
const resultats = JSON.parse(banc.stdout);
let ecarts = 0;
CORRIGES.forEach((c, i) => {
  const corrige = resultats[2 * i], depart = resultats[2 * i + 1];
  const bon = corrige.verdict === "ok" && depart.verdict !== "ok";
  if (!bon) ecarts++;
  console.log(`${bon ? "OK   " : "ÉCART"} ${c.titre}`);
  if (corrige.verdict !== "ok") console.log(`        corrigé : ${corrige.verdict} — ${corrige.detail}`);
  if (depart.verdict === "ok") console.log("        le code de départ passe déjà les tests");
});
console.log(`\n${CORRIGES.length - ecarts} corrigés sur ${CORRIGES.length} passent le correcteur.`);
if (ecarts) {
  console.error("Un écart : rien n'est écrit.");
  process.exit(1);
}

// 3. La table réservée au serveur doit exister (migration 033).
const existants = [];
for (const table of ["lesson_blocks", "training_blocks"]) {
  const ids = CORRIGES.filter((c) => c.table === table).map((c) => c.id);
  const { data, error } = await db.from("corriges_exercices").select("*").in(colonne(table), ids);
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    console.log(ecrire
      ? "La table corriges_exercices n'existe pas : passez d'abord la migration 033 (supabase/migrations/033_corriges_exercices.sql)."
      : "\nLa table corriges_exercices n'existe pas encore : migration 033 à passer avant d'écrire.");
    process.exit(ecrire ? 1 : 0);
  }
  if (error) throw new Error(`corriges_exercices : ${error.message}`);
  existants.push(...data);
}
if (!ecrire) {
  console.log(`\n${existants.length} corrigé(s) déjà en base. Aperçu seulement. Pour écrire : --ecrire --sauvegarde=<fichier>`);
  process.exit(0);
}

// 4. L'existant d'abord, puis les corrigés, puis la relecture.
fs.writeFileSync(sauvegarde, JSON.stringify(existants, null, 1));
console.log(`Existant gardé dans ${sauvegarde} (${existants.length} ligne(s)).`);
const maintenant = new Date().toISOString();
for (const table of ["lesson_blocks", "training_blocks"]) {
  const lignes = CORRIGES.filter((c) => c.table === table).map((c) => ({ [colonne(table)]: c.id, solution: c.solution, verifie_le: maintenant }));
  const { error } = await db.from("corriges_exercices").upsert(lignes, { onConflict: colonne(table) });
  if (error) throw new Error(`Écriture ${table} : ${error.message}`);
}
let relus = 0;
for (const table of ["lesson_blocks", "training_blocks"]) {
  const ids = CORRIGES.filter((c) => c.table === table).map((c) => c.id);
  const { data } = await db.from("corriges_exercices").select(`${colonne(table)}, solution`).in(colonne(table), ids);
  for (const r of data) if (r.solution === CORRIGES.find((c) => c.id === r[colonne(table)]).solution) relus++;
}
console.log(`${relus} corrigés sur ${CORRIGES.length} relus en base.`);
