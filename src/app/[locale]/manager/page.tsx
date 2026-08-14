import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function buildUpcomingSessions(sessions: any[], days = 7) {
  const now   = new Date();
  const limit = new Date(now); limit.setDate(now.getDate() + days);
  const out: { title: string; at: Date; teacherName: string; studentName: string | null }[] = [];

  for (const s of sessions) {
    const teacherName: string   = s.profiles?.display_name ?? "Prof";
    const studentName: string | null = s.students?.profiles?.display_name ?? null;

    if (s.session_type === "recurring") {
      const [h, m] = (s.start_time as string).split(":").map(Number);
      const cursor = new Date(now);
      cursor.setHours(h, m, 0, 0);
      const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor > now ? 0 : daysUntil === 0 ? 7 : daysUntil));
      if (cursor <= limit) out.push({ title: s.title, at: new Date(cursor), teacherName, studentName });
    } else if (s.session_type === "once" && s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at >= now && at <= limit) out.push({ title: s.title, at, teacherName, studentName });
    }
  }
  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const admin = createAdminClient();
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  // Bornes du mois courant pour les KPIs
  const monthStart = `${year}-${String(month).padStart(2,"0")}-01`;
  const monthEnd   = new Date(year, month, 0).toISOString().slice(0, 10);

  const [
    { data: profiles },
    { data: allSessions },
    { data: reports },
    // KPIs réels : sessions avec rapport mais pas encore payées (mentor)
    { data: mentorToPay },
    // KPIs réels : séances facturées parents non encore payées ce mois
    { data: parentPending },
  ] = await Promise.all([
    (admin.from("profiles") as any).select("role"),
    (admin.from("teacher_sessions") as any)
      .select("*, profiles!teacher_id(display_name), students(id, profiles!profile_id(display_name))")
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("session_reports") as any)
      .select("id, title, status, created_at, teacher_id, profiles!teacher_id(display_name), advancement, engagement")
      .order("created_at", { ascending: false })
      .limit(6),
    // Sessions avec rapport validé, pas encore payées ce mois
    (admin.from("mentor_payments") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "to_pay")
      .gte("occurrence_date", monthStart)
      .lte("occurrence_date", monthEnd),
    // Paiements parents en attente ce mois
    (admin.from("parent_session_payments") as any)
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .gte("occurrence_date", monthStart)
      .lte("occurrence_date", monthEnd),
  ]);

  const byRole   = ((profiles ?? []) as { role: string }[]).reduce<Record<string, number>>(
    (a, p) => ({ ...a, [p.role]: (a[p.role] ?? 0) + 1 }), {}
  );

  const upcoming = buildUpcomingSessions(allSessions ?? []);

  const kpis = [
    { label: "Élèves",         value: byRole.student  ?? 0, icon: "🎓", color: "#10b981", href: "/manager/utilisateurs/eleves" },
    { label: "Professeurs",    value: byRole.teacher  ?? 0, icon: "👩‍🏫", color: "#a78bfa", href: "/manager/utilisateurs/professeurs" },
    { label: "Parents",        value: byRole.parent   ?? 0, icon: "👨‍👩‍👦", color: "#60a5fa", href: "/manager/utilisateurs/parents" },
    { label: "Sessions / 7j",  value: upcoming.length,       icon: "📅", color: "#FDB813", href: `/manager/compta/mentors?month=${month}&year=${year}` },
    { label: "À payer mentors",value: (mentorToPay as any)?.count ?? 0, icon: "💰", color: "#f97316", href: "/manager/compta/mentors" },
    { label: "En attente parents", value: (parentPending as any)?.count ?? 0, icon: "💳", color: "#ef4444", href: "/manager/compta/parents" },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre espace" />
      <div className="p-8 space-y-8">

        {/* KPIs cliquables */}
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
          {kpis.map((k) => (
            <Link key={k.label} href={k.href}
              className="bg-white rounded-2xl border border-cream-border p-5 flex items-center gap-4 hover:shadow-md transition-shadow group">
              <span className="text-3xl">{k.icon}</span>
              <div>
                <div className="font-display font-black text-3xl group-hover:scale-105 transition-transform" style={{ color: k.color }}>{k.value}</div>
                <div className="text-sm font-bold text-ink-muted mt-0.5">{k.label}</div>
              </div>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Prochaines sessions 7j */}
          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
              <h2 className="font-display font-black text-base text-ink">📅 Sessions — 7 prochains jours</h2>
              <Link href="/manager/utilisateurs/professeurs" className="text-xs font-extrabold text-brand-orange hover:underline">Voir profs →</Link>
            </div>
            {upcoming.length === 0 ? (
              <div className="px-6 py-8 text-center text-ink-muted font-bold text-sm">Aucune session prévue.</div>
            ) : (
              <div className="divide-y divide-cream-border">
                {upcoming.slice(0, 5).map((occ, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-3">
                    <div className="w-10 text-center shrink-0">
                      <div className="text-[10px] font-black text-gray-400 uppercase">{WEEKDAY_SHORT[occ.at.getDay()]}</div>
                      <div className="text-lg font-black text-ink leading-none">{occ.at.getDate()}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink text-sm truncate">{occ.title}</div>
                      <div className="text-xs text-ink-muted flex items-center gap-2 mt-0.5">
                        <span>👩‍🏫 {occ.teacherName}</span>
                        <span>· {occ.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                        {occ.studentName && <span>· 👦 {occ.studentName}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Validations récentes (rapports de séance) */}
          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
              <h2 className="font-display font-black text-base text-ink">📝 Rapports de séance récents</h2>
            </div>
            {(reports ?? []).length === 0 ? (
              <div className="px-6 py-8 text-center text-ink-muted font-bold text-sm">Aucun rapport.</div>
            ) : (
              <div className="divide-y divide-cream-border">
                {(reports as any[]).map((r) => {
                  const adv = r.advancement ?? 0;
                  const eng = r.engagement  ?? 0;
                  return (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-ink text-sm truncate">{r.title ?? "Rapport"}</div>
                        <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                          <span>👩‍🏫 {r.profiles?.display_name ?? "Prof"}</span>
                          <span>· {new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Avancement</span>
                          <span className="text-xs font-black" style={{ color: adv >= 3 ? "#10b981" : adv >= 2 ? "#f59e0b" : "#ef4444" }}>
                            {"★".repeat(adv)}{"☆".repeat(Math.max(0, 5 - adv))}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] text-gray-400">Engagement</span>
                          <span className="text-xs font-black" style={{ color: eng >= 3 ? "#10b981" : eng >= 2 ? "#f59e0b" : "#ef4444" }}>
                            {"★".repeat(eng)}{"☆".repeat(Math.max(0, 5 - eng))}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Mini-résumé Compta du mois */}
        <div className="bg-brand-navy rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-black text-base text-white">💰 Compta — {new Date(year, month - 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</h2>
            <div className="flex gap-3">
              <Link href="/manager/compta/mentors" className="text-xs font-black text-yellow-300 hover:underline">Mentors →</Link>
              <Link href="/manager/compta/parents" className="text-xs font-black text-yellow-300 hover:underline">Parents →</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/manager/compta/mentors" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <div className="text-xs font-bold text-white/60 mb-1">Séances à payer (mentors)</div>
              <div className="text-2xl font-black text-yellow-300">{(mentorToPay as any)?.count ?? 0}</div>
            </Link>
            <Link href="/manager/compta/parents" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <div className="text-xs font-bold text-white/60 mb-1">Versements en attente (parents)</div>
              <div className="text-2xl font-black text-yellow-300">{(parentPending as any)?.count ?? 0}</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
