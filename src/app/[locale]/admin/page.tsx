import { createClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";

async function getStats() {
  const supabase = await createClient();
  const [profilesRes, themesRes, schoolsRes, suspiciousRes] = await Promise.all([
    supabase.from("profiles").select("role"),
    supabase.from("themes").select("status"),
    supabase.from("schools").select("id"),
    supabase.from("access_logs").select("id, user_id, lesson_id, accessed_at, profiles:user_id(display_name)")
      .eq("suspicious", true)
      .order("accessed_at", { ascending: false })
      .limit(10),
  ]);

  const profiles = (profilesRes.data ?? []) as { role: string }[];
  const themes   = (themesRes.data ?? []) as { status: string }[];

  const byRole   = profiles.reduce<Record<string, number>>((a, p) => ({ ...a, [p.role]: (a[p.role] ?? 0) + 1 }), {});
  const byStatus = themes.reduce<Record<string, number>>((a, t) => ({ ...a, [t.status]: (a[t.status] ?? 0) + 1 }), {});

  return {
    byRole, byStatus,
    schoolsCount: schoolsRes.data?.length ?? 0,
    totalUsers: profiles.length,
    suspiciousLogs: suspiciousRes.data ?? [],
  };
}

const roleLabel: Record<string, string> = {
  admin: "Admins", manager: "Managers", teacher: "Profs", student: "Élèves", parent: "Parents",
};

export default async function AdminDashboard() {
  const { byRole, byStatus, schoolsCount, totalUsers, suspiciousLogs } = await getStats();
  const totalThemes = Object.values(byStatus).reduce((a, b) => a + b, 0);

  const kpis = [
    { label: "Utilisateurs", value: totalUsers,            color: "text-brand-blue" },
    { label: "Écoles",       value: schoolsCount,          color: "text-explorer" },
    { label: "Publiés",      value: byStatus.published ?? 0, color: "text-brand-orange" },
    { label: "En attente",   value: (byStatus.draft ?? 0) + (byStatus.validated ?? 0), color: "text-builder" },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de la plateforme" />
      <div className="p-8 space-y-8">

        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {kpis.map((k) => (
            <div key={k.label} className="bg-white rounded-2xl border border-cream-border p-5">
              <div className={`font-display font-black text-4xl ${k.color}`}>{k.value}</div>
              <div className="text-sm font-bold text-ink-muted mt-1">{k.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-cream-border p-6">
            <h2 className="font-display font-black text-base text-ink mb-5">Utilisateurs par rôle</h2>
            <div className="space-y-3">
              {Object.entries(byRole).map(([role, count]) => (
                <div key={role} className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-ink-light w-20">{roleLabel[role] ?? role}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-brand-orange h-full rounded-full" style={{ width: `${(count / totalUsers) * 100}%` }} />
                  </div>
                  <span className="text-sm font-black text-ink w-6 text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-cream-border p-6">
            <h2 className="font-display font-black text-base text-ink mb-5">Thèmes par statut</h2>
            <div className="space-y-3">
              {[
                { key: "draft",     label: "Brouillons", color: "bg-gray-400" },
                { key: "validated", label: "Validés",    color: "bg-brand-blue-mid" },
                { key: "published", label: "Publiés",    color: "bg-explorer" },
                { key: "locked",    label: "Archivés",   color: "bg-brand-orange" },
              ].map(({ key, label, color }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-xs font-extrabold text-ink-light w-20">{label}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className={`${color} h-full rounded-full`}
                      style={{ width: totalThemes ? `${((byStatus[key] ?? 0) / totalThemes) * 100}%` : "0%" }} />
                  </div>
                  <span className="text-sm font-black text-ink w-6 text-right">{byStatus[key] ?? 0}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Alertes scraping */}
        {suspiciousLogs.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
            <h2 className="font-display font-black text-base text-red-700 mb-4 flex items-center gap-2">
              ⚠️ Accès suspects détectés ({suspiciousLogs.length})
            </h2>
            <div className="space-y-2">
              {(suspiciousLogs as Record<string, unknown>[]).map((log) => {
                const profile = Array.isArray(log.profiles) ? log.profiles[0] : log.profiles as {display_name:string}|null;
                return (
                  <div key={log.id as string} className="flex items-center gap-4 text-sm bg-white rounded-xl px-4 py-3 border border-red-100">
                    <span className="text-red-500 font-black shrink-0">⚠</span>
                    <span className="font-bold text-ink flex-1">{profile?.display_name ?? "Inconnu"}</span>
                    <span className="text-xs text-ink-light font-mono">
                      {new Date(log.accessed_at as string).toLocaleString("fr-FR")}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
