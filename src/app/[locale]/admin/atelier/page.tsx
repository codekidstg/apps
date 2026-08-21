import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import AtelierAdminClient from "./AtelierAdminClient";

export const dynamic = "force-dynamic";

const ATELIER_KEYS = ["teacher.atelier", "manager.atelier"];

export default async function AtelierAdminPage() {
  const admin = createAdminClient();

  const [{ data: students }, { data: staff }, { data: roleRows }, { data: overrideRows }] =
    await Promise.all([
      (admin.from("students") as any)
        .select("id, atelier_active, profile_id, profiles!profile_id(display_name)")
        .order("id"),
      (admin.from("profiles") as any)
        .select("id, display_name, role")
        .in("role", ["teacher", "manager"])
        .order("display_name"),
      (admin.from("role_nav_config") as any)
        .select("role, page_key, allowed")
        .in("page_key", ATELIER_KEYS),
      (admin.from("user_nav_overrides") as any)
        .select("user_id, page_key, allowed")
        .in("page_key", ATELIER_KEYS),
    ]);

  const studentRows = (students ?? []).map((s: any) => ({
    id:             s.id as string,
    atelier_active: s.atelier_active as boolean,
    name:           s.profiles?.display_name ?? "—",
  }));

  // Absence de ligne = autorisé, même défaut que getRoleConfig côté runtime.
  const roleAllowed = { teacher: true, manager: true };
  for (const r of (roleRows ?? []) as { role: string; allowed: boolean }[]) {
    if (r.role === "teacher" || r.role === "manager") roleAllowed[r.role] = r.allowed;
  }

  const overrideByUser = new Map<string, boolean>(
    ((overrideRows ?? []) as { user_id: string; allowed: boolean }[]).map(r => [r.user_id, r.allowed])
  );

  const staffRows = ((staff ?? []) as { id: string; display_name: string; role: string }[])
    .filter(p => p.role === "teacher" || p.role === "manager")
    .map(p => ({
      id:   p.id,
      name: p.display_name ?? "—",
      role: p.role as "teacher" | "manager",
      override: overrideByUser.has(p.id)
        ? (overrideByUser.get(p.id) ? ("allow" as const) : ("deny" as const))
        : ("inherit" as const),
    }));

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader
        title="Atelier"
        subtitle="Qui reçoit la séance offerte, et qui peut l'animer."
      />
      <AtelierAdminClient students={studentRows} staff={staffRows} roleAllowed={roleAllowed} />
    </div>
  );
}
