export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { visiteurEleve } from "@/lib/eleve/acces";
import { requireStudentPermission } from "@/lib/permissions/student";
import { atelierOuvertA, listerProgrammes, AMORCES } from "@/lib/eleve/atelier";
import MesProgrammes, { type Carte } from "@/components/eleve/MesProgrammes";

/**
 * Mon atelier — l'endroit où l'enfant écrit ses propres programmes.
 *
 * Demandé par le mentor de Samuel le 3 octobre : « est-ce que pour le niveau
 * bâtisseur on peut leur faire une partie éditeur de code… écrire et run du
 * code ? Sauvegarder un peu sous forme de fichiers de projet ».
 *
 * Rien n'y est corrigé : pas d'XP, pas de ceinture, pas de place dans le
 * parcours. Les exercices entraînent des gestes, l'atelier est l'endroit où
 * l'enfant décide.
 *
 * Réservé au Bâtisseur et au-delà. L'Explorateur travaille en blocs : un
 * éditeur de texte vide ne lui dirait rien, son bac à sable sera autre chose.
 */
export default async function AtelierPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  const visiteur = await visiteurEleve(supabase, user.id);
  if (!visiteur) redirect(`/${locale}/connexion`);

  // L'admin regarde l'atelier sans en avoir un : il voit les amorces, et rien
  // ne s'enregistre.
  if (visiteur.mode === "apercu") {
    return <Page locale={locale} programmes={[]} apercu />;
  }

  await requireStudentPermission(user.id, "student.atelier", locale);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: eleve } = await admin
    .from("students").select("id, level, level_num").eq("id", visiteur.studentId).maybeSingle();
  if (!atelierOuvertA(eleve?.level, eleve?.level_num)) redirect(`/${locale}/eleve`);

  const programmes = await listerProgrammes(visiteur.studentId);
  return (
    <Page
      locale={locale}
      programmes={programmes.map((p) => ({
        id: p.id, titre: p.titre, modifieLe: p.modifieLe, partage: Boolean(p.jeton),
      }))}
    />
  );
}

function Page({ locale, programmes, apercu = false }: {
  locale: string;
  programmes: Carte[];
  apercu?: boolean;
}) {
  return (
    <div className="p-6 lg:p-10 max-w-5xl">
      <h1 className="text-2xl font-black text-white">🛠️ Mon atelier</h1>
      <p className="text-sm mt-1 mb-6" style={{ color: "#94a3b8" }}>
        Ici, c&apos;est toi qui décides. Écris un programme, lance-le, recommence.
      </p>

      <MesProgrammes programmes={programmes} amorces={AMORCES} locale={locale} apercu={apercu} />
    </div>
  );
}
