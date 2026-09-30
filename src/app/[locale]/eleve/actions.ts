"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processGamificationEvent } from "@/lib/gamification/process-event";
import { XP_REWARDS } from "@/lib/gamification/levels";
import { enregistrerRealisation } from "@/lib/realisations/enregistrer";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { accesLecon, accesEntrainement, MESSAGE_REFUS } from "@/lib/eleve/acces";

async function getStudentId(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", userId)
    .single<{ id: string }>();
  return data?.id ?? null;
}

/**
 * Aucune de ces actions ne vérifiait que la leçon appartenait au parcours de
 * l'élève : il suffisait de connaître un identifiant. Elles écrivent toutes
 * dans `lesson_progress` ou versent de l'XP, donc elles se contrôlent toutes.
 */
async function refusLecon(studentId: string, lessonId: string): Promise<string | null> {
  const verdict = await accesLecon(createAdminClient(), studentId, lessonId);
  return verdict.ok ? null : MESSAGE_REFUS[verdict.raison];
}

/**
 * L'enfant a tout fait : la leçon est PRÉPARÉE, pas terminée.
 *
 * Elle l'était jusqu'au 30 septembre 2026, et c'est ce qui emballait la
 * machine : finir ouvrait la suivante, que l'enfant finissait le soir même.
 * Les quatre élèves actifs avaient 2 à 3 leçons d'avance sur leurs séances.
 *
 * Un enfant peut dire « j'ai tout fait ». Il ne peut pas dire « j'ai
 * compris » — c'est le mentor qui l'atteste, en séance, et c'est sa validation
 * qui verse la prime et ouvre la leçon suivante (voir `validerLecon`).
 *
 * Ce que la préparation garde quand même, pour ne pas punir l'enfant rapide :
 *   · les 40 XP de chaque défi, déjà versés au moment où il l'a réussi ;
 *   · sa réalisation partageable, qui est son travail à lui ;
 *   · son activité du jour, pour que sa série ne casse pas pendant l'attente ;
 *   · « sans faute », gagné maintenant et payé à la validation.
 */
export async function completeLesson(lessonId: string, score: number, perfect: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const refus = await refusLecon(studentId, lessonId);
  if (refus) return { error: refus };

  const admin = createAdminClient();
  const { data: ligne } = await (admin.from("lesson_progress") as any)
    .select("id, status, score, prepare_sans_faute")
    .eq("student_id", studentId).eq("lesson_id", lessonId).maybeSingle();

  // Rejouer une leçon déjà validée ne la fait pas redescendre : le
  // déverrouillage de la suivante dépend de son statut.
  const dejaValidee = ligne?.status === "completed";

  if (!dejaValidee) {
    await (supabase.from("lesson_progress") as any).upsert({
      student_id:   studentId,
      lesson_id:    lessonId,
      status:       "prepared",
      score:        Math.max(score, ligne?.score ?? 0),
      attempts:     1,
      prepared_at:  new Date().toISOString(),
      // Une fois vrai, toujours vrai : il l'a bien réussie sans faute une fois.
      prepare_sans_faute: (ligne?.prepare_sans_faute ?? false) || perfect,
    }, { onConflict: "student_id,lesson_id" });

    // La série se met à jour dans le moteur de gamification, que la préparation
    // n'appelle plus. Sans cette ligne, un enfant qui prépare perdrait sa série.
    await (admin.from("students") as any)
      .update({ last_activity: new Date().toISOString().slice(0, 10) })
      .eq("id", studentId);
  }

  // Les leçons qui contiennent un plan produisent une réalisation partageable :
  // le plan écrit par l'enfant, son programme, et le dessin tracé. Rend `null`
  // pour toutes les autres leçons, et n'empêche jamais de finir la séance.
  const realisation = await enregistrerRealisation(studentId, lessonId);

  // Le jour de la prochaine séance : une attente qui a une date se supporte,
  // « quand ton mentor validera » ne se supporte pas.
  const prochaineSeance = dejaValidee ? null : await jourProchaineSeance(admin, studentId);

  revalidatePath("/eleve");
  return {
    success: true,
    prepare: !dejaValidee,
    xpEnAttente: dejaValidee ? 0 : XP_REWARDS.lesson_completed,
    prochaineSeance,
    realisation,
  };
}

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

/**
 * Le prochain jour de séance de cet élève, en toutes lettres. Ses séances sont
 * hebdomadaires (`weekday`) ou datées (`scheduled_at`) : on rend la plus proche.
 */
async function jourProchaineSeance(admin: any, studentId: string): Promise<string | null> {
  const { data } = await (admin.from("teacher_sessions") as any)
    .select("weekday, scheduled_at, active_until")
    .eq("student_id", studentId);

  const aujourdhui = new Date();
  let meilleur: number | null = null;
  let libelle: string | null = null;

  for (const s of (data ?? []) as any[]) {
    if (s.active_until && new Date(s.active_until) < aujourdhui) continue;

    if (typeof s.weekday === "number") {
      // 0 = dimanche, comme getDay(). Le jour même compte pour la semaine
      // suivante : quand l'enfant travaille le soir, la séance est passée.
      const dans = ((s.weekday - aujourdhui.getDay()) + 7) % 7 || 7;
      if (meilleur === null || dans < meilleur) { meilleur = dans; libelle = JOURS[s.weekday]; }
    } else if (s.scheduled_at) {
      const quand = new Date(s.scheduled_at);
      const dans = Math.ceil((quand.getTime() - aujourdhui.getTime()) / 86_400_000);
      if (dans >= 0 && (meilleur === null || dans < meilleur)) {
        meilleur = dans; libelle = JOURS[quand.getDay()];
      }
    }
  }
  return libelle;
}

export async function solveBlockly(lessonId: string, blockId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const refus = await refusLecon(studentId, lessonId);
  if (refus) return { error: refus };

  // `blockId` sert de clé d'idempotence : chaque défi d'une leçon se paie
  // une fois, mais une leçon à deux défis paie bien deux fois.
  const result = await processGamificationEvent(studentId, "blockly_solved", { lessonId, blockId });

  revalidatePath("/eleve");
  return { success: true, ...result };
}

/**
 * Le temps passé sur un exercice, tel que l'enfant l'a vécu.
 *
 * Il est mesuré chez lui et peut donc mentir : un onglet oublié pendant le
 * repas raconterait quarante minutes de concentration. Le compteur s'arrête
 * déjà quand l'onglet passe en arrière-plan ; ici on plafonne une tentative à
 * vingt minutes, et la base refuse tout ce qui dépasse. Mieux vaut sous-compter
 * un enfant appliqué que montrer une fausse assiduité à son parent.
 */
const PLAFOND_SECONDES = 1200;

/**
 * Marque qu'un exercice a été OUVERT, sans rien promettre de plus.
 *
 * Jusqu'ici `training_progress` n'était écrit qu'à la réussite : un exercice
 * ouvert puis abandonné ne laissait aucune trace, et la question « qu'est-ce
 * qu'il a essayé sans y arriver ? » n'avait pas de réponse en base — c'est
 * pourtant souvent la ligne la plus parlante pour un mentor.
 *
 * Trois précautions :
 *   · on n'écrit que s'il n'existe rien — une ligne déjà réussie ne doit
 *     jamais redescendre en « en cours » parce que l'enfant rejoue ;
 *   · `attempts` reste à 0 : il n'a encore rien tenté, juste ouvert ;
 *   · l'échec est silencieux. Ouvrir un exercice ne doit jamais empêcher de
 *     le jouer.
 */
export async function ouvrirTraining(trainingId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return;

  const verdict = await accesEntrainement(createAdminClient(), studentId, trainingId);
  if (!verdict.ok) return;

  const { data: existante } = await (supabase.from("training_progress") as any)
    .select("id")
    .eq("student_id", studentId)
    .eq("training_id", trainingId)
    .maybeSingle();
  if (existante) return;

  await (supabase.from("training_progress") as any).insert({
    student_id:  studentId,
    training_id: trainingId,
    status:      "in_progress",
    score:       0,
    attempts:    0,
  });
}

export async function completeTraining(
  trainingId: string,
  score: number,
  mesure?: { secondes?: number; sansIndice?: boolean },
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const verdict = await accesEntrainement(createAdminClient(), studentId, trainingId);
  if (!verdict.ok) return { error: MESSAGE_REFUS[verdict.raison] };

  // Récupère le nombre de tentatives précédentes
  const { data: existing } = await (supabase.from("training_progress") as any)
    .select("attempts, score")
    .eq("student_id", studentId)
    .eq("training_id", trainingId)
    .maybeSingle();

  const prevAttempts = existing?.attempts ?? 0;
  const bestScore = Math.max(score, existing?.score ?? 0);

  const secondes = Math.min(Math.max(Math.round(mesure?.secondes ?? 0), 0), PLAFOND_SECONDES);

  await (supabase.from("training_progress") as any).upsert({
    student_id:   studentId,
    training_id:  trainingId,
    status:       "completed",
    score:        bestScore,
    attempts:     prevAttempts + 1,
    completed_at: new Date().toISOString(),
    temps_dernier_secondes: secondes,
    temps_total_secondes:   (existing?.temps_total_secondes ?? 0) + secondes,
    // Une fois vrai, toujours vrai : un enfant qui a réussi seul une fois l'a
    // réussi seul, même s'il rejoue plus tard en s'aidant des indices.
    reussi_sans_indice: (existing?.reussi_sans_indice ?? false) || (mesure?.sansIndice ?? false),
  }, { onConflict: "student_id,training_id" });

  // XP uniquement à la première complétion
  if (prevAttempts === 0) {
    const { data: training } = await (supabase.from("trainings") as any)
      .select("xp_reward, libre_service")
      .eq("id", trainingId)
      .single();

    // Le Terrain ne paie pas en XP. Sans ce garde, chaque exercice en libre
    // service verserait les 50 XP fixes du moteur — sept exercices sur une
    // seule séance, et la tranche Bâtisseur (500 à 1 500 XP) sautait. Le
    // Terrain paie en progression et en ceintures, jamais en niveau.
    if (training?.libre_service) {
      revalidatePath("/eleve");
      return { success: true, xpGained: 0 };
    }

    const xpReward = training?.xp_reward ?? 30;
    const result = await processGamificationEvent(studentId, "lesson_completed", {
      lessonId: trainingId, score, perfect: score === 100,
    });
    revalidatePath("/eleve");
    return { success: true, xpGained: result.xpGained ?? xpReward };
  }

  revalidatePath("/eleve");
  return { success: true, xpGained: 0 };
}

export async function syncBlockProgress(lessonId: string, blockProgress: Record<string, unknown>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const refus = await refusLecon(studentId, lessonId);
  if (refus) return { error: refus };

  try {
    const { data: existing } = await (supabase.from("lesson_progress") as any)
      .select("status")
      .eq("student_id", studentId)
      .eq("lesson_id", lessonId)
      .maybeSingle();

    const payload: Record<string, unknown> = {
      student_id:     studentId,
      lesson_id:      lessonId,
      block_progress: blockProgress,
    };
    // Relire ne doit rétrograder ni une leçon validée, ni une leçon préparée :
    // le déverrouillage dépend du premier statut, et l'attente de validation du
    // second. Sans ce garde, rouvrir sa leçon la veille de la séance effaçait
    // le « j'ai tout fait » que le mentor devait voir.
    if (existing?.status !== "completed" && existing?.status !== "prepared") {
      payload.status = "in_progress";
    }

    await (supabase.from("lesson_progress") as any)
      .upsert(payload, { onConflict: "student_id,lesson_id" });
  } catch (_) { /* La colonne block_progress n'existe peut-être pas encore */ }

  return { success: true };
}

export async function saveAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const studentId = await getStudentId(supabase, user.id);
  if (!studentId) return { error: "Élève introuvable" };

  const { error } = await (supabase.from("student_avatar") as any).upsert({
    student_id: studentId,
    base:       formData.get("base") as string || "robot_blue",
    hat:        formData.get("hat")  as string || null,
    accessory:  formData.get("accessory") as string || null,
    color:      formData.get("color") as string || "#3B82F6",
    accent:     formData.get("accent") as string || "#06b6d4",
    updated_at: new Date().toISOString(),
  }, { onConflict: "student_id" });

  // L'erreur était jetée : un enfant voyait « configuration sauvegardée »
  // alors que rien n'était parti.
  if (error) {
    console.error("[saveAvatar]", error.message);
    return { error: "La sauvegarde a échoué. Réessaie dans un instant." };
  }

  // Le robot s'affiche dans la barre latérale, donc dans le *layout* de
  // `/eleve` — et `revalidatePath("/eleve")` ne revalidait que la page, sur un
  // chemin qui ne tient même pas compte du segment de langue. L'enfant
  // sauvegardait, et continuait de voir son ancien robot à côté de son nom.
  revalidatePath("/[locale]/eleve", "layout");
  return { success: true };
}
