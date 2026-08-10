import { createClient } from "@/lib/supabase/server";
import AtelierClient from "./AtelierClient";

export default async function AtelierPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ session?: string }>;
}) {
  const { locale }  = await params;
  const { session } = await searchParams;

  // Récupère l'étape courante de la session mentor (si code fourni)
  let sessionStep = 1; // par défaut : tous les steps débloqués (mode solo)
  if (session) {
    const supabase = await createClient();
    const { data } = await (supabase.from("atelier_sessions") as any)
      .select("current_step")
      .eq("code", session.toUpperCase())
      .eq("active", true)
      .maybeSingle();
    if (data) sessionStep = data.current_step;
  } else {
    sessionStep = 7; // pas de session → accès libre à toutes les étapes
  }

  const shareBase = process.env.NEXT_PUBLIC_SITE_URL ?? "https://codekids.tg";

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
      onSave={savePlayer}
    />
  );
}
