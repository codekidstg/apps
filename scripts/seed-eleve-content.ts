/**
 * Seed contenu Espace Élève — 4 zones × 3 leçons dans "Introduction à Python"
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-eleve-content.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const THEME_ID = "08ede49c-2b54-4bae-90b7-c786aa020770";

type Block = { type: string; content: unknown; order_index: number };

async function upsertChapter(title: string, description: string, order_index: number) {
  const { data: ex } = await sb.from("chapters").select("id").eq("theme_id", THEME_ID).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await sb.from("chapters").insert({ theme_id: THEME_ID, title, description, order_index }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function upsertLesson(chapterId: string, title: string, order_index: number, xp_reward = 50) {
  const { data: ex } = await sb.from("lessons").select("id").eq("chapter_id", chapterId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  // Get theme_id from chapter
  const { data: ch } = await sb.from("chapters").select("theme_id").eq("id", chapterId).single<{ theme_id: string }>();
  const { data, error } = await sb.from("lessons").insert({ chapter_id: chapterId, theme_id: ch!.theme_id, title, order_index, xp_reward }).select("id").single();
  if (error) throw error;
  return (data as { id: string }).id;
}

async function seedBlocks(lessonId: string, blocks: Block[]) {
  const { count } = await sb.from("lesson_blocks").select("id", { count: "exact", head: true }).eq("lesson_id", lessonId);
  if ((count ?? 0) > 0) return;
  const { data: lesson } = await sb.from("lessons").select("theme_id").eq("id", lessonId).single<{ theme_id: string }>();
  const rows = blocks.map(b => ({ ...b, lesson_id: lessonId, theme_id: lesson!.theme_id }));
  const { error } = await sb.from("lesson_blocks").insert(rows);
  if (error) throw error;
}

async function main() {
  console.log("🌱 Seed contenu Espace Élève...");

  // ── Zone 1 : La Place du Code (chapter existant) ──────────────────────────
  const ch1 = await upsertChapter("La Place du Code", "Variables, types et affichage — les fondations de ta cité.", 0);
  console.log("✓ Ch1 Place du Code:", ch1);

  const l1 = await upsertLesson(ch1, "Les variables en Python", 0, 50);
  await seedBlocks(l1, [
    { type: "text", content: { html: "<h2>Les variables en Python</h2><p>Une <strong>variable</strong> est une boîte qui stocke une valeur. Tu donnes un nom à cette boîte pour la retrouver plus tard.</p><pre>nom = \"Amavi\"\nage = 12</pre><p>Ici on a créé deux variables : <code>nom</code> qui contient un texte, et <code>age</code> qui contient un nombre.</p>" }, order_index: 0 },
    { type: "quiz", content: { question: "Qu'est-ce qu'une variable ?", choices: ["Une boîte qui stocke une valeur", "Un type de boucle", "Une couleur de code", "Un fichier Python"], answer: 0, explanation: "Exactement ! Une variable est comme une boîte étiquetée qui garde une valeur en mémoire." }, order_index: 1 },
    { type: "text", content: { html: "<h3>🏗️ Ta première brique !</h3><p>Tu viens de poser la première pierre de ta cité numérique. Les variables sont les <strong>briques de base</strong> de tous les programmes.</p>" }, order_index: 2 },
  ]);

  const l2 = await upsertLesson(ch1, "Les types de données", 1, 50);
  await seedBlocks(l2, [
    { type: "text", content: { html: "<h2>Les types de données</h2><p>Chaque variable a un <strong>type</strong> — comme les matériaux d'un bâtiment !</p><ul><li><code>str</code> → texte : <code>\"Bonjour\"</code></li><li><code>int</code> → nombre entier : <code>42</code></li><li><code>float</code> → nombre décimal : <code>3.14</code></li><li><code>bool</code> → vrai/faux : <code>True</code> ou <code>False</code></li></ul>" }, order_index: 0 },
    { type: "quiz", content: { question: "Quel est le type de la variable 'score = 95.5' ?", choices: ["str", "int", "float", "bool"], answer: 2, explanation: "95.5 a une virgule donc c'est un float (nombre décimal) !" }, order_index: 1 },
    { type: "quiz", content: { question: "Que vaut type(\"CodeKids\") ?", choices: ["int", "str", "bool", "float"], answer: 1, explanation: "Les guillemets indiquent que c'est une chaîne de caractères : str !" }, order_index: 2 },
  ]);

  const l3 = await upsertLesson(ch1, "Afficher un message", 2, 50);
  await seedBlocks(l3, [
    { type: "text", content: { html: "<h2>Afficher un message avec print()</h2><p>Pour faire parler ton programme, utilise <code>print()</code> !</p><pre>prenom = \"Kofi\"\nprint(\"Bonjour\", prenom)\n# Affiche : Bonjour Kofi</pre><p>Tu peux mélanger texte et variables directement dans le print.</p>" }, order_index: 0 },
    { type: "quiz", content: { question: "Que va afficher : print(\"J'ai\", 12, \"ans\") ?", choices: ["J'ai12ans", "J'ai 12 ans", "Erreur", "J'ai, 12, ans"], answer: 1, explanation: "print() ajoute automatiquement des espaces entre chaque élément séparé par une virgule." }, order_index: 1 },
    { type: "text", content: { html: "<h3>🏛️ La Place du Code est construite !</h3><p>Tu maîtrises les variables, les types et l'affichage. Le premier quartier de ta cité est vivant !</p>" }, order_index: 2 },
  ]);

  // ── Zone 2 : La Tour des Boucles ─────────────────────────────────────────
  const ch2 = await upsertChapter("La Tour des Boucles", "Répète des actions automatiquement — construis haut !", 1);
  console.log("✓ Ch2 Tour des Boucles:", ch2);

  const l4 = await upsertLesson(ch2, "La boucle for", 0, 60);
  await seedBlocks(l4, [
    { type: "text", content: { html: "<h2>La boucle for</h2><p>Imagine que tu dois empiler 10 briques. Au lieu de l'écrire 10 fois, tu utilises une <strong>boucle</strong> !</p><pre>for i in range(5):\n    print(\"Brique\", i+1)</pre><p>Ce code affiche « Brique 1 », « Brique 2 »... jusqu'à « Brique 5 ». <code>range(5)</code> génère les nombres 0, 1, 2, 3, 4.</p>" }, order_index: 0 },
    { type: "quiz", content: { question: "Combien de fois s'affiche 'Salut' avec : for i in range(3): print('Salut') ?", choices: ["1 fois", "2 fois", "3 fois", "4 fois"], answer: 2, explanation: "range(3) donne 0, 1, 2 — donc 3 itérations, 3 fois 'Salut' !" }, order_index: 1 },
    { type: "quiz", content: { question: "Quel est le premier nombre donné par range(5) ?", choices: ["1", "0", "5", "-1"], answer: 1, explanation: "En Python, range commence toujours à 0 sauf si tu précises autrement." }, order_index: 2 },
  ]);

  const l5 = await upsertLesson(ch2, "La boucle while", 1, 60);
  await seedBlocks(l5, [
    { type: "text", content: { html: "<h2>La boucle while</h2><p>La boucle <code>while</code> continue <strong>tant qu'une condition est vraie</strong>. Comme un gardien qui attend que le feu soit rouge !</p><pre>energie = 100\nwhile energie > 0:\n    print(\"En action ! Énergie:\", energie)\n    energie -= 30\nprint(\"Épuisé !\")</pre>" }, order_index: 0 },
    { type: "quiz", content: { question: "Combien de fois s'exécute le while si compteur démarre à 0 et la condition est 'compteur < 4' ?", choices: ["3", "4", "5", "Infini"], answer: 1, explanation: "compteur prend les valeurs 0, 1, 2, 3 — donc 4 itérations !" }, order_index: 1 },
  ]);

  const l6 = await upsertLesson(ch2, "Compter avec les boucles", 2, 70);
  await seedBlocks(l6, [
    { type: "text", content: { html: "<h2>Compter et accumuler</h2><p>Les boucles servent aussi à <strong>accumuler</strong> des valeurs — comme construire un étage par-dessus un autre !</p><pre>total = 0\nfor nombre in [10, 25, 15, 50]:\n    total += nombre\nprint(\"Total des points:\", total)  # 100</pre>" }, order_index: 0 },
    { type: "quiz", content: { question: "Que vaut 'total' à la fin de : total=0; for i in range(4): total += i ?", choices: ["4", "6", "10", "0"], answer: 1, explanation: "0+1+2+3 = 6. range(4) donne 0,1,2,3 !" }, order_index: 1 },
    { type: "text", content: { html: "<h3>🔁 La Tour des Boucles s'élève !</h3><p>Tu sais maintenant automatiser des tâches répétitives. Ta tour monte vers les nuages !</p>" }, order_index: 2 },
  ]);

  // ── Zone 3 : Le Pont des Conditions ──────────────────────────────────────
  const ch3 = await upsertChapter("Le Pont des Conditions", "Prends des décisions dans ton code — construis des ponts !", 2);
  console.log("✓ Ch3 Pont des Conditions:", ch3);

  const l7 = await upsertLesson(ch3, "Si... alors (if)", 0, 60);
  await seedBlocks(l7, [
    { type: "text", content: { html: "<h2>Si... alors avec if</h2><p>Ton programme peut prendre des <strong>décisions</strong> ! Comme un chef de chantier qui vérifie avant de construire.</p><pre>age = 12\nif age >= 10:\n    print(\"Tu peux rejoindre la cité !\")</pre><p>Si la condition est vraie (<code>True</code>), le code indenté s'exécute. Sinon, il est ignoré.</p>" }, order_index: 0 },
    { type: "quiz", content: { question: "Si score = 85, que fait : if score >= 90: print('Excellent') ?", choices: ["Affiche 'Excellent'", "N'affiche rien", "Erreur", "Affiche '85'"], answer: 1, explanation: "85 n'est pas >= 90, donc la condition est False et print ne s'exécute pas." }, order_index: 1 },
  ]);

  const l8 = await upsertLesson(ch3, "Si... sinon (if/else)", 1, 60);
  await seedBlocks(l8, [
    { type: "text", content: { html: "<h2>Si... sinon avec if/else</h2><p>Avec <code>else</code>, tu gères les <strong>deux cas</strong> — comme deux chemins sur un pont !</p><pre>pluie = True\nif pluie:\n    print(\"Prends ton parapluie !\")\nelse:\n    print(\"Profite du soleil !\")</pre>" }, order_index: 0 },
    { type: "quiz", content: { question: "Avec x = 7 : if x % 2 == 0: print('pair') else: print('impair') — qu'affiche-t-on ?", choices: ["pair", "impair", "7", "Erreur"], answer: 1, explanation: "7 % 2 = 1 (reste de la division), donc 1 != 0, la condition est False → 'impair'." }, order_index: 1 },
    { type: "quiz", content: { question: "Que fait elif ?", choices: ["Répète le if", "Ajoute une condition supplémentaire", "Termine le programme", "Crée une boucle"], answer: 1, explanation: "elif = 'sinon si'. Il permet d'ajouter d'autres conditions entre if et else." }, order_index: 2 },
  ]);

  const l9 = await upsertLesson(ch3, "Combiner les conditions", 2, 70);
  await seedBlocks(l9, [
    { type: "text", content: { html: "<h2>and, or, not — combiner les conditions</h2><p>Tu peux combiner plusieurs conditions avec des opérateurs logiques !</p><ul><li><code>and</code> → les deux doivent être vraies</li><li><code>or</code> → au moins une vraie</li><li><code>not</code> → inverse la condition</li></ul><pre>age = 12\nxp = 350\nif age >= 10 and xp >= 100:\n    print(\"Accès à la zone avancée !\")</pre>" }, order_index: 0 },
    { type: "quiz", content: { question: "True and False vaut ?", choices: ["True", "False", "None", "Erreur"], answer: 1, explanation: "and nécessite que LES DEUX soient True. Un seul False suffit à tout rendre False." }, order_index: 1 },
    { type: "text", content: { html: "<h3>🌉 Le Pont des Conditions est ouvert !</h3><p>Tu peux maintenant guider ton code selon les situations. Le pont relie les quartiers de ta cité !</p>" }, order_index: 2 },
  ]);

  // ── Zone 4 : Le Labo Blockly ──────────────────────────────────────────────
  const ch4 = await upsertChapter("Le Labo Blockly", "Défis visuels — guide le robot et code sans clavier !", 3);
  console.log("✓ Ch4 Labo Blockly:", ch4);

  const l10 = await upsertLesson(ch4, "Guide le robot !", 0, 80);
  await seedBlocks(l10, [
    { type: "text", content: { html: "<h2>🤖 Le Défi du Robot</h2><p>Dans ce labo, tu vas programmer un robot en <strong>assemblant des blocs visuels</strong>. Pas besoin de taper du code — glisse, dépose, connecte !</p><p>Ton objectif : guider le robot jusqu'à la maison 🏠 en utilisant les blocs <strong>Avancer</strong>, <strong>Tourner à gauche</strong> et <strong>Tourner à droite</strong>.</p>" }, order_index: 0 },
    { type: "game", content: { challenge_id: "robot_home_1", grid_size: 6, start: { x: 0, y: 5, dir: "E" }, goal: { x: 5, y: 5 }, walls: [], min_blocks: 1, max_blocks: 10 }, order_index: 1 },
  ]);

  const l11 = await upsertLesson(ch4, "Le chemin du trésor", 1, 80);
  await seedBlocks(l11, [
    { type: "text", content: { html: "<h2>💎 Le Chemin du Trésor</h2><p>Cette fois le robot doit faire un <strong>détour</strong> — il y a un mur sur le chemin direct ! Utilise les blocs <strong>Répéter</strong> pour ne pas écrire la même chose plusieurs fois.</p>" }, order_index: 0 },
    { type: "game", content: { challenge_id: "robot_treasure_1", grid_size: 6, start: { x: 0, y: 5, dir: "E" }, goal: { x: 5, y: 0 }, walls: [{ x: 3, y: 5 }, { x: 3, y: 4 }, { x: 3, y: 3 }], min_blocks: 1, max_blocks: 12 }, order_index: 1 },
  ]);

  const l12 = await upsertLesson(ch4, "La course des robots", 2, 100);
  await seedBlocks(l12, [
    { type: "text", content: { html: "<h2>🏁 La Course des Robots</h2><p>Défi final ! Le robot doit traverser un labyrinthe. Utilise les boucles intelligemment — le moins de blocs possible pour un code élégant !</p>" }, order_index: 0 },
    { type: "game", content: { challenge_id: "robot_race_1", grid_size: 6, start: { x: 0, y: 0, dir: "E" }, goal: { x: 5, y: 5 }, walls: [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 4, y: 3 }, { x: 4, y: 4 }], min_blocks: 1, max_blocks: 15 }, order_index: 1 },
    { type: "text", content: { html: "<h3>🧪 Le Labo Blockly est ouvert !</h3><p>Tu as prouvé que tu peux programmer visuellement. Ta cité numérique est complète !</p>" }, order_index: 2 },
  ]);

  console.log("\n🎉 Contenu seedé avec succès !");
  console.log("   4 chapitres · 12 leçons · blocs texte + quiz + blockly");
}

main().catch(e => { console.error(e); process.exit(1); });
