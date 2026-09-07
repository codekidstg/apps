import { createAdminClient } from "@/lib/supabase/admin";
import { BADGES, type BadgeId } from "./badges";
import { getLevelForXp, XP_REWARDS } from "./levels";

type EventType = "lesson_completed" | "quiz_passed" | "blockly_solved" | "streak_day";
type Payload = Record<string, unknown>;

export type ProcessResult = {
  xpGained: number;
  newBadges: BadgeId[];
  levelUp: boolean;
  newLevel: number;
};

export async function processGamificationEvent(
  studentId: string,
  eventType: EventType,
  payload: Payload
): Promise<ProcessResult> {
  const sb = createAdminClient();

  // Get student current state
  const { data: student } = await sb
    .from("students")
    .select("id, xp, level_num, streak_days, last_activity")
    .eq("id", studentId)
    .single<{ id: string; xp: number; level_num: number; streak_days: number; last_activity: string | null }>();

  if (!student) return { xpGained: 0, newBadges: [], levelUp: false, newLevel: 1 };

  // ── Anti-rejeu ──────────────────────────────────────────────────────────
  //
  // Le même geste était écrit deux fois — l'action serveur pour l'usage en
  // ligne, la route /api/sync pour rejouer la file hors ligne — et seules les
  // routes vérifiaient qu'on n'avait pas déjà payé. `completeLesson` et
  // `solveBlockly` reversaient donc leur XP à chaque appel : une boucle sur
  // `solveBlockly` créditait 40 XP par tour, sans même vérifier que la leçon
  // existe.
  //
  // Le garde est ici plutôt que chez les appelants : c'est exactement la
  // divergence entre les deux copies qui a ouvert le trou. `payload` est déjà
  // inséré dans `gamification_events` à chaque appel — il sert de clé
  // d'idempotence, sans nouvelle table.
  if (eventType === "lesson_completed" || eventType === "blockly_solved") {
    const lessonId = payload.lessonId ? String(payload.lessonId) : null;
    const blockId  = payload.blockId  ? String(payload.blockId)  : null;
    if (lessonId) {
      let q = sb.from("gamification_events")
        .select("id", { count: "exact", head: true })
        .eq("student_id", studentId)
        .eq("event_type", eventType)
        .eq("payload->>lessonId", lessonId);
      // Une leçon peut porter plusieurs défis : chacun se paie une fois.
      // Sans `blockId` — file hors ligne remplie avant cette version — on
      // retombe sur une prime par leçon plutôt que de payer en boucle.
      if (blockId) q = q.eq("payload->>blockId", blockId);
      const { count, error } = await q;
      if (error) console.error("[gamification] anti-rejeu :", error.message);
      if ((count ?? 0) > 0) {
        return { xpGained: 0, newBadges: [], levelUp: false, newLevel: getLevelForXp(student.xp).num };
      }
    }
  }

  // Determine XP to award
  let xpGained = 0;
  if (eventType === "lesson_completed") {
    // Count completions for first_lesson bonus
    const { count } = await sb.from("lesson_progress").select("id", { count: "exact", head: true })
      .eq("student_id", studentId).eq("status", "completed");
    xpGained += XP_REWARDS.lesson_completed;
    if ((count ?? 0) === 1) xpGained += XP_REWARDS.first_lesson; // first lesson bonus
    if (payload.perfect) xpGained += XP_REWARDS.quiz_perfect;
  } else if (eventType === "blockly_solved") {
    xpGained += XP_REWARDS.blockly_solved;
  } else if (eventType === "streak_day") {
    xpGained += XP_REWARDS.streak_day;
  }

  const oldXp    = student.xp;
  const newXp    = oldXp + xpGained;
  const oldLevel = getLevelForXp(oldXp);
  const newLevel = getLevelForXp(newXp);
  const levelUp  = newLevel.num > oldLevel.num;

  // Seuls l'XP et les points sont écrits ici.
  //
  // `level_num` était mis à jour depuis les paliers d'XP — or c'est le niveau
  // pédagogique, fixé par l'administration, qui décide des thèmes accessibles.
  // Chaque leçon terminée le rétrogradait donc silencieusement : un élève
  // inscrit en Bâtisseur repassait Explorateur dès qu'il gagnait de l'XP, et
  // la colonne `level` restait « builder », désynchronisée.
  //
  // Le palier d'XP reste calculé pour annoncer une montée de niveau, il n'est
  // simplement plus persisté.
  await sb.from("students").update({
    xp:     newXp,
    points: newXp,
  }).eq("id", studentId);

  // Check badges to award
  const { data: existing } = await sb
    .from("student_achievements")
    .select("badge_id")
    .eq("student_id", studentId);
  const earned = new Set((existing ?? []).map((e: { badge_id: string }) => e.badge_id));

  const newBadges: BadgeId[] = [];

  // first_step
  if (!earned.has("first_step") && eventType === "lesson_completed") {
    newBadges.push("first_step");
  }

  // blockly_coder
  if (!earned.has("blockly_coder") && eventType === "blockly_solved") {
    newBadges.push("blockly_coder");
  }

  // city_builder (5 lessons)
  if (!earned.has("city_builder")) {
    const { count } = await sb.from("lesson_progress").select("id", { count: "exact", head: true })
      .eq("student_id", studentId).eq("status", "completed");
    if ((count ?? 0) >= 5) newBadges.push("city_builder");
  }

  // architect (10 lessons)
  if (!earned.has("architect")) {
    const { count } = await sb.from("lesson_progress").select("id", { count: "exact", head: true })
      .eq("student_id", studentId).eq("status", "completed");
    if ((count ?? 0) >= 10) newBadges.push("architect");
  }

  // streak_3
  if (!earned.has("streak_3") && (student.streak_days >= 2 || eventType === "streak_day")) {
    const today = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    const isConsecutive = student.last_activity === yesterday || student.last_activity === today;
    const newStreak = isConsecutive ? student.streak_days + 1 : 1;
    if (newStreak >= 3) newBadges.push("streak_3");
    await sb.from("students").update({ streak_days: newStreak, last_activity: today }).eq("id", studentId);
  }

  // Insert new badges and add their XP bonus
  if (newBadges.length > 0) {
    await sb.from("student_achievements").insert(
      newBadges.map((badge_id) => ({ student_id: studentId, badge_id }))
    );
    const bonusXp = newBadges.reduce((sum, id) => sum + (BADGES[id]?.xpBonus ?? 0), 0);
    if (bonusXp > 0) {
      await sb.from("students").update({ xp: newXp + bonusXp, points: newXp + bonusXp }).eq("id", studentId);
    }
  }

  // Mark event as processed
  await sb.from("gamification_events").insert({
    student_id: studentId,
    event_type: eventType,
    payload,
    processed: true,
  });

  return { xpGained, newBadges, levelUp, newLevel: newLevel.num };
}
