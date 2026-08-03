/**
 * Seed — 4 entraînements variés pour Séance 1 "L'ordinateur, la machine magique"
 * Types utilisés : swipe_sort · match · drag_to_bin · fill_blank
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-trainings-seance1-ordinateur.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "9cecb7fd-330a-4c3d-a374-ec81203abc65"; // L'ordinateur, la machine magique

const TRAININGS = [
  // ═══════════════════════════════════════════════════════════════════════════
  // E1 — swipe_sort : Vrai ordinateur ou pas ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Vrai ordinateur ou pas ?",
    description: "Kirikou explore Lomé — trie chaque objet : ordinateur ou pas ?",
    xp_reward: 30,
    order_index: 0,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Kirikou explore Lomé</h2>
  <p style="color:#cbd5e1;margin:0 0 10px;line-height:1.6">Kirikou se promène et voit des machines partout. Un vrai ordinateur <strong style="color:#FDB813">reçoit des données</strong>, les <strong style="color:#60a5fa">traite</strong> et produit un <strong style="color:#10b981">résultat</strong> — il peut changer de programme.</p>
  <p style="color:#94a3b8;font-size:0.9em;margin:0">👆 Pour chaque objet : choisis <strong style="color:#10b981">ORDINATEUR</strong> ou <strong style="color:#ef4444">PAS UN ORDI</strong>.</p>
</div>`,
        },
      },
      {
        type: "swipe_sort",
        order_index: 1,
        content: {
          title: "Trie les machines !",
          instruction: "Clique sur la bonne catégorie pour chaque objet.",
          categories: [
            { id: "yes", label: "Ordinateur ✅", color: "#10b981", emoji: "🖥️" },
            { id: "no",  label: "Pas un ordi ❌", color: "#ef4444", emoji: "🚫" },
          ],
          items: [
            { id: "smartphone",  label: "Smartphone",           emoji: "📱", correct: "yes" },
            { id: "tv",          label: "Vieille télé (sans Wi-Fi)", emoji: "📺", correct: "no"  },
            { id: "dab",         label: "Distributeur de billets", emoji: "🏧", correct: "yes" },
            { id: "montre",      label: "Montre à pile (simple)", emoji: "⌚", correct: "no"  },
            { id: "decoder",     label: "Décodeur CANAL+",      emoji: "📡", correct: "yes" },
            { id: "robot",       label: "Robot aspirateur sans Wi-Fi", emoji: "🤖", correct: "yes" },
            { id: "calculette",  label: "Calculatrice scientifique", emoji: "🔢", correct: "no"  },
            { id: "console",     label: "Console de jeux",      emoji: "🎮", correct: "yes" },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E2 — match : Qui fait quoi dans l'ordinateur ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Qui fait quoi dans l'ordinateur ?",
    description: "Relie chaque composant à son rôle — comme les membres du corps de Kirikou.",
    xp_reward: 35,
    order_index: 1,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Le corps de Kirikou</h2>
  <p style="color:#cbd5e1;margin:0;line-height:1.6">Chaque composant d'un ordinateur a un rôle précis — comme les parties de ton corps. <strong style="color:#FDB813">Relie chaque composant à sa définition</strong> en cliquant d'abord sur un concept, puis sur sa définition.</p>
</div>`,
        },
      },
      {
        type: "match",
        order_index: 1,
        content: {
          title: "Composant → Rôle",
          pairs: [
            { left: "🧠 CPU (Processeur)",        right: "Fait tous les calculs — c'est le cerveau" },
            { left: "📋 RAM",                      right: "Mémoire de travail — s'efface à l'extinction" },
            { left: "🗃️ SSD / Disque dur",         right: "Garde tes fichiers même éteint" },
            { left: "⌨️ Clavier / Écran tactile",  right: "Envoie des données À l'ordinateur (entrée)" },
            { left: "🖥️ Écran / Haut-parleur",     right: "Reçoit les données DE l'ordinateur (sortie)" },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E3 — drag_to_bin : Entrée, Sortie ou les deux ?
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Entrée, Sortie ou les deux ?",
    description: "Glisse chaque périphérique dans le bon bac — Kirikou doit savoir qui lui parle !",
    xp_reward: 40,
    order_index: 2,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `<div style="background:linear-gradient(135deg,#0f172a,#1e293b);border:1px solid #FDB81340;border-radius:14px;padding:20px 24px">
  <h2 style="color:#FDB813;margin:0 0 10px;font-size:1.2em">🤖 Kirikou trie ses sens</h2>
  <p style="color:#cbd5e1;margin:0 0 8px;line-height:1.6"><strong style="color:#10b981">Entrée</strong> = l'ordinateur <em>reçoit</em> des données. <strong style="color:#f97316">Sortie</strong> = l'ordinateur <em>envoie</em> des données. <strong style="color:#a78bfa">Les deux</strong> = il fait les deux à la fois !</p>
  <p style="color:#94a3b8;font-size:0.88em;margin:0">👆 Clique sur un objet, puis sur le bon bac.</p>
</div>`,
        },
      },
      {
        type: "drag_to_bin",
        order_index: 1,
        content: {
          title: "Classe les périphériques",
          bins: [
            { id: "input",  label: "ENTRÉE",    color: "#10b981", emoji: "⬇️" },
            { id: "output", label: "SORTIE",    color: "#f97316", emoji: "⬆️" },
            { id: "both",   label: "LES DEUX",  color: "#a78bfa", emoji: "↕️" },
          ],
          items: [
            { id: "clavier",     label: "Clavier",          emoji: "⌨️", correct: "input"  },
            { id: "ecran",       label: "Écran",            emoji: "🖥️", correct: "output" },
            { id: "micro",       label: "Microphone",       emoji: "🎙️", correct: "input"  },
            { id: "speaker",     label: "Haut-parleur",     emoji: "🔊", correct: "output" },
            { id: "tactile",     label: "Écran tactile",    emoji: "📱", correct: "both"   },
            { id: "gps",         label: "GPS",              emoji: "📍", correct: "input"  },
            { id: "vibration",   label: "Vibration",        emoji: "📳", correct: "output" },
            { id: "webcam",      label: "Webcam",           emoji: "📷", correct: "input"  },
          ],
        },
      },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // E4 — fill_blank : Kirikou a besoin de toi !
  // ═══════════════════════════════════════════════════════════════════════════
  {
    title: "Kirikou a besoin de toi !",
    description: "Complète les phrases clés — prouve que tu maîtrises les bases avant d'entrer dans le labyrinthe.",
    xp_reward: 45,
    order_index: 3,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          html: `<div style="background:linear-gradient(135deg,#1a0f2e,#0f172a);border:1px solid #a78bfa40;border-radius:14px;padding:20px 24px">
  <h2 style="color:#a78bfa;margin:0 0 10px;font-size:1.2em">🏆 Le test final de Kirikou</h2>
  <p style="color:#cbd5e1;margin:0;line-height:1.6">Kirikou est à l'entrée du labyrinthe. Avant d'y aller, il veut vérifier que tu as bien compris comment il fonctionne. <strong style="color:#FDB813">Complète chaque phrase</strong> avec le bon mot.</p>
</div>`,
        },
      },
      {
        type: "fill_blank",
        order_index: 1,
        content: {
          title: "Complète les phrases",
          sentences: [
            {
              id: "s1",
              before: "Les blocs de commande que tu envoies à Kirikou sont une",
              after: "pour lui.",
              options: ["entrée", "sortie", "mémoire"],
              correct: 0,
            },
            {
              id: "s2",
              before: "Quand tu éteins Kirikou, la",
              after: "s'efface — il oublie sa position.",
              options: ["RAM", "SSD", "CPU"],
              correct: 0,
            },
            {
              id: "s3",
              before: "Le composant qui calcule le chemin le plus court dans le labyrinthe s'appelle le",
              after: ".",
              options: ["CPU", "écran", "clavier"],
              correct: 0,
            },
            {
              id: "s4",
              before: "La carte du labyrinthe est sauvegardée en permanence dans le",
              after: "de Kirikou.",
              options: ["stockage (SSD)", "RAM", "processeur"],
              correct: 0,
            },
            {
              id: "s5",
              before: "Quand Kirikou affiche sa position sur l'écran, c'est une",
              after: "de sa part.",
              options: ["sortie", "entrée", "sauvegarde"],
              correct: 0,
            },
            {
              id: "s6",
              before: "Un smartphone est un ordinateur car il peut",
              after: "des programmes différents.",
              options: ["exécuter", "effacer", "éteindre"],
              correct: 0,
            },
          ],
        },
      },
      {
        type: "text",
        order_index: 2,
        content: {
          html: `<div style="background:linear-gradient(135deg,#10b98115,#1e293b);border:1px solid #10b98140;border-radius:14px;padding:20px 24px;text-align:center">
  <div style="font-size:2.5em;margin-bottom:8px">🎉</div>
  <h2 style="color:#10b981;margin:0 0 6px">Séance 1 terminée !</h2>
  <p style="color:#94a3b8;margin:0;font-size:0.95em">Tu connais maintenant l'ordinateur de l'intérieur. <strong style="color:#FDB813">Dans la Séance 2</strong>, tu vas écrire tes premiers algorithmes pour guider Kirikou dans le labyrinthe. 🚀</p>
</div>`,
        },
      },
    ],
  },
];

// ─── Insertion ───────────────────────────────────────────────────────────────

async function main() {
  const { data: existing } = await (supabase.from("trainings") as any)
    .select("id")
    .eq("lesson_id", LESSON_ID);

  if (existing?.length) {
    for (const t of existing) {
      await (supabase.from("training_blocks") as any).delete().eq("training_id", t.id);
    }
    await (supabase.from("trainings") as any).delete().eq("lesson_id", LESSON_ID);
    console.log(`🗑️  ${existing.length} entraînement(s) existant(s) supprimé(s)`);
  }

  for (const [i, training] of TRAININGS.entries()) {
    const { blocks, ...trainingData } = training;

    const { data: t, error: tErr } = await (supabase.from("trainings") as any)
      .insert({ ...trainingData, lesson_id: LESSON_ID })
      .select("id")
      .single();

    if (tErr || !t) { console.error(`❌ [${i + 1}] ${training.title}:`, tErr?.message); continue; }

    for (const block of blocks) {
      const { error: bErr } = await (supabase.from("training_blocks") as any).insert({
        ...block,
        training_id: t.id,
      });
      if (bErr) console.error(`  ❌ bloc ${block.order_index}:`, bErr.message);
    }

    console.log(`✓ [${i + 1}/${TRAININGS.length}] ${training.title} (${training.xp_reward} XP) [${blocks.filter(b => b.type !== "text").map(b => b.type).join(", ")}]`);
  }

  console.log(`\n🎉 ${TRAININGS.length} entraînements créés pour 'L'ordinateur, la machine magique' !`);
}

main().catch(console.error);
