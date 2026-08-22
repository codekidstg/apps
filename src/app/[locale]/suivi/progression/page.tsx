import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import { requireParentPermission } from "@/lib/permissions/parent";

export default async function ProgressionPage({
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
    .select("student_id, students(id, xp, level_num, profiles!students_profile_id_fkey(display_name))")
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => l.students).filter(Boolean);
  if (children.length === 0) redirect(`/${locale}/suivi`);

  await requireParentPermission(user.id, "parent.progression", locale);

  // Sélection de l'enfant via ?child=<id>, sinon le premier
  const child = children.find((c: any) => c.id === childParam) ?? children[0];

  const LEVEL_MAP: Record<number, string> = { 1: "explorer", 2: "builder", 3: "architect" };
  const childLevel = LEVEL_MAP[child.level_num ?? 1] ?? "explorer";

  const admin = createAdminClient();
  const [{ data: progRaw }, { data: themes }] = await Promise.all([
    (admin.from("lesson_progress") as any)
      .select("lesson_id, status, score, attempts, completed_at")
      .eq("student_id", child.id),
    admin
      .from("themes")
      .select("id, title, order_index, chapters(id, title, order_index, lessons(id, title, order_index))")
      .eq("status", "published")
      .eq("level", childLevel)
      // Le parent suit une progression : l'ordre doit être celui du programme
      .order("order_index"),
  ]);

  const progMap = new Map<string, { status: string; score?: number; attempts?: number }>(
    (progRaw ?? []).map((p: any) => [p.lesson_id, p])
  );
  // Leçons commencées par l'enfant
  const startedLessonIds = new Set((progRaw ?? []).map((p: any) => p.lesson_id));

  // Filtrer : garder seulement les chapitres/leçons que l'enfant a commencés
  const filteredThemes = (themes ?? []).map((theme: any) => ({
    ...theme,
    chapters: (theme.chapters ?? [])
      .map((ch: any) => ({
        ...ch,
        lessons: (ch.lessons ?? []).filter((l: any) => startedLessonIds.has(l.id)),
      }))
      .filter((ch: any) => ch.lessons.length > 0),
  })).filter((theme: any) => theme.chapters.length > 0);

  const hasAnyProgress = filteredThemes.length > 0;

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Progression détaillée</h1>
        <p className="text-slate-400 text-sm">
          {child.profiles?.display_name} · {child.xp ?? 0} XP total
        </p>
      </div>

      {/* Sélecteur enfant (affiché seulement si plusieurs enfants) */}
      {children.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {children.map((c: any) => {
            const active = c.id === child.id;
            return (
              <Link
                key={c.id}
                href={`/${locale}/suivi/progression?child=${c.id}`}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                  active
                    ? "bg-brand-navy text-white border border-blue-600"
                    : "bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 hover:text-white"
                }`}
              >
                <span>👦</span>
                {c.profiles?.display_name ?? "Enfant"}
              </Link>
            );
          })}
        </div>
      )}

      {filteredThemes.map((theme: any) => {
        const chapters = [...(theme.chapters ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);

        return (
          <div key={theme.id}>
            <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-3">
              📚 {theme.title}
            </h2>
            <div className="space-y-3">
              {chapters.map((ch: any) => {
                const lessons = [...(ch.lessons ?? [])].sort((a: any, b: any) => a.order_index - b.order_index);
                const done = lessons.filter((l: any) => progMap.get(l.id)?.status === "completed").length;
                const pct  = lessons.length ? Math.round((done / lessons.length) * 100) : 0;

                return (
                  <div key={ch.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-black text-white">{ch.title}</div>
                        <span className="text-xs font-bold text-slate-400">{done}/{lessons.length} leçons</span>
                      </div>
                      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                    <div className="divide-y divide-slate-700/50">
                      {lessons.map((l: any) => {
                        const p = progMap.get(l.id);
                        const status = p?.status ?? "not_started";
                        return (
                          <div key={l.id} className="px-5 py-3 flex items-center justify-between text-sm">
                            <span className={status === "completed" ? "text-white font-bold" : "text-slate-400"}>
                              {l.title}
                            </span>
                            <div className="flex items-center gap-4">
                              {p?.score != null && (
                                <span className="text-xs font-bold text-slate-400">{p.score}/100</span>
                              )}
                              {p?.attempts != null && p.attempts > 0 && (
                                <span className="text-xs text-slate-500">{p.attempts} essai{p.attempts > 1 ? "s" : ""}</span>
                              )}
                              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                                status === "completed"   ? "bg-emerald-900 text-emerald-300" :
                                status === "in_progress" ? "bg-amber-900 text-amber-300" :
                                "bg-slate-700 text-slate-500"
                              }`}>
                                {status === "completed" ? "✓ Terminé" : status === "in_progress" ? "⏳ En cours" : "— À faire"}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {!hasAnyProgress && (
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-3">📊</div>
          <div className="font-bold text-white mb-1">Aucune progression enregistrée</div>
          <div className="text-sm text-slate-400">
            Les leçons complétées par votre enfant apparaîtront ici.
          </div>
        </div>
      )}
    </div>
  );
}
