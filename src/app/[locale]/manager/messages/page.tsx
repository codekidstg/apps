import BoiteDirection from "@/components/backoffice/BoiteDirection";

export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ voir?: string }> }) {
  const { voir } = await searchParams;
  return <BoiteDirection espace="manager" voir={voir} />;
}
