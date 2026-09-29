export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { requireStudentPermission } from "@/lib/permissions/student";
import { visiteurEleve } from "@/lib/eleve/acces";
import { salleDeJeuPour } from "@/lib/eleve/salle-de-jeu";
import SalleDeJeu from "@/components/eleve/SalleDeJeu";

/**
 * Ma salle de jeu — la seconde porte de la même réserve d'exercices.
 *
 * Jusqu'ici, ces exercices vivaient au bas de la séance à laquelle ils
 * appartiennent. Pour les atteindre, il fallait déjà avoir décidé de
 * s'entraîner, retrouver la bonne séance, puis dérouler. Un enfant ne navigue
 * jamais en arrière — il va là où c'est ouvert.
 *
 * Un admin n'a pas de fiche élève : la page le renvoyait à la connexion. Il
 * peut désormais regarder la salle d'un enfant avec `?eleve=<id>` — le même
 * composant, les mêmes données, verrous compris. C'est ça, « voir comme ».
 */
export default async function SalleDeJeuPage({
  params, searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ eleve?: string }>;
}) {
  const { locale } = await params;
  const { eleve } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const visiteur = await visiteurEleve(supabase, user.id);
  if (!visiteur) redirect(`/${locale}/connexion`);

  if (visiteur.mode === "eleve") {
    await requireStudentPermission(user.id, "student.salle_de_jeu", locale);
    return <SalleDeJeu seances={await salleDeJeuPour(visiteur.studentId)} />;
  }

  // Mode aperçu : il faut dire de qui l'on regarde la salle.
  if (!eleve) {
    return (
      <div className="p-6 lg:p-10 max-w-3xl">
        <h1 className="text-2xl font-black text-white">🏟️ Salle de jeu — aperçu</h1>
        <p className="mt-3 text-sm" style={{ color: "#94a3b8" }}>
          Cette salle appartient à un enfant : elle n&apos;a de sens que vue à travers lui, avec ses
          séances ouvertes et ses verrous. Choisis un enfant depuis la page d&apos;une séance,
          bouton <strong>Voir comme</strong>.
        </p>
      </div>
    );
  }

  const admin = createAdminClient() as any;
  const { data: fiche } = await admin.from("students").select("id, profile_id, level").eq("id", eleve).maybeSingle();
  if (!fiche) redirect(`/${locale}/admin/themes`);
  const { data: profil } = await admin.from("profiles").select("display_name").eq("id", fiche.profile_id).maybeSingle();

  const seances = await salleDeJeuPour(fiche.id);
  return (
    <div>
      <div className="px-6 lg:px-10 pt-6">
        <div className="rounded-xl px-4 py-3 text-sm font-bold"
          style={{ background: "#1e1b4b", border: "1px solid #4c1d95", color: "#c4b5fd" }}>
          👁 Aperçu — tu regardes la salle de <strong>{profil?.display_name ?? "cet élève"}</strong>.
          Rien n&apos;est enregistré, et tu vois exactement ce qu&apos;il voit : ni plus, ni moins.
        </div>
      </div>
      <SalleDeJeu seances={seances} />
    </div>
  );
}
