export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

  await requireStudentPermission(user.id, "student.atelier", locale);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: eleve } = await admin
    .from("students").select("level, level_num").eq("id", visiteur.studentId).maybeSingle();
  if (!atelierOuvertA(eleve?.level, eleve?.level_num)) redirect(`/${locale}/eleve`);

  const programme = await chargerProgramme(visiteur.studentId, id);
  if (!programme) redirect(`/${locale}/eleve/atelier`);

  return (
    <div className="p-6 lg:p-10 max-w-4xl">
      <AtelierLibre
        id={programme.id}
        titreInitial={programme.titre}
        codeInitial={programme.code}
        jetonInitial={programme.jeton}
        modifieLe={programme.modifieLe}
        locale={locale}
      />
    </div>
  );
}
