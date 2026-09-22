/**
 * Rapports de séance — les libellés, et rien d'autre.
 *
 * Séparés du chargement (lib/rapports.ts, qui ouvre la base) : le formulaire
 * du mentor et sa liste tournent dans le navigateur et ne peuvent pas lire un
 * module serveur. C'est pour cela qu'ils en gardaient leur propre copie, avec
 * le risque de divergence que ces copies portent toujours.
 */

export const AVANCEMENT: Record<string, { icon: string; label: string; color: string }> = {
  completed: { icon: "✅", label: "A terminé la séance prévue",               color: "#10b981" },
  partial:   { icon: "⏩", label: "A avancé mais pas fini",                   color: "#f59e0b" },
  reviewed:  { icon: "🔁", label: "A revu / consolidé une séance précédente", color: "#6366f1" },
  blocked:   { icon: "⚠️", label: "N'a pas pu avancer (blocage)",             color: "#ef4444" },
};

export const ENGAGEMENT: Record<string, { icon: string; label: string }> = {
  motivated:  { icon: "🚀", label: "Très motivé, curieux" },
  focused:    { icon: "😊", label: "Bien concentré" },
  distracted: { icon: "😐", label: "Distrait mais participait" },
  disengaged: { icon: "😔", label: "Démotivé ou difficile à engager" },
};

export const AIDES: Record<string, string> = {
  example:       "Réexplication avec un exemple concret",
  drawing:       "Dessin / schéma au tableau",
  unplugged:     "« Joue le rôle de la machine » (débranché)",
  encouragement: "Encouragement / patience",
  simplified:    "Simplifié l'exercice",
  other:         "Autre",
};

/**
 * Pourquoi une séance n'a pas eu lieu.
 *
 * `duMentor` : la séance reste à sa charge dans son suivi. Les autres raisons
 * ne dépendent pas de lui et sortent du décompte — mais restent affichées.
 */
export const NON_TENUE: Record<string, { icon: string; label: string; duMentor: boolean }> = {
  enfant_absent:  { icon: "🙍",  label: "L'élève était absent",             duMentor: false },
  coupure:        { icon: "🔌",  label: "Coupure de courant ou d'internet", duMentor: false },
  mentor_empeche: { icon: "🧑‍🏫", label: "Le mentor était empêché",          duMentor: true },
  conges:         { icon: "🏖️",  label: "Congés ou école fermée",           duMentor: false },
};
