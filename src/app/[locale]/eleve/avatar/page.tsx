import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvatarClient from "./AvatarClient";

export default async function AvatarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string | null }>();

  const { data: student } = await supabase
    .from("students")
    .select("id, xp, level")
    .eq("profile_id", user.id)
    .single<{ id: string; xp: number; level: number }>();

  const { data: avatarRaw } = student
    ? await (supabase.from("student_avatar") as any)
        .select("base, hat, accessory, color")
        .eq("student_id", student.id)
        .maybeSingle()
    : { data: null };

  const initial = avatarRaw ?? { base: "robot_blue", hat: null, accessory: null, color: "#3b82f6" };

  return <AvatarClient xp={student?.xp ?? 0} level={student?.level ?? 1} name={profile?.display_name ?? "Joueur"} initial={initial} />;
}
