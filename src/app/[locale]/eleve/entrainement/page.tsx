import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type Training = {
  id: string;
  title: string;
  description: string | null;
  xp_reward: number;
  lesson_id: string;
  lesson_title: string;
  lesson_completed: boolean;
  lesson_started: boolean;
  attempts: number;
  last_completed_at: string | null;
  best_score: number | null;
};

function getFreshness(lessonCompletedAt: string | null, attempts: number): "new" | "hot" | "done" | "revision" {
  if (attempts === 0) return "new";
  if (!lessonCompletedAt) return "done";
  const daysSince = (Date.now() - new Date(lessonCompletedAt).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince <= 7) return "hot";
  if (daysSince <= 30) return "done";
  return "revision";
}

const FRESHNESS: Record<string, { icon: string; label: string; color: string; border: string }> = {
  new:      { icon: "✨", label: "Nouveau",  color: "#FDB813", border: "#FDB81340" },
  hot:      { icon: "🔥", label: "Chaud",    color: "#f97316", border: "#f9731640" },
  done:     { icon: "✅", label: "Fait",     color: "#10b981", border: "#10b98140" },
  revision: { icon: "📚", label: "Révision", color: "#a78bfa", border: "#a78bfa40" },
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

  const { data: trainingsRaw } = await (supabase.from("trainings") as any)
    .select("id, title, description, xp_reward, lesson_id, lessons(title)")
    .order("lesson_id");

  const { data: lessonProgress } = await (supabase.from("lesson_progress") as any)
    .select("lesson_id, status, completed_at")
    .eq("student_id", student.id);

  const { data: trainingProgress } = await (supabase.from("training_progress") as any)
    .select("training_id, status, score, attempts, completed_at")
    .eq("student_id", student.id);

  const lessonProgressMap = new Map((lessonProgress ?? []).map((lp: any) => [lp.lesson_id, lp]));
  const trainingProgressMap = new Map((trainingProgress ?? []).map((tp: any) => [tp.training_id, tp]));

  const trainings: Training[] = (trainingsRaw ?? []).map((t: any) => {
    const lp = lessonProgressMap.get(t.lesson_id) as any;
    const tp = trainingProgressMap.get(t.id) as any;
    return {
      id: t.id,
      title: t.title,
      description: t.description ?? null,
      xp_reward: t.xp_reward,
      lesson_id: t.lesson_id,
      lesson_title: t.lessons?.title ?? "Leçon",
      lesson_completed: lp?.status === "completed",
      lesson_started: !!lp,
      attempts: tp?.attempts ?? 0,
      last_completed_at: tp?.completed_at ?? lp?.completed_at ?? null,
      best_score: tp?.score ?? null,
    };
  });

  const available = trainings.filter(t => t.lesson_started);
  const locked    = trainings.filter(t => !t.lesson_started);
  const totalXP   = trainings.reduce((s, t) => s + t.xp_reward, 0);

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Zone d&apos;entraînement</div>
        <h1 className="text-3xl font-black text-white">💪 Mon Entraînement</h1>
        <p className="mt-2 text-sm" style={{ color: "#475569" }}>
          Révise et consolide ce que tu as appris.
        </p>
      </div>

      {/* Stats */}
      {available.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "Disponibles",   value: available.length, color: "#FDB813" },
            { label: "Complétés",     value: available.filter(t => t.attempts > 0).length, color: "#10b981" },
            { label: "XP possibles",  value: `${totalXP}`, color: "#a78bfa" },
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

      {/* Available */}
      {available.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-4" style={{ color: "#334155" }}>Disponibles</h2>
          <div className="space-y-3">
            {available.map((t) => {
              const freshness = getFreshness(t.last_completed_at, t.attempts);
              const f = FRESHNESS[freshness];
              return (
                <Link key={t.id} href={`/eleve/entrainement/${t.id}`}
                  className="block rounded-2xl p-5 transition-all hover:scale-[1.005]"
                  style={{ background: "#1e293b", border: `1px solid ${f.border}` }}>
                  <div className="flex items-start gap-4">
                    <div className="text-2xl shrink-0 mt-0.5">{f.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-black px-2 py-0.5 rounded-full font-mono"
                          style={{ background: `${f.color}20`, color: f.color, border: `1px solid ${f.border}` }}>
                          {f.label}
                        </span>
                        <span className="text-xs" style={{ color: "#475569" }}>📖 {t.lesson_title}</span>
                      </div>
                      <div className="font-black text-base text-white">{t.title}</div>
                      {t.description && <p className="text-xs mt-1 leading-relaxed" style={{ color: "#64748b" }}>{t.description}</p>}
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-xs font-mono font-bold" style={{ color: "#FDB813" }}>+{t.xp_reward} XP</span>
                        {t.attempts > 0 && (
                          <span className="text-xs font-mono" style={{ color: "#475569" }}>{t.attempts} tentative{t.attempts > 1 ? "s" : ""}</span>
                        )}
                        {t.best_score != null && (
                          <span className="text-xs font-mono" style={{ color: "#475569" }}>Meilleur : {t.best_score}%</span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 self-center" style={{ color: "#334155" }}>→</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <section>
          <h2 className="text-xs font-mono font-black uppercase tracking-widest mb-4" style={{ color: "#1e293b" }}>À débloquer</h2>
          <div className="space-y-2">
            {locked.map((t) => (
              <div key={t.id} className="rounded-2xl p-4 flex items-center gap-4"
                style={{ background: "#0f172a", border: "1px solid #1e293b", opacity: 0.5 }}>
                <div className="text-2xl">🔒</div>
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
