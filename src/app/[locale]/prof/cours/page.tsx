import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";

const LEVEL_MAP: Record<number, string> = { 1: "explorer", 2: "builder", 3: "architect" };
const LEVEL_NAMES: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };
const LEVEL_COLORS: Record<number, { bg: string; text: string; bar: string }> = {
  1: { bg: "bg-green-50 border-green-200",   text: "text-green-700",  bar: "#22c55e" },
  2: { bg: "bg-blue-50 border-blue-200",     text: "text-blue-700",   bar: "#3b82f6" },
  3: { bg: "bg-purple-50 border-purple-200", text: "text-purple-700", bar: "#a855f7" },
};

export default async function ProfCoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  // Élèves assignés à ce prof
  const { data: students } = await (admin.from("students") as any)
    .select("id, xp, level_num, profiles!profile_id(display_name)")
    .eq("teacher_id", user.id)
    .order("level_num");

  if (!students?.length) {
    return (
      <div className="max-w-3xl">
        <PageHeader title="Mes cours" subtitle="Progression de vos élèves par thème" />
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">📚</div>
          <p className="font-bold text-gray-500">Aucun élève assigné pour le moment.</p>
          <p className="text-sm text-gray-400 mt-1">Contactez un administrateur pour associer des élèves à votre compte.</p>
        </div>
      </div>
    );
  }

  // Niveaux distincts des élèves
  const levelNums = [...new Set(students.map((s: any) => s.level_num ?? 1))];
  const levelStrings = (levelNums as number[]).map((n) => LEVEL_MAP[n]).filter(Boolean);

  // Thèmes activés pour au moins un élève de ce prof
  const { data: accessRows } = await (admin.from("student_theme_access") as any)
    .select("theme_id")
    .in("student_id", students.map((s: any) => s.id));
  // [] = aucun accès configuré → aucun thème visible (accès explicite requis)
  const activatedThemeIds = accessRows?.length
    ? [...new Set((accessRows as { theme_id: string }[]).map((r) => r.theme_id))]
    : [];

  // Thèmes publiés correspondant aux niveaux des élèves
  let themesQuery = (admin.from("themes") as any)
    .select(`
      id, title, level,
      chapters (
        id, title, order_index,
        lessons ( id, title, order_index, xp_reward )
      )
    `)
    .eq("status", "published")
    .in("level", levelStrings)
    .order("title");
  if (activatedThemeIds.length === 0) {
    // Aucun thème activé pour les élèves de ce prof → on force un résultat vide
    return (
      <div className="max-w-3xl">
        <PageHeader title="Mes cours" subtitle="Progression de vos élèves par thème" />
        <div className="mt-6 bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="text-4xl mb-3">🔒</div>
          <p className="font-bold text-gray-500">Aucun thème activé pour vos élèves.</p>
          <p className="text-sm text-gray-400 mt-1">Un administrateur doit activer des thèmes pour chaque élève.</p>
        </div>
      </div>
    );
  }
  themesQuery = themesQuery.in("id", activatedThemeIds);
  const { data: themes } = await themesQuery;

  // Progression de TOUS les élèves
  const studentIds = students.map((s: any) => s.id);
  const { data: progressRaw } = await (admin.from("lesson_progress") as any)
    .select("student_id, lesson_id, status, completed_at")
    .in("student_id", studentIds);

  // Index: studentId → lessonId → {status, completed_at}
  type ProgEntry = { status: string; completed_at: string | null };
  const progressIndex = new Map<string, Map<string, ProgEntry>>();
  for (const p of progressRaw ?? []) {
    if (!progressIndex.has(p.student_id)) progressIndex.set(p.student_id, new Map());
    progressIndex.get(p.student_id)!.set(p.lesson_id, { status: p.status, completed_at: p.completed_at ?? null });
  }

  // Grouper thèmes par level
  const themesByLevel = new Map<string, any[]>();
  for (const t of themes ?? []) {
    const arr = themesByLevel.get(t.level) ?? [];
    arr.push(t);
    themesByLevel.set(t.level, arr);
  }

  return (
    <div className="max-w-5xl space-y-8">
      <PageHeader
        title="Mes cours"
        subtitle={`${students.length} élève${students.length > 1 ? "s" : ""} · ${themes?.length ?? 0} thème${(themes?.length ?? 1) > 1 ? "s" : ""} actif${(themes?.length ?? 1) > 1 ? "s" : ""}`}
      />

      {/* Par élève */}
      {students.map((student: any) => {
        const name     = student.profiles?.display_name ?? "Élève";
        const levelNum = student.level_num ?? 1;
        const levelStr = LEVEL_MAP[levelNum];
        const colors   = LEVEL_COLORS[levelNum];
        const prog     = progressIndex.get(student.id) ?? new Map<string, ProgEntry>();
        const studentThemes = themesByLevel.get(levelStr) ?? [];

        // Toutes les leçons de ce niveau
        const allLessons = studentThemes.flatMap((t: any) =>
          (t.chapters ?? []).flatMap((c: any) => c.lessons ?? [])
        );
        const totalLessons = allLessons.length;
        const doneLessons  = allLessons.filter((l: any) => prog.get(l.id)?.status === "completed").length;
        const pct          = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;

        // Dernière leçon active (la plus récente non terminée, ou la première non commencée)
        const lastActive = allLessons
          .map((l: any) => ({ ...l, entry: prog.get(l.id) }))
          .filter((l: any) => l.entry && l.entry.status !== "completed")
          .sort((a: any, b: any) => new Date(b.entry.completed_at).getTime() - new Date(a.entry.completed_at).getTime())[0]
          ?? allLessons.find((l: any) => !prog.get(l.id)); // première pas commencée

        return (
          <div key={student.id} className="bg-white border border-gray-100 rounded-3xl shadow-sm overflow-hidden">

            {/* Header élève */}
            <div className={`flex items-center gap-4 px-6 py-4 border-b ${colors.bg}`}>
              <div className="w-10 h-10 rounded-2xl bg-white/70 border border-white flex items-center justify-center text-lg shadow-sm">
                {levelNum === 3 ? "🏛️" : levelNum === 2 ? "🔨" : "🧭"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-gray-900 text-base">{name}</div>
                <div className={`text-xs font-black ${colors.text}`}>{LEVEL_NAMES[levelNum]} · {student.xp ?? 0} XP</div>
              </div>
              <div className="flex items-center gap-4">
                {/* Barre de progression globale */}
                <div className="text-right">
                  <div className={`text-lg font-black ${colors.text}`}>{pct}%</div>
                  <div className="text-xs text-gray-400">{doneLessons}/{totalLessons} leçons</div>
                </div>
                <div className="w-24">
                  <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, background: colors.bar }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Continuer là où il s'est arrêté */}
            {lastActive && (
              <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-100">
                <span className="text-lg">▶️</span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-black text-amber-700 uppercase tracking-wider">Continuer</div>
                  <div className="text-sm font-black text-amber-900 truncate">{lastActive.title}</div>
                </div>
                {lastActive.entry && (
                  <span className="text-xs font-black bg-amber-200 text-amber-800 px-2 py-1 rounded-full">
                    En cours
                  </span>
                )}
                {!lastActive.entry && (
                  <span className="text-xs font-black bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                    Non commencé
                  </span>
                )}
              </div>
            )}
            {!lastActive && doneLessons === totalLessons && totalLessons > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 bg-green-50 border-b border-green-100">
                <span className="text-lg">🏆</span>
                <div className="text-sm font-black text-green-800">Toutes les leçons de ce niveau sont terminées !</div>
              </div>
            )}

            {/* Thèmes & leçons */}
            <div className="divide-y divide-gray-50">
              {studentThemes.length === 0 && (
                <div className="px-6 py-8 text-center text-gray-400 text-sm">
                  Aucun thème publié pour ce niveau.
                </div>
              )}
              {studentThemes.map((theme: any) => {
                const chapters = [...(theme.chapters ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
                const themeLessons = chapters.flatMap((c: any) => c.lessons ?? []);
                const themeDone = themeLessons.filter((l: any) => prog.get(l.id)?.status === "completed").length;
                const themeTotal = themeLessons.length;
                const themePct = themeTotal > 0 ? Math.round((themeDone / themeTotal) * 100) : 0;

                return (
                  <details key={theme.id} className="group">
                    <summary className="flex items-center gap-4 px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors list-none">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-gray-900 text-sm">{theme.title}</span>
                          <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            {themeDone}/{themeTotal} leçons
                          </span>
                        </div>
                      </div>
                      {/* Mini barre thème */}
                      <div className="w-32 shrink-0">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${themePct}%`, background: colors.bar }}
                            />
                          </div>
                          <span className="text-xs font-black text-gray-400 w-8 text-right">{themePct}%</span>
                        </div>
                      </div>
                      <span className="text-gray-300 text-xs group-open:rotate-90 transition-transform">▶</span>
                    </summary>

                    {/* Chapitres et leçons */}
                    <div className="px-6 pb-4 space-y-3">
                      {chapters.map((chapter: any) => {
                        const lessons = [...(chapter.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
                        return (
                          <div key={chapter.id}>
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">
                              {chapter.title}
                            </div>
                            <div className="space-y-1">
                              {lessons.map((lesson: any) => {
                                const entry  = prog.get(lesson.id);
                                const isDone = entry?.status === "completed";
                                const isInProgress = entry && !isDone;
                                const isNext = lastActive?.id === lesson.id;
                                return (
                                  <div
                                    key={lesson.id}
                                    className={`flex items-center gap-3 rounded-xl px-3 py-2 transition-colors group ${
                                      isNext
                                        ? "bg-amber-50 border border-amber-200"
                                        : isDone
                                        ? "bg-green-50/60"
                                        : isInProgress
                                        ? "bg-blue-50"
                                        : "bg-gray-50"
                                    }`}
                                  >
                                    {/* Statut icône */}
                                    <span className="text-base shrink-0">
                                      {isDone ? "✅" : isInProgress ? "🔵" : isNext ? "▶️" : "⬜"}
                                    </span>
                                    <span className={`flex-1 text-sm font-bold truncate ${
                                      isDone ? "text-green-700 line-through opacity-60"
                                      : isNext ? "text-amber-900"
                                      : isInProgress ? "text-blue-800"
                                      : "text-gray-600"
                                    }`}>
                                      {lesson.title}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                      {lesson.xp_reward && (
                                        <span className="text-[10px] font-black text-gray-400">+{lesson.xp_reward} XP</span>
                                      )}
                                      {isNext && (
                                        <span className="text-[10px] font-black bg-amber-500 text-white px-2 py-0.5 rounded-full">À faire</span>
                                      )}
                                      {isDone && entry?.completed_at && (
                                        <span className="text-[10px] text-green-600 font-bold">
                                          {new Date(entry.completed_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                                        </span>
                                      )}
                                      <Link
                                        href={`/fr/prof/cours/${theme.id}/lecons/${lesson.id}`}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] font-black text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-full"
                                      >
                                        Voir →
                                      </Link>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </details>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
