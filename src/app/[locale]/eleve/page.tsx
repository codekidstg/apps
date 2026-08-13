export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

type LessonRow    = { id: string; title: string; xp_reward: number; chapter_id: string };
type ProgressRow  = { lesson_id: string; status: string };
type Chapter      = { id: string; title: string; theme_id: string };
type Theme        = { id: string; title: string; level: string };
type Achievement  = { badge_id: string; earned_at: string };

const LEVEL_META: Record<string, { label: string; icon: string; color: string }> = {
  explorer: { label: "Explorateur",  icon: "🌱", color: "#10b981" },
  builder:  { label: "Bâtisseur",   icon: "🔨", color: "#a78bfa" },
  architect:{ label: "Architecte",  icon: "🏛️", color: "#60a5fa" },
};

const THEME_ICONS = ["🏛️","🔁","🌉","🧪","🐍","🌐","🔒","🤖","⚡","🧠"];

export default async function EleveDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id, xp, streak_days, level, teacher_id")
    .eq("profile_id", user.id)
    .single<{ id: string; xp: number; streak_days: number; level: string; teacher_id: string | null }>();
  if (!student) redirect("/fr/connexion");

  const admin = createAdminClient();

  // Thèmes accessibles à cet élève
  // Si l'élève a un prof assigné → uniquement les thèmes activés pour lui (même si vide)
  // Si pas de prof → tout afficher (accès libre)
  const { data: accessRows } = await (admin.from("student_theme_access") as any)
    .select("theme_id")
    .eq("student_id", student.id);
  const accessibleThemeIds = (accessRows?.length || student.teacher_id)
    ? new Set((accessRows ?? []).map((r: { theme_id: string }) => r.theme_id))
    : null; // null = pas de prof et aucun accès configuré → afficher tout

  const [{ data: themesRaw }, { data: chaptersRaw }, { data: lessonsRaw }, { data: progressRaw }, { data: achievementsRaw }, { data: trainingsRaw }, { data: trainingProgressRaw }] =
    await Promise.all([
      (admin.from("themes") as any).select("id, title, level").eq("status", "published").order("level").order("order_index"),
      (admin.from("chapters") as any).select("id, title, theme_id, order_index").order("order_index"),
      (admin.from("lessons") as any).select("id, title, xp_reward, chapter_id").order("order_index"),
      (supabase.from("lesson_progress") as any).select("lesson_id, status").eq("student_id", student.id),
      (supabase.from("student_achievements") as any).select("badge_id, earned_at").eq("student_id", student.id).order("earned_at", { ascending: false }),
      (admin.from("trainings") as any).select("id, lesson_id"),
      (supabase.from("training_progress") as any).select("training_id, attempts").eq("student_id", student.id),
    ]);

  const allThemes: Theme[]     = themesRaw  ?? [];
  const themes: Theme[]       = accessibleThemeIds
    ? allThemes.filter((t) => accessibleThemeIds.has(t.id))
    : allThemes;
  const chapters: Chapter[]   = chaptersRaw ?? [];
  const lessons: LessonRow[]  = lessonsRaw  ?? [];
  const progress: ProgressRow[]= progressRaw ?? [];
  const achievements: Achievement[] = achievementsRaw ?? [];

  const progressMap = new Map(progress.map((p) => [p.lesson_id, p.status]));

  const chaptersByTheme = new Map<string, Chapter[]>();
  for (const ch of chapters) {
    if (!chaptersByTheme.has(ch.theme_id)) chaptersByTheme.set(ch.theme_id, []);
    chaptersByTheme.get(ch.theme_id)!.push(ch);
  }
  const lessonsByChapter = new Map<string, LessonRow[]>();
  for (const l of lessons) {
    if (!lessonsByChapter.has(l.chapter_id)) lessonsByChapter.set(l.chapter_id, []);
    lessonsByChapter.get(l.chapter_id)!.push(l);
  }

  function themeLessons(themeId: string): LessonRow[] {
    return (chaptersByTheme.get(themeId) ?? []).flatMap((ch) => lessonsByChapter.get(ch.id) ?? []);
  }

  const completedCount = progress.filter((p) => p.status === "completed").length;
  const nextLesson     = lessons.find((l) => progressMap.get(l.id) !== "completed");

  // Entraînements disponibles (leçon commencée) et non encore faits
  const startedLessonIds = new Set(progress.map((p: any) => p.lesson_id));
  const doneTrainingIds  = new Set((trainingProgressRaw ?? []).filter((tp: any) => tp.attempts > 0).map((tp: any) => tp.training_id));
  const availableTrainings = (trainingsRaw ?? []).filter((t: any) => startedLessonIds.has(t.lesson_id) && !doneTrainingIds.has(t.id));
  const trainingBadgeCount = availableTrainings.length;

  const levels = ["explorer", "builder", "architect"] as const;
  const themesByLevel = new Map<string, Theme[]>();
  for (const t of themes) {
    if (!themesByLevel.has(t.level)) themesByLevel.set(t.level, []);
    themesByLevel.get(t.level)!.push(t);
  }

  const studentLevel = student.level ?? "explorer";

  return (
    <div className="p-8 space-y-8 max-w-4xl">
      {/* Top HUD */}
      <div className="flex items-center gap-3 pb-6" style={{ borderBottom: "1px solid #1e293b" }}>
        <div>
          <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Ma Cité Numérique</div>
          <h1 className="text-3xl font-black text-white">Tableau de bord</h1>
        </div>
        <div className="ml-auto flex items-center gap-4 text-xs font-mono">
          <span style={{ color: "#475569" }}>STREAK</span>
          <span className="font-black" style={{ color: "#f97316" }}>🔥 {student.streak_days}j</span>
          <span style={{ color: "#334155" }}>|</span>
          <span style={{ color: "#475569" }}>NIVEAU</span>
          <span className="font-black" style={{ color: LEVEL_META[studentLevel]?.color ?? "#10b981" }}>
            {LEVEL_META[studentLevel]?.icon} {LEVEL_META[studentLevel]?.label}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { value: completedCount, label: "Leçons terminées", color: "#FDB813", icon: "⚔️" },
          { value: achievements.length, label: "Badges gagnés", color: "#a78bfa", icon: "⭐" },
          { value: student.xp.toLocaleString(), label: "XP total", color: "#10b981", icon: "⚡" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl p-5 text-center" style={{ background: "#1e293b", border: "1px solid #334155" }}>
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs font-bold mt-1" style={{ color: "#475569" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Next quest CTA */}
      {nextLesson && (
        <Link
          href={`/eleve/quete/${nextLesson.id}`}
          className="block rounded-2xl p-6 relative overflow-hidden transition-all hover:scale-[1.01]"
          style={{
            background: "linear-gradient(135deg, #1a2f1a, #1e293b)",
            border: "1px solid #FDB81340",
            boxShadow: "0 0 30px #FDB81315",
          }}
        >
          <div className="absolute top-0 right-0 w-32 h-32 opacity-10 text-8xl flex items-center justify-center select-none">⚔️</div>
          <div className="text-xs font-mono font-black uppercase tracking-widest mb-2" style={{ color: "#FDB813" }}>◈ Prochaine quête</div>
          <div className="text-xl font-black text-white">{nextLesson.title}</div>
          <div className="text-sm mt-2 font-bold" style={{ color: "#FDB813" }}>
            +{nextLesson.xp_reward} XP → Commencer maintenant
          </div>
        </Link>
      )}

      {/* Themes */}
      {levels.filter((lvl) => lvl === studentLevel).map((lvl) => {
        const lvlThemes = themesByLevel.get(lvl) ?? [];
        if (!lvlThemes.length) return null;
        const meta = LEVEL_META[lvl];

        return (
          <div key={lvl}>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xl">{meta.icon}</span>
              <h2 className="font-black text-lg text-white">{meta.label}s</h2>
              <span className="text-xs font-mono font-black px-2 py-0.5 rounded-full" style={{ background: `${meta.color}20`, color: meta.color, border: `1px solid ${meta.color}40` }}>
                ◈ Ton niveau
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {lvlThemes.map((theme, idx) => {
                const tl   = themeLessons(theme.id);
                const done = tl.filter((l) => progressMap.get(l.id) === "completed").length;
                const pct  = tl.length ? Math.round((done / tl.length) * 100) : 0;
                const icon = THEME_ICONS[idx % THEME_ICONS.length];
                const locked = lvl !== "explorer" && lvl !== studentLevel && !tl.some((l) => progressMap.has(l.id));

                return (
                  <Link
                    key={theme.id}
                    href={locked ? "#" : `/eleve/theme/${theme.id}`}
                    className="block rounded-2xl p-5 transition-all hover:scale-[1.01]"
                    style={{
                      background: "#1e293b",
                      border: pct === 100 ? "1px solid #10b98140" : "1px solid #334155",
                      boxShadow: pct === 100 ? "0 0 20px #10b98110" : "none",
                      opacity: locked ? 0.4 : 1,
                      cursor: locked ? "not-allowed" : "pointer",
                    }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: "#0f172a" }}>
                        {locked ? "🔒" : icon}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-sm text-white truncate">{theme.title}</div>
                        <div className="text-xs mt-0.5 font-mono" style={{ color: "#475569" }}>{done}/{tl.length} leçons</div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 rounded-full overflow-hidden mb-3" style={{ background: "#0f172a" }}>
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: pct === 100 ? "#10b981" : "#FDB813" }} />
                    </div>
                    {!locked && (
                      <div className="flex flex-wrap gap-1.5">
                        {tl.slice(0, 4).map((l) => {
                          const isDone = progressMap.get(l.id) === "completed";
                          return (
                            <span key={l.id} className="text-xs font-bold px-2 py-0.5 rounded-lg"
                              style={{
                                background: isDone ? "#10b98120" : "#0f172a",
                                color: isDone ? "#10b981" : "#475569",
                                border: isDone ? "1px solid #10b98140" : "1px solid #1e293b",
                              }}>
                              {isDone ? "✓" : ""} {l.title.length > 10 ? l.title.slice(0, 10) + "…" : l.title}
                            </span>
                          );
                        })}
                        {tl.length > 4 && <span className="text-xs px-2 py-0.5" style={{ color: "#475569" }}>+{tl.length - 4}</span>}
                      </div>
                    )}
                    {locked && <div className="text-xs" style={{ color: "#475569" }}>Complète le niveau précédent</div>}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Recent badges */}
      {achievements.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-lg text-white">Derniers badges</h2>
            <Link href="/eleve/badges" className="text-xs font-black hover:underline" style={{ color: "#FDB813" }}>
              Tous les badges →
            </Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {achievements.slice(0, 6).map((a) => (
              <div key={a.badge_id} className="rounded-xl px-4 py-3 text-center" style={{ background: "#1e293b", border: "1px solid #334155" }}>
                <div className="text-2xl">🏆</div>
                <div className="text-xs font-bold mt-1 text-white">{a.badge_id}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
