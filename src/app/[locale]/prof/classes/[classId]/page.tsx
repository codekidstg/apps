import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import GradeForm from "./GradeForm";

type StudentRow = {
  profile: { id: string; display_name: string };
  student: { id: string; level: string; xp: number };
};
type ThemeRef  = { id: string; title: string };
type LessonRef = { id: string; title: string; chapter_id: string };
type Progress  = { lesson_id: string; status: string; score: number | null };
type GradeRow  = { student_id: string; theme_id: string; score: number | null; comment: string | null };

export default async function ClassPage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: clsData } = await supabase
    .from("classes")
    .select("id, name, level")
    .eq("id", classId)
    .eq("teacher_id", user.id)
    .maybeSingle();

  if (!clsData) notFound();
  const cls = clsData as { id: string; name: string; level: string };

  // Élèves inscrits
  const { data: enrollmentsRaw } = await supabase
    .from("class_enrollments")
    .select("students(id, level, xp, profiles:profile_id(id, display_name))")
    .eq("class_id", classId);

  const students: StudentRow[] = (enrollmentsRaw ?? []).flatMap((e: Record<string, unknown>) => {
    const raw = Array.isArray(e.students) ? e.students[0] : e.students as Record<string, unknown> | null;
    if (!raw) return [];
    const profile = (Array.isArray(raw.profiles) ? raw.profiles[0] : raw.profiles) as StudentRow["profile"] | null;
    if (!profile) return [];
    return [{ profile, student: { id: raw.id as string, level: raw.level as string, xp: (raw.xp as number) ?? 0 } }];
  });

  // Thèmes affectés à la classe
  const { data: assignmentsRaw } = await supabase
    .from("theme_assignments")
    .select("theme_id, themes(id, title)")
    .eq("class_id", classId)
    .eq("teacher_id", user.id);

  const themes: ThemeRef[] = (assignmentsRaw ?? []).map((a: Record<string, unknown>) => {
    const t = Array.isArray(a.themes) ? a.themes[0] : a.themes;
    return t as ThemeRef;
  }).filter(Boolean);

  const themeIds = themes.map((t) => t.id);

  // Chapitres + leçons des thèmes affectés (via admin pour bypass RLS)
  const admin = createAdminClient();
  let lessonsByTheme = new Map<string, LessonRef[]>();

  if (themeIds.length) {
    const { data: chaptersRaw } = await admin
      .from("chapters")
      .select("id, theme_id")
      .in("theme_id", themeIds) as any;

    const chapters = (chaptersRaw ?? []) as { id: string; theme_id: string }[];
    const chapterIds = chapters.map((c) => c.id);

    if (chapterIds.length) {
      const { data: lessonsRaw } = await admin
        .from("lessons")
        .select("id, title, chapter_id")
        .in("chapter_id", chapterIds)
        .order("order_index") as any;

      const lessons = (lessonsRaw ?? []) as LessonRef[];

      // Map lesson → theme_id via chapter
      const chapterToTheme = new Map(chapters.map((c) => [c.id, c.theme_id]));
      for (const l of lessons) {
        const themeId = chapterToTheme.get(l.chapter_id) ?? "";
        if (!lessonsByTheme.has(themeId)) lessonsByTheme.set(themeId, []);
        lessonsByTheme.get(themeId)!.push(l);
      }
    }
  }

  // Progression de tous les élèves (admin pour bypass RLS)
  const studentIds = students.map((s) => s.student.id);
  const allLessonIds = [...lessonsByTheme.values()].flat().map((l) => l.id);

  let progressByStudent = new Map<string, Map<string, Progress>>();
  if (studentIds.length && allLessonIds.length) {
    const { data: progressRaw } = await (admin.from("lesson_progress") as any)
      .select("student_id, lesson_id, status, score")
      .in("student_id", studentIds)
      .in("lesson_id", allLessonIds);

    for (const p of (progressRaw ?? []) as (Progress & { student_id: string })[]) {
      if (!progressByStudent.has(p.student_id)) progressByStudent.set(p.student_id, new Map());
      progressByStudent.get(p.student_id)!.set(p.lesson_id, p);
    }
  }

  // Notes manuelles existantes
  const { data: gradesRaw } = await supabase
    .from("grades")
    .select("student_id, theme_id, score, comment")
    .eq("teacher_id", user.id);

  const gradesMap = new Map<string, GradeRow>();
  ((gradesRaw ?? []) as GradeRow[]).forEach((g) =>
    gradesMap.set(`${g.student_id}-${g.theme_id}`, g)
  );

  return (
    <div>
      <PageHeader
        title={cls.name}
        subtitle={`Niveau ${cls.level} · ${students.length} élève(s)`}
        breadcrumb={[{ label: "Mes classes", href: "/prof/classes" }, { label: cls.name }]}
      />
      <div className="p-8 space-y-6">
        {!students.length ? (
          <div className="bg-white rounded-2xl border border-cream-border p-12 text-center">
            <p className="text-ink-muted font-bold">Aucun élève inscrit dans cette classe.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {students.map(({ profile, student }) => {
              const studentProgress = progressByStudent.get(student.id) ?? new Map();
              return (
                <div key={student.id} className="bg-white rounded-2xl border border-cream-border overflow-hidden">
                  {/* En-tête élève */}
                  <div className="px-6 py-4 bg-cream flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-brand-orange flex items-center justify-center text-white font-black text-sm shrink-0">
                      {profile.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-extrabold text-ink">{profile.display_name}</div>
                      <div className="text-xs text-ink-light capitalize">{student.level} · {student.xp} XP</div>
                    </div>
                  </div>

                  <div className="px-6 py-4 space-y-5">
                    {!themes.length ? (
                      <p className="text-sm text-ink-muted italic">Aucun thème affecté à cette classe.</p>
                    ) : themes.map((theme) => {
                      const lessons = lessonsByTheme.get(theme.id) ?? [];
                      const done    = lessons.filter((l) => studentProgress.get(l.id)?.status === "completed").length;
                      const pct     = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
                      const existing = gradesMap.get(`${student.id}-${theme.id}`);

                      return (
                        <div key={theme.id} className="border border-cream-border rounded-xl p-4 space-y-3">
                          {/* Thème + progression */}
                          <div className="flex items-center justify-between gap-4">
                            <div className="font-bold text-sm text-ink">{theme.title}</div>
                            <span className="text-xs font-black text-ink-muted shrink-0">{done}/{lessons.length} leçons</span>
                          </div>

                          {/* Barre de progression */}
                          <div className="h-2 rounded-full bg-cream overflow-hidden">
                            <div
                              className="h-full rounded-full bg-emerald-500 transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>

                          {/* Détail leçons */}
                          {lessons.length > 0 && (
                            <div className="grid grid-cols-2 gap-1.5">
                              {lessons.map((l) => {
                                const p    = studentProgress.get(l.id);
                                const isDone = p?.status === "completed";
                                return (
                                  <div
                                    key={l.id}
                                    className={`text-xs px-2 py-1 rounded-lg flex items-center gap-1.5 ${
                                      isDone
                                        ? "bg-emerald-50 text-emerald-700 font-bold"
                                        : "bg-gray-50 text-gray-400"
                                    }`}
                                  >
                                    <span>{isDone ? "✓" : "○"}</span>
                                    <span className="truncate">{l.title}</span>
                                    {isDone && p?.score != null && (
                                      <span className="ml-auto shrink-0 font-black">{p.score}%</span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Note manuelle du prof */}
                          <div className="pt-2 border-t border-cream-border">
                            <div className="text-xs font-bold text-ink-muted mb-2">Note du prof</div>
                            <GradeForm
                              studentId={profile.id}
                              themeId={theme.id}
                              existingScore={existing?.score ?? null}
                              existingComment={existing?.comment ?? null}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
