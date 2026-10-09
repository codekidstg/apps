/**
 * Les préludes des scènes : le Python qui tourne AVANT le code de l'enfant.
 *
 * Chacun définit les commandes du décor — `tirer()`, `encaisser()`, `noter()` —
 * et le journal qu'elles remplissent. Le lecteur rejoue ensuite ce journal en
 * animation (voir `Scene.tsx` et `docs/lecteur-de-scenes.md`).
 *
 * Deux règles tiennent tout :
 *
 * 1. Le prélude est rejoué à chaque saisie, puisque `input()` relance le
 *    programme depuis le début. Il doit donc repartir d'un état propre — c'est
 *    le cas : tout y est réinitialisé.
 * 2. Chaque commande compte ses appels et s'arrête au plafond, avec une phrase
 *    en français. Une boucle sans fin finit en leçon, jamais en onglet gelé.
 */

export type Decor = "forage" | "etal" | "cahier";

export type SceneConfig = {
  decor: Decor;
  /** Les nombres de l'exercice. Lus par le prélude, pas par le dessin. */
  reglages?: Record<string, number | string | string[]>;
  /** Appels de commande avant arrêt. 200 par défaut. */
  plafond?: number;
};

const py = (v: unknown): string => JSON.stringify(v ?? null);

/** Le garde-fou commun : il est le même pour les trois décors. */
const COMPTEUR = (plafond: number, question: string) => `
_journal = []
_appels = 0

def _evt(d):
    global _appels
    _appels = _appels + 1
    if _appels > ${plafond}:
        raise RuntimeError(${py(`Ton programme a fait ${plafond} tours sans que rien n'avance. ${question}`)})
    _journal.append(d)
`;

export function preludeDe({ decor, reglages = {}, plafond = 200 }: SceneConfig): string {
  const r = reglages as Record<string, number & string>;

  if (decor === "forage") {
    const min = Number(r.prise_min ?? 4), max = Number(r.prise_max ?? 12);
    return (
      COMPTEUR(plafond, "Qu'est-ce qui devrait changer, dans ta boucle ?") +
      `
poids = ${Number(r.depart_kg ?? 0)}
minutes = 0

def tirer():
    """Un coup de filet. Rend ce qui remonte, en kilos."""
    global minutes
    minutes = minutes + 1
    prise = ${min === max ? min : `_rnd.randint(${min}, ${max})`}
    _evt({"quoi": "verser", "litres": prise, "minutes": minutes})
    return prise

def jeter(kg):
    """Rejette des kilos a l'eau pour alleger."""
    _evt({"quoi": "jeter", "kg": kg})
    return -kg
`);
  }

  if (decor === "etal") {
    const papiers = (reglages.papiers as string[]) ?? ["2000", "1 500", "deux mille", "800"];
    return (
      COMPTEUR(plafond, "Qu'est-ce qui devrait avancer, dans ta boucle ?") +
      `
papiers = ${py(papiers)}

def encaisser(papier):
    """Le tiroir s'ouvre, le billet rejoint la pile."""
    _evt({"quoi": "encaisser", "papier": str(papier)})

def refuser(papier):
    """Le client repart poliment, la caisse ne bouge pas."""
    _evt({"quoi": "refuser", "papier": str(papier)})
`);
  }

  // ── Le cahier ─────────────────────────────────────────────────────────
  // L'enfant écrit de VRAIS fichiers : open, write, close, read. Vérifié dans
  // le navigateur — ils marchent, ils survivent d'une exécution à l'autre, et
  // sans close() le fichier reste vide.
  //
  // Le prélude n'invente donc aucune commande : il enveloppe `open` pour que
  // la scène sache ce qui se passe. Le `class` ci-dessous ne sort jamais du
  // prélude : l'enfant ne le voit pas, et il n'est pas dans sa liste de mots.
  return (
    COMPTEUR(plafond, "Qu'est-ce qui devrait changer, dans ta boucle ?") +
    `
import builtins as _b
_vrai_open = _b.open   # le VRAI open, pas le wrapper de l'execution precedente
notes = []

class _Cahier:
    def __init__(self, f):
        self._f = f
    def write(self, texte):
        _evt({"quoi": "noter", "texte": str(texte)})
        return self._f.write(texte)
    def read(self):
        contenu = self._f.read()
        _evt({"quoi": "relire", "texte": contenu})
        return contenu
    def close(self):
        return self._f.close()

def open(nom, mode="r"):
    """Le vrai open de Python. La scene regarde par-dessus l'epaule."""
    if "w" in mode:
        _evt({"quoi": "effacer"})
    return _Cahier(_vrai_open(nom, mode))

def ajouter(texte):
    """Pose une note sur la table — en memoire, donc fragile."""
    notes.append(texte)
    _evt({"quoi": "ajouter", "texte": str(texte)})
    return notes

def fermer():
    """La nuit tombe : ce qui n'est pas dans le cahier s'envole."""
    _evt({"quoi": "fermer"})

# L'état de départ du cahier, posé AVANT le code de l'enfant.
#
# Sans ça, un exercice qui commence par « le cahier contient les notes d'hier »
# ne tenait que si l'enfant venait d'en écrire un dans la même page : un
# rechargement, ou les blocs faits dans le désordre, et il tombait sur une
# erreur rouge pour une notion pas encore enseignée. Chaque exercice part
# maintenant du même état, toujours.
import os as _os
if _os.path.exists("carnet.txt"):
    _os.remove("carnet.txt")
_depart = ${JSON.stringify((reglages.cahier_depart as string[]) ?? [])}
if _depart:
    _f0 = _vrai_open("carnet.txt", "w")
    for _l in _depart:
        _f0.write(_l + "\\n")
    _f0.close()
`);
}

/** Ce que le lecteur rapatrie après l'exécution. Le journal d'abord. */
export const COLLECTE: Record<Decor, string[]> = {
  forage: ["_journal", "poids", "minutes"],
  etal: ["_journal"],
  cahier: ["_journal", "notes"],
};
