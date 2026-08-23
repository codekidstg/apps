# Guide mentor — Bâtisseur · T0 · Séance 4
## « Répéter »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** répéter une action sans la recopier, avec `for` et `range` — et savoir
> que le compteur commence à 0.
>
> La séance encaisse la frustration semée la semaine dernière.

---

## Avant d'arriver

Regardez s'il a fait **Le portier cassé**. Et surtout : souvenez-vous du nombre de lignes
qu'il avait écrites pour le labyrinthe de la séance 3. Vous allez le lui rappeler.

---

## Déroulé

### 0–5 min · Installation et reprise

### 5–15 min · Son labyrinthe, en quatre lignes
Le premier jeu affiche **sa règle recopiée quatre fois** — douze lignes, telles qu'il les
a écrites la semaine dernière.

Laissez-le d'abord la relancer telle quelle. Elle marche, et le jeu répond :

> *12 lignes · ⭐☆☆ — peux-tu y arriver en 4 ?*

**C'est le jeu qui pose le défi, pas vous.** Laissez-le réagir avant de dire quoi que ce
soit. La plupart demandent « mais comment ? » — c'est exactement le moment d'enseigner
la boucle.

### 15–27 min · La boucle
Trois points, dans cet ordre :

**`range(4)` ne veut pas dire « répète 4 fois ».** Il fabrique la suite 0, 1, 2, 3, et la
boucle prend ces nombres un par un. Insistez : c'est ce qui permettra de faire des boucles
sur autre chose que des nombres, en séance 6.

**La forme est déjà connue.** Deux-points, décalage : comme le `if` de la semaine dernière.
Rien de nouveau à apprendre là.

**`tour` est une variable ordinaire.** Elle change à chaque passage. Ne l'appelez pas `i` —
en séance 2 vous lui avez demandé des noms qui veulent dire quelque chose, tenez la
consigne. Mentionnez juste que les développeurs écrivent souvent `i` par habitude.

### 27–39 min · Une boucle qui contient un si
**La notion la plus difficile du thème.** Prenez le temps.

Comptez les espaces à voix haute avec lui. Le piège est la ligne `avance()` qui revient
à 4 espaces : dans la boucle, **hors** du si. À 8 espaces, Kirikou n'avancerait que
lorsqu'il y a un mur — autant dire jamais.

### 39–52 min · L'erreur qui ne plante pas
Le tournant de la séance, et peut-être du thème.

`range(5)` fait **cinq tours**, mais les valeurs vont de **0 à 4**. Dites toujours les
deux moitiés ensemble — sinon il retiendra que `range(5)` fait quatre tours, ce qui serait
pire.

Puis le compte à rebours qui ment : le programme tourne parfaitement et affiche
`0 1 2 3 4` au lieu de `5 4 3 2 1`. Aucun message rouge.

**Faites-lui formuler la leçon lui-même :** *« pas de rouge » ne veut plus dire
« c'est bon ».*

### 52–62 min · Sa pyramide
`"*" * 4` donne `****` — le `*` a deux métiers, comme le `+` de la séance 2.

Puis il dessine sa pyramide de 5 lignes. Le `tour + 1` qu'il doit trouver est exactement
l'off-by-one qu'il vient d'apprendre : la notion sert immédiatement.

### 62–65 min · Récap et semaine

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il croit que `range(4)` va jusqu'à 4 | Faites-lui afficher les valeurs : `print(tour)` dans la boucle. Il verra 0,1,2,3 |
| Il met `avance()` à 8 espaces | Ne corrigez pas : laissez-le lancer. Kirikou ne bougera pas, il comprendra |
| Il mélange les niveaux de décalage | Comptez les espaces ensemble, ligne par ligne, à voix haute |
| Il oublie le `+1` dans la pyramide | Le test le lui dira. Laissez-le lire le message |
| Il écrit `for i in range(...)` | Acceptez, mais rappelez : un nom qui veut dire quelque chose est plus clair |
| Il veut mettre `range(15)` partout | Bon réflexe ! Il a compris que le nombre se règle. Encouragez |

---

## À ne pas faire

- **Ne pas lui donner le nombre de tours** du grand couloir. Le chercher fait partie de
  l'exercice.
- **Ne pas dire « range(5) ne va pas jusqu'à 5 » tout seul.** Toujours avec « mais il fait
  bien cinq tours ». La moitié de la phrase crée une erreur pire.
- **Ne pas enseigner `while`.** C'est la séance 11.
- **Ne pas enseigner `range(a, b)`.** Un seul argument suffit largement cette semaine.

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Combien de tours ?** — compter les tours et suivre le compteur | 6 min |
| Milieu de semaine | **Le bon range** — ranger six boucles par nombre de tours | 6 min |
| Fin de semaine | **Que dit la boucle ?** — relier une boucle à sa sortie exacte | 6 min |
| Veille de la séance 5 | **Le grand couloir** — quinze pas, impossible à recopier | 12 min |

---

## Réussite de la séance

Il a refait son labyrinthe **avec une boucle**, sans qu'on lui donne la solution.

C'est le seul critère. S'il repart en sachant que `range(5)` fait cinq tours de 0 à 4,
c'est un bonus considérable — mais la boucle elle-même suffit.
