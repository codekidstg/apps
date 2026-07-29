/**
 * Migration: ajoute la colonne competencies à la table themes
 * et seed les compétences pour chaque thème
 * Usage: npx tsx scripts/migrate-competencies.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const COMPETENCIES: Record<string, string[]> = {
  "08ede49c-2b54-4bae-90b7-c786aa020770": [ // Introduction à Python
    "Syntaxe Python et types de données",
    "Structures de contrôle (if/else, boucles)",
    "Fonctions et portée des variables",
    "Manipulation de listes et dictionnaires",
    "Débogage et lecture d'erreurs",
  ],
  "b2000001-0000-0000-0000-000000000001": [ // Python pour les Bâtisseurs
    "Pensée algorithmique et pseudo-code",
    "Python intermédiaire : fonctions avancées",
    "Programmation orientée objet (classes)",
    "Gestion de fichiers et exceptions",
    "Modules et bibliothèques Python",
  ],
  "b2000002-0000-0000-0000-000000000001": [ // Construire des pages web
    "HTML5 : structure et sémantique",
    "CSS3 : mise en forme et mise en page",
    "Flexbox et Grid Layout",
    "Responsive design (mobile-first)",
    "Formulaires et accessibilité web",
  ],
  "b2000003-0000-0000-0000-000000000001": [ // Hygiène & Citoyenneté Numériques
    "Identité numérique et traces en ligne",
    "Droits et devoirs sur internet",
    "Protection des données personnelles (RGPD)",
    "Cyberharcèlement : reconnaissance et réaction",
    "Évaluation de la fiabilité des sources",
  ],
  "b3000001-0000-0000-0000-000000000001": [ // Python Avancé & JavaScript
    "JavaScript : DOM et événements",
    "Python avancé : décorateurs et générateurs",
    "APIs REST et requêtes HTTP",
    "Gestion asynchrone (async/await)",
    "Tests unitaires et débogage avancé",
  ],
  "b3000002-0000-0000-0000-000000000001": [ // Algorithmes & Structures de données
    "Complexité algorithmique O(n)",
    "Algorithmes de tri (bulles, sélection, fusion)",
    "Structures : piles, files, arbres, graphes",
    "Recherche binaire et récursivité",
    "Parcours de graphes (BFS/DFS)",
  ],
  "b3000003-0000-0000-0000-000000000001": [ // Cybersécurité Éthique & Défensive
    "Principes OWASP et vulnérabilités courantes",
    "Chiffrement et cryptographie de base",
    "Sécurité des mots de passe et authentification",
    "Tests de pénétration éthiques",
    "Réponse aux incidents et forensique numérique",
  ],
  "b3000004-0000-0000-0000-000000000001": [ // Bases de l'Intelligence Artificielle
    "Concepts fondamentaux du machine learning",
    "Données d'entraînement et biais algorithmiques",
    "Réseaux de neurones : fonctionnement",
    "Éthique de l'IA et enjeux sociétaux",
    "Implémentation d'un modèle simple avec Python",
  ],
  "b457dd7a-1d0c-423e-b97f-ca4f670d1584": [ // Game Studio T1
    "Environnement de développement Python",
    "Variables, types et opérations de base",
    "Boucles et structures conditionnelles",
    "Fonctions et décomposition de problèmes",
    "Logique de jeu et interactions utilisateur",
  ],
};

async function run() {
  console.log("🔧 Ajout de la colonne competencies via RPC...");

  // Supabase REST API ne permet pas ALTER TABLE directement.
  // On utilise la fonction pg_query si disponible, sinon on passe par une
  // table de mapping temporaire ou on update via PATCH les lignes existantes.
  // Ici on tente via l'API REST standard (PATCH sur chaque thème).

  let successCount = 0;
  for (const [themeId, competencies] of Object.entries(COMPETENCIES)) {
    const { error } = await (supabase.from("themes") as any)
      .update({ competencies })
      .eq("id", themeId);

    if (error) {
      if (error.code === "42703") {
        console.error("❌ La colonne 'competencies' n'existe pas encore.");
        console.error("   → Exécutez ce SQL dans le dashboard Supabase :");
        console.error("   ALTER TABLE themes ADD COLUMN IF NOT EXISTS competencies text[] DEFAULT ARRAY[]::text[];");
        process.exit(1);
      }
      console.error(`❌ Erreur sur theme ${themeId}:`, error.message);
    } else {
      console.log(`✅ ${themeId.slice(0, 8)} — compétences ajoutées`);
      successCount++;
    }
  }

  console.log(`\n✅ ${successCount}/${Object.keys(COMPETENCIES).length} thèmes mis à jour.`);
}

run().catch(console.error);
