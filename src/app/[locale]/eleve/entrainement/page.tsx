export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import Link from "next/link";
import TrainingAccordion from "./TrainingAccordion";

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

  const lessonProgressMap  = new Map((lessonProgress  ?? []).map((lp: any) => [lp.lesson_id,     lp]));
  const trainingProgressMap = new Map((trainingProgress ?? []).map((tp: any) => [tp.training_id, tp]));

  // Trouver la leçon la plus récemment terminée (pour l'ouvrir par défaut)
  const completedLessons = (lessonProgress ?? [])
    .filter((lp: any) => lp.status === "completed" && lp.completed_at)
    .sort((a: any, b: any) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime());
  const lastCompletedLessonId: string | null = completedLessons[0]?.lesson_id ?? null;

  type Training = {
    id: string; title: string; description: string | null; xp_reward: number;
    lesson_id: string; lesson_title: string; lesson_completed_at: string | null;
    theme_id: string; theme_title: string; theme_level: string;
    attempts: number; last_completed_at: string | null; best_score: number | null;
    lesson_started: boolean;
  };

  const allTrainings: Training[] = (trainingsRaw ?? []).map((t: any) => {
    const lp = lessonProgressMap.get(t.lesson_id) as any;
    const tp = trainingProgressMap.get(t.id) as any;
    const lesson = t.lessons;
    const theme  = lesson?.themes;
    return {
      id: t.id, title: t.title, description: t.description ?? null, xp_reward: t.xp_reward,
      lesson_id: t.lesson_id, lesson_title: lesson?.title ?? "Leçon",
      lesson_completed_at: lp?.completed_at ?? null,
      theme_id: theme?.id ?? "", theme_title: theme?.title ?? "Thème", theme_level: theme?.level ?? "explorer",
      attempts: tp?.attempts ?? 0, last_completed_at: tp?.completed_at ?? null,
      best_score: tp?.score ?? null, lesson_started: !!lp,
    };
  });

  const available = allTrainings.filter(t => t.lesson_started);
  const locked    = allTrainings.filter(t => !t.lesson_started);

  // Grouper thème → leçon
  type LessonGroup = { lessonId: string; lessonTitle: string; lessonCompletedAt: string | null; trainings: Training[] };
  type ThemeGroup  = { themeId: string; themeTitle: string; themeLevel: string; lessons: LessonGroup[] };

  const grouped: ThemeGroup[] = [];
  const themeMap = new Map<string, ThemeGroup>();

  for (const t of available) {
    if (!themeMap.has(t.theme_id)) {
      const g: ThemeGroup = { themeId: t.theme_id, themeTitle: t.theme_title, themeLevel: t.theme_level, lessons: [] };
      themeMap.set(t.theme_id, g);
      grouped.push(g);
    }
    const group = themeMap.get(t.theme_id)!;
    let lg = group.lessons.find(l => l.lessonId === t.lesson_id);
    if (!lg) {
      lg = { lessonId: t.lesson_id, lessonTitle: t.lesson_title, lessonCompletedAt: t.lesson_completed_at, trainings: [] };
      group.lessons.push(lg);
    }
    lg.trainings.push({ id: t.id, title: t.title, description: t.description, xp_reward: t.xp_reward, attempts: t.attempts, best_score: t.best_score, last_completed_at: t.last_completed_at } as any);
  }

  const totalDone = available.filter(t => t.attempts > 0).length;
  const totalXP   = available.reduce((s, t) => s + t.xp_reward, 0);

  return (
    <div className="p-6 lg:p-10 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Zone d&apos;entraînement</div>
        <h1 className="text-3xl font-black text-white">💪 Mon Entraînement</h1>
        <p className="mt-2 text-sm" style={{ color: "#475569" }}>Révise et consolide ce que tu as appris.</p>
      </div>

      {/* Stats */}
      {available.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
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

      {/* Accordion thème → leçon */}
      {grouped.length > 0 && (
        <TrainingAccordion groups={grouped} defaultOpenLessonId={lastCompletedLessonId} />
      )}

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
