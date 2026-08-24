"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AutoPaymentLine {
  id: string;
  name: string;     // "Jean Pierre Gaba" ou "Espoir AMEGANVI (Uriel)"
  label: string;    // titre de la séance
  date: string;     // occurrence_date ISO
  amount_fcfa: number;
}

export interface ManualLine {
  id: string;
  label: string;
  amount_fcfa: number;
  date: string; // expense_date ou income_date ISO
  createdByName: string | null;
}

export interface TreasuryData {
  mentorLines:  AutoPaymentLine[];
  parentLines:  AutoPaymentLine[];
  expenses:     ManualLine[];
  incomes:      ManualLine[];
  mentorsPaid:  number;
  parentsPaid:  number;
  totalOut:     number;
  totalIn:      number;
  balance:      number;
}

// ── Dashboard KPIs ────────────────────────────────────────────────────────────
// Calcul réel depuis sessions + rapports, sans dépendre des tables payment

export async function getDashboardComptaKPIs(month: number, year: number) {
  const admin = createAdminClient();
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const monthEnd   = new Date(year, month, 0).toISOString().slice(0, 10);

  const [{ data: reports }, { data: mentorPaid }, { data: parentPaid }] = await Promise.all([
    (admin.from("session_reports") as any)
      .select("session_id, occurrence_date")
      .gte("occurrence_date", monthStart)
      .lte("occurrence_date", monthEnd),
    (admin.from("mentor_payments") as any)
      .select("session_id, occurrence_date")
      .eq("status", "paid")
      .gte("occurrence_date", monthStart)
      .lte("occurrence_date", monthEnd),
    (admin.from("parent_session_payments") as any)
      .select("session_id, occurrence_date")
      .eq("status", "paid")
      .gte("occurrence_date", monthStart)
      .lte("occurrence_date", monthEnd),
  ]);

  const paidMentorKeys  = new Set((mentorPaid  ?? []).map((p: any) => `${p.session_id}|${p.occurrence_date}`));
  const paidParentKeys  = new Set((parentPaid  ?? []).map((p: any) => `${p.session_id}|${p.occurrence_date}`));
  const reportKeys      = (reports ?? []).map((r: any) => `${r.session_id}|${r.occurrence_date}`);

  return {
    mentorToPay:   reportKeys.filter((k: string) => !paidMentorKeys.has(k)).length,
    parentPending: reportKeys.filter((k: string) => !paidParentKeys.has(k)).length,
  };
}

// ── Données trésorerie ────────────────────────────────────────────────────────

export async function getTreasuryData(from: string, to: string): Promise<TreasuryData> {
  const admin = createAdminClient();

  const [
    { data: mentorPaymentsRaw },
    { data: parentPaymentsRaw },
    { data: expenses },
    { data: incomes },
  ] = await Promise.all([
    // Paiements mentors payés sur la période, avec nom du mentor et titre séance
    (admin.from("mentor_payments") as any)
      .select("id, teacher_id, session_id, occurrence_date, amount_fcfa, profiles!teacher_id(display_name), teacher_sessions!session_id(title)")
      .eq("status", "paid")
      .gte("occurrence_date", from)
      .lte("occurrence_date", to)
      .order("occurrence_date", { ascending: false }),
    // Paiements parents payés sur la période, avec nom parent + élève + titre séance
    (admin.from("parent_session_payments") as any)
      .select("id, parent_id, student_id, session_id, occurrence_date, amount_fcfa, profiles!parent_id(display_name), students!student_id(profiles!profile_id(display_name)), teacher_sessions!session_id(title)")
      .eq("status", "paid")
      .gte("occurrence_date", from)
      .lte("occurrence_date", to)
      .order("occurrence_date", { ascending: false }),
    (admin.from("treasury_expenses") as any)
      .select("id, label, amount_fcfa, expense_date, profiles!created_by(display_name)")
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false }),
    (admin.from("treasury_income") as any)
      .select("id, label, amount_fcfa, income_date, profiles!created_by(display_name)")
      .gte("income_date", from)
      .lte("income_date", to)
      .order("income_date", { ascending: false }),
  ]);

  // Construire les lignes auto mentors
  const mentorLines: AutoPaymentLine[] = (mentorPaymentsRaw ?? []).map((p: any) => ({
    id:          p.id,
    name:        p.profiles?.display_name ?? "Mentor",
    label:       p.teacher_sessions?.title ?? "Séance",
    date:        p.occurrence_date,
    amount_fcfa: p.amount_fcfa ?? 0,
  }));

  // Construire les lignes auto parents
  const parentLines: AutoPaymentLine[] = (parentPaymentsRaw ?? []).map((p: any) => {
    const parentName  = p.profiles?.display_name ?? "Parent";
    const studentName = p.students?.profiles?.display_name ?? null;
    return {
      id:          p.id,
      name:        studentName ? `${parentName} (${studentName})` : parentName,
      label:       p.teacher_sessions?.title ?? "Séance",
      date:        p.occurrence_date,
      amount_fcfa: p.amount_fcfa ?? 0,
    };
  });

  const mentorsPaid = mentorLines.reduce((s, l) => s + l.amount_fcfa, 0);
  const parentsPaid = parentLines.reduce((s, l) => s + l.amount_fcfa, 0);
  const extraOut    = (expenses ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);
  const extraIn     = (incomes  ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);

  return {
    mentorLines,
    parentLines,
    expenses: (expenses ?? []).map((e: any) => ({ id: e.id, label: e.label, amount_fcfa: e.amount_fcfa, date: e.expense_date, createdByName: e.profiles?.display_name ?? null })),
    incomes:  (incomes  ?? []).map((e: any) => ({ id: e.id, label: e.label, amount_fcfa: e.amount_fcfa, date: e.income_date,  createdByName: e.profiles?.display_name ?? null })),
    mentorsPaid,
    parentsPaid,
    totalOut: mentorsPaid + extraOut,
    totalIn:  parentsPaid + extraIn,
    balance:  (parentsPaid + extraIn) - (mentorsPaid + extraOut),
  };
}

// ── Suppression des lignes auto (admin uniquement) ────────────────────────────

/**
 * Les lignes « AUTO » sont des paiements réels, pas des écritures de saisie :
 * les effacer change les totaux de la période et n'est pas réversible. Seul un
 * admin peut le faire — un manager voit la trésorerie mais n'y touche pas.
 */
async function requireAdminUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  return profile?.role === "admin" ? user : null;
}

export async function deleteMentorPayment(id: string) {
  if (!await requireAdminUser()) return { error: "Réservé à l'administrateur" };
  const admin = createAdminClient();
  const { error } = await (admin.from("mentor_payments") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

export async function deleteParentSessionPayment(id: string) {
  if (!await requireAdminUser()) return { error: "Réservé à l'administrateur" };
  const admin = createAdminClient();
  const { error } = await (admin.from("parent_session_payments") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

// ── CRUD dépenses manuelles ───────────────────────────────────────────────────

export async function addTreasuryExpense(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const date  = formData.get("date") as string;
  const [year, month] = date.split("-").map(Number);

  const { error } = await (admin.from("treasury_expenses") as any).insert({
    label:        formData.get("label") as string,
    amount_fcfa:  Math.abs(parseInt(formData.get("amount") as string, 10)),
    expense_date: date,
    month, year,
    created_by:   user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

export async function updateTreasuryExpense(id: string, formData: FormData) {
  const admin = createAdminClient();
  const date  = formData.get("date") as string;
  const [year, month] = date.split("-").map(Number);

  const { error } = await (admin.from("treasury_expenses") as any)
    .update({
      label:        formData.get("label") as string,
      amount_fcfa:  Math.abs(parseInt(formData.get("amount") as string, 10)),
      expense_date: date,
      month, year,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

export async function deleteTreasuryExpense(id: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("treasury_expenses") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

// ── CRUD recettes manuelles ───────────────────────────────────────────────────

export async function addTreasuryIncome(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Non authentifié" };

  const admin = createAdminClient();
  const date  = formData.get("date") as string;
  const [year, month] = date.split("-").map(Number);

  const { error } = await (admin.from("treasury_income") as any).insert({
    label:        formData.get("label") as string,
    amount_fcfa:  Math.abs(parseInt(formData.get("amount") as string, 10)),
    income_date:  date,
    month, year,
    created_by:   user.id,
  });
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

export async function updateTreasuryIncome(id: string, formData: FormData) {
  const admin = createAdminClient();
  const date  = formData.get("date") as string;
  const [year, month] = date.split("-").map(Number);

  const { error } = await (admin.from("treasury_income") as any)
    .update({
      label:        formData.get("label") as string,
      amount_fcfa:  Math.abs(parseInt(formData.get("amount") as string, 10)),
      income_date:  date,
      month, year,
    })
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

export async function deleteTreasuryIncome(id: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("treasury_income") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}
