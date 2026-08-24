# Guide mentor — Bâtisseur · T0 · Séance 5
## « Le bug qui ne dit rien »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** trouver un bug qui ne provoque aucune erreur — en faisant parler le
> programme — et cumuler des valeurs dans une boucle.
>
> Dernière séance du thème. Elle encaisse la promesse de la semaine dernière :
> « pas de rouge » ne veut plus dire « c'est bon ». Reste à savoir quoi en faire.

---

## Avant d'arriver

Regardez s'il a fait **Le grand couloir**. C'est indispensable : le jeu d'ouverture est
*sa* solution, avec un tour en moins. S'il ne l'a pas faite, faites-la avec lui dans les
cinq premières minutes — sinon l'accroche tombe à plat.

---

## Déroulé

### 0–5 min · Installation et reprise

### 5–17 min · Kirikou n'arrive plus
Le jeu affiche **sa** boucle du grand couloir, avec `range(14)` au lieu de `range(15)`.

Laissez-le lancer. Le programme tourne, aucun message rouge, et Kirikou s'arrête sur la
case **juste à côté** de l'étoile.

**Ne dites pas où est le bug.** Laissez-le regarder, relancer, relire. La plupart tentent
d'abord de changer les lignes au hasard — c'est exactement le réflexe qu'on va remplacer.
Quand il commence à tourner en rond, enchaînez sur la méthode : c'est le moment où elle
sert.

### 17–30 min · Faire parler le programme
Une seule idée, à marteler : **le programme ne se trompe jamais, il fait exactement ce qui
est écrit.** Le bug est dans l'écart entre l'écrit et le voulu.

Puis la méthode en trois gestes, dans cet ordre :

- **Attendu** — il l'écrit ou le dit à voix haute *avant* de lancer. Ici : quinze pas.
- **Obtenu** — un `print` dans la boucle, et on lit.
- **Compare** — l'endroit où les deux se séparent, c'est là qu'est le bug.

Faites-lui ajouter le `print` lui-même, dans le jeu. Le dernier tour affiché est `13`.
C'est l'off-by-one de la semaine dernière qui revient — dites-le, la notion resert.

**Précisez que le mouchard s'enlève après.** Sinon certains croient qu'il fait partie du
programme et le laissent partout.

### 30–45 min · L'accumulateur
**La seule notion neuve de la séance.** Prenez le temps, c'est la marche la plus haute
depuis la boucle.

Trois pièces, et leur place compte : `total = 0` avant, `total = total + 500` dedans,
`print(total)` après.

Le point qui bloque tout le monde est la ligne du milieu. `total = total + 500` ressemble
à une équation fausse. **Ne dites jamais « est égal à » pour le signe `=`. Dites « range
dans ».** Python calcule la droite avec l'ancienne valeur, puis range le résultat à gauche.

Déroulez les trois tours à voix haute avec lui : 0 + 500 = 500, puis 500 + 500 = 1000,
puis 1000 + 500 = 1500. S'il hésite encore — mettez un `print(total)` dans la boucle et
regardez-le monter ensemble. La méthode de tout à l'heure sert immédiatement.

Le jeu **Le total qui ne monte pas** vise l'erreur la plus fréquente : `total = 250`
écrase au lieu d'ajouter. Laissez-le se tromper avant d'expliquer.

### 45–60 min · Le panier du marché
La synthèse du thème : `print`, variable, `if`, `for` et l'accumulateur dans un seul
programme, en FCFA.

**Laissez-le seul le plus longtemps possible.** C'est le moment de vérifier ce qui est
vraiment acquis. S'il bloque, ne donnez pas la ligne — demandez-lui d'appliquer la
méthode : qu'est-ce que tu attends, qu'est-ce que tu obtiens ?

L'`int(input(...))` est déjà dans le programme de départ. Il l'a vu en séance 2 avec la
calculette — rappelez-le lui si besoin, c'est le même geste.

### 60–65 min · Bilan du thème et la marche suivante
Terminez sur la frustration qui prépare la suite : faire le total de vingt articles
demanderait vingt variables. L'entraînement de fin de semaine est fait pour qu'il le
ressente dans ses doigts.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il change les chiffres au hasard jusqu'à ce que ça marche | C'est le réflexe à casser. « Tu attendais quoi ? Tu as obtenu quoi ? » |
| Il met le `print` collé à gauche | Laissez-le lancer : un seul nombre s'affiche. Il comprendra tout seul |
| Il lit `total = total + 500` comme une équation | « Le `=` ne dit pas *est égal à*, il dit *range dans* » |
| Il écrit `total = 500` dans la boucle | Faites afficher `total` à chaque tour. La valeur ne monte pas |
| Il met `total = 0` dans la boucle | Même remède : la trace montre le compteur qui repart à zéro |
| Il oublie le `int()` autour de `input()` | L'erreur est rouge et parlante cette fois. Laissez-le la lire |
| Il veut afficher le total dans la boucle | Ce n'est pas faux, juste bavard. Distinguez déboguer et afficher le résultat |

---

## À ne pas faire

- **Ne pas montrer où est le bug du grand couloir.** Le chercher *est* la leçon. S'il
  sèche, donnez la méthode, jamais la ligne.
- **Ne pas dire « est égal à ».** Un seul mot mal choisi et l'accumulateur reste
  incompréhensible toute l'année.
- **Ne pas enseigner `total += 500`.** Le raccourci cache exactement le mécanisme qu'on
  veut rendre visible. Il le découvrira plus tard.
- **Ne pas parler de listes.** La frustration des vingt variables doit rester entière
  jusqu'à la séance 6 — c'est elle qui donnera envie.
- **Ne pas transformer la séance en révision générale.** Une notion neuve, une méthode.
  Le reste se révise en faisant.

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Attendu ou obtenu ?** — lire une trace et situer le dérapage | 6 min |
| Milieu de semaine | **Le total qui ment** — les trois pièces à leur place | 6 min |
| Fin de semaine | **La chasse silencieuse** — la tontine qui n'additionne pas | 10 min |
| Veille de la séance 6 | **Cinq variables pour rien** — pénible exprès | 10 min |

Le dernier n'a pas de difficulté technique. Son seul but est de le faire souffrir un peu
pour que les listes arrivent comme un soulagement — exactement comme le labyrinthe recopié
quatre fois avait préparé la boucle.

---

## Réussite de la séance

Devant un programme faux qui ne plante pas, il **pose un `print` de lui-même** au lieu de
modifier au hasard.

C'est le seul critère. Le panier terminé est un bonus ; le réflexe de la trace est ce qu'il
gardera.
