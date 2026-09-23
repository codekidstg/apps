export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RapportsClient from "./RapportsClient";
import { occurrencesPassees, debutPeriode, PERIODE_DEFAUT } from "@/lib/planning/occurrences-passees";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default async function RapportsPage() {
  // Le déroulé des séances est partagé (lib/planning/occurrences-passees.ts).
  // Cette page en gardait sa propre copie, qui remontait « sans limite de temps
  // en arrière » — et qui portait encore le défaut de la dernière séance d'une
  // récurrence, corrigé dans la fonction commune.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const [{ data: sessions }, { data: reportsRaw }] = await Promise.all([
    (admin.from("teacher_sessions") as any)
      .select("*, active_from, created_at, students(id, profiles!profile_id(display_name))")
      .eq("teacher_id", user.id)
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("session_reports") as any)
      .select("id, session_id, occurrence_date, reported_at, tenue, raison_non_tenue, advancement, engagement, difficulty_notes, help_methods, next_session_note")
      .eq("teacher_id", user.id)
      .order("reported_at", { ascending: false }),
  ]);

  const past = occurrencesPassees(sessions ?? [], { depuis: debutPeriode(PERIODE_DEFAUT) ?? undefined });

  // Index par (session_id, occurrence_date) pour que chaque occurrence soit unique
  const reportsByKey = new Map<string, any>();
  for (const r of (reportsRaw ?? [])) {
    const key = `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`;
    if (!reportsByKey.has(key)) reportsByKey.set(key, r);
  }

  // La note laissée à la séance précédente du même enfant : c'est elle que le
  // formulaire remet sous les yeux du mentor. Par élève, et non par séance :
  // un enfant peut changer de créneau sans que le fil se coupe.
  const eleveDeSeance = new Map<string, string>(
    (sessions ?? []).map((s: any) => [s.id, s.students?.id ?? s.student_id ?? s.id]),
  );
  const notesParEleve = new Map<string, { texte: string; date: string }[]>();
  for (const r of (reportsRaw ?? []).filter((r: any) => r.next_session_note?.trim())) {
    const eleve = eleveDeSeance.get(r.session_id) ?? r.session_id;
    notesParEleve.set(eleve, [...(notesParEleve.get(eleve) ?? []), {
      texte: r.next_session_note.trim(),
      quand: r.occurrence_date as string,
      date: new Date(`${r.occurrence_date}T12:00:00Z`).toLocaleDateString("fr-FR", { day: "numeric", month: "long" }),
    }].sort((a: any, b: any) => b.quand.localeCompare(a.quand)) as any);
  }
  const notePrecedenteDe = (sessionId: string, date: string) => {
    const eleve = eleveDeSeance.get(sessionId) ?? sessionId;
    return (notesParEleve.get(eleve) ?? []).find((n: any) => n.quand < date) ?? null;
  };

  const items = past.map(occ => {
    const at = new Date(occ.quand);
    return {
      sessionId:      occ.sessionId,
      occurrenceDate: occ.date,
      title:          occ.titre,
      dateStr:        at.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      dayShort:       WEEKDAY_SHORT[at.getDay()],
      day:            at.getDate(),
      monthShort:     at.toLocaleDateString("fr-FR", { month: "short" }),
      time:           at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      duration:       occ.duree,
      studentName:    occ.eleve,
      recurring:      occ.recurrente,
      report:         reportsByKey.get(`${occ.sessionId}|${occ.date}`) ?? null,
      notePrecedente: notePrecedenteDe(occ.sessionId, occ.date),
    };
  });

  return <RapportsClient items={items} />;
}
