import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
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

  return (
    <BackofficeShell role={profile?.role ?? "manager"} displayName={profile?.display_name ?? "Manager"}>
      {children}
    </BackofficeShell>
  );
}
