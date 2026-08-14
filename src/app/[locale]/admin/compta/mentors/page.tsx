import MentorsComptaPage from "@/components/compta/MentorsComptaPage";

export default async function AdminComptaMentors({ searchParams }: { searchParams: Promise<{ month?: string; year?: string }> }) {
  const sp    = await searchParams;
  const now   = new Date();
  const month = parseInt(sp.month ?? "") || now.getMonth() + 1;
  const year  = parseInt(sp.year  ?? "") || now.getFullYear();

  return (
    <div className="p-8 max-w-5xl">
      <MentorsComptaPage month={month} year={year} exportHref={`/api/admin/export/compta-mentors?month=${month}&year=${year}`} />
    </div>
  );
}
