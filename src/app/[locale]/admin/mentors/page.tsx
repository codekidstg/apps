import SuiviMentors from "@/components/backoffice/SuiviMentors";

export const dynamic = "force-dynamic";

export default async function AdminMentorsPage({ searchParams }: { searchParams: Promise<{ mois?: string }> }) {
  const { mois } = await searchParams;
  return <SuiviMentors espace="admin" mois={mois} />;
}
