import { getTreasuryData } from "@/lib/compta/treasury";
import PageHeader from "@/components/backoffice/PageHeader";
import TresorerieClient from "@/components/compta/TresorerieClient";

export default async function AdminTresoreriePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp  = await searchParams;
  const now = new Date();

  const to   = sp.to   ?? now.toISOString().slice(0, 10);
  const from = sp.from ?? new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const data = await getTreasuryData(from, to);

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Trésorerie"
        subtitle="Flux financiers globaux — entrées, sorties, solde net"
      />
      <div className="mt-6">
        <TresorerieClient data={data} from={from} to={to} isAdmin={true} />
      </div>
    </div>
  );
}
