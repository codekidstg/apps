# Moteur de jeu « La pirogue » — spécification

À transmettre à la session des fonctionnalités. Écrit par la session contenus ;
rien ici n'est implémenté.

**Ce qu'il enseigne :** la boucle `while`, et une seule idée — *le nombre de
tours n'appartient pas au programmeur, il appartient au monde.* Un `for` ne
peut pas gagner à ce jeu, et c'est la définition d'un `while`.

**Où il sert :** Bâtisseur, thème « Un programme qui tient debout », séance 1
« La boucle qui attend » (trois blocs de séance), puis en salle de jeu.

---

## 1. La mécanique neuve : journal → rejeu

Aucun moteur actuel ne fait ça, et c'est le cœur de la demande.

- `PythonArcade` lit les **variables finales** du programme : l'enfant règle un
  jeu, il ne le joue pas.
- `PythonMaze` fait avancer un sprite **instruction par instruction**.
- Ici, les fonctions du prélude **empilent des événements** dans `_journal`.
  Le programme tourne jusqu'au bout, puis le moteur **rejoue le journal en
  animation**, un événement par image-clé.

L'enfant écrit une boucle, appuie sur ▶, et **regarde sa boucle se dérouler**.

Le worker sait déjà faire le nécessaire : `prelude` et `collect` existent
(`src/workers/pyodide.worker.ts`). Il suffit de `collect: ["_journal", "poids", "minutes"]`.

```python
# Prélude — palier 1
_journal = []
_coups = 0
poids = 0
minutes = 0

def tirer():
    """Un coup de filet. Rend le poids remonte, en kg."""
    global _coups, minutes
    _coups = _coups + 1
    if _coups > 200:
        raise RuntimeError(
            "Tu as tire 200 fois et le filet n'a pas bouge d'un gramme. "
            "Qu'est-ce qui devrait avancer, dans ta boucle ?")
    prise = _rnd.randint(4, 12)
    minutes = minutes + 1
    _journal.append({"quoi": "tirer", "prise": prise, "minutes": minutes})
    return prise

def jeter(kg):
    """Rejette des poissons a l'eau pour alleger la pirogue."""
    _journal.append({"quoi": "jeter", "kg": kg})
    return -kg
```

**Le plafond de 200 appels n'est pas une sécurité technique, c'est un bloc de
cours.** Une boucle sans fin finit sur une phrase en français au lieu d'un
onglet gelé — et la phrase pose la bonne question.

## 2. Ce que l'enfant voit

Le lac Togo à l'aube : dégradé de ciel, l'eau, une pirogue, un filet immergé.
À droite, une balance verticale graduée jusqu'au seuil de chavirement.

Pendant le rejeu, à chaque événement `tirer` :

1. le filet remonte d'un cran, des poissons gigotent dedans ;
2. l'aiguille de la balance monte, le chiffre en kg avec elle ;
3. **la pirogue s'enfonce** — la ligne de flottaison monte visiblement ;
4. au-delà de 85 % du seuil, l'eau commence à passer par-dessus bord.

Trois fins, trois animations :

| Fin | Ce qui se passe à l'écran |
|---|---|
| **Gagné** | La pirogue rame vers la rive, le marché s'ouvre, les francs se comptent |
| **Pas assez** | Le marché refuse le filet : « Reviens avec 50 kg » |
| **Chavire** | La pirogue verse, les poissons repartent, l'écran devient bleu |
| **Jamais remonté** | Le pêcheur tire une corde vide dans le noir, et le message des 200 coups |

Tout est en canvas ou SVG + CSS, **aucun fichier à télécharger** : le jeu tourne
hors-ligne, et Python est déjà en cache dès la première leçon du parcours.

## 3. Les trois paliers

Chacun est **gagnable à coup sûr** par le bon programme, quel que soit le
tirage. C'est la règle qui a décidé des nombres ci-dessous : un jeu où la chance
tranche n'enseigne rien.

### Palier 1 — « Remplir le filet »

Prise 4 à 12 kg, objectif 50, chavire à 70. Le pire cas est 49 + 12 = 61 :
**on ne peut pas chavirer**, donc la seule façon de perdre est de s'arrêter trop
tôt. C'est le palier de découverte.

```python
poids = 0

while poids < 50:
    poids = poids + tirer()
    print("Dans le filet :", poids, "kg")
```

L'enfant reçoit ce programme avec `while poids < 20:` et le marché qui en
réclame 50. Son seul geste : changer la question. Il voit alors sa boucle tirer
cinq, six, sept fois — **un nombre qu'il n'a pas écrit**.

### Palier 2 — « Ne pas chavirer »

Prise 10 à 25 kg, objectif 50, chavire à 70. `jeter(kg)` est disponible.
`while poids < 50:` tout seul peut atteindre 74 et verser. Le bon programme
allège **avant** de tirer :

```python
while poids < 50:
    if poids > 44:
        poids = poids + jeter(10)
    poids = poids + tirer()
```

44 + 25 = 69 : sous le seuil, toujours. Boucle **et** décision dans le même
geste, et la décision se prend avant le risque, pas après.

### Palier 3 — « Rentrer avant la fermeture »

Prise 4 à 12 kg, objectif 50, et **chaque coup de filet coûte une minute**. Le
marché ferme dans 8 minutes. Huit coups rapportent entre 32 et 96 kg : parfois
le filet est plein, parfois non, et **les deux sont des victoires** — à condition
que la boucle s'arrête pour la bonne raison.

```python
while poids < 50 and minutes < 8:
    poids = poids + tirer()

if poids >= 50:
    print("Bonne journee :", poids, "kg")
else:
    print("Le marche ferme. Je rentre avec", poids, "kg")
```

Le soleil descend à l'écran au fil des minutes. Un `for i in range(8)` continue
de tirer alors que le filet est plein : elle arrive **après la fermeture**, et
ne vend rien. Deux raisons d'arrêter, et il faut savoir laquelle a joué.

## 4. Comment on gagne — ce que le moteur vérifie

Le verdict se lit dans le journal, jamais dans le texte affiché.

```
coups        = nombre d'evenements "tirer"
poids_final  = somme des prises - somme des jets
minutes      = nombre de coups (palier 3)
```

| | Gagné si |
|---|---|
| **P1** | `50 <= poids_final < 70` et `"while"` dans le code |
| **P2** | `50 <= poids_final < 70`, jamais passé par 70 en cours de route, et `"jeter"` appelé |
| **P3** | `coups <= 8`, et la boucle s'est arrêtée dès que l'une des deux conditions a cassé — c'est-à-dire `poids_final >= 50` avec `coups` minimal, **ou** `coups == 8` |

`exige` liste les mots qui doivent figurer dans le code (`while`, `if`, `and`,
`jeter`). Sans cette vérification, un programme qui n'est pas une boucle peut
tomber juste par hasard : le moteur refuse alors avec « ce n'est pas une boucle
qui a fait ça ».

**Une demande au passage :** le worker tire une graine au hasard à chaque
exécution (`seed: Math.floor(Math.random() * 1_000_000)`). Pour que le mentor
voie exactement la partie de l'enfant, le moteur devrait pouvoir passer une
graine fixe par palier. Ce n'est pas bloquant : les paliers ci-dessus sont
gagnables quel que soit le tirage.

## 5. La forme du `content`

Stocké tel quel dans `lesson_blocks.content` et `training_blocks.content`,
avec `type: "game"`.

```js
{
  game_type: "pirogue",
  palier: 1,
  title: "La pirogue — remplir le filet",
  instructions: "Le marche veut 50 kg. Change la question de ta boucle.",
  starter_code: "poids = 0\n\nwhile poids < 20:\n    poids = poids + tirer()\n    print(\"Dans le filet :\", poids, \"kg\")\n",
  prise: { min: 4, max: 12 },
  objectif_kg: 50,
  chavire_kg: 70,
  minutes_max: null,          // palier 3 : 8
  jeter_dispo: false,         // palier 2 : true, par pas de 10 kg
  exige: ["while"],
  plafond_appels: 200,
  messages: {
    pas_assez: "Le marche refuse : il veut 50 kg. Ta boucle s'est arretee trop tot.",
    chavire:   "Trop lourd d'un coup : la pirogue a verse. Allege avant de tirer.",
    trop_tard: "Le marche a ferme pendant que tu tirais encore.",
    sans_fin:  "Ton filet n'a jamais bouge. Qu'est-ce qui devrait avancer ?"
  },
  explication: "Tu ne savais pas combien de coups de filet il faudrait — et tu n'avais pas a le savoir. C'est la question en haut de la boucle qui a compte pour toi."
}
```

## 6. Les trois variantes de la salle de jeu

Les paliers de la séance se jouent une fois, avec le mentor. Ceux-là sont en
libre service, rejouables, et chacun ouvre une porte que la séance laisse
fermée. Ils sont écrits dans `scripts/terrain-batisseur-t2-s1-pirogue.mjs`, qui
**refuse de les écrire en base tant que ce moteur n'existe pas** : il cherche
lui-même la chaîne `pirogue` dans les deux lecteurs avant d'accepter.

### 🛶 Le filet déjà plein (palier 1) — la boucle à zéro tour

`depart_kg: 55` pour un objectif de 50. La question répond non **avant le
premier tour** : la boucle ne tourne pas une seule fois, et le programme
continue quand même. Rien, dans tout le catalogue, ne montre ça à l'écran.

L'enfant écrit sa boucle habituelle, plus un `if` pour raconter la journée.
Gagné si le journal contient **zéro** événement `tirer` et que le code contient
bien une boucle — un programme qui ne pêche pas parce qu'il n'a pas de boucle
ne gagne pas.

Le moteur a besoin de deux choses de plus :

- **`depart_kg`** : le prélude initialise `poids` à cette valeur au lieu de 0.
- **`coups_attendus`** : quand il vaut 0, le verdict se lit sur le nombre de
  coups et non sur le poids final.

À l'écran : la pirogue est déjà basse sur l'eau au lever du rideau, le filet
reste sec, et le pêcheur rame directement vers le marché.

### 🛶 La pirogue qui fuit (palier 2) — plusieurs changements dans un tour

`fuite_kg: 3`. Une nouvelle fonction au prélude :

```python
def fuite():
    """Ce que la fente de la coque remporte a chaque tour, en kg."""
    _journal.append({"quoi": "fuite", "kg": 3})
    return 3
```

L'enfant doit écrire **deux lignes qui changent le poids dans le même tour** :

```python
while poids < 50:
    poids = poids + tirer()
    poids = poids - fuite()
```

Quatre kilos tirés, trois perdus : ça avance d'un seul. La boucle prend deux
fois plus de tours qu'il ne le croit, et c'est la première fois que le plafond
des 200 appels se sent proche.

**Le garde-fou qui compte :** la fuite doit rester *strictement* plus petite
que la plus petite prise. Avec une fuite de 4 contre une prise de 4 à 12, un
tirage malheureux fait stagner le poids et la boucle ne finit jamais — le
script refuse cette configuration.

À l'écran : l'eau suinte par la fente, et à chaque tour quelques poissons
glissent dehors pendant que d'autres entrent.

### 🛶 La journée complète (palier 3) — trois surveillances

Tout à la fois : objectif 50 kg, chavirement à 70, 8 minutes, prise de 4 à
25 kg, `jeter(10)` disponible. `exige: ["while", "and", "if", "jeter"]`.

Trois endroits, trois rôles, et c'est ça qu'on vérifie : **ce qui arrête la
boucle va dans la question, ce qui évite la catastrophe va dans la boucle, ce
qui raconte va après.** Le bon programme allège au-delà de 44 kg, donc
44 + 25 = 69 : il ne chavire jamais. Huit coups donnent entre 32 et 200 kg,
donc les deux fins restent possibles — et le lac ne donne jamais deux fois la
même partie.

### Récapitulatif des champs ajoutés par les variantes

| Champ | Qui l'utilise | Effet |
|---|---|---|
| `depart_kg` | Le filet déjà plein | `poids` démarre à cette valeur au lieu de 0 |
| `coups_attendus` | Le filet déjà plein | À 0, le verdict se lit sur le nombre de coups |
| `fuite_kg` | La pirogue qui fuit | Active `fuite()`, qui rend cette valeur |

## 7. Une dernière chose, et elle est urgente

Un bloc `game` dont le `game_type` n'a pas de composant **rend la leçon
impossible à terminer** : `allBlocklyDone` exige que chaque bloc `game` soit
résolu ([QuestReader.tsx:212](../src/app/[locale]/eleve/quete/[lessonId]/QuestReader.tsx)),
et un type inconnu n'affiche rien — l'enfant voit « Termine les jeux
obligatoires » devant un écran vide, sans recours.

Deux lignes suffiraient à l'éviter pour toujours : un bloc de repli qui annonce
« ce jeu arrive bientôt » et qui compte comme résolu. Tant qu'il n'existe pas,
le contenu de la pirogue reste écrit mais non inséré.
