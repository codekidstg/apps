import ParentsComptaPage from "@/components/compta/ParentsComptaPage";

export default async function AdminComptaParents({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const sp    = await searchParams;
  const now   = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year  = parseInt(sp.year  ?? "") || now.getFullYear();

  return (
    <div className="p-8 max-w-5xl">
      <ParentsComptaPage month={month} year={year} exportHref={`/api/admin/export/compta-parents?month=${month}&year=${year}`} />
    </div>
  );
}
