import { getComptaParentsData, getAllStudentsWithRates } from "@/lib/compta/actions";
import MonthSelector from "./MonthSelector";
import ParentPaymentRow from "./ParentPaymentRow";
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
            <p className="text-xs text-gray-400">Montant facturé par séance réalisée, par élève</p>
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

      {/* Cartes par parent */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">👨‍👩‍👦</div>
          <p className="font-bold">Aucune séance facturée ce mois.</p>
        </div>
      ) : data.map(({ parent, children, grandDue, grandPaid }: any) => (
        <div key={parent.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header parent */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center text-white font-black text-base shrink-0">
              {parent.display_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900">{parent.display_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {children.length} enfant{children.length > 1 ? "s" : ""}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
              <div className="text-right">
                <div className="text-xs text-gray-400">Total dû</div>
                <div className="text-base font-black text-amber-600">{grandDue.toLocaleString("fr-FR")} F</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Encaissé</div>
                <div className="text-base font-black text-green-600">{grandPaid.toLocaleString("fr-FR")} F</div>
              </div>
            </div>
          </div>

          {/* Enfants */}
          {children.map((child: any) => (
            <div key={child.studentId}>
              {/* Header enfant */}
              <div className="flex items-center gap-3 px-6 py-2.5 bg-indigo-50/40 border-b border-indigo-100/50">
                <span className="text-sm">👦</span>
                <span className="text-sm font-black text-indigo-900 flex-1">{child.studentName}</span>
                <div className="flex items-center gap-3">
                  <RateModal
                    type="student"
                    entityId={child.studentId}
                    entityName={child.studentName}
                    currentRate={child.rate ?? null}
                  />
                  {child.rate > 0 ? (
                    <span className="text-xs text-gray-400">{child.rate.toLocaleString("fr-FR")} F/séance</span>
                  ) : (
                    <span className="text-xs text-amber-500 font-bold">⚠ Tarif non défini</span>
                  )}
                  <span className="text-xs font-black text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded-full">
                    {child.totalPaid.toLocaleString("fr-FR")} / {child.totalDue.toLocaleString("fr-FR")} F
                  </span>
                </div>
              </div>

              {/* Lignes séances */}
              {child.lines.map((line: any, i: number) => (
                <ParentPaymentRow
                  key={i}
                  parentId={parent.id}
                  studentId={child.studentId}
                  sessionId={line.sessionId}
                  occurrenceDate={line.occurrenceDate}
                  title={line.title}
                  at={line.at.toISOString()}
                  duration_min={line.duration_min}
                  status={line.status}
                  amount={line.amount}
                  comment={line.payment?.comment}
                />
              ))}
            </div>
          ))}

          {/* Pied parent */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
            <span className="text-xs text-gray-400">
              {children.reduce((s: number, c: any) => s + c.lines.length, 0)} séance{children.reduce((s: number, c: any) => s + c.lines.length, 0) > 1 ? "s" : ""}
            </span>
            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-gray-500">
                Reste : <span className="text-amber-600 font-black">{(grandDue - grandPaid).toLocaleString("fr-FR")} F</span>
              </span>
              <span className="text-sm font-black text-gray-800">
                Total : {grandDue.toLocaleString("fr-FR")} F
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Grand total */}
      {data.length > 0 && (
        <div className="bg-brand-navy text-white rounded-2xl px-6 py-4 flex items-center justify-between">
          <span className="font-black">Total général — {MONTHS[month-1]} {year}</span>
          <div className="flex items-center gap-8">
            <div className="text-right">
              <div className="text-xs opacity-60">À encaisser</div>
              <div className="text-xl font-black">{grandTotal.toLocaleString("fr-FR")} F</div>
            </div>
            <div className="text-right">
              <div className="text-xs opacity-60">Encaissé</div>
              <div className="text-xl font-black text-green-300">{grandEncaisse.toLocaleString("fr-FR")} F</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
