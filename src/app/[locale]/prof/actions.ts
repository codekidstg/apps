"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { validerLecon } from "@/lib/lecons/valider";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { NON_TENUE } from "@/lib/rapports";

export async function logLessonAccess(lessonId: string, themeId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? null;
  const ua = h.get("user-agent") ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase.rpc as any)("log_lesson_access", {
    p_user_id:   user.id,
    p_lesson_id: lessonId,
    p_theme_id:  themeId,
    p_ip:        ip,
    p_ua:        ua,
  });
}

export async function submitSessionReport(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const session_id       = formData.get("session_id") as string | null;
  const student_id       = formData.get("student_id") as string | null;
  const occurrence_date  = formData.get("occurrence_date") as string | null;
  const advancement      = formData.get("advancement") as string;
  const engagement       = formData.get("engagement") as string;
  const difficulty_notes = formData.get("difficulty_notes") as string | null;
  const help_methods     = formData.getAll("help_methods") as string[];
  const next_session_note = formData.get("next_session_note") as string | null;
  // La leçon travaillée : le mentor dit ce qui a été fait, rien ne le devine.
  const lesson_id   = (formData.get("lesson_id") as string | null) || null;
  const lesson_2_id = (formData.get("lesson_2_id") as string | null) || null;
  const lecon_finie = formData.get("lecon_finie") === "1";
  // La seconde leçon n'a pas sa colonne dans `session_reports` : elle pilote la
  // proposition de validation, et la vérité vit dans `lesson_progress`, qui est
  // le seul endroit qui commande le déverrouillage.
  const lecon_2_finie = formData.get("lecon_2_finie") === "1";

  // Une séance qui n'a pas eu lieu se déclare aussi : elle ne laisse ni
  // avancement ni engagement, seulement sa raison.
  const tenue  = formData.get("tenue") !== "0";
  const raison = (formData.get("raison_non_tenue") as string | null) ?? null;
  if (!tenue && !(raison && raison in NON_TENUE)) return { error: "Dites pourquoi la séance n'a pas eu lieu." };
  if (tenue && (!advancement || !engagement)) return { error: "Il manque l'avancement ou l'engagement de l'élève." };

  // Le formulaire n'envoie pas l'élève : on le retrouve par la séance. Sans
  // cela, aucun rapport n'était rattaché à un enfant — les 12 premiers ont
  // tous un student_id vide.
  let eleve = student_id || null;
  if (!eleve && session_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: seance } = await (supabase.from("teacher_sessions") as any)
      .select("student_id").eq("id", session_id).maybeSingle();
    eleve = seance?.student_id ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("session_reports") as any).insert({
    session_id:       session_id || null,
    teacher_id:       user.id,
    student_id:       eleve,
    occurrence_date:  occurrence_date || null,
    tenue,
    raison_non_tenue: tenue ? null : raison,
    advancement:      tenue ? advancement : null,
    engagement:       tenue ? engagement : null,
    difficulty_notes: difficulty_notes || null,
    help_methods:     tenue ? help_methods : [],
    next_session_note: tenue ? (next_session_note || null) : null,
    // Une séance non tenue n'a travaillé aucune leçon, et une deuxième leçon
    // sans première n'a pas de sens — la base le refuse aussi.
    lesson_id:        tenue ? lesson_id : null,
    lesson_2_id:      tenue && lesson_id && lesson_2_id !== lesson_id ? lesson_2_id : null,
    lecon_finie:      Boolean(tenue && lesson_id && lecon_finie),
  });

  if (error) return { error: error.message };
  revalidatePath("/prof/planning");
  // Le mentor dit qu'ils l'ont terminée ensemble : l'écran le lui proposera,
  // il ne se décide pas ici. L'enfant valide ce qu'il a fait, le mentor dit ce
  // qui a été travaillé — deux vérités différentes (voir migration 038).
  // Les leçons à proposer à la validation, dans l'ordre. Deux, c'est permis
  // quand tout était juste ; ce n'est jamais suggéré.
  const aValider = [
    tenue && lecon_finie   && lesson_id   ? lesson_id   : null,
    tenue && lecon_2_finie && lesson_2_id && lesson_2_id !== lesson_id ? lesson_2_id : null,
  ].filter(Boolean) as string[];

  return { success: true, aProposer: aValider[0] ?? null, aValider };
}

export async function upsertGrade(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const student_id = formData.get("student_id") as string;
  const theme_id   = formData.get("theme_id") as string;
  const score      = formData.get("score") ? Number(formData.get("score")) : null;
  const comment    = formData.get("comment") as string || null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from("grades") as any).upsert({
    teacher_id: user.id,
    student_id,
    theme_id,
    score,
    comment,
    graded_at: new Date().toISOString(),
  }, { onConflict: "teacher_id,student_id,theme_id" });

  if (error) return { error: error.message };
  revalidatePath("/prof/classes");
  return { success: true };
}

/**
 * Marquer une leçon terminée pour l'élève, à la demande du mentor.
 *
 * Le compte rendu dit « on l'a terminée ensemble » ; l'écran le propose, le
 * mentor accepte, et alors seulement l'enfant a sa leçon validée et ses
 * points. Le 23 septembre, ce geste s'est fait à la main, après un tour de
 * téléphone : Kenneth et Samuel avaient fini « Choisir » en séance, et
 * l'application les croyait encore au milieu — donc bloqués sur leur leçon
 * suivante et privés de leurs entraînements.
 *
 * L'XP passe par le moteur du jeu, qui tient le compte de ce qui a déjà été
 * payé : refaire la leçon ensuite ne la paiera pas une seconde fois.
 */
/**
 * Le mentor valide la leçon travaillée en séance.
 *
 * C'est la SEULE porte qui écrit `completed` depuis le 30 septembre 2026 :
 * l'enfant, lui, ne fait plus que préparer. Cette validation verse la prime de
 * fin de leçon et ouvre la leçon suivante.
 *
 * La direction peut valider aussi — un mentor qui oublie de cocher bloquerait
 * sinon son élève jusqu'à la semaine suivante, et c'est Roland qui reçoit
 * l'appel.
 */
export async function marquerLeconTerminee(lessonId: string, studentId: string, leJour?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const [{ data: profil }, { data: eleve }] = await Promise.all([
    supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>(),
    (admin.from("students") as any).select("id, teacher_id").eq("id", studentId).maybeSingle(),
  ]);
  const autorise = profil?.role === "admin" || profil?.role === "manager" || eleve?.teacher_id === user.id;
  if (!eleve || !autorise) return { error: "Seul le mentor de cet élève peut valider sa leçon." };

  const r = await validerLecon(studentId, lessonId, user.id, leJour);
  if ("error" in r) return { error: r.error };

  revalidatePath("/prof/rapports");
  revalidatePath("/eleve");
  return { success: true, xp: r.xp, deja: r.deja };
}


