import { createAdminClient } from "@/lib/supabase/server";
import { libelleMois } from "./mois";

/**
 * Les bilans de fin de mois — la lecture. L'écriture est dans
 * `bilans-actions.ts`, appelée par le formulaire de la fiche.
 *
 * Un bilan garde la note telle qu'elle était le jour du point : la note vivante
 * se recalcule à chaque lecture, et suivrait donc une règle changée plus tard.
 * L'ajustement de la direction s'ajoute à cette note figée, jamais à l'autre.
 */

export type Bilan = {
  id: string;
  mentorId: string;
  mois: string;
  moisLabel: string;
  noteCalculee: number | null;
  ajustement: number;
  raisonAjustement: string | null;
  pointsForts: string | null;
  aAmeliorer: string | null;
  decisions: string | null;
  auteur: string | null;
  faitLe: string;
  misAJourLe: string;
  /** La note retenue : la note figée plus l'ajustement, entre 0 et 100. */
  noteRetenue: number | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Ligne = any;

function versBilan(l: Ligne): Bilan {
  const note = l.note_calculee === null || l.note_calculee === undefined ? null : Number(l.note_calculee);
  const ajustement = Number(l.ajustement ?? 0);
  return {
    id: l.id,
    mentorId: l.mentor_id,
    mois: l.mois,
    moisLabel: libelleMois(l.mois),
    noteCalculee: note,
    ajustement,
    raisonAjustement: l.raison_ajustement,
    pointsForts: l.points_forts,
    aAmeliorer: l.a_ameliorer,
    decisions: l.decisions,
    auteur: l.profiles?.display_name ?? null,
    faitLe: l.created_at,
    misAJourLe: l.updated_at,
    noteRetenue: note === null ? null : Math.max(0, Math.min(100, note + ajustement)),
  };
}

const CHAMPS = "id, mentor_id, mois, note_calculee, ajustement, raison_ajustement, points_forts, a_ameliorer, decisions, created_at, updated_at, profiles!auteur_id(display_name)";

/** Tous les bilans d'un mentor, du plus récent au plus ancien. */
export async function chargerBilansMentor(mentorId: string): Promise<Bilan[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data, error } = await admin.from("bilans_mentors").select(CHAMPS)
    .eq("mentor_id", mentorId).order("mois", { ascending: false });
  if (error) {
    console.error("[bilans] mentor :", error.message);
    return [];
  }
  return (data ?? []).map(versBilan);
}

/** Les bilans d'un mois, par mentor — la liste dit qui n'a pas encore eu son point. */
export async function chargerBilansDuMois(mois: string): Promise<Map<string, Bilan>> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data, error } = await admin.from("bilans_mentors").select(CHAMPS).eq("mois", mois);
  if (error) {
    console.error("[bilans] mois :", error.message);
    return new Map();
  }
  return new Map((data ?? []).map((l: Ligne) => [l.mentor_id as string, versBilan(l)]));
}

/**
 * Combien de mentors n'ont pas encore eu leur point pour ce mois — deux
 * comptages, pour l'alerte du tableau de bord. La liste complète, elle, passe
 * par `chargerSuiviMentors`, bien plus lourde : une alerte ne doit pas coûter
 * le calcul de toutes les notes.
 */
export async function compterBilansAFaire(mois: string): Promise<{ mentors: number; aFaire: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [mentors, faits] = await Promise.all([
    admin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher"),
    admin.from("bilans_mentors").select("id", { count: "exact", head: true }).eq("mois", mois),
  ]);
  if (mentors.error) console.error("[bilans] mentors :", mentors.error.message);
  if (faits.error) console.error("[bilans] faits :", faits.error.message);

  const total = mentors.count ?? 0;
  return { mentors: total, aFaire: Math.max(0, total - (faits.count ?? 0)) };
}
