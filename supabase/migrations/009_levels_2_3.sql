-- ── Migration 009 — Niveaux 2 & 3 + éditeur code ────────────────────────────

-- 1. Ajouter code_challenge comme type valide de lesson_block
alter table public.lesson_blocks drop constraint if exists lesson_blocks_type_check;
alter table public.lesson_blocks add constraint lesson_blocks_type_check
  check (type in ('text', 'video', 'quiz', 'code_challenge', 'game', 'blockly'));

-- 2. ── NIVEAU 2 — Les Bâtisseurs (12-15 ans) ─────────────────────────────────

-- Thème 2A : Python pour les Bâtisseurs
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000001-0000-0000-0000-000000000001', 'Python pour les Bâtisseurs', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

-- Chapitres du thème Python
insert into public.chapters (id, theme_id, title, order_index) values
  ('b2001001-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Variables & Types',   1),
  ('b2001002-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Conditions & Logique',2),
  ('b2001003-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Boucles & Répétitions',3),
  ('b2001004-0000-0000-0000-000000000001', 'b2000001-0000-0000-0000-000000000001', 'Fonctions',           4)
on conflict (id) do nothing;

-- Leçons : Variables & Types
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002001-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Les variables : stocker de l''information', 1, 50),
  ('b2002002-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Nombres, textes et booléens', 2, 50),
  ('b2002003-0000-0000-0000-000000000001','b2001001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Calculer avec Python', 3, 60)
on conflict (id) do nothing;

-- Leçons : Conditions
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002004-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Si… alors… sinon (if/else)', 1, 60),
  ('b2002005-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Comparer des valeurs', 2, 60),
  ('b2002006-0000-0000-0000-000000000001','b2001002-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet : Calculateur de note', 3, 80)
on conflict (id) do nothing;

-- Leçons : Boucles
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002007-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','La boucle for', 1, 60),
  ('b2002008-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','La boucle while', 2, 60),
  ('b2002009-0000-0000-0000-000000000001','b2001003-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet : Table de multiplication', 3, 80)
on conflict (id) do nothing;

-- Leçons : Fonctions
insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2002010-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Créer ses propres fonctions', 1, 70),
  ('b2002011-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Paramètres et valeur de retour', 2, 70),
  ('b2002012-0000-0000-0000-000000000001','b2001004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001','Projet final : Mini-calculatrice', 3, 100)
on conflict (id) do nothing;

-- Blocs de leçon : Variables (leçon 1)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🗃️ Une variable, c''est quoi ?</h2><p>Imagine une boîte avec une étiquette. Tu mets quelque chose dedans et tu peux t''y référer par son nom.</p><pre><code>prenom = \"Amavi\"\nage = 14\nprint(prenom, \"a\", age, \"ans\")</code></pre><p>En Python, on crée une variable en écrivant <strong>nom = valeur</strong>. C''est aussi simple que ça !</p>"}'),
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Crée une variable <code>ville</code> avec la valeur <strong>\"Lomé\"</strong> et affiche-la.</p>","starter_code":"# Crée ta variable ici\n\n","expected_output":"Lomé","required":true}'),
  ('b2002001-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 3, 'quiz',
   '{"question":"Que fait ce code ? x = 5 ; print(x)","choices":["Affiche la lettre x","Affiche le chiffre 5","Crée une erreur","Affiche x = 5"],"answer":1,"explanation":"x vaut 5, donc print(x) affiche 5."}')
on conflict do nothing;

-- Blocs : if/else (leçon 4)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🚦 Prendre des décisions avec if/else</h2><p>En Python, tu peux faire exécuter du code <em>seulement si une condition est vraie</em>.</p><pre><code>note = 15\nif note >= 10:\n    print(\"Reçu !\")\nelse:\n    print(\"Ajourné\")</code></pre><p><strong>Attention :</strong> l''indentation (les espaces) est obligatoire en Python !</p>"}'),
  ('b2002004-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Complète le code pour qu''il affiche <strong>Majeur</strong> si <code>age</code> est ≥ 18, sinon <strong>Mineur</strong>.</p>","starter_code":"age = 16\n# Complète ici\n","hidden_tests":"# test\nage = 18\nimport io, sys; buf=io.StringIO(); sys.stdout=buf\nif age >= 18:\n    print(\"Majeur\")\nelse:\n    print(\"Mineur\")\nsys.stdout=sys.__stdout__","expected_output":"Mineur","required":true}')
on conflict do nothing;

-- Blocs : boucle for (leçon 7)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b2002007-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🔁 Répéter avec for</h2><p>La boucle <code>for</code> permet de répéter du code un certain nombre de fois.</p><pre><code>for i in range(5):\n    print(\"Tour\", i)</code></pre><p><code>range(5)</code> génère les nombres 0, 1, 2, 3, 4.</p>"}'),
  ('b2002007-0000-0000-0000-000000000001','b2000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Affiche les chiffres de <strong>1 à 5</strong> (inclus), un par ligne.</p>","starter_code":"# Ta boucle ici\n","expected_output":"1\n2\n3\n4\n5","required":true}')
on conflict do nothing;

-- 3. ── NIVEAU 2 — Thème 2B : HTML & CSS ────────────────────────────────────

insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000002-0000-0000-0000-000000000001', 'Construire des pages web', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b2003001-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'HTML — La structure',   1),
  ('b2003002-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'CSS — Le style',        2),
  ('b2003003-0000-0000-0000-000000000001', 'b2000002-0000-0000-0000-000000000001', 'Ma première page web',  3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2004001-0000-0000-0000-000000000001','b2003001-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Structure d''une page HTML', 1, 50),
  ('b2004002-0000-0000-0000-000000000001','b2003001-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Titres, paragraphes et liens', 2, 50),
  ('b2004003-0000-0000-0000-000000000001','b2003002-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Couleurs et polices avec CSS', 3, 60),
  ('b2004004-0000-0000-0000-000000000001','b2003003-0000-0000-0000-000000000001','b2000002-0000-0000-0000-000000000001','Projet : Ma page de présentation', 4, 100)
on conflict (id) do nothing;

-- 4. ── NIVEAU 2 — Thème 2C : Citoyenneté Numérique ────────────────────────

insert into public.themes (id, title, level, status, version, created_by)
values
  ('b2000003-0000-0000-0000-000000000001', 'Hygiène & Citoyenneté Numériques', 'builder', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b2005001-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Sécurité en ligne',         1),
  ('b2005002-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Vie privée & données',      2),
  ('b2005003-0000-0000-0000-000000000001', 'b2000003-0000-0000-0000-000000000001', 'Être citoyen du numérique', 3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b2006001-0000-0000-0000-000000000001','b2005001-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Mots de passe forts : comment ?', 1, 40),
  ('b2006002-0000-0000-0000-000000000001','b2005001-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Reconnaître le phishing', 2, 50),
  ('b2006003-0000-0000-0000-000000000001','b2005002-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Tes données personnelles', 3, 40),
  ('b2006004-0000-0000-0000-000000000001','b2005002-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Les réseaux sociaux : avantages et risques', 4, 50),
  ('b2006005-0000-0000-0000-000000000001','b2005003-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Cyberharcèlement : reconnaître et agir', 5, 50),
  ('b2006006-0000-0000-0000-000000000001','b2005003-0000-0000-0000-000000000001','b2000003-0000-0000-0000-000000000001','Droits d''auteur et licences', 6, 40)
on conflict (id) do nothing;

-- 5. ── NIVEAU 3 — Les Architectes (15-18 ans) ───────────────────────────────

-- Thème 3A : Python Avancé + JavaScript
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000001-0000-0000-0000-000000000001', 'Python Avancé & JavaScript', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3001001-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'Listes & Dictionnaires',    1),
  ('b3001002-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'POO en Python',             2),
  ('b3001003-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'JavaScript Essentiel',      3),
  ('b3001004-0000-0000-0000-000000000001', 'b3000001-0000-0000-0000-000000000001', 'Manipuler le DOM',          4)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3002001-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Listes et opérations', 1, 70),
  ('b3002002-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Dictionnaires : clés & valeurs', 2, 70),
  ('b3002003-0000-0000-0000-000000000001','b3001001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Compréhensions de listes', 3, 80),
  ('b3002004-0000-0000-0000-000000000001','b3001002-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Classes et objets', 4, 90),
  ('b3002005-0000-0000-0000-000000000001','b3001002-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Héritage et polymorphisme', 5, 90),
  ('b3002006-0000-0000-0000-000000000001','b3001003-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Variables, fonctions JS', 6, 70),
  ('b3002007-0000-0000-0000-000000000001','b3001003-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Tableaux & objets JS', 7, 70),
  ('b3002008-0000-0000-0000-000000000001','b3001004-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','querySelector et événements', 8, 80),
  ('b3002009-0000-0000-0000-000000000001','b3001004-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001','Projet : Mini-app interactive', 9, 120)
on conflict (id) do nothing;

-- Blocs : Listes (leçon 1 N3)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b3002001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>📋 Les listes Python</h2><p>Une liste stocke plusieurs valeurs dans une seule variable.</p><pre><code>fruits = [\"mangue\", \"papaye\", \"ananas\"]\nprint(fruits[0])  # mangue\nprint(len(fruits)) # 3\nfruits.append(\"goyave\")</code></pre>"}'),
  ('b3002001-0000-0000-0000-000000000001','b3000001-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Crée une liste <code>villes</code> avec Lomé, Accra et Abidjan. Affiche la 2e ville.</p>","starter_code":"villes = []\n# Complète ici\n","expected_output":"Accra","required":true}')
on conflict do nothing;

-- Thème 3B : Algorithmes & Structures de données
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000002-0000-0000-0000-000000000001', 'Algorithmes & Structures de données', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3003001-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Complexité & Tri',          1),
  ('b3003002-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Recherche & Récursivité',   2),
  ('b3003003-0000-0000-0000-000000000001', 'b3000002-0000-0000-0000-000000000001', 'Piles, Files & Graphes',    3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3004001-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','C''est quoi un algorithme ?', 1, 60),
  ('b3004002-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Tri à bulles et tri par sélection', 2, 80),
  ('b3004003-0000-0000-0000-000000000001','b3003001-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Complexité O(n) : évaluer la vitesse', 3, 80),
  ('b3004004-0000-0000-0000-000000000001','b3003002-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Recherche linéaire vs binaire', 4, 80),
  ('b3004005-0000-0000-0000-000000000001','b3003002-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Récursivité : la fonction qui s''appelle', 5, 90),
  ('b3004006-0000-0000-0000-000000000001','b3003003-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Piles (Stack) et Files (Queue)', 6, 80),
  ('b3004007-0000-0000-0000-000000000001','b3003003-0000-0000-0000-000000000001','b3000002-0000-0000-0000-000000000001','Graphes et parcours (BFS/DFS)', 7, 100)
on conflict (id) do nothing;

-- Thème 3C : Cybersécurité défensive & éthique
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000003-0000-0000-0000-000000000001', 'Cybersécurité Éthique & Défensive', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3005001-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Fondamentaux sécu',         1),
  ('b3005002-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Attaques courantes',        2),
  ('b3005003-0000-0000-0000-000000000001', 'b3000003-0000-0000-0000-000000000001', 'Défense & Éthique',         3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3006001-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Chiffrement : César → AES', 1, 70),
  ('b3006002-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Hachage et empreintes numériques', 2, 70),
  ('b3006003-0000-0000-0000-000000000001','b3005001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Authentification & 2FA', 3, 70),
  ('b3006004-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Injection SQL — comment et pourquoi l''éviter', 4, 80),
  ('b3006005-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','XSS et CSRF : attaques web', 5, 80),
  ('b3006006-0000-0000-0000-000000000001','b3005002-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Ingénierie sociale & phishing avancé', 6, 70),
  ('b3006007-0000-0000-0000-000000000001','b3005003-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','CTF débutant : résoudre un challenge', 7, 120),
  ('b3006008-0000-0000-0000-000000000001','b3005003-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001','Éthique du hacker : responsible disclosure', 8, 60)
on conflict (id) do nothing;

-- Blocs : Chiffrement César (leçon N3 sécu)
insert into public.lesson_blocks (lesson_id, theme_id, order_index, type, content) values
  ('b3006001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001', 1, 'text',
   '{"html":"<h2>🔐 Le chiffre de César</h2><p>César chiffrait ses messages en décalant chaque lettre de 3 positions.<br>A→D, B→E, TOGO→WRJR</p><p>C''est le chiffrement le plus simple — et le plus facile à casser !</p>"}'),
  ('b3006001-0000-0000-0000-000000000001','b3000003-0000-0000-0000-000000000001', 2, 'code_challenge',
   '{"instructions":"<p>Implémente la fonction <code>cesar(texte, decalage)</code> qui chiffre un texte (lettres minuscules uniquement). Affiche le résultat pour <code>cesar(\"togo\", 3)</code>.</p>","starter_code":"def cesar(texte, decalage):\n    # Complète ici\n    pass\n\nprint(cesar(\"togo\", 3))\n","expected_output":"wrjr","required":true}')
on conflict do nothing;

-- Thème 3D : Bases de l'IA
insert into public.themes (id, title, level, status, version, created_by)
values
  ('b3000004-0000-0000-0000-000000000001', 'Bases de l''Intelligence Artificielle', 'architect', 'published', 1,
   (select id from public.profiles where role = 'admin' limit 1))
on conflict (id) do nothing;

insert into public.chapters (id, theme_id, title, order_index) values
  ('b3007001-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'C''est quoi l''IA ?',       1),
  ('b3007002-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'Machine Learning intro',    2),
  ('b3007003-0000-0000-0000-000000000001', 'b3000004-0000-0000-0000-000000000001', 'IA éthique & Afrique',      3)
on conflict (id) do nothing;

insert into public.lessons (id, chapter_id, theme_id, title, order_index, xp_reward) values
  ('b3008001-0000-0000-0000-000000000001','b3007001-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','IA, ML, Deep Learning : les différences', 1, 60),
  ('b3008002-0000-0000-0000-000000000001','b3007001-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Comment une machine apprend-elle ?', 2, 70),
  ('b3008003-0000-0000-0000-000000000001','b3007002-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Régression linéaire en Python', 3, 90),
  ('b3008004-0000-0000-0000-000000000001','b3007002-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Classification : spam ou non ?', 4, 90),
  ('b3008005-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Biais algorithmiques : exemples africains', 5, 70),
  ('b3008006-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','L''IA au service de l''Afrique : cas réels', 6, 70),
  ('b3008007-0000-0000-0000-000000000001','b3007003-0000-0000-0000-000000000001','b3000004-0000-0000-0000-000000000001','Projet final : Mon premier modèle ML', 7, 150)
on conflict (id) do nothing;
