import { createAdminClient } from "@/lib/supabase/server";
import { lireExercice, type FicheExercice } from "./corrige";

/**
 * La fiche de l'exercice de chaque question — pour le mentor et la direction
 * seulement : elle porte la réponse attendue. Ne l'appeler que depuis leurs
 * pages, jamais depuis celles de l'élève ou du parent.
 *
 * L'exercice est relu tel qu'il est aujourd'hui. Un script de contenu qui l'a
 * réécrit depuis lui a donné un nouvel identifiant : il n'y a alors plus de
 * fiche, et la page s'en tient à l'instantané pris avec la question.
 *
 * Le corrigé des défis de code vient de corriges_exercices, que seul le
 * serveur lit (migration 033).
 */

// La table n'existe pas encore (migration 033 à passer) : la fiche s'affiche
// sans corrigé, sans remplir les journaux à chaque page.
const TABLE_ABSENTE = ["42P01", "PGRST205"];

export async function fichesDesQuestions(
  questions: { blocId: string; lessonId: string | null; trainingId: string | null }[],
): Promise<Record<string, FicheExercice>> {
  const idsLecons = [...new Set(questions.filter((q) => q.lessonId).map((q) => q.blocId))];
  const idsEntrainements = [...new Set(questions.filter((q) => !q.lessonId && q.trainingId).map((q) => q.blocId))];
  if (!idsLecons.length && !idsEntrainements.length) return {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const aucun = { data: [], error: null };
  const [lecons, entrainements, corrigesLecons, corrigesEntrainements] = await Promise.all([
    idsLecons.length ? admin.from("lesson_blocks").select("id, type, content").in("id", idsLecons) : aucun,
    idsEntrainements.length ? admin.from("training_blocks").select("id, type, content").in("id", idsEntrainements) : aucun,
    idsLecons.length ? admin.from("corriges_exercices").select("lesson_block_id, solution").in("lesson_block_id", idsLecons) : aucun,
    idsEntrainements.length ? admin.from("corriges_exercices").select("training_block_id, solution").in("training_block_id", idsEntrainements) : aucun,
  ]);
  if (lecons.error) console.error("[questions] exercices de leçon :", lecons.error.message);
  if (entrainements.error) console.error("[questions] exercices d'entraînement :", entrainements.error.message);
  for (const res of [corrigesLecons, corrigesEntrainements]) {
    if (res.error && !TABLE_ABSENTE.includes(res.error.code)) console.error("[questions] corrigés :", res.error.message);
  }

  const corriges = new Map<string, string>();
  for (const c of (corrigesLecons.data ?? []) as { lesson_block_id: string; solution: string }[]) corriges.set(c.lesson_block_id, c.solution);
  for (const c of (corrigesEntrainements.data ?? []) as { training_block_id: string; solution: string }[]) corriges.set(c.training_block_id, c.solution);

  const fiches: Record<string, FicheExercice> = {};
  for (const b of [...(lecons.data ?? []), ...(entrainements.data ?? [])] as { id: string; type: string; content: Record<string, unknown> | null }[]) {
    fiches[b.id] = lireExercice(b.type, b.content, corriges.get(b.id) ?? null);
  }
  return fiches;
}
