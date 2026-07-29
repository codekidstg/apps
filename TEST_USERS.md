# CodeKids — Comptes de test

> URL locale : http://localhost:3000/fr/connexion
> URL prod    : (à compléter)

---

## 👑 Administrateur

| Champ        | Valeur                    |
|--------------|---------------------------|
| Email        | `admin@codekids.test`     |
| Mot de passe | `TestAdmin123!`           |
| Nom affiché  | Admin Test                |
| Accès        | `/fr/admin`               |

**Peut faire :** tout — gérer utilisateurs, écoles, thèmes, voir logs suspects.

---

## 🗂️ Manager

| Champ        | Valeur                    |
|--------------|---------------------------|
| Email        | `manager@codekids.test`   |
| Mot de passe | `TestManager123!`         |
| Nom affiché  | Manager Test              |
| Accès        | `/fr/manager`             |

**Peut faire :** créer/éditer thèmes & cours, publier du contenu, affecter des cours aux profs.

---

## 👨‍🏫 Professeur

| Champ        | Valeur                    |
|--------------|---------------------------|
| Email        | `teacher@codekids.test`   |
| Mot de passe | `TestTeacher123!`         |
| Nom affiché  | Prof Kofi                 |
| Accès        | `/fr/prof`                |

**Classe assignée :** Terminale A — Informatique  
**Cours affecté :** Introduction à Python  
**Peut faire :** lire les cours (lecture seule + watermark), noter les élèves.

---

## 🎮 Élève

| Champ        | Valeur                    |
|--------------|---------------------------|
| Email        | `student@codekids.test`   |
| Mot de passe | `TestStudent123!`         |
| Nom affiché  | Amavi                     |
| Pseudonyme   | Amavi                     |
| Accès        | `/fr/eleve`               |

**XP actuel :** 280 XP (Lv 1 Explorateur)  
**Classe :** Terminale A — Informatique  
**Peut faire :** jouer les quêtes, défi Blockly robot, personnaliser son avatar, voir ses badges.

---

## 👪 Parent

| Champ        | Valeur                    |
|--------------|---------------------------|
| Email        | `parent@codekids.test`    |
| Mot de passe | `TestParent123!`          |
| Nom affiché  | Parent Amavi              |
| Accès        | `/fr/suivi`               |

**Peut faire :** suivre la progression de l'enfant (espace non encore construit).

---

## 🗺️ Parcours de test recommandé

### Test complet Élève → Prof → Admin

```
1. Connexion élève (student@codekids.test)
   → /fr/eleve — voir dashboard, 280 XP, badge "Premier Pas"
   → /fr/eleve/ville — carte Phaser, bâtiment bleu débloqué
   → /fr/eleve/quete/[id] — jouer une leçon, répondre quiz
   → /fr/eleve/quete/[id_blockly] — défi robot (Guide le robot !)
   → /fr/eleve/avatar — personnaliser le robot
   → /fr/eleve/badges — voir les badges gagnés

2. Connexion prof (teacher@codekids.test)
   → /fr/prof — tableau de bord, 1 cours, 1 classe
   → /fr/prof/cours — liste des cours affectés
   → /fr/prof/cours/[themeId] — voir le cours (watermark PROF-24ABEB81)
   → /fr/prof/cours/[themeId]/lecons/[lessonId] — lecteur avec watermark diagonal
   → /fr/prof/classes/[classId] — noter Amavi sur "Introduction à Python"

3. Connexion manager (manager@codekids.test)
   → /fr/manager — tableau de bord
   → /fr/manager/themes — liste des thèmes
   → /fr/manager/themes/[id] — éditer chapitres/leçons
   → Changer le statut d'un thème (draft → validated → published)

4. Connexion admin (admin@codekids.test)
   → /fr/admin — tableau de bord, compteurs
   → /fr/admin/utilisateurs — voir tous les comptes
   → /fr/admin/themes — vue globale des thèmes
   → Vérifier les logs suspects si >15 accès/60s (prof)
```

---

## 🗄️ Données en base

| Table              | Contenu                                      |
|--------------------|----------------------------------------------|
| themes             | "Introduction à Python" (published)          |
| chapters           | 4 zones : Place du Code, Tour des Boucles, Pont des Conditions, Labo Blockly |
| lessons            | 12 leçons (3 par zone)                       |
| lesson_blocks      | Blocs texte + quiz + défis Blockly (game)    |
| classes            | Terminale A — Informatique (Prof Kofi)       |
| class_enrollments  | Amavi inscrite dans la classe                |
| theme_assignments  | "Intro Python" → Prof Kofi → Terminale A     |
| students           | Amavi — 280 XP, Lv 1 Explorateur            |

---

## ⚠️ Migration à appliquer dans Supabase SQL Editor

**Fichier :** `supabase/migrations/006_gamification.sql`

Si les tables `lesson_progress`, `gamification_events`, `student_achievements`, `student_avatar`
n'existent pas encore → copier-coller le contenu du fichier dans le SQL Editor de Supabase.
