import { createClient, createAdminClient } from "@/lib/supabase/server";
import { etatDe, type EtatMessage } from "./boite";

/**
 * Le côté parent de la boîte de réception.
 *
 * Le parent pouvait écrire à la direction, mais jamais relire ce qu'il avait
 * envoyé : la table n'avait pas de règle de lecture pour lui. Il voit
 * maintenant ses messages, où ils en sont, et la réponse quand elle arrive.
 */

export type MessageParent = {
  id: string;
  sujet: string;
  texte: string;
  envoyeLe: string;
  etat: EtatMessage;
  reponse: { texte: string; le: string } | null;
  cloture: { note: string | null; le: string } | null;
};

export async function chargerMessagesParent(parentId: string): Promise<MessageParent[]> {
  // Le client de l'utilisateur, pas le client admin : c'est la règle de
  // lecture de la migration 028 qui garantit qu'un parent ne voit que ses
  // propres messages.
  const supabase = await createClient();
  const { data, error } = await (supabase.from("contact_messages") as any)
    .select("*")
    .eq("parent_id", parentId)
    .order("created_at", { ascending: false })
    .limit(20);
  if (error) {
    console.error("[contact parent] messages :", error.message);
    return [];
  }
  return ((data ?? []) as any[]).map((l) => ({
    id: l.id,
    sujet: l.subject,
    texte: l.message,
    envoyeLe: l.created_at,
    etat: etatDe(l),
    reponse: l.reply && l.replied_at ? { texte: l.reply, le: l.replied_at } : null,
    cloture: l.closed_at ? { note: l.closed_note ?? null, le: l.closed_at } : null,
  }));
}

/** Une réponse lue ne doit plus allumer la pastille « Contact ». */
export async function marquerReponsesVues(parentId: string, ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const admin = createAdminClient();
  const { error } = await (admin.from("contact_messages") as any)
    .update({ reply_seen_at: new Date().toISOString() })
    .eq("parent_id", parentId)
    .in("id", ids)
    .not("replied_at", "is", null)
    .is("reply_seen_at", null);
  if (error) console.error("[contact parent] réponses vues :", error.message);
}

export async function compterReponsesNonVues(parentId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await (admin.from("contact_messages") as any)
    .select("id", { count: "exact", head: true })
    .eq("parent_id", parentId)
    .not("replied_at", "is", null)
    .is("reply_seen_at", null);
  if (error) {
    console.error("[contact parent] compteur :", error.message);
    return 0;
  }
  return count ?? 0;
}
