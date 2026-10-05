"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { atelierOuvertA } from "@/lib/eleve/atelier";
import { CODE_MAX, SORTIE_MAX, MAX_PROGRAMMES, titrePropre } from "@/lib/eleve/atelier-regles";
import { revalidatePath } from "next/cache";

/**
 * L'établi de l'enfant, côté serveur.
 *
 * Toutes ces actions commencent pareil : qui es-tu, l'atelier t'est-il ouvert,
 * et ce programme est-il le tien. Le `student_id` entre dans chaque requête —
 * jamais vérifié après coup, sinon une adresse devinée rendrait quelque chose.
 */

type Reponse = { error?: string; ok?: boolean };

async function etabli(): Promise<{ studentId: string } | { error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Reconnecte-toi pour enregistrer ton programme." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: eleve } = await admin
    .from("students").select("id, level, level_num").eq("profile_id", user.id).maybeSingle();
  if (!eleve) return { error: "Reconnecte-toi pour enregistrer ton programme." };
  if (!atelierOuvertA(eleve.level, eleve.level_num)) return { error: "L'atelier n'est pas ouvert à ton niveau." };

  return { studentId: eleve.id };
}

/** Le jeton du lien public : court, imprévisible, et qui se tape au besoin. */
function nouveauJeton(): string {
  const alphabet = "abcdefghijkmnopqrstuvwxyz23456789"; // sans l, 0, 1 : on les confond
  const octets = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(octets, (o) => alphabet[o % alphabet.length]).join("");
}

/** La sauvegarde automatique, pendant que l'enfant écrit. */
export async function sauverProgramme(id: string, code: string, sortie: string | null): Promise<Reponse> {
  const qui = await etabli();
  if ("error" in qui) return qui;
  if (code.length > CODE_MAX) return { error: "Ton programme est trop long pour être enregistré." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("atelier_eleve")
    .update({ code, sortie: sortie ? sortie.slice(0, SORTIE_MAX) : null })
    .eq("id", id)
    .eq("student_id", qui.studentId);

  if (error) {
    console.error("[atelier] sauvegarde :", error.message);
    return { error: "Ton programme n'a pas pu être enregistré. Réessaie dans un instant." };
  }
  return { ok: true };
}

/** Un programme neuf, déjà nommé d'après l'amorce dont il vient. */
export async function creerProgramme(titre: string, code: string): Promise<Reponse & { id?: string }> {
  const qui = await etabli();
  if ("error" in qui) return qui;
  if (code.length > CODE_MAX) return { error: "Ce programme est trop long." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { count } = await admin
    .from("atelier_eleve")
    .select("id", { count: "exact", head: true })
    .eq("student_id", qui.studentId);

  if ((count ?? 0) >= MAX_PROGRAMMES) {
    return { error: `Tu as déjà ${MAX_PROGRAMMES} programmes. Effaces-en un pour en commencer un nouveau.` };
  }

  const { data, error } = await admin
    .from("atelier_eleve")
    .insert({ student_id: qui.studentId, titre: titrePropre(titre), code })
    .select("id")
    .single();

  if (error) {
    console.error("[atelier] création :", error.message);
    return { error: "Le programme n'a pas pu être créé. Réessaie dans un instant." };
  }
  revalidatePath("/fr/eleve/atelier");
  return { ok: true, id: data.id };
}

export async function renommerProgramme(id: string, titre: string): Promise<Reponse> {
  const qui = await etabli();
  if ("error" in qui) return qui;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("atelier_eleve")
    .update({ titre: titrePropre(titre) })
    .eq("id", id)
    .eq("student_id", qui.studentId);

  if (error) {
    console.error("[atelier] renommage :", error.message);
    return { error: "Le nom n'a pas pu être changé." };
  }
  revalidatePath("/fr/eleve/atelier");
  return { ok: true };
}

export async function supprimerProgramme(id: string): Promise<Reponse> {
  const qui = await etabli();
  if ("error" in qui) return qui;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("atelier_eleve")
    .delete()
    .eq("id", id)
    .eq("student_id", qui.studentId);

  if (error) {
    console.error("[atelier] suppression :", error.message);
    return { error: "Le programme n'a pas pu être effacé." };
  }
  revalidatePath("/fr/eleve/atelier");
  return { ok: true };
}

/**
 * Allumer ou éteindre le lien public.
 *
 * Éteindre efface le jeton : l'adresse ne répond plus, pour tout le monde et
 * tout de suite. Rallumer en donne un nouveau — l'ancien lien, qui a pu être
 * transféré, reste mort.
 */
export async function basculerPartage(id: string, actif: boolean): Promise<Reponse & { jeton?: string | null }> {
  const qui = await etabli();
  if ("error" in qui) return qui;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const jeton = actif ? nouveauJeton() : null;
  const { error } = await admin
    .from("atelier_eleve")
    .update({ jeton })
    .eq("id", id)
    .eq("student_id", qui.studentId);

  if (error) {
    console.error("[atelier] partage :", error.message);
    return { error: "Le partage n'a pas pu être changé. Réessaie dans un instant." };
  }
  revalidatePath("/fr/eleve/atelier");
  return { ok: true, jeton };
}
