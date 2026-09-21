/**
 * Noter ce qu'un parent fait dans son espace — la visite, le certificat ouvert.
 *
 * Deux règles tiennent ce module :
 *   · une visite par heure au plus : c'est une présence qu'on mesure, pas des
 *     clics ;
 *   · il ne casse jamais rien : une erreur (table pas encore créée, réseau)
 *     est écrite dans les journaux du serveur, et la page du parent s'affiche
 *     comme si de rien n'était.
 */
import { createAdminClient } from "@/lib/supabase/server";

export type TypeActivite = "visite" | "certificat";

const UNE_HEURE = 3_600_000;

export async function noterActiviteParent(parentId: string, type: TypeActivite, cible?: string): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = createAdminClient() as any;

    if (type === "visite") {
      const depuis = new Date(Date.now() - UNE_HEURE).toISOString();
      const { data, error } = await admin.from("activite_parents").select("id")
        .eq("parent_id", parentId).eq("type", "visite").gte("created_at", depuis).limit(1);
      if (error) throw error;
      if (data?.length) return;
    }

    const { error } = await admin.from("activite_parents").insert({ parent_id: parentId, type, cible: cible ?? null });
    if (error) throw error;
  } catch (e) {
    console.error("[activite-parents]", (e as { message?: string })?.message ?? e);
  }
}
