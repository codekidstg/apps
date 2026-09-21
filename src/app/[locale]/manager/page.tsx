import { createAdminClient, createClient } from "@/lib/supabase/server";
import { getDashboardComptaKPIs } from "@/lib/compta/treasury";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import AlerteBoiteDirection from "@/components/backoffice/AlerteBoiteDirection";
import Link from "next/link";
import { AVANCEMENT, ENGAGEMENT } from "@/lib/rapports";
import { getSeancesAVenir } from "@/lib/planning/seances-a-venir";
import { ListeSeances } from "@/components/backoffice/ProchainesSeances";
import AlerteParents from "@/components/backoffice/AlerteParents";

export default async function ManagerDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const admin = createAdminClient();
  const now   = new Date();
  const month = now.getMonth() + 1;
  const year  = now.getFullYear();

  const [
    { data: profiles },
    seances,
    { data: reports },
    { mentorToPay, parentPending },
  ] = await Promise.all([
    (admin.from("profiles") as any).select("role"),
    getSeancesAVenir(),
    // `title` et `status` n'existent pas dans session_reports : la requête
    // était rejetée en bloc et l'encadré affichait « Aucun rapport. » depuis
    // toujours. Les colonnes réelles sont celles-ci.
    (admin.from("session_reports") as any)
      .select("id, occurrence_date, reported_at, teacher_id, profiles!teacher_id(display_name), advancement, engagement")
      .order("reported_at", { ascending: false })
      .limit(6),
    getDashboardComptaKPIs(month, year),
  ]);

  const byRole   = ((profiles ?? []) as { role: string }[]).reduce<Record<string, number>>(
    (a, p) => ({ ...a, [p.role]: (a[p.role] ?? 0) + 1 }), {}
  );

  const kpis = [
    { label: "Élèves",         value: byRole.student  ?? 0, icon: "🎓", color: "#10b981", href: "/manager/utilisateurs/eleves" },
    { label: "Professeurs",    value: byRole.teacher  ?? 0, icon: "👩‍🏫", color: "#a78bfa", href: "/manager/utilisateurs/professeurs" },
    { label: "Parents",        value: byRole.parent   ?? 0, icon: "👨‍👩‍👦", color: "#60a5fa", href: "/manager/utilisateurs/parents" },
    { label: "Sessions / 7j",  value: seances.length,        icon: "📅", color: "#FDB813", href: `/manager/compta/mentors?month=${month}&year=${year}` },
    { label: "À payer mentors",    value: mentorToPay,   icon: "💰", color: "#f97316", href: "/manager/compta/mentors" },
    { label: "En attente parents", value: parentPending, icon: "💳", color: "#ef4444", href: "/manager/compta/parents" },
  ];

  return (
    <div>
      <PageHeader title="Tableau de bord" subtitle="Vue d'ensemble de votre espace" />
      <div className="p-8 space-y-8">

        <AlerteBoiteDirection href="/manager/messages" />
        <AlerteParents espace="manager" />

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

          {/* Prochaines séances — même encadré que chez l'admin */}
          <ListeSeances seances={seances.slice(0, 5)} total={seances.length} espace="manager" />

          {/* Validations récentes (rapports de séance) */}
          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-border">
              <h2 className="font-display font-black text-base text-ink">📝 Rapports de séance récents</h2>
              <Link href="/fr/manager/rapports" className="text-xs font-black text-brand-orange hover:underline">
                Tout voir →
              </Link>
            </div>
            {(reports ?? []).length === 0 ? (
              <div className="px-6 py-8 text-center text-ink-muted font-bold text-sm">Aucun rapport.</div>
            ) : (
              <div className="divide-y divide-cream-border">
                {(reports as any[]).map((r) => {
                  // advancement et engagement sont des textes, pas des notes :
                  // le code d'avant en tirait des étoiles, ce qui n'a jamais
                  // pu s'afficher correctement.
                  const av = AVANCEMENT[r.advancement ?? ""];
                  const en = ENGAGEMENT[r.engagement  ?? ""];
                  return (
                    <div key={r.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-ink text-sm truncate">
                          {av ? `${av.icon} ${av.label}` : "Rapport de séance"}
                        </div>
                        <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2">
                          <span>👩‍🏫 {r.profiles?.display_name ?? "Prof"}</span>
                          <span>· {new Date(r.occurrence_date ?? r.reported_at).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                      {en && (
                        <span className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 whitespace-nowrap">
                          {en.icon} {en.label}
                        </span>
                      )}
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
              <div className="text-2xl font-black text-yellow-300">{mentorToPay}</div>
            </Link>
            <Link href="/manager/compta/parents" className="bg-white/10 hover:bg-white/20 rounded-xl p-4 transition-colors">
              <div className="text-xs font-bold text-white/60 mb-1">Versements en attente (parents)</div>
              <div className="text-2xl font-black text-yellow-300">{parentPending}</div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
