import { createAdminClient } from "@/lib/supabase/server";
import { FIL_VIDE, type Evenement, type Fil } from "./fil-format";

/**
 * Le fil d'un élève : ce qu'il a fait, dans l'ordre, du plus récent au plus ancien.
 *
 * Pourquoi ce fichier existe. La carte « Évolution » répond à *où il va* — la
 * prochaine leçon, le retard, le statut. Elle ne dit jamais *d'où il vient*.
 * Roland venait plusieurs fois par semaine chercher « quelle est la dernière
 * séance faite, quel est le dernier exercice » et ne les trouvait nulle part :
 * les exercices n'étaient que comptés, jamais nommés, et la frise de 28 jours
 * n'allume que des cases — elle dit quand, jamais quoi.
 *
 * La base le savait déjà. Sur les quatre élèves actifs, chaque leçon terminée
 * porte sa date, chaque exercice porte la sienne avec ses essais : aucun trou,
 * aucune colonne à ajouter. Il n'y avait qu'à l'afficher.
 *
 * Et il fallait l'afficher EN ORDRE, pas en deux lignes séparées, parce que les
 * deux vérités divergent : Samuel a terminé « 🔧 Le bug qui ne dit rien » le 26
 * au soir, mais ses trois derniers exercices sont du 27 après-midi et
 * appartiennent à une autre séance. Tant qu'on n'en montre qu'une, on cherche
 * l'autre.
 */

export type { Evenement, Fil } from "./fil-format";

const VIDE = FIL_VIDE;

/**
 * Le fil de plusieurs élèves d'un coup — la liste des élèves en affiche une
 * ligne chacun, et on ne veut pas d'une requête par enfant.
 *
 * `limite` ne coupe que les événements rendus ; le résumé regarde tout.
 */
export async function filsEleves(studentIds: string[], limite = 10): Promise<Map<string, Fil>> {
  const fils = new Map<string, Fil>(studentIds.map((id) => [id, { ...VIDE, evenements: [] }]));
  if (!studentIds.length) return fils;

  const admin = createAdminClient();

  const [lecons, exercices] = await Promise.all([
    (admin.from("lesson_progress") as any)
      .select("student_id, lesson_id, status, completed_at, lessons(title)")
      .in("student_id", studentIds),

    (admin.from("training_progress") as any)
      .select("student_id, status, completed_at, created_at, attempts, score, temps_total_secondes, " +
              "reussi_sans_indice, trainings(title, libre_service, lesson_id)")
      .in("student_id", studentIds),
  ]);

  const lignesLecons = (lecons.data ?? []) as any[];
  const lignesExos   = (exercices.data ?? []) as any[];

  // Les exercices de parcours de chaque leçon : c'est le dénominateur du
  // « 3 exercices sur 7 » de la ligne de résumé.
  const leconsOuvertes = lignesLecons.filter((l) => l.status !== "completed").map((l) => l.lesson_id);
  const totalParLecon = new Map<string, number>();
  if (leconsOuvertes.length) {
    const { data } = await (admin.from("trainings") as any)
      .select("lesson_id").in("lesson_id", leconsOuvertes).eq("libre_service", false);
    for (const t of (data ?? []) as { lesson_id: string }[])
      totalParLecon.set(t.lesson_id, (totalParLecon.get(t.lesson_id) ?? 0) + 1);
  }

  for (const id of studentIds) {
    const evenements: Evenement[] = [];

    for (const l of lignesLecons) {
      if (l.student_id !== id || l.status !== "completed" || !l.completed_at) continue;
      evenements.push({ type: "lecon", quand: l.completed_at, titre: l.lessons?.title ?? "Séance" });
    }

    for (const e of lignesExos) {
      if (e.student_id !== id) continue;
      const titre = e.trainings?.title ?? "Exercice";
      const terrain = !!e.trainings?.libre_service;
      const lecon = e.trainings?.lesson_id
        ? lignesLecons.find((l) => l.lesson_id === e.trainings.lesson_id)?.lessons?.title ?? null
        : null;

      if (e.status === "completed" && e.completed_at) {
        evenements.push({
          type: "exercice", quand: e.completed_at, titre, lecon, terrain,
          essais: e.attempts ?? 1,
          score: typeof e.score === "number" ? e.score : null,
          secondes: e.temps_total_secondes || null,
          sansIndice: !!e.reussi_sans_indice,
        });
      } else if (e.created_at) {
        // Ouvert, jamais réussi. Depuis septembre 2026 seulement : avant, rien
        // n'était écrit tant que l'exercice n'était pas gagné.
        evenements.push({ type: "ouvert", quand: e.created_at, titre, lecon, terrain });
      }
    }

    evenements.sort((a, b) => b.quand.localeCompare(a.quand));

    const derniereLeconEv = evenements.find((e) => e.type === "lecon") as
      Extract<Evenement, { type: "lecon" }> | undefined;

    const ouverte = lignesLecons.find((l) => l.student_id === id && l.status !== "completed");
    const faits = ouverte
      ? lignesExos.filter((e) => e.student_id === id && e.status === "completed"
          && e.trainings?.lesson_id === ouverte.lesson_id && !e.trainings?.libre_service).length
      : 0;

    fils.set(id, {
      evenements: evenements.slice(0, limite),
      dernierPassage: evenements[0]?.quand ?? null,
      derniereLecon: derniereLeconEv ? { titre: derniereLeconEv.titre, quand: derniereLeconEv.quand } : null,
      enCours: ouverte
        ? { titre: ouverte.lessons?.title ?? "Séance", faits, total: totalParLecon.get(ouverte.lesson_id) ?? 0 }
        : null,
    });
  }

  return fils;
}

/** Le fil d'un seul élève — la fiche n'en demande qu'un. */
export async function filEleve(studentId: string, limite = 10): Promise<Fil> {
  return (await filsEleves([studentId], limite)).get(studentId) ?? VIDE;
}
