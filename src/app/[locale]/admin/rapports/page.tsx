import RapportsPage from "@/components/backoffice/RapportsPage";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ periode?: string; voir?: string }> }) {
  const { periode, voir } = await searchParams;
  return <RapportsPage espace="admin" periode={periode} voir={voir} />;
}
