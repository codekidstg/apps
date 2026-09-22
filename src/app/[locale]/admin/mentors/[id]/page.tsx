import FicheMentor from "@/components/backoffice/FicheMentor";

export const dynamic = "force-dynamic";

export default async function AdminFicheMentorPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ mois?: string }>;
}) {
  const [{ id }, { mois }] = await Promise.all([params, searchParams]);
  return <FicheMentor espace="admin" id={id} mois={mois} />;
}
