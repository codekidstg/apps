import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
import { compterBoiteDirection } from "@/lib/contact/boite";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // La pastille « Messages des parents » : ce qui attend encore une réponse.
  const [{ data: profile }, messages] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single<{ display_name: string; role: string }>(),
    compterBoiteDirection(),
  ]);

  return (
    <BackofficeShell
      role="admin"
      displayName={profile?.display_name ?? "Admin"}
      badges={{ "admin.messages": messages.aTraiter }}
    >
      {children}
    </BackofficeShell>
  );
}
