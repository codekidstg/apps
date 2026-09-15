"use server";

import { revalidatePath } from "next/cache";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * Les trois gestes de la direction sur un message de parent : le prendre en
 * charge, y répondre, ou le clore quand il a été réglé autrement (un appel,
 * une discussion à la séance).
 *
 * Réservés à l'admin et au manager. Chaque geste marque aussi le message comme
 * lu : « lu » veut dire que quelqu'un s'en est occupé, pas qu'une liste a été
 * affichée.
 */

export type Resultat = { error?: string; success?: boolean };

const LONGUEUR_REPONSE_MAX = 4000;
const LONGUEUR_NOTE_MAX = 500;

async function appelant(): Promise<{ id: string } | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile, error } = await supabase
    .from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (error) console.error("[boite direction] rôle :", error.message);
  if (profile?.role !== "admin" && profile?.role !== "manager") return null;
  return { id: user.id };
}

/**
 * Les écrans concernés sont tous dans des segments `[locale]` : un chemin sans
 * ce segment ne revalide rien. En mode "layout", les pastilles de la barre
 * latérale et les alertes des tableaux de bord suivent aussi.
 */
function rafraichir() {
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/manager", "layout");
  revalidatePath("/[locale]/suivi", "layout");
}

async function lireMessage(id: string) {
  const admin = createAdminClient();
  const { data, error } = await (admin.from("contact_messages") as any)
    .select("id, read_at, claimed_by, replied_at, closed_at")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("[boite direction] lecture :", error.message);
  return { admin, ligne: data as { read_at: string | null; claimed_by: string | null; replied_at: string | null; closed_at: string | null } | null };
}

export async function prendreEnCharge(_prev: Resultat, formData: FormData): Promise<Resultat> {
  const moi = await appelant();
  if (!moi) return { error: "Accès réservé à la direction." };

  const id = String(formData.get("id") ?? "");
  const { admin, ligne } = await lireMessage(id);
  if (!ligne) return { error: "Message introuvable." };
  if (ligne.replied_at || ligne.closed_at) return { error: "Ce message est déjà traité." };

  const maintenant = new Date().toISOString();
  const { error } = await (admin.from("contact_messages") as any)
    .update({ claimed_by: moi.id, claimed_at: maintenant, read_at: ligne.read_at ?? maintenant })
    .eq("id", id);
  if (error) {
    console.error("[boite direction] prise en charge :", error.message);
    return { error: "La prise en charge a échoué. Réessayez dans un instant." };
  }
  rafraichir();
  return { success: true };
}

export async function repondre(_prev: Resultat, formData: FormData): Promise<Resultat> {
  const moi = await appelant();
  if (!moi) return { error: "Accès réservé à la direction." };

  const id = String(formData.get("id") ?? "");
  const texte = String(formData.get("reponse") ?? "").trim();
  if (!texte) return { error: "La réponse est vide." };
  if (texte.length > LONGUEUR_REPONSE_MAX) return { error: `La réponse dépasse ${LONGUEUR_REPONSE_MAX} caractères.` };

  const { admin, ligne } = await lireMessage(id);
  if (!ligne) return { error: "Message introuvable." };
  if (ligne.replied_at) return { error: "Une réponse a déjà été envoyée pour ce message." };

  const maintenant = new Date().toISOString();
  const { error } = await (admin.from("contact_messages") as any)
    .update({
      reply: texte,
      replied_by: moi.id,
      replied_at: maintenant,
      claimed_by: ligne.claimed_by ?? moi.id,
      ...(ligne.claimed_by ? {} : { claimed_at: maintenant }),
      read_at: ligne.read_at ?? maintenant,
    })
    .eq("id", id);
  if (error) {
    console.error("[boite direction] réponse :", error.message);
    return { error: "La réponse n'a pas pu être enregistrée. Réessayez dans un instant." };
  }
  rafraichir();
  return { success: true };
}

export async function clore(_prev: Resultat, formData: FormData): Promise<Resultat> {
  const moi = await appelant();
  if (!moi) return { error: "Accès réservé à la direction." };

  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim();
  if (note.length > LONGUEUR_NOTE_MAX) return { error: `La note dépasse ${LONGUEUR_NOTE_MAX} caractères.` };

  const { admin, ligne } = await lireMessage(id);
  if (!ligne) return { error: "Message introuvable." };
  if (ligne.replied_at) return { error: "Ce message a déjà reçu une réponse." };

  const maintenant = new Date().toISOString();
  const { error } = await (admin.from("contact_messages") as any)
    .update({
      closed_at: maintenant,
      closed_note: note || null,
      claimed_by: ligne.claimed_by ?? moi.id,
      ...(ligne.claimed_by ? {} : { claimed_at: maintenant }),
      read_at: ligne.read_at ?? maintenant,
    })
    .eq("id", id);
  if (error) {
    console.error("[boite direction] clôture :", error.message);
    return { error: "La clôture a échoué. Réessayez dans un instant." };
  }
  rafraichir();
  return { success: true };
}
