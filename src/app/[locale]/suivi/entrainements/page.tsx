import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function SuiviEntrainenementsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const { locale } = await params;
  const { child: childParam } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const { data: links } = await (supabase.from("parent_children") as any)
    .select("student_id, students(id, profiles!students_profile_id_fkey(display_name))")
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => l.students).filter(Boolean);
  if (children.length === 0) redirect(`/${locale}/suivi`);

  const child = children.find((c: any) => c.id === childParam) ?? children[0];

  const admin = createAdminClient();

  // Thèmes accessibles à cet enfant
  const { data: accessRows } = await (admin.from("student_theme_access") as any)
    .select("theme_id")
    .eq("student_id", child.id);
  const accessibleThemeIds = new Set((accessRows ?? []).map((r: { theme_id: string }) => r.theme_id));

  const { data: trainingsRaw } = await (admin.from("trainings") as any)
    .select("id, title, description, xp_reward, lesson_id, lessons(id, title, theme_id, themes(id, title))")
    .order("lesson_id");

  const { data: trainingProgressRaw } = await (admin.from("training_progress") as any)
    .select("training_id, score, attempts, completed_at")
    .eq("student_id", child.id);

  const progressMap = new Map((trainingProgressRaw ?? []).map((tp: any) => [tp.training_id, tp]));

  type Group = { themeTitle: string; lessons: { lessonTitle: string; trainings: any[] }[] };
  const grouped = new Map<string, Group>();

  for (const t of (trainingsRaw ?? []).filter((t: any) => accessibleThemeIds.has(t.lessons?.themes?.id))) {
    const lesson = t.lessons;
    const theme  = lesson?.themes;
    const themeId = theme?.id ?? "other";
    const themeTitle = theme?.title ?? "Autre";

    if (!grouped.has(themeId)) grouped.set(themeId, { themeTitle, lessons: [] });
    const group = grouped.get(themeId)!;

    let lessonGroup = group.lessons.find((lg) => lg.lessonTitle === (lesson?.title ?? "Leçon"));
    if (!lessonGroup) {
      lessonGroup = { lessonTitle: lesson?.title ?? "Leçon", trainings: [] };
      group.lessons.push(lessonGroup);
    }
    lessonGroup.trainings.push({ ...t, progress: progressMap.get(t.id) ?? null });
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Entraînements</h1>
        <p className="text-slate-400 text-sm">Consultez les entraînements de votre enfant — mode observation.</p>
      </div>

      {/* Sélecteur enfant */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c: any) => {
            const active = c.id === child.id;
            return (
              <Link
                key={c.id}
                href={`/${locale}/suivi/entrainements?child=${c.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? "bg-blue-900 text-white border border-blue-600"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white"
                }`}
              >
                👦 {c.profiles?.display_name ?? "Enfant"}
              </Link>
            );
          })}
        </div>
      )}

      {/* Bandeau mode entraîneur */}
      <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-3">
        <span className="text-xl">👁</span>
        <div>
          <div className="text-sm font-black text-amber-300">Mode Entraîneur</div>
          <div className="text-xs text-amber-500">Vous observez les entraînements de <strong>{child.profiles?.display_name}</strong>. Aucune interaction n'est possible.</div>
        </div>
      </div>

      {/* Groupes par thème */}
      {[...grouped.values()].map((group) => (
        <div key={group.themeTitle}>
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">📚 {group.themeTitle}</h2>
          <div className="space-y-3">
            {group.lessons.map((lg) => (
              <div key={lg.lessonTitle} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700">
                  <div className="text-xs font-black text-slate-400">📖 {lg.lessonTitle}</div>
                </div>
                <div className="divide-y divide-slate-700/50">
                  {lg.trainings.map((t: any) => {
                    const p = t.progress;
                    const done = !!p?.completed_at;
                    return (
                      <Link
                        key={t.id}
                        href={`/${locale}/suivi/entrainements/${t.id}?child=${child.id}`}
                        className="flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 ${done ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-400"}`}>
                            {done ? "✓" : "✦"}
                          </div>
                          <div className="min-w-0">
                            <div className={`text-sm font-bold truncate ${done ? "text-white" : "text-slate-300"}`}>{t.title}</div>
                            {t.description && <div className="text-xs text-slate-500 truncate">{t.description}</div>}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                          {p && (
                            <div className="text-right hidden sm:block">
                              {p.score != null && <div className="text-xs font-bold text-slate-300">{p.score}/100</div>}
                              {p.attempts > 0 && <div className="text-[11px] text-slate-500">{p.attempts} essai{p.attempts > 1 ? "s" : ""}</div>}
                            </div>
                          )}
                          <span className={`text-xs font-black px-2 py-0.5 rounded-full whitespace-nowrap ${done ? "bg-emerald-900 text-emerald-300" : "bg-slate-700 text-slate-500"}`}>
                            {done ? "✓ Fait" : "À faire"}
                          </span>
                          <span className="text-slate-600 text-xs">›</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {grouped.size === 0 && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">💪</div>
          <div className="font-bold text-white mb-1">Aucun entraînement disponible</div>
          <div className="text-sm text-slate-400">Les entraînements apparaîtront ici au fur et à mesure des leçons.</div>
        </div>
      )}
    </div>
  );
}
