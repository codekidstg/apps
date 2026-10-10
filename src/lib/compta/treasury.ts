"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AutoPaymentLine {
  id: string;
  name: string;     // "Jean Pierre Gaba" ou "Espoir AMEGANVI (Uriel)"
  label: string;    // titre de la séance
  /** Le jour où l'argent a bougé — c'est lui qui classe la ligne. */
  date: string;
  /** Le jour de la séance réglée. Souvent un autre mois. */
  seanceDu: string;
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
      // Une séance déclarée non tenue n'a pas eu lieu : ni payée, ni facturée.
      .select("session_id, occurrence_date")
      .eq("tenue", true)
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
    /**
     * La trésorerie se date au jour où l'argent bouge, pas au jour de la séance.
     *
     * Elle filtrait sur `occurrence_date`, si bien que les 23 paiements de la
     * plateforme — tous réglés en octobre — s'affichaient en septembre, et que
     * septembre annonçait un déficit alors que rien n'était entré ni sorti de
     * la caisse ce mois-là.
     *
     * Pire : le passé ne tenait pas. Pointer une vieille séance comme payée
     * réécrivait un mois déjà clos — ce qui arrive à chaque fois qu'un parent
     * règle avec du retard.
     *
     * `paid_at` porte la date réelle du règlement. On s'arrête à la fin de la
     * journée `to`, sinon un paiement du dernier jour du mois, horodaté à midi,
     * tomberait hors de la période.
     */
    (admin.from("mentor_payments") as any)
      .select("id, teacher_id, session_id, occurrence_date, paid_at, amount_fcfa, profiles!teacher_id(display_name), teacher_sessions!session_id(title)")
      .eq("status", "paid")
      .gte("paid_at", from)
      .lte("paid_at", `${to}T23:59:59.999Z`)
      .order("paid_at", { ascending: false }),
    (admin.from("parent_session_payments") as any)
      .select("id, parent_id, student_id, session_id, occurrence_date, paid_at, amount_fcfa, profiles!parent_id(display_name), students!student_id(profiles!profile_id(display_name)), teacher_sessions!session_id(title)")
      .eq("status", "paid")
      .gte("paid_at", from)
      .lte("paid_at", `${to}T23:59:59.999Z`)
      .order("paid_at", { ascending: false }),
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
    // La date affichée est celle du règlement ; celle de la séance la suit, car
    // « payé le 5 octobre » sans savoir pour quelle séance ne dit rien.
    date:        (p.paid_at ?? p.occurrence_date).slice(0, 10),
    seanceDu:    p.occurrence_date,
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
      date:        (p.paid_at ?? p.occurrence_date).slice(0, 10),
      seanceDu:    p.occurrence_date,
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

// ── Ce qu'on me doit, ce que je dois ─────────────────────────────────────────

export interface EnAttente {
  /** Facturé aux parents, pas encore encaissé. */
  parentsSeances: number;
  parentsMontant: number;
  /** Dû aux mentors, pas encore réglé. */
  mentorsSeances: number;
  mentorsMontant: number;
  /**
   * Séances assurées qui ne portent aucune ligne de paiement parent.
   *
   * Ce n'est pas une créance : c'est un oubli. Tant qu'aucune ligne n'existe,
   * personne ne doit rien, et la séance disparaît des comptes — c'est ainsi que
   * sept séances de septembre sont passées à travers.
   */
  nonFacturees: number;
  /** Idem côté mentor : une séance assurée sans ligne de paiement à régler. */
  nonProvisionnees: number;
}

/**
 * Le pont entre le mois travaillé et le mois encaissé.
 *
 * C'est ce couple de chiffres qui règle le décalage de facturation : une séance
 * du 20 septembre payée le 5 octobre est une créance tant qu'elle n'est pas
 * réglée, puis un encaissement d'octobre. Rien ne se perd, rien n'est compté
 * deux fois, et aucun mois déjà clos ne se réécrit.
 *
 * Volontairement sans période : ce qu'on vous doit, on vous le doit, que la
 * séance date de ce mois-ci ou de trois mois en arrière.
 */
export async function getEnAttente(): Promise<EnAttente> {
  const admin = createAdminClient();

  const [{ data: mentors }, { data: parents }, { data: reports }, { data: toutParent }, { data: toutMentor }] =
    await Promise.all([
      (admin.from("mentor_payments") as any).select("amount_fcfa").neq("status", "paid"),
      (admin.from("parent_session_payments") as any).select("amount_fcfa").neq("status", "paid"),
      (admin.from("session_reports") as any).select("session_id, occurrence_date").eq("tenue", true),
      (admin.from("parent_session_payments") as any).select("session_id, occurrence_date"),
      (admin.from("mentor_payments") as any).select("session_id, occurrence_date"),
    ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const somme = (rows: any[] | null) => (rows ?? []).reduce((s, r) => s + (r.amount_fcfa ?? 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cles = (rows: any[] | null) => new Set((rows ?? []).map((r) => `${r.session_id}|${r.occurrence_date}`));

  const assurees = cles(reports);
  const avecParent = cles(toutParent);
  const avecMentor = cles(toutMentor);

  return {
    mentorsSeances: (mentors ?? []).length,
    mentorsMontant: somme(mentors),
    parentsSeances: (parents ?? []).length,
    parentsMontant: somme(parents),
    nonFacturees:     [...assurees].filter((k) => !avecParent.has(k)).length,
    nonProvisionnees: [...assurees].filter((k) => !avecMentor.has(k)).length,
  };
}

// ── L'activité du mois : ce que le travail a produit ─────────────────────────

export interface Activite {
  /** Séances réellement tenues sur la période. */
  seances: number;
  /** Ce qu'elles valent côté parents, réglé ou non. */
  produits: number;
  /** Ce qu'elles coûtent côté mentors, réglé ou non. */
  charges: number;
  marge: number;
}

/**
 * Combien le mois de travail a rapporté, indépendamment des règlements.
 *
 * La trésorerie dit si l'argent est là ; celle-ci dit si l'activité est
 * rentable. Les confondre faisait annoncer un déficit un mois où quinze
 * séances avaient été assurées avec cinq mille francs de marge chacune.
 *
 * On part des séances déclarées tenues — une séance non tenue n'est ni
 * facturée, ni payée — et on prend les montants des lignes de paiement, qui
 * portent le tarif réellement appliqué plutôt qu'un prix supposé.
 */
export async function getActivite(from: string, to: string): Promise<Activite> {
  const admin = createAdminClient();

  const [{ data: reports }, { data: mentors }, { data: parents }] = await Promise.all([
    (admin.from("session_reports") as any)
      .select("session_id, occurrence_date").eq("tenue", true)
      .gte("occurrence_date", from).lte("occurrence_date", to),
    (admin.from("mentor_payments") as any)
      .select("session_id, occurrence_date, amount_fcfa")
      .gte("occurrence_date", from).lte("occurrence_date", to),
    (admin.from("parent_session_payments") as any)
      .select("session_id, occurrence_date, amount_fcfa")
      .gte("occurrence_date", from).lte("occurrence_date", to),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cles = new Set((reports ?? []).map((r: any) => `${r.session_id}|${r.occurrence_date}`));
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const somme = (rows: any[] | null) =>
    (rows ?? [])
      .filter((r) => cles.has(`${r.session_id}|${r.occurrence_date}`))
      .reduce((s, r) => s + (r.amount_fcfa ?? 0), 0);

  const produits = somme(parents);
  const charges  = somme(mentors);
  return { seances: cles.size, produits, charges, marge: produits - charges };
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
