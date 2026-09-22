"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { chargerSuiviMentors } from "./suivi-mentors";
import { lireMois, DEBUT_SUIVI, libelleMois } from "./mois";

/**
 * Enregistrer le bilan de fin de mois d'un mentor — admin et manager.
 *
 * La note n'est pas lue du formulaire : elle est recalculée ici, au moment de
 * l'enregistrement. Un champ caché serait un chiffre venu du navigateur, donc
 * un chiffre qui se change. C'est cette note recalculée qui est figée dans le
 * bilan, et l'ajustement s'ajoute à elle.
 */

const AJUSTEMENT_MAX = 10;

const texte = (v: FormDataEntryValue | null) => {
  const t = String(v ?? "").trim();
  return t ? t : null;
};

export type ResultatBilan = { error?: string; success?: boolean };

export async function enregistrerBilan(_prev: ResultatBilan, formData: FormData): Promise<ResultatBilan> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const { data: profil } = await supabase.from("profiles").select("role").eq("id", user.id)
    .single<{ role: string }>();
  if (profil?.role !== "admin" && profil?.role !== "manager") {
    return { error: "Le bilan d'un mentor est réservé à la direction." };
  }

  const mentorId = String(formData.get("mentorId") ?? "");
  const mois = String(formData.get("mois") ?? "");
  if (!mentorId) return { error: "Mentor manquant." };
  // Un mois d'avant le suivi, ou à venir, n'a pas de point à écrire.
  if (lireMois(mois) !== mois) {
    return { error: `Le suivi commence en ${libelleMois(DEBUT_SUIVI)}, et un mois à venir n'a pas encore eu lieu.` };
  }

  const brut = String(formData.get("ajustement") ?? "0").replace(",", ".");
  const ajustement = Math.trunc(Number(brut));
  if (!Number.isFinite(ajustement) || Math.abs(ajustement) > AJUSTEMENT_MAX) {
    return { error: `L'ajustement va de −${AJUSTEMENT_MAX} à +${AJUSTEMENT_MAX} points.` };
  }
  const raison = texte(formData.get("raisonAjustement"));
  if (ajustement !== 0 && !raison) return { error: "Un ajustement demande sa raison, écrite." };

  // La note du mois, recalculée à l'instant : c'est elle qu'on fige.
  const { mentors, erreur } = await chargerSuiviMentors({ mois, mentorId });
  if (erreur) return { error: erreur };
  const mentor = mentors[0];
  if (!mentor) return { error: "Ce mentor n'existe pas." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin.from("bilans_mentors").upsert({
    mentor_id: mentorId,
    mois,
    note_calculee: mentor.note.note,
    ajustement,
    raison_ajustement: ajustement === 0 ? null : raison,
    points_forts: texte(formData.get("pointsForts")),
    a_ameliorer: texte(formData.get("aAmeliorer")),
    decisions: texte(formData.get("decisions")),
    auteur_id: user.id,
  }, { onConflict: "mentor_id,mois" });
  if (error) return { error: error.message };

  for (const espace of ["admin", "manager"]) {
    revalidatePath(`/${espace}/mentors`);
    revalidatePath(`/${espace}/mentors/${mentorId}`);
  }
  return { success: true };
}
