/**
 * Seed Trimestre 4 — "Mon programme prend des décisions" (Mars/Avril)
 * 6 séances · elif, while, listes, fonctions, quiz interactif
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-mars.ts
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
    title, slug, description, level: "explorer", status: "published",
    estimated_hours: 6,
    published_at: new Date().toISOString(),
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
  console.log("\n🌱  Seed Mars — Mon programme prend des décisions\n");

  const themeId = await upsertTheme(
    "Mon programme prend des décisions",
    "mars-decisions",
    "Approfondir les conditions avec elif, maîtriser la boucle while, organiser les données avec les listes, et créer ses propres fonctions réutilisables.",
    "Écrire des programmes qui gèrent des situations complexes, réutiliser du code avec des fonctions personnelles, et créer un quiz interactif complet à montrer à ses parents."
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 1 (Mars) — elif : plus de deux chemins
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 1");
  const ch1 = await upsertChapter(themeId, "Séance 1 — elif", "Gérer plus de deux cas avec elif.", 0);
  const l1 = await upsertLesson(ch1, themeId, "elif — plus de deux chemins", 0, 60);
  await seedBlocks(l1, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a5b4fc;font-weight:900;font-size:1.1em;margin:0 0 6px">🔀 if/else choisit entre 2 chemins. elif permet d'en avoir autant que tu veux.</p>
  <p style="color:#c7d2fe;margin:0">La vraie vie a rarement seulement deux cas. Une note peut être A, B, C, D ou E. La météo peut être ensoleillée, nuageuse, pluvieuse ou orageuse. <code style="background:#1e1b4b;padding:2px 6px;border-radius:4px">elif</code> gère tout ça.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔀 elif — enchaîner les conditions</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.9em;line-height:2">
  <span style="color:#fbbf24">note</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">15</span><br><br>
  <span style="color:#60a5fa">if</span> <span style="color:#fbbf24">note</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">18</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Excellent ! 🌟"</span>)<br>
  <span style="color:#60a5fa">elif</span> <span style="color:#fbbf24">note</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">15</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Très bien ! 👍"</span>)<br>
  <span style="color:#60a5fa">elif</span> <span style="color:#fbbf24">note</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">10</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Bien, continue !"</span>)<br>
  <span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"À améliorer."</span>)<br>
  <span style="color:#94a3b8"># Affiche : Très bien ! 👍</span>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 Python teste dans l'ordre et s'arrête au premier vrai</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Avec note = 15 : est-ce que 15 >= 18 ? Non. Est-ce que 15 >= 15 ? Oui → "Très bien !" et Python <strong>s'arrête</strong>. Il ne teste plus les elif suivants.</p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "note = 12\nQue s'affiche ?\n\nif note >= 18:\n    print('Excellent !')\nelif note >= 15:\n    print('Très bien !')\nelif note >= 10:\n    print('Bien !')\nelse:\n    print('À améliorer.')",
        choices: ["Excellent !", "Très bien !", "Bien !", "À améliorer."],
        answer: 2,
        explanation: "✅ 'Bien !' — 12 n'est pas >= 18 (faux), pas >= 15 (faux), mais 12 >= 10 est vrai ! Python s'arrête là et affiche 'Bien !'. Le else ne sera pas exécuté.",
      },
    },
    {
      type: "quiz", order_index: 3,
      content: {
        question: "Combien de chemins au total peut avoir une structure if/elif/elif/else ?",
        choices: ["2", "3", "4", "Autant que tu veux"],
        answer: 3,
        explanation: "✅ Autant que tu veux ! Tu peux mettre autant de elif que nécessaire entre le if et le else. Un seul chemin sera exécuté — le premier dont la condition est vraie.",
      },
    },
    {
      type: "text", order_index: 4,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔀 elif : autant de chemins que de situations</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : la boucle <code style="background:#052e16;padding:2px 6px;border-radius:4px">while</code> — une boucle qui s'arrête quand TU décides.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 2 — La boucle while
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 2");
  const ch2 = await upsertChapter(themeId, "Séance 2 — while", "Boucler jusqu'à ce qu'une condition devienne fausse.", 1);
  const l2 = await upsertLesson(ch2, themeId, "La boucle while — jusqu'à quand ?", 0, 70);
  await seedBlocks(l2, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #78350f;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">🔄 for répète un nombre fixe de fois. while répète tant qu'une condition est vraie.</p>
  <p style="color:#fde68a;margin:0">Un jeu qui tourne "jusqu'à ce que le joueur perde". Un programme qui attend "jusqu'à ce que l'utilisateur tape le bon mot. C'est <code style="background:#1c1917;padding:2px 6px;border-radius:4px">while</code>.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔄 La boucle while</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#fbbf24">compteur</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">1</span><br><br>
  <span style="color:#60a5fa">while</span> <span style="color:#fbbf24">compteur</span> <span style="color:#e2e8f0">&lt;=</span> <span style="color:#fb923c">5</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tour"</span>, <span style="color:#fbbf24">compteur</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">compteur</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fb923c">1</span><br><br>
  <span style="color:#94a3b8"># Affiche : Tour 1, Tour 2, Tour 3, Tour 4, Tour 5</span>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">⚠️ N'oublie JAMAIS d'incrémenter dans la boucle !</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Si compteur += 1 est absent, la condition <code>compteur &lt;= 5</code> restera toujours vraie → boucle infinie. Le programme ne s'arrête plus jamais. C'est l'erreur classique du while.</p>
</div>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.9em;line-height:2">
  <span style="color:#94a3b8"># Exemple concret : deviner un nombre</span><br>
  <span style="color:#fbbf24">secret</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">7</span><br>
  <span style="color:#fbbf24">essai</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br><br>
  <span style="color:#60a5fa">while</span> <span style="color:#fbbf24">essai</span> <span style="color:#e2e8f0">!=</span> <span style="color:#fbbf24">secret</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">essai</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">int</span>(<span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Devine (1-10) : "</span>))<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">if</span> <span style="color:#fbbf24">essai</span> <span style="color:#e2e8f0">!=</span> <span style="color:#fbbf24">secret</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Raté, réessaie !"</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Trouvé !"</span>)
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Pourquoi une boucle while peut-elle devenir infinie ?",
        choices: [
          "Parce que Python n'aime pas while",
          "Si la condition reste toujours vraie car on n'a pas prévu de la rendre fausse",
          "Si on écrit while True",
          "Si la condition utilise == au lieu de !=",
        ],
        answer: 1,
        explanation: "✅ Une boucle infinie se produit quand la condition reste vraie pour toujours. Si ton compteur ne s'incrémente pas, ou si l'utilisateur ne peut jamais satisfaire la condition, la boucle tourne indéfiniment. C'est pourquoi il faut toujours vérifier que la condition peut devenir fausse.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔄 while : boucle à durée indéterminée</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : les <strong>listes</strong> — stocker plusieurs valeurs dans une seule variable.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 3 — Les listes
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 3");
  const ch3 = await upsertChapter(themeId, "Séance 3 — Les listes", "Plusieurs valeurs dans une variable, parcourir avec for.", 2);
  const l3 = await upsertLesson(ch3, themeId, "Les listes — plusieurs infos dans une variable", 0, 70);
  await seedBlocks(l3, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#0c4a6e,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#7dd3fc;font-weight:900;font-size:1.1em;margin:0 0 6px">📋 Jusqu'ici, une variable = une valeur. Une liste = plusieurs valeurs dans une seule variable.</p>
  <p style="color:#bae6fd;margin:0">Les élèves d'une classe, les scores d'un jeu, les jours de la semaine — autant de cas où une liste est plus pratique que 10 variables séparées.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>📋 Créer et utiliser une liste</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#94a3b8"># Créer une liste</span><br>
  <span style="color:#fbbf24">fruits</span> <span style="color:#e2e8f0">=</span> [<span style="color:#34d399">"mangue"</span>, <span style="color:#34d399">"papaye"</span>, <span style="color:#34d399">"ananas"</span>]<br><br>
  <span style="color:#94a3b8"># Accéder à un élément (commence à 0 !)</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">fruits</span>[<span style="color:#fb923c">0</span>])  <span style="color:#94a3b8"># mangue</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">fruits</span>[<span style="color:#fb923c">2</span>])  <span style="color:#94a3b8"># ananas</span><br><br>
  <span style="color:#94a3b8"># Parcourir toute la liste</span><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">fruit</span> <span style="color:#60a5fa">in</span> <span style="color:#fbbf24">fruits</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"J'aime le"</span>, <span style="color:#fbbf24">fruit</span>)<br><br>
  <span style="color:#94a3b8"># Ajouter un élément</span><br>
  <span style="color:#fbbf24">fruits</span>.<span style="color:#60a5fa">append</span>(<span style="color:#34d399">"goyave"</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#60a5fa">len</span>(<span style="color:#fbbf24">fruits</span>))  <span style="color:#94a3b8"># 4</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <code style="color:#fbbf24">fruits[0]</code>
    <p style="color:#94a3b8;font-size:0.85em;margin:6px 0 0">Premier élément. Index 0 = début.</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <code style="color:#fbbf24">for x in liste:</code>
    <p style="color:#94a3b8;font-size:0.85em;margin:6px 0 0">Parcourir chaque élément un par un.</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <code style="color:#fbbf24">liste.append(x)</code>
    <p style="color:#94a3b8;font-size:0.85em;margin:6px 0 0">Ajouter x à la fin de la liste.</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px">
    <code style="color:#fbbf24">len(liste)</code>
    <p style="color:#94a3b8;font-size:0.85em;margin:6px 0 0">Compter le nombre d'éléments.</p>
  </div>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "scores = [10, 25, 8, 42]\nQue vaut scores[2] ?",
        choices: ["10", "25", "8", "42"],
        answer: 2,
        explanation: "✅ 8 ! Les indices commencent à 0 : scores[0]=10, scores[1]=25, scores[2]=8, scores[3]=42. L'indice 2 pointe sur le 3ème élément de la liste.",
      },
    },
    {
      type: "quiz", order_index: 3,
      content: {
        question: "eleves = ['Koffi', 'Amavi', 'Sena']\nAprès eleves.append('Yawa'), que retourne len(eleves) ?",
        choices: ["3", "4", "5", "Erreur"],
        answer: 1,
        explanation: "✅ 4 ! La liste avait 3 élèves. append('Yawa') en ajoute un à la fin → ['Koffi', 'Amavi', 'Sena', 'Yawa']. len() compte 4 éléments.",
      },
    },
    {
      type: "text", order_index: 4,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">📋 Les listes : organiser plusieurs données ensemble</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : les <strong>fonctions</strong> — créer tes propres blocs réutilisables en Python.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 4 — Les fonctions
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 4");
  const ch4 = await upsertChapter(themeId, "Séance 4 — Fonctions", "Définir ses propres blocs réutilisables avec def.", 3);
  const l4 = await upsertLesson(ch4, themeId, "Les fonctions — mes propres blocs réutilisables", 0, 80);
  await seedBlocks(l4, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#93c5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🔧 En Blockly, tu créais des blocs personnalisés. En Python, c'est une fonction.</p>
  <p style="color:#bfdbfe;margin:0">Une fonction, c'est un nom pour un groupe d'instructions. Tu l'écris une fois, tu l'appelles autant de fois que tu veux. C'est la base de tout programme bien organisé.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔧 Créer et appeler une fonction</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#94a3b8"># Définir une fonction</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">saluer</span>(<span style="color:#fb923c">prenom</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Bienvenue,"</span>, <span style="color:#fb923c">prenom</span>, <span style="color:#34d399">"!"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Content de te voir ici 😊"</span>)<br><br>
  <span style="color:#94a3b8"># L'appeler</span><br>
  <span style="color:#fbbf24">saluer</span>(<span style="color:#34d399">"Koffi"</span>)<br>
  <span style="color:#fbbf24">saluer</span>(<span style="color:#34d399">"Amavi"</span>)<br>
  <span style="color:#fbbf24">saluer</span>(<span style="color:#34d399">"Sena"</span>)
</div>
<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">
  <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:12px 16px">
    <code style="color:#4ade80">def saluer(prenom):</code>
    <p style="color:#86efac;margin:6px 0 0;font-size:0.9em"><strong>def</strong> = "définir". <strong>saluer</strong> = le nom de ma fonction. <strong>(prenom)</strong> = un paramètre — une valeur que je passe à la fonction.</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px 16px">
    <code style="color:#60a5fa">saluer("Koffi")</code>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:0.9em">Appeler la fonction avec "Koffi" comme valeur pour prenom. Les 2 lignes print s'exécutent avec prenom = "Koffi".</p>
  </div>
</div>
<h3>Fonction avec return :</h3>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:12px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">doubler</span>(<span style="color:#fb923c">nombre</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">return</span> <span style="color:#fb923c">nombre</span> <span style="color:#e2e8f0">*</span> <span style="color:#fb923c">2</span><br><br>
  <span style="color:#fbbf24">resultat</span> <span style="color:#e2e8f0">=</span> <span style="color:#fbbf24">doubler</span>(<span style="color:#fb923c">5</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">resultat</span>)  <span style="color:#94a3b8"># 10</span>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "def calculer_xp(score):\n    return score * 10\n\nQue vaut calculer_xp(7) ?",
        choices: ["7", "10", "70", "17"],
        answer: 2,
        explanation: "✅ 70 ! La fonction reçoit score = 7 et retourne score * 10 = 7 * 10 = 70. return signifie 'renvoie cette valeur au code qui m'a appelée'. calculer_xp(7) vaut donc 70.",
      },
    },
    {
      type: "quiz", order_index: 3,
      content: {
        question: "Pourquoi utiliser une fonction plutôt que copier le même code 3 fois ?",
        choices: [
          "Les fonctions sont plus rapides à exécuter",
          "Pour éviter les erreurs : si tu corriges la fonction, tu corriges les 3 appels en même temps",
          "Parce que Python l'impose",
          "Les fonctions utilisent moins de mémoire",
        ],
        answer: 1,
        explanation: "✅ C'est la vraie raison ! Si tu copies du code 3 fois et trouves un bug, tu dois le corriger 3 fois. Avec une fonction : tu corriges une seule fois, les 3 appels bénéficient du fix automatiquement. C'est le principe DRY : Don't Repeat Yourself.",
      },
    },
    {
      type: "text", order_index: 4,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔧 def : ton nom, tes règles, ton bloc</h3>
  <p style="color:#86efac;margin:0">➡️ Séance 5 : tu combines tout pour créer un <strong>quiz interactif</strong> — 2 séances de vacances Pâques bien remplies !</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 5 (Avril — Pâques) — Quiz interactif
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 5 (Avril — Pâques)");
  const ch5 = await upsertChapter(themeId, "Séance 5 — Quiz interactif (partie 1)", "Construire la structure du quiz : questions, score, boucle.", 4);
  const l5 = await upsertLesson(ch5, themeId, "Quiz interactif — construire la structure", 0, 90);
  await seedBlocks(l5, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🎮 Séance 5 — Tout ce que tu sais, en un seul programme.</p>
  <p style="color:#ddd6fe;margin:0">Variables, listes, boucle for, fonctions, if/elif/else — tu vas assembler ces pièces pour créer un vrai quiz interactif. Tes parents pourront jouer !</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎮 Architecture du quiz</h2>
<p>D'abord, on réfléchit à la structure avant d'écrire le code :</p>
<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">
  ${[
    ["📋","Liste de questions","chaque question = dictionnaire {question, reponse}"],
    ["🔁","Boucle for","parcourir chaque question"],
    ["🎤","input()","demander la réponse à l'utilisateur"],
    ["❓","if/else","comparer avec la bonne réponse"],
    ["📊","Variable score","compter les bonnes réponses"],
    ["🎯","Résultat final","elif selon le score obtenu"],
  ].map(([emoji, titre, desc]) => `
  <div style="background:#1e293b;border-left:4px solid #6d28d9;border-radius:0 8px 8px 0;padding:10px 14px;display:flex;align-items:center;gap:12px">
    <span style="font-size:1.2em">${emoji}</span>
    <div><strong style="color:#c4b5fd">${titre}</strong><p style="color:#94a3b8;margin:2px 0 0;font-size:0.85em">${desc}</p></div>
  </div>`).join("")}
</div>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.85em;line-height:1.9">
  <span style="color:#94a3b8"># === QUIZ CULTURE GÉNÉRALE ===</span><br><br>
  <span style="color:#fbbf24">questions</span> <span style="color:#e2e8f0">=</span> [<br>
  &nbsp;&nbsp;&nbsp;&nbsp;{<span style="color:#34d399">"q"</span>: <span style="color:#34d399">"Capitale du Togo ?"</span>, <span style="color:#34d399">"r"</span>: <span style="color:#34d399">"lome"</span>},<br>
  &nbsp;&nbsp;&nbsp;&nbsp;{<span style="color:#34d399">"q"</span>: <span style="color:#34d399">"Combien font 7 × 8 ?"</span>, <span style="color:#34d399">"r"</span>: <span style="color:#34d399">"56"</span>},<br>
  &nbsp;&nbsp;&nbsp;&nbsp;{<span style="color:#34d399">"q"</span>: <span style="color:#34d399">"Quel animal est le plus rapide ?"</span>, <span style="color:#34d399">"r"</span>: <span style="color:#34d399">"guepard"</span>},<br>
  ]<br><br>
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">item</span> <span style="color:#60a5fa">in</span> <span style="color:#fbbf24">questions</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">reponse</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#fbbf24">item</span>[<span style="color:#34d399">"q"</span>] <span style="color:#e2e8f0">+</span> <span style="color:#34d399">" → "</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">if</span> <span style="color:#fbbf24">reponse</span>.<span style="color:#60a5fa">lower</span>() <span style="color:#e2e8f0">==</span> <span style="color:#fbbf24">item</span>[<span style="color:#34d399">"r"</span>]:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"✅ Correct !"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fb923c">1</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"❌ Réponse :"</span>, <span style="color:#fbbf24">item</span>[<span style="color:#34d399">"r"</span>])
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Dans le quiz, que fait reponse.lower() ?",
        choices: [
          "Affiche la réponse en minuscules à l'écran",
          "Convertit la réponse en minuscules pour comparer sans souci de majuscules",
          "Compte les lettres de la réponse",
          "Supprime les espaces de la réponse",
        ],
        answer: 1,
        explanation: "✅ lower() convertit en minuscules pour la comparaison. Ainsi 'Lomé', 'LOMÉ', 'lome' donnent tous 'lome' après lower() → la comparaison avec 'lome' réussit. Sans lower(), l'utilisateur devrait taper exactement la bonne casse — trop strict !",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎮 Quiz partie 1 : la structure est en place !</h3>
  <p style="color:#86efac;margin:0">➡️ Séance finale : tu ajoutes le résultat, une fonction et les finitions pour un quiz professionnel.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 6 (Avril — Pâques) — Défi final
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 6 (Avril)");
  const ch6 = await upsertChapter(themeId, "Séance 6 — Défi : le programme intelligent", "Quiz complet avec fonctions, résultat et personnalisation.", 5);
  const l6 = await upsertLesson(ch6, themeId, "Défi : le programme intelligent 🏆", 0, 120);
  await seedBlocks(l6, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:16px;padding:24px 28px;text-align:center">
  <div style="font-size:2em;margin-bottom:6px">🏆</div>
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">Séance finale — Tu finalises ton quiz en programme professionnel.</p>
  <p style="color:#ddd6fe;margin:0">Tu vas ajouter : un résultat final avec elif, une fonction réutilisable, et personnaliser les questions. À la fin, tu peux faire jouer tes parents !</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🏆 Le quiz complet et professionnel</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.82em;line-height:1.9">
  <span style="color:#94a3b8"># === MON QUIZ PROFESSIONNEL ===</span><br><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">poser_question</span>(<span style="color:#fb923c">question</span>, <span style="color:#fb923c">bonne_reponse</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">rep</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#fb923c">question</span> <span style="color:#e2e8f0">+</span> <span style="color:#34d399">" : "</span>).<span style="color:#60a5fa">lower</span>().<span style="color:#60a5fa">strip</span>()<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">if</span> <span style="color:#fbbf24">rep</span> <span style="color:#e2e8f0">==</span> <span style="color:#fb923c">bonne_reponse</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"  ✅ Bravo !"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">return</span> <span style="color:#fb923c">1</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"  ❌ Réponse :"</span>, <span style="color:#fb923c">bonne_reponse</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">return</span> <span style="color:#fb923c">0</span><br><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">afficher_resultat</span>(<span style="color:#fb923c">score</span>, <span style="color:#fb923c">total</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">f"\\n🎯 Score : {score}/{total}"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">if</span> <span style="color:#fb923c">score</span> <span style="color:#e2e8f0">==</span> <span style="color:#fb923c">total</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"🌟 Parfait ! Génie !"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">elif</span> <span style="color:#fb923c">score</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">total</span> <span style="color:#e2e8f0">*</span> <span style="color:#fb923c">0.5</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"👍 Bien joué !"</span>)<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"📚 Continue à apprendre !"</span>)<br><br>
  <span style="color:#94a3b8"># Lancer le quiz</span><br>
  <span style="color:#fbbf24">joueur</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Ton prénom ? "</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">f"\\n🎮 Bienvenue {joueur} ! 3 questions :\\n"</span>)<br><br>
  <span style="color:#fbbf24">s</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br>
  <span style="color:#fbbf24">s</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fbbf24">poser_question</span>(<span style="color:#34d399">"Capitale du Togo"</span>, <span style="color:#34d399">"lomé"</span>)<br>
  <span style="color:#fbbf24">s</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fbbf24">poser_question</span>(<span style="color:#34d399">"7 × 8"</span>, <span style="color:#34d399">"56"</span>)<br>
  <span style="color:#fbbf24">s</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fbbf24">poser_question</span>(<span style="color:#34d399">"Animal le plus rapide"</span>, <span style="color:#34d399">"guépard"</span>)<br>
  <span style="color:#fbbf24">afficher_resultat</span>(<span style="color:#fbbf24">s</span>, <span style="color:#fb923c">3</span>)
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Dans le quiz, que fait .strip() après .lower() ?",
        choices: [
          "Supprime toutes les lettres",
          "Supprime les espaces en début et fin de la réponse tapée",
          "Met la réponse en majuscules",
          "Compte les caractères",
        ],
        answer: 1,
        explanation: "✅ strip() supprime les espaces au début et à la fin. Si l'utilisateur tape '  lomé  ' (avec des espaces par erreur), strip() donne 'lomé' → la comparaison réussit. lower() + strip() ensemble = réponse insensible aux majuscules ET aux espaces accidentels.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#1e1b4b);border:2px solid #4ade80;border-radius:16px;padding:28px 32px;text-align:center">
  <div style="font-size:3em;margin-bottom:10px">🎓🐍</div>
  <h2 style="color:#4ade80;margin:0 0 10px">Thème 4 accompli !</h2>
  <p style="color:#a7f3d0;margin:0 0 16px">Ton programme prend des décisions complexes, gère des listes de données, se décompose en fonctions réutilisables. C'est de la vraie programmation professionnelle.</p>
  <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:14px 18px;text-align:left;margin:0 auto;max-width:340px">
    <p style="color:#86efac;margin:0;font-size:0.9em;line-height:1.8">
      ✓ elif — plusieurs chemins de décision<br>
      ✓ while — boucle à durée variable<br>
      ✓ listes — organiser plusieurs données<br>
      ✓ def — créer ses propres fonctions<br>
      ✓ Quiz interactif — tout en un programme
    </p>
  </div>
</div>
<div style="margin-top:16px;background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:18px 22px">
  <p style="color:#60a5fa;font-weight:900;margin:0 0 6px">🎯 Prochain thème — Mai :</p>
  <p style="color:#93c5fd;margin:0">"<strong>Mon dessin existe grâce à mon code</strong>" — tu vas programmer des œuvres d'art sur une grille de pixels, comme un vrai pixel artiste !</p>
</div>`.trim() },
    },
  ]);

  console.log("\n🎉  Seed Mars terminé !");
  console.log("   Thème  : Mon programme prend des décisions");
  console.log("   Séances : 6 (mars×4 + avr×2)");
  console.log("   Leçons : 6");
}

main().catch((e) => { console.error(e); process.exit(1); });
