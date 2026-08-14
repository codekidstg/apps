export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import RapportsClient from "./RapportsClient";

const WEEKDAY_SHORT = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

function buildPastOccurrences(sessions: any[]) {
  const out: { sessionId: string; title: string; at: Date; duration_min: number; studentName: string | null; recurring: boolean }[] = [];
  const now = new Date();
  const to  = new Date(now.getTime() - 1);

  for (const s of sessions) {
    if (s.session_type === "recurring") {
      // Ne remonter que depuis la création réelle de la session
      const createdAt = new Date(s.created_at);
      createdAt.setHours(0, 0, 0, 0);

      const [h, m] = (s.start_time as string).split(":").map(Number);
      const cursor = new Date(createdAt);
      cursor.setHours(h, m, 0, 0);
      const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor >= createdAt ? 0 : daysUntil === 0 ? 7 : daysUntil));

      while (cursor <= to) {
        if (!s.active_until || cursor <= new Date(s.active_until)) {
          out.push({ sessionId: s.id, title: s.title, at: new Date(cursor), duration_min: s.duration_min, studentName: s.students?.profiles?.display_name ?? null, recurring: true });
        }
        cursor.setDate(cursor.getDate() + 7);
      }
    } else {
      const at = new Date(s.scheduled_at);
      if (at <= to) {
        out.push({ sessionId: s.id, title: s.title, at, duration_min: s.duration_min, studentName: s.students?.profiles?.display_name ?? null, recurring: false });
      }
    }
  }
  return out.sort((a, b) => b.at.getTime() - a.at.getTime());
}

export default async function RapportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const [{ data: sessions }, { data: reportsRaw }] = await Promise.all([
    (admin.from("teacher_sessions") as any)
      .select("*, created_at, students(id, profiles!profile_id(display_name))")
      .eq("teacher_id", user.id)
      .order("weekday").order("start_time").order("scheduled_at"),
    (admin.from("session_reports") as any)
      .select("id, session_id, occurrence_date, reported_at, advancement, engagement, difficulty_notes, help_methods, next_session_note")
      .eq("teacher_id", user.id)
      .order("reported_at", { ascending: false }),
  ]);

  const past = buildPastOccurrences(sessions ?? []);

  // Index par (session_id, occurrence_date) pour que chaque occurrence soit unique
  const reportsByKey = new Map<string, any>();
  for (const r of (reportsRaw ?? [])) {
    const key = `${r.session_id ?? ""}|${r.occurrence_date ?? ""}`;
    if (!reportsByKey.has(key)) reportsByKey.set(key, r);
  }

  const items = past.map(occ => {
    const occDate = occ.at.toISOString().slice(0, 10);
    const key = `${occ.sessionId}|${occDate}`;
    return {
      sessionId:      occ.sessionId,
      occurrenceDate: occDate,
      title:          occ.title,
      dateStr:        occ.at.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }),
      dayShort:       WEEKDAY_SHORT[occ.at.getDay()],
      day:            occ.at.getDate(),
      monthShort:     occ.at.toLocaleDateString("fr-FR", { month: "short" }),
      time:           occ.at.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      duration:       occ.duration_min,
      studentName:    occ.studentName,
      recurring:      occ.recurring,
      report:         reportsByKey.get(key) ?? null,
    };
  });

  return <RapportsClient items={items} />;
}
