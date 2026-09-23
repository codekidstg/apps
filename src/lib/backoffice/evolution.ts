/**
 * L'évolution d'un élève, vue par la direction — quatre questions et un statut.
 *
 *   Avance-t-il ?      son parcours, sa leçon en cours, son rythme comparé à ses séances
 *   Est-il régulier ?  sa dernière activité, ses jours actifs sur 30
 *   Comprend-il ?      ses quiz, ses erreurs à revoir, ses « Je bloque ici », ses entraînements
 *   Son mentor dit     l'engagement, l'avancement et la note des derniers rapports
 *
 * Rien n'est enregistré pour cela : tout existe déjà en base. La progression
 * vient de `progression.ts`, la seule définition du parcours ; les règles qui
 * ne touchent pas la base sont dans `evolution-regles.ts`, avec leurs tests.
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
import { etatQuestion, type EtatQuestion } from "@/lib/questions/donnees";
import { RAISONS } from "@/lib/questions/raisons";
import { statutEleve, joursDepuis, type StatutEleve } from "./statut-eleve";
import {
  seancesComptees, exercicesAvecAide, joursDeTravail, etatLecon,
  type BlocLecon, type ErreurQuiz, type EvenementJeu, type ProgresLecon, type ProgresEntrainement,
} from "./evolution-regles";

export type JourFrise = { jour: string; lecon: boolean; entrainement: boolean; seance: boolean; blocage: boolean };

/** Un « Je bloque ici », tel que la direction le lit. */
export type QuestionVue = {
  date: string;             // YYYY-MM-DD, heure du Togo
  contenu: string | null;   // la leçon ou l'entraînement
  raison: string;
  message: string | null;
  etat: EtatQuestion;
  suite: string | null;     // la réponse du mentor, ou la note de clôture
  par: string | null;       // qui a répondu, ou clos
};

export type Evolution = {
  statut: StatutEleve;
  raisons: string[];
  // Avance-t-il ?
  parcours: Parcours;
  /** Séances passées depuis la création du compte — celles qui comptent pour le rythme. */
  seancesPassees: number;
  /** Séances passées avant la création du compte : rien ne pouvait s'y enregistrer. */
  seancesAvantCompte: number;
  /** La plus récente des séances comptées, et si son mentor en a fait le rapport. */
  derniereSeance: { date: string; aUnRapport: boolean } | null;
  /** Les séances que le mentor a déclarées non tenues, les plus récentes d'abord. */
  seancesNonTenues: { date: string; raison: string }[];
  leconsTerminees: number;
  /**
   * La prochaine leçon de son parcours, et où il en est — fiche seulement.
   * `ouverte` : il l'a ouverte, même sans y faire un exercice.
   */
  leconEnCours: { titre: string; ouverte: boolean; faits: number; total: number; erreurs: ErreurQuiz[] } | null;
  // Est-il régulier ?
  derniereActivite: string | null;   // YYYY-MM-DD, heure du Togo
  joursDepuisActivite: number | null;
  joursActifs30: number;
  serie: number;
  // Comprend-il ?
  quiz: { justes: number; total: number } | null;
  /** `liste` : fiche seulement — les questions en attente, et celles des 30 derniers jours. */
  questions: { sur30: number; enAttente: number; liste: QuestionVue[] };
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
    admin.from("session_reports").select("student_id, session_id, occurrence_date, reported_at, tenue, raison_non_tenue, engagement, advancement, next_session_note").in("student_id", ids),
    admin.from("student_questions")
      .select(`student_id, lesson_id, block_id, created_at, replied_at, closed_at${detail ? ", reason, message, context, reply, replied_by, closed_by, closed_note" : ""}`)
      // « bloqué » se mesure aux « Je bloque ici », pas aux messages que
      // l'enfant écrit à son mentor sans rien demander (migration 037).
      .eq("kind", "question")
      .in("student_id", ids),
    // `payload` dit si un « lesson_completed » est une leçon ou un entraînement.
    admin.from("gamification_events").select("student_id, event_type, created_at, payload").in("student_id", ids).gte("created_at", depuis60),
    // Lus aussi pour la liste : un entraînement refait est une activité, et la
    // liste doit donner le même statut que la fiche.
    admin.from("training_progress").select("student_id, training_id, status, attempts, completed_at, created_at").in("student_id", ids),
  ]);
  for (const [nom, res] of Object.entries({ eleves, progres, seances, rapports, questions, evenements, entrainements })) {
    if ((res as { error?: { message: string } }).error) console.error(`[evolution] ${nom} :`, (res as { error: { message: string } }).error.message);
  }

  // Les rapports de séance ne portaient pas l'élève : le formulaire du mentor
  // laissait `student_id` vide, et les premiers rapports sont dans ce cas. On
  // les rattache donc par leur séance, qui, elle, connaît l'élève.
  const eleveDeSeance = new Map(((seances.data ?? []) as Ligne[]).map((s) => [s.id, s.student_id]));
  const parSeance = eleveDeSeance.size
    ? await admin.from("session_reports").select("student_id, session_id, occurrence_date, reported_at, tenue, raison_non_tenue, engagement, advancement, next_session_note")
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

  // Fiche seulement : les exercices de la leçon en cours, et les noms de ceux
  // qui ont répondu aux « Je bloque ici ».
  const blocsParLecon = new Map<string, BlocLecon[]>();
  const noms = new Map<string, string>();
  if (detail) {
    const enCours = [...new Set([...parcours.values()].map((p) => p.prochaineLeconId).filter(Boolean))] as string[];
    const repondants = [...new Set(((questions.data ?? []) as Ligne[]).flatMap((q) => [q.replied_by, q.closed_by]).filter(Boolean))] as string[];
    const [blocs, profils] = await Promise.all([
      enCours.length
        ? admin.from("lesson_blocks").select("id, lesson_id, type, content, order_index").in("lesson_id", enCours).order("order_index")
        : Promise.resolve({ data: [] }),
      repondants.length
        ? admin.from("profiles").select("id, display_name").in("id", repondants)
        : Promise.resolve({ data: [] }),
    ]);
    if (blocs.error) console.error("[evolution] exercices :", blocs.error.message);
    if (profils.error) console.error("[evolution] répondants :", profils.error.message);
    for (const b of (blocs.data ?? []) as Ligne[]) {
      blocsParLecon.set(b.lesson_id, [...(blocsParLecon.get(b.lesson_id) ?? []), { id: b.id, type: b.type, content: b.content }]);
    }
    for (const p of (profils.data ?? []) as Ligne[]) if (p.display_name) noms.set(p.id, p.display_name);
  }

  const de = <T extends Ligne>(liste: T[] | null, id: string) => (liste ?? []).filter((x) => x.student_id === id);
  // L'état d'un « Je bloque ici » tel que le voit le mentor. « En attente » :
  // ni répondue ni réglée — une question répondue n'est jamais « réglée ».
  const etat = (q: Ligne) => etatQuestion({ replied_at: q.replied_at ?? null, closed_at: q.closed_at ?? null });
  const enAttente = (q: Ligne) => etat(q) === "en_attente";

  for (const e of (eleves.data ?? []) as Ligne[]) {
    const mesProgres = de(progres.data, e.id);
    const terminees = mesProgres.filter((p) => p.status === "completed");
    const mesQuestions = de(questions.data, e.id);
    const mesEvenements = de(evenements.data, e.id);
    const mesRapports = de(rapportsEleves, e.id);
    const mesEntr = de(entrainements.data, e.id);
    const monParcours: Parcours = parcours.get(e.id) ?? PARCOURS_VIDE;

    // Séances passées : les récurrentes déroulées semaine par semaine. Pour le
    // rythme, seules comptent celles qui suivent la création du compte.
    // Les séances d'avant le compte ne comptent pas dans son rythme : on les
    // affiche seulement en nombre. Deux mois de marge suffisent — une séance
    // ne précède jamais l'élève de plus d'un jour, elle se crée depuis sa
    // fiche —, et au-delà on ne déroulerait que des semaines à jeter.
    const depuis = new Date(new Date(e.created_at).getTime() - 60 * JOUR);
    const occurrences = occurrencesPassees(de(seances.data, e.id), { depuis });
    // Une séance déclarée non tenue n'a pas eu lieu : ni dans le rythme, ni
    // dans la frise. Son mentor l'a dit, avec sa raison.
    const rapportDe = new Map(mesRapports.map((r) => [`${r.session_id}|${r.occurrence_date}`, r]));
    const nonTenue = (o: { sessionId: string; date: string }) => rapportDe.get(`${o.sessionId}|${o.date}`)?.tenue === false;
    const tenues = occurrences.filter((o) => !nonTenue(o));
    const rapportsTenus = mesRapports.filter((r) => r.tenue !== false);
    const { comptees, avant } = seancesComptees(tenues.map((o) => o.date), new Date(e.created_at));
    const ordre = [...comptees].sort();
    const premiere = ordre[0] ?? null;
    const derniereComptee = ordre[ordre.length - 1] ?? null;
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

    const { statut, raisons } = statutEleve({
      debut,
      derniereActivite: derniere,
      seancesPassees: comptees.length,
      leconsTerminees: terminees.length,
      engagements: rapportsTenus.map((r) => r.engagement ?? null),
      avancements: rapportsTenus.map((r) => r.advancement ?? null),
      blocagesParLecon: exercicesAvecAide(
        mesQuestions.map((q) => ({ lessonId: q.lesson_id ?? null, blockId: q.block_id, creeLe: new Date(q.created_at) })),
        new Set(terminees.map((p) => p.lesson_id)),
        maintenant,
      ),
    }, maintenant);

    // Fiche seulement : les réponses aux quiz, une case par question, et la
    // leçon en cours, exercice par exercice.
    let quiz: Evolution["quiz"] = null;
    let leconEnCours: Evolution["leconEnCours"] = null;
    if (detail) {
      const reponses = mesProgres.flatMap((p) => Object.values(p.block_progress?.quizResults ?? {}))
        .filter((v): v is boolean => typeof v === "boolean");
      quiz = reponses.length ? { justes: reponses.filter(Boolean).length, total: reponses.length } : null;

      const id = monParcours.prochaineLeconId;
      if (id) {
        const ligne = mesProgres.find((p) => p.lesson_id === id);
        leconEnCours = {
          titre: monParcours.prochaineLecon ?? "Leçon",
          ouverte: !!ligne,
          ...etatLecon(blocsParLecon.get(id) ?? [], ligne?.block_progress ?? null),
        };
      }
    }

    const faits = mesEntr.filter((t) => t.status === "completed");
    const essais = faits.map((t) => t.attempts).filter((n): n is number => typeof n === "number");

    // La frise : 28 jours, du plus ancien au plus récent. Les séances d'avant
    // le compte y restent : elles ont eu lieu.
    const travail = joursDeTravail(mesEvenements as EvenementJeu[], mesProgres as ProgresLecon[], mesEntr as ProgresEntrainement[]);
    const seancesDuJour = new Set([...tenues.map((o) => o.date), ...rapportsTenus.map((r) => r.occurrence_date).filter(Boolean)]);
    const blocagesDuJour = new Set(mesQuestions.map((q) => jourTogo(new Date(q.created_at))));
    const frise: JourFrise[] = [];
    for (let i = 27; i >= 0; i--) {
      const jour = jourTogo(new Date(maintenant.getTime() - i * JOUR));
      frise.push({
        jour,
        lecon: travail.lecons.has(jour),
        entrainement: travail.entrainements.has(jour),
        seance: seancesDuJour.has(jour),
        blocage: blocagesDuJour.has(jour),
      });
    }

    const liste: QuestionVue[] = !detail ? [] : mesQuestions
      .filter((q) => enAttente(q) || joursDepuis(new Date(q.created_at), maintenant) < 30)
      .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)))
      .slice(0, 5)
      .map((q) => {
        const etatQ = etat(q);
        const raison = RAISONS.find((r) => r.id === q.reason);
        return {
          date: jourTogo(new Date(q.created_at)),
          contenu: q.context?.contenu?.titre ?? null,
          raison: raison ? `${raison.emoji} ${raison.libelle}` : "💬 Autre chose",
          message: q.message ?? null,
          etat: etatQ,
          suite: etatQ === "repondue" ? q.reply ?? null : etatQ === "reglee" ? q.closed_note ?? null : null,
          par: noms.get(etatQ === "repondue" ? q.replied_by : q.closed_by) ?? null,
        };
      });

    resultat.set(e.id, {
      statut, raisons,
      parcours: monParcours,
      seancesPassees: comptees.length,
      seancesAvantCompte: avant,
      derniereSeance: derniereComptee
        ? { date: derniereComptee, aUnRapport: rapportsTenus.some((r) => r.occurrence_date === derniereComptee) }
        : null,
      leconsTerminees: terminees.length,
      leconEnCours,
      derniereActivite: derniere ? jourTogo(derniere) : null,
      joursDepuisActivite: derniere ? joursDepuis(derniere, maintenant) : null,
      joursActifs30: actifs30.size,
      serie: e.streak_days ?? 0,
      quiz,
      questions: {
        sur30: mesQuestions.filter((q) => joursDepuis(new Date(q.created_at), maintenant) < 30).length,
        enAttente: mesQuestions.filter(enAttente).length,
        liste,
      },
      entrainements: detail ? { faits: faits.length, essaisMoyens: essais.length ? essais.reduce((a, b) => a + b, 0) / essais.length : null } : null,
      seancesNonTenues: mesRapports
        .filter((r) => r.tenue === false)
        .slice(0, 3)
        .map((r) => ({ date: r.occurrence_date ?? String(r.reported_at ?? "").slice(0, 10), raison: r.raison_non_tenue ?? "" })),
      rapports: rapportsTenus.slice(0, 3).map((r) => ({
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
