import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ShareGameClient from "./ShareGameClient";

export default async function SharePage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}) {
  const { shareId } = await params;

  const supabase = await createClient();
  const { data: player } = await (supabase.from("atelier_players") as any)
    .select("name, avatar, config, score, created_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (!player) notFound();

  return <ShareGameClient player={player} shareId={shareId} />;
}
