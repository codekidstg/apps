# Le lecteur de scènes — spécification

À transmettre à la session des fonctionnalités. Écrit par la session contenus ;
rien ici n'est implémenté côté applicatif.

**Le problème qu'il règle :** l'enfant écrit `while poids < 40` et reçoit des
lignes de texte dans une console noire. Rien de ce qu'il tape ne produit
d'objet. Le lecteur de scènes remplace cette console par un dessin que **son
propre programme fait bouger**.

Les trois décors sont déjà dessinés et jouables :

| Décor | Fichier | Notion | Démo |
|---|---|---|---|
| Le forage | `public/scenes/forage/forage.svg` | la boucle `while` | `docs/scenes/forage-demo.html` |
| L'étal du marché | `public/scenes/etal/etal.svg` | l'erreur non rattrapée, les chaînes | `docs/scenes/etal-demo.html` |
| Le cahier | `public/scenes/cahier/cahier.svg` | ce qui survit à la fermeture | `docs/scenes/cahier-demo.html` |

**Ouvrez les trois démos avant de lire la suite.** Elles montrent exactement le
résultat attendu, animations comprises. Ce sont des pages jetables : le code
JavaScript qu'elles contiennent est une maquette, pas un modèle d'architecture.

---

## 1. Ce que c'est, et surtout ce que ce n'est pas

**Ce n'est pas un nouveau type de bloc.** Pas de `game_type`, pas de composant
de jeu, pas de nouvelle table. C'est un `code_challenge` ordinaire — ceux qui
existent déjà en base — avec un champ de plus dans son `content`.

**Ce n'est pas un juge.** Les `hidden_tests` continuent de décider seuls de la
réussite, exactement comme aujourd'hui. La scène ne fait que *montrer*. Cette
séparation est délibérée : elle garantit que les cinq défis de code déjà écrits
pour « La boucle qui attend » continuent de fonctionner, avec ou sans scène.

**Le point d'accroche existe déjà.** `PythonRunner` accepte un
`rendreSortie?: (stdout: string, enMarche: boolean) => React.ReactNode`
(`src/components/editor/PythonRunner.tsx:32`, utilisé ligne 307) qui remplace
le bloc de sortie. `AtelierLibre` et `ProgrammePartage` s'en servent déjà. Le
lecteur de scènes se branche là.

## 2. Le contrat de contenu

Un champ `scene` dans le `content` d'un `code_challenge` :

```js
{
  type: "code_challenge",
  content: {
    language: "python",
    required: true,
    instructions: "…",
    starter_code: "…",
    hidden_tests: "…",        // le juge, inchangé
    scene: {
      decor: "forage",         // forage | etal | cahier
      prelude: "forage_v1",    // quel prélude Python injecter
      plafond: 200,            // appels avant arrêt, voir §8
      reglages: { contenance: 40, prise_min: 4, prise_max: 12 }
    }
  }
}
```

Sans `scene`, le défi se comporte comme aujourd'hui : console noire. C'est
**l'ajout d'un champ, pas une migration**.

Les `reglages` sont lus par le prélude, pas par le dessin : un même décor sert
plusieurs exercices avec des nombres différents.

## 3. Le prélude et le journal

C'est la mécanique neuve, et elle est réutilisable pour tout ce qui viendra
après. Le worker sait déjà faire le nécessaire : `RunCtx` accepte `prelude` et
`collect` (`src/workers/pyodide.worker.ts`).

Les fonctions du prélude **empilent des événements** dans `_journal`. Le
programme tourne jusqu'au bout, puis le lecteur rejoue le journal en animation.

```python
# prelude forage_v1
import json as _json
_journal = []
_appels = 0
poids = 0        # ou REGLAGES["depart_kg"] si l'exercice en donne un
minutes = 0

def _evt(d):
    global _appels
    _appels += 1
    if _appels > PLAFOND:
        raise RuntimeError(
            "Ton programme a fait " + str(PLAFOND) + " tours sans que rien "
            "n'avance. Qu'est-ce qui devrait changer, dans ta boucle ?")
    _journal.append(d)

def tirer():
    """Un coup de filet. Rend le poids remonte, en kg."""
    global minutes
    minutes = minutes + 1
    prise = _rnd.randint(PRISE_MIN, PRISE_MAX)
    _evt({"quoi": "verser", "litres": prise, "minutes": minutes})
    return prise

def jeter(kg):
    _evt({"quoi": "jeter", "kg": kg})
    return -kg
```

`collect: ["_journal", "poids", "minutes"]` suffit à tout reconstituer.

**Le plafond n'est pas une sécurité technique, c'est un bloc de cours.** Une
boucle sans fin finit sur une phrase en français au lieu d'un onglet gelé, et
la phrase pose la bonne question. Le bouton **■ Arrêter** existe déjà et tue le
worker (`PythonRunner.tsx:75`) : le plafond est la ceinture, le bouton la
bretelle.

## 4. Le composant

```
<Scene decor="forage" journal={journal} etatFinal={{poids, minutes}} enMarche={…} />
```

- Il charge `/scenes/<decor>/<decor>.svg` **inline** (pas en `<img>` : il faut
  pouvoir atteindre les identifiants) et le met en cache.
- Il résout les prises par `querySelector("#eau-niveau")` etc. Chaque fichier
  SVG **documente ses prises en tête** : lisez ce commentaire, il fait foi.
- Il déroule le journal événement par événement, avec un délai entre chacun.
- Il n'écrit jamais dans le SVG d'origine : une copie par instance.

## 5. Le piège du rejeu — à lire avant de coder

`input()` est implémenté par **rejeu complet du programme** à chaque réponse
(`pyodide.worker.ts`, commentaire en tête de `BOOTSTRAP`). Donc :

- un programme qui demande trois saisies est exécuté **trois fois**, et le
  journal arrive trois fois, de plus en plus long ;
- la graine de `random` est **retirée au hasard à chaque exécution**
  (`seed: Math.floor(Math.random() * 1_000_000)`), mais reste figée pendant les
  rejeux d'une même exécution. Les prises ne changent donc pas sous les pieds
  de l'enfant pendant qu'il tape.

**Conséquence pour le lecteur :** garder un index du dernier événement animé et
n'animer que le delta. Rejouer le journal entier à chaque saisie ferait
recommencer l'animation depuis le début, à chaque fois.

Et une demande, pas bloquante : pouvoir passer une graine fixe par exercice,
pour qu'un mentor voie exactement la partie de l'enfant.

## 6. Les trois décors et leurs événements

### Le forage — `decor: "forage"`

| Événement | Ce que le lecteur fait |
|---|---|
| `verser` | `#seau` glisse jusqu'au goulot et bascule · `#filet-eau` apparaît · `#eau-niveau` monte de `3 × litres` px (intérieur de y=244 à y=124, coordonnées locales de `#bidon-pose`) · `#eau-surface` suit et ondule |
| `jeter` | le niveau redescend, deux gouttes tombent |
| poids > contenance | `#debordement` à 1, `#flaque` à 0.55 |
| plafond atteint | `#bidon-corps` tremble de ±1,5 px, message du prélude |

### L'étal du marché — `decor: "etal"`

| Événement | Ce que le lecteur fait |
|---|---|
| `tendre` | `#papier-texte` reçoit ce que le client a écrit, `#papier` vole vers le comptoir |
| `encaisser` | `#tiroir` rebondit · `#billet-N` apparaît · `#total-texte` monte · `#file` avance de 58 px |
| `refuser` | `#tampon-refus` se pose, le client repart, la caisse ne bouge pas |
| **erreur non rattrapée** | `#ampoule` et `#halo` clignotent deux fois puis s'éteignent · `#pales` ralentissent · `#nuit` à 0.92 · les clients restants s'effacent · `#total-texte` se fige |

La dernière ligne est **le cœur de la séance 3** : une erreur non rattrapée
n'arrête pas la ligne, elle éteint tout ce qui vient après. Le verdict doit dire
combien de clients sont repartis et combien de francs sont perdus.

### Le cahier — `decor: "cahier"`

| Événement | Ce que le lecteur fait |
|---|---|
| `ajouter` | `#note-N` apparaît sur la table |
| `noter` | `#plume` passe, `#ligne-N` s'écrit dans le `#cahier` |
| `relire` | les notes reviennent du cahier sur la table |
| `fermer` | `#ciel-nuit` et `#nuit` montent, `#lampe-allumee` et `#lueur-lampe` s'allument, **les notes restées en mémoire s'envolent par la fenêtre** |
| `noter` sur une mémoire vide | les `#ligne-N` s'effacent toutes — **le piège du mode `"w"`** |

## 7. L'avatar de l'enfant

Chaque décor contient un groupe `#avatar-fente` avec un **gabarit gris de
120 × 140** — exactement le `viewBox` de `AvatarSvg`
(`src/components/eleve/AvatarSvg.tsx`). Le lecteur retire `#avatar-temoin` et
injecte l'avatar de l'élève avec ses `base`, `hat`, `accessory`, `color` et
`accent` lus dans `student_avatar`.

C'est **son** robot qui porte le seau, tient l'étal et ferme le cahier. La
donnée existe déjà, trois enfants en ont un.

## 8. Les trois contraintes non négociables

**Hors-ligne.** Les trois SVG pèsent 31 Ko en tout, aucune image, aucun script.
Ajouter `/scenes/**` au précache du service worker (`public/sw.js`,
`SwRegistrar`) et c'est réglé pour toujours.

**Mouvement réduit.** Sous `prefers-reduced-motion`, le lecteur applique l'état
**final** du journal sans animer. La scène reste informative, elle ne saute pas.

**Tablette en plein jour.** Les décors sont dessinés au trait épais et en
couleurs pleines pour ça. Ne pas les afficher sous 280 px de large : en dessous,
mettre la scène au-dessus de l'éditeur plutôt qu'à côté.

## 9. Ce que ça remplace dans ce qui existe

**`docs/jeu-pirogue.md` est caduc sur un point central** : il spécifiait un
`game_type: "pirogue"`, c'est-à-dire un bloc de jeu séparé avec son propre
moteur et son propre jugement. Le forage le remplace, en mieux : un
`code_challenge` ordinaire avec une scène.

Ce qui reste valable dans ce document : la mécanique journal → rejeu (§1), le
plafond d'appels, et les paliers pédagogiques. Ce qui tombe : le `game_type`, le
jugement par le moteur, et le `content` de la §5.

Conséquence côté contenus, et c'est à moi de la traiter : les trois paliers de
pirogue de la séance et les trois variantes de salle de jeu doivent être
réécrits en `code_challenge`. Ils ne sont pas en base — ils attendaient
justement ce moteur — donc rien n'est à migrer.

## 10. Le partage des tâches

**Vous livrez** le composant `Scene`, le branchement dans `PythonRunner` via
`rendreSortie`, les préludes Python des trois décors, l'injection de l'avatar,
et le précache du service worker.

**Je livre** les dessins, leurs prises documentées, les réglages de chaque
exercice, et le contenu qui va avec.

**Une demande, enfin, et elle est indépendante :** un bloc de repli pour un
`game_type` inconnu, qui annonce « ce jeu arrive bientôt » et compte comme
résolu. Aujourd'hui, un bloc `game` sans composant rend la leçon **impossible à
terminer** (`allBlocklyDone`, `QuestReader.tsx:213`) : l'enfant voit « Termine
les jeux obligatoires » devant un écran vide, sans recours. Deux lignes, et ce
piège disparaît pour toujours.
