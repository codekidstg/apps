# Guide mentor — Bâtisseur · T0 · Séance 3
## « Choisir »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** écrire un programme qui prend une décision — si… alors… sinon… —
> et comparer deux valeurs.
>
> Le vrai sujet de l'heure : **`=` range, `==` compare**. Et le décalage fait partie
> du langage.

---

## Avant d'arriver

Regardez s'il a fait **La calculette cassée**. S'il bloque encore sur `int(...)`,
reprenez-le en deux minutes : les conditions vont s'appuyer dessus.

---

## Déroulé

### 0–5 min · Installation et reprise
Lancez Python tout de suite. Pendant le chargement, un mot sur la semaine.

### 5–13 min · Le portier
Une seule consigne : **« Essaie d'entrer. »**

Il tape un mot au hasard. Refusé. Il recommence. Refusé. Laissez-le s'acharner
quelques essais **sans rien dire**.

Puis, si besoin, une seule phrase : *« Tu as le droit de regarder le code. »*

Il trouve le mot de passe, il entre. **C'est le meilleur moment de la séance** — il vient
de comprendre seul que `if` compare. Ne le commentez pas trop vite.

Enchaînez sur la remarque qui compte : *« Un mot de passe écrit dans le programme,
ce n'est pas un mot de passe. »*

### 13–27 min · Le si, le sinon, le décalage
Les deux-points, puis quatre espaces. Insistez : **le décalage n'est pas de la mise
en page, c'est de la grammaire.** Ce qui est décalé appartient au si ; ce qui revient
à gauche s'exécute toujours.

### 27–37 min · Comparer
Les six signes. Puis le piège : *« La semaine dernière, `=` voulait dire ranger.
Pour comparer, il en faut deux. »*

Faites-lui prédire `"kodi" == "Kodi"` avant de lancer. Le « faux » surprend et ancre
la sensibilité à la casse.

### 37–50 min · On casse, puis on répare
Faites-lui **supprimer le décalage** devant un `print`. `IndentationError`, avec
l'indice en français.

Puis l'atelier de réparation : deux erreurs, un `=` et un décalage. Il travaille seul.

### 50–60 min · Les deux jeux
**Kirikou décide tout seul.** Il écrit une règle — *s'il y a un mur, tourne ; puis
avance* — et la recopie autant de fois qu'il faut. Le niveau se résout en **12 lignes**,
soit quatre fois la règle.

> ⚠️ **Ne lui donnez pas le nombre de répétitions.** Qu'il tâtonne : c'est la fatigue
> du recopiage qui rendra la boucle désirable la semaine prochaine. Cette frustration
> est voulue.

**Le jeu qui choisit sa difficulté.** Il change `niveau = "difficile"` en `"facile"`,
reconstruit, et voit un jeu tout autre. Rappelez-lui l'atelier découverte : *« Tu te
souviens de ce jeu ? C'est toi qui écris ses règles maintenant. »*

### 60–65 min · Le verdict et la semaine
Son programme qui juge quelqu'un. Puis les quatre entraînements.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il écrit `if age = 18:` | L'erreur du siècle. Laissez Python la signaler, puis : « un signe range, deux comparent » |
| Il oublie les deux-points | Idem, laissez le `SyntaxError` parler |
| Il décale de 2 espaces, puis de 6 | Montrez que Python veut **le même décalage** dans un bloc. Quatre espaces, toujours |
| Il met `else` avec une condition | `else` ne prend jamais de condition — c'est « tout le reste » |
| Il croit que les deux branches s'exécutent | Faites-lui tracer à voix haute : « le train passe d'un côté ou de l'autre » |
| Dans le labyrinthe, il compte les cases au lieu d'écrire la règle | Laissez faire une fois, puis déplacez le mur : sa solution casse, la règle non |

---

## À ne pas faire

- **Ne pas enseigner la boucle.** C'est la séance 4, et toute la frustration du
  recopiage sert à la préparer.
- **Ne pas donner le mot de passe du portier.** S'il le trouve seul, il gagne dix fois
  plus que si on le lui souffle.
- **Ne pas corriger son décalage à sa place.** L'`IndentationError` est un bon
  professeur.

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Vrai ou faux ?** — huit comparaisons à trancher | 6 min |
| Milieu de semaine | **Le bon symbole** — relier chaque signe à son sens | 5 min |
| Fin de semaine | **Quel chemin ?** — suivre l'aiguillage | 7 min |
| Veille de la séance 4 | **Le portier cassé** — trois erreurs à réparer | 12 min |

---

## Réussite de la séance

Il a corrigé un `=` en `==` **de lui-même**, après avoir lu le message d'erreur.

C'est le seul critère. Le labyrinthe et l'arcade sont du plaisir — précieux, mais
pas ce qu'on évalue.
