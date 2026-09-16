import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RealisationClient from "./RealisationClient";

/**
 * La page qu'un parent ouvre depuis un lien, sans compte.
 *
 * La lecture passe volontairement par le client ANONYME, pas par le client
 * admin : c'est la règle `lecture_publique` de la migration 030 qui décide, et
 * elle exclut d'elle-même les liens révoqués. Utiliser la clé de service ici
 * contournerait la révocation sans qu'on s'en aperçoive.
 */
export const dynamic = "force-dynamic";

export default async function RealisationPage({
  params,
}: {
  params: Promise<{ locale: string; shareId: string }>;
}) {
  const { shareId } = await params;
  const supabase = await createClient();

  const { data } = await (supabase.from("lesson_shares") as any)
    .select("first_name, avatar, plan, program_xml, maze, created_at")
    .eq("share_id", shareId)
    .maybeSingle();

  if (!data) notFound();

  // La date est formatée ICI, avec un fuseau explicite. Formatée dans le
  // composant client, elle se calcule une fois sur le serveur et une fois dans
  // le navigateur — deux fuseaux, deux textes, et React refuse l'hydratation.
  const dateTexte = new Date(data.created_at).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lome",
  });

  return <RealisationClient realisation={data} dateTexte={dateTexte} />;
}
