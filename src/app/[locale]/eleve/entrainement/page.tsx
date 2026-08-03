export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";

type Training = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  lesson_id: string;
  lesson_title: string;
  theme_id: string;
  theme_title: string;
  theme_level: string;
  attempts: number;
  last_completed_at: string | null;
  best_score: number | null;
};

function getFreshness(last: string | null, attempts: number): "new" | "hot" | "done" | "revision" {
  if (attempts === 0) return "new";
  if (!last) return "done";
  const days = (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24);
  if (days <= 7)  return "hot";
  if (days <= 30) return "done";
  return "revision";
}

const FRESHNESS: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  new:      { icon: "✨", label: "Nouveau",  color: "#FDB813", bg: "#FDB81320" },
  hot:      { icon: "🔥", label: "Chaud",    color: "#f97316", bg: "#f9731620" },
  done:     { icon: "✅", label: "Fait",     color: "#10b981", bg: "#10b98120" },
  revision: { icon: "📚", label: "Révision", color: "#a78bfa", bg: "#a78bfa20" },
};

const LEVEL_META: Record<string, { icon: string; color: string; label: string }> = {
  explorer:  { icon: "🌱", color: "#10b981", label: "Explorateur" },
  builder:   { icon: "🔨", color: "#a78bfa", label: "Bâtisseur" },
  architect: { icon: "🏛️", color: "#60a5fa", label: "Architecte" },
};

export default async function EntrainementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();
  if (!student) redirect("/fr/connexion");

  const admin = createAdminClient();

  const { data: trainingsRaw } = await (admin.from("trainings") as any)
    .select("id, title, description, xp_reward, lesson_id, lessons(id, title, theme_id, themes(id, title, level))")
    .order("lesson_id");

  const { data: lessonProgress } = await (supabase.from("lesson_progress") as any)
    .select("lesson_id, status, completed_at")
    .eq("student_id", student.id);

  const { data: trainingProgress } = await (supabase.from("training_progress") as any)
    .select("training_id, score, attempts, completed_at")
    .eq("student_id", student.id);

  const lessonProgressMap = new Map((lessonProgress ?? []).map((lp: any) => [lp.lesson_id, lp]));
  const trainingProgressMap = new Map((trainingProgress ?? []).map((tp: any) => [tp.training_id, tp]));

  const allTrainings: (Training & { lesson_started: boolean })[] = (trainingsRaw ?? []).map((t: any) => {
    const lp = lessonProgressMap.get(t.lesson_id) as any;
    const tp = trainingProgressMap.get(t.id) as any;
    const lesson = t.lessons;
    const theme = lesson?.themes;
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      xp_reward: t.xp_reward,
      lesson_id: t.lesson_id,
      lesson_title: lesson?.title ?? "Leçon",
      theme_id: theme?.id ?? "",
      theme_title: theme?.title ?? "Thème",
      theme_level: theme?.level ?? "explorer",
      attempts: tp?.attempts ?? 0,
      last_completed_at: tp?.completed_at ?? null,
      best_score: tp?.score ?? null,
      lesson_started: !!lp,
    };
  });

  const available = allTrainings.filter(t => t.lesson_started);
  const locked    = allTrainings.filter(t => !t.lesson_started);

  // Grouper par thème → par leçon
  type Group = { themeId: string; themeTitle: string; themeLevel: string; lessons: { lessonId: string; lessonTitle: string; trainings: typeof available }[] };
  const grouped: Group[] = [];
  const themeMap = new Map<string, Group>();

  for (const t of available) {
    if (!themeMap.has(t.theme_id)) {
      const g: Group = { themeId: t.theme_id, themeTitle: t.theme_title, themeLevel: t.theme_level, lessons: [] };
      themeMap.set(t.theme_id, g);
      grouped.push(g);
    }
    const group = themeMap.get(t.theme_id)!;
    let lessonGroup = group.lessons.find(l => l.lessonId === t.lesson_id);
    if (!lessonGroup) {
      lessonGroup = { lessonId: t.lesson_id, lessonTitle: t.lesson_title, trainings: [] };
      group.lessons.push(lessonGroup);
    }
    lessonGroup.trainings.push(t);
  }

  const totalDone = available.filter(t => t.attempts > 0).length;
  const totalXP   = available.reduce((s, t) => s + t.xp_reward, 0);

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Zone d&apos;entraînement</div>
        <h1 className="text-3xl font-black text-white">💪 Mon Entraînement</h1>
        <p className="mt-2 text-sm" style={{ color: "#475569" }}>Révise et consolide ce que tu as appris.</p>
      </div>

      {/* Stats */}
      {available.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { label: "Disponibles",  value: available.length, color: "#FDB813" },
            { label: "Complétés",    value: totalDone,        color: "#10b981" },
            { label: "XP possibles", value: `${totalXP}`,     color: "#a78bfa" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-5 text-center" style={{ background: "#1e293b", border: "1px solid #334155" }}>
              <div className="text-2xl font-black font-mono" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs font-bold mt-1" style={{ color: "#475569" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {available.length === 0 && locked.length === 0 && (
        <div className="text-center py-20 rounded-2xl" style={{ background: "#1e293b", border: "1px solid #334155" }}>
          <div className="text-5xl mb-4">🏗️</div>
          <div className="text-xl font-black text-white mb-2">Aucun entraînement disponible</div>
          <p className="text-sm" style={{ color: "#475569" }}>Les entraînements apparaîtront ici dès que ton prof en aura créé.</p>
        </div>
      )}

      {/* Groupés par thème → leçon */}
      {grouped.map((group) => {
        const meta = LEVEL_META[group.themeLevel] ?? LEVEL_META.explorer;
        const doneInTheme = group.lessons.flatMap(l => l.trainings).filter(t => t.attempts > 0).length;
        const totalInTheme = group.lessons.flatMap(l => l.trainings).length;

        return (
          <section key={group.themeId} className="mb-8">
            {/* Header thème */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-lg">{meta.icon}</span>
              <div className="flex-1">
                <div className="font-black text-white">{group.themeTitle}</div>
                <div className="text-xs font-mono mt-0.5" style={{ color: meta.color }}>{meta.label}</div>
              </div>
              <span className="text-xs font-mono" style={{ color: "#475569" }}>
                {doneInTheme}/{totalInTheme} faits
              </span>
              {/* Progress bar mini */}
              <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
                <div className="h-full rounded-full transition-all" style={{ width: `${Math.round((doneInTheme/totalInTheme)*100)}%`, background: meta.color }} />
              </div>
            </div>

            {/* Leçons */}
            <div className="space-y-4 pl-4 border-l-2" style={{ borderColor: `${meta.color}30` }}>
              {group.lessons.map((lesson) => (
                <div key={lesson.lessonId}>
                  {/* Label leçon */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ background: "#1e293b", color: "#475569" }}>
                      📖 {lesson.lessonTitle}
                    </span>
                  </div>

                  {/* Trainings de cette leçon */}
                  <div className="space-y-2">
                    {lesson.trainings.map((t) => {
                      const freshness = getFreshness(t.last_completed_at, t.attempts);
                      const f = FRESHNESS[freshness];
                      return (
                        <Link key={t.id} href={`/eleve/entrainement/${t.id}`}
                          className="block rounded-2xl p-4 transition-all hover:scale-[1.005]"
                          style={{ background: "#1e293b", border: `1px solid ${f.bg}`, borderColor: t.attempts > 0 ? "#10b98130" : "#334155" }}>
                          <div className="flex items-center gap-3">
                            <span className="text-xl shrink-0">{f.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className="text-xs font-black px-2 py-0.5 rounded-full"
                                  style={{ background: f.bg, color: f.color }}>
                                  {f.label}
                                </span>
                              </div>
                              <div className="font-black text-sm text-white">{t.title}</div>
                              {t.description && <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{t.description}</p>}
                            </div>
                            <div className="text-right shrink-0 space-y-1">
                              <div className="text-xs font-mono font-bold" style={{ color: "#FDB813" }}>+{t.xp_reward} XP</div>
                              {t.best_score != null && (
                                <div className="text-xs font-mono" style={{ color: "#10b981" }}>⭐ {t.best_score}%</div>
                              )}
                              {t.attempts > 0 && (
                                <div className="text-xs font-mono" style={{ color: "#334155" }}>{t.attempts}×</div>
                              )}
                            </div>
                            <span style={{ color: "#334155" }}>→</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      {/* Verrouillés */}
      {locked.length > 0 && (
        <section className="mt-6">
          <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-3" style={{ color: "#1e293b" }}>🔒 À débloquer ({locked.length})</h2>
          <div className="space-y-2">
            {locked.map((t) => (
              <div key={t.id} className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: "#0f172a", border: "1px solid #1e293b", opacity: 0.5 }}>
                <span className="text-lg">🔒</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-sm" style={{ color: "#334155" }}>{t.title}</div>
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "#1e293b" }}>Commence d&apos;abord : {t.lesson_title}</div>
                </div>
                <Link href={`/eleve/quete/${t.lesson_id}`}
                  className="text-xs font-bold hover:underline shrink-0" style={{ color: "#FDB813" }}>
                  Voir la leçon →
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
