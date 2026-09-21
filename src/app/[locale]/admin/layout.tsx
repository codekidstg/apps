import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
import { compterBoiteDirection } from "@/lib/contact/boite";
import { compterQuestionsEnRetard } from "@/lib/questions/donnees";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  // Les pastilles : les messages des parents qui attendent une réponse, et
  // les questions d'élèves restées sans réponse au-delà du délai promis.
  const [{ data: profile }, messages, questionsEnRetard] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, role")
      .eq("id", user.id)
      .single<{ display_name: string; role: string }>(),
    compterBoiteDirection(),
    compterQuestionsEnRetard(),
  ]);

  return (
    <BackofficeShell
      role="admin"
      displayName={profile?.display_name ?? "Admin"}
      badges={{ "admin.messages": messages.aTraiter, "admin.questions": questionsEnRetard }}
    >
      {children}
    </BackofficeShell>
  );
}
