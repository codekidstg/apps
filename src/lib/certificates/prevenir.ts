import { createAdminClient } from "@/lib/supabase/admin";
import { sendPushNotification } from "@/lib/push";

/**
 * Prévenir les parents qu'un certificat vient d'être émis.
 *
 * Le certificat de fin de thème s'émet TOUT SEUL à la dernière leçon
 * (`completeLesson` → `checkThemeCompletion` → `issueCertificate`), et il part
 * déjà validé : le parent peut le télécharger immédiatement depuis
 * /suivi/certificats. Mais rien ne le lui disait — la seule notification
 * existante est envoyée par le bouton du professeur, qui ne fait que
 * re-tamponner un certificat déjà valide.
 *
 * Autrement dit : le moment le plus fort du parcours arrivait en silence. Cette
 * fonction le dit.
 *
 * Elle ne lève jamais : un échec d'envoi ne doit pas empêcher un enfant de
 * terminer sa séance. Elle rend le nombre de notifications réellement parties.
 *
 * (Le même enchaînement existe dans prof/certificats/actions.ts pour la
 * validation manuelle. Je ne l'ai pas factorisé pour ne pas toucher à un
 * chemin qui fonctionne ; si un troisième appelant apparaît, il faudra le
 * faire.)
 */
export async function prevenirParentsCertificat(
  studentId: string,
  themeTitre?: string | null,
): Promise<number> {
  try {
    const admin = createAdminClient();

    const [{ data: eleve }, { data: liens }] = await Promise.all([
      (admin.from("students") as any)
        .select("profiles!profile_id(display_name)")
        .eq("id", studentId)
        .maybeSingle(),
      (admin.from("parent_children") as any).select("parent_id").eq("student_id", studentId),
    ]);

    const parents = ((liens ?? []) as { parent_id: string }[]).map((l) => l.parent_id);
    if (!parents.length) return 0;

    const prenom = (eleve?.profiles?.display_name ?? "Votre enfant").trim().split(/\s+/)[0];
    const sujet = themeTitre ? `« ${themeTitre} »` : "un thème complet";

    const { data: abos } = await (admin.from("push_subscriptions") as any)
      .select("subscription")
      .in("user_id", parents);

    let envoyees = 0;
    for (const { subscription } of (abos ?? []) as { subscription: unknown }[]) {
      const ok = await sendPushNotification(subscription as never, {
        title: "🎓 Un certificat vient d'être obtenu",
        body: `${prenom} a terminé ${sujet}. Le certificat est prêt à télécharger.`,
        icon: "/icons/icon-192.png",
        url: "/fr/suivi/certificats",
        tag: `cert-auto-${studentId}`,
      });
      if (ok) envoyees++;
    }
    return envoyees;
  } catch (e) {
    console.error("[certificat] notification parents :", e);
    return 0;
  }
}
