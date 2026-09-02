# Guide mentor — Bâtisseur · T1 · Séance 7
## « Mes propres commandes »

**Créneau 1h15 · 65 min planifiées · cours particulier à domicile**

> **Objectif :** donner un nom à un morceau de programme, l'appeler, lui passer un
> réglage.
>
> Elle encaisse la frustration semée par « Trois fois la même politesse ».

---

## Avant de vous asseoir — vérifiez le son

**Cette séance repose sur l'audio deux fois.** Testez les haut-parleurs ou le casque
avant de commencer, pas au milieu du premier jeu.

Le jeu reste jouable sans son : le clavier s'allume note par note et le verdict est
écrit. Mais la récompense de la séance, c'est d'**entendre** le refrain changer trois
fois d'un coup. Si le son est impossible aujourd'hui : **inversez l'ordre** — faites le
bulletin d'abord, gardez les deux jeux pour la fin, quitte à en reporter un. Ne
découvrez pas le problème à la douzième minute.

Regardez aussi s'il a fait **Trois fois la même politesse**. Toute la séance s'ouvre
et se referme dessus.

---

## Déroulé

### 0–3 min · Une question, pas un discours
Ouvrez sur son bulletin de la veille. **Une seule question :**

> *« Si tu voulais des tirets au lieu des signes égal, tu changerais combien
> d'endroits ? »*

Il répond « trois ». Vous ne commentez pas. Vous passez au jeu. On y reviendra à la
cinquante-deuxième minute, et la réponse aura changé.

### 3–15 min · Le refrain, trois fois recopié
Une chanson : trois couplets, le même refrain entre chacun. Faites-la écouter telle
quelle.

Puis le jeu demande d'**ajouter un `silence()` juste avant chaque annonce de refrain**.
Trois endroits. Laissez-le les faire à la main — c'est le but.

**Attention à ce qu'il va tenter.** Il vient de passer une semaine sur les listes : il
peut essayer de tout rassembler dans une grande liste. Ça ne marchera pas, et c'est
voulu — le bloc du refrain contient un `print`, une boucle et un `silence()`, trois
choses de natures différentes. **Une liste range des valeurs ; elle ne range pas un
morceau de programme.** Si l'idée lui vient, félicitez-la, puis montrez pourquoi elle
échoue ici. C'est le meilleur moment de la séance.

### 15–30 min · La notion
Trois temps, dans cet ordre — et le premier compte autant que les deux autres :

**« Tu en utilises depuis six semaines. »** `print`, `int`, `input`, `range`, `len`,
`jouer`, `append` — un nom, des parenthèses, parfois quelque chose dedans. **Ça
s'appelle une fonction, et personne ne le lui a jamais dit.** Prenez deux bonnes
minutes là-dessus. Il ne découvre pas un objet nouveau, il apprend le nom de ce qu'il
manipule depuis son premier programme, et il passe de l'autre côté.

**`def`, et le décalage.** Deux-points, puis décalage : quatrième fois qu'il voit cette
règle après le `if`, le `for` et la boucle imbriquée. Dites-le, ça rassure.

**Définir n'est pas exécuter.** Le piège numéro un. Ne l'énoncez pas — faites-le voir.
Le programme du cours affiche **A · C · B · D**. Le `B` arrive en troisième. Demandez-lui
de prédire la sortie *avant* de lancer, puis de lancer. C'est la septième fois qu'il
utilise la trace : c'est devenu son réflexe, et c'est exactement ce qu'on voulait.

### 30–40 min · Une fois écrit, changé partout
Il écrit `def joue_refrain():` et l'appelle trois fois. Puis le jeu demande un silence
de plus à la fin du refrain — **à un seul endroit**.

**Après sa réussite, demandez-lui une chose de plus :** changer une note du refrain, et
réécouter. Les trois refrains changent ensemble. C'est la propriété que ni la liste, ni
la boucle, ni rien d'autre ne donne. Ne sautez pas ce geste, il vaut dix minutes
d'explication.

### 40–52 min · Le paramètre
**La partie à risque.** Reliez-la immédiatement au connu : `print("Salut")` a toujours
eu quelque chose entre les parenthèses. Il sait déjà s'en servir ; il apprend à en
écrire.

Le point qui accroche : dans `cadre("MES NOTES")`, le texte s'appelle `"MES NOTES"`
dehors et `titre` dedans. **Deux noms, une seule chose** — comme `note` dans la boucle
de la semaine dernière, qui recevait tour à tour chaque valeur.

### 52–62 min · Le bulletin, la revanche
Retour à la question du début. Trois endroits sont devenus un.

**Laissez-le seul le plus longtemps possible.**

### 62–65 min · Récap et semaine

---

## Plan B — si le paramètre n'est pas passé à 52 minutes

**N'enchaînez pas sur le bulletin.** Un défi de synthèse bâclé ne vaut rien, et il
repartirait avec deux notions à moitié.

Faites plutôt :

1. Terminez proprement `def cadre(titre)` du cours — la fonction écrite et appelée
   deux fois, rien de plus.
2. Sautez le bulletin. Il devient un entraînement de la semaine.
3. Gardez les cinq dernières minutes pour le récap.

Mieux vaut une notion tenue qu'un défi survolé. Si vous utilisez ce plan B, dites-le —
c'est la première fois qu'un guide en porte un, et je veux savoir s'il sert.

---

## Si vous avez de l'avance

À ne sortir que si les 65 minutes sont bouclées en 50 :

- **Deux réglages** — `def cadre(titre, symbole)` pour choisir le caractère du cadre.
  C'est un pas de plus, pas une notion neuve.
- **Le refrain qui s'annonce** — faire afficher « refrain numéro 1, 2, 3 » sans
  compteur global, juste pour le voir échouer et en parler.

---

## Les erreurs que vous allez voir

| Ce qu'il fait | Ce que vous dites |
|---|---|
| Il écrit `def` et rien ne se passe | « Tu l'as rangée dans un tiroir. Qui l'ouvre ? » |
| Il écrit `salut` sans parenthèses | Aucune erreur, aucun effet. Laissez-le chercher — c'est le bug de la séance |
| Il appelle la fonction avant de l'avoir définie | `NameError`. Python lit de haut en bas |
| Il décale l'appel dans la boucle | Le refrain revient quatre fois. Ça s'entend |
| Il oublie le décalage du corps | `IndentationError` — la même règle que le `if` et le `for` |
| Il confond `titre` et `"MES NOTES"` | « Le même objet, vu du dehors et du dedans » |
| Il essaie de tout mettre dans une liste | Excellent réflexe, mauvais outil. Montrez pourquoi `print` et `silence()` n'y rentrent pas |
| Il modifie une variable dans la fonction et ça ne marche pas | **N'expliquez pas la portée.** « On verra ça plus tard » et contournez |

---

## À ne pas faire

- **Ne pas enseigner `return`.** C'est toute la séance 8, et le dernier entraînement de
  la semaine est construit pour en creuser le manque.
- **Ne pas expliquer variables locales et globales.** La question va se poser. Un enfant
  de 14 ans n'a pas besoin d'une théorie de la portée aujourd'hui — il a besoin que sa
  fonction marche. Contournez et notez-le pour plus tard.
- **Ne pas donner deux paramètres** dans le cours. C'est dans « si vous avez de
  l'avance », pas dans le tronc.
- **Ne pas résoudre le bulletin à sa place.** S'il bloque, ramenez-le à la fonction
  `cadre` qu'il vient d'écrire.

---

## Les entraînements de la semaine

| Quand | Exercice | Durée |
|---|---|---|
| Lendemain | **Définir ou appeler ?** — deux gestes, et le piège des parenthèses | 6 min |
| Milieu de semaine | **Le cadre qui sert partout** — une fonction, quatre appels | 10 min |
| Fin de semaine | **🎹 Ta chanson avec refrain** — il compose, le refrain dans une fonction | 12 min |
| Veille de la séance 8 | **La fonction qui ne répond pas** — pénible exprès | 12 min |

Le dernier mérite un mot. Il écrit `affiche_total(prix)` qui affiche le total d'un
panier, et l'appelle sur deux paniers. Ça marche. Puis on lui demande **lequel est le
plus cher** — et il ne peut pas le faire dire au programme : sa fonction affiche le
nombre, elle ne le lui **rend** pas. Le total part à l'écran et disparaît.

C'est exactement le trou que `return` comblera la semaine suivante. **Ne le lui soufflez
pas s'il vous appelle** : le manque doit rester entier jusqu'à la séance 8.

---

## Réussite de la séance

Il a écrit une fonction, l'a appelée plusieurs fois, et a **modifié le bloc à un seul
endroit** pour changer tous les appels.

C'est le seul critère. Le paramètre est un bonus considérable — mais la fonction sans
paramètre suffit à valider la séance.
