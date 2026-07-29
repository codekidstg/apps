-- Ajoute les compétences par thème pour les certificats
ALTER TABLE themes ADD COLUMN IF NOT EXISTS competencies text[] DEFAULT ARRAY[]::text[];

-- Seed des compétences pour chaque thème
UPDATE themes SET competencies = ARRAY[
  'Syntaxe Python et types de données',
  'Structures de contrôle (if/else, boucles)',
  'Fonctions et portée des variables',
  'Manipulation de listes et dictionnaires',
  'Débogage et lecture d''erreurs'
] WHERE id = '08ede49c-2b54-4bae-90b7-c786aa020770'; -- Introduction à Python

UPDATE themes SET competencies = ARRAY[
  'Pensée algorithmique et pseudo-code',
  'Python intermédiaire : fonctions avancées',
  'Programmation orientée objet (classes)',
  'Gestion de fichiers et exceptions',
  'Modules et bibliothèques Python'
] WHERE id = 'b2000001-0000-0000-0000-000000000001'; -- Python pour les Bâtisseurs

UPDATE themes SET competencies = ARRAY[
  'HTML5 : structure et sémantique',
  'CSS3 : mise en forme et mise en page',
  'Flexbox et Grid Layout',
  'Responsive design (mobile-first)',
  'Formulaires et accessibilité web'
] WHERE id = 'b2000002-0000-0000-0000-000000000001'; -- Construire des pages web

UPDATE themes SET competencies = ARRAY[
  'Identité numérique et traces en ligne',
  'Droits et devoirs sur internet',
  'Protection des données personnelles (RGPD)',
  'Cyberharcèlement : reconnaissance et réaction',
  'Évaluation de la fiabilité des sources'
] WHERE id = 'b2000003-0000-0000-0000-000000000001'; -- Hygiène & Citoyenneté Numériques

UPDATE themes SET competencies = ARRAY[
  'JavaScript : DOM et événements',
  'Python avancé : décorateurs et générateurs',
  'APIs REST et requêtes HTTP',
  'Gestion asynchrone (async/await)',
  'Tests unitaires et débogage avancé'
] WHERE id = 'b3000001-0000-0000-0000-000000000001'; -- Python Avancé & JavaScript

UPDATE themes SET competencies = ARRAY[
  'Complexité algorithmique O(n)',
  'Algorithmes de tri (bulles, sélection, fusion)',
  'Structures : piles, files, arbres, graphes',
  'Recherche binaire et récursivité',
  'Parcours de graphes (BFS/DFS)'
] WHERE id = 'b3000002-0000-0000-0000-000000000001'; -- Algorithmes & Structures de données

UPDATE themes SET competencies = ARRAY[
  'Principes OWASP et vulnérabilités courantes',
  'Chiffrement et cryptographie de base',
  'Sécurité des mots de passe et authentification',
  'Analyse de risques et tests de pénétration éthiques',
  'Réponse aux incidents et forensique numérique'
] WHERE id = 'b3000003-0000-0000-0000-000000000001'; -- Cybersécurité Éthique & Défensive

UPDATE themes SET competencies = ARRAY[
  'Concepts fondamentaux du machine learning',
  'Données d''entraînement et biais algorithmiques',
  'Réseaux de neurones : fonctionnement',
  'Éthique de l''IA et enjeux sociétaux',
  'Implémentation d''un modèle simple avec Python'
] WHERE id = 'b3000004-0000-0000-0000-000000000001'; -- Bases de l'Intelligence Artificielle

UPDATE themes SET competencies = ARRAY[
  'Environnement de développement Python',
  'Variables, types et opérations de base',
  'Boucles et structures conditionnelles',
  'Fonctions et décomposition de problèmes',
  'Logique de jeu et interactions utilisateur'
] WHERE id = 'b457dd7a-1d0c-423e-b97f-ca4f670d1584'; -- Game Studio T1
