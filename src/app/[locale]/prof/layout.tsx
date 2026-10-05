import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import BackofficeShell from "@/components/backoffice/Shell";
import { getEffectiveNavPermissions } from "@/lib/permissions/access";
import { PAGES_BY_ROLE } from "@/lib/permissions/registry";
import { compterQuestionsMentor } from "@/lib/questions/donnees";
import { createAdminClient } from "@/lib/supabase/admin";
import { VERSION_ENGAGEMENT } from "@/lib/prof/engagement";
import EcranEngagement from "@/components/prof/EcranEngagement";

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

  // La pastille « Questions des élèves » : ce qui attend une réponse.
  const [allowedKeys, questionsEnAttente, engagement] = await Promise.all([
    getEffectiveNavPermissions(user.id, "teacher"),
    compterQuestionsMentor(user.id),
    profile.role === "teacher"
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (createAdminClient() as any)
          .from("engagements_mentors").select("version").eq("teacher_id", user.id).maybeSingle()
      : Promise.resolve({ data: { version: VERSION_ENGAGEMENT } }),
  ]);
  const allKeys     = (PAGES_BY_ROLE["teacher"] ?? []).map(p => p.key);
  const hiddenKeys  = allKeys.filter(k => !allowedKeys.has(k));

  /**
   * L'engagement passe avant tout le reste, une seule fois — et une seconde
   * fois le jour où le texte change, pour qu'un mentor ne reste pas engagé sur
   * des mots qu'il n'a jamais lus. L'admin en est dispensé : c'est son contenu.
   */
  const aAccepte = engagement?.data?.version === VERSION_ENGAGEMENT;

  return (
    <BackofficeShell
      role="teacher"
      displayName={profile?.display_name ?? "Mentor"}
      hiddenKeys={hiddenKeys}
      badges={{ "teacher.questions": questionsEnAttente }}
    >
      {aAccepte ? children : <EcranEngagement />}
    </BackofficeShell>
  );
}
