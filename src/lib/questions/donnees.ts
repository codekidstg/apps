import { createAdminClient } from "@/lib/supabase/server";
import type { Raison } from "./raisons";

/**
 * « Je bloque ici » — les lectures, pour l'élève, son mentor et son parent.
 *
 * Toutes passent par le client admin : chaque page a déjà vérifié qui la
 * visite (élève, mentor, parent) avant d'appeler ces fonctions, et les règles
 * de la migration 029 restent la ceinture de sécurité pour toute lecture
 * directe depuis un navigateur.
 */

export const DELAI_QUESTION_HEURES = 48;

export type EtatQuestion = "en_attente" | "repondue" | "reglee";

/** La copie figée de ce que l'enfant avait sous les yeux, et de ce qu'il avait fait. */
export type Contexte = {
  contenu?: { genre: "lecon" | "entrainement"; id: string; titre: string };
  bloc?: { type: string; jeu: string | null; titre: string | null; consigne: string | null };
  travail?: string | null;
  essais?: number;
};

export type Question = {
  id: string;
  eleveId: string;
  blocId: string;
  lessonId: string | null;
  trainingId: string | null;
  raison: Raison;
  message: string | null;
  poseeLe: string;
  misAJourLe: string;
  etat: EtatQuestion;
  enRetard: boolean;
  reponse: { texte: string; parNom: string; le: string; vueLe: string | null } | null;
  reglee: { note: string | null; parNom: string; le: string } | null;
  contexte: Contexte;
};

export type QuestionAvecEleve = Question & { eleveNom: string };

type Ligne = {
  id: string;
  student_id: string;
  lesson_id: string | null;
  training_id: string | null;
  block_id: string;
  reason: Raison;
  message: string | null;
  context: Contexte | null;
  created_at: string;
  updated_at: string;
  reply: string | null;
  replied_by: string | null;
  replied_at: string | null;
  closed_at: string | null;
  closed_by: string | null;
  closed_note: string | null;
  reply_seen_at: string | null;
};

export function etatQuestion(l: Pick<Ligne, "replied_at" | "closed_at">): EtatQuestion {
  if (l.replied_at) return "repondue";
  if (l.closed_at) return "reglee";
  return "en_attente";
}

function versQuestion(l: Ligne, noms: Map<string, string>, maintenant: number): Question {
  const etat = etatQuestion(l);
  return {
    id: l.id,
    eleveId: l.student_id,
    blocId: l.block_id,
    lessonId: l.lesson_id,
    trainingId: l.training_id,
    raison: l.reason,
    message: l.message,
    poseeLe: l.created_at,
    misAJourLe: l.updated_at,
    etat,
    enRetard: etat === "en_attente" && maintenant - new Date(l.created_at).getTime() > DELAI_QUESTION_HEURES * 3_600_000,
    reponse: l.reply && l.replied_at
      ? { texte: l.reply, parNom: noms.get(l.replied_by ?? "") ?? "Ton mentor", le: l.replied_at, vueLe: l.reply_seen_at }
      : null,
    reglee: l.closed_at
      ? { note: l.closed_note, parNom: noms.get(l.closed_by ?? "") ?? "Ton mentor", le: l.closed_at }
      : null,
    contexte: l.context ?? {},
  };
}

async function nomsDuPersonnel(admin: any, lignes: Ligne[]): Promise<Map<string, string>> {
  const ids = [...new Set(lignes.flatMap((l) => [l.replied_by, l.closed_by]).filter(Boolean))] as string[];
  if (!ids.length) return new Map();
  const { data, error } = await admin.from("profiles").select("id, display_name").in("id", ids);
  if (error) console.error("[questions] noms :", error.message);
  return new Map(((data ?? []) as { id: string; display_name: string | null }[]).map((p) => [p.id, p.display_name ?? "Ton mentor"]));
}

// ── Élève ───────────────────────────────────────────────────────────────────

/**
 * Pour un lecteur de leçon ou d'entraînement : la dernière question de l'élève
 * sur chaque exercice. Avec `marquerReponsesVues`, une réponse affichée sous
 * l'exercice compte comme lue, et la pastille du menu s'éteint.
 */
export async function questionsDuContenu(
  studentId: string,
  cible: { lessonId: string } | { trainingId: string },
  options: { marquerReponsesVues?: boolean } = {},
): Promise<Record<string, Question>> {
  const admin = createAdminClient();
  let requete = (admin.from("student_questions") as any).select("*").eq("student_id", studentId);
  requete = "lessonId" in cible ? requete.eq("lesson_id", cible.lessonId) : requete.eq("training_id", cible.trainingId);
  const { data, error } = await requete.order("created_at", { ascending: false });
  if (error) {
    console.error("[questions] contenu :", error.message);
    return {};
  }
  const lignes = (data ?? []) as Ligne[];
  const noms = await nomsDuPersonnel(admin, lignes);
  const maintenant = Date.now();

  const parBloc: Record<string, Question> = {};
  for (const l of lignes) if (!parBloc[l.block_id]) parBloc[l.block_id] = versQuestion(l, noms, maintenant);

  if (options.marquerReponsesVues) {
    const aMarquer = Object.values(parBloc).filter((q) => q.reponse && !q.reponse.vueLe).map((q) => q.id);
    await marquerReponsesVuesEleve(studentId, aMarquer);
  }
  return parBloc;
}

export async function chargerMesQuestions(studentId: string): Promise<Question[]> {
  const admin = createAdminClient();
  const { data, error } = await (admin.from("student_questions") as any)
    .select("*")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[questions] mes questions :", error.message);
    return [];
  }
  const lignes = (data ?? []) as Ligne[];
  const noms = await nomsDuPersonnel(admin, lignes);
  const maintenant = Date.now();
  return lignes.map((l) => versQuestion(l, noms, maintenant));
}

/** Une réponse lue ne doit plus allumer la pastille « Mes questions ». */
export async function marquerReponsesVuesEleve(studentId: string, ids: string[]): Promise<void> {
  if (!ids.length) return;
  const admin = createAdminClient();
  const { error } = await (admin.from("student_questions") as any)
    .update({ reply_seen_at: new Date().toISOString() })
    .eq("student_id", studentId)
    .in("id", ids)
    .not("replied_at", "is", null)
    .is("reply_seen_at", null);
  if (error) console.error("[questions] réponses vues :", error.message);
}

export async function compterReponsesNonVuesEleve(studentId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await (admin.from("student_questions") as any)
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .not("replied_at", "is", null)
    .is("reply_seen_at", null);
  if (error) {
    console.error("[questions] compteur élève :", error.message);
    return 0;
  }
  return count ?? 0;
}

// ── Mentor ──────────────────────────────────────────────────────────────────

async function elevesDuMentor(admin: any, teacherId: string): Promise<Map<string, string>> {
  const { data, error } = await admin
    .from("students")
    .select("id, profiles!profile_id(display_name)")
    .eq("teacher_id", teacherId);
  if (error) console.error("[questions] élèves du mentor :", error.message);
  return new Map(((data ?? []) as any[]).map((s) => [s.id as string, s.profiles?.display_name ?? "Élève"]));
}

export async function chargerQuestionsMentor(teacherId: string): Promise<{
  aTraiter: QuestionAvecEleve[];
  traitees: QuestionAvecEleve[];
}> {
  const admin = createAdminClient();
  const eleves = await elevesDuMentor(admin, teacherId);
  if (!eleves.size) return { aTraiter: [], traitees: [] };

  const { data, error } = await (admin.from("student_questions") as any)
    .select("*")
    .in("student_id", [...eleves.keys()])
    .order("created_at", { ascending: true });
  if (error) {
    console.error("[questions] mentor :", error.message);
    return { aTraiter: [], traitees: [] };
  }
  const lignes = (data ?? []) as Ligne[];
  const noms = await nomsDuPersonnel(admin, lignes);
  const maintenant = Date.now();
  const questions = lignes.map((l) => ({ ...versQuestion(l, noms, maintenant), eleveNom: eleves.get(l.student_id) ?? "Élève" }));

  // Les retards d'abord, puis la plus ancienne : premier arrivé, premier servi.
  const aTraiter = questions
    .filter((q) => q.etat === "en_attente")
    .sort((a, b) => Number(b.enRetard) - Number(a.enRetard) || a.poseeLe.localeCompare(b.poseeLe));
  const dateTraitement = (q: Question) => q.reponse?.le ?? q.reglee?.le ?? q.poseeLe;
  const traitees = questions
    .filter((q) => q.etat !== "en_attente")
    .sort((a, b) => dateTraitement(b).localeCompare(dateTraitement(a)))
    .slice(0, 20);

  return { aTraiter, traitees };
}

export async function compterQuestionsMentor(teacherId: string): Promise<number> {
  const admin = createAdminClient();
  const eleves = await elevesDuMentor(admin, teacherId);
  if (!eleves.size) return 0;
  const { count, error } = await (admin.from("student_questions") as any)
    .select("id", { count: "exact", head: true })
    .in("student_id", [...eleves.keys()])
    .is("replied_at", null)
    .is("closed_at", null);
  if (error) {
    console.error("[questions] compteur mentor :", error.message);
    return 0;
  }
  return count ?? 0;
}

// ── Parent ──────────────────────────────────────────────────────────────────

export async function chargerQuestionsEnfants(parentId: string): Promise<QuestionAvecEleve[]> {
  const admin = createAdminClient();
  const { data: liens, error: eLiens } = await (admin.from("parent_children") as any)
    .select("student_id, students(profiles!profile_id(display_name))")
    .eq("parent_id", parentId);
  if (eLiens) console.error("[questions] enfants :", eLiens.message);
  const enfants = new Map<string, string>(
    ((liens ?? []) as any[]).map((l) => [l.student_id as string, l.students?.profiles?.display_name ?? "Votre enfant"]),
  );
  if (!enfants.size) return [];

  const { data, error } = await (admin.from("student_questions") as any)
    .select("*")
    .in("student_id", [...enfants.keys()])
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    console.error("[questions] parent :", error.message);
    return [];
  }
  const lignes = (data ?? []) as Ligne[];
  const noms = await nomsDuPersonnel(admin, lignes);
  const maintenant = Date.now();
  return lignes.map((l) => ({ ...versQuestion(l, noms, maintenant), eleveNom: enfants.get(l.student_id) ?? "Votre enfant" }));
}
