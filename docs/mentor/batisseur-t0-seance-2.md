# Guide mentor — Bâtisseur · T0 · Séance 2
## « Garder une information »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** ranger une information dans une variable, la réutiliser, et savoir si
> c'est du texte ou un nombre.
>
> Le vrai sujet de l'heure, c'est **le piège de `input`** : il rend toujours du texte.

---

## Avant d'arriver

Ouvrez son espace et regardez s'il a fait **Le grand chantier** de la semaine. C'est le
meilleur indicateur de ce qu'il a gardé de la séance 1. S'il ne l'a pas fait, ne le
reprochez pas — faites-le avec lui pendant la phase de reprise.

---

## Déroulé

### 0–5 min · Installation et reprise
Lancez Python tout de suite. Pendant le chargement, reprenez **Le grand chantier** :
combien de bugs a-t-il trouvés seul ?

### 5–12 min · L'accroche : la machine calcule sur lui
Il lance le programme fourni. Il tape son année de naissance. La machine lui annonce
son âge, l'âge qu'il aura en 2050, et **le nombre de jours qu'il a vécus**.

**Laissez ce moment respirer.** Le chiffre des jours frappe toujours.

Puis rappelez la promesse de la semaine dernière : *« Tu te souviens de la ligne que tu
ne comprenais pas ? On l'ouvre aujourd'hui. »*

### 12–25 min · La variable
Une boîte, une étiquette, une valeur dedans.

**Le point le plus important de l'heure :** le `=` de Python n'est pas celui des maths.
Il ne compare pas, il **range**. La flèche va de droite à gauche.

C'est ce qui rend `age = age + 1` normal alors qu'en maths c'est absurde. Prenez le temps
sur cette ligne — si elle passe, tout le reste de l'année passe.

### 25–35 min · Texte ou nombre
Pour lui, `12` et `"12"` se ressemblent. Pour Python, non.

Faites-lui deviner `"2" + "3"` avant de le lancer. La réponse `"23"` surprend toujours,
et c'est cette surprise qui ancre la notion.

### 35–50 min · On casse exprès, puis on répare
Faites-lui **retirer le `int(annee)`** de l'accroche. Ça plante avec un `TypeError`,
et l'indice en français s'affiche sous le message.

Puis l'atelier de réparation : deux bugs, un de type et un de nom. Il travaille seul,
vous observez. Une seule question autorisée si ça bloque : *« Qu'est-ce que le message
te dit ? »*

### 50–62 min · Sa machine à calculer
Il écrit un programme qui demande un nombre et affiche son double, son triple et son
carré. S'il va vite, le **convertisseur FCFA en bonus** l'attend.

### 62–65 min · Récap et semaine
*« Qu'est-ce qu'une variable, avec tes mots ? »*

Puis montrez-lui ses quatre entraînements.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il lit `age = 12` comme « age égale 12 » | Reformulez systématiquement : « range 12 dans age ». Répétez-le toute la séance |
| Il écrit `print("age")` au lieu de `print(age)` | Laissez-le lancer : il verra le mot s'afficher au lieu de la valeur. Bien plus efficace qu'une explication |
| Il oublie `int(...)` après un `input` | C'est l'erreur du jour, elle est normale. L'indice français lui suffit souvent |
| Il croit que `b = a` lie les deux boîtes pour toujours | Cas traité dans l'entraînement 1. Si la question vient : ce sont deux boîtes, `b` reçoit une copie |
| Il nomme ses variables `a`, `b`, `x` | Encouragez les vrais noms : `age`, `prix`, `prenom`. Ça se joue maintenant, pas dans six mois |

---

## À ne pas faire

- **Ne pas parler de `float`, de `str()`, ni des types en général.** Deux familles
  suffisent aujourd'hui : texte et nombre.
- **Ne pas expliquer les conditions.** C'est la séance 3, et l'attente est un moteur.
- **Ne pas corriger le `TypeError` à sa place.** C'est l'erreur qu'il rencontrera le plus
  souvent cette année : il doit apprendre à la reconnaître seul.

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Dans quelle boîte ?** — suivre une variable qui change | 5 min |
| Milieu de semaine | **Texte ou nombre ?** — ranger six valeurs dans deux bacs | 6 min |
| Fin de semaine | **Ça calcule ou ça colle ?** — le `+` et ses deux métiers | 7 min |
| Veille de la séance 3 | **La calculette cassée** — convertisseur FCFA, deux bugs | 12 min |

---

## Réussite de la séance

Il a réparé le `TypeError` **sans qu'on lui dise que c'était un problème de type**.

C'est le seul critère. S'il sort de l'heure en sachant que `input` rend du texte, la
séance est gagnée — même si le reste a été approximatif.
