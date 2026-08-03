import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import { LEVELS, xpProgressInLevel } from "@/lib/gamification/levels";
import { BADGES } from "@/lib/gamification/badges";
import type { BadgeId } from "@/lib/gamification/badges";

export default async function SuiviDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const admin = createAdminClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const { data: links } = await (supabase.from("parent_children") as any)
    .select(`
      student_id,
      students (
        id, xp, level_num, streak_days, teacher_id,
        profiles!students_profile_id_fkey ( display_name )
      )
    `)
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => l.students).filter(Boolean);

  const { data: consents } = await (supabase.from("parental_consents") as any)
    .select("student_id, revoked_at")
    .eq("parent_id", user.id);
  const consentedIds = new Set(
    (consents ?? []).filter((c: any) => !c.revoked_at).map((c: any) => c.student_id)
  );

  const { data: subs } = await (supabase.from("subscriptions") as any)
    .select("student_id, status, ends_at")
    .eq("parent_id", user.id)
    .eq("status", "active");
  const activeSubs = new Map((subs ?? []).map((s: any) => [s.student_id, s]));

  const childIds = children.map((c: any) => c.id);

  const { data: publishedLessons } = await (admin.from("lessons") as any)
    .select("id")
    .eq("status", "published");
  const publishedLessonIds = new Set((publishedLessons ?? []).map((l: any) => l.id));
  const totalPublished = publishedLessonIds.size;

  const { data: progressRaw } = childIds.length
    ? await (admin.from("lesson_progress") as any)
        .select("student_id, status, lesson_id, completed_at")
        .in("student_id", childIds)
    : { data: [] };

  // Weekly stats (7 derniers jours)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const weeklyByChild = new Map<string, { lessons: number; activeDays: Set<string> }>();
  for (const c of children) weeklyByChild.set(c.id, { lessons: 0, activeDays: new Set() });

  const progressByChild = new Map<string, { total: number; done: number }>();
  for (const p of progressRaw ?? []) {
    if (!publishedLessonIds.has(p.lesson_id)) continue;
    const cur = progressByChild.get(p.student_id) ?? { total: totalPublished, done: 0 };
    if (p.status === "completed") {
      cur.done++;
      if (p.completed_at && new Date(p.completed_at) >= weekAgo) {
        const w = weeklyByChild.get(p.student_id);
        if (w) {
          w.lessons++;
          w.activeDays.add(p.completed_at.slice(0, 10));
        }
      }
    }
    progressByChild.set(p.student_id, cur);
  }
  for (const c of children) {
    if (!progressByChild.has(c.id)) progressByChild.set(c.id, { total: totalPublished, done: 0 });
  }

  // Training progress this week
  const { data: trainingProgressRaw } = childIds.length
    ? await (admin.from("training_progress") as any)
        .select("student_id, completed_at")
        .in("student_id", childIds)
        .gte("completed_at", weekAgo.toISOString())
        .not("completed_at", "is", null)
    : { data: [] };

  const weeklyTrainingsByChild = new Map<string, number>();
  for (const tp of trainingProgressRaw ?? []) {
    weeklyTrainingsByChild.set(tp.student_id, (weeklyTrainingsByChild.get(tp.student_id) ?? 0) + 1);
  }

  const teacherIds = [...new Set(children.map((c: any) => c.teacher_id).filter(Boolean))];
  const { data: sessionsRaw } = teacherIds.length
    ? await (admin.from("teacher_sessions") as any)
        .select("*, students(id)")
        .in("teacher_id", teacherIds)
    : { data: [] };

  function getChildSessions(childId: string, teacherId: string | null) {
    if (!teacherId) return [];
    const now = new Date();
    const in14 = new Date(now); in14.setDate(now.getDate() + 14);
    const sessions = (sessionsRaw ?? []).filter((s: any) =>
      s.teacher_id === teacherId &&
      (s.student_id === null || s.students?.id === childId)
    );
    const occurrences: { title: string; at: Date; duration_min: number; recurring: boolean }[] = [];
    for (const s of sessions) {
      if (s.session_type === "recurring") {
        const [h, m] = (s.start_time as string).split(":").map(Number);
        const cursor = new Date(now);
        cursor.setHours(h, m, 0, 0);
        const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
        cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor >= now ? 0 : daysUntil === 0 ? 7 : daysUntil));
        while (cursor <= in14) {
          if (cursor >= now && (!s.active_until || cursor <= new Date(s.active_until)))
            occurrences.push({ title: s.title, at: new Date(cursor), duration_min: s.duration_min, recurring: true });
          cursor.setDate(cursor.getDate() + 7);
        }
      } else {
        const at = new Date(s.scheduled_at);
        if (at >= now && at <= in14)
          occurrences.push({ title: s.title, at, duration_min: s.duration_min, recurring: false });
      }
    }
    return occurrences.sort((a, b) => a.at.getTime() - b.at.getTime()).slice(0, 3);
  }

  const { data: achivRaw } = childIds.length
    ? await (admin.from("student_achievements") as any)
        .select("student_id, badge_id, earned_at")
        .in("student_id", childIds)
        .order("earned_at", { ascending: false })
    : { data: [] };

  const badgesByChild = new Map<string, { badge_id: string; earned_at: string }[]>();
  for (const a of achivRaw ?? []) {
    const arr = badgesByChild.get(a.student_id) ?? [];
    arr.push(a);
    badgesByChild.set(a.student_id, arr);
  }

  const WDAY = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

  if (children.length === 0) {
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-black text-white mb-2">Tableau de bord</h1>
        <p className="text-slate-400 text-sm mb-6">Aucun enfant lié à votre compte.</p>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-slate-300 text-sm">
          Contactez l'administrateur pour lier votre compte à celui de votre enfant.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Tableau de bord</h1>
        <p className="text-slate-400 text-sm">Suivi en temps réel de la progression de votre enfant.</p>
      </div>

      {children.map((child: any) => {
        const name   = child.profiles?.display_name ?? "Enfant";
        const xp     = child.xp ?? 0;
        const lvl    = LEVELS.find((l) => l.num === (child.level_num ?? 1)) ?? LEVELS[0];
        const { pct } = xpProgressInLevel(xp);
        const prog   = progressByChild.get(child.id) ?? { total: 0, done: 0 };
        const badges = (badgesByChild.get(child.id) ?? []).slice(0, 4);
        const sub         = activeSubs.get(child.id);
        const hasConsent  = consentedIds.has(child.id);
        const nextSessions = getChildSessions(child.id, child.teacher_id ?? null);
        const weekly = weeklyByChild.get(child.id) ?? { lessons: 0, activeDays: new Set<string>() };
        const weeklyTrainings = weeklyTrainingsByChild.get(child.id) ?? 0;

        return (
          <div key={child.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 md:p-6 space-y-5">
            {/* Header enfant */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-2xl">👦</div>
                <div>
                  <div className="font-black text-white text-lg">{name}</div>
                  <div className="text-xs font-bold" style={{ color: lvl.color }}>
                    Niveau {lvl.num} — {lvl.name}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {sub ? (
                  <span className="bg-emerald-900 text-emerald-300 text-xs font-black px-3 py-1 rounded-full">
                    ● Premium actif
                  </span>
                ) : (
                  <Link href={`/${locale}/suivi/abonnement`} className="bg-amber-900 text-amber-300 text-xs font-black px-3 py-1 rounded-full hover:bg-amber-800 transition-colors">
                    ⬆ Passer Premium
                  </Link>
                )}
              </div>
            </div>

            {/* Alerte consentement */}
            {!hasConsent && (
              <Link href={`/${locale}/suivi/consentement`} className="flex items-center gap-3 bg-red-900/40 border border-red-800 rounded-xl px-4 py-3 text-sm text-red-300 hover:bg-red-900/60 transition-colors">
                <span className="text-lg">⚠️</span>
                <span className="font-bold">Consentement parental requis — Cliquez pour signer</span>
              </Link>
            )}

            {/* XP Bar */}
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-400 mb-1.5">
                <span>{xp} XP</span>
                <span>{lvl.maxXp} XP pour le Niveau {lvl.num + 1}</span>
              </div>
              <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: lvl.color }} />
              </div>
            </div>

            {/* Stats globales */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">{xp}</div>
                <div className="text-xs text-slate-400 mt-0.5">XP total</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">{prog.done}/{prog.total}</div>
                <div className="text-xs text-slate-400 mt-0.5">Leçons</div>
              </div>
              <div className="bg-slate-900/60 rounded-xl p-3 text-center">
                <div className="text-2xl font-black text-white">{child.streak_days ?? 0}</div>
                <div className="text-xs text-slate-400 mt-0.5">Jours 🔥</div>
              </div>
            </div>

            {/* Bloc "Cette semaine" */}
            <div className="bg-blue-950/40 border border-blue-800/40 rounded-xl p-4">
              <div className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">📅 Cette semaine</div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <div className="text-xl font-black text-white">{weekly.lessons}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Leçon{weekly.lessons > 1 ? "s" : ""} faite{weekly.lessons > 1 ? "s" : ""}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-white">{weeklyTrainings}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Entraînement{weeklyTrainings > 1 ? "s" : ""}</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-black text-white">{weekly.activeDays.size}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Jour{weekly.activeDays.size > 1 ? "s" : ""} actif{weekly.activeDays.size > 1 ? "s" : ""}</div>
                </div>
              </div>
              {weekly.lessons === 0 && weekly.activeDays.size === 0 && (
                <div className="text-xs text-slate-500 text-center mt-2">Aucune activité cette semaine</div>
              )}
            </div>

            {/* Badges récents */}
            {badges.length > 0 && (
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Badges récents</div>
                <div className="flex gap-2 flex-wrap">
                  {badges.map((a) => {
                    const b = BADGES[a.badge_id as BadgeId];
                    if (!b) return null;
                    return (
                      <div key={a.badge_id} className="flex items-center gap-1.5 bg-slate-700 rounded-xl px-3 py-1.5 text-xs font-bold text-white">
                        <span>{b.icon}</span> {b.name}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Planning */}
            {nextSessions.length > 0 && (
              <div>
                <div className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">📅 Prochains cours</div>
                <div className="space-y-2">
                  {nextSessions.map((occ, i) => (
                    <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${i === 0 ? "bg-green-900/30 border border-green-700/40" : "bg-slate-700/40 border border-slate-600/30"}`}>
                      <div className={`text-center w-9 shrink-0 ${i === 0 ? "text-green-300" : "text-slate-400"}`}>
                        <div className="text-[9px] font-black uppercase">{WDAY[occ.at.getDay()]}</div>
                        <div className="text-lg font-black leading-none">{occ.at.getDate()}</div>
                        <div className="text-[9px] font-bold">{occ.at.toLocaleDateString("fr-FR", { month: "short" })}</div>
                      </div>
                      <div className="w-px h-8 bg-slate-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className={`font-black text-sm truncate ${i === 0 ? "text-green-100" : "text-slate-300"}`}>{occ.title}</div>
                        <div className="text-xs text-slate-500">{occ.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · {occ.duration_min} min</div>
                      </div>
                      {i === 0 && <span className="text-[10px] font-black bg-green-500 text-white px-2 py-0.5 rounded-full shrink-0">Prochain</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
              <Link href={`/${locale}/suivi/progression`} className="text-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                📊 Progression
              </Link>
              <Link href={`/${locale}/suivi/entrainements`} className="text-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                💪 Entraînements
              </Link>
              <Link href={`/${locale}/suivi/certificats`} className="col-span-2 sm:col-span-1 text-center bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold py-2.5 rounded-xl transition-colors">
                🎓 Certificats
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
