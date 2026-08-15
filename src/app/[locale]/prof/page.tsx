export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// ─── helpers ────────────────────────────────────────────────────────────────
function buildNextSession(sessions: any[]): { title: string; at: Date; studentName: string | null } | null {
  const now = new Date();
  let best: { title: string; at: Date; studentName: string | null } | null = null;

  for (const s of sessions) {
    if (s.session_type === "recurring") {
      const [h, m] = (s.start_time as string).split(":").map(Number);
      const cursor = new Date(now);
      cursor.setHours(h, m, 0, 0);
      const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor > now ? 0 : daysUntil === 0 ? 7 : daysUntil));
      if (!best || cursor < best.at) best = { title: s.title, at: new Date(cursor), studentName: s.students?.profiles?.display_name ?? null };
    } else if (s.session_type === "once" && s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at > now && (!best || at < best.at)) best = { title: s.title, at, studentName: s.students?.profiles?.display_name ?? null };
    }
  }
  return best;
}

function daysUntil(d: Date): string {
  const diff = Math.ceil((d.getTime() - Date.now()) / 86400000);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return "Demain";
  return `Dans ${diff} jours`;
}

// Compte les sessions récurrentes + ponctuelles qui tombent dans la semaine courante (lun–dim)
function countSessionsThisWeek(sessions: any[]): number {
  const now = new Date();
  const dow = now.getDay(); // 0=dim
  const monday = new Date(now);
  monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  let count = 0;
  for (const s of sessions) {
    if (s.session_type === "recurring") {
      const activeFrom = new Date(s.active_from ?? s.created_at);
      activeFrom.setHours(0, 0, 0, 0);
      const activeUntil = s.active_until ? new Date(s.active_until) : null;
      // jour de la semaine courante correspondant au weekday de la session
      const offset = s.weekday === 0 ? 6 : s.weekday - 1; // offset depuis lundi
      const occDay = new Date(monday);
      occDay.setDate(monday.getDate() + offset);
      occDay.setHours(0, 0, 0, 0);
      if (occDay >= activeFrom && (!activeUntil || occDay <= activeUntil)) count++;
    } else if (s.session_type === "once" && s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at >= monday && at <= sunday) count++;
    }
  }
  return count;
}

// Compte les occurrences passées sans rapport (basé sur active_from, identique à la page rapports)
function countPendingReports(sessions: any[], reportedKeys: Set<string>): number {
  const now = new Date();
  const to  = new Date(now.getTime() - 1);
  let pending = 0;

  for (const s of sessions) {
    if (s.session_type === "recurring") {
      const startStr = s.active_from ?? s.created_at;
      const startDate = new Date(startStr);
      startDate.setHours(0, 0, 0, 0);

      const [h, m] = (s.start_time as string).split(":").map(Number);
      const cursor = new Date(startDate);
      cursor.setHours(h, m, 0, 0);
      const daysUntil2 = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(cursor.getDate() + (daysUntil2 === 0 && cursor >= startDate ? 0 : daysUntil2 === 0 ? 7 : daysUntil2));

      while (cursor <= to) {
        if (!s.active_until || cursor <= new Date(s.active_until)) {
          const key = `${s.id}|${cursor.toISOString().slice(0, 10)}`;
          if (!reportedKeys.has(key)) pending++;
        }
        cursor.setDate(cursor.getDate() + 7);
      }
    } else if (s.session_type === "once" && s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at <= to) {
        const key = `${s.id}|${at.toISOString().slice(0, 10)}`;
        if (!reportedKeys.has(key)) pending++;
      }
    }
  }
  return pending;
}

const WEEKDAY = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
// ────────────────────────────────────────────────────────────────────────────

export default async function ProfDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const [
    { data: sessionsRaw },
    { data: classesRaw },
    { data: reportsRaw },
  ] = await Promise.all([
    (admin.from("teacher_sessions") as any)
      .select("*, active_from, created_at, active_until, students(id, profiles!profile_id(display_name))")
      .eq("teacher_id", user.id)
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("classes") as any)
      .select("id, name, level, students(id)")
      .eq("teacher_id", user.id),
    (admin.from("session_reports") as any)
      .select("id, session_id, occurrence_date, advancement, reported_at")
      .eq("teacher_id", user.id)
      .order("reported_at", { ascending: false })
      .limit(200),
  ]);

  const sessions = sessionsRaw ?? [];
  const classes  = classesRaw  ?? [];
  const reports  = reportsRaw  ?? [];

  // Élèves distincts liés via les sessions
  const uniqueStudentIds = [...new Set(
    sessions.filter((s: any) => s.students?.id).map((s: any) => s.students.id as string)
  )];
  const totalStudents = uniqueStudentIds.length;

  // Sessions cette semaine
  const sessionsThisWeek = countSessionsThisWeek(sessions);

  // Rapports en attente (même logique que la page rapports, basé sur active_from)
  const reportedKeys = new Set<string>(
    reports.map((r: any) => `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`)
  );
  const reportsPending = countPendingReports(sessions, reportedKeys);

  // Index session_id → title pour les derniers rapports
  const sessionTitleMap = new Map<string, string>(sessions.map((s: any) => [String(s.id), String(s.title)]));

  // Certificats en attente (depuis les élèves des classes)
  const classStudentIds = classes.flatMap((c: any) => (c.students ?? []).map((s: any) => s.id as string));
  const certsRes = classStudentIds.length
    ? await (admin.from("certificates") as any)
        .select("id", { count: "exact", head: true })
        .in("student_id", classStudentIds)
        .is("validated_at", null)
        .eq("revoked", false)
    : { count: 0 };
  const certsPending = (certsRes as any).count ?? 0;

  // Prochaine session
  const nextSession = buildNextSession(sessions);

  // 2 derniers rapports
  const lastReports = reports.slice(0, 2);

  const ADVANCEMENT_COLORS: Record<string, { bg: string; color: string; label: string }> = {
    completed: { bg: "#f0fdf4", color: "#16a34a", label: "✅ Terminé" },
    partial:   { bg: "#fffbeb", color: "#d97706", label: "⏩ Partiel" },
    reviewed:  { bg: "#eff6ff", color: "#2563eb", label: "🔁 Revu" },
    blocked:   { bg: "#fef2f2", color: "#dc2626", label: "⚠️ Bloqué" },
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>Tableau de bord</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>Vue d'ensemble de votre activité pédagogique</p>
      </div>

      {/* KPIs — 3 colonnes */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
          <div className="text-2xl mb-0.5">👦</div>
          <div className="text-2xl font-black" style={{ color: "#1B2D5E" }}>{totalStudents}</div>
          <div className="text-[11px] font-bold mt-0.5" style={{ color: "#94A3B8" }}>Élèves</div>
        </div>

        <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
          <div className="text-2xl mb-0.5">📅</div>
          <div className="text-2xl font-black" style={{ color: "#6366f1" }}>{sessionsThisWeek}</div>
          <div className="text-[11px] font-bold mt-0.5" style={{ color: "#94A3B8" }}>Sessions cette semaine</div>
        </div>

        <div className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: reportsPending > 0 ? "#fecaca" : "#E2E8F0", background: reportsPending > 0 ? "#fef2f2" : "#fff" }}>
          <div className="text-2xl mb-0.5">📝</div>
          <div className="text-2xl font-black" style={{ color: reportsPending > 0 ? "#dc2626" : "#16a34a" }}>{reportsPending}</div>
          <div className="text-[11px] font-bold mt-0.5" style={{ color: reportsPending > 0 ? "#dc2626" : "#94A3B8" }}>
            {reportsPending > 0 ? "Rapports en attente" : "Rapports à jour"}
          </div>
        </div>
      </div>

      {/* Alertes */}
      {(certsPending > 0 || reportsPending > 0) && (
        <div className="space-y-2">
          {certsPending > 0 && (
            <Link href="/prof/certificats" className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 hover:bg-amber-100 transition-colors">
              <span className="text-xl">🎓</span>
              <div className="flex-1">
                <div className="font-black text-sm" style={{ color: "#92400e" }}>
                  {certsPending} certificat{certsPending > 1 ? "s" : ""} en attente de validation
                </div>
                <div className="text-xs" style={{ color: "#b45309" }}>Cliquer pour valider →</div>
              </div>
            </Link>
          )}
          {reportsPending > 0 && (
            <Link href="/prof/rapports" className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl px-4 py-3 hover:bg-red-100 transition-colors">
              <span className="text-xl">📝</span>
              <div className="flex-1">
                <div className="font-black text-sm" style={{ color: "#991b1b" }}>
                  {reportsPending} rapport{reportsPending > 1 ? "s" : ""} de séance à remplir
                </div>
                <div className="text-xs" style={{ color: "#b91c1c" }}>Cliquer pour y accéder →</div>
              </div>
            </Link>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Prochaine session */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>📅 Prochaine session</h2>
            <Link href="/prof/planning" className="text-[11px] font-black" style={{ color: "#FDB813" }}>Planning →</Link>
          </div>
          {nextSession ? (
            <div className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-14 text-center shrink-0 bg-indigo-50 rounded-xl py-2">
                  <div className="text-[10px] font-black text-indigo-400 uppercase">{WEEKDAY[nextSession.at.getDay()]}</div>
                  <div className="text-2xl font-black text-indigo-700 leading-none">{nextSession.at.getDate()}</div>
                  <div className="text-[10px] text-indigo-400">{nextSession.at.toLocaleDateString("fr-FR", { month: "short" })}</div>
                </div>
                <div className="flex-1">
                  <div className="font-black text-sm" style={{ color: "#1B2D5E" }}>{nextSession.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                    {nextSession.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    {nextSession.studentName && <> · 👦 {nextSession.studentName}</>}
                  </div>
                  <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "#f0fdf4", color: "#16a34a" }}>
                    {daysUntil(nextSession.at)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
              Aucune session à venir.<br />
              <Link href="/prof/planning" className="font-bold underline" style={{ color: "#6366f1" }}>Configurer le planning</Link>
            </div>
          )}
        </div>

        {/* Mes classes */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>👨‍🏫 Mes classes</h2>
            <Link href="/prof/classes" className="text-[11px] font-black" style={{ color: "#FDB813" }}>Voir tout →</Link>
          </div>
          {!classes.length ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>Aucune classe assignée.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {classes.slice(0, 4).map((c: any) => (
                <Link key={c.id} href={`/prof/classes/${c.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0" style={{ background: "#1B2D5E" }}>
                    {c.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate" style={{ color: "#1B2D5E" }}>{c.name}</div>
                    <div className="text-xs" style={{ color: "#94A3B8" }}>{c.students?.length ?? 0} élève{(c.students?.length ?? 0) !== 1 ? "s" : ""} · {c.level}</div>
                  </div>
                  <span className="text-gray-300 text-xs">→</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Derniers rapports — 2 maximum */}
        <div className="bg-white rounded-2xl border overflow-hidden lg:col-span-2" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>📝 Derniers rapports</h2>
            <Link href="/prof/rapports" className="text-[11px] font-black" style={{ color: "#FDB813" }}>Tous les rapports →</Link>
          </div>
          {!lastReports.length ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
              Aucun rapport rempli.<br />
              <Link href="/prof/rapports" className="font-bold underline" style={{ color: "#6366f1" }}>Voir les séances passées</Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {lastReports.map((r: any) => {
                const adv = ADVANCEMENT_COLORS[r.advancement] ?? ADVANCEMENT_COLORS.partial;
                const date = r.occurrence_date
                  ? new Date(r.occurrence_date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
                  : new Date(r.reported_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
                const sessionTitle = sessionTitleMap.get(r.session_id) ?? "Séance";
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0" style={{ background: adv.bg, color: adv.color }}>
                      {adv.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black truncate" style={{ color: "#1B2D5E" }}>{sessionTitle}</div>
                      <div className="text-xs mt-0.5 capitalize" style={{ color: "#94A3B8" }}>{date}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
