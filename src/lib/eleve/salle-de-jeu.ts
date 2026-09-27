import { createAdminClient } from "@/lib/supabase/admin";
import type { Exercice } from "@/lib/eleve/paliers";

/**
 * Ce que l'enfant trouve dans sa salle de jeu, séance par séance.
 *
 * Le calcul vit ici, séparé de l'affichage : la page l'appelle après avoir
 * vérifié qui visite, et une page de vérification peut l'appeler pour n'importe
 * quel élève sans se connecter à son compte.
 */
export type SeanceSalle = {
  lessonId: string;
  titre: string;
  theme: string;
  niveau: string;
  /** Position dans le programme : thème, puis chapitre, puis séance. */
  rang: number;
  exercices: Exercice[];
};

export async function salleDeJeuPour(studentId: string): Promise<SeanceSalle[]> {
  const admin = createAdminClient() as any;

  const [{ data: accessRows }, { data: exosRaw }, { data: lessonProgress }, { data: trainingProgress }] = await Promise.all([
    admin.from("student_theme_access").select("theme_id").eq("student_id", studentId),
    admin.from("trainings")
      .select("id, title, description, palier, order_index, lesson_id, lessons(id, title, order_index, theme_id, chapters(order_index), themes(id, title, level, order_index))")
      .eq("libre_service", true).order("order_index"),
    admin.from("lesson_progress").select("lesson_id, status").eq("student_id", studentId),
    admin.from("training_progress").select("training_id, score, attempts, completed_at, reussi_sans_indice").eq("student_id", studentId),
  ]);

  const themesOuverts = new Set((accessRows ?? []).map((r: any) => r.theme_id));
  const seancesFinies = new Set((lessonProgress ?? [])
    .filter((lp: any) => lp.status === "completed").map((lp: any) => lp.lesson_id));
  const progres = new Map((trainingProgress ?? []).map((tp: any) => [tp.training_id, tp]));

  const parSeance = new Map<string, SeanceSalle>();

  for (const t of (exosRaw ?? []) as any[]) {
    const lecon = t.lessons;
    const theme = lecon?.themes;
    // La salle s'ouvre séance par séance : seulement celles qui sont terminées,
    // et seulement dans les thèmes ouverts à cet enfant. C'est la règle que le
    // serveur applique déjà aux exercices eux-mêmes (lib/eleve/acces.ts) : ici
    // elle ne fait que décider ce qui s'affiche.
    if (!lecon || !theme) continue;
    if (!themesOuverts.has(theme.id) || !seancesFinies.has(lecon.id)) continue;

    if (!parSeance.has(lecon.id)) {
      parSeance.set(lecon.id, {
        lessonId: lecon.id, titre: lecon.title, theme: theme.title, niveau: theme.level,
        rang: (theme.order_index ?? 0) * 10_000 + (lecon.chapters?.order_index ?? 0) * 100 + (lecon.order_index ?? 0),
        exercices: [],
      });
    }
    const tp = progres.get(t.id) as any;
    parSeance.get(lecon.id)!.exercices.push({
      id: t.id, title: t.title, description: t.description, xp_reward: 0,
      attempts: tp?.attempts ?? 0, best_score: tp?.score ?? null,
      last_completed_at: tp?.completed_at ?? null,
      palier: t.palier, sansIndice: tp?.reussi_sans_indice ?? false,
    });
  }

  return [...parSeance.values()].sort((a, b) => a.rang - b.rang);
}
