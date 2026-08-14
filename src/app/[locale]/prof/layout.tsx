import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
import { getEffectiveNavPermissions } from "@/lib/permissions/access";
import { PAGES_BY_ROLE } from "@/lib/permissions/registry";

export default async function ProfLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single<{ display_name: string; role: string }>();

  if (profile?.role !== "teacher" && profile?.role !== "admin") redirect("/fr/connexion");

  const allowedKeys = await getEffectiveNavPermissions(user.id, "teacher");
  const allKeys     = (PAGES_BY_ROLE["teacher"] ?? []).map(p => p.key);
  const hiddenKeys  = allKeys.filter(k => !allowedKeys.has(k));

  return (
    <BackofficeShell role="teacher" displayName={profile?.display_name ?? "Professeur"} hiddenKeys={hiddenKeys}>
      {children}
    </BackofficeShell>
  );
}
