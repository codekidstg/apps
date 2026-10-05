import { createAdminClient } from "@/lib/supabase/admin";
import { picDeConsultation, estUneAspiration, JOURS_SURVEILLES, type Consultation, type Pic } from "./aspiration";

/**
 * Le journal des consultations de cours.
 *
 * Il n'empêche rien et ne gêne personne : il permet seulement de voir, le jour
 * même, qu'un mentor a parcouru la moitié du catalogue en vingt minutes.
 */

/**
 * Noter qu'un mentor a ouvert une leçon.
 *
 * Jamais attendue par la page : si l'écriture échoue, le mentor doit quand
 * même voir son cours. Un journal n'a pas à casser une séance du samedi.
 */
export function noterConsultation(teacherId: string, lessonId: string): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  void admin
    .from("consultations_cours")
    .insert({ teacher_id: teacherId, lesson_id: lessonId })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .then((r: any) => { if (r?.error) console.error("[journal] consultation :", r.error.message); });
}

export type Signalement = {
  teacherId: string;
  nom: string;
  pic: Pic;
};

/** Les mentors qui ont dépassé le seuil ces derniers jours. */
export async function aspirationsRecentes(): Promise<Signalement[]> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const depuis = new Date(Date.now() - JOURS_SURVEILLES * 24 * 3600 * 1000).toISOString();

  const { data, error } = await admin
    .from("consultations_cours")
    .select("teacher_id, lesson_id, consulte_le")
    .gte("consulte_le", depuis);
  if (error) {
    console.error("[journal] lecture :", error.message);
    return [];
  }

  const parMentor = new Map<string, Consultation[]>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const r of (data ?? []) as any[]) {
    const liste = parMentor.get(r.teacher_id) ?? [];
    liste.push({ lesson_id: r.lesson_id, consulte_le: r.consulte_le });
    parMentor.set(r.teacher_id, liste);
  }

  const retenus: { teacherId: string; pic: Pic }[] = [];
  for (const [teacherId, liste] of parMentor) {
    const pic = picDeConsultation(liste);
    if (pic && estUneAspiration(pic)) retenus.push({ teacherId, pic });
  }
  if (retenus.length === 0) return [];

  const { data: profils } = await admin
    .from("profiles").select("id, display_name").in("id", retenus.map((r) => r.teacherId));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nom = new Map(((profils ?? []) as any[]).map((p) => [p.id, p.display_name as string]));

  return retenus
    .map((r) => ({ ...r, nom: nom.get(r.teacherId) ?? "Mentor inconnu" }))
    .sort((a, b) => b.pic.lecons - a.pic.lecons);
}
