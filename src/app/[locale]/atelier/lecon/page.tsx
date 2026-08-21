import { createClient } from "@/lib/supabase/server";
import { homeHrefFor } from "../roleHome";
import LeconClient from "./LeconClient";

export const dynamic = "force-dynamic";

export default async function LeconPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const supabase   = await createClient();

  // La leçon est plein écran, hors barre latérale : sans cette destination,
  // le visiteur n'a aucune issue une fois entré.
  const { data: { user } } = await supabase.auth.getUser();
  let homeHref = "/";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    homeHref = homeHrefFor(profile?.role, locale);
  }

  return <LeconClient homeHref={homeHref} />;
}
