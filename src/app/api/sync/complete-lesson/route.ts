import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { syncLimiter, checkRateLimit } from "@/lib/ratelimit";
import { accesLecon, MESSAGE_REFUS } from "@/lib/eleve/acces";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { allowed, headers } = await checkRateLimit(syncLimiter, `sync:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers });
  }

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

  // La leçon doit appartenir au parcours ouvert à l'élève : cette route écrit
  // avec la clé de service, donc la RLS ne la retient pas.
  const verdict = await accesLecon(admin, student.id, lessonId);
  if (!verdict.ok) return NextResponse.json({ error: MESSAGE_REFUS[verdict.raison] }, { status: 403 });

  // Merge optimiste : on récupère le score existant et on garde le MAX
  const { data: existingRaw } = await (admin.from("lesson_progress") as any)
    .select("score, status, prepare_sans_faute")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const existing = existingRaw as { score: number; status: string; prepare_sans_faute: boolean } | null;

  const mergedScore = existing ? Math.max(existing.score ?? 0, score) : score;

  // Cette file est la deuxième porte de l'enfant, et elle écrivait `completed`
  // comme son bouton. L'oublier ici aurait suffi à contourner tout le
  // dispositif : il suffisait de travailler hors ligne. Elle prépare, comme
  // l'autre — seul le mentor valide (voir `validerLecon`).
  if (existing?.status === "completed") {
    return NextResponse.json({ ok: true, mergedScore, deja: true });
  }

  await (admin.from("lesson_progress") as any).upsert({
    student_id:   student.id,
    lesson_id:    lessonId,
    status:       "prepared",
    score:        mergedScore,
    attempts:     1,
    prepared_at:  new Date().toISOString(),
    prepare_sans_faute: (existing?.prepare_sans_faute ?? false) || perfect,
  }, { onConflict: "student_id,lesson_id" });

  // Sa série ne doit pas casser pendant qu'il attend la validation.
  await (admin.from("students") as any)
    .update({ last_activity: new Date().toISOString().slice(0, 10) })
    .eq("id", student.id);

  return NextResponse.json({ ok: true, mergedScore });
}
