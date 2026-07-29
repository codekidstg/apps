import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/layout/DashboardShell";

export default async function TableauDeBordPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name")
    .eq("id", user.id)
    .single<{ role: string; display_name: string }>();

  if (!profile || !["admin", "manager", "student"].includes(profile.role)) redirect("/");

  // RLS garantit que l'élève ne voit que son propre enregistrement
  const { data: student } = await (supabase.from("students") as any)
    .select("level, points, badges")
    .eq("profile_id", user.id)
    .maybeSingle() as { data: { level: string; points: number; badges: string[] } | null };

  return (
    <DashboardShell role={profile.role as any} displayName={profile.display_name}>
      <h1 className="font-display text-3xl font-bold text-ink mb-2">
        Bonjour, {profile.display_name} 👋
      </h1>
      <p className="text-ink-muted mb-8">Voici ta progression aujourd'hui.</p>

      {student ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-explorer-light rounded-2xl p-6">
            <div className="text-3xl font-display font-bold text-ink">{student.points}</div>
            <div className="text-sm text-ink-muted mt-1">Points accumulés</div>
          </div>
          <div className="bg-builder-light rounded-2xl p-6">
            <div className="text-3xl font-display font-bold text-ink">{student.badges.length}</div>
            <div className="text-sm text-ink-muted mt-1">Badges obtenus</div>
          </div>
          <div className="bg-brand-orange-light rounded-2xl p-6">
            <div className="text-3xl font-display font-bold text-ink capitalize">{student.level}</div>
            <div className="text-sm text-ink-muted mt-1">Niveau actuel</div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-stone-100 p-6">
          <p className="text-ink-muted text-sm">Profil élève en cours de configuration.</p>
        </div>
      )}
    </DashboardShell>
  );
}
