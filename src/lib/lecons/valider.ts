import { createAdminClient } from "@/lib/supabase/server";
import { processGamificationEvent } from "@/lib/gamification/process-event";
import { checkThemeCompletion, issueCertificate } from "@/lib/certificates/generate";
import { prevenirParentsCertificat } from "@/lib/certificates/prevenir";

/**
 * Valider une leçon — le seul endroit où une leçon devient `completed`.
 *
 * Depuis le 30 septembre 2026, l'enfant ne termine plus une leçon : il la
 * PRÉPARE. C'est le mentor, en séance, qui valide — et c'est la validation qui
 * verse la prime de fin de leçon et ouvre la suivante.
 *
 * Tout ce qui suivait la fin d'une leçon a donc déménagé ici : la prime, le
 * certificat de thème, et l'avis aux parents. Sans ce déménagement, un thème
 * se serait certifié sur des leçons que personne n'a vues.
 *
 * La prime « sans faute » n'est pas recalculée : elle a été gagnée pendant la
 * préparation, parfois trois jours plus tôt, et elle est relue ici. Sans cela,
 * un enfant qui prépare parfaitement serait payé moins qu'un enfant qui fait
 * tout en séance.
 */
export async function validerLecon(
  studentId: string,
  lessonId: string,
  parProfilId: string,
  quandJour?: string,
): Promise<{ xp: number; deja?: true } | { error: string }> {
  const admin = createAdminClient();

  const { data: ligne } = await (admin.from("lesson_progress") as any)
    .select("id, status, score, prepare_sans_faute")
    .eq("student_id", studentId).eq("lesson_id", lessonId).maybeSingle();

  if (ligne?.status === "completed") return { xp: 0, deja: true };

  // Terminée le jour de la séance, pas le jour du clic : le mentor écrit
  // parfois son compte rendu le lendemain, et l'historique doit dire quand le
  // travail a eu lieu.
  const quand = quandJour
    ? new Date(`${quandJour}T12:00:00Z`).toISOString()
    : new Date().toISOString();

  const sansFaute = !!ligne?.prepare_sans_faute;
  const score = typeof ligne?.score === "number" ? ligne.score : 100;

  const { error } = ligne
    ? await (admin.from("lesson_progress") as any)
        .update({ status: "completed", completed_at: quand }).eq("id", ligne.id)
    : await (admin.from("lesson_progress") as any)
        .insert({ student_id: studentId, lesson_id: lessonId, status: "completed",
                  completed_at: quand, score });
  if (error) return { error: error.message };

  const resultat = await processGamificationEvent(studentId, "lesson_completed", {
    lessonId, score, perfect: sansFaute, enSeance: true,
  });

  await certifierSiThemeFini(studentId, lessonId, score, resultat.xpGained ?? 0, parProfilId);

  return { xp: resultat.xpGained ?? 0 };
}

/**
 * Le certificat de thème, quand la validation qui vient d'avoir lieu était la
 * dernière du thème. Jamais bloquant : un certificat qui rate ne doit pas
 * empêcher le mentor de valider.
 */
async function certifierSiThemeFini(
  studentId: string, lessonId: string, score: number, totalXp: number, parProfilId: string,
) {
  try {
    const admin = createAdminClient();
    const { data: lesson } = await admin
      .from("lessons").select("chapter_id").eq("id", lessonId).single<{ chapter_id: string }>();
    if (!lesson) return;

    const { data: chapter } = await admin
      .from("chapters").select("theme_id").eq("id", lesson.chapter_id).single<{ theme_id: string }>();
    if (!chapter?.theme_id) return;

    if (!(await checkThemeCompletion(studentId, chapter.theme_id))) return;

    const { data: existant } = await (admin.from("certificates") as any)
      .select("id").eq("student_id", studentId).eq("theme_id", chapter.theme_id)
      .eq("cert_type", "theme").maybeSingle();
    if (existant) return;

    const emis = await issueCertificate({
      studentId, type: "theme", themeId: chapter.theme_id, score, totalXp,
      validatedBy: parProfilId,
    });

    // Le certificat part validé, donc téléchargeable aussitôt — mais rien ne le
    // disait au parent : le moment le plus fort du parcours arrivait en silence.
    if (emis && !("error" in emis)) {
      const { data: theme } = await admin
        .from("themes").select("title").eq("id", chapter.theme_id).single<{ title: string }>();
      await prevenirParentsCertificat(studentId, theme?.title ?? null);
    }
  } catch (e) {
    console.error("[valider] certificat :", e instanceof Error ? e.message : String(e));
  }
}
