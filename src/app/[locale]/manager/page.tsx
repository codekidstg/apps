import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function buildUpcomingSessions(sessions: any[], days = 7) {
  const now = new Date();
  const limit = new Date(now); limit.setDate(now.getDate() + days);
  const out: { title: string; at: Date; teacherName: string; studentName: string | null }[] = [];

  for (const s of sessions) {
    const teacherName: string = s.profiles?.display_name ?? "Prof";
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

  const [
    { data: profiles },
    { data: themes },
    { data: allSessions },
    { data: reports },
  ] = await Promise.all([
    (admin.from("profiles") as any).select("role"),
    (admin.from("themes") as any).select("id, title, status, level, updated_at").order("updated_at", { ascending: false }).limit(6),
    (admin.from("teacher_sessions") as any)
      .select("*, profiles!teacher_id(display_name), students(id, profiles!profile_id(display_name))")
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("session_reports") as any)
      .select("id, title, status, created_at, teacher_id, profiles!teacher_id(display_name)")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const byRole = ((profiles ?? []) as { role: string }[]).reduce<Record<string, number>>(
    (a, p) => ({ ...a, [p.role]: (a[p.role] ?? 0) + 1 }), {}
  );
  const byStatus = ((themes ?? []) as { status: string }[]).reduce<Record<string, number>>(
    (a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {}
  );

  const upcoming = buildUpcomingSessions(allSessions ?? []);

  const kpis = [
    { label: "Élèves",        value: byRole.student  ?? 0, icon: "🎓", color: "#10b981" },
    { label: "Professeurs",   value: byRole.teacher  ?? 0, icon: "👩‍🏫", color: "#a78bfa" },
    { label: "Parents",       value: byRole.parent   ?? 0, icon: "👨‍👩‍👦", color: "#60a5fa" },
    { label: "Sessions / 7j", value: upcoming.length,       icon: "📅", color: "#FDB813" },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre espace" />
      <div className="p-8 space-y-8">

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-cream-border p-5 flex items-center gap-4">
              <span className="text-3xl">{k.icon}</span>
              <div>
                <div className="font-display font-black text-3xl" style={{ color: k.color }}>{k.value}</div>
                <div className="text-sm font-bold text-ink-muted mt-0.5">{k.label}</div>
              </div>
            </div>
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
                {upcoming.slice(0, 6).map((occ, i) => (
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

          {/* Rapports récents */}
          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
              <h2 className="font-display font-black text-base text-ink">📝 Rapports de séance</h2>
            </div>
            {(reports ?? []).length === 0 ? (
              <div className="px-6 py-8 text-center text-ink-muted font-bold text-sm">Aucun rapport.</div>
            ) : (
              <div className="divide-y divide-cream-border">
                {(reports as any[]).map((r) => (
                  <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-ink text-sm truncate">{r.title ?? "Rapport"}</div>
                      <div className="text-xs text-ink-muted mt-0.5">
                        👩‍🏫 {r.profiles?.display_name ?? "Prof"} · {new Date(r.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <span className={`text-xs font-black px-2.5 py-1 rounded-full shrink-0 ${
                      r.status === "validated"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}>
                      {r.status === "validated" ? "✓ Validé" : "En attente"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Thèmes récents */}
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
            <h2 className="font-display font-black text-base text-ink">📚 Mes thèmes récents</h2>
            <div className="flex items-center gap-4">
              <div className="flex gap-3 text-xs font-bold text-ink-muted">
                <span className="text-green-600">{byStatus.published ?? 0} publiés</span>
                <span className="text-brand-blue">{byStatus.validated ?? 0} validés</span>
                <span className="text-gray-500">{byStatus.draft ?? 0} brouillons</span>
              </div>
              <Link href="/manager/themes" className="text-xs font-extrabold text-brand-orange hover:underline">Voir tout →</Link>
            </div>
          </div>
          {(themes ?? []).length === 0 ? (
            <div className="px-6 py-8 text-center text-ink-muted font-bold text-sm">
              Aucun thème. <Link href="/manager/themes/new" className="text-brand-orange hover:underline">Créer un thème</Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-border">
              {((themes ?? []) as any[]).map((t) => (
                <Link key={t.id} href={`/manager/themes/${t.id}`}
                  className="flex items-center gap-4 px-6 py-3 hover:bg-cream transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink truncate">{t.title}</div>
                    <div className="text-xs text-ink-light capitalize">{t.level} · {new Date(t.updated_at).toLocaleDateString("fr-FR")}</div>
                  </div>
                  <span className={`text-xs font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                    t.status === "published" ? "bg-green-100 text-green-700" :
                    t.status === "validated" ? "bg-blue-100 text-blue-700" :
                    "bg-gray-100 text-gray-600"
                  }`}>
                    {t.status === "draft" ? "Brouillon" : t.status === "validated" ? "Validé" : t.status === "published" ? "Publié" : "Archivé"}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
