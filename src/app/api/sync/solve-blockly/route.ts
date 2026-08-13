import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processGamificationEvent } from "@/lib/gamification/process-event";
import { syncLimiter, checkRateLimit } from "@/lib/ratelimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anonymous";
  const { allowed, headers } = await checkRateLimit(syncLimiter, `sync:${ip}`);
  if (!allowed) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429, headers });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { lessonId } = await req.json() as { lessonId: string };

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) return NextResponse.json({ error: "Élève introuvable" }, { status: 404 });

  const result = await processGamificationEvent(student.id, "blockly_solved", { lessonId });
  return NextResponse.json({ ok: true, ...result });
}
