import { createClient } from "@/lib/supabase/server";
import { getEffectiveNavPermissions } from "./access";

export type AtelierAccess =
  /** Membre du staff connecté et autorisé : pas de mot de passe à saisir. */
  | { kind: "staff"; displayName: string }
  /** Prof/manager dont l'admin a désactivé l'Atelier dans /admin/droits. */
  | { kind: "denied" }
  /** Animateur externe ou visiteur : parcours mot de passe partagé, inchangé. */
  | { kind: "external" };

/**
 * Détermine comment l'utilisateur courant accède au tableau de bord Mentor.
 *
 * Le lien de menu ne fait que masquer l'entrée : sans ce contrôle, l'URL
 * resterait ouverte à un prof désactivé. On refuse donc explicitement le staff
 * désactivé, sans lui proposer le repli par mot de passe partagé.
 */
export async function getAtelierAccess(): Promise<AtelierAccess> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { kind: "external" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .single<{ display_name: string; role: string }>();

  const role = profile?.role;
  if (role === "admin") {
    return { kind: "staff", displayName: profile?.display_name ?? "Admin" };
  }
  if (role !== "teacher" && role !== "manager") {
    return { kind: "external" };
  }

  const allowed = await getEffectiveNavPermissions(user.id, role);
  return allowed.has(`${role}.atelier`)
    ? { kind: "staff", displayName: profile?.display_name ?? "Mentor" }
    : { kind: "denied" };
}
