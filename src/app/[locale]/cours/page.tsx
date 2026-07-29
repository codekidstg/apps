import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function CoursPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();

  if (profile?.role === "teacher") redirect("/fr/prof");
  if (profile?.role === "admin")   redirect("/fr/admin");
  if (profile?.role === "manager") redirect("/fr/manager");

  redirect("/fr/connexion");
}
