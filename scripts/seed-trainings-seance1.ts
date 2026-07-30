/**
 * Seed — 5 entraînements pour Séance 1 "Mon premier algorithme"
 * Usage : pnpm dotenv -e .env.local -- tsx scripts/seed-trainings-seance1.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const LESSON_ID = "f0ee843c-ba50-404f-a5c3-1f33b15d5598"; // Mon premier algorithme

const TRAININGS = [
  {
    title: "Révise le vocabulaire",
    description: "Teste ta mémoire sur les mots-clés du cours.",
    xp_reward: 30,
    order_index: 0,
    blocks: [
      {
        type: "quiz",
        order_index: 0,
        content: {
          questions: [
            {
              id: "q1", question: "Qu'est-ce qu'un algorithme ?",
              type: "mcq",
              choices: ["Une suite d'instructions pour résoudre un problème", "Un type de robot", "Une erreur dans le code"],
              answer: 0,
              explanation: "Un algorithme est une suite d'instructions précises qui permet de résoudre un problème étape par étape.",
            },
            {
              id: "q2", question: "Une 'séquence' en programmation, c'est…",
              type: "mcq",
              choices: ["Des instructions exécutées dans l'ordre", "Une boucle qui tourne en cercle", "Un message d'erreur"],
              answer: 0,
              explanation: "Une séquence, c'est simplement des instructions exécutées une après l'autre, dans l'ordre.",
            },
            {
              id: "q3", question: "Une 'instruction', c'est…",
              type: "mcq",
              choices: ["Un ordre donné au robot", "Le nom du robot", "La couleur du labyrinthe"],
              answer: 0,
              explanation: "Une instruction est un ordre précis qu'on donne au programme : avance, tourne à gauche, etc.",
            },
            {
              id: "q4", question: "Un 'bug', c'est…",
              type: "mcq",
              choices: ["Une erreur dans le programme", "Un robot spécial", "Une victoire dans le labyrinthe"],
              answer: 0,
              explanation: "Un bug est une erreur dans le code qui fait que le programme ne se comporte pas comme prévu.",
            },
            {
              id: "q5", question: "Une 'boucle' permet de…",
              type: "mcq",
              choices: ["Répéter une instruction plusieurs fois", "Aller plus vite", "Effacer le labyrinthe"],
              answer: 0,
              explanation: "Une boucle répète automatiquement une ou plusieurs instructions un certain nombre de fois.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Lis le chemin",
    description: "Lis un labyrinthe et choisis la bonne séquence d'instructions.",
    xp_reward: 35,
    order_index: 1,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          markdown: `# Lis le chemin

Pour chaque question, regarde le labyrinthe et choisis la **bonne séquence** d'instructions pour aller de 🤖 à 🏁.

Rappel des instructions :
- **↑** = Avancer
- **←** = Tourner à gauche
- **→** = Tourner à gauche

Le robot part toujours face au nord (vers le haut).`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Grille 3×3 — Le robot 🤖 est en bas à gauche, l'arrivée 🏁 est en haut à gauche. Quel chemin ?",
              type: "mcq",
              choices: ["↑ ↑", "→ ↑ ↑", "↑ → ↑"],
              answer: 0,
              explanation: "Le robot est déjà aligné avec l'arrivée, il suffit d'avancer deux fois vers le haut.",
            },
            {
              id: "q2",
              question: "Grille 3×3 — Le robot est en bas à gauche, l'arrivée est en bas à droite. Quel chemin ?",
              type: "mcq",
              choices: ["→ ↑ ↑", "→ → ↑", "↑ → ↑ → ↑"],
              answer: 1,
              explanation: "Le robot tourne à droite (il fait maintenant face à l'est) puis avance deux fois.",
            },
            {
              id: "q3",
              question: "Grille 4×4 — Robot en bas à gauche, arrivée en haut à droite. Quel chemin est correct ?",
              type: "mcq",
              choices: ["↑ ↑ ↑ → → →", "→ → → ↑ ↑ ↑", "↑ → ↑ → ↑ →"],
              answer: 1,
              explanation: "On peut d'abord aller à droite 3 fois, puis monter 3 fois. Les deux sens sont valides mais ici seule la 2ème option est proposée correctement.",
            },
            {
              id: "q4",
              question: "Le robot doit éviter un mur. Il avance, se retrouve bloqué, et doit contourner. Quelle instruction lui permet de changer de direction ?",
              type: "mcq",
              choices: ["Tourner à gauche ou à droite", "Avancer encore", "S'arrêter définitivement"],
              answer: 0,
              explanation: "Pour contourner un obstacle, le robot doit d'abord tourner (gauche ou droite) avant de pouvoir avancer dans une nouvelle direction.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Trouve le bug",
    description: "Une séquence d'instructions est donnée — repère celle qui est fausse.",
    xp_reward: 40,
    order_index: 2,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          markdown: `# Trouve le bug 🐛

Dans chaque question, une séquence d'instructions est donnée pour guider le robot.
**Mais une instruction est fausse ou manquante !** Trouve laquelle.`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "q1",
              question: "Le robot doit aller tout droit sur 3 cases. La séquence est : ↑ ↑. Quel est le bug ?",
              type: "mcq",
              choices: ["Il manque un ↑", "Il y a un ↑ en trop", "Il faut ajouter un →"],
              answer: 0,
              explanation: "Pour parcourir 3 cases, il faut 3 fois ↑. La séquence ↑ ↑ ne fait avancer que de 2 cases.",
            },
            {
              id: "q2",
              question: "Pour aller de gauche à droite, le robot exécute : ↑ → ↑. Quel est le problème ?",
              type: "mcq",
              choices: ["Le premier ↑ est inutile, il fallait d'abord →", "Il manque un ↑ à la fin", "La séquence est correcte"],
              answer: 0,
              explanation: "Le robot part face au nord. Pour aller à droite, il doit d'abord tourner → puis avancer ↑. Démarrer avec ↑ l'emmène dans la mauvaise direction.",
            },
            {
              id: "q3",
              question: "Séquence : → ↑ ↑ ← ↑. Le robot devait faire un L. Quelle instruction est en trop ?",
              type: "mcq",
              choices: ["Le ← final avant le dernier ↑", "Le premier →", "Un des ↑ du milieu"],
              answer: 0,
              explanation: "Pour faire un L, on tourne à droite →, on avance ↑ ↑, puis on tourne à gauche ← et on avance ↑. Le ← est nécessaire mais mal positionné ici.",
            },
            {
              id: "q4",
              question: "Le robot doit revenir au point de départ après avoir avancé de 2 cases. Séquence : ↑ ↑ ↓. Qu'est-ce qui ne va pas ?",
              type: "mcq",
              choices: ["Il faut ↑ ↑ puis faire demi-tour : ← ← ↑ ↑", "Il faut juste ajouter ↓ une fois de plus", "La séquence est correcte"],
              answer: 0,
              explanation: "Pour revenir au point de départ, le robot doit faire demi-tour (deux rotations à gauche ou droite) puis avancer autant qu'il est parti.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Labyrinthe express",
    description: "Un nouveau labyrinthe à résoudre — même mécanique, nouveau défi !",
    xp_reward: 50,
    order_index: 3,
    blocks: [
      {
        type: "text",
        order_index: 0,
        content: {
          markdown: `# Labyrinthe express 🤖

Résous ce nouveau labyrinthe en utilisant les blocs d'instructions.

**Rappel** : tu peux utiliser Avancer, Tourner à gauche, Tourner à droite.

Trouve le chemin le plus court !`,
        },
      },
      {
        type: "quiz",
        order_index: 1,
        content: {
          questions: [
            {
              id: "maze1",
              question: "Labyrinthe 3×3 : Robot en (0,2) face au nord, arrivée en (2,0). Il y a un mur en (1,1). Quelle séquence évite le mur ?",
              type: "mcq",
              choices: ["↑ → ↑ → ↑", "↑ ↑ → → ↑", "→ ↑ ↑ ↑ →"],
              answer: 0,
              explanation: "On monte d'abord, puis on tourne à droite pour contourner le mur en (1,1), puis on monte encore pour atteindre l'arrivée.",
            },
            {
              id: "maze2",
              question: "Même labyrinthe : quelle est la séquence la plus courte pour aller de (0,2) à (2,2) sans obstacles ?",
              type: "mcq",
              choices: ["→ → (2 instructions)", "↑ → → ↓ (4 instructions)", "→ ↑ → ↓ (4 instructions)"],
              answer: 0,
              explanation: "Sur la même ligne, il suffit de tourner vers l'est puis d'avancer 2 fois. C'est le chemin le plus court.",
            },
            {
              id: "maze3",
              question: "Un robot a 8 blocs disponibles. Le chemin optimal est 6 instructions. Peut-il résoudre le labyrinthe ?",
              type: "mcq",
              choices: ["Oui, 6 < 8 donc il en a assez", "Non, il faut exactement 8 blocs", "Ça dépend du labyrinthe"],
              answer: 0,
              explanation: "6 instructions < 8 blocs disponibles. Le robot peut résoudre le labyrinthe en utilisant seulement 6 de ses 8 blocs.",
            },
          ],
        },
      },
    ],
  },
  {
    title: "Défi chrono",
    description: "6 questions rapides pour tout consolider. Vas-y vite !",
    xp_reward: 45,
    order_index: 4,
    blocks: [
      {
        type: "quiz",
        order_index: 0,
        content: {
          questions: [
            {
              id: "q1", question: "Un algorithme est toujours composé d'instructions dans un ordre précis ?",
              type: "mcq",
              choices: ["Vrai", "Faux"],
              answer: 0,
              explanation: "Oui ! L'ordre des instructions est crucial. Changer l'ordre change le résultat.",
            },
            {
              id: "q2", question: "Si le robot tourne deux fois à gauche, dans quelle direction regarde-t-il maintenant (il regardait au nord) ?",
              type: "mcq",
              choices: ["Sud", "Est", "Ouest", "Nord"],
              answer: 0,
              explanation: "Nord → après 1er ← : Ouest → après 2ème ← : Sud.",
            },
            {
              id: "q3", question: "Une boucle 'répète 3 fois ↑' est équivalente à…",
              type: "mcq",
              choices: ["↑ ↑ ↑", "↑ ↑", "↑ ↑ ↑ ↑"],
              answer: 0,
              explanation: "Répéter 3 fois l'instruction ↑ = écrire ↑ trois fois à la suite.",
            },
            {
              id: "q4", question: "Un robot exécute : → ↑ ↑ ← ↑. Combien de cases a-t-il parcourues en tout ?",
              type: "mcq",
              choices: ["3", "4", "5", "2"],
              answer: 0,
              explanation: "↑ ↑ ↑ = 3 instructions d'avancement. Les rotations (→ ←) ne font pas bouger le robot.",
            },
            {
              id: "q5", question: "Qu'est-ce qui différencie une boucle d'une séquence simple ?",
              type: "mcq",
              choices: ["La boucle répète automatiquement", "La boucle va plus vite", "La boucle ne peut pas avoir de bug"],
              answer: 0,
              explanation: "La boucle répète une ou plusieurs instructions un certain nombre de fois, sans les réécrire à chaque fois.",
            },
            {
              id: "q6", question: "Peut-on résoudre un labyrinthe sans algorithme ?",
              type: "mcq",
              choices: ["Non, on a toujours besoin d'un plan", "Oui, en tâtonnant", "Ça dépend de la taille"],
              answer: 0,
              explanation: "Techniquement on peut tâtonner, mais un algorithme garantit de trouver la solution de façon méthodique et efficace.",
            },
          ],
        },
      },
    ],
  },
];

async function main() {
  // Supprimer les entraînements existants pour cette leçon
  const { data: existing } = await supabase
    .from("trainings").select("id").eq("lesson_id", LESSON_ID);
  if (existing?.length) {
    await supabase.from("trainings").delete().eq("lesson_id", LESSON_ID);
    console.log(`🗑️  ${existing.length} entraînement(s) existant(s) supprimé(s)`);
  }

  for (const t of TRAININGS) {
    const { blocks, ...trainingData } = t;
    const { data: training, error } = await supabase
      .from("trainings")
      .insert({ ...trainingData, lesson_id: LESSON_ID })
      .select("id")
      .single<{ id: string }>();

    if (error || !training) { console.error("❌ Erreur training:", error); continue; }

    for (const b of blocks) {
      const { error: be } = await supabase
        .from("training_blocks")
        .insert({ ...b, training_id: training.id });
      if (be) console.error("❌ Erreur bloc:", be);
    }

    console.log(`✓ [${t.order_index + 1}/5] ${t.title} (${t.xp_reward} XP)`);
  }

  console.log("\n🎉 5 entraînements créés pour 'Mon premier algorithme' !");
}

main().catch(console.error);
