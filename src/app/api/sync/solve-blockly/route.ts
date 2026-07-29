import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { processGamificationEvent } from "@/lib/gamification/process-event";

export async function POST(req: NextRequest) {
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
