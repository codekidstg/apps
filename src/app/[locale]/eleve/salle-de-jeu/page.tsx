export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { requireStudentPermission } from "@/lib/permissions/student";
import { salleDeJeuPour } from "@/lib/eleve/salle-de-jeu";
import SalleDeJeu from "@/components/eleve/SalleDeJeu";

/**
 * Ma salle de jeu — la seconde porte de la même réserve d'exercices.
 *
 * Jusqu'ici, ces exercices vivaient au bas de la séance à laquelle ils
 * appartiennent. Pour les atteindre, il fallait déjà avoir décidé de
 * s'entraîner, retrouver la bonne séance, puis dérouler. Un enfant ne navigue
 * jamais en arrière — il va là où c'est ouvert.
 */
export default async function SalleDeJeuPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  await requireStudentPermission(user.id, "student.salle_de_jeu");

  const { data: student } = await supabase
    .from("students").select("id").eq("profile_id", user.id).single<{ id: string }>();
  if (!student) redirect("/fr/connexion");

  return <SalleDeJeu seances={await salleDeJeuPour(student.id)} />;
}
