"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { atelierOuvertA } from "@/lib/eleve/atelier";

/**
 * La sauvegarde de l'atelier.
 *
 * Elle part toute seule pendant que l'enfant écrit — s'il doit penser à
 * enregistrer, il perdra son programme une fois et ne reviendra pas.
 *
 * Les bornes sont les mêmes qu'en base (migration 040) : rien ne sert de
 * laisser passer ici ce que la contrainte refusera.
 */

const CODE_MAX = 100_000;
const SORTIE_MAX = 20_000;

export async function sauverAtelier(code: string, sortie: string | null): Promise<{ error?: string; ok?: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Reconnecte-toi pour enregistrer ton programme." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: eleve } = await admin
    .from("students").select("id, level, level_num").eq("profile_id", user.id).maybeSingle();
  if (!eleve) return { error: "Reconnecte-toi pour enregistrer ton programme." };
  if (!atelierOuvertA(eleve.level, eleve.level_num)) return { error: "L'atelier n'est pas ouvert à ton niveau." };

  if (code.length > CODE_MAX) return { error: "Ton programme est trop long pour être enregistré." };

  const { error } = await admin.from("atelier_eleve").upsert({
    student_id: eleve.id,
    code,
    sortie: sortie ? sortie.slice(0, SORTIE_MAX) : null,
  }, { onConflict: "student_id" });

  if (error) {
    console.error("[atelier] sauvegarde :", error.message);
    return { error: "Ton programme n'a pas pu être enregistré. Réessaie dans un instant." };
  }
  return { ok: true };
}
