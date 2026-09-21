import QuestionsDirection from "@/components/backoffice/QuestionsDirection";

export const dynamic = "force-dynamic";

export default async function AdminQuestionsPage({ searchParams }: { searchParams: Promise<{ filtre?: string; eleve?: string }> }) {
  const { filtre, eleve } = await searchParams;
  return <QuestionsDirection espace="admin" filtre={filtre} eleve={eleve} />;
}
