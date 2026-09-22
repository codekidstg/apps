import { createAdminClient } from "@/lib/supabase/server";
import { occurrencesPassees, type Rapport } from "@/lib/rapports";
import { NON_TENUE } from "@/lib/rapports-libelles";
import { chargerEvolutions } from "./evolution";
import { STATUT_ELEVE, type StatutEleve } from "./statut-eleve";
import { calculerNote, type NoteMentor, type SeanceDuMois, type QuestionDuMois, type EleveDuMois } from "./note-mentor";

// Les mois (début du suivi, fenêtre glissante) sont à côté, avec leurs tests,
// et ré-exportés ici : les écrans n'ont qu'un module à connaître.
export { libelleMois, moisCourant, moisDisponibles, lireMois, DEBUT_SUIVI, type Mois } from "./mois";

/**
 * Le suivi des mentors, mois par mois — pour le point de fin de mois.
 *
 * Un seul chargement sert la liste et la fiche : la liste demande tous les
 * mentors, la fiche un seul. Les deux voient donc exactement les mêmes faits,
 * et la note affichée en face d'un nom est celle que la fiche détaille.
 *
 * Ce qui entre dans la note est dans `note-mentor.ts`, sans accès à la base.
 * Ici, on ne fait que rassembler les faits du mois :
 *
 *   ses séances      les occurrences passées de ses séances, avec le compte
 *                    rendu qui leur correspond — ou son absence
 *   ses questions    les « Je bloque ici » de ses élèves, posés dans le mois
 *   ses élèves       leur statut, et ce que ses comptes rendus du mois en disent
 *
 * Le statut d'un élève est celui d'aujourd'hui : il se recalcule à chaque
 * lecture, et rien n'en garde la trace au jour le jour. Pour le point de fin de
 * mois, fait dans les jours qui suivent, c'est le bon. Sur un mois ancien, il
 * dit l'élève tel qu'il est maintenant — la fiche le précise.
 */

/** Une séance du mois, telle que la fiche l'affiche. */
export type SeanceVue = {
  cle: string;
  date: string;
  quand: string;
  titre: string;
  eleve: string | null;
  eleveId: string | null;
  rapport: Rapport | null;
};

export type QuestionVue = {
  id: string;
  eleve: string;
  eleveId: string;
  /** L'exercice : deux messages sur le même exercice font un seul échange. */
  exercice: string;
  poseeLe: string;
  traiteeLe: string | null;
  /** Le mentor a répondu, ou a réglé la question en séance. */
  comment: "repondue" | "reglee" | null;
};

export type EleveVue = {
  id: string;
  nom: string;
  statut: StatutEleve;
  raisons: string[];
  /** Au moins une séance comptée dans le mois. */
  avecSeance: boolean;
  /** Un compte rendu du mois dit la difficulté. */
  signale: boolean;
  /** Un compte rendu du mois dit quoi reprendre. */
  suite: boolean;
};

export type MentorMois = {
  id: string;
  nom: string;
  note: NoteMentor;
  seances: SeanceVue[];
  questions: QuestionVue[];
  eleves: EleveVue[];
};

type Ligne = Record<string, unknown> & { [k: string]: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

/** Un compte rendu qui dit la difficulté de l'élève, et pas seulement que tout va bien. */
function ditLaDifficulte(r: Rapport): boolean {
  return r.advancement === "blocked"
    || r.engagement === "distracted" || r.engagement === "disengaged"
    || !!r.difficulty_notes?.trim();
}

export async function chargerSuiviMentors(
  { mois, mentorId, maintenant = new Date() }: { mois: string; mentorId?: string; maintenant?: Date },
): Promise<{ mentors: MentorMois[]; erreur: string | null }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const [an, m] = mois.split("-").map(Number);
  const debut = new Date(Date.UTC(an, m - 1, 1)).toISOString();
  const fin = new Date(Date.UTC(an, m, 1)).toISOString();

  let requeteMentors = admin.from("profiles").select("id, display_name").eq("role", "teacher").order("display_name");
  if (mentorId) requeteMentors = requeteMentors.eq("id", mentorId);
  const { data: profils, error: erreurProfils } = await requeteMentors;
  if (erreurProfils) return { mentors: [], erreur: erreurProfils.message };

  const mentors = (profils ?? []) as { id: string; display_name: string | null }[];
  if (!mentors.length) return { mentors: [], erreur: null };
  const ids = mentors.map((p) => p.id);

  const [seances, eleves] = await Promise.all([
    admin.from("teacher_sessions")
      .select("*, profiles!teacher_id(display_name), students(id, profiles!profile_id(display_name))")
      .in("teacher_id", ids),
    admin.from("students").select("id, teacher_id, profiles!profile_id(display_name)").in("teacher_id", ids),
  ]);
  if (seances.error) return { mentors: [], erreur: seances.error.message };
  if (eleves.error) console.error("[suivi-mentors] élèves :", eleves.error.message);

  const lignesSeances = (seances.data ?? []) as Ligne[];
  const lignesEleves = (eleves.data ?? []) as Ligne[];
  const mentorDeSeance = new Map<string, string>(lignesSeances.map((s) => [s.id, s.teacher_id]));
  const eleveDeSeance = new Map<string, string | null>(lignesSeances.map((s) => [s.id, s.student_id ?? null]));
  const elevesDuMentor = new Map<string, Ligne[]>();
  for (const e of lignesEleves) {
    const arr = elevesDuMentor.get(e.teacher_id) ?? [];
    arr.push(e);
    elevesDuMentor.set(e.teacher_id, arr);
  }

  // Les comptes rendus des séances de ces mentors, et les questions de leurs
  // élèves posées dans le mois. Le statut des élèves vient d'`evolution`, la
  // seule définition du parcours.
  const idsEleves = lignesEleves.map((e) => e.id as string);
  const [rapports, questions, evolutions] = await Promise.all([
    lignesSeances.length
      ? admin.from("session_reports")
          .select("id, session_id, student_id, occurrence_date, reported_at, tenue, raison_non_tenue, advancement, engagement, help_methods, difficulty_notes, next_session_note")
          .in("session_id", [...mentorDeSeance.keys()])
          .order("reported_at", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
    idsEleves.length
      ? admin.from("student_questions")
          .select("id, student_id, block_id, created_at, replied_at, closed_at")
          .in("student_id", idsEleves).gte("created_at", debut).lt("created_at", fin)
      : Promise.resolve({ data: [], error: null }),
    chargerEvolutions(idsEleves),
  ]);
  if (rapports.error) console.error("[suivi-mentors] rapports :", rapports.error.message);
  if (questions.error) console.error("[suivi-mentors] questions :", questions.error.message);

  // Un compte rendu par occurrence : le plus récent gagne, comme partout
  // ailleurs. Et, par élève, ceux du mois — pour savoir ce que le mentor a dit.
  const parOccurrence = new Map<string, Rapport>();
  const rapportsDuMoisParEleve = new Map<string, Rapport[]>();
  for (const r of (rapports.data ?? []) as Ligne[]) {
    const cle = `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`;
    if (!parOccurrence.has(cle)) parOccurrence.set(cle, r as Rapport);
    const eleve = r.student_id ?? eleveDeSeance.get(r.session_id) ?? null;
    if (eleve && String(r.occurrence_date ?? "").startsWith(mois)) {
      const arr = rapportsDuMoisParEleve.get(eleve) ?? [];
      arr.push(r as Rapport);
      rapportsDuMoisParEleve.set(eleve, arr);
    }
  }

  const questionsParMentor = new Map<string, QuestionVue[]>();
  const nomEleve = new Map<string, string>(lignesEleves.map((e) => [e.id, e.profiles?.display_name ?? "Élève"]));
  const mentorDeleve = new Map<string, string>(lignesEleves.map((e) => [e.id, e.teacher_id]));
  for (const q of (questions.data ?? []) as Ligne[]) {
    const mentor = mentorDeleve.get(q.student_id);
    if (!mentor) continue;
    const arr = questionsParMentor.get(mentor) ?? [];
    arr.push({
      id: q.id,
      eleve: nomEleve.get(q.student_id) ?? "Élève",
      eleveId: q.student_id,
      exercice: q.block_id,
      poseeLe: q.created_at,
      traiteeLe: q.replied_at ?? q.closed_at ?? null,
      comment: q.replied_at ? "repondue" : q.closed_at ? "reglee" : null,
    });
    questionsParMentor.set(mentor, arr);
  }

  // Les occurrences du mois, mentor par mentor.
  const seancesParMentor = new Map<string, SeanceVue[]>();
  for (const o of occurrencesPassees(lignesSeances)) {
    if (!o.date.startsWith(mois)) continue;
    const mentor = mentorDeSeance.get(o.sessionId);
    if (!mentor) continue;
    const arr = seancesParMentor.get(mentor) ?? [];
    arr.push({
      cle: `${o.sessionId}|${o.date}`,
      date: o.date,
      quand: o.quand,
      titre: o.titre,
      eleve: o.eleve,
      eleveId: eleveDeSeance.get(o.sessionId) ?? null,
      rapport: parOccurrence.get(`${o.sessionId}|${o.date}`) ?? null,
    });
    seancesParMentor.set(mentor, arr);
  }

  const resultat: MentorMois[] = mentors.map((p) => {
    const sesSeances = (seancesParMentor.get(p.id) ?? []).sort((a, b) => b.quand.localeCompare(a.quand));
    const sesQuestions = (questionsParMentor.get(p.id) ?? []).sort((a, b) => b.poseeLe.localeCompare(a.poseeLe));

    // Un élève « vu dans le mois » : une séance qui a eu lieu. Sans cela, le
    // mentor n'avait aucun compte rendu à écrire sur lui.
    const vusDuMois = new Set(
      sesSeances.filter((s) => s.rapport?.tenue !== false).map((s) => s.eleveId).filter(Boolean) as string[],
    );

    const sesEleves: EleveVue[] = (elevesDuMentor.get(p.id) ?? []).map((e) => {
      const evo = evolutions.get(e.id);
      const duMois = rapportsDuMoisParEleve.get(e.id) ?? [];
      return {
        id: e.id,
        nom: e.profiles?.display_name ?? "Élève",
        statut: evo?.statut ?? "demarre",
        raisons: evo?.raisons ?? [],
        avecSeance: vusDuMois.has(e.id),
        signale: duMois.some(ditLaDifficulte),
        suite: duMois.some((r) => !!r.next_session_note?.trim()),
      };
    }).sort((a, b) => STATUT_ELEVE[a.statut].ordre - STATUT_ELEVE[b.statut].ordre || a.nom.localeCompare(b.nom));

    const pourLaNote: SeanceDuMois[] = sesSeances.map((s) => ({
      date: s.date,
      quand: s.quand,
      eleve: s.eleve,
      rapport: s.rapport && {
        tenue: s.rapport.tenue,
        raisonNonTenue: s.rapport.raison_non_tenue,
        rendule: s.rapport.reported_at,
        difficultes: !!s.rapport.difficulty_notes?.trim(),
        aides: !!s.rapport.help_methods?.length,
        noteProchaine: !!s.rapport.next_session_note?.trim(),
      },
    }));
    const questionsNote: QuestionDuMois[] = sesQuestions.map((q) => ({ eleve: q.eleve, exercice: q.exercice, poseeLe: q.poseeLe, traiteeLe: q.traiteeLe }));
    const elevesNote: EleveDuMois[] = sesEleves.map((e) => ({
      nom: e.nom,
      enDifficulte: e.statut === "bloque" || e.statut === "ralentit",
      avecSeance: e.avecSeance,
      signale: e.signale,
      suite: e.suite,
    }));

    return {
      id: p.id,
      nom: p.display_name ?? "Mentor",
      note: calculerNote({ seances: pourLaNote, questions: questionsNote, eleves: elevesNote }, maintenant),
      seances: sesSeances,
      questions: sesQuestions,
      eleves: sesEleves,
    };
  });

  return { mentors: resultat, erreur: null };
}

/** Le libellé d'une raison de non-tenue, pour l'affichage. */
export function libelleNonTenue(raison: string | null): string {
  return NON_TENUE[raison ?? ""]?.label ?? "raison non dite";
}
