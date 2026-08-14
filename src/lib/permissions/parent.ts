import { redirect } from "next/navigation";
import { getEffectiveNavPermissions } from "./access";

/**
 * Vérifie qu'un parent a accès à une page donnée.
 * Redirige vers /suivi si la page est désactivée.
 */
export async function requireParentPermission(
  userId: string,
  pageKey: string,
  locale = "fr"
) {
  const allowed = await getEffectiveNavPermissions(userId, "parent");
  if (!allowed.has(pageKey)) {
    redirect(`/${locale}/suivi`);
  }
}
