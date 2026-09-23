/**
 * Les séances déjà passées — les récurrentes déroulées semaine par semaine.
 *
 * C'est elle qui dit quelles séances auraient dû donner lieu à un compte
 * rendu, donc lesquelles manquent. Cinq écrans en dépendent : les rapports de
 * séance, le suivi des mentors, la fiche d'un élève, le tableau de bord du
 * mentor et ses rapports.
 *
 * ── Pourquoi une fenêtre ────────────────────────────────────────────────────
 *
 * Sans elle, une séance hebdomadaire créée il y a deux ans se déroule en cent
 * quatre occurrences À CHAQUE affichage — et le coût grandit tout seul, sans
 * qu'un seul élève de plus ne s'inscrive. Avec cent élèves suivis deux ans,
 * c'est plus de dix mille dates recalculées pour en afficher quinze.
 *
 * `depuis` évite ce travail au lieu de le jeter après coup : le curseur saute
 * directement à la première occurrence utile, il ne parcourt pas les semaines
 * d'avant pour les écarter ensuite.
 *
 * Aucun accès à la base ici : la fonction est éprouvée par ses tests. Elle
 * vivait dans `lib/rapports.ts`, qui ouvre la base — donc hors de portée d'un
 * test.
 */

export type OccurrencePassee = {
  sessionId: string;
  titre: string;
  date: string;    // YYYY-MM-DD, jour local
  quand: string;   // ISO complet, pour l'heure
  mentor: string;
  eleve: string | null;
};

/** La tranche de temps demandée. Sans elle, tout l'historique est déroulé. */
export type Fenetre = {
  /** Rien avant cette date. */
  depuis?: Date;
  /** Rien après — par défaut, maintenant. */
  jusqua?: Date;
};

const SEMAINE = 7 * 86_400_000;

function jourLocal(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Seance = Record<string, any>;

export function occurrencesPassees(sessions: Seance[], fenetre: Fenetre = {}): OccurrencePassee[] {
  const out: OccurrencePassee[] = [];
  const fin = fenetre.jusqua ?? new Date(Date.now() - 1);
  const depuis = fenetre.depuis ?? null;

  for (const s of sessions) {
    const mentor = s.profiles?.display_name ?? "Mentor";
    const eleve  = s.students?.profiles?.display_name ?? null;

    const ajoute = (at: Date) => out.push({
      sessionId: s.id,
      titre: s.title ?? "Séance",
      date: jourLocal(at),
      quand: at.toISOString(),
      mentor,
      eleve,
    });

    if (s.session_type === "recurring") {
      const debut = new Date(s.active_from ?? s.created_at);
      debut.setHours(0, 0, 0, 0);
      const [h, m] = String(s.start_time ?? "00:00").split(":").map(Number);
      const curseur = new Date(debut);
      curseur.setHours(h || 0, m || 0, 0, 0);

      const ecart = (s.weekday - curseur.getDay() + 7) % 7;
      curseur.setDate(curseur.getDate() + (ecart === 0 && curseur >= debut ? 0 : ecart === 0 ? 7 : ecart));

      // Le saut : la grille étant hebdomadaire, la première occurrence utile se
      // calcule, elle ne se cherche pas semaine après semaine.
      if (depuis && curseur < depuis) {
        const semaines = Math.ceil((depuis.getTime() - curseur.getTime()) / SEMAINE);
        curseur.setDate(curseur.getDate() + semaines * 7);
      }

      // La fin se compare au jour, pas à l'instant : « active jusqu'au 26 juin »
      // inclut la séance du 26 juin. Comparés en instants, minuit passe avant
      // 8 h du matin, et la dernière séance de l'année disparaissait — son
      // compte rendu avec, puisque c'est l'occurrence qui le porte à l'écran.
      const dernierJour = s.active_until ? jourLocal(new Date(s.active_until)) : null;
      while (curseur <= fin) {
        if (!dernierJour || jourLocal(curseur) <= dernierJour) ajoute(new Date(curseur));
        curseur.setDate(curseur.getDate() + 7);
      }
    } else if (s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at <= fin && (!depuis || at >= depuis)) ajoute(at);
    }
  }

  return out.sort((a, b) => b.quand.localeCompare(a.quand));
}
