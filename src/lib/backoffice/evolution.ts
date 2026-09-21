/**
 * L'évolution d'un élève, vue par la direction — quatre questions et un statut.
 *
 *   Avance-t-il ?      son parcours, et son rythme comparé à ses séances
 *   Est-il régulier ?  sa dernière activité, ses jours actifs sur 30
 *   Comprend-il ?      ses quiz, ses « Je bloque ici », ses entraînements
 *   Son mentor dit     l'engagement et la note des derniers rapports
 *
 * Rien n'est enregistré pour cela : tout existe déjà en base. La progression
 * vient de `progression.ts`, la seule définition du parcours.
 *
 * `detail` : la liste des élèves ne demande que le statut ; la fiche d'un
 * élève demande tout, dont les réponses aux quiz, rangées dans
 * `block_progress` — trop lourdes pour être lues pour toute la liste.
 */
import { createAdminClient } from "@/lib/supabase/server";
import { chargerParcours, PARCOURS_VIDE, type Parcours } from "@/lib/progression";
import { occurrencesPassees } from "@/lib/rapports";
import { slugFromNum } from "@/lib/levels";
import { jourTogo } from "@/lib/planning/dates";
import { statutEleve, joursDepuis, type StatutEleve } from "./statut-eleve";

export type JourFrise = { jour: string; lecon: boolean; seance: boolean; blocage: boolean };

export type Evolution = {
  statut: StatutEleve;
  raisons: string[];
  // Avance-t-il ?
  parcours: Parcours;
  seancesPassees: number;
  leconsTerminees: number;
  // Est-il régulier ?
  derniereActivite: string | null;   // YYYY-MM-DD, heure du Togo
  joursDepuisActivite: number | null;
  joursActifs30: number;
  serie: number;
  // Comprend-il ?
  quiz: { justes: number; total: number } | null;
  questions: { sur30: number; ouvertes: number };
  entrainements: { faits: number; essaisMoyens: number | null } | null;
  // Son mentor dit
  rapports: { date: string; engagement: string | null; avancement: string | null; note: string | null }[];
  // Les 4 dernières semaines, du plus ancien au plus récent
  frise: JourFrise[];
};

type Ligne = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
const JOUR = 86_400_000;

export async function chargerEvolutions(ids: string[], detail = false, maintenant: Date = new Date()): Promise<Map<string, Evolution>> {
  const resultat = new Map<string, Evolution>();
  if (!ids.length) return resultat;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const depuis60 = new Date(maintenant.getTime() - 60 * JOUR).toISOString();

  const [eleves, progres, seances, rapports, questions, evenements, entrainements] = await Promise.all([
    admin.from("students").select("id, level, level_num, last_activity, streak_days, created_at").in("id", ids),
    admin.from("lesson_progress").select(`student_id, lesson_id, status, completed_at${detail ? ", block_progress" : ""}`).in("student_id", ids),
    admin.from("teacher_sessions").select("id, title, session_type, weekday, start_time, scheduled_at, active_from, active_until, created_at, student_id").in("student_id", ids),
    admin.from("session_reports").select("student_id, session_id, occurrence_date, reported_at, engagement, advancement, next_session_note").in("student_id", ids),
    admin.from("student_questions").select("student_id, lesson_id, created_at, closed_at").in("student_id", ids),
    admin.from("gamification_events").select("student_id, event_type, created_at").in("student_id", ids).gte("created_at", depuis60),
    detail
      ? admin.from("training_progress").select("student_id, status, attempts, completed_at, created_at").in("student_id", ids)
      : Promise.resolve({ data: [] }),
  ]);
  for (const [nom, res] of Object.entries({ eleves, progres, seances, rapports, questions, evenements, entrainements })) {
    if ((res as { error?: { message: string } }).error) console.error(`[evolution] ${nom} :`, (res as { error: { message: string } }).error.message);
  }

  // Les rapports de séance ne portaient pas l'élève : le formulaire du mentor
  // laissait `student_id` vide, et tous les rapports existants sont dans ce
  // cas. On les rattache donc par leur séance, qui, elle, connaît l'élève.
  const eleveDeSeance = new Map(((seances.data ?? []) as Ligne[]).map((s) => [s.id, s.student_id]));
  const parSeance = eleveDeSeance.size
    ? await admin.from("session_reports").select("student_id, session_id, occurrence_date, reported_at, engagement, advancement, next_session_note")
        .in("session_id", [...eleveDeSeance.keys()]).order("occurrence_date", { ascending: false })
    : { data: [] };
  if (parSeance.error) console.error("[evolution] rapports par séance :", parSeance.error.message);
  const tousRapports = new Map<string, Ligne>();
  for (const r of [...((rapports.data ?? []) as Ligne[]), ...((parSeance.data ?? []) as Ligne[])]) {
    const eleve = r.student_id ?? eleveDeSeance.get(r.session_id);
    if (eleve) tousRapports.set(`${r.session_id}|${r.occurrence_date}|${r.reported_at}`, { ...r, student_id: eleve });
  }
  const rapportsEleves = [...tousRapports.values()]
    .sort((a, b) => String(b.occurrence_date ?? b.reported_at).localeCompare(String(a.occurrence_date ?? a.reported_at)));

  const parcours = await chargerParcours(admin, ((eleves.data ?? []) as Ligne[]).map((e) => ({
    id: e.id, niveau: e.level ?? slugFromNum(e.level_num),
  })));

  const de = <T extends Ligne>(liste: T[] | null, id: string) => (liste ?? []).filter((x) => x.student_id === id);

  for (const e of (eleves.data ?? []) as Ligne[]) {
    const mesProgres = de(progres.data, e.id);
    const terminees = mesProgres.filter((p) => p.status === "completed");
    const nonFinies = new Set(mesProgres.filter((p) => p.status !== "completed").map((p) => p.lesson_id));
    const mesQuestions = de(questions.data, e.id);
    const mesEvenements = de(evenements.data, e.id);
    const mesRapports = de(rapportsEleves, e.id);
    const mesEntr = de(entrainements.data, e.id);

    // Séances passées : les récurrentes déroulées semaine par semaine.
    const occurrences = occurrencesPassees(de(seances.data, e.id));
    const premiere = occurrences.map((o) => o.date).sort()[0] ?? null;
    const debut = premiere ? new Date(`${premiere}T00:00:00Z`) : new Date(e.created_at);

    // La dernière trace laissée, quelle qu'elle soit.
    const traces: Date[] = [
      ...(e.last_activity ? [new Date(`${e.last_activity}T00:00:00Z`)] : []),
      ...mesEvenements.map((x) => new Date(x.created_at)),
      ...terminees.filter((p) => p.completed_at).map((p) => new Date(p.completed_at)),
      ...mesEntr.map((t) => new Date(t.completed_at ?? t.created_at)),
      ...mesQuestions.map((q) => new Date(q.created_at)),
    ];
    const derniere = traces.length ? new Date(Math.max(...traces.map((d) => d.getTime()))) : null;
    const actifs30 = new Set(traces.filter((d) => joursDepuis(d, maintenant) < 30).map((d) => jourTogo(d)));

    // « Je bloque ici » des 14 derniers jours, par leçon encore non finie.
    const parLecon = new Map<string, number>();
    for (const q of mesQuestions) {
      if (!q.lesson_id || !nonFinies.has(q.lesson_id) || joursDepuis(new Date(q.created_at), maintenant) >= 14) continue;
      parLecon.set(q.lesson_id, (parLecon.get(q.lesson_id) ?? 0) + 1);
    }

    const { statut, raisons } = statutEleve({
      debut,
      derniereActivite: derniere,
      seancesPassees: occurrences.length,
      leconsTerminees: terminees.length,
      engagements: mesRapports.map((r) => r.engagement ?? null),
      avancements: mesRapports.map((r) => r.advancement ?? null),
      blocagesParLecon: [...parLecon.values()],
    }, maintenant);

    // Les réponses aux quiz : une case par question, juste ou fausse.
    let quiz: Evolution["quiz"] = null;
    if (detail) {
      const reponses = mesProgres.flatMap((p) => Object.values(p.block_progress?.quizResults ?? {}))
        .filter((v): v is boolean => typeof v === "boolean");
      quiz = reponses.length ? { justes: reponses.filter(Boolean).length, total: reponses.length } : null;
    }

    const faits = mesEntr.filter((t) => t.status === "completed");
    const essais = faits.map((t) => t.attempts).filter((n): n is number => typeof n === "number");

    // La frise : 28 jours, du plus ancien au plus récent.
    const leconsDuJour = new Set([
      ...terminees.filter((p) => p.completed_at).map((p) => jourTogo(new Date(p.completed_at))),
      ...mesEvenements.filter((x) => x.event_type === "lesson_completed").map((x) => jourTogo(new Date(x.created_at))),
    ]);
    const seancesDuJour = new Set([...occurrences.map((o) => o.date), ...mesRapports.map((r) => r.occurrence_date).filter(Boolean)]);
    const blocagesDuJour = new Set(mesQuestions.map((q) => jourTogo(new Date(q.created_at))));
    const frise: JourFrise[] = [];
    for (let i = 27; i >= 0; i--) {
      const jour = jourTogo(new Date(maintenant.getTime() - i * JOUR));
      frise.push({ jour, lecon: leconsDuJour.has(jour), seance: seancesDuJour.has(jour), blocage: blocagesDuJour.has(jour) });
    }

    resultat.set(e.id, {
      statut, raisons,
      parcours: parcours.get(e.id) ?? PARCOURS_VIDE,
      seancesPassees: occurrences.length,
      leconsTerminees: terminees.length,
      derniereActivite: derniere ? jourTogo(derniere) : null,
      joursDepuisActivite: derniere ? joursDepuis(derniere, maintenant) : null,
      joursActifs30: actifs30.size,
      serie: e.streak_days ?? 0,
      quiz,
      questions: {
        sur30: mesQuestions.filter((q) => joursDepuis(new Date(q.created_at), maintenant) < 30).length,
        ouvertes: mesQuestions.filter((q) => !q.closed_at).length,
      },
      entrainements: detail ? { faits: faits.length, essaisMoyens: essais.length ? essais.reduce((a, b) => a + b, 0) / essais.length : null } : null,
      rapports: mesRapports.slice(0, 3).map((r) => ({
        date: r.occurrence_date ?? String(r.reported_at ?? "").slice(0, 10),
        engagement: r.engagement ?? null,
        avancement: r.advancement ?? null,
        note: r.next_session_note ?? null,
      })),
      frise,
    });
  }
  return resultat;
}
