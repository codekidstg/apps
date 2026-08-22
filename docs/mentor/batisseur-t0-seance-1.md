# Guide mentor — Bâtisseur · T0 · Séance 1
## « Mon premier programme »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif de la séance :** l'enfant lance un programme et lit un message d'erreur sans paniquer.
> Ce n'est pas `print` le sujet. C'est l'erreur.

---

## Avant d'arriver

- Prévenir le parent qu'il faut du **Wi-Fi** pour la première séance (~6 Mo à télécharger une seule fois).
- Vérifier que l'enfant a un compte et qu'il est connecté **avant** de commencer.

---

## Déroulé

### 0–5 min · Installation
Ouvrir la séance et **lancer le premier programme tout de suite**, avant même de parler.
Les 6 Mo se téléchargent pendant que vous faites connaissance. Ne jamais laisser
l'enfant devant un écran figé à son tout premier contact.

### 5–13 min · L'accroche, sans écran
Fermez l'écran. Dites-lui : *« Explique-moi comment me servir un verre d'eau. Je fais
exactement ce que tu dis, rien d'autre. »*

Puis exécutez **littéralement** : « prends le verre » → vous le prenez par en dessous,
à l'envers. « verse l'eau » → vous versez à côté. Il rit, il corrige, il précise.

**Le point à faire passer, une seule phrase :** la machine ne devine rien, elle obéit bêtement.
Ne théorisez pas au-delà.

### 13–20 min · Il lance le programme qui lui parle
Il appuie sur Exécuter. La machine lui demande son prénom. Il tape. Elle lui répond.

**Laissez ce moment respirer.** Ne commentez pas tout de suite. C'est de ça qu'il parlera
à table ce soir.

Puis : *« Tu vas comprendre ces lignes, et à la fin de l'heure elles seront à toi. »*

Faites-lui **changer les phrases** — pas la structure. Le programme devient le sien.

> ⚠️ La ligne `prenom = input(...)` n'est **pas** au programme aujourd'hui. S'il pose la
> question : « c'est la séance prochaine ». Ne l'expliquez pas — vous perdriez 10 minutes
> et il ne retiendrait rien.

### 20–35 min · On casse exprès
**Vous** lui demandez d'enlever un guillemet. C'est important que ce soit vous : l'erreur
devient une expérience, pas une faute.

Lancez. C'est rouge. Lisez le message **ensemble**, à voix haute :
- quelle ligne ?
- quel mot avant les deux-points ?

Réparez. Relancez. Ça remarche.

Recommencez avec `primt` au lieu de `print` → autre message, autre nom.

**Deux erreurs, pas plus :** `SyntaxError` et `NameError`. Pas l'indentation, il n'y a pas
encore de bloc indenté.

### 35–55 min · Le cabinet de réparation
Trois programmes cassés, il travaille **seul**. Vous observez.

**N'intervenez que s'il le demande.** S'il bloque plus d'une minute, une seule question :
*« Qu'est-ce que le message te dit ? »* — jamais la réponse.

### 55–62 min · `print` et les virgules
Court. Montrez `print("J'ai", 14, "ans")`. Faites-lui remarquer que Python ajoute
les espaces tout seul.

### 62–65 min · Récap et défi
Demandez-lui **oralement** : *« Qu'est-ce que tu sais faire maintenant que tu ne savais pas
en arrivant ? »* Laissez-le répondre avec ses mots.

Montrez-lui son entraînement dans **Mon Entraînement** : « Ta carte de visite parlante ».
Dites-lui de la montrer à ses parents.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il écrit dans la console au lieu de l'éditeur | Rappelez les deux zones. Très fréquent la première séance |
| Il oublie les guillemets autour du texte | Laissez-le lancer. L'erreur enseignera mieux que vous |
| Il met une majuscule : `Print` | Idem — laissez le `NameError` parler |
| Il a peur du rouge | *« Regarde, moi aussi j'en ai des dizaines par jour. »* Montrez-en une des vôtres si vous pouvez |
| Il veut aller plus loin, s'ennuie | Faites-lui écrire un dialogue plus long, ou inventer un bug pour **vous** |

---

## À ne pas faire

- **Ne pas expliquer les variables.** C'est la séance 2, et l'anticipation est un moteur.
- **Ne pas corriger à sa place.** S'il ne répare pas lui-même au moins un bug, l'objectif de
  la séance est manqué, même si tout le reste s'est bien passé.
- **Ne pas ajouter de notion** parce que « ça va vite ». S'il finit en avance, il approfondit,
  il n'avance pas.

---

## Réussite de la séance

Il a réparé **au moins un** des trois programmes du cabinet **sans aide**.

C'est le seul critère. Le reste — `print`, les virgules, le défi final — est du bonus.
