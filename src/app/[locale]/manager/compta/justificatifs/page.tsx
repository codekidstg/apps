import JustificatifsPage from "@/components/compta/JustificatifsPage";

export const dynamic = "force-dynamic";

export default function ManagerJustificatifsPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; month?: string; year?: string }>;
}) {
  return <JustificatifsPage searchParams={searchParams} base="/fr/manager/compta/justificatifs" />;
}
