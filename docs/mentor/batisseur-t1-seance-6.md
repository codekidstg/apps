# Guide mentor — Bâtisseur · T1 · Séance 6
## « Les listes »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** ranger plusieurs valeurs dans une seule variable, et les parcourir.
>
> Première séance du deuxième thème. Elle encaisse la frustration semée par
> l'entraînement de la veille — cinq variables pour rien.

---

## Avant d'arriver

Regardez s'il a fait **Cinq variables pour rien**. C'est indispensable : toute la
séance repose sur le souvenir de ce qu'il a ressenti en l'écrivant. S'il ne l'a pas
faite, faites-la avec lui dans les cinq premières minutes — elle prend dix minutes,
et sans elle la séance perd son moteur.

---

## Déroulé

### 0–5 min · Son programme de la veille
Ouvrez sur **son** code : cinq prix, cinq variables, une addition à rallonge.
Une seule question : **« et pour vingt articles ? »** Laissez-le répondre.

### 5–16 min · Frère Jacques en trente-deux lignes
Le jeu affiche la mélodie note par note — trente-deux appels à `jouer()`.

**Faites-le lancer tel quel.** Ça marche, c'est joli, il reconnaît l'air. Puis le jeu
rend son verdict : *32 lignes · ⭐☆☆ · objectif 3*.

**C'est le jeu qui pose le défi, pas vous.** Laissez-le réagir. La plupart demandent
« mais comment ? » — c'est exactement le moment d'enseigner la liste.

### 16–30 min · La liste
Trois points, dans cet ordre :

**Les crochets.** Une variable, plusieurs valeurs, séparées par des virgules. Rien
de plus. `melodie = ["Do", "Re", "Mi"]`.

**La forme est déjà connue.** `for note in melodie:` — deux-points, décalage. C'est
le `for` de la semaine dernière, avec une liste à la place de `range`.

**Le `for` ne compte pas, il distribue.** *La notion de la séance.* Ne la survolez
pas : un enfant qui n'a vu que `range` croit très naturellement que la variable
compte. Faites-lui afficher les deux côte à côte avec un `print` dans chaque boucle —
0, 1, 2 d'un côté, Do, Ré, Mi de l'autre. Il faut qu'il le voie de ses yeux, pas
qu'il vous croie.

### 30–38 min · La même mélodie, en trois lignes
Les trente-deux notes sont déjà dans la liste. Il écrit la boucle. Trois lignes,
trois étoiles.

**Puis demandez-lui de changer une note et de réécouter.** Une seule ligne à
modifier. C'est là que la liste cesse d'être une syntaxe et devient un outil — ne
sautez pas ce moment, il vaut dix minutes d'explication.

### 38–48 min · Ajouter et compter
`[]`, `.append()`, `len()`.

Rattachez immédiatement au connu : **le `[]` se met avant, une seule fois, comme le
`total = 0` de la semaine dernière**. Même place, même raison. S'il a compris
l'accumulateur, il a déjà compris ça.

### 48–62 min · Un si dans une boucle
**La partie difficile.** C'est la « boucle contenant un si » de la séance 4,
transposée à une liste — et le guide de la séance 4 la donnait déjà comme la notion
la plus dure du thème. Prenez le temps.

Comptez les espaces à voix haute avec lui : 0 pour le `for`, 4 pour le `if`, 8 pour
ce qu'il y a dedans. Le piège est le `if` ramené à gauche : il ne se déclenche alors
qu'une fois, à la fin, sur la dernière valeur. Aucun message d'erreur.

Puis le panier : total **et** alerte. Quatre séances travaillent ensemble dans huit
lignes. **Laissez-le seul le plus longtemps possible** — c'est le moment de mesurer
ce qui est vraiment acquis.

### 62–65 min · Récap et semaine

---

## Si vous avez de l'avance

Deux prolongements prêts, à ne sortir que si les 65 minutes sont bouclées en 50.
Ne les improvisez pas, piochez ici :

- **La mélodie qui monte** — faire une liste de notes qui monte, puis demander
  d'ajouter la descente avec des `append`.
- **Le plus cher** — dans la liste de prix, afficher combien d'articles dépassent
  2 000 F. C'est le compteur (`combien = combien + 1`) appliqué à une liste : la
  notion de la semaine dernière, dans le décor de cette semaine.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il écrit `jouer(melodie)` au lieu de `jouer(note)` | « melodie, c'est la boîte. note, c'est ce que la boucle en sort » |
| Il croit que `note` vaut 0, 1, 2 | Faites afficher `print(note)`. Il verra Do, Ré, Mi |
| Il oublie les guillemets dans la liste | L'erreur est rouge et parlante. Laissez-le la lire |
| Il met `ma_liste = []` dans la boucle | Même remède que pour `total = 0` : faites afficher la liste à chaque tour |
| Il écrit `append` sans le point | `ma_liste.append(x)` — le point relie l'action à la liste |
| Il colle le `if` à gauche | Ne corrigez pas : laissez-le lancer. Une seule alerte s'affichera |
| Il demande `melodie[0]` | Bonne question — et c'est pour plus tard. Voir ci-dessous |

---

## À ne pas faire

- **Ne pas enseigner l'accès par indice** — `melodie[0]`, `melodie[2]`. C'est le
  choix le plus important de cette séance. Un enfant à qui l'on donne l'indice trop
  tôt écrit `for i in range(len(melodie))` pendant des années, au lieu de
  `for note in melodie`. En apprenant le parcours **avant** l'indice, il acquiert
  d'emblée la bonne habitude. S'il pose la question : « ça existe, et tu n'en as pas
  besoin aujourd'hui — on le verra quand ça servira vraiment. »
- **Ne pas enseigner `range(len(...))`.** Même raison, en pire.
- **Ne pas parler de listes dans des listes.** Beaucoup trop tôt.
- **Ne pas montrer `.sort()`, `.remove()`, ni les tranches.** Une notion par séance.
- **Ne pas résoudre le panier à sa place.** S'il bloque, demandez-lui d'appliquer la
  méthode de la semaine dernière : qu'est-ce que tu attends, qu'est-ce que tu obtiens ?

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Une seule boîte pour tout** — ce qu'est une liste, ce que la boucle en fait | 6 min |
| Milieu de semaine | **Le panier qui grandit** — `append` et `len` sur une tontine | 10 min |
| Fin de semaine | **🎹 Ta mélodie à toi** — composition libre, huit notes minimum | 10 min |
| Veille de la séance 7 | **Trois fois la même politesse** — pénible exprès | 12 min |

Le dernier n'a aucune difficulté technique : il doit recopier trois fois le même
cadre de trois lignes, à trois endroits séparés par du contenu différent. **Et une
liste ne l'aidera pas** — ce n'est pas une valeur qui se répète, c'est un morceau de
programme. C'est exactement le manque que les fonctions combleront la semaine
suivante.

---

## Réussite de la séance

Il a rejoué Frère Jacques **avec une liste et une boucle**, sans qu'on lui donne
la solution.

C'est le seul critère. S'il repart en sachant que le `for` distribue au lieu de
compter, c'est un bonus considérable — mais la liste elle-même suffit.
