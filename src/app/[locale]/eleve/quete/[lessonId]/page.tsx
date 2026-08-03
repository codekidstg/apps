import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QuestReader from "./QuestReader";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function QuestePage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) redirect("/fr/connexion");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, xp_reward, chapter_id, theme_id")
    .eq("id", lessonId)
    .single<{ id: string; title: string; xp_reward: number; chapter_id: string; theme_id: string | null }>();
  if (!lesson) notFound();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, title, theme_id")
    .eq("id", lesson.chapter_id)
    .single<{ id: string; title: string; theme_id: string }>();

  const { data: theme } = chapter
    ? await supabase.from("themes").select("id, title").eq("id", chapter.theme_id).single<{ id: string; title: string }>()
    : { data: null };

  const { data: blocksRaw } = await supabase
    .from("lesson_blocks")
    .select("id, type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  type LessonRow = { id: string; title: string; order_index: number; chapter_id: string; theme_id?: string };
  const { data: allLessons } = await supabase
    .from("lessons")
    .select("id, title, order_index, chapter_id")
    .eq("theme_id", lesson.theme_id ?? chapter?.theme_id ?? "")
    .order("chapter_id").order("order_index")
    .returns<LessonRow[]>();

  let nextLessonId: string | null = null;
  if (allLessons) {
    const idx = allLessons.findIndex((l) => l.id === lessonId);
    if (idx >= 0 && idx < allLessons.length - 1) nextLessonId = allLessons[idx + 1].id;
  }

  // Entraînements liés à cette leçon
  const { data: trainingsRaw } = await (supabase.from("trainings") as any)
    .select("id, title, xp_reward")
    .eq("lesson_id", lessonId)
    .order("created_at");
  const trainings = (trainingsRaw ?? []) as { id: string; title: string; xp_reward: number }[];

  const { data: progress } = await (supabase.from("lesson_progress") as any)
    .select("status, block_progress")
    .eq("student_id", student.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();
  const alreadyCompleted = progress?.status === "completed";
  const savedBlockProgress = (progress?.block_progress as Record<string, unknown> | null) ?? null;

  if (!progress) {
    await (supabase.from("lesson_progress") as any).upsert({
      student_id: student.id,
      lesson_id: lessonId,
      status: "in_progress",
      attempts: 1,
    }, { onConflict: "student_id,lesson_id" });
  }

  return (
    <div className="p-6 lg:p-10 bg-slate-950 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-mono mb-6 flex-wrap">
        <Link href="/eleve" className="hover:underline transition-colors" style={{ color: "#334155" }}>Ma Cité</Link>
        {theme && <><span style={{ color: "#1e293b" }}>›</span><Link href={`/eleve/theme/${theme.id}`} className="hover:underline transition-colors" style={{ color: "#334155" }}>{theme.title}</Link></>}
        {chapter && <><span style={{ color: "#1e293b" }}>›</span><span style={{ color: "#475569" }}>{chapter.title}</span></>}
        <span style={{ color: "#1e293b" }}>›</span>
        <span style={{ color: "#94a3b8" }}>{lesson.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8 rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid #FDB81330", boxShadow: "0 0 30px #FDB81310" }}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 text-9xl flex items-center justify-center select-none">⚔️</div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono font-black uppercase tracking-widest" style={{ color: "#FDB813" }}>⚔️ Quête</span>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "#FDB81320", color: "#FDB813", border: "1px solid #FDB81340" }}>
            +{lesson.xp_reward} XP
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
        {alreadyCompleted && (
          <div className="inline-flex items-center gap-2 mt-3 text-xs font-black px-3 py-1 rounded-full"
            style={{ background: "#10b98120", color: "#10b981", border: "1px solid #10b98130" }}>
            ✅ Déjà complétée
          </div>
        )}
      </div>

      <QuestReader
        lessonId={lessonId}
        title={lesson.title}
        blocks={blocks}
        alreadyCompleted={alreadyCompleted}
        xpReward={lesson.xp_reward}
        nextLessonId={nextLessonId}
        themeId={chapter?.theme_id ?? ""}
        savedBlockProgress={savedBlockProgress}
        trainings={trainings}
      />
    </div>
  );
}
