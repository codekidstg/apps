/**
 * Seed Trimestre 3 — "Je parle Python" (Janvier/Février)
 * 6 séances · transition blocs visuels → code texte
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-janvier.ts
 */
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

// ── Contenu ──────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🌱  Seed Janvier — Je parle Python\n");

  const themeId = await upsertTheme(
    "Je parle Python",
    "janvier-python",
    "Passer des blocs visuels au vrai code Python : variables, boucles, conditions et premier programme interactif.",
    "Écrire de vrais programmes Python depuis zéro, utiliser variables, boucles et conditions, et créer un programme qui répond à l'utilisateur."
  );

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 1 (Janvier) — Du bloc au texte
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 1");
  const ch1 = await upsertChapter(themeId, "Séance 1 — Du bloc au texte", "Voir son bloc Blockly devenir du vrai Python.", 0);
  const l1 = await upsertLesson(ch1, themeId, "Du bloc au texte — même idée, autre langue", 0, 50);
  await seedBlocks(l1, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e3a5f,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">🐍 Tu connais déjà la programmation. Tu vas juste apprendre à l'écrire autrement.</p>
  <p style="color:#cbd5e1;margin:0">Depuis septembre, tu programmes avec des blocs colorés. Aujourd'hui, tu vas voir que <strong style="color:white">Python dit exactement la même chose</strong> — en texte.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔄 Ton bloc Blockly en vrai Python</h2>
<p>Tu te souviens du bloc <strong>🔁 Répéter N fois</strong> en novembre ? Voilà ce qu'il devient en Python :</p>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin:16px 0">
  <div style="background:#1e293b;border:2px solid #3b82f6;border-radius:10px;padding:16px">
    <p style="color:#60a5fa;font-weight:900;font-size:0.8em;margin:0 0 10px;text-transform:uppercase">🧩 Blockly</p>
    <div style="background:#2563eb;border-radius:6px;padding:8px 12px;color:white;font-weight:700;margin-bottom:6px">🔁 Répéter 3 fois</div>
    <div style="background:#1d4ed8;border-radius:6px;padding:8px 12px 8px 24px;color:white;margin-left:8px">🎵 Jouer Do</div>
  </div>
  <div style="background:#1e293b;border:2px solid #10b981;border-radius:10px;padding:16px">
    <p style="color:#34d399;font-weight:900;font-size:0.8em;margin:0 0 10px;text-transform:uppercase">🐍 Python</p>
    <pre style="margin:0;color:#a7f3d0;font-size:1em;line-height:1.8">for i in range(3):
    print("Do")</pre>
  </div>
</div>
<p>C'est <strong>exactement</strong> la même chose. <code style="background:#1e293b;padding:2px 6px;border-radius:4px">range(3)</code> = "répéter 3 fois". <code style="background:#1e293b;padding:2px 6px;border-radius:4px">print()</code> = "afficher". Le décalage (indentation) = "ce qui est à l'intérieur de la boucle".</p>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 L'indentation remplace les encoches des blocs</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">En Blockly, tu emboîtais les blocs. En Python, tu décales le texte de 4 espaces. C'est la règle n°1 de Python — ne l'oublie jamais !</p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Que fait ce code Python ?\n\nfor i in range(5):\n    print('Bonjour')",
        choices: [
          "Affiche 'Bonjour' une seule fois",
          "Affiche 'Bonjour' 5 fois à la suite",
          "Crée une variable appelée i",
          "Rien — il y a une erreur",
        ],
        answer: 1,
        explanation: "✅ Exactement ! range(5) = répéter 5 fois. À chaque tour, print('Bonjour') affiche le mot. Résultat : 5 lignes 'Bonjour'. C'est ton bloc Répéter de novembre, en Python pur !",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>📊 La table de traduction Blockly → Python</h2>
<div style="overflow-x:auto;margin:16px 0">
<table style="width:100%;border-collapse:collapse;font-size:0.9em">
  <tr style="background:#1e293b">
    <th style="padding:10px 14px;text-align:left;color:#60a5fa;font-weight:900">🧩 Blockly</th>
    <th style="padding:10px 14px;text-align:left;color:#34d399;font-weight:900">🐍 Python</th>
    <th style="padding:10px 14px;text-align:left;color:#94a3b8;font-weight:900">Signification</th>
  </tr>
  <tr style="border-bottom:1px solid #1e293b">
    <td style="padding:10px 14px;color:#e2e8f0">🔁 Répéter N fois { … }</td>
    <td style="padding:10px 14px;font-family:monospace;color:#a7f3d0">for i in range(N):<br>&nbsp;&nbsp;&nbsp;&nbsp;…</td>
    <td style="padding:10px 14px;color:#94a3b8">Boucle comptée</td>
  </tr>
  <tr style="border-bottom:1px solid #1e293b;background:#0f172a">
    <td style="padding:10px 14px;color:#e2e8f0">📢 Dire "texte"</td>
    <td style="padding:10px 14px;font-family:monospace;color:#a7f3d0">print("texte")</td>
    <td style="padding:10px 14px;color:#94a3b8">Afficher du texte</td>
  </tr>
  <tr style="border-bottom:1px solid #1e293b">
    <td style="padding:10px 14px;color:#e2e8f0">📦 Variable X = valeur</td>
    <td style="padding:10px 14px;font-family:monospace;color:#a7f3d0">x = valeur</td>
    <td style="padding:10px 14px;color:#94a3b8">Stocker une valeur</td>
  </tr>
  <tr style="background:#0f172a">
    <td style="padding:10px 14px;color:#e2e8f0">❓ Si condition { … }</td>
    <td style="padding:10px 14px;font-family:monospace;color:#a7f3d0">if condition:<br>&nbsp;&nbsp;&nbsp;&nbsp;…</td>
    <td style="padding:10px 14px;color:#94a3b8">Condition</td>
  </tr>
</table>
</div>
<p>Garde cette table en tête — tu vas utiliser ces 4 constructions tout au long de l'année.</p>`.trim() },
    },
    {
      type: "quiz", order_index: 4,
      content: {
        question: "En Python, comment écrit-on 'répéter 10 fois' ?",
        choices: ["repeat(10)", "for i in range(10):", "loop 10 times:", "répéter(10)"],
        answer: 1,
        explanation: "✅ for i in range(10): — c'est la syntaxe Python. Le 'i' est un compteur automatique (0, 1, 2… 9). Les deux-points : à la fin sont obligatoires, et ce qui suit doit être indenté de 4 espaces.",
      },
    },
    {
      type: "text", order_index: 5,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎉 Tu viens de lire du vrai Python !</h3>
  <p style="color:#86efac;margin:0 0 12px">Ce que tu as vu ce mois-ci dans les blocs, tu peux maintenant l'écrire en texte. Python n'est pas un nouveau langage inconnu — c'est juste une nouvelle façon d'écrire ce que tu sais déjà.</p>
  <p style="color:#86efac;margin:0">➡️ Prochaine séance : les <strong>variables</strong> — ton programme va avoir une mémoire.</p>
</div>
<div style="margin-top:16px;padding:12px 16px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris :</strong><br>
    ✓ Blockly et Python disent la même chose — différemment<br>
    ✓ for i in range(N): = Répéter N fois<br>
    ✓ L'indentation (4 espaces) remplace les encoches des blocs
  </p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 2 — print() et les variables
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 2");
  const ch2 = await upsertChapter(themeId, "Séance 2 — Variables", "Stocker une valeur, la modifier, la réutiliser.", 1);
  const l2 = await upsertLesson(ch2, themeId, "print() et les variables — ton programme a une mémoire", 0, 60);
  await seedBlocks(l2, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a5b4fc;font-weight:900;font-size:1.1em;margin:0 0 6px">📦 Une variable, c'est une boîte avec un nom et un contenu.</p>
  <p style="color:#c7d2fe;margin:0">Tu peux mettre n'importe quoi dedans — un nombre, un texte, un résultat de calcul. Et tu peux changer le contenu à tout moment.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>📦 Créer et utiliser une variable</h2>
<p>En Python, créer une variable est la chose la plus simple du monde :</p>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:1em;line-height:2">
  <span style="color:#fbbf24">prenom</span> <span style="color:#e2e8f0">=</span> <span style="color:#34d399">"Amavi"</span><br>
  <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">12</span><br>
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Bonjour"</span>, <span style="color:#fbbf24">prenom</span>)<br>
  <span style="color:#94a3b8"># Affiche : Bonjour Amavi</span>
</div>
<div style="display:flex;flex-direction:column;gap:10px;margin:16px 0">
  <div style="background:#1e293b;border-left:4px solid #fbbf24;padding:12px 16px;border-radius:0 8px 8px 0">
    <strong style="color:#fbbf24">prenom = "Amavi"</strong>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:0.9em">Crée une boîte appelée <em>prenom</em> et y met le texte "Amavi". Les guillemets indiquent que c'est du texte (string).</p>
  </div>
  <div style="background:#1e293b;border-left:4px solid #fb923c;padding:12px 16px;border-radius:0 8px 8px 0">
    <strong style="color:#fb923c">age = 12</strong>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:0.9em">Crée une boîte <em>age</em> avec le nombre 12. Pas de guillemets pour les nombres !</p>
  </div>
  <div style="background:#1e293b;border-left:4px solid #60a5fa;padding:12px 16px;border-radius:0 8px 8px 0">
    <strong style="color:#60a5fa">print("Bonjour", prenom)</strong>
    <p style="color:#94a3b8;margin:6px 0 0;font-size:0.9em">Affiche le texte "Bonjour" suivi du contenu de la variable prenom. La virgule ajoute un espace automatiquement.</p>
  </div>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Que va afficher ce code ?\n\nville = \"Lomé\"\nprint(\"Bienvenue à\", ville)",
        choices: ["Bienvenue à ville", "Bienvenue à Lomé", "ville = Lomé", "Erreur"],
        answer: 1,
        explanation: "✅ 'Bienvenue à Lomé' ! Python remplace le nom de la variable par son contenu. 'ville' contient 'Lomé', donc print affiche les deux avec un espace entre eux.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>🔄 Modifier une variable</h2>
<p>Une variable peut changer de valeur au fil du programme. C'est sa force !</p>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Score :"</span>, <span style="color:#fbbf24">score</span>)  <span style="color:#94a3b8"># Affiche : Score : 0</span><br><br>
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">=</span> <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">+</span> <span style="color:#fb923c">10</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Score :"</span>, <span style="color:#fbbf24">score</span>)  <span style="color:#94a3b8"># Affiche : Score : 10</span><br><br>
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fb923c">5</span>  <span style="color:#94a3b8"># Raccourci pour score = score + 5</span><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Score :"</span>, <span style="color:#fbbf24">score</span>)  <span style="color:#94a3b8"># Affiche : Score : 15</span>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">💡 score = score + 10</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Lis-le de droite à gauche : "prends la valeur actuelle de score (0), ajoute 10, et remet le résultat (10) dans score". C'est comme ça que tous les compteurs de jeux fonctionnent.</p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Quelle est la valeur de 'points' à la fin ?\n\npoints = 100\npoints = points - 30\npoints += 20",
        choices: ["100", "70", "90", "150"],
        answer: 2,
        explanation: "✅ 90 ! Étape par étape : points commence à 100, puis 100 - 30 = 70, puis 70 + 20 = 90. Les variables se modifient dans l'ordre des lignes — comme un algorithme !",
      },
    },
    {
      type: "text", order_index: 5,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">📦 Les variables : fondation de tout programme</h3>
  <p style="color:#86efac;margin:0 0 12px">Chaque application que tu utilises — jeux, réseaux sociaux, apps — stocke des données dans des variables. Ton score, ton prénom, ton niveau : tout ça, c'est des variables.</p>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : ta première boucle <code style="background:#052e16;padding:2px 6px;border-radius:4px">for</code> en Python — tu vas reconnaître novembre !</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 3 — La boucle for
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 3");
  const ch3 = await upsertChapter(themeId, "Séance 3 — La boucle for", "Reconnaitre le bloc Répéter dans le vrai Python.", 2);
  const l3 = await upsertLesson(ch3, themeId, "Ma première boucle for — tu reconnais novembre !", 0, 70);
  await seedBlocks(l3, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e293b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#60a5fa;font-weight:900;font-size:1.1em;margin:0 0 6px">🔁 Tu connais déjà les boucles. Tu as juste une nouvelle façon de les écrire.</p>
  <p style="color:#93c5fd;margin:0">En novembre, tu répétais des notes de musique avec le bloc Répéter. Aujourd'hui, c'est <code style="background:#1e3a5f;padding:2px 6px;border-radius:4px">for i in range(N):</code> — même concept, même puissance.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🔁 La boucle for avec range()</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:1em;line-height:2">
  <span style="color:#94a3b8"># Compter de 0 à 4</span><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">i</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">5</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tour numéro"</span>, <span style="color:#fbbf24">i</span>)<br>
  <span style="color:#94a3b8"># Affiche : Tour numéro 0, 1, 2, 3, 4</span>
</div>
<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin:16px 0">
  <div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center">
    <code style="color:#60a5fa;font-size:1.1em">for</code>
    <p style="color:#94a3b8;font-size:0.8em;margin:6px 0 0">mot-clé "pour chaque"</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center">
    <code style="color:#fbbf24;font-size:1.1em">i</code>
    <p style="color:#94a3b8;font-size:0.8em;margin:6px 0 0">compteur automatique (0,1,2…)</p>
  </div>
  <div style="background:#1e293b;border-radius:8px;padding:12px;text-align:center">
    <code style="color:#60a5fa;font-size:1.1em">range(5)</code>
    <p style="color:#94a3b8;font-size:0.8em;margin:6px 0 0">générer 5 nombres : 0→4</p>
  </div>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:12px 0">
  <strong style="color:#fbbf24">⚠️ range(5) = 0, 1, 2, 3, 4 (pas 1 à 5 !)</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Python commence toujours à compter à partir de 0. C'est une convention universelle en informatique. Donc range(5) donne bien 5 valeurs, mais de 0 à 4.</p>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Combien de fois 'Kirikou !' sera affiché ?\n\nfor i in range(4):\n    print('Kirikou !')",
        choices: ["3 fois", "4 fois", "5 fois", "0 fois"],
        answer: 1,
        explanation: "✅ 4 fois ! range(4) génère les valeurs 0, 1, 2, 3 — soit 4 tours de boucle. À chaque tour, print affiche 'Kirikou !'. Résultat : 4 lignes.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<h2>💡 La boucle for + variable = superpouvoir</h2>
<p>Le vrai pouvoir : combiner le compteur <code>i</code> avec des opérations !</p>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:1em;line-height:2">
  <span style="color:#94a3b8"># Table de multiplication par 3</span><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">i</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">1</span>, <span style="color:#fb923c">11</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">resultat</span> <span style="color:#e2e8f0">=</span> <span style="color:#fbbf24">i</span> <span style="color:#e2e8f0">*</span> <span style="color:#fb923c">3</span><br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#fbbf24">i</span>, <span style="color:#34d399">"×"</span>, <span style="color:#fb923c">3</span>, <span style="color:#34d399">"="</span>, <span style="color:#fbbf24">resultat</span>)<br>
  <span style="color:#94a3b8"># Affiche : 1 × 3 = 3, 2 × 3 = 6 ... 10 × 3 = 30</span>
</div>
<p><code>range(1, 11)</code> = de 1 à 10 (le 11 est exclu). C'est la table de multiplications entière en 3 lignes de code !</p>`.trim() },
    },
    {
      type: "quiz", order_index: 4,
      content: {
        question: "Que fait range(1, 6) ?",
        choices: [
          "Génère : 1, 2, 3, 4, 5, 6",
          "Génère : 1, 2, 3, 4, 5",
          "Génère : 0, 1, 2, 3, 4, 5",
          "Génère : 6 nombres aléatoires",
        ],
        answer: 1,
        explanation: "✅ range(1, 6) génère 1, 2, 3, 4, 5 — le premier argument est inclus, le dernier est exclu. C'est une règle Python : [début, fin[. Donc range(1, 6) = 5 valeurs de 1 à 5.",
      },
    },
    {
      type: "text", order_index: 5,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🔁 La boucle for : tu la maîtrises déjà !</h3>
  <p style="color:#86efac;margin:0 0 12px">Tu utilises les boucles depuis novembre. Maintenant tu peux les écrire en vrai Python. C'est cette même boucle qui anime les jeux vidéo, génère les pages web, traite les données.</p>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : <code style="background:#052e16;padding:2px 6px;border-radius:4px">if/else</code> — ton programme va prendre des décisions.</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 4 — if / else
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 4");
  const ch4 = await upsertChapter(themeId, "Séance 4 — Conditions if/else", "Première condition : deux chemins selon une valeur.", 3);
  const l4 = await upsertLesson(ch4, themeId, "if / else — ton programme choisit", 0, 70);
  await seedBlocks(l4, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1c1917,#0f172a);border:1px solid #78350f;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#fbbf24;font-weight:900;font-size:1.1em;margin:0 0 6px">❓ Jusqu'ici, tes programmes exécutaient toujours les mêmes instructions.</p>
  <p style="color:#fde68a;margin:0">Avec <code style="background:#1c1917;padding:2px 6px;border-radius:4px">if</code>, ton programme peut <strong>choisir</strong> quoi faire selon une condition. C'est la naissance de l'intelligence artificielle — dans sa forme la plus simple.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>❓ La condition if / else</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:1em;line-height:2">
  <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">14</span><br><br>
  <span style="color:#60a5fa">if</span> <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">13</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu es ado !"</span>)<br>
  <span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu es encore enfant."</span>)<br>
  <span style="color:#94a3b8"># Affiche : Tu es ado !</span>
</div>
<div style="display:flex;flex-direction:column;gap:8px;margin:16px 0">
  <div style="background:#052e16;border:1px solid #166534;border-radius:8px;padding:12px 16px">
    <code style="color:#4ade80">if age >= 13:</code>
    <p style="color:#86efac;margin:6px 0 0;font-size:0.9em">"Si age est supérieur ou égal à 13" → condition vraie → on exécute le bloc indenté</p>
  </div>
  <div style="background:#450a0a;border:1px solid #991b1b;border-radius:8px;padding:12px 16px">
    <code style="color:#f87171">else:</code>
    <p style="color:#fca5a5;margin:6px 0 0;font-size:0.9em">"Sinon" → si la condition est fausse → on exécute ce bloc à la place</p>
  </div>
</div>
<h3>Les opérateurs de comparaison :</h3>
<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:12px 0">
  ${[["==","est égal à"],["!=","est différent de"],["<","est inférieur à"],["<=","inférieur ou égal"],[">" ,"est supérieur à"],[">=","supérieur ou égal"]].map(([op, label]) => `
  <div style="background:#1e293b;border-radius:6px;padding:8px;text-align:center">
    <code style="color:#fbbf24;font-size:1.1em">${op}</code>
    <p style="color:#94a3b8;font-size:0.75em;margin:4px 0 0">${label}</p>
  </div>`).join("")}
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "score = 75\nif score >= 80:\n    print('Excellent !')\nelse:\n    print('Bien !')\n\nQu'affiche ce programme ?",
        choices: ["Excellent !", "Bien !", "75", "Rien"],
        answer: 1,
        explanation: "✅ 'Bien !' — car 75 n'est pas >= 80, la condition est fausse. Python prend donc le chemin else et affiche 'Bien !'. Si score avait été 80 ou plus, on aurait eu 'Excellent !'.",
      },
    },
    {
      type: "quiz", order_index: 3,
      content: {
        question: "En Python, == et = sont différents. Quelle est la différence ?",
        choices: [
          "Ils font la même chose",
          "= assigne une valeur, == compare deux valeurs",
          "== assigne, = compare",
          "= est pour les nombres, == pour les textes",
        ],
        answer: 1,
        explanation: "✅ C'est LA différence fondamentale : x = 5 met 5 dans x (assigner). x == 5 vérifie si x vaut 5 (comparer, résultat vrai ou faux). Confondre les deux est l'erreur numéro 1 des débutants !",
      },
    },
    {
      type: "text", order_index: 4,
      content: { html: `
<h2>🎮 Exemple concret : vérifier un score de jeu</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">=</span> <span style="color:#fb923c">0</span><br>
  <span style="color:#60a5fa">for</span> <span style="color:#fbbf24">i</span> <span style="color:#60a5fa">in</span> <span style="color:#60a5fa">range</span>(<span style="color:#fb923c">5</span>):<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">+=</span> <span style="color:#fb923c">10</span><br><br>
  <span style="color:#60a5fa">if</span> <span style="color:#fbbf24">score</span> <span style="color:#e2e8f0">==</span> <span style="color:#fb923c">50</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Score parfait !"</span>)<br>
  <span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Score :"</span>, <span style="color:#fbbf24">score</span>)
</div>
<p>Variables + boucle + condition = un vrai mini-programme de jeu. Tu viens de combiner les 3 premières séances !</p>`.trim() },
    },
    {
      type: "text", order_index: 5,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">❓ if/else : la brique de toute décision en code</h3>
  <p style="color:#86efac;margin:0 0 12px">Les assistants IA, les applications, les jeux — tout fonctionne avec des milliers de if/else imbriqués. Tu viens d'apprendre la brique la plus importante de la logique informatique.</p>
  <p style="color:#86efac;margin:0">➡️ Séance suivante : <code style="background:#052e16;padding:2px 6px;border-radius:4px">input()</code> — ton programme va enfin te parler !</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 5 (Février) — input()
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 5 (Février)");
  const ch5 = await upsertChapter(themeId, "Séance 5 — input() et interaction", "Saisie utilisateur : le programme pose des questions.", 4);
  const l5 = await upsertLesson(ch5, themeId, "input() — le programme pose des questions", 0, 80);
  await seedBlocks(l5, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#a5b4fc;font-weight:900;font-size:1.1em;margin:0 0 6px">🎤 Jusqu'ici, tes programmes ne t'écoutaient pas.</p>
  <p style="color:#c7d2fe;margin:0">Avec <code style="background:#1e1b4b;padding:2px 6px;border-radius:4px">input()</code>, ton programme peut <strong>poser une question</strong> et attendre ta réponse. C'est le début des programmes vraiment interactifs.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎤 input() — écouter l'utilisateur</h2>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:1em;line-height:2">
  <span style="color:#fbbf24">prenom</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Quel est ton prénom ? "</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Bonjour"</span>, <span style="color:#fbbf24">prenom</span>, <span style="color:#34d399">"!"</span>)<br><br>
  <span style="color:#94a3b8"># Programme : Quel est ton prénom ?</span><br>
  <span style="color:#94a3b8"># Utilisateur tape : Koffi</span><br>
  <span style="color:#94a3b8"># Programme affiche : Bonjour Koffi !</span>
</div>
<div style="background:#1c1917;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:16px 0">
  <strong style="color:#fbbf24">⚠️ input() retourne toujours du texte (string)</strong>
  <p style="color:#d6d3d1;margin:8px 0 0">Même si l'utilisateur tape un nombre, input() le donne comme texte. Pour un calcul, il faut convertir : <code style="background:#1c1917;padding:2px 6px;border-radius:4px">age = int(input("Ton âge ? "))</code></p>
</div>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.95em;line-height:2">
  <span style="color:#94a3b8"># Avec un nombre</span><br>
  <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">int</span>(<span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Ton âge ? "</span>))<br>
  <span style="color:#60a5fa">if</span> <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">>=</span> <span style="color:#fb923c">18</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu es majeur !"</span>)<br>
  <span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Encore"</span>, <span style="color:#fb923c">18</span> <span style="color:#e2e8f0">-</span> <span style="color:#fbbf24">age</span>, <span style="color:#34d399">"ans avant la majorité."</span>)
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Pourquoi écrit-on int(input(\"Ton âge ? \")) et pas juste input(\"Ton âge ? \") ?",
        choices: [
          "Pour que la question s'affiche en vert",
          "Parce que input() renvoie du texte, et int() le convertit en nombre pour faire des calculs",
          "int() est obligatoire avec input()",
          "Pour éviter les erreurs de frappe",
        ],
        answer: 1,
        explanation: "✅ Exactement ! input() renvoie toujours une chaîne de texte (string). Si l'utilisateur tape '14', input() donne le texte '14', pas le nombre 14. int() convertit '14' (texte) en 14 (nombre) pour pouvoir faire des calculs.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#0f172a);border:1px solid #166534;border-radius:12px;padding:20px 24px">
  <h3 style="color:#4ade80;margin:0 0 10px">🎤 input() : le pont entre ton programme et l'utilisateur</h3>
  <p style="color:#86efac;margin:0">➡️ Séance finale : tu combines tout pour créer ton premier <strong>vrai programme</strong> — celui que tu pourras montrer à tes parents !</p>
</div>`.trim() },
    },
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  // SÉANCE 6 (Février) — Mini-projet : programme qui me connaît
  // ══════════════════════════════════════════════════════════════════════════
  console.log("\n📖  Séance 6 (Février)");
  const ch6 = await upsertChapter(themeId, "Séance 6 — Mini-projet final", "Combiner variables + boucle + if + input en un vrai programme.", 5);
  const l6 = await upsertLesson(ch6, themeId, "Mini-projet : mon programme qui me connaît", 0, 100);
  await seedBlocks(l6, themeId, [
    {
      type: "text", order_index: 0,
      content: { html: `
<div style="background:linear-gradient(135deg,#1e1b4b,#0f172a);border:1px solid #6d28d9;border-radius:12px;padding:20px 24px;margin-bottom:8px">
  <p style="color:#c4b5fd;font-weight:900;font-size:1.1em;margin:0 0 6px">🏆 Séance finale — tu combines tout ce que tu sais.</p>
  <p style="color:#ddd6fe;margin:0">Variables, boucle for, condition if/else, saisie input() — tu vas maintenant écrire un programme complet qui pose des questions et répond de façon personnalisée.</p>
</div>`.trim() },
    },
    {
      type: "text", order_index: 1,
      content: { html: `
<h2>🎯 Le programme "qui me connaît"</h2>
<p>Voici ce que tu vas construire étape par étape :</p>
<div style="background:#0f172a;border-radius:10px;padding:20px;margin:16px 0;font-family:monospace;font-size:0.9em;line-height:2">
  <span style="color:#94a3b8"># === Mon programme qui me connaît ===</span><br><br>
  <span style="color:#fbbf24">prenom</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Quel est ton prénom ? "</span>)<br>
  <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">int</span>(<span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Quel est ton âge ? "</span>))<br>
  <span style="color:#fbbf24">ville</span> <span style="color:#e2e8f0">=</span> <span style="color:#60a5fa">input</span>(<span style="color:#34d399">"Dans quelle ville habites-tu ? "</span>)<br><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"\\n--- Profil de"</span>, <span style="color:#fbbf24">prenom</span>, <span style="color:#34d399">"---"</span>)<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Ville :"</span>, <span style="color:#fbbf24">ville</span>)<br><br>
  <span style="color:#60a5fa">if</span> <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">&lt;</span> <span style="color:#fb923c">13</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu as"</span>, <span style="color:#fbbf24">age</span>, <span style="color:#34d399">"ans — tu es dans les plus jeunes de CodeKids !"</span>)<br>
  <span style="color:#60a5fa">elif</span> <span style="color:#fbbf24">age</span> <span style="color:#e2e8f0">&lt;=</span> <span style="color:#fb923c">15</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu as"</span>, <span style="color:#fbbf24">age</span>, <span style="color:#34d399">"ans — l'âge idéal pour apprendre Python !"</span>)<br>
  <span style="color:#60a5fa">else</span>:<br>
  &nbsp;&nbsp;&nbsp;&nbsp;<span style="color:#60a5fa">print</span>(<span style="color:#34d399">"Tu as"</span>, <span style="color:#fbbf24">age</span>, <span style="color:#34d399">"ans — tu peux déjà viser les concours !"</span>)<br><br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"\\nNombre de lettres dans ton prénom :"</span>, <span style="color:#60a5fa">len</span>(<span style="color:#fbbf24">prenom</span>))<br>
  <span style="color:#60a5fa">print</span>(<span style="color:#34d399">"À bientôt,"</span>, <span style="color:#fbbf24">prenom</span>, <span style="color:#34d399">"! 👋"</span>)
</div>
<div style="background:#052e16;border:1px solid #166534;border-radius:10px;padding:14px 18px;margin:12px 0">
  <p style="color:#4ade80;font-weight:700;margin:0 0 8px">✨ Ce programme utilise :</p>
  <ul style="color:#86efac;margin:0;padding-left:20px;line-height:1.8">
    <li><code>input()</code> — 3 questions à l'utilisateur</li>
    <li><code>int()</code> — conversion texte → nombre</li>
    <li><code>if / elif / else</code> — 3 chemins selon l'âge</li>
    <li><code>len()</code> — compter les lettres d'un texte</li>
    <li>Variables — stocker et réutiliser les réponses</li>
  </ul>
</div>`.trim() },
    },
    {
      type: "quiz", order_index: 2,
      content: {
        question: "Dans le programme, que fait len(prenom) si prenom = \"Amavi\" ?",
        choices: ["Affiche le prénom en majuscules", "Retourne 5 (le nombre de lettres)", "Supprime la variable prenom", "Retourne 'Amavi'"],
        answer: 1,
        explanation: "✅ len() compte les caractères d'une chaîne de texte. 'Amavi' a 5 lettres → len('Amavi') = 5. C'est une fonction Python intégrée très utile pour travailler avec du texte.",
      },
    },
    {
      type: "text", order_index: 3,
      content: { html: `
<div style="background:linear-gradient(135deg,#052e16,#1e1b4b);border:1px solid #4ade80;border-radius:16px;padding:24px 28px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:8px">🐍</div>
  <h2 style="color:#4ade80;margin:0 0 10px">Tu parles Python !</h2>
  <p style="color:#a7f3d0;margin:0 0 16px">En deux mois, tu es passé des blocs visuels au vrai code texte. Variables, boucles, conditions, saisie utilisateur — c'est le cœur de Python.</p>
</div>
<div style="margin-top:20px;padding:16px 20px;background:#1e293b;border-radius:10px">
  <p style="color:#94a3b8;margin:0;font-size:0.9em">
    <strong style="color:#e2e8f0">📌 Ce que tu as appris ce trimestre :</strong><br>
    ✓ Bloc → Python : même logique, autre syntaxe<br>
    ✓ Variables : stocker, modifier, réutiliser<br>
    ✓ for i in range(N) : ta boucle de novembre en Python<br>
    ✓ if / elif / else : deux ou plusieurs chemins<br>
    ✓ input() + int() : rendre un programme interactif
  </p>
</div>
<div style="margin-top:16px;background:linear-gradient(135deg,#1e1b4b,#1c1917);border:1px solid #6d28d9;border-radius:12px;padding:18px 22px">
  <p style="color:#c4b5fd;font-weight:900;margin:0 0 8px">🎯 Prochain thème — Mars :</p>
  <p style="color:#ddd6fe;margin:0">"<strong>Mon programme prend des décisions</strong>" — while, elif, listes et tes propres fonctions. Tu vas créer un vrai quiz interactif que tes parents pourront jouer !</p>
</div>`.trim() },
    },
  ]);

  console.log("\n🎉  Seed Janvier terminé !");
  console.log("   Thème  : Je parle Python");
  console.log("   Séances : 6 (jan×4 + fév×2)");
  console.log("   Leçons : 6");
}

main().catch((e) => { console.error(e); process.exit(1); });
