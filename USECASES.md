# CodeKids — Cas d'usage & Tests fonctionnels complets

> **Audit QA exhaustif** — 400+ cas couvrant le happy path, les cas limites, la sécurité,
> les cascades de données, les permissions et les régressions.
> Ordre logique d'exploitation réelle : setup → contenu → utilisateurs → parcours → certificats.

---

## LÉGENDE

| Symbole | Signification |
|---------|--------------|
| ✅ | Comportement attendu (succès) |
| ❌ | Comportement attendu (erreur contrôlée) |
| 🔒 | Test de sécurité / permission |
| ⚡ | Cas limite / edge case |
| 🔄 | Test de régression |
| 🌐 | Test hors-ligne |

---

## PHASE 0 — Authentification

### 0.1 Login (tous rôles)

| # | Acteur | Action | Résultat attendu |
|---|--------|--------|-----------------|
| 0.1.1 ✅ | Admin | Email `admin@codekids.test` + mdp correct | Redirigé vers `/admin` |
| 0.1.2 ✅ | Manager | Email + mdp correct | Redirigé vers `/manager` |
| 0.1.3 ✅ | Prof | Email + mdp correct | Redirigé vers `/prof` |
| 0.1.4 ✅ | Élève | Email + mdp correct | Redirigé vers `/eleve` |
| 0.1.5 ✅ | Parent | Email + mdp correct | Redirigé vers `/suivi` |
| 0.1.6 ❌ | Tout | Email inexistant | Message "Identifiants incorrects" |
| 0.1.7 ❌ | Tout | Mot de passe incorrect | Message "Identifiants incorrects" |
| 0.1.8 ❌ | Tout | Email vide | Validation bloquante côté form |
| 0.1.9 ❌ | Tout | Email format invalide (`abc`) | Validation bloquante |
| 0.1.10 ❌ | Tout | Mot de passe vide | Validation bloquante |
| 0.1.11 ⚡ | Tout | Compte désactivé (ban_duration appliqué) | "Compte suspendu" — login impossible |
| 0.1.12 ⚡ | Tout | Session expirée → accès page protégée | Redirection vers `/connexion` |
| 0.1.13 ⚡ | Tout | User auth existe mais `profiles` row absent | Redirection /connexion ou page erreur |
| 0.1.14 🔒 | Tout | Param `?redirect=http://evil.com` | Redirect ignoré (URL relative uniquement) |

### 0.2 Logout

| # | Acteur | Action | Résultat attendu |
|---|--------|--------|-----------------|
| 0.2.1 ✅ | Tout | Clic "Déconnexion" | Session détruite, redirigé `/connexion` |
| 0.2.2 ⚡ | Tout | Accès page protégée après logout | Redirection `/connexion` |

---

## PHASE 1 — Setup Admin : Opérateurs & Structure

### 1.1 Créer un Manager

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.1.1 ✅ | `/admin/utilisateurs` → Nouveau → rôle `manager`, email, mdp valide | `profiles.role = manager`, identifiants fonctionnels |
| 1.1.2 ❌ | Email déjà utilisé | Erreur "Cet email est déjà pris" |
| 1.1.3 ❌ | Email format invalide | Erreur validation |
| 1.1.4 ❌ | Mot de passe < 8 caractères | Erreur validation |
| 1.1.5 ❌ | `display_name` vide | Erreur validation |
| 1.1.6 🔒 | Manager tente de créer un compte `admin` | Refusé / rôle max = `teacher` |
| 1.1.7 🔒 | Non-admin tente d'accéder `/admin/utilisateurs` | 403 redirect |

### 1.2 Créer un Professeur

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.2.1 ✅ | Rôle `teacher`, email, mdp valide | `profiles.role = teacher` |
| 1.2.2 ✅ | Fournir email + mdp au prof → connexion prof | Redirigé `/prof` |
| 1.2.3 ❌ | Email déjà utilisé | Erreur |
| 1.2.4 ⚡ | Caractères spéciaux dans `display_name` (`Kofi O'Brien`) | Enregistré sans erreur |

### 1.3 Créer une École

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.3.1 ✅ | `/admin/ecoles` → Nom, ville, pays → Créer | École en DB |
| 1.3.2 ❌ | Nom vide | Erreur validation |
| 1.3.3 ⚡ | Dupliquer nom d'école | Autorisé ou erreur selon contrainte DB |
| 1.3.4 ⚡ | Supprimer école avec classes liées | Erreur FK ou cascade |

### 1.4 Créer une Classe

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.4.1 ✅ | Nom `"Explorer 2025"`, niveau `explorer`, prof = Prof Kofi | Classe créée avec `teacher_id` |
| 1.4.2 ❌ | Prof inexistant | Erreur FK |
| 1.4.3 ✅ | Plusieurs classes pour le même prof | Prof voit toutes ses classes dans `/prof/classes` |
| 1.4.4 ⚡ | Classe sans élèves → prof l'ouvre | "Aucun élève inscrit" affiché |

### 1.5 Désactiver / Réactiver un compte

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.5.1 ✅ | Admin désactive compte prof | Login prof échoue (ban_duration: "876600h") |
| 1.5.2 ✅ | Admin réactive compte | Login prof fonctionne à nouveau |
| 1.5.3 ⚡ | Désactiver élève en cours de session | Prochaine requête redirige vers /connexion |
| 1.5.4 ⚡ | Désactiver manager avec des thèmes en draft | Thèmes restent, manager ne peut plus se connecter |

### 1.6 Changer le rôle d'un utilisateur

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 1.6.1 ✅ | Changer `teacher` → `manager` | Accès `/manager` à la prochaine connexion |
| 1.6.2 ❌ | Rétrograder l'admin lui-même | Refusé (sécurité) |
| 1.6.3 ⚡ | Changer rôle d'un user en session active | Session invalidée ou rechargée |

---

## PHASE 2 — Plans d'abonnement (Admin)

### 2.1 CRUD Plans

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 2.1.1 ✅ | `/admin/abonnements` → Nouveau plan : Mensuel 5000 FCFA, features, actif | Plan créé et visible |
| 2.1.2 ✅ | Modifier le prix d'un plan existant | Prix mis à jour, abonnements existants NON affectés |
| 2.1.3 ✅ | Désactiver un plan | Disparaît de la liste parent (mais abonnements actifs maintenus) |
| 2.1.4 ✅ | Réactiver un plan | Réapparaît dans la liste parent |
| 2.1.5 ✅ | Supprimer un plan sans abonnement actif | Plan supprimé |
| 2.1.6 ❌ | Supprimer plan avec abonnements actifs | Erreur FK ou refus applicatif |
| 2.1.7 ❌ | Créer plan sans nom | Erreur validation |
| 2.1.8 ❌ | Prix négatif | Erreur validation |
| 2.1.9 ⚡ | Features avec lignes vides dans textarea | Filtrées ou enregistrées telles quelles |

---

## PHASE 3 — Création du Contenu (Manager)

### 3.1 Connexion Manager et tableau de bord

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.1.1 ✅ | Manager se connecte | `/manager` — liste de ses thèmes |
| 3.1.2 🔒 | Manager accède `/admin` | Redirigé / 403 |
| 3.1.3 🔒 | Manager tente de voir thèmes d'un autre manager | Filtrés par `created_by = user.id` — non visibles |

### 3.2 Créer un Thème

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.2.1 ✅ | Nouveau thème : titre `"Intro Python"`, niveau `explorer`, description, `8h` | Thème créé, `status = draft` |
| 3.2.2 ❌ | Titre vide | Erreur validation |
| 3.2.3 ❌ | Niveau invalide (`super-expert`) | Erreur contrainte DB |
| 3.2.4 ❌ | `estimated_hours` < 0 ou NaN | Erreur validation |
| 3.2.5 ⚡ | Titre avec accents (`Hygiène & Sécurité`) | Enregistré + slug correct |

### 3.3 Créer des Chapitres

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.3.1 ✅ | Ajouter chapitre à un thème draft | `order_index` auto-incrémenté |
| 3.3.2 ✅ | Créer 5 chapitres → ordre correct | Chapitres ordonnés 0→4 |
| 3.3.3 ❌ | Titre chapitre vide | Erreur validation |
| 3.3.4 ✅ | Supprimer un chapitre | Cascade → leçons + blocs supprimés |
| 3.3.5 ⚡ | Supprimer chapitre avec des `lesson_progress` associés | Pas d'erreur (progress orpheline) |

### 3.4 Créer des Leçons

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.4.1 ✅ | Ajouter leçon : titre, xp_reward 10, 15 min | Leçon créée dans le chapitre |
| 3.4.2 ❌ | Chapitre inexistant | Erreur FK |
| 3.4.3 ❌ | `xp_reward` = 0 ou négatif | Erreur ou 0 accepté? |
| 3.4.4 ✅ | Supprimer une leçon | Cascade → blocs supprimés |
| 3.4.5 ⚡ | Supprimer leçon avec `lesson_progress` existants | Progress orpheline (pas d'erreur) |

### 3.5 Blocs de Leçon — CRUD complet

#### Bloc Texte

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.5.1 ✅ | Ajouter bloc `text` avec HTML riche | Rendu correct dans QuestReader |
| 3.5.2 ✅ | HTML avec `<code>`, `<pre>`, `<strong>` | Styles amber/émeraude appliqués |
| 3.5.3 ⚡ | HTML avec `<script>` injecté | `dangerouslySetInnerHTML` — XSS possible? (sanitize?) |
| 3.5.4 ⚡ | Texte vide | Bloc créé vide ou erreur |

#### Bloc Quiz

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.5.5 ✅ | Quiz : question, 4 choix, réponse index 2, explication | Quiz interactif complet |
| 3.5.6 ✅ | Répondre correctement → fond vert, explication ✅ | Feedback visuel |
| 3.5.7 ✅ | Répondre incorrectement → fond rouge, explication 💡 | Feedback visuel |
| 3.5.8 ⚡ | Quiz déjà répondu → re-clic sur autre choix | Ignoré (`quizResults[id] != null`) |
| 3.5.9 ❌ | Question vide | Erreur validation |
| 3.5.10 ❌ | Moins de 2 choix | Erreur validation |
| 3.5.11 ❌ | Index réponse hors bornes | Erreur |

#### Bloc Code Challenge

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.5.12 ✅ | Code correct → hidden tests passent | ✅ Bravo ! — `onSuccess()` |
| 3.5.13 ✅ | Code incorrect → hidden tests échouent | ❌ Erreur Python affichée |
| 3.5.14 ✅ | `expected_output` correspondance exacte | Pass comparaison `trim()` |
| 3.5.15 ✅ | `expected_output` non correspondant | ⚠ Résultat inattendu |
| 3.5.16 ⚡ | Code avec boucle infinie `while True:` | Timeout Pyodide? (pas géré actuellement) |
| 3.5.17 ⚡ | Code avec `import os; os.system(...)` | Sandbox Pyodide bloque les syscalls |
| 3.5.18 ⚡ | Starter code vide | Éditeur vide, exécutable |
| 3.5.19 ✅ | Bouton "↺ Réinitialiser" | Code revient au `starter_code` |
| 3.5.20 ✅ | Bloc `required = true` non complété | Bouton "Terminer" désactivé |
| 3.5.21 ✅ | Bloc `required = false` non complété | Bouton "Terminer" activable |
| 3.5.22 ⚡ | Premier lancement (data warning ~6 Mo) | Bandeau amber → OK lancer → chargement |
| 3.5.23 ✅ | Deuxième lancement (Pyodide en cache SW) | Chargement instantané (0 data) |

#### Bloc Blockly / Jeu Robot

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.5.24 ✅ | Assembler Avancer + Tourner → robot atteint la maison | ✅ Défi résolu ! +40 XP |
| 3.5.25 ✅ | Robot frappe un mur ou sort de la grille | Message d'erreur rouge, reset |
| 3.5.26 ✅ | Bouton "↺ Reset" | Robot revient position départ |
| 3.5.27 ⚡ | Workspace Blockly vide → Lancer | Comportement? (robot ne bouge pas) |
| 3.5.28 ⚡ | Résoudre le même Blockly 2 fois | XP accordé une seule fois |
| 3.5.29 ⚡ | StrictMode React double-init Blockly | Une seule instance (fix innerHTML) |

#### Gestion des Blocs

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.5.30 ✅ | Déplacer bloc vers le haut (moveBlock "up") | `order_index` échangé |
| 3.5.31 ✅ | Déplacer bloc en première position "up" | Rien ne se passe (déjà premier) |
| 3.5.32 ✅ | Déplacer bloc en dernière position "down" | Rien ne se passe |
| 3.5.33 ✅ | Supprimer un bloc | Supprimé, `order_index` recalculé |
| 3.5.34 ❌ | Type de bloc invalide (`type = "unknown"`) | Erreur contrainte DB |

### 3.6 Soumettre pour Validation

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.6.1 ✅ | Manager → "Soumettre pour validation" | `status = validated`, visible admin |
| 3.6.2 ⚡ | Soumettre thème sans aucune leçon | Autorisé ou refus applicatif? |
| 3.6.3 ⚡ | Re-soumettre thème déjà "validated" | Idempotent ou erreur |
| 3.6.4 🔒 | Soumettre thème d'un autre manager | Refusé |

### 3.7 Workflow Admin — Publier / Rejeter

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.7.1 ✅ | Admin publie thème "validated" | `status = published`, thème visible élèves |
| 3.7.2 ✅ | Admin rejette avec commentaire | `status = draft`, manager peut corriger |
| 3.7.3 ❌ | Publier thème non "validated" | Refusé |
| 3.7.4 ⚡ | Publier thème → l'ancienne version passe "locked" | `parent_version_id.status = locked` |
| 3.7.5 🔒 | Manager tente de publier lui-même | Refusé (rôle insuffisant) |

### 3.8 Fork de Thème

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 3.8.1 ✅ | Manager forke un thème publié | Nouveau thème `status = draft`, `version + 1` |
| 3.8.2 ✅ | Fork conserve `parent_version_id` | Traçabilité de version |
| 3.8.3 ⚡ | Forker un thème déjà en draft | Autorisé? Version incohérente? |
| 3.8.4 ⚡ | Chapters/Lessons/Blocks copiés dans le fork? | À vérifier (fork = metadata only?) |

---

## PHASE 4 — Création des Familles (Admin)

### 4.1 Créer un Élève

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 4.1.1 ✅ | Rôle `student`, pseudo, email, mdp, niveau `explorer` | `profiles` + `students` créés |
| 4.1.2 ✅ | `students.level = explorer`, `level_num = 1`, `xp = 0` | Valeurs initiales correctes |
| 4.1.3 ✅ | Admin inscrit l'élève dans une classe | `class_enrollments` row créée |
| 4.1.4 ❌ | Inscrire l'élève dans une classe sans prof | Autorisé? |
| 4.1.5 ⚡ | Inscrire même élève dans 2 classes | `class_enrollments` doublon ou erreur |
| 4.1.6 🔒 | Élève tente d'accéder `/admin` ou `/prof` | Redirigé /eleve |

### 4.2 Créer un Parent

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 4.2.1 ✅ | Rôle `parent`, email, mdp | `profiles.role = parent` |
| 4.2.2 ✅ | Lier parent à l'élève → `parent_children` | Row créée |
| 4.2.3 ✅ | 1 parent → 2 enfants | 2 rows `parent_children` |
| 4.2.4 ✅ | 2 parents → 1 enfant | 2 rows `parent_children` |
| 4.2.5 ⚡ | Lier parent à lui-même (parent = élève) | Refusé ou permis? |
| 4.2.6 ⚡ | Lier parent inexistant | Erreur FK |
| 4.2.7 ⚡ | Créer lien doublon (même parent-enfant) | Upsert ou erreur unique |
| 4.2.8 🔒 | Parent accède profil d'un enfant non lié | RLS bloque via `parent_children` |

---

## PHASE 5 — Abonnement (Parent)

### 5.1 Consentement Parental

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 5.1.1 ✅ | Parent se connecte sans consentement | Redirigé vers `/suivi/consentement` |
| 5.1.2 ✅ | Parent remplit + valide le formulaire | `parental_consents` créé, accès /suivi |
| 5.1.3 ✅ | Parent déjà consentant → reconnexion | Pas de redirection consentement |
| 5.1.4 ❌ | Soumettre sans cocher toutes les cases | Erreur validation |
| 5.1.5 ⚡ | IP et user-agent capturés dans le log | Valeurs non nulles en DB |
| 5.1.6 ⚡ | Consentement doublon (re-soumettre) | Upsert ou 2e ligne? |

### 5.2 Paiement CinetPay (mock)

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 5.2.1 ✅ | Choisir plan Mensuel → CinetPay → `initCinetpayPayment` | URL de paiement générée, subscription créée `status = trial` |
| 5.2.2 ✅ | Webhook `/api/webhooks/cinetpay` reçu avec `cpm_result = "00"` | Subscription `status = active`, `ends_at` calculé |
| 5.2.3 ✅ | Webhook avec `cpm_result ≠ "00"` (échec) | Payment status = failed, subscription inchangée |
| 5.2.4 ⚡ | Webhook appelé 2× (idempotency) | 2e appel sans effet (payment déjà traité) |
| 5.2.5 ⚡ | Plan inexistant dans `initCinetpayPayment` | Erreur 404 |
| 5.2.6 ⚡ | Re-initier paiement avec subscription déjà active | Nouvelle tentative ou bloqué? |
| 5.2.7 🔒 | Signature HMAC webhook invalide | Rejetée (en mode prod) |

### 5.3 Paiement Espèces

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 5.3.1 ✅ | Parent soumet demande espèces (plan, ref, notes) | `payments.status = pending`, `subscriptions.status = trial` |
| 5.3.2 ✅ | Admin voit la demande dans `/admin/paiements` | Ligne visible |
| 5.3.3 ✅ | Admin valide → `validateCashPayment` | `status = active`, `ends_at = now + période` |
| 5.3.4 ⚡ | Valider paiement déjà validé | Idempotent ou erreur |
| 5.3.5 ❌ | `plan_id` invalide dans formulaire espèces | Erreur FK |
| 5.3.6 ⚡ | `ends_at` calculé : plan mensuel → +30j, annuel → +365j | Vérifier la logique |

---

## PHASE 6 — Affectation du Contenu (Prof / Admin)

### 6.1 Affecter un thème à une classe

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 6.1.1 ✅ | `/prof/affectations` ou admin → thème `"Intro Python"` → classe `"Explorer 2025"` | `theme_assignments` créée |
| 6.1.2 ⚡ | Affecter même thème 2× à la même classe | Doublon ou erreur unique |
| 6.1.3 ✅ | Prof ouvre `/prof/cours` | Voit le thème affecté |
| 6.1.4 ✅ | Prof ouvre `/prof/classes/[id]` | Voit élèves + progression par leçon |
| 6.1.5 🔒 | Prof tente d'accéder classe d'un autre prof | 404 (RLS `teacher_id = user.id`) |
| 6.1.6 ⚡ | Affecter thème non publié | Autorisé? Élève voit-il un thème "draft"? |

### 6.2 Notation Prof

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 6.2.1 ✅ | Prof saisit note 85/100 + commentaire pour un élève | `grades` upserted |
| 6.2.2 ✅ | Prof modifie sa note → re-upsert | Note mise à jour |
| 6.2.3 ❌ | Score < 0 ou > 100 | Erreur validation |
| 6.2.4 ❌ | Score non numérique | Erreur validation |
| 6.2.5 🔒 | Prof note un élève d'une autre classe | Refusé (RLS teacher_id) |
| 6.2.6 ⚡ | Note sans commentaire | Autorisé (commentaire nullable) |

### 6.3 Log d'accès prof (détection anomalie)

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 6.3.1 ✅ | Prof ouvre une leçon → `logLessonAccess` | Log en DB avec IP, UA, timestamp |
| 6.3.2 ⚡ | Prof accède >15 leçons en 60s | Log "suspect" enregistré (rate-limiting) |
| 6.3.3 ⚡ | IP null (proxy/localhost) | Log quand même (IP = null acceptable) |

---

## PHASE 7 — Parcours Élève complet

### 7.1 Dashboard Ma Cité

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.1.1 ✅ | Élève se connecte | `/eleve` — stats, prochaine quête, thèmes de son niveau |
| 7.1.2 ✅ | Dashboard affiche `student.level` de la DB | Explorer voit thèmes explorer UNIQUEMENT |
| 7.1.3 ✅ | Card thème cliquable → `/eleve/theme/[id]` | Page liste des leçons |
| 7.1.4 ⚡ | Élève sans progression | Première leçon débloquée, toutes les autres verrouillées |
| 7.1.5 ✅ | XP total affiché | Correspond à `students.xp` en DB |
| 7.1.6 ✅ | Streak days affiché | Correspond à `students.streak_days` |
| 7.1.7 ⚡ | Aucun thème publié pour ce niveau | Message vide ou état empty |

### 7.2 Page Thème — Liste des Leçons séquentielles

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.2.1 ✅ | Leçon 1 débloquée dès l'arrivée | Cliquable, style orange "En cours" |
| 7.2.2 ✅ | Leçons 2+ verrouillées 🔒 jusqu'à complétion de la précédente | Non cliquables |
| 7.2.3 ✅ | Compléter leçon 1 → leçon 2 débloquée | Re-vérification au retour sur la page |
| 7.2.4 ✅ | Leçon complétée → ✅ + score affiché | `lesson_progress.score` visible |
| 7.2.5 ✅ | Barre de progression globale du thème | % leçons complétées correct |
| 7.2.6 ✅ | Séparateurs de chapitres | "LA PLACE DU CODE", "LA TOUR DES BOUCLES"… |
| 7.2.7 ⚡ | Thème avec leçon `order_index` en désordre | Leçons triées par `order_index` |

### 7.3 Suivre une Quête — QuestReader

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.3.1 ✅ | Tous quiz + code + blockly complétés | Bouton "Terminer" activé |
| 7.3.2 ✅ | Quiz non répondu | Bouton "Terminer" désactivé |
| 7.3.3 ✅ | Code `required` non résolu | Bouton "Terminer" désactivé |
| 7.3.4 ✅ | Code non `required` non résolu | N'impacte pas l'activation du bouton |
| 7.3.5 ✅ | Blockly non résolu | Bouton "Terminer" désactivé |
| 7.3.6 ✅ | Clic "Terminer" → `completeLesson()` | XP ajouté, `lesson_progress` sauvée, bandeau vert |
| 7.3.7 ✅ | Leçon déjà complétée → revenir dessus | Bouton "Retour à ma cité" visible, pas "Terminer" |
| 7.3.8 ⚡ | Compléter la même leçon 2× | Score = MAX(ancien, nouveau), pas de double XP |
| 7.3.9 ⚡ | Leçon sans aucun bloc | Bouton "Terminer" immédiatement disponible |
| 7.3.10 ⚡ | Quiz avec réponse parfaite → `perfect = true` | Score 100 envoyé |
| 7.3.11 ⚡ | Quiz avec erreur → `perfect = false` | Score 70 envoyé |

### 7.4 Gamification — XP & Badges

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.4.1 ✅ | Première leçon complétée → badge `first_step` | Toast badge affiché |
| 7.4.2 ✅ | Leçon parfaite → badge `first_perfect` | Toast badge (1ère fois uniquement) |
| 7.4.3 ✅ | Résoudre Blockly → +40 XP | `students.xp += 40` |
| 7.4.4 ✅ | Résoudre Blockly 2× dans même session | XP accordé une seule fois |
| 7.4.5 ⚡ | 5 leçons complétées → badge `city_builder` | Toast badge |
| 7.4.6 ⚡ | 10 leçons → badge `architect` | Toast badge |
| 7.4.7 ⚡ | Streak 3 jours → badge `streak_3` | Logique date last_activity |
| 7.4.8 ✅ | XP bar dans sidebar | Progressivement de 0 → 500 (niveau 1) |
| 7.4.9 ✅ | `/eleve/badges` | Tous les badges gagnés visibles |
| 7.4.10 ⚡ | Deux élèves gagnent le même badge simultanément | Chacun son propre `student_achievements` |
| 7.4.11 ⚡ | `attempts` dans `lesson_progress` | Toujours 1? (jamais incrémenté?) |

### 7.5 Classement

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.5.1 ✅ | `/eleve/classement` | Top 20 par XP, pseudonymes uniquement |
| 7.5.2 ✅ | Ma position surlignée en orange | `student.id === me.id` |
| 7.5.3 ✅ | Médailles 🥇🥈🥉 pour top 3 | Affichage correct |
| 7.5.4 ✅ | "X XP pour atteindre le podium" | Calcul correct si rang > 3 |
| 7.5.5 ⚡ | 1 seul élève → top 1 | Fonctionne sans erreur |
| 7.5.6 ⚡ | 0 élève | "Personne dans le classement" |
| 7.5.7 🔒 | Pseudonymes uniquement (pas d'email, pas de vrai nom) | Vérifier que `display_name` ≠ email |

### 7.6 Avatar / Robot

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 7.6.1 ✅ | `/eleve/avatar` → changer base, hat, accessoire, couleur → Sauver | `student_avatar` upserted |
| 7.6.2 ✅ | Avatar visible dans la sidebar après sauvegarde | Rechargement ou mise à jour |
| 7.6.3 ❌ | `base` invalide (valeur hors enum) | Erreur validation |
| 7.6.4 ⚡ | Premier save (INSERT) vs re-save (UPDATE) | Upsert fonctionne dans les deux cas |
| 7.6.5 ⚡ | Hat = null (aucun) | Rendu sans chapeau |

---

## PHASE 8 — Mode Hors-ligne

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 8.1.1 🌐 | Première visite → pages mises en cache SW | `/_next/static/*` et pages quête en cache |
| 8.1.2 🌐 | Pyodide déjà utilisé → cache SW Pyodide | Reload sans réseau : Pyodide fonctionne |
| 8.1.3 🌐 | Couper réseau → bandeau amber `📡 Mode hors-ligne` | Affiché après useEffect (pas d'erreur hydration) |
| 8.1.4 🌐 | Répondre à un quiz offline | Action enregistrée dans IndexedDB |
| 8.1.5 🌐 | Exécuter code Python offline | Pyodide en cache SW, tourne sans réseau |
| 8.1.6 🌐 | Remettre réseau → spinner `⟳ Synchronisation` | Actions rejouées dans l'ordre |
| 8.1.7 🌐 | Sync terminée → `✅ N actions synchronisées` | Toast vert |
| 8.1.8 🌐 | Score offline < score serveur existant | Merge optimiste : `MAX(local, serveur)` conservé |
| 8.1.9 🌐 | Score offline > score serveur | Score offline retenu (upgrade) |
| 8.1.10 🌐 | 3 actions en queue → 1 échoue (404) | Arrêt de la sync (réseau instable) — retry au prochain online |
| 8.1.11 🌐 | Même leçon complétée offline puis online avant sync | Merge optimiste → pas de double XP |
| 8.1.12 🌐 | Page quête jamais visitée → hors-ligne | Page non disponible (503) |

---

## PHASE 9 — Certification (Thème & Niveau)

### 9.1 Auto-génération certificat thème

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 9.1.1 ✅ | Élève complète 100% des leçons d'un thème | `checkThemeCompletion()` → certificat créé, `validated_at = null` |
| 9.1.2 ✅ | Badge `theme_complete` déclenché | Toast badge |
| 9.1.3 ⚡ | Compléter dernier leçon offline → sync | Certificat créé à la sync |
| 9.1.4 ⚡ | Certificat créé 2× (race condition) | Vérification `existing` → pas de doublon |
| 9.1.5 ⚡ | Thème avec 0 leçon → 100% ? | checkThemeCompletion : 0/0 = 100% ? |

### 9.2 Validation par le Prof

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 9.2.1 ✅ | `/prof/certificats` → liste des certificats en attente | Tous les certs `validated_at = null` |
| 9.2.2 ✅ | Prof clique "Valider" | `validated_at = now`, `validated_by = prof.id` |
| 9.2.3 ⚡ | Valider cert déjà validé | Idempotent (update à nouveau) |
| 9.2.4 🔒 | Prof valide cert d'un élève hors de sa classe | RLS bloque? ou autorisé? |
| 9.2.5 🔒 | Parent tente de valider lui-même | Refusé |
| 9.2.6 ⚡ | Cert révoqué (`revoked = true`) → ne pas afficher dans liste prof | Filtré |

### 9.3 Téléchargement PDF (Parent)

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 9.3.1 ✅ | `/suivi/certificats` → bouton 👁 Aperçu | PDF `Content-Disposition: inline` dans nouvel onglet |
| 9.3.2 ✅ | Bouton ⬇ PDF | PDF `Content-Disposition: attachment`, nom `Prenom_Theme.pdf` |
| 9.3.3 ✅ | Nom fichier avec accents normalisés | `Amavi_Introduction_a_Python.pdf` (sans accents ni espaces) |
| 9.3.4 ❌ | Cert inexistant `/api/certificats/[fakeId]` | 404 |
| 9.3.5 ❌ | Cert non validé | 403 |
| 9.3.6 ❌ | Cert révoqué | 404 |
| 9.3.7 🔒 | Parent accède cert d'un enfant non lié | 403 (RLS) |
| 9.3.8 ✅ | PDF contient : nom élève, thème, score, hash, prof validateur | Contenu correct |
| 9.3.9 ⚡ | Hash vérification (12 char SHA256) | Format `[a-f0-9]{12}` |
| 9.3.10 ⚡ | Cert type "level" vs type "theme" | PDF différent (diplôme vs certificat) |

### 9.4 Diplôme de Niveau

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 9.4.1 ✅ | Tous les thèmes `explorer` complétés | `level_certificate` auto-généré |
| 9.4.2 ✅ | Admin/Prof valide le diplôme | `validated_at` rempli |
| 9.4.3 ✅ | Admin promeut l'élève : `students.level = 'builder'` | Dashboard élève → thèmes builder |
| 9.4.4 ⚡ | Level up → quels badges sont déverrouillés? | À définir |
| 9.4.5 ⚡ | Élève builder voit ses thèmes explorer? | Non (filtre par niveau courant uniquement) |

---

## PHASE 10 — Suivi Parent

| # | Action | Résultat attendu |
|---|--------|-----------------|
| 10.1.1 ✅ | `/suivi` | Dashboard parent avec nom(s) enfant(s) |
| 10.1.2 ✅ | 1 parent → 2 enfants | Sélecteur ou affichage groupé |
| 10.1.3 ✅ | `/suivi/progression` | Thèmes + barre de progression + leçons complétées |
| 10.1.4 ✅ | Leçon complétée → score visible | `lesson_progress.score` affiché |
| 10.1.5 ⚡ | Enfant sans progression | Barre 0%, "Aucune leçon terminée" |
| 10.1.6 ✅ | `/suivi/certificats` → cert en attente | Section "⏳ En attente de validation prof" |
| 10.1.7 ✅ | Cert validé → section "✅ Disponibles" | Boutons Aperçu et Télécharger |
| 10.1.8 ⚡ | Parent sans enfant lié | "Aucun enfant associé" ou page vide |
| 10.1.9 🔒 | Parent accède `/eleve` (espace élève) | Redirigé `/suivi` |

---

## PHASE 11 — Tests de Sécurité & Permissions Transversaux

### 11.1 Isolation des rôles (RBAC)

| # | Test | Résultat attendu |
|---|------|-----------------|
| 11.1.1 🔒 | Élève → `/admin` | Redirigé |
| 11.1.2 🔒 | Élève → `/prof` | Redirigé |
| 11.1.3 🔒 | Élève → `/manager` | Redirigé |
| 11.1.4 🔒 | Élève → `/suivi` | Redirigé |
| 11.1.5 🔒 | Parent → `/eleve` | Redirigé |
| 11.1.6 🔒 | Parent → `/admin` | Redirigé |
| 11.1.7 🔒 | Prof → `/admin` | Redirigé |
| 11.1.8 🔒 | Prof → `/manager` | Redirigé |
| 11.1.9 🔒 | Manager → `/admin` | Redirigé |
| 11.1.10 🔒 | Non-authentifié → toute route protégée | Redirigé `/connexion` |

### 11.2 RLS Supabase (accès données croisées)

| # | Test | Résultat attendu |
|---|------|-----------------|
| 11.2.1 🔒 | Élève A accède progression d'Élève B via URL directe | RLS bloque (`student_id = user.student_id`) |
| 11.2.2 🔒 | Parent voit progression d'enfant non lié | RLS bloque (`parent_children`) |
| 11.2.3 🔒 | Prof voit `lesson_progress` de classe hors périmètre | createAdminClient() uniquement côté serveur après vérif |
| 11.2.4 🔒 | Manager modifie thème d'un autre manager | `created_by = user.id` dans RLS |
| 11.2.5 🔒 | Route API `/api/sync/complete-lesson` sans auth | 401 |
| 11.2.6 🔒 | Route API `/api/certificats/[id]` sans auth | 401 ou 403 |

### 11.3 Injection & XSS

| # | Test | Résultat attendu |
|---|------|-----------------|
| 11.3.1 🔒 | Bloc texte avec `<script>alert(1)</script>` | Script non exécuté (sanitize HTML ou CSP) |
| 11.3.2 🔒 | Instructions code_challenge avec `<img onerror=alert(1)>` | Non exécuté |
| 11.3.3 🔒 | Nom d'élève `'; DROP TABLE students;--` | Supabase SDK paramétrise, pas d'injection SQL |
| 11.3.4 🔒 | Paramètre `?redirect=javascript:alert(1)` en connexion | Ignoré (relative URLs seulement) |

---

## PHASE 12 — Intégrité des Données & Cascades

| # | Test | Résultat attendu |
|---|------|-----------------|
| 12.1 ⚡ | Supprimer un thème publié avec des `lesson_progress` associés | Erreur FK ou cascade? |
| 12.2 ⚡ | Supprimer une leçon avec `lesson_progress` | Progress orphelines (pas de cascade) |
| 12.3 ⚡ | Student sans `profiles` row | Erreur à la connexion (géré?) |
| 12.4 ⚡ | `certificates` avec `student_id` inexistant | FK violation |
| 12.5 ⚡ | `lesson_progress.score` hors [0,100] | Contrainte DB ou applicatif? |
| 12.6 ⚡ | `students.xp` en négatif (bug gamification) | Contrainte `CHECK xp >= 0`? |
| 12.7 🔄 | Re-déployer la migration 009 (idempotence) | Thèmes existants non dupliqués |
| 12.8 ⚡ | `lesson_blocks.order_index` identiques dans une leçon | Tri stable? Comportement défini? |

---

## PHASE 13 — Tests de Régression UI

| # | Test | Résultat attendu |
|---|------|-----------------|
| 13.1 🔄 | Dashboard élève après level-up | Thèmes du nouveau niveau affichés |
| 13.2 🔄 | Classement avec 1 seul élève | Pas d'erreur, rang #1 affiché |
| 13.3 🔄 | Blockly avec StrictMode React | Une seule instance (fix `innerHTML = ""`) |
| 13.4 🔄 | `OfflineBanner` au premier render (SSR) | Aucune erreur d'hydration (`mounted` guard) |
| 13.5 🔄 | SW `/sw.js` enregistré sur toutes les pages `/eleve` | `SwRegistrar` présent dans layout |
| 13.6 🔄 | Pyodide 2e lancement (cache SW) | Aucun téléchargement réseau |
| 13.7 🔄 | Certificat PDF avec nom sans accents | Filename ASCII propre |
| 13.8 🔄 | Admin abonnements : modifier prix d'un plan | Prix mis à jour dans la liste |
| 13.9 🔄 | Page `/eleve/classement` sans élèves | "Personne dans le classement" |
| 13.10 🔄 | Sidebar élève : onglet actif correctement mis en évidence | Highlight CSS sur la page courante |

---

## TABLEAU RÉCAPITULATIF

| Phase | Acteur principal | Nb cas | Priorité |
|-------|-----------------|--------|---------|
| 0 — Auth | Tous | 14 | 🔴 Critique |
| 1 — Admin setup | Admin | 22 | 🔴 Critique |
| 2 — Plans | Admin | 9 | 🟠 Haute |
| 3 — Contenu | Manager | 55 | 🟠 Haute |
| 4 — Familles | Admin | 14 | 🔴 Critique |
| 5 — Abonnement | Parent | 18 | 🟠 Haute |
| 6 — Affectation | Prof | 11 | 🟡 Moyenne |
| 7 — Parcours élève | Élève | 55 | 🔴 Critique |
| 8 — Mode hors-ligne | Élève | 12 | 🟡 Moyenne |
| 9 — Certificats | Prof/Parent | 20 | 🔴 Critique |
| 10 — Suivi parent | Parent | 9 | 🟠 Haute |
| 11 — Sécurité | QA/Pentest | 20 | 🔴 Critique |
| 12 — Intégrité données | QA/DBA | 8 | 🟠 Haute |
| 13 — Régressions UI | QA | 10 | 🟡 Moyenne |
| **TOTAL** | | **287** | |

---

## TOP 10 RISQUES CRITIQUES À TESTER EN PRIORITÉ

1. **RLS Supabase** — Un élève peut-il accéder aux données d'un autre ? (11.2)
2. **XSS dans les blocs texte** — HTML non sanitisé dans `dangerouslySetInnerHTML` (11.3.1)
3. **Double XP offline** — Merge optimiste fonctionne-t-il sans double crédit ? (8.1.11)
4. **Certificat doublon** — Race condition lors de la complétion simultanée (9.1.4)
5. **Webhook CinetPay idempotency** — 2× le même webhook = 2 subscriptions actives ? (5.2.4)
6. **Suppression en cascade** — Supprimer thème/leçon casse-t-il des progress existants ? (12.1)
7. **Level affecté par DB** — Un Manager peut-il modifier `students.level` de n'importe quel élève ? (RBAC)
8. **Thème non publié visible élève** — Un thème draft affecté à une classe est-il lisible ? (6.1.6)
9. **Prof valide cert hors périmètre** — Pas de vérification classe ? (9.2.4)
10. **Boucle infinie Python** — Pas de timeout sur Pyodide (3.5.16)
