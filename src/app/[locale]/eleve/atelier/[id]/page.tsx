export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { visiteurEleve } from "@/lib/eleve/acces";
import { requireStudentPermission } from "@/lib/permissions/student";
import { atelierOuvertA, chargerProgramme } from "@/lib/eleve/atelier";
import AtelierLibre from "@/components/eleve/AtelierLibre";

/**
 * Un programme de l'établi, ouvert.
 *
 * Le programme se charge avec le `student_id` dans la requête : une adresse
 * devinée ne rend rien, et renvoie l'enfant à son étagère.
 */
export default async function ProgrammePage({ params }: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const visiteur = await visiteurEleve(supabase, user.id);
  if (!visiteur || visiteur.mode === "apercu") redirect(`/${locale}/eleve/atelier`);

  // Le niveau est déjà connu : `visiteurEleve` vient de lire la fiche.
  if (!atelierOuvertA(visiteur.niveau, visiteur.niveauNum)) redirect(`/${locale}/eleve`);

  const [, programme] = await Promise.all([
    requireStudentPermission(user.id, "student.atelier", locale),
    chargerProgramme(visiteur.studentId, id),
  ]);
  if (!programme) redirect(`/${locale}/eleve/atelier`);

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <AtelierLibre
        id={programme.id}
        titreInitial={programme.titre}
        codeInitial={programme.code}
        sortieInitiale={programme.sortie}
        jetonInitial={programme.jeton}
        modifieLe={programme.modifieLe}
        locale={locale}
      />
    </div>
  );
}
