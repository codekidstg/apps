import { getTreasuryData, getEnAttente, getActivite } from "@/lib/compta/treasury";
import PageHeader from "@/components/backoffice/PageHeader";
import TresorerieClient from "@/components/compta/TresorerieClient";
import ActiviteEtAttente from "@/components/compta/ActiviteEtAttente";

export default async function AdminTresoreriePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const sp  = await searchParams;
  const now = new Date();

  const to   = sp.to   ?? now.toISOString().slice(0, 10);
  const from = sp.from ?? new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

  const [data, activite, enAttente] = await Promise.all([
    getTreasuryData(from, to),
    getActivite(from, to),
    getEnAttente(),
  ]);

  return (
    <div className="p-8 max-w-5xl">
      <PageHeader
        title="Trésorerie"
        subtitle="Ce qui est entré et sorti de la caisse, au jour du règlement"
      />
      <div className="mt-6 space-y-6">
        {/* L'activité et les en-cours avant les flux : « est-ce que ça
            rapporte ? » et « qui me doit quoi ? » se lisent d'abord. */}
        <ActiviteEtAttente activite={activite} enAttente={enAttente} />
        <TresorerieClient data={data} from={from} to={to} isAdmin={true} />
      </div>
    </div>
  );
}
