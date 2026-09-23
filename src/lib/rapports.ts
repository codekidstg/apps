import { createAdminClient } from "@/lib/supabase/server";
// Le déroulé des séances récurrentes vit à côté, sans accès à la base : c'est
// ce qui le rend testable, et c'est là qu'est la fenêtre de dates.
export { occurrencesPassees, type Fenetre } from "@/lib/planning/occurrences-passees";
import { occurrencesPassees, type Fenetre } from "@/lib/planning/occurrences-passees";

/**
 * Rapports de séance — le chargement, partagé par les trois espaces. Les
 * libellés sont à côté (rapports-libelles.ts), lisibles aussi par le
 * navigateur, et ré-exportés ici pour les écrans serveur.
 *
 * Seul le mentor qui a fait la séance rédige. Admin et manager consultent.
 */

export { AVANCEMENT, ENGAGEMENT, AIDES, NON_TENUE } from "./rapports-libelles";

export type Occurrence = {
  cle: string;              // session_id|YYYY-MM-DD
  sessionId: string;
  titre: string;
  date: string;             // YYYY-MM-DD
  quand: string;            // ISO complet, pour l'heure
  mentor: string;
  eleve: string | null;
  rapport: Rapport | null;  // null = compte rendu manquant
};

export type Rapport = {
  id: string;
  reported_at: string;
  /** false : la séance n'a pas eu lieu — `raison_non_tenue` dit pourquoi. */
  tenue: boolean;
  raison_non_tenue: string | null;
  advancement: string | null;
  engagement: string | null;
  help_methods: string[] | null;
  difficulty_notes: string | null;
  next_session_note: string | null;
  /** La leçon travaillée en séance — le mentor la nomme (migration 038). */
  lesson_id: string | null;
  lesson_2_id: string | null;
  lecon_finie: boolean;
  lecon?: { title: string } | null;
  lecon_2?: { title: string } | null;
};

/**
 * Séances passées de toute la structure, chacune avec son rapport ou sans.
 * Un seul chargement pour l'écran admin et l'écran manager.
 *
 * `fenetre` borne le déroulé : sans elle, chaque affichage recalcule toutes les
 * semaines depuis la création de chaque séance récurrente. Les compteurs
 * rendus ne portent alors que sur la période demandée — l'écran le dit.
 */
export async function getRapportsData(fenetre: Fenetre = {}): Promise<{
  occurrences: Occurrence[];
  faits: number;
  manquants: number;
  /** Déclarées non tenues : ni un compte rendu fait, ni un compte rendu manquant. */
  nonTenues: number;
}> {
  const admin = createAdminClient();

  const [{ data: sessions, error: errS }, { data: rapports, error: errR }] = await Promise.all([
    (admin.from("teacher_sessions") as any)
      .select("*, profiles!teacher_id(display_name), students(id, profiles!profile_id(display_name))")
      .order("scheduled_at", { ascending: false }),
    (admin.from("session_reports") as any)
      // Deux clés étrangères vers `lessons` : PostgREST veut qu'on dise laquelle.
      .select("id, session_id, occurrence_date, reported_at, tenue, raison_non_tenue, advancement, engagement, help_methods, difficulty_notes, next_session_note, lesson_id, lesson_2_id, lecon_finie, lecon:lessons!lesson_id(title), lecon_2:lessons!lesson_2_id(title)")
      .order("reported_at", { ascending: false }),
  ]);

  // Une erreur ici viderait l'écran sans rien dire — c'est exactement ce qui
  // est arrivé au bloc du tableau de bord manager.
  if (errS) console.error("Rapports — séances :", errS.message);
  if (errR) console.error("Rapports — rapports :", errR.message);

  const parCle = new Map<string, Rapport>();
  for (const r of (rapports ?? []) as any[]) {
    const cle = `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`;
    if (!parCle.has(cle)) parCle.set(cle, r);
  }

  const occurrences: Occurrence[] = occurrencesPassees(sessions ?? [], fenetre).map(o => ({
    ...o,
    cle: `${o.sessionId}|${o.date}`,
    rapport: parCle.get(`${o.sessionId}|${o.date}`) ?? null,
  }));

  const tenues = occurrences.filter(o => o.rapport?.tenue !== false);
  return {
    occurrences,
    faits:     tenues.filter(o => o.rapport).length,
    manquants: tenues.filter(o => !o.rapport).length,
    nonTenues: occurrences.length - tenues.length,
  };
}
