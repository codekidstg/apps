import { redirect } from "next/navigation";
import { getEffectiveNavPermissions } from "./access";

/**
 * Vérifie qu'un élève a accès à une page donnée.
 * Redirige vers /eleve si la page est désactivée.
 */
export async function requireStudentPermission(
  userId: string,
  pageKey: string,
  locale = "fr"
) {
  const allowed = await getEffectiveNavPermissions(userId, "student");
  if (!allowed.has(pageKey)) {
    redirect(`/${locale}/eleve`);
  }
}
