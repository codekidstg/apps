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

const WEEKDAY = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
// ────────────────────────────────────────────────────────────────────────────

export default async function ProfDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  // Sessions configurées
  const { data: sessionsRaw } = await (admin.from("teacher_sessions") as any)
    .select("*, students(id, profiles!profile_id(display_name))")
    .eq("teacher_id", user.id)
    .order("weekday").order("start_time").order("scheduled_at");
  const sessions = sessionsRaw ?? [];

  // Classes
  const { data: classesRaw } = await (admin.from("classes") as any)
    .select("id, name, level, students(id)")
    .eq("teacher_id", user.id);
  const classes = classesRaw ?? [];
  const totalStudents = classes.reduce((acc: number, c: any) => acc + (c.students?.length ?? 0), 0);

  // Cours affectés
  const { data: assignmentsRaw } = await (admin.from("theme_assignments") as any)
    .select("id, themes(id, title), classes(id, name)")
    .eq("teacher_id", user.id);
  const assignments = assignmentsRaw ?? [];

  // Rapports — sessions des 14 derniers jours
  const studentIds = classes.flatMap((c: any) => (c.students ?? []).map((s: any) => s.id));
  const { data: reportsRaw } = await (admin.from("session_reports") as any)
    .select("id, session_id, occurrence_date, advancement, engagement, reported_at")
    .eq("teacher_id", user.id)
    .order("reported_at", { ascending: false })
    .limit(50);
  const reports = reportsRaw ?? [];

  // Compter les occurrences passées (14j) sans rapport
  const now14 = new Date(); now14.setDate(now14.getDate() - 14);
  let pastCount = 0;
  const reportedKeys = new Set(reports.map((r: any) => `${r.session_id}|${r.occurrence_date}`));
  for (const s of sessions) {
    if (s.session_type === "recurring") {
      const [h, m] = (s.start_time as string).split(":").map(Number);
      const cursor = new Date(now14);
      cursor.setHours(h, m, 0, 0);
      const daysUntil2 = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(cursor.getDate() + (daysUntil2 === 0 ? 0 : daysUntil2));
      while (cursor < new Date()) {
        pastCount++;
        cursor.setDate(cursor.getDate() + 7);
      }
    }
  }
  const reportsPending = Math.max(0, pastCount - reports.length);

  // Certificats en attente
  let certsPending = 0;
  if (studentIds.length) {
    const { count } = await (admin.from("certificates") as any)
      .select("id", { count: "exact", head: true })
      .in("student_id", studentIds)
      .is("validated_at", null)
      .eq("revoked", false);
    certsPending = count ?? 0;
  }

  // Progression globale élèves
  let avgProgress = 0;
  if (studentIds.length) {
    const { data: prog } = await (admin.from("lesson_progress") as any)
      .select("student_id, status")
      .in("student_id", studentIds)
      .eq("status", "completed");
    const { data: allLessons } = await admin.from("lessons").select("id", { count: "exact", head: false });
    const total = (allLessons?.length ?? 0) * studentIds.length;
    avgProgress = total > 0 ? Math.round(((prog?.length ?? 0) / total) * 100) : 0;
  }

  // Prochaine session
  const nextSession = buildNextSession(sessions);

  // 5 derniers rapports
  const lastReports = reports.slice(0, 5);

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

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { value: totalStudents, label: "Élèves", icon: "👦", color: "#1B2D5E" },
          { value: sessions.length, label: "Sessions", icon: "📅", color: "#6366f1" },
          { value: assignments.length, label: "Cours", icon: "📚", color: "#0891b2" },
          { value: `${avgProgress}%`, label: "Progression moy.", icon: "📊", color: "#16a34a" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-2xl border p-4 text-center" style={{ borderColor: "#E2E8F0" }}>
            <div className="text-2xl mb-0.5">{k.icon}</div>
            <div className="text-2xl font-black" style={{ color: k.color }}>{k.value}</div>
            <div className="text-[11px] font-bold mt-0.5" style={{ color: "#94A3B8" }}>{k.label}</div>
          </div>
        ))}
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

        {/* Classes */}
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

        {/* Cours affectés */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>📚 Cours affectés</h2>
            <Link href="/prof/cours" className="text-[11px] font-black" style={{ color: "#FDB813" }}>Voir tout →</Link>
          </div>
          {!assignments.length ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>Aucun cours affecté.</div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {assignments.slice(0, 4).map((a: any) => {
                const theme = Array.isArray(a.themes) ? a.themes[0] : a.themes;
                const cls   = Array.isArray(a.classes) ? a.classes[0] : a.classes;
                return (
                  <div key={a.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm truncate" style={{ color: "#1B2D5E" }}>{theme?.title ?? "—"}</div>
                      <div className="text-xs" style={{ color: "#94A3B8" }}>{cls?.name ?? "—"}</div>
                    </div>
                    {theme?.id && (
                      <Link href={`/prof/cours/${theme.id}`} className="text-[11px] font-black shrink-0" style={{ color: "#FDB813" }}>
                        Consulter →
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Derniers rapports */}
        <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "#E2E8F0" }}>
          <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
            <h2 className="font-black text-sm" style={{ color: "#1B2D5E" }}>📝 Derniers rapports</h2>
            <Link href="/prof/rapports" className="text-[11px] font-black" style={{ color: "#FDB813" }}>Tous les rapports →</Link>
          </div>
          {!lastReports.length ? (
            <div className="px-5 py-8 text-center text-sm" style={{ color: "#94A3B8" }}>
              Aucun rapport rempli.<br />
              <Link href="/prof/planning" className="font-bold underline" style={{ color: "#6366f1" }}>Voir les séances passées</Link>
            </div>
          ) : (
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {lastReports.map((r: any) => {
                const adv = ADVANCEMENT_COLORS[r.advancement] ?? ADVANCEMENT_COLORS.partial;
                const date = r.occurrence_date
                  ? new Date(r.occurrence_date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
                  : new Date(r.reported_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
                return (
                  <div key={r.id} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs font-black px-2 py-1 rounded-lg shrink-0" style={{ background: adv.bg, color: adv.color }}>
                      {adv.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate" style={{ color: "#1B2D5E" }}>Séance du {date}</div>
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
