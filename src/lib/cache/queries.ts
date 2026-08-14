/**
 * Requêtes mises en cache avec unstable_cache.
 * Ces fonctions utilisent l'admin client (pas de cookies) et sont donc
 * sûres à cacher globalement. Invalider via revalidateTag() après mutation.
 *
 * Tags:
 *   "trainings" — invalider quand un entraînement est créé/modifié/supprimé
 *   "lessons"   — invalider quand une leçon est créée/modifiée/supprimée
 *   "themes"    — invalider quand un thème est créé/modifié/supprimé
 */
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";

/** Liste complète des entraînements (id + lesson_id). Partagée entre tous les élèves. */
export const getCachedAllTrainings = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await (admin.from("trainings") as any).select("id, lesson_id");
    return (data ?? []) as { id: string; lesson_id: string }[];
  },
  ["all-trainings"],
  { revalidate: 300, tags: ["trainings"] },
);

/** Nombre total de leçons publiées (pour calcul de progression prof). */
export const getCachedAllLessons = unstable_cache(
  async () => {
    const admin = createAdminClient();
    const { data } = await admin.from("lessons").select("id");
    return (data ?? []) as { id: string }[];
  },
  ["all-lessons"],
  { revalidate: 300, tags: ["lessons"] },
);
