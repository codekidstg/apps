import { getComptaMentorsData } from "@/lib/compta/actions";
import MonthSelector from "./MonthSelector";
import MentorPaymentRow from "./MentorPaymentRow";
import RateModal from "./RateModal";
import Link from "next/link";

type Props = { month: number; year: number; exportHref: string };

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default async function MentorsComptaPage({ month, year, exportHref }: Props) {
  const data = await getComptaMentorsData(month, year);

  const totalDue  = data.reduce((s: number, t: any) => s + t.totalDue,  0);
  const totalPaid = data.reduce((s: number, t: any) => s + t.totalPaid, 0);
  const totalWait = data.reduce((s: number, t: any) => s + t.lines.filter((l: any) => l.status === "pending_report").length, 0);

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

      {/* Cartes par mentor */}
      {data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
          <div className="text-4xl mb-3">📅</div>
          <p className="font-bold">Aucune séance passée ce mois.</p>
        </div>
      ) : data.map(({ teacher, rate, lines, totalDue: due, totalPaid: paid }: any) => (
        <div key={teacher.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Header mentor */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50/50">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-base shrink-0">
              {teacher.display_name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-black text-gray-900">{teacher.display_name}</div>
              <div className="text-xs text-gray-400 mt-0.5">
                {rate ? (
                  <span>{rate.rate_fcfa.toLocaleString("fr-FR")} FCFA / {rate.rate_type === "per_hour" ? "heure" : "séance"}</span>
                ) : (
                  <span className="text-amber-500 font-bold">⚠ Aucun tarif configuré</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <RateModal type="teacher" entityId={teacher.id} entityName={teacher.display_name} currentRate={rate} />
              <div className="text-right">
                <div className="text-xs text-gray-400">Dû</div>
                <div className="text-base font-black text-amber-600">{due.toLocaleString("fr-FR")} F</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-400">Payé</div>
                <div className="text-base font-black text-green-600">{paid.toLocaleString("fr-FR")} F</div>
              </div>
            </div>
          </div>

          {/* Lignes séances */}
          <div>
            {lines.map((line: any, i: number) => (
              <MentorPaymentRow
                key={i}
                teacherId={teacher.id}
                sessionId={line.sessionId}
                occurrenceDate={line.occurrenceDate}
                title={line.title}
                at={line.at.toISOString()}
                duration_min={line.duration_min}
                studentName={line.studentName}
                status={line.status}
                amount={line.amount}
                paymentNotes={line.payment?.notes}
              />
            ))}
          </div>

          {/* Pied mentor */}
          <div className="flex items-center justify-between px-6 py-3 bg-gray-50/50 border-t border-gray-100">
            <span className="text-xs text-gray-400">{lines.length} séance{lines.length > 1 ? "s" : ""}</span>
            <div className="flex items-center gap-6">
              <span className="text-xs font-bold text-gray-500">
                En attente : <span className="text-amber-600">{(due - paid).toLocaleString("fr-FR")} F</span>
              </span>
              <span className="text-xs font-bold text-gray-500">
                Total dû : <span className="font-black text-gray-800">{due.toLocaleString("fr-FR")} F</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
