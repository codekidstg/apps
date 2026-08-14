"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendPushNotification } from "@/lib/push";

// ── Tarif mentor ─────────────────────────────────────────────

export async function setTeacherRate(
  teacherId: string,
  rateFcfa: number,
  rateType: "per_session" | "per_hour",
  notes?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { error } = await (admin.from("teacher_rates") as any).insert({
    teacher_id: teacherId,
    rate_fcfa: rateFcfa,
    rate_type: rateType,
    effective_from: new Date().toISOString().slice(0, 10),
    notes: notes || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  await (admin.from("compta_audit_log") as any).insert({
    table_name: "teacher_rates",
    record_id: teacherId,
    action: "rate_set",
    new_value: `${rateFcfa} FCFA/${rateType === "per_session" ? "séance" : "heure"}`,
    changed_by: user.id,
  });

  revalidatePath("/admin/compta/mentors");
  revalidatePath("/manager/compta/mentors");
  return { success: true };
}

// ── Tarif élève ──────────────────────────────────────────────

export async function setStudentRate(
  studentId: string,
  rateFcfa: number,
  notes?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const { error } = await (admin.from("student_session_rates") as any).insert({
    student_id: studentId,
    rate_fcfa: rateFcfa,
    effective_from: new Date().toISOString().slice(0, 10),
    notes: notes || null,
    created_by: user.id,
  });

  if (error) return { error: error.message };

  await (admin.from("compta_audit_log") as any).insert({
    table_name: "student_session_rates",
    record_id: studentId,
    action: "rate_set",
    new_value: `${rateFcfa} FCFA/séance`,
    changed_by: user.id,
  });

  revalidatePath("/admin/compta/parents");
  revalidatePath("/manager/compta/parents");
  return { success: true };
}

// ── Paiement mentor ──────────────────────────────────────────

export async function upsertMentorPayment(
  teacherId: string,
  sessionId: string | null,
  occurrenceDate: string,
  status: "pending_report" | "to_pay" | "paid",
  amountFcfa: number,
  notes?: string,
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();

  // Lire l'ancienne valeur pour l'audit
  const { data: existing } = await (admin.from("mentor_payments") as any)
    .select("id, status")
    .eq("teacher_id", teacherId)
    .eq("occurrence_date", occurrenceDate)
    .maybeSingle();

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    teacher_id: teacherId,
    session_id: sessionId,
    occurrence_date: occurrenceDate,
    status,
    amount_fcfa: amountFcfa,
    notes: notes || null,
    updated_by: user.id,
    updated_at: now,
  };
  if (status === "paid") row.paid_at = now;

  const { error } = await (admin.from("mentor_payments") as any).upsert(
    { ...row, created_by: user.id, created_at: now },
    { onConflict: "teacher_id,session_id,occurrence_date" },
  );
  if (error) return { error: error.message };

  // Audit
  if (existing?.status !== status) {
    await (admin.from("compta_audit_log") as any).insert({
      table_name: "mentor_payments",
      record_id: teacherId,
      action: "status_change",
      old_value: existing?.status ?? null,
      new_value: status,
      changed_by: user.id,
    });
  }

  // Notification push au mentor si marqué "paid"
  if (status === "paid") {
    const { data: subs } = await (admin.from("push_subscriptions") as any)
      .select("subscription")
      .eq("user_id", teacherId);
    for (const s of subs ?? []) {
      try {
        await sendPushNotification(s.subscription, {
          title: "Paiement reçu 💰",
          body: `Votre séance du ${new Date(occurrenceDate).toLocaleDateString("fr-FR")} a été marquée comme payée.`,
          icon: "/icons/icon-192.png",
          tag: `mentor-paid-${occurrenceDate}`,
        });
      } catch { /* non bloquant */ }
    }
  }

  revalidatePath("/admin/compta/mentors");
  revalidatePath("/manager/compta/mentors");
  return { success: true };
}

// ── Paiement parent ──────────────────────────────────────────

export async function upsertParentPayment(
  parentId: string,
  studentId: string,
  sessionId: string | null,
  occurrenceDate: string,
  status: "pending" | "paid" | "unpaid",
  amountFcfa: number,
  comment?: string,
) {
  if (status === "unpaid" && !comment?.trim()) {
    return { error: "Un commentaire est obligatoire pour un paiement impayé." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();

  const { data: existing } = await (admin.from("parent_session_payments") as any)
    .select("id, status")
    .eq("parent_id", parentId)
    .eq("student_id", studentId)
    .eq("occurrence_date", occurrenceDate)
    .maybeSingle();

  const now = new Date().toISOString();
  const row: Record<string, unknown> = {
    parent_id: parentId,
    student_id: studentId,
    session_id: sessionId,
    occurrence_date: occurrenceDate,
    status,
    amount_fcfa: amountFcfa,
    comment: comment || null,
    updated_by: user.id,
    updated_at: now,
  };
  if (status === "paid") row.paid_at = now;

  const { error } = await (admin.from("parent_session_payments") as any).upsert(
    { ...row, created_by: user.id, created_at: now },
    { onConflict: "parent_id,student_id,session_id,occurrence_date" },
  );
  if (error) return { error: error.message };

  if (existing?.status !== status) {
    await (admin.from("compta_audit_log") as any).insert({
      table_name: "parent_session_payments",
      record_id: parentId,
      action: "status_change",
      old_value: existing?.status ?? null,
      new_value: status,
      changed_by: user.id,
    });
  }

  revalidatePath("/admin/compta/parents");
  revalidatePath("/manager/compta/parents");
  return { success: true };
}

// ── Données compta mentors ───────────────────────────────────

export async function getComptaMentorsData(month: number, year: number) {
  const admin = createAdminClient();

  const [{ data: teachers }, { data: allSessions }, { data: allReports }, { data: allPayments }, { data: allRates }] =
    await Promise.all([
      (admin.from("profiles") as any).select("id, display_name").eq("role", "teacher").order("display_name"),
      (admin.from("teacher_sessions") as any)
        .select("id, teacher_id, title, session_type, weekday, start_time, scheduled_at, duration_min, active_from, active_until, student_id, students(id, profiles!profile_id(display_name))")
        .order("weekday").order("start_time"),
      (admin.from("session_reports") as any)
        .select("id, session_id, teacher_id, occurrence_date, advancement, engagement"),
      (admin.from("mentor_payments") as any)
        .select("id, teacher_id, session_id, occurrence_date, status, amount_fcfa, paid_at, notes"),
      (admin.from("teacher_rates") as any)
        .select("teacher_id, rate_fcfa, rate_type, effective_from")
        .order("effective_from", { ascending: false }),
    ]);

  // Index rapports par (session_id, occurrence_date)
  const reportsByKey = new Map<string, any>();
  for (const r of allReports ?? []) {
    const key = `${r.session_id}|${r.occurrence_date}`;
    if (!reportsByKey.has(key)) reportsByKey.set(key, r);
  }

  // Index paiements mentor
  const paymentsByKey = new Map<string, any>();
  for (const p of allPayments ?? []) {
    paymentsByKey.set(`${p.teacher_id}|${p.session_id}|${p.occurrence_date}`, p);
  }

  // Tarif le plus récent par teacher effectif dans ce mois :
  // on prend la fin du mois (ou aujourd'hui si mois courant) comme référence,
  // afin qu'un tarif créé en cours de mois soit immédiatement visible.
  const now = new Date();
  const monthEnd = new Date(year, month, 0);
  const _ref = monthEnd < now ? monthEnd : now;
  const rateRefDate = `${_ref.getFullYear()}-${String(_ref.getMonth()+1).padStart(2,"0")}-${String(_ref.getDate()).padStart(2,"0")}`;
  const rateByTeacher = new Map<string, { rate_fcfa: number; rate_type: string }>();
  for (const r of (allRates ?? []).sort((a: any, b: any) => b.effective_from.localeCompare(a.effective_from))) {
    if (!rateByTeacher.has(r.teacher_id) && r.effective_from <= rateRefDate) {
      rateByTeacher.set(r.teacher_id, { rate_fcfa: r.rate_fcfa, rate_type: r.rate_type });
    }
  }

  // Construire les occurrences du mois pour chaque session
  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  function buildMonthOccurrences(sessions: any[]): { sessionId: string; teacherId: string; title: string; at: Date; duration_min: number; studentName: string | null }[] {
    const out: any[] = [];
    for (const s of sessions) {
      if (s.session_type === "recurring") {
        const [h, m] = (s.start_time as string).split(":").map(Number);
        const cursor = new Date(from);
        cursor.setHours(h, m, 0, 0);
        const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
        cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor >= from ? 0 : daysUntil === 0 ? 7 : daysUntil));
        while (cursor <= to) {
          const af = s.active_from ? new Date(s.active_from) : null;
          if (cursor >= from && (!af || cursor >= af) && (!s.active_until || cursor <= new Date(s.active_until)) && cursor < new Date()) {
            out.push({ sessionId: s.id, teacherId: s.teacher_id, title: s.title, at: new Date(cursor), duration_min: s.duration_min, studentName: s.students?.profiles?.display_name ?? null });
          }
          cursor.setDate(cursor.getDate() + 7);
        }
      } else if (s.session_type === "once" && s.scheduled_at) {
        const at = new Date(s.scheduled_at);
        if (at >= from && at <= to && at < new Date()) {
          out.push({ sessionId: s.id, teacherId: s.teacher_id, title: s.title, at, duration_min: s.duration_min, studentName: s.students?.profiles?.display_name ?? null });
        }
      }
    }
    return out.sort((a, b) => a.at.getTime() - b.at.getTime());
  }

  const occurrences = buildMonthOccurrences(allSessions ?? []);

  const result = (teachers ?? []).map((t: any) => {
    const rate = rateByTeacher.get(t.id) ?? null;
    const myOccs = occurrences.filter(o => o.teacherId === t.id);

    const lines = myOccs.map(occ => {
      const occDate = occ.at.toISOString().slice(0, 10);
      const reportKey = `${occ.sessionId}|${occDate}`;
      const payKey    = `${t.id}|${occ.sessionId}|${occDate}`;
      const report    = reportsByKey.get(reportKey) ?? null;
      const payment   = paymentsByKey.get(payKey) ?? null;

      const hasReport = !!report;
      let status: "pending_report" | "to_pay" | "paid" = payment?.status ?? (hasReport ? "to_pay" : "pending_report");

      // Calcul montant
      let amount = payment?.amount_fcfa ?? 0;
      if (!payment && rate) {
        amount = rate.rate_type === "per_hour"
          ? Math.round((rate.rate_fcfa * occ.duration_min) / 60)
          : rate.rate_fcfa;
      }

      return {
        sessionId:      occ.sessionId,
        occurrenceDate: occDate,
        title:          occ.title,
        at:             occ.at,
        duration_min:   occ.duration_min,
        studentName:    occ.studentName,
        hasReport,
        report,
        status,
        amount,
        payment,
      };
    });

    const totalDue   = lines.filter(l => l.status !== "pending_report").reduce((s, l) => s + l.amount, 0);
    const totalPaid  = lines.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0);

    return { teacher: t, rate, lines, totalDue, totalPaid };
  }).filter((t: any) => t.lines.length > 0);

  return result;
}

// ── Données compta parents ───────────────────────────────────

export async function getComptaParentsData(month: number, year: number) {
  const admin = createAdminClient();

  const [{ data: parents }, { data: links }, { data: allSessions }, { data: allReports }, { data: allPayments }, { data: allRates }] =
    await Promise.all([
      (admin.from("profiles") as any).select("id, display_name").eq("role", "parent").order("display_name"),
      (admin.from("parent_children") as any)
        .select("parent_id, student_id, students(id, profiles!profile_id(display_name))"),
      (admin.from("teacher_sessions") as any)
        .select("id, teacher_id, title, session_type, weekday, start_time, scheduled_at, duration_min, active_from, active_until, student_id")
        .order("weekday").order("start_time"),
      (admin.from("session_reports") as any)
        .select("id, session_id, teacher_id, occurrence_date"),
      (admin.from("parent_session_payments") as any)
        .select("id, parent_id, student_id, session_id, occurrence_date, status, amount_fcfa, paid_at, comment"),
      (admin.from("student_session_rates") as any)
        .select("student_id, rate_fcfa, effective_from")
        .order("effective_from", { ascending: false }),
    ]);

  const reportsByKey = new Set<string>();
  for (const r of allReports ?? []) reportsByKey.add(`${r.session_id}|${r.occurrence_date}`);

  const paymentsByKey = new Map<string, any>();
  for (const p of allPayments ?? []) {
    paymentsByKey.set(`${p.parent_id}|${p.student_id}|${p.session_id}|${p.occurrence_date}`, p);
  }

  const now2 = new Date();
  const monthEnd2 = new Date(year, month, 0);
  const _ref2 = monthEnd2 < now2 ? monthEnd2 : now2;
  const rateRefDate2 = `${_ref2.getFullYear()}-${String(_ref2.getMonth()+1).padStart(2,"0")}-${String(_ref2.getDate()).padStart(2,"0")}`;
  const rateByStudent = new Map<string, number>();
  for (const r of (allRates ?? []).sort((a: any, b: any) => b.effective_from.localeCompare(a.effective_from))) {
    if (!rateByStudent.has(r.student_id) && r.effective_from <= rateRefDate2) {
      rateByStudent.set(r.student_id, r.rate_fcfa);
    }
  }

  const from = new Date(year, month - 1, 1);
  const to   = new Date(year, month, 0, 23, 59, 59);

  function buildMonthOccs(sessions: any[]) {
    const out: any[] = [];
    for (const s of sessions) {
      if (s.session_type === "recurring") {
        const [h, m] = (s.start_time as string).split(":").map(Number);
        const cursor = new Date(from);
        cursor.setHours(h, m, 0, 0);
        const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
        cursor.setDate(cursor.getDate() + (daysUntil === 0 && cursor >= from ? 0 : daysUntil === 0 ? 7 : daysUntil));
        while (cursor <= to) {
          const af2 = s.active_from ? new Date(s.active_from) : null;
          if (cursor >= from && (!af2 || cursor >= af2) && (!s.active_until || cursor <= new Date(s.active_until)) && cursor < new Date()) {
            out.push({ sessionId: s.id, title: s.title, at: new Date(cursor), duration_min: s.duration_min, studentId: s.student_id });
          }
          cursor.setDate(cursor.getDate() + 7);
        }
      } else if (s.session_type === "once" && s.scheduled_at) {
        const at = new Date(s.scheduled_at);
        if (at >= from && at <= to && at < new Date()) {
          out.push({ sessionId: s.id, title: s.title, at, duration_min: s.duration_min, studentId: s.student_id });
        }
      }
    }
    return out;
  }

  const allOccs = buildMonthOccs(allSessions ?? []);

  // Grouper les liens par parent
  const linksByParent = new Map<string, any[]>();
  for (const l of links ?? []) {
    const arr = linksByParent.get(l.parent_id) ?? [];
    arr.push(l);
    linksByParent.set(l.parent_id, arr);
  }

  const result = (parents ?? []).map((p: any) => {
    const myLinks = linksByParent.get(p.id) ?? [];

    const children = myLinks.map((link: any) => {
      const studentId = link.student_id;
      const studentName = link.students?.profiles?.display_name ?? "Élève";
      const rate = rateByStudent.get(studentId) ?? 0;

      // Séances de cet élève ce mois (avec rapport = service rendu)
      const studentOccs = allOccs.filter(o => {
        if (o.studentId !== null && o.studentId !== studentId) return false;
        return reportsByKey.has(`${o.sessionId}|${o.at.toISOString().slice(0, 10)}`);
      });

      const lines = studentOccs.map(occ => {
        const occDate = occ.at.toISOString().slice(0, 10);
        const payKey  = `${p.id}|${studentId}|${occ.sessionId}|${occDate}`;
        const payment = paymentsByKey.get(payKey) ?? null;
        const amount  = payment?.amount_fcfa ?? rate;
        const status: "pending" | "paid" | "unpaid" = payment?.status ?? "pending";

        return { sessionId: occ.sessionId, occurrenceDate: occDate, title: occ.title, at: occ.at, duration_min: occ.duration_min, status, amount, payment };
      });

      const totalDue  = lines.reduce((s, l) => s + l.amount, 0);
      const totalPaid = lines.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0);

      return { studentId, studentName, rate, lines, totalDue, totalPaid };
    }).filter(c => c.lines.length > 0);

    const grandDue  = children.reduce((s, c) => s + c.totalDue, 0);
    const grandPaid = children.reduce((s, c) => s + c.totalPaid, 0);

    return { parent: p, children, grandDue, grandPaid };
  }).filter((p: any) => p.children.length > 0);

  return result;
}

// ── Tous les élèves avec leur tarif actuel ──────────────────────

export async function getAllStudentsWithRates() {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: links }, { data: allRates }] = await Promise.all([
    (admin.from("parent_children") as any)
      .select("parent_id, student_id, students(id, profiles!profile_id(display_name)), profiles!parent_id(display_name)")
      .order("student_id"),
    (admin.from("student_session_rates") as any)
      .select("student_id, rate_fcfa, effective_from")
      .order("effective_from", { ascending: false }),
  ]);

  const rateByStudent = new Map<string, number>();
  for (const r of (allRates ?? []).sort((a: any, b: any) => b.effective_from.localeCompare(a.effective_from))) {
    if (!rateByStudent.has(r.student_id) && r.effective_from <= today) {
      rateByStudent.set(r.student_id, r.rate_fcfa);
    }
  }

  const seen = new Set<string>();
  const students: { studentId: string; studentName: string; parentName: string; rate: number }[] = [];
  for (const l of links ?? []) {
    if (seen.has(l.student_id)) continue;
    seen.add(l.student_id);
    students.push({
      studentId:   l.student_id,
      studentName: (l.students as any)?.profiles?.display_name ?? "Élève",
      parentName:  (l.profiles as any)?.display_name ?? "Parent",
      rate:        rateByStudent.get(l.student_id) ?? 0,
    });
  }

  return students.sort((a, b) => a.studentName.localeCompare(b.studentName));
}
