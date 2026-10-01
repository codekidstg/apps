import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { accesEntrainement, MESSAGE_REFUS } from "@/lib/eleve/acces";
import { processGamificationEvent } from "@/lib/gamification/process-event";
import { syncLimiter, checkRateLimit } from "@/lib/ratelimit";

/**
 * Un exercice terminé hors ligne, rejoué au retour du réseau.
 *
 * Les deux autres routes de `sync` existaient ; celle-ci manquait, et c'est la
 * plus sollicitée — un enfant fait plus d'exercices que de leçons. Elle suit
 * les mêmes règles que l'action `completeTraining` : l'accès est revérifié, le
 * Terrain ne paie pas en XP, le temps est plafonné à vingt minutes par
 * tentative, et « sans indice » reste vrai une fois gagné.
 */
const PLAFOND_SECONDES = 1200;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { allowed, headers } = await checkRateLimit(syncLimiter, `sync:${ip}`);
  if (!allowed) return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { trainingId, score, secondes, sansIndice } = await req.json() as
    { trainingId: string; score: number; secondes?: number; sansIndice?: boolean };

  const { data: student } = await supabase
    .from("students").select("id").eq("profile_id", user.id).single<{ id: string }>();
  if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const admin = createAdminClient();
  const verdict = await accesEntrainement(admin, student.id, trainingId);
  if (!verdict.ok) return NextResponse.json({ error: MESSAGE_REFUS[verdict.raison] }, { status: 403 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existante } = await (admin.from("training_progress") as any)
    .select("status, attempts, score, temps_total_secondes, reussi_sans_indice")
    .eq("student_id", student.id).eq("training_id", trainingId).maybeSingle();

  const essaisAvant = existante?.attempts ?? 0;
  const dejaFini = existante?.status === "completed";
  const sec = Math.min(Math.max(Math.round(secondes ?? 0), 0), PLAFOND_SECONDES);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (admin.from("training_progress") as any).upsert({
    student_id: student.id,
    training_id: trainingId,
    status: "completed",
    score: Math.max(score, existante?.score ?? 0),
    attempts: essaisAvant + 1,
    completed_at: new Date().toISOString(),
    temps_dernier_secondes: sec,
    temps_total_secondes: (existante?.temps_total_secondes ?? 0) + sec,
    reussi_sans_indice: (existante?.reussi_sans_indice ?? false) || !!sansIndice,
  }, { onConflict: "student_id,training_id" });

  // L'XP d'un exercice ne se verse qu'à la première réussite, et jamais sur le
  // Terrain. `processGamificationEvent` est idempotent, mais la règle du libre
  // service vit ici comme dans l'action.
  let xpGained = 0;
  if (!dejaFini && essaisAvant === 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: ex } = await (admin.from("trainings") as any)
      .select("libre_service, lesson_id").eq("id", trainingId).single();
    if (!ex?.libre_service) {
      const r = await processGamificationEvent(student.id, "blockly_solved",
        { lessonId: ex?.lesson_id, blockId: `training:${trainingId}` });
      xpGained = r.xpGained ?? 0;
    }
  }

  return NextResponse.json({ ok: true, xpGained });
}
