import PageHeader from "@/components/backoffice/PageHeader";
import { createAdminClient } from "@/lib/supabase/server";
import { getJustificatif } from "@/lib/compta/justificatif";
import JustificatifsClient from "./JustificatifsClient";

/**
 * Écran « Justificatifs de paiement », servi à l'admin et au manager.
 *
 * Le récapitulatif provient de la même source que la trésorerie : le document
 * ne recalcule jamais son propre montant, sinon il pourrait certifier une
 * somme que la comptabilité ne connaît pas.
 */
export default async function JustificatifsPage({
  searchParams, base,
}: {
  searchParams: Promise<{ mentor?: string; month?: string; year?: string }>;
  base: string;
}) {
  const sp  = await searchParams;
  const now = new Date();
  const mois  = Number(sp.month) || now.getMonth() + 1;
  const annee = Number(sp.year)  || now.getFullYear();
  const mentorId = sp.mentor ?? "";

  const admin = createAdminClient();
  const { data: profs, error } = await (admin.from("profiles") as any)
    .select("id, display_name").eq("role", "teacher").order("display_name");
  if (error) console.error("Justificatifs — mentors :", error.message);

  const mentors = (profs ?? []).map((p: any) => ({ id: p.id, nom: p.display_name ?? "Mentor" }));
  const j = mentorId ? await getJustificatif(mentorId, mois, annee) : null;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Justificatifs de paiement"
        subtitle="Attester le règlement des séances d'un mentor, pour un mois donné"
      />
      <JustificatifsClient
        mentors={mentors}
        recap={j ? {
          reference: j.reference, mentor: j.mentor, moisLabel: j.moisLabel, tarif: j.tarif,
          lignes: j.lignes, sansRapport: j.sansRapport, total: j.total,
          totalDejaPaye: j.totalDejaPaye, totalEnLettres: j.totalEnLettres,
        } : null}
        mentorId={mentorId}
        mois={mois}
        annee={annee}
        base={base}
      />
      <p className="text-xs text-gray-400 px-1">
        Pièce émise par NAVOR GROUP SARL, au titre du programme CodeKids. Seules les séances
        ayant donné lieu à un compte rendu du mentor y figurent.
      </p>
    </div>
  );
}
