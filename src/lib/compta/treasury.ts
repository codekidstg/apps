"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface TreasuryData {
  // Auto (depuis compta)
  mentorsPaid: number;
  parentsPaid: number;
  // Manuels
  expenses: { id: string; label: string; amount_fcfa: number; expense_date: string }[];
  incomes:  { id: string; label: string; amount_fcfa: number; income_date: string }[];
  // Totaux
  totalOut: number;
  totalIn:  number;
  balance:  number;
}

export async function getTreasuryData(from: string, to: string): Promise<TreasuryData> {
  const admin = createAdminClient();

  const [
    { data: mentorPayments },
    { data: parentPayments },
    { data: expenses },
    { data: incomes },
  ] = await Promise.all([
    (admin.from("mentor_payments") as any)
      .select("amount_fcfa")
      .eq("status", "paid")
      .gte("occurrence_date", from)
      .lte("occurrence_date", to),
    (admin.from("parent_session_payments") as any)
      .select("amount_fcfa")
      .eq("status", "paid")
      .gte("occurrence_date", from)
      .lte("occurrence_date", to),
    (admin.from("treasury_expenses") as any)
      .select("id, label, amount_fcfa, expense_date")
      .gte("expense_date", from)
      .lte("expense_date", to)
      .order("expense_date", { ascending: false }),
    (admin.from("treasury_income") as any)
      .select("id, label, amount_fcfa, income_date")
      .gte("income_date", from)
      .lte("income_date", to)
      .order("income_date", { ascending: false }),
  ]);

  const mentorsPaid = (mentorPayments ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);
  const parentsPaid = (parentPayments ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);
  const extraOut    = (expenses ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);
  const extraIn     = (incomes  ?? []).reduce((s: number, r: any) => s + (r.amount_fcfa ?? 0), 0);

  const totalOut = mentorsPaid + extraOut;
  const totalIn  = parentsPaid + extraIn;

  return {
    mentorsPaid,
    parentsPaid,
    expenses: expenses ?? [],
    incomes:  incomes  ?? [],
    totalOut,
    totalIn,
    balance: totalIn - totalOut,
  };
}

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

export async function deleteTreasuryExpense(id: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("treasury_expenses") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}

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

export async function deleteTreasuryIncome(id: string) {
  const admin = createAdminClient();
  const { error } = await (admin.from("treasury_income") as any).delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin/compta/tresorerie");
  revalidatePath("/manager/compta/tresorerie");
  return { success: true };
}
