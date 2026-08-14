import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
import { getEffectiveNavPermissions } from "@/lib/permissions/access";
import { PAGES_BY_ROLE } from "@/lib/permissions/registry";
import type { Role } from "@/lib/supabase/types";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single<{ display_name: string; role: Role }>();

  const role = profile?.role ?? "manager";

  const allowedKeys = await getEffectiveNavPermissions(user.id, role);
  const allKeys     = (PAGES_BY_ROLE[role] ?? []).map(p => p.key);
  const hiddenKeys  = allKeys.filter(k => !allowedKeys.has(k));

  return (
    <BackofficeShell role={role} displayName={profile?.display_name ?? "Manager"} hiddenKeys={hiddenKeys}>
      {children}
    </BackofficeShell>
  );
}
