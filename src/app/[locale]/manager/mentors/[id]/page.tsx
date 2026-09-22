import FicheMentor from "@/components/backoffice/FicheMentor";

export const dynamic = "force-dynamic";

export default async function ManagerFicheMentorPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mois?: string }>;
}) {
  const [{ id }, { mois }] = await Promise.all([params, searchParams]);
  return <FicheMentor espace="manager" id={id} mois={mois} />;
}
