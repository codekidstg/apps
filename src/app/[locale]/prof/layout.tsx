import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";

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

  return (
    <BackofficeShell role="teacher" displayName={profile?.display_name ?? "Professeur"}>
      {children}
    </BackofficeShell>
  );
}
