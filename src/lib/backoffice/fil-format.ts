/**
 * Les types du fil et sa mise en forme — sans accès à la base.
 *
 * Séparé de `fil-eleve.ts` parce que le tableau des élèves est un composant
 * client : il lui faut les dates lisibles et la phrase de résumé, jamais le
 * client Supabase de service qui vit dans l'autre fichier.
 */

export type Evenement =
  | { type: "lecon";    quand: string; titre: string }
  | { type: "exercice"; quand: string; titre: string; lecon: string | null; terrain: boolean;
      essais: number; score: number | null; secondes: number | null; sansIndice: boolean }
  | { type: "ouvert";   quand: string; titre: string; lecon: string | null; terrain: boolean };

export type Fil = {
  evenements: Evenement[];
  /** Le plus récent des trois, quel qu'en soit le genre. */
  dernierPassage: string | null;
  derniereLecon: { titre: string; quand: string } | null;
  /** La leçon ouverte et pas finie, avec ses exercices de parcours faits. */
  enCours: { titre: string; faits: number; total: number } | null;
};

export const FIL_VIDE: Fil = { evenements: [], dernierPassage: null, derniereLecon: null, enCours: null };

const JOUR = 86_400_000;
/** Tout est lu à l'heure du Togo : c'est celle des enfants et celle de Roland. */
const FUSEAU = "Africa/Lome";

/** « aujourd'hui · 13h31 », « hier », « lun. 22 sept. » — la date qu'on lit sans compter. */
export function quandLisible(iso: string, maintenant: number) {
  const d = new Date(iso);
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU }).replace(":", "h");
  const jourDe = (t: number) => new Date(t).toLocaleDateString("fr-CA", { timeZone: FUSEAU });
  const j = jourDe(d.getTime());
  if (j === jourDe(maintenant))        return { jour: "aujourd'hui", heure, frais: true };
  if (j === jourDe(maintenant - JOUR)) return { jour: "hier", heure, frais: true };
  return {
    jour: d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short", timeZone: FUSEAU }),
    heure,
    frais: false,
  };
}

/** La phrase de tête : ce qu'on lit en deux secondes, sans dérouler le fil. */
export function resumeDuFil(fil: Fil, maintenant = Date.now()): string {
  if (!fil.dernierPassage) return "Aucun passage enregistré pour l'instant.";
  const bouts = [`Dernier passage ${quandLisible(fil.dernierPassage, maintenant).jour}`];
  if (fil.derniereLecon) {
    bouts.push(`a terminé « ${fil.derniereLecon.titre} » ${quandLisible(fil.derniereLecon.quand, maintenant).jour}`);
  }
  if (fil.enCours) {
    bouts.push(fil.enCours.total > 0
      ? `en est à ${fil.enCours.faits} exercice${fil.enCours.faits > 1 ? "s" : ""} sur ${fil.enCours.total} de « ${fil.enCours.titre} »`
      : `a ouvert « ${fil.enCours.titre} »`);
  }
  // « sam. 26 sept. » finit déjà par un point : ne pas en ajouter un second.
  const phrase = bouts.join(" · ");
  return phrase.endsWith(".") ? phrase : phrase + ".";
}
