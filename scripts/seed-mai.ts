/**
 * Seed Trimestre 5 — "Mon dessin existe grâce à mon code" (Mai/Juin)
 * 6 séances · pixel art : grille x/y, boucles, fonctions de dessin, présentation finale
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-mai.ts
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
  console.log("\n🌱  Seed Mai — Mon dessin existe grâce à mon code\n");

  const themeId = await upsertTheme(
    "Mon dessin existe grâce à mon code",
    "mai-pixel-art",
    "Programmer des œuvres d'art sur une grille de pixels en Python : coordonnées x/y, couleurs, boucles de dessin, fonctions personnalisées et présentation finale.",
    "Créer et expliquer une œuvre de pixel art entièrement programmée en Python, en utilisant des boucles, des fonctions et des coordonnées — prête à être présentée aux parents lors de la remise de diplôme."
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 1 (Mai) — La grille de pixels
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 1");
  const ch1 = await upsertChapter(themeId, "Séance 1 — La grille de pixels", "Comprendre les coordonnées x, y et colorier une cellule.", 0);
  const l1 = await upsertLesson(ch1, themeId, "La grille de pixels — x, y, couleur", 0, 60);
  await seedBlocks(l1, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#7dd3fc;font-weight:900;font-size:1.1em;margin:0 0 6px">🎨 Un dessin, c'est juste une grille de cases colorées. Et une grille, ça se programme.</p>
  <p style="color:#bae6fd;margin:0">Chaque pixel de ton écran a une position (colonne x, ligne y) et une couleur. Tu vas apprendre à <strong>dire à Python exactement quelle case colorier</strong> — comme un peintre numérique.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🗺️ Les coordonnées x, y sur une grille</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
  <div style="background:#1e293b;border-radius:10px;padding:16px">
    <p style="color:#60a5fa;font-weight:900;margin:0 0 10px;font-size:0.85em">LA GRILLE (10×10)</p>
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:2px;margin-bottom:8px">
      ${Array.from({length:25}).map((_,i) => {
        const x = i%5, y = Math.floor(i/5);
        const colored = (x===2 && y===1) || (x===3 && y===2) || (x===1 && y===3);
        return `<div style="aspect-ratio:1;border-radius:2px;display:flex;align-items:center;justify-content:center;font-size:8px;font-weight:700;background:${colored ? '#ef4444' : '#0f172a'};border:1px solid #1e293b;color:${colored ? 'white' : '#334155'}">${x},${y}</div>`;
      }).join("")}
    </div>
    <p style="color:#94a3b8;font-size:0.75em;margin:0">Les cases rouges sont coloriées en code</p>
  </div>
  <div style="background:#1e293b;border-radius:10px;padding:16px">
    <p style="color:#34d399;font-weight:900;margin:0 0 10px;font-size:0.85em">LE CODE PYTHON</p>
    <div style="font-family:monospace;font-size:0.8em;line-height:1.9;color:#e2e8f0">
      <span style="color:#94a3b8"># x = colonne, y = ligne</span><br>
      colorier(<span style="color:#fb923c">2</span>, <span style="color:#fb923c">1</span>, <span style="color:#34d399">"rouge"</span>)<br>
      colorier(<span style="color:#fb923c">3</span>, <span style="color:#fb923c">2</span>, <span style="color:#34d399">"rouge"</span>)<br>
      colorier(<span style="color:#fb923c">1</span>, <span style="color:#fb923c">3</span>, <span style="color:#34d399">"rouge"</span>)
    </div>
  </div>
</div>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.9em;line-height:2">
  <span style="color:#94a3b8"># Représenter une grille avec des listes imbriquées</span><br>
  <span style="color:#fbbf24">grille</span> <span style="color:#e2e8f0">=</span> [<br>
  &nbsp;&nbsp;&nbsp;&nbsp;[<span style="color:#34d399">"."</span>, <span style="color:#34d399">"."</span>, <span style="color:#34d399">"."</span>],  <span style="color:#94a3b8"># ligne 0</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;[<span style="color:#34d399">"."</span>, <span style="color:#34d399">"R"</span>, <span style="color:#34d399">"."</span>],  <span style="color:#94a3b8"># ligne 1 — case (1,1) en rouge</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;[<span style="color:#34d399">"."</span>, <span style="color:#34d399">"."</span>, <span style="color:#34d399">"."</span>],  <span style="color:#94a3b8"># ligne 2</span><br>
  ]<br><br>
  <span style="color:#94a3b8"># Accéder : grille[y][x]</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">grille</span>[<span style="color:#fb923c">1</span>][<span style="color:#fb923c">1</span>])  <span style="color:#94a3b8"># "R"</span>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 grille[y][x] — y d'abord, puis x</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">En informatique, on accède d'abord à la ligne (y), puis à la colonne (x). C'est l'inverse de l'ordre habituel (x, y) — attention à ne pas les confondre !</p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Sur une grille, la case en colonne 3, ligne 2 s'accède comment en Python ?",
        choices: ["grille[3][2]", "grille[2][3]", "grille(3, 2)", "case(3, 2)"],
        answer: 1,
        explanation: "✅ grille[2][3] — on accède d'abord à la ligne (y=2) puis à la colonne (x=3). L'ordre est grille[y][x], pas grille[x][y]. C'est une convention informatique universelle : lignes avant colonnes.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🗺️ x, y, couleur : les 3 ingrédients du pixel art</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : tu vas utiliser des <strong>boucles for imbriquées</strong> pour remplir des zones entières de ta grille automatiquement — plus besoin de colorier case par case !</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 2 — Dessiner avec des boucles
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 2");
  const ch2 = await upsertChapter(themeId, "Séance 2 — Boucles de dessin", "Remplir des zones avec des boucles for imbriquées.", 1);
  const l2 = await upsertLesson(ch2, themeId, "Dessiner avec des boucles — colonnes et lignes", 0, 70);
  await seedBlocks(l2, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #78350f;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">🔁 Colorier 100 cases une par une ? Non. Une boucle fait ça en 3 lignes.</p>
  <p style="color:#fde68a;margin:0">Une boucle for traverse les lignes. Une autre boucle for à l'intérieur traverse les colonnes. Deux boucles imbriquées = toute la grille en une fraction de seconde.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔁 Boucles imbriquées — parcourir une grille</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.9em;line-height:2">
  <span style="color:#94a3b8"># Afficher toute une grille 5×5</span><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">y</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">5</span>):  <span style="color:#94a3b8"># 5 lignes</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">ligne</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">""</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">x</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">5</span>):  <span style="color:#94a3b8"># 5 colonnes</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">if</span> <span style="color:#fbbf24">x</span> <span style="color:#e2e8f0">==</span> <span style="color:#fbbf24">y</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">ligne</span> <span style="color:#e2e8f0">+=</span> <span style="color:#34d399">"🟡"</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">ligne</span> <span style="color:#e2e8f0">+=</span> <span style="color:#34d399">"⬛"</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">ligne</span>)<br><br>
  <span style="color:#94a3b8"># Résultat :</span><br>
  <span style="color:#94a3b8"># 🟡⬛⬛⬛⬛</span><br>
  <span style="color:#94a3b8"># ⬛🟡⬛⬛⬛</span><br>
  <span style="color:#94a3b8"># ⬛⬛🟡⬛⬛</span><br>
  <span style="color:#94a3b8"># ⬛⬛⬛🟡⬛</span><br>
  <span style="color:#94a3b8"># ⬛⬛⬛⬛🟡</span>
</div>
<div style="background:#1e293b;border-radius:8px;padding:14px 18px;margin:12px 0">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">Logique de la diagonale :</strong> quand x == y (colonne = ligne), on est sur la diagonale. C'est la condition <code style="background:#0f172a;padding:2px 5px;border-radius:3px">if x == y</code> qui génère ce motif. Change-la en <code style="background:#0f172a;padding:2px 5px;border-radius:3px">x + y == 4</code> et tu obtiens l'anti-diagonale !
  </p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Pourquoi utilise-t-on deux boucles for imbriquées pour parcourir une grille ?",
        choices: [
          "Parce que Python n'a pas d'autre choix",
          "La boucle externe parcourt les lignes (y), la boucle interne parcourt les colonnes (x) — ensemble elles couvrent chaque case",
          "Pour aller plus vite qu'une seule boucle",
          "Parce que les listes imbriquées le requièrent",
        ],
        answer: 1,
        explanation: "✅ Exactement ! La boucle du dessus = y (lignes 0 à 4). À chaque tour, la boucle intérieure = x (colonnes 0 à 4). Pour une grille 5×5, on fait 5×5 = 25 itérations au total — une par case. C'est le motif de base pour tout traitement sur grille.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔁 Boucles imbriquées : la grille entière en 5 lignes</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : tu crées des <strong>fonctions de dessin</strong> — dessiner_carre(), dessiner_ligne(), dessiner_croix() — tes propres outils artistiques.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 3 — Fonctions de dessin personnalisées
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 3");
  const ch3 = await upsertChapter(themeId, "Séance 3 — Fonctions de dessin", "Créer des fonctions dessiner_carre, dessiner_ligne, dessiner_croix.", 2);
  const l3 = await upsertLesson(ch3, themeId, "Mes propres fonctions de dessin", 0, 80);
  await seedBlocks(l3, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#93c5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🔧 Un artiste a ses pinceaux. Un programmeur a ses fonctions.</p>
  <p style="color:#bfdbfe;margin:0">Tu vas créer tes propres outils : dessiner_carre(), dessiner_ligne(), dessiner_croix(). Ensuite, tu les assembles pour créer des formes complexes en quelques lignes.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔧 Fonctions de dessin réutilisables</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.85em;line-height:1.9">
  <span style="color:#94a3b8"># Créer une grille vide 10×10</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">nouvelle_grille</span>(<span style="color:#fb923c">taille</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">return</span> [[<span style="color:#34d399">"⬛"</span>] <span style="color:#e2e8f0">*</span> <span style="color:#fb923c">taille</span> <span style="color:#60a5fa">for</span> _ <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">taille</span>)]<br><br>
  <span style="color:#94a3b8"># Colorier un carré</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">dessiner_carre</span>(<span style="color:#fb923c">g</span>, <span style="color:#fb923c">x0</span>, <span style="color:#fb923c">y0</span>, <span style="color:#fb923c">taille</span>, <span style="color:#fb923c">couleur</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">y</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">y0</span>, <span style="color:#fb923c">y0</span> <span style="color:#e2e8f0">+</span> <span style="color:#fb923c">taille</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">x</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">x0</span>, <span style="color:#fb923c">x0</span> <span style="color:#e2e8f0">+</span> <span style="color:#fb923c">taille</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fb923c">g</span>[<span style="color:#fbbf24">y</span>][<span style="color:#fbbf24">x</span>] <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">couleur</span><br><br>
  <span style="color:#94a3b8"># Afficher la grille</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">afficher</span>(<span style="color:#fb923c">g</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">ligne</span> <span style="color:#60a5fa">in</span> <span style="color:#fb923c">g</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">""</span>.<span style="color:#60a5fa">join</span>(<span style="color:#fbbf24">ligne</span>))<br><br>
  <span style="color:#94a3b8"># Utiliser les fonctions !</span><br>
  <span style="color:#fbbf24">g</span> <span style="color:#e2e8f0">=</span> <span style="color:#fbbf24">nouvelle_grille</span>(<span style="color:#fb923c">10</span>)<br>
  <span style="color:#fbbf24">dessiner_carre</span>(<span style="color:#fbbf24">g</span>, <span style="color:#fb923c">1</span>, <span style="color:#fb923c">1</span>, <span style="color:#fb923c">4</span>, <span style="color:#34d399">"🟦"</span>)<br>
  <span style="color:#fbbf24">dessiner_carre</span>(<span style="color:#fbbf24">g</span>, <span style="color:#fb923c">5</span>, <span style="color:#fb923c">5</span>, <span style="color:#fb923c">3</span>, <span style="color:#34d399">"🟥"</span>)<br>
  <span style="color:#fbbf24">afficher</span>(<span style="color:#fbbf24">g</span>)
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Pourquoi passer la grille 'g' en paramètre de dessiner_carre() plutôt que d'utiliser une variable globale ?",
        choices: [
          "C'est obligatoire en Python",
          "Pour que la fonction puisse modifier n'importe quelle grille, pas seulement une seule grille fixe",
          "Pour que ce soit plus rapide",
          "Pour éviter les boucles imbriquées",
        ],
        answer: 1,
        explanation: "✅ En passant g en paramètre, ta fonction dessiner_carre peut travailler sur n'importe quelle grille. Tu pourrais avoir deux grilles différentes et dessiner sur l'une ou l'autre selon le besoin. C'est la puissance des fonctions avec paramètres : elles sont flexibles et réutilisables.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎨 Tes fonctions = ta boîte à outils artistique</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : <strong>ton œuvre libre</strong> — tu combines toutes tes fonctions pour créer le pixel art que TU veux.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 4 — Mon œuvre libre
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 4");
  const ch4 = await upsertChapter(themeId, "Séance 4 — Mon œuvre libre", "Créer son pixel art personnel en combinant toutes les fonctions.", 3);
  const l4 = await upsertLesson(ch4, themeId, "Mon œuvre libre — je crée avec mon code", 0, 90);
  await seedBlocks(l4, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🎨 C'est ta séance créative. Pas de consignes — juste tes idées et ton code.</p>
  <p style="color:#ddd6fe;margin:0">Tu as une grille 16×16, toutes tes fonctions, et des émojis de couleur. Crée le pixel art qui te représente : un animal, un drapeau, ton initiale, un personnage — tout est permis.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎨 La boîte à outils complète</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.82em;line-height:1.9">
  <span style="color:#94a3b8"># ========================================</span><br>
  <span style="color:#94a3b8"># PIXEL ART STUDIO — Tes outils complets</span><br>
  <span style="color:#94a3b8"># ========================================</span><br><br>
  <span style="color:#94a3b8"># Palette de couleurs</span><br>
  <span style="color:#fbbf24">NOIR</span>  <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"⬛"</span><br>
  <span style="color:#fbbf24">BLANC</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"⬜"</span><br>
  <span style="color:#fbbf24">ROUGE</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟥"</span><br>
  <span style="color:#fbbf24">BLEU</span>  <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟦"</span><br>
  <span style="color:#fbbf24">VERT</span>  <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟩"</span><br>
  <span style="color:#fbbf24">JAUNE</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟨"</span><br>
  <span style="color:#fbbf24">ORANGE</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟧"</span><br>
  <span style="color:#fbbf24">VIOLET</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟪"</span><br>
  <span style="color:#fbbf24">MARRON</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"🟫"</span><br><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">pixel</span>(<span style="color:#fb923c">g</span>, <span style="color:#fb923c">x</span>, <span style="color:#fb923c">y</span>, <span style="color:#fb923c">c</span>): <span style="color:#fb923c">g</span>[<span style="color:#fb923c">y</span>][<span style="color:#fb923c">x</span>] <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">c</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">carre</span>(<span style="color:#fb923c">g</span>, <span style="color:#fb923c">x0</span>, <span style="color:#fb923c">y0</span>, <span style="color:#fb923c">t</span>, <span style="color:#fb923c">c</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">y</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">y0</span>, <span style="color:#fb923c">y0</span><span style="color:#e2e8f0">+</span><span style="color:#fb923c">t</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">x</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">x0</span>, <span style="color:#fb923c">x0</span><span style="color:#e2e8f0">+</span><span style="color:#fb923c">t</span>): <span style="color:#fb923c">g</span>[<span style="color:#fb923c">y</span>][<span style="color:#fb923c">x</span>] <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">c</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">ligne_h</span>(<span style="color:#fb923c">g</span>, <span style="color:#fb923c">x0</span>, <span style="color:#fb923c">y</span>, <span style="color:#fb923c">longueur</span>, <span style="color:#fb923c">c</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">x</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">x0</span>, <span style="color:#fb923c">x0</span><span style="color:#e2e8f0">+</span><span style="color:#fb923c">longueur</span>): <span style="color:#fb923c">g</span>[<span style="color:#fb923c">y</span>][<span style="color:#fb923c">x</span>] <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">c</span><br>
  <span style="color:#60a5fa">def</span> <span style="color:#fbbf24">afficher</span>(<span style="color:#fb923c">g</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">for</span> <span style="color:#fbbf24">l</span> <span style="color:#60a5fa">in</span> <span style="color:#fb923c">g</span>: <span style="color:#60a5fa">print</span>(<span style="color:#34d399">""</span>.<span style="color:#60a5fa">join</span>(<span style="color:#fbbf24">l</span>))<br><br>
  <span style="color:#94a3b8"># ========================================</span><br>
  <span style="color:#94a3b8"># TON OEUVRE ICI ⬇️</span><br>
  <span style="color:#94a3b8"># ========================================</span><br>
  <span style="color:#fbbf24">g</span> <span style="color:#e2e8f0">=</span> [[<span style="color:#fbbf24">NOIR</span>] <span style="color:#e2e8f0">*</span> <span style="color:#fb923c">16</span> <span style="color:#60a5fa">for</span> _ <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">16</span>)]<br><br>
  <span style="color:#94a3b8"># Exemple : drapeau du Togo</span><br>
  <span style="color:#fbbf24">carre</span>(<span style="color:#fbbf24">g</span>, <span style="color:#fb923c">0</span>, <span style="color:#fb923c">0</span>, <span style="color:#fb923c">3</span>, <span style="color:#fbbf24">VERT</span>)<br>
  <span style="color:#fbbf24">carre</span>(<span style="color:#fbbf24">g</span>, <span style="color:#fb923c">3</span>, <span style="color:#fb923c">0</span>, <span style="color:#fb923c">3</span>, <span style="color:#fbbf24">JAUNE</span>)<br>
  <span style="color:#fbbf24">afficher</span>(<span style="color:#fbbf24">g</span>)
</div>
<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px">
  <p style="color:#4ade80;font-weight:700;margin:0 0 8px">💡 Idées d'œuvres à créer :</p>
  <ul style="color:#86efac;margin:0;padding-left:20px;line-height:1.9">
    <li>🏳️ Drapeau de ton pays</li>
    <li>😀 Emoji géant (smiley, cœur, étoile)</li>
    <li>🏠 Maison ou paysage simple</li>
    <li>🔤 Initiale de ton prénom en pixel art</li>
    <li>🎮 Personnage de jeu vidéo rétro</li>
  </ul>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Pour dessiner une ligne horizontale de 8 pixels rouges à partir de x=2, y=5, quelle fonction appelle-t-on ?",
        choices: [
          "pixel(g, 2, 5, 8, ROUGE)",
          "ligne_h(g, 2, 5, 8, ROUGE)",
          "carre(g, 2, 5, 8, ROUGE)",
          "dessin(g, 2, 5, ROUGE)",
        ],
        answer: 1,
        explanation: "✅ ligne_h(g, 2, 5, 8, ROUGE) — ligne horizontale (h), départ x=2, à la ligne y=5, longueur=8, couleur=ROUGE. Elle coloriera les cases (2,5), (3,5), (4,5)… jusqu'à (9,5). Chaque fonction a son rôle : pixel=1 case, ligne_h=ligne, carre=carré.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎨 Ton œuvre est dans le code — elle ne disparaîtra jamais</h3>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : tu <strong>prépares ta présentation</strong>. Comment expliquer ton code à un parent qui ne programme pas ?</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 5 (Juin) — Préparer la présentation
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 5 (Juin)");
  const ch5 = await upsertChapter(themeId, "Séance 5 — Préparer la présentation", "Apprendre à expliquer son code simplement pour la remise de diplôme.", 4);
  const l5 = await upsertLesson(ch5, themeId, "Je prépare ma présentation — parler de mon code", 0, 80);
  await seedBlocks(l5, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🎤 Coder, c'est bien. Expliquer ce qu'on a fait, c'est encore mieux.</p>
  <p style="color:#ddd6fe;margin:0">Les vrais développeurs expliquent leur travail à des gens qui ne programment pas. C'est la compétence la plus précieuse : transformer du code en histoire compréhensible.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎤 La structure d'une bonne présentation</h2>
<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">
  ${[
    ["1️⃣","Ce que j'ai créé (30 sec)","Montre le résultat. 'J'ai créé un pixel art du drapeau du Togo entièrement en Python.' Pas besoin d'expliquer le code encore — juste montrer."],
    ["2️⃣","Comment j'ai fait (1 min)","Explique les grandes idées, pas les détails. 'Ma grille fait 16×16 cases. J'ai des fonctions pour colorier des carrés et des lignes.' Utilise des analogies."],
    ["3️⃣","Ce que j'ai appris (30 sec)","Parle de tes difficultés et comment tu les as surmontées. 'Au début, je confondais x et y. Puis j'ai compris que y = ligne, x = colonne.'"],
    ["4️⃣","La suite (15 sec)","Ce que tu ferais en plus avec plus de temps. 'Je voudrais ajouter des animations — faire bouger les pixels !'"],
  ].map(([num, titre, desc]) => `
  <div style="background:#1e293b;border-left:4px solid #6d28d9;border-radius:0 10px 10px 0;padding:12px 16px">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:1.1em">${num}</span>
      <strong style="color:#c4b5fd">${titre}</strong>
    </div>
    <p style="color:#94a3b8;margin:0;font-size:0.9em">${desc}</p>
  </div>`).join("")}
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:16px 0">
  <strong style="color:#fbbf24">💡 Les meilleures analogies pour expliquer à tes parents</strong>
  <ul style="color:#d6d3d1;margin:8px 0 0;padding-left:20px;line-height:1.8">
    <li>Grille → "comme du papier quadrillé de dessin"</li>
    <li>Variable → "comme une boîte avec une étiquette"</li>
    <li>Boucle → "comme un disque qui se répète"</li>
    <li>Fonction → "comme une recette que j'ai inventée"</li>
  </ul>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Quelle est la première chose à montrer lors d'une présentation de code ?",
        choices: [
          "Ouvrir le code et commencer à lire les lignes",
          "Montrer le résultat (l'œuvre) avant d'expliquer le code",
          "Expliquer toutes les fonctions dans l'ordre",
          "Demander si le public a des questions",
        ],
        answer: 1,
        explanation: "✅ Toujours montrer le résultat en premier ! Les gens doivent voir ce que tu as créé avant de comprendre comment. Un parent qui voit ton pixel art du Togo sera déjà impressionné — ensuite tu peux expliquer le code en partant de ce qu'il a vu.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎤 Tu es prêt(e) à présenter ton travail !</h3>
  <p style="color:#86efac;margin:0">➡️ Séance finale 🎓 : la remise de diplôme. Tu montres ton œuvre à tes parents. C'est la fin d'une année, le début d'une carrière.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 6 (Juin) — 🎓 Remise de diplôme
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 6 (Juin) — 🎓 Finale");
  const ch6 = await upsertChapter(themeId, "Séance 6 — 🎓 Remise de diplôme", "Présenter son œuvre aux parents et célébrer une année de programmation.", 5);
  const l6 = await upsertLesson(ch6, themeId, "🎓 Je le montre à mes parents — remise de diplôme", 0, 150);
  await seedBlocks(l6, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#7c3aed,#0f172a);border-radius:16px;padding:28px 32px;text-align:center;margin-bottom:12px">
  <div style="font-size:3em;margin-bottom:8px">🎓</div>
  <h2 style="color:white;margin:0 0 8px;font-size:1.4em">Remise de diplôme CodeKids Explorateur</h2>
  <p style="color:#c4b5fd;margin:0 0 16px">Bienvenue à la cérémonie de fin d'année. Tes parents sont là. Tu vas montrer ce que tu as créé.</p>
  <div style="background:rgba(0,0,0,0.3);border-radius:10px;padding:12px 16px;display:inline-block">
    <p style="color:#ddd6fe;margin:0;font-size:0.9em">En septembre, tu programmais tes premiers pas dans un labyrinthe.<br>En juin, tu crées des œuvres d'art avec du vrai code Python.<br><strong style="color:white">C'est une transformation complète.</strong></p>
  </div>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>📜 Ce que tu maîtrises maintenant</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:16px 0">
  ${[
    ["🧩","Sept–Oct","Blockly & Algorithmes","Décomposer un problème, guider un robot, créer des boucles visuelles"],
    ["🎵","Nov–Déc","Musique & Boucles","Composer en code, boucles imbriquées, programme musical complet"],
    ["🐍","Jan–Fév","Python débutant","Variables, for, if/else, input() — vrais programmes texte"],
    ["🧠","Mar–Avr","Python avancé","elif, while, listes, fonctions, quiz interactif"],
    ["🎨","Mai–Juin","Pixel Art","Grille, coordonnées, fonctions de dessin, œuvre personnelle"],
  ].map(([emoji, mois, titre, desc]) => `
  <div style="background:#1e293b;border-radius:10px;padding:14px;grid-column:${mois === "Sept–Oct" ? "1/-1" : "auto"}">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:1.2em">${emoji}</span>
      <div>
        <div style="font-size:0.7em;color:#64748b;text-transform:uppercase;font-weight:900">${mois}</div>
        <strong style="color:#e2e8f0;font-size:0.95em">${titre}</strong>
      </div>
    </div>
    <p style="color:#64748b;margin:0;font-size:0.8em">${desc}</p>
  </div>`).join("")}
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "À quoi servent les compétences de programmation que tu as apprises cette année ?",
        choices: [
          "Seulement à faire des jeux vidéo",
          "À résoudre des problèmes, automatiser des tâches et créer des outils dans n'importe quel domaine",
          "Seulement à programmer des robots",
          "À utiliser un ordinateur plus vite",
        ],
        answer: 1,
        explanation: "✅ La programmation est un outil universel ! Médecine (analyser des données), agriculture (optimiser les récoltes), musique (créer des sons), art (pixel art, génératif), finance, éducation — tout domaine peut bénéficier du code. Tu as appris à penser de façon structurée et logique. C'est une compétence pour la vie.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#1e1b4b);border:2px solid #a78bfa;border-radius:20px;padding:32px 36px;text-align:center">
  <div style="font-size:3.5em;margin-bottom:12px">🌟🐍🎨</div>
  <h2 style="color:white;margin:0 0 10px;font-size:1.5em">Tu es un·e Explorateur·trice CodeKids !</h2>
  <p style="color:#c4b5fd;margin:0 0 20px;font-size:1em">Une année. 5 thèmes. Des dizaines de programmes. Une œuvre d'art. Des vrais algorithmes.</p>
  <div style="background:rgba(255,255,255,0.07);border-radius:12px;padding:16px 20px;margin:0 auto;max-width:400px;text-align:left">
    <p style="color:#ddd6fe;margin:0 0 6px;font-weight:900;text-align:center">Ce que tu peux dire à tes parents :</p>
    <p style="color:#c4b5fd;margin:0;font-style:italic;line-height:1.7;text-align:center">"J'ai appris à décomposer un problème, à penser comme un ordinateur, et à créer de vraies applications en Python. Mon pixel art ? Je l'ai dessiné avec du code."</p>
  </div>
  <div style="margin-top:20px;padding:12px 20px;background:rgba(167,139,250,0.1);border-radius:10px;display:inline-block">
    <p style="color:#a78bfa;margin:0;font-size:0.9em;font-weight:900">🎯 Prochain niveau : Bâtisseur</p>
    <p style="color:#c4b5fd;margin:6px 0 0;font-size:0.85em">Web, bases de données, applications réelles — si tu veux continuer !</p>
  </div>
</div>`.trim() },
    },
  ]);

  console.log("\n🎉  Seed Mai terminé !");
  console.log("   Thème  : Mon dessin existe grâce à mon code");
  console.log("   Séances : 6 (mai×4 + juin×2)");
  console.log("   Leçons : 6");
}

main().catch((e) => { console.error(e); process.exit(1); });
