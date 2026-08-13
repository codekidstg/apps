import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ROLE_REDIRECT: Record<string, string> = {
  student: "/eleve",
  teacher: "/prof",
  admin:   "/admin",
  manager: "/manager",
  parent:  "/suivi",
};

export default async function TableauDeBordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect(`/${locale}/connexion`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  const dest = ROLE_REDIRECT[profile?.role ?? ""];
  if (dest) redirect(`/${locale}${dest}`);

  redirect(`/${locale}/connexion`);
}
