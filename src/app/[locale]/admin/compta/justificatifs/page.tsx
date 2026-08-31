import JustificatifsPage from "@/components/compta/JustificatifsPage";

export const dynamic = "force-dynamic";

export default function AdminJustificatifsPage({
  searchParams,
}: {
  searchParams: Promise<{ mentor?: string; month?: string; year?: string }>;
}) {
  return <JustificatifsPage searchParams={searchParams} base="/fr/admin/compta/justificatifs" />;
}
