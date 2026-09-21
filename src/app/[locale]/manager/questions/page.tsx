import QuestionsDirection from "@/components/backoffice/QuestionsDirection";

export const dynamic = "force-dynamic";

export default async function ManagerQuestionsPage({ searchParams }: { searchParams: Promise<{ filtre?: string; eleve?: string }> }) {
  const { filtre, eleve } = await searchParams;
  return <QuestionsDirection espace="manager" filtre={filtre} eleve={eleve} />;
}
