/**
 * Repérer l'aspiration du catalogue.
 *
 * Un mentor qui prépare sa séance ouvre deux ou trois leçons. Celui qui en
 * ouvre quarante en vingt minutes ne prépare rien — il recopie. La différence
 * ne se devine pas : elle se compte.
 *
 * Le seuil est volontairement large. Mieux vaut rater un cas limite que de
 * réveiller la direction chaque fois qu'un mentor consciencieux relit son
 * thème : une alerte qui crie pour rien est une alerte qu'on finit par ne plus
 * lire.
 */

export const FENETRE_MINUTES = 30;
export const SEUIL_LECONS = 15;
/** On ne remonte pas plus loin : au-delà, ce n'est plus une alerte, c'est une archive. */
export const JOURS_SURVEILLES = 7;

export type Consultation = { lesson_id: string; consulte_le: string };

export type Pic = {
  /** Combien de leçons différentes dans la fenêtre la plus chargée. */
  lecons: number;
  /** Quand cette fenêtre a commencé. */
  debut: string;
};

/**
 * La fenêtre la plus chargée, par glissement.
 *
 * On avance sur les consultations triées, en gardant une fenêtre de trente
 * minutes derrière soi, et on retient le moment où elle contenait le plus de
 * leçons *différentes* — rouvrir dix fois la même leçon, c'est travailler.
 */
export function picDeConsultation(consultations: Consultation[]): Pic | null {
  const triees = [...consultations]
    .map((c) => ({ ...c, t: new Date(c.consulte_le).getTime() }))
    .filter((c) => Number.isFinite(c.t))
    .sort((a, b) => a.t - b.t);
  if (triees.length === 0) return null;

  const fenetre = FENETRE_MINUTES * 60 * 1000;
  let debut = 0;
  let pic: Pic | null = null;

  for (let fin = 0; fin < triees.length; fin++) {
    while (triees[fin].t - triees[debut].t > fenetre) debut++;
    const distinctes = new Set(triees.slice(debut, fin + 1).map((c) => c.lesson_id)).size;
    if (!pic || distinctes > pic.lecons) {
      pic = { lecons: distinctes, debut: new Date(triees[debut].t).toISOString() };
    }
  }
  return pic;
}

export function estUneAspiration(pic: Pic | null): boolean {
  return pic !== null && pic.lecons > SEUIL_LECONS;
}
