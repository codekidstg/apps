export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import { requireStudentPermission } from "@/lib/permissions/student";

type Lesson   = { id: string; title: string; xp_reward: number; chapter_id: string; order_index: number };
type Chapter  = { id: string; title: string; order_index: number };
type Progress = { lesson_id: string; status: string; score: number | null };

export default async function ThemePage({
  params,
}: {
  params: Promise<{ themeId: string; locale: string }>;
}) {
  const { themeId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  await requireStudentPermission(user.id, "student.apprendre");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) redirect("/fr/connexion");

  const admin = createAdminClient();

  const { data: themeRaw } = await (admin.from("themes") as any)
    .select("id, title, level")
    .eq("id", themeId)
    .single();
  const theme = themeRaw as { id: string; title: string; level: string } | null;
  if (!theme) redirect("/fr/eleve");

  // Vérifier l'accès au thème (si des accès sont configurés pour cet élève)
  const { data: accessRows } = await (admin.from("student_theme_access") as any)
    .select("theme_id")
    .eq("student_id", student.id);
  if (accessRows && accessRows.length > 0) {
    const hasAccess = accessRows.some((r: { theme_id: string }) => r.theme_id === themeId);
    if (!hasAccess) redirect("/fr/eleve");
  }

  const { data: chaptersRaw } = await admin
    .from("chapters")
    .select("id, title, order_index")
    .eq("theme_id", themeId)
    .order("order_index") as any;
  const chapters: Chapter[] = chaptersRaw ?? [];

  const chapterIds = chapters.map((c) => c.id);
  const { data: lessonsRaw } = chapterIds.length
    ? await admin
        .from("lessons")
        .select("id, title, xp_reward, chapter_id, order_index")
        .in("chapter_id", chapterIds)
        .order("order_index") as any
    : { data: [] };
  const lessons: Lesson[] = lessonsRaw ?? [];

  const { data: progressRaw } = await (supabase.from("lesson_progress") as any)
    .select("lesson_id, status, score")
    .eq("student_id", student.id)
    .in("lesson_id", lessons.map((l) => l.id));
  const progressMap = new Map<string, Progress>(
    (progressRaw ?? []).map((p: Progress) => [p.lesson_id, p])
  );

  const allLessons = chapters.flatMap((ch) =>
    lessons
      .filter((l) => l.chapter_id === ch.id)
      .sort((a, b) => a.order_index - b.order_index)
      .map((l) => ({ ...l, chapterTitle: ch.title }))
  );

  function isUnlocked(idx: number): boolean {
    if (idx === 0) return true;
    return progressMap.get(allLessons[idx - 1].id)?.status === "completed";
  }

  const totalDone = allLessons.filter((l) => progressMap.get(l.id)?.status === "completed").length;
  const pct = allLessons.length ? Math.round((totalDone / allLessons.length) * 100) : 0;

  const LEVEL_ICON: Record<string, string> = {
    explorer:  "🌱",
    builder:   "🔨",
    architect: "🏛️",
  };

  return (
    <div className="p-8 max-w-2xl">
      {/* Back */}
      <Link href="/eleve" className="text-sm font-bold hover:underline mb-6 inline-flex items-center gap-2 transition-colors"
        style={{ color: "#475569" }}>
        ← Ma Cité
      </Link>

      {/* Header */}
      <div className="mt-4 mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-2" style={{ color: "#FDB813" }}>◈ Module</div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: "#1e293b", border: "1px solid #334155" }}>
            {LEVEL_ICON[theme.level] ?? "📚"}
          </div>
          <h1 className="text-2xl font-black text-white">{theme.title}</h1>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-4">
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#FDB813" }} />
          </div>
          <span className="text-sm font-black shrink-0 font-mono" style={{ color: pct === 100 ? "#10b981" : "#FDB813" }}>
            {totalDone}/{allLessons.length}
          </span>
        </div>
      </div>

      {/* Lessons */}
      <div className="space-y-2">
        {allLessons.map((lesson, idx) => {
          const prog    = progressMap.get(lesson.id);
          const done    = prog?.status === "completed";
          const unlocked = isUnlocked(idx);
          const isCurrent = unlocked && !done;

          return (
            <div key={lesson.id}>
              {/* Chapter separator */}
              {(idx === 0 || allLessons[idx - 1].chapterTitle !== lesson.chapterTitle) && (
                <div className="text-xs font-mono font-black uppercase tracking-widest mb-3 mt-6 first:mt-0 flex items-center gap-2"
                  style={{ color: "#334155" }}>
                  <span className="flex-1 h-px" style={{ background: "#1e293b" }} />
                  {lesson.chapterTitle}
                  <span className="flex-1 h-px" style={{ background: "#1e293b" }} />
                </div>
              )}

              {unlocked ? (
                <Link
                  href={`/eleve/quete/${lesson.id}`}
                  className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all hover:scale-[1.01]"
                  style={{
                    background: done ? "#10b98110" : isCurrent ? "#FDB81310" : "#1e293b",
                    border: done
                      ? "1px solid #10b98130"
                      : isCurrent
                      ? "1.5px solid #FDB81340"
                      : "1px solid #334155",
                    boxShadow: isCurrent ? "0 0 15px #FDB81310" : "none",
                  }}
                >
                  {/* Status icon */}
                  <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-black"
                    style={{
                      background: done ? "#10b98120" : isCurrent ? "#FDB813" : "#0f172a",
                      color: done ? "#10b981" : isCurrent ? "#0f172a" : "#334155",
                      border: done ? "1px solid #10b98140" : "none",
                    }}>
                    {done ? "✓" : isCurrent ? "▶" : String(idx + 1)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-sm" style={{ color: done ? "#10b981" : isCurrent ? "white" : "#94a3b8" }}>
                      {lesson.title}
                    </div>
                    {done && prog?.score != null && (
                      <div className="text-xs mt-0.5 font-mono" style={{ color: "#10b981" }}>Score : {prog.score}/100</div>
                    )}
                    {isCurrent && (
                      <div className="text-xs mt-0.5 font-mono font-bold" style={{ color: "#FDB813" }}>En cours · +{lesson.xp_reward} XP</div>
                    )}
                    {!done && !isCurrent && (
                      <div className="text-xs mt-0.5 font-mono" style={{ color: "#334155" }}>+{lesson.xp_reward} XP</div>
                    )}
                  </div>

                  <span className="text-lg shrink-0" style={{ color: done ? "#10b981" : "#334155" }}>
                    {done ? "✅" : "→"}
                  </span>
                </Link>
              ) : (
                <div className="flex items-center gap-4 rounded-2xl px-5 py-4 cursor-not-allowed"
                  style={{ background: "#0f172a", border: "1px solid #1e293b", opacity: 0.4 }}>
                  <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-base"
                    style={{ background: "#1e293b", color: "#334155" }}>
                    🔒
                  </div>
                  <div className="flex-1">
                    <div className="font-black text-sm" style={{ color: "#334155" }}>{lesson.title}</div>
                    <div className="text-xs mt-0.5 font-mono" style={{ color: "#1e293b" }}>Termine la leçon précédente</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
