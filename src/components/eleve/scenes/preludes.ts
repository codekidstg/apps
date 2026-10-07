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

  return (
    COMPTEUR(plafond, "Qu'est-ce qui devrait changer, dans ta boucle ?") +
    `
_cahier = []

def ajouter(notes, texte):
    """Pose une note sur la table — en memoire."""
    notes.append(texte)
    _evt({"quoi": "ajouter", "texte": str(texte)})
    return notes

def ecrire_cahier(notes):
    """Recopie la memoire dans le cahier. Ce qui etait ecrit avant est perdu."""
    global _cahier
    _cahier = list(notes)
    _evt({"quoi": "noter", "lignes": list(_cahier)})

def lire_cahier():
    """Rend ce que le cahier a garde."""
    _evt({"quoi": "relire", "lignes": list(_cahier)})
    return list(_cahier)

def fermer():
    """La nuit tombe : ce qui n'est pas dans le cahier s'envole."""
    _evt({"quoi": "fermer"})
`);
}

/** Ce que le lecteur rapatrie après l'exécution. Le journal d'abord. */
export const COLLECTE: Record<Decor, string[]> = {
  forage: ["_journal", "poids", "minutes"],
  etal: ["_journal"],
  cahier: ["_journal", "_cahier"],
};
