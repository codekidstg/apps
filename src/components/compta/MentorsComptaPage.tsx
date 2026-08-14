import { getComptaMentorsData } from "@/lib/compta/actions";
import MonthSelector from "./MonthSelector";
import MentorsList from "./MentorsList";

type Props = { month: number; year: number; exportHref: string };

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default async function MentorsComptaPage({ month, year, exportHref }: Props) {
  const data = await getComptaMentorsData(month, year);

  const totalDue  = data.reduce((s: number, t: any) => s + t.totalDue,  0);
  const totalPaid = data.reduce((s: number, t: any) => s + t.totalPaid, 0);
  const totalWait = data.reduce((s: number, t: any) => s + t.lines.filter((l: any) => l.status === "pending_report").length, 0);

  // Sérialiser pour le client component (Date → string)
  const serialized = (data as any[]).map((d: any) => ({
    teacher:   d.teacher,
    rate:      d.rate,
    totalDue:  d.totalDue,
    totalPaid: d.totalPaid,
    lines: d.lines.map((l: any) => ({
      ...l,
      at: (l.at instanceof Date ? l.at : new Date(l.at)).toISOString(),
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Rémunération des mentors</h1>
          <p className="text-sm text-gray-400 mt-0.5">{MONTHS[month-1]} {year}</p>
        </div>
        <div className="flex items-center gap-3">
          <MonthSelector month={month} year={year} />
          <a href={exportHref} download
            className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            ⬇ CSV
          </a>
        </div>
      </div>

      {/* Résumé global */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total dû ce mois",  value: totalDue,  color: "text-amber-600" },
          { label: "Déjà payé",         value: totalPaid, color: "text-green-600" },
          { label: "Reste à payer",     value: totalDue - totalPaid, color: "text-brand-navy" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`text-2xl font-black ${k.color}`}>{k.value.toLocaleString("fr-FR")} F</div>
            <div className="text-xs font-bold text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {totalWait > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
          <span className="text-xl">⏳</span>
          <span className="text-sm font-bold text-amber-800">
            {totalWait} séance{totalWait > 1 ? "s" : ""} en attente de rapport — le mentor doit rédiger son compte-rendu.
          </span>
        </div>
      )}

      {/* Liste avec recherche */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold">Aucune séance passée ce mois.</p>
        </div>
      ) : (
        <MentorsList data={serialized} />
      )}
    </div>
  );
}
