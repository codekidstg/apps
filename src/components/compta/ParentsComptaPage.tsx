import { getComptaParentsData, getAllStudentsWithRates } from "@/lib/compta/actions";
import MonthSelector from "./MonthSelector";
import ParentsList from "./ParentsList";
import RateModal from "./RateModal";

type Props = { month: number; year: number; exportHref: string };

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default async function ParentsComptaPage({ month, year, exportHref }: Props) {
  const [data, allStudents] = await Promise.all([
    getComptaParentsData(month, year),
    getAllStudentsWithRates(),
  ]);

  const grandTotal     = data.reduce((s: number, p: any) => s + p.grandDue,  0);
  const grandEncaisse  = data.reduce((s: number, p: any) => s + p.grandPaid, 0);
  const grandAttente   = data.filter((p: any) => p.children.some((c: any) => c.lines.some((l: any) => l.status === "pending"))).length;

  // Sérialiser pour client component (Date → string)
  const serialized = (data as any[]).map((d: any) => ({
    parent:    d.parent,
    grandDue:  d.grandDue,
    grandPaid: d.grandPaid,
    children: d.children.map((c: any) => ({
      ...c,
      lines: c.lines.map((l: any) => ({
        ...l,
        at: (l.at instanceof Date ? l.at : new Date(l.at)).toISOString(),
      })),
    })),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-900">Versements des parents</h1>
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
          { label: "À encaisser ce mois", value: grandTotal,    color: "text-amber-600" },
          { label: "Encaissé",            value: grandEncaisse, color: "text-green-600" },
          { label: "Reste en attente",    value: grandTotal - grandEncaisse, color: "text-brand-navy" },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-200 p-5">
            <div className={`text-2xl font-black ${k.color}`}>{k.value.toLocaleString("fr-FR")} F</div>
            <div className="text-xs font-bold text-gray-400 mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {grandAttente > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
          <span className="text-xl">💳</span>
          <span className="text-sm font-bold text-amber-800">
            {grandAttente} parent{grandAttente > 1 ? "s" : ""} avec des paiements en attente ce mois.
          </span>
        </div>
      )}

      {/* ── Configuration des tarifs élèves ── */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-indigo-50/40">
          <span className="text-lg">⚙️</span>
          <div>
            <h2 className="font-black text-gray-900 text-sm">Tarifs par élève</h2>
            <p className="text-xs text-gray-400">Montant facturé par séance réalisée</p>
          </div>
        </div>
        {allStudents.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-400 text-sm">Aucun élève lié à un parent.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {allStudents.map((s) => (
              <div key={s.studentId} className="flex items-center gap-4 px-6 py-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-sm shrink-0">
                  {s.studentName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-gray-900 text-sm">{s.studentName}</div>
                  <div className="text-xs text-gray-400">Parent : {s.parentName}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.rate > 0 ? (
                    <span className="text-sm font-black text-indigo-700">{s.rate.toLocaleString("fr-FR")} F/séance</span>
                  ) : (
                    <span className="text-xs font-bold text-amber-500">⚠ Tarif non défini</span>
                  )}
                  <RateModal type="student" entityId={s.studentId} entityName={s.studentName} currentRate={s.rate || null} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Liste parents avec recherche + dropdown */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">👨‍👩‍👦</div>
          <p className="font-bold">Aucune séance facturée ce mois.</p>
          <p className="text-sm mt-1">Les séances apparaissent dès qu'un rapport est rédigé par le mentor.</p>
        </div>
      ) : (
        <ParentsList data={serialized} />
      )}
    </div>
  );
}
