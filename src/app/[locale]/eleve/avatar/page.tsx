import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AvatarClient from "./AvatarClient";
import { ACCENT_DEFAUT } from "@/components/eleve/robots";

export default async function AvatarPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string | null }>();

  // `maybeSingle` : un admin n'a pas de ligne `students`, et `single` traitait
  // ce cas normal comme une erreur.
  const { data: student } = await supabase
    .from("students")
    .select("id, xp, level")
    .eq("profile_id", user.id)
    .maybeSingle<{ id: string; xp: number; level: number }>();

  // `select("*")` plutôt que la liste des colonnes : `accent` est arrivé après
  // coup, et nommer une colonne absente ferait échouer toute la requête au
  // lieu de simplement manquer un champ.
  const { data: avatarRaw } = student
    ? await (supabase.from("student_avatar") as any)
        .select("*")
        .eq("student_id", student.id)
        .maybeSingle()
    : { data: null };

  const initial = {
    base:      avatarRaw?.base ?? "robot_blue",
    hat:       avatarRaw?.hat ?? null,
    accessory: avatarRaw?.accessory ?? null,
    color:     avatarRaw?.color ?? "#3b82f6",
    accent:    avatarRaw?.accent ?? ACCENT_DEFAUT,
  };

  // Sans ligne `students`, il n'y a rien à enregistrer : c'est le cas d'un
  // admin qui visite l'espace élève. Le bouton affichait pourtant « ✅
  // Configuration sauvegardée » alors que l'action renvoyait « Élève
  // introuvable » depuis le début.
  const apercu = !student;

  return (
    <AvatarClient
      xp={student?.xp ?? 0}
      level={student?.level ?? 1}
      name={profile?.display_name ?? "Joueur"}
      initial={initial}
      apercu={apercu}
    />
  );
}
