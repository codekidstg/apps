/**
 * Seed Bâtisseur — Thème 1A "Passerelle Turbo" (Septembre/Octobre)
 * Pour les nouveaux élèves placés en Bâtisseur sans avoir fait Explorateur
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-builder-passerelle.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function upsertTheme(title: string, slug: string, description: string): Promise<string> {
  const { data: ex } = await sb.from("themes").select("id").eq("slug", slug).maybeSingle();
  if (ex) { console.log(`  ↩ Thème existant (${ex.id})`); return ex.id as string; }
  const { data, error } = await (sb.from("themes") as any).insert({
    title, slug, description, level: "builder", status: "published",
    estimated_hours: 6, published_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;
  console.log(`  ✓ Thème créé (${(data as any).id})`);
  return (data as any).id as string;
}

async function upsertChapter(themeId: string, title: string, desc: string, order: number): Promise<string> {
  const { data: ex } = await sb.from("chapters").select("id").eq("theme_id", themeId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await (sb.from("chapters") as any).insert({ theme_id: themeId, title, description: desc, order_index: order }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function upsertLesson(chapterId: string, themeId: string, title: string, order: number, xp = 60): Promise<string> {
  const { data: ex } = await sb.from("lessons").select("id").eq("chapter_id", chapterId).eq("title", title).maybeSingle();
  if (ex) return ex.id as string;
  const { data, error } = await (sb.from("lessons") as any).insert({ chapter_id: chapterId, theme_id: themeId, title, order_index: order, xp_reward: xp }).select("id").single();
  if (error) throw error;
  return (data as any).id as string;
}

async function seedBlocks(lessonId: string, themeId: string, blocks: object[]) {
  await (sb.from("lesson_blocks") as any).delete().eq("lesson_id", lessonId);
  const rows = blocks.map((b: any) => ({ ...b, lesson_id: lessonId, theme_id: themeId }));
  const { error } = await (sb.from("lesson_blocks") as any).insert(rows);
  if (error) throw error;
  console.log(`    ✓ ${rows.length} blocs insérés`);
}

async function main() {
  console.log("\n⚡  Seed Bâtisseur 1A — Passerelle Turbo\n");

  const themeId = await upsertTheme(
    "Passerelle Turbo",
    "builder-passerelle",
    "Rattrapage intensif : les fondamentaux Python en 6 séances pour rejoindre le niveau Bâtisseur"
  );

  // ── Séance 1 ─────────────────────────────────────────────────────────────
  console.log("  Séance 1 — Variables & affichage");
  const ch1 = await upsertChapter(themeId, "Séance 1 — Variables & affichage", "", 0);
  const l1 = await upsertLesson(ch1, themeId, "Variables & affichage", 0, 50);
  await seedBlocks(l1, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>🗃️ Une variable, c'est une boîte</h2><p>Imagine que tu ranges tes affaires dans des boîtes. Chaque boîte a une étiquette (le <strong>nom</strong>) et ce qu'il y a dedans (la <strong>valeur</strong>).</p><pre><code>prenom = "Amavi"\nage = 14\nprint(prenom)\nprint(age)</code></pre><p>Python exécute ça de haut en bas, ligne par ligne. <code>print()</code> affiche la valeur dans le terminal.</p>` } },
    { type: "quiz", order_index: 1, content: { question: "Qu'affiche ce code ? prenom = \"Kiri\" / print(prenom)", choices: ["prenom", "Kiri", "\"Kiri\"", "Une erreur"], answer: 1, explanation: "print() affiche la valeur contenue dans la variable, pas son nom." } },
    { type: "text", order_index: 2, content: { html: `<h2>💬 Demander à l'utilisateur</h2><p><code>input()</code> pose une question et attend une réponse.</p><pre><code>nom = input("Comment tu t'appelles ? ")\nprint("Bonjour", nom)</code></pre><p>Ce que l'utilisateur tape est automatiquement stocké dans la variable <code>nom</code>.</p>` } },
  ]);

  // ── Séance 2 ─────────────────────────────────────────────────────────────
  console.log("  Séance 2 — Répète avec for");
  const ch2 = await upsertChapter(themeId, "Séance 2 — Répète avec for", "", 1);
  const l2 = await upsertLesson(ch2, themeId, "Répète avec for", 0, 50);
  await seedBlocks(l2, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>🔁 Ne répète pas le même code !</h2><p>Si tu veux afficher "Bonjour !" 5 fois, tu pourrais écrire <code>print()</code> 5 fois. Mais Python a une meilleure solution : la <strong>boucle for</strong>.</p><pre><code>for i in range(5):\n    print("Bonjour !")</code></pre><p><code>range(5)</code> génère les nombres 0, 1, 2, 3, 4. La boucle s'exécute une fois pour chaque nombre.</p><p>⚠️ L'indentation (l'espace avant <code>print</code>) est obligatoire en Python !</p>` } },
    { type: "quiz", order_index: 1, content: { question: "Combien de fois s'affiche \"Salut !\" avec : for i in range(3): print(\"Salut !\")", choices: ["0 fois", "2 fois", "3 fois", "4 fois"], answer: 2, explanation: "range(3) génère 0, 1, 2 — donc 3 itérations." } },
    { type: "text", order_index: 2, content: { html: `<h2>📊 Utiliser le compteur</h2><p>Le <code>i</code> dans la boucle change à chaque tour — tu peux l'utiliser !</p><pre><code>for i in range(1, 6):\n    print("Élève numéro", i)</code></pre><p><code>range(1, 6)</code> génère 1, 2, 3, 4, 5 — parfait pour des numéros lisibles.</p>` } },
  ]);

  // ── Séance 3 ─────────────────────────────────────────────────────────────
  console.log("  Séance 3 — Décide avec if");
  const ch3 = await upsertChapter(themeId, "Séance 3 — Décide avec if", "", 2);
  const l3 = await upsertLesson(ch3, themeId, "Décide avec if", 0, 50);
  await seedBlocks(l3, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>🚦 Le code qui réfléchit</h2><p>Un programme utile prend des <strong>décisions</strong> selon les situations. En Python, on utilise <code>if</code>, <code>elif</code> et <code>else</code>.</p><pre><code>note = int(input("Ta note ? "))\nif note >= 16:\n    print("Excellent !")\nelif note >= 10:\n    print("Bien joué !")\nelse:\n    print("Continue les efforts !")</code></pre>` } },
    { type: "quiz", order_index: 1, content: { question: "Si note = 12, que s'affiche-t-il ?", choices: ["Excellent !", "Bien joué !", "Continue les efforts !", "Rien"], answer: 1, explanation: "12 n'est pas >= 16, mais 12 >= 10 — donc le elif s'exécute." } },
    { type: "text", order_index: 2, content: { html: `<h2>⚖️ Les comparateurs</h2><table><tr><th>Symbole</th><th>Signifie</th></tr><tr><td><code>==</code></td><td>égal à</td></tr><tr><td><code>!=</code></td><td>différent de</td></tr><tr><td><code>&gt;</code></td><td>plus grand que</td></tr><tr><td><code>&lt;</code></td><td>plus petit que</td></tr><tr><td><code>&gt;=</code></td><td>plus grand ou égal</td></tr><tr><td><code>&lt;=</code></td><td>plus petit ou égal</td></tr></table>` } },
  ]);

  // ── Séance 4 ─────────────────────────────────────────────────────────────
  console.log("  Séance 4 — Crée tes propres blocs");
  const ch4 = await upsertChapter(themeId, "Séance 4 — Crée tes propres blocs", "", 3);
  const l4 = await upsertLesson(ch4, themeId, "Crée tes propres blocs", 0, 60);
  await seedBlocks(l4, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>🧩 Tes propres instructions</h2><p>Jusqu'ici tu utilisais <code>print()</code> et <code>input()</code> — des blocs que Python t'offre. Maintenant tu vas créer les tiens avec <code>def</code>.</p><pre><code>def saluer(prenom):\n    print("Bonjour", prenom, "!")\n    print("Bienvenue à CodeKids !")\n\nsaluer("Amavi")\nsaluer("Kiri")</code></pre><p>La fonction s'appelle <code>saluer</code>. Elle prend un <strong>paramètre</strong> <code>prenom</code> et peut être appelée autant de fois qu'on veut.</p>` } },
    { type: "quiz", order_index: 1, content: { question: "Que fait le mot-clé 'return' dans une fonction ?", choices: ["Il arrête Python", "Il renvoie une valeur qu'on peut utiliser", "Il affiche la valeur", "Il crée une variable"], answer: 1, explanation: "return renvoie le résultat de la fonction pour qu'on puisse l'utiliser ailleurs dans le programme." } },
    { type: "text", order_index: 2, content: { html: `<h2>↩️ Renvoyer un résultat</h2><pre><code>def additionner(a, b):\n    resultat = a + b\n    return resultat\n\ntotal = additionner(8, 5)\nprint("La somme est", total)</code></pre><p><code>return</code> envoie le résultat hors de la fonction. On peut le stocker dans une variable ou l'utiliser directement.</p>` } },
  ]);

  // ── Séance 5 ─────────────────────────────────────────────────────────────
  console.log("  Séance 5 — Les listes");
  const ch5 = await upsertChapter(themeId, "Séance 5 — Les listes", "", 4);
  const l5 = await upsertLesson(ch5, themeId, "Les listes", 0, 60);
  await seedBlocks(l5, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>📋 Plusieurs valeurs dans une variable</h2><p>Une variable normale stocke <em>une</em> valeur. Une <strong>liste</strong> en stocke plusieurs, dans l'ordre.</p><pre><code>eleves = ["Amavi", "Kiri", "Fatoumata", "Moussa"]\nprint(eleves[0])  # Amavi\nprint(eleves[2])  # Fatoumata\nprint(len(eleves))  # 4</code></pre><p>⚠️ En Python, on compte à partir de <strong>0</strong>. Le premier élément est à l'index 0.</p>` } },
    { type: "quiz", order_index: 1, content: { question: "Qu'affiche print(eleves[1]) si eleves = [\"Amavi\", \"Kiri\", \"Moussa\"] ?", choices: ["Amavi", "Kiri", "Moussa", "1"], answer: 1, explanation: "L'index 1 correspond au deuxième élément — Kiri." } },
    { type: "text", order_index: 2, content: { html: `<h2>➕ Modifier une liste</h2><pre><code>courses = ["mangue", "igname"]\ncourses.append("riz")  # ajouter à la fin\nprint(len(courses))     # 3\n\nfor article in courses:\n    print("- ", article)</code></pre><p><code>append()</code> ajoute un élément. <code>len()</code> donne la taille. La boucle <code>for</code> parcourt chaque élément.</p>` } },
  ]);

  // ── Séance 6 ─────────────────────────────────────────────────────────────
  console.log("  Séance 6 — Mini-projet Passerelle 🏁");
  const ch6 = await upsertChapter(themeId, "Séance 6 — Mini-projet Passerelle", "", 5);
  const l6 = await upsertLesson(ch6, themeId, "Mini-projet — Quiz de culture générale", 0, 100);
  await seedBlocks(l6, themeId, [
    { type: "text", order_index: 0, content: { html: `<h2>🏁 Ton premier vrai programme</h2><p>Tu vas créer un <strong>quiz interactif</strong> qui utilise tout ce que tu as appris : variables, boucles, conditions, fonctions et listes.</p><pre><code>def poser_question(question, bonne_reponse):\n    reponse = input(question + " ")\n    if reponse.lower() == bonne_reponse.lower():\n        print("✅ Bonne réponse !")\n        return 1\n    else:\n        print("❌ La réponse était :", bonne_reponse)\n        return 0\n\nquestions = [\n    ("Capitale du Togo ?", "Lomé"),\n    ("2 puissance 8 ?", "256"),\n    ("Langage de CodeKids ?", "Python"),\n]\n\nscore = 0\nfor q, r in questions:\n    score += poser_question(q, r)\n\nprint(f"\\nTon score : {score}/{len(questions)}")</code></pre>` } },
    { type: "quiz", order_index: 1, content: { question: "Dans ce programme, que fait 'score += poser_question(q, r)' ?", choices: ["Elle affiche le score", "Elle ajoute 0 ou 1 au score selon la réponse", "Elle pose la question", "Elle remet le score à zéro"], answer: 1, explanation: "poser_question() retourne 1 si correct, 0 sinon. += ajoute ce résultat au score total." } },
    { type: "text", order_index: 2, content: { html: `<h2>🎉 Félicitations, tu es prêt pour le niveau Bâtisseur !</h2><p>En 6 séances, tu as maîtrisé :</p><ul><li>✅ Variables et <code>print()</code></li><li>✅ Boucles <code>for</code></li><li>✅ Conditions <code>if/elif/else</code></li><li>✅ Fonctions avec <code>def</code> et <code>return</code></li><li>✅ Listes et <code>append()</code></li></ul><p>En novembre, tu rejoins tous tes camarades pour la suite de l'aventure Bâtisseur. 🚀</p>` } },
  ]);

  console.log("\n✅  Passerelle Turbo seedé avec succès !\n");
}

main().catch(console.error);
