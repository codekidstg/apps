import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { processGamificationEvent } from "@/lib/gamification/process-event";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { lessonId, score, perfect } = await req.json() as {
    lessonId: string; score: number; perfect: boolean;
  };

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const admin = createAdminClient();

  // Merge optimiste : on récupère le score existant et on garde le MAX
  const { data: existingRaw } = await (admin.from("lesson_progress") as any)
    .select("score, status")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const existing = existingRaw as { score: number; status: string } | null;

  const mergedScore = existing ? Math.max(existing.score ?? 0, score) : score;
  const alreadyCompleted = existing?.status === "completed";

  await (admin.from("lesson_progress") as any).upsert({
    student_id:   student.id,
    lesson_id:    lessonId,
    status:       "completed",
    score:        mergedScore,
    attempts:     1,
    completed_at: new Date().toISOString(),
  }, { onConflict: "student_id,lesson_id" });

  // Gamification uniquement si pas déjà complété (évite double XP)
  if (!alreadyCompleted) {
    await processGamificationEvent(student.id, "lesson_completed", { lessonId, score: mergedScore, perfect });
  }

  return NextResponse.json({ ok: true, mergedScore });
}
