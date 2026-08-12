import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import AtelierClient from "./AtelierClient";

const ROLE_HOME: Record<string, string> = {
  student: "/eleve",
  teacher: "/prof",
  admin:   "/admin",
  parent:  "/suivi",
  manager: "/manager",
};

export default async function AtelierPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { locale }  = await params;
  const { session } = await searchParams;
  const supabase    = await createClient();

  // Détermine le lien d'accueil selon le rôle de l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();
  let homeHref = "/";
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single<{ role: string }>();
    const dest = ROLE_HOME[profile?.role ?? ""];
    if (dest) homeHref = `/${locale}${dest}`;
  }

  // Récupère l'étape courante de la session mentor (si code fourni)
  let sessionStep = 1; // par défaut : tous les steps débloqués (mode solo)
  if (session) {
    const { data } = await (supabase.from("atelier_sessions") as any)
      .select("current_step")
      .eq("code", session.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (data) sessionStep = data.current_step;
  } else {
    sessionStep = 7; // pas de session → accès libre à toutes les étapes
  }

  const hdrs  = await headers();
  const host  = hdrs.get("host") ?? "codekids.tg";
  const proto = hdrs.get("x-forwarded-proto") ?? "https";
  const shareBase = `${proto}://${host}`;

  async function savePlayer(config: any, score: number): Promise<string | null> {
    "use server";
    const { createClient: mkClient } = await import("@/lib/supabase/server");
    const supabase = await mkClient();
    const { data, error } = await (supabase.from("atelier_players") as any)
      .insert({
        session_code: session?.toUpperCase() ?? null,
        name: config.name,
        avatar: config.avatar,
        config,
        score,
      })
      .select("share_id")
      .single();
    if (error) return null;
    return data?.share_id ?? null;
  }

  return (
    <AtelierClient
      sessionStep={sessionStep}
      shareBase={shareBase}
      homeHref={homeHref}
      onSave={savePlayer}
    />
  );
}
