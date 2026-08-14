// Pure computation functions for compta — no Supabase, fully testable

export type RateType = "per_session" | "per_hour";

export interface TeacherRate {
  teacher_id: string;
  rate_fcfa: number;
  rate_type: RateType;
  effective_from: string; // "YYYY-MM-DD"
}

export interface StudentRate {
  student_id: string;
  rate_fcfa: number;
  effective_from: string; // "YYYY-MM-DD"
}

export interface RawSession {
  id: string;
  teacher_id: string;
  title: string;
  session_type: "recurring" | "once";
  weekday?: number | null; // 0=Sun … 6=Sat, for recurring
  start_time?: string | null; // "HH:MM:SS"
  scheduled_at?: string | null; // ISO, for once
  duration_min: number;
  active_from?: string | null;
  active_until?: string | null;
  student_id?: string | null;
}

export interface Occurrence {
  sessionId: string;
  teacherId: string;
  title: string;
  at: Date;
  duration_min: number;
  studentId: string | null;
}

// ── Effective rate selection ─────────────────────────────────────

/**
 * Returns the most recent rate with effective_from <= referenceDate (YYYY-MM-DD),
 * or null if none.
 */
export function getEffectiveTeacherRate(
  rates: TeacherRate[],
  teacherId: string,
  referenceDate: string,
): { rate_fcfa: number; rate_type: RateType } | null {
  const eligible = rates
    .filter(r => r.teacher_id === teacherId && r.effective_from <= referenceDate)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return eligible.length > 0
    ? { rate_fcfa: eligible[0].rate_fcfa, rate_type: eligible[0].rate_type }
    : null;
}

export function getEffectiveStudentRate(
  rates: StudentRate[],
  studentId: string,
  referenceDate: string,
): number {
  const eligible = rates
    .filter(r => r.student_id === studentId && r.effective_from <= referenceDate)
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return eligible.length > 0 ? eligible[0].rate_fcfa : 0;
}

// ── Amount calculation ───────────────────────────────────────────

export function computeMentorAmount(
  rate: { rate_fcfa: number; rate_type: RateType } | null,
  duration_min: number,
): number {
  if (!rate) return 0;
  if (rate.rate_type === "per_hour") {
    return Math.round((rate.rate_fcfa * duration_min) / 60);
  }
  return rate.rate_fcfa;
}

// ── Status inference ─────────────────────────────────────────────

export type MentorStatus = "pending_report" | "to_pay" | "paid";
export type ParentStatus = "pending" | "paid" | "unpaid";

export function inferMentorStatus(
  hasReport: boolean,
  paymentStatus?: MentorStatus,
): MentorStatus {
  if (paymentStatus !== undefined) return paymentStatus;
  return hasReport ? "to_pay" : "pending_report";
}

export function inferParentStatus(
  paymentStatus?: ParentStatus,
): ParentStatus {
  return paymentStatus ?? "pending";
}

// ── Month occurrence builder ─────────────────────────────────────

/**
 * Builds all past occurrences of the given sessions that fall within [from, to].
 * "past" means: at < now.
 */
export function buildMonthOccurrences(
  sessions: RawSession[],
  from: Date,
  to: Date,
  now: Date = new Date(),
): Occurrence[] {
  const out: Occurrence[] = [];

  for (const s of sessions) {
    if (s.session_type === "recurring") {
      if (s.weekday == null || s.start_time == null) continue;
      const [h, m] = s.start_time.split(":").map(Number);
      const cursor = new Date(from);
      cursor.setHours(h, m, 0, 0);
      const daysUntil = (s.weekday - cursor.getDay() + 7) % 7;
      cursor.setDate(
        cursor.getDate() +
          (daysUntil === 0 && cursor >= from ? 0 : daysUntil === 0 ? 7 : daysUntil),
      );
      const activeFrom  = s.active_from  ? new Date(s.active_from)  : null;
      const activeUntil = s.active_until ? new Date(s.active_until) : null;

      while (cursor <= to) {
        if (
          cursor >= from &&
          (!activeFrom  || cursor >= activeFrom) &&
          (!activeUntil || cursor <= activeUntil) &&
          cursor < now
        ) {
          out.push({
            sessionId: s.id,
            teacherId: s.teacher_id,
            title: s.title,
            at: new Date(cursor),
            duration_min: s.duration_min,
            studentId: s.student_id ?? null,
          });
        }
        cursor.setDate(cursor.getDate() + 7);
      }
    } else if (s.session_type === "once" && s.scheduled_at) {
      const at = new Date(s.scheduled_at);
      if (at >= from && at <= to && at < now) {
        out.push({
          sessionId: s.id,
          teacherId: s.teacher_id,
          title: s.title,
          at,
          duration_min: s.duration_min,
          studentId: s.student_id ?? null,
        });
      }
    }
  }

  return out.sort((a, b) => a.at.getTime() - b.at.getTime());
}

// ── Totals ───────────────────────────────────────────────────────

export function computeMentorTotals(
  lines: { status: MentorStatus; amount: number }[],
): { totalDue: number; totalPaid: number } {
  const totalDue  = lines.filter(l => l.status !== "pending_report").reduce((s, l) => s + l.amount, 0);
  const totalPaid = lines.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0);
  return { totalDue, totalPaid };
}

export function computeParentTotals(
  lines: { status: ParentStatus; amount: number }[],
): { totalDue: number; totalPaid: number } {
  const totalDue  = lines.reduce((s, l) => s + l.amount, 0);
  const totalPaid = lines.filter(l => l.status === "paid").reduce((s, l) => s + l.amount, 0);
  return { totalDue, totalPaid };
}

// ── Validation ───────────────────────────────────────────────────

export function validateParentPayment(
  status: ParentStatus,
  comment: string | undefined,
): { ok: true } | { ok: false; error: string } {
  if (status === "unpaid" && !comment?.trim()) {
    return { ok: false, error: "Un commentaire est obligatoire pour un paiement impayé." };
  }
  return { ok: true };
}
