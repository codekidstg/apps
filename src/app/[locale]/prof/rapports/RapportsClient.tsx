"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SessionReportForm = dynamic(() => import("@/components/prof/SessionReportForm"), { ssr: false });

const ADVANCEMENT_LABEL: Record<string, { icon: string; label: string; color: string }> = {
  completed: { icon: "✅", label: "A terminé la séance prévue",             color: "#10b981" },
  partial:   { icon: "⏩", label: "A avancé mais pas fini",                 color: "#f59e0b" },
  reviewed:  { icon: "🔁", label: "A revu / consolidé une séance précédente", color: "#6366f1" },
  blocked:   { icon: "⚠️", label: "N'a pas pu avancer (blocage)",           color: "#ef4444" },
};
const ENGAGEMENT_LABEL: Record<string, { icon: string; label: string }> = {
  motivated:  { icon: "🚀", label: "Très motivé, curieux" },
  focused:    { icon: "😊", label: "Bien concentré" },
  distracted: { icon: "😐", label: "Distrait mais participait" },
  disengaged: { icon: "😔", label: "Démotivé ou difficile à engager" },
};
const HELP_LABEL: Record<string, string> = {
  example:       "Réexplication avec un exemple concret",
  drawing:       "Dessin / schéma au tableau",
  unplugged:     "\"Joue le rôle de la machine\" (débranche)",
  encouragement: "Encouragement / patience",
  simplified:    "Simplifié l'exercice",
  other:         "Autre",
};

type Report = {
  id: string;
  advancement: string;
  engagement: string;
  difficulty_notes: string | null;
  help_methods: string[];
  next_session_note: string | null;
  reported_at: string;
};

type Item = {
  sessionId: string;
  occurrenceDate: string;
  title: string;
  dateStr: string;
  dayShort: string;
  day: number;
  monthShort: string;
  time: string;
  duration: number;
  studentName: string | null;
  recurring: boolean;
  report: Report | null;
};

function ReportReadOnly({ report, onClose }: { report: Report; onClose: () => void }) {
  const adv = ADVANCEMENT_LABEL[report.advancement];
  const eng = ENGAGEMENT_LABEL[report.engagement];
  const date = new Date(report.reported_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.5)" }}>
      <div className="bg-white rounded-3xl max-w-lg w-full mx-4 overflow-hidden shadow-2xl">
        <div className="px-6 pt-6 pb-4 flex items-start justify-between" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <div className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: "#10b981" }}>✓ Rapport rempli</div>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Soumis le {date}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Avancement */}
          <div>
            <div className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Avancement</div>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #E2E8F0" }}>
              <span className="text-xl">{adv?.icon}</span>
              <span className="text-sm font-bold" style={{ color: adv?.color ?? "#1B2D5E" }}>{adv?.label ?? report.advancement}</span>
            </div>
          </div>

          {/* Engagement */}
          <div>
            <div className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Engagement élève</div>
            <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#f8fafc", border: "1px solid #E2E8F0" }}>
              <span className="text-xl">{eng?.icon}</span>
              <span className="text-sm font-bold" style={{ color: "#1B2D5E" }}>{eng?.label ?? report.engagement}</span>
            </div>
          </div>

          {/* Difficultés */}
          {report.difficulty_notes && (
            <div>
              <div className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Difficultés</div>
              <div className="p-3 rounded-2xl text-sm" style={{ background: "#fef9f0", border: "1px solid #fde68a", color: "#92400e" }}>
                {report.difficulty_notes}
              </div>
            </div>
          )}

          {/* Méthodes */}
          {report.help_methods?.length > 0 && (
            <div>
              <div className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Comment tu as aidé</div>
              <div className="flex flex-wrap gap-2">
                {report.help_methods.map(m => (
                  <span key={m} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8" }}>
                    {HELP_LABEL[m] ?? m}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Note */}
          {report.next_session_note && (
            <div>
              <div className="text-xs font-black uppercase tracking-wide mb-2" style={{ color: "#94A3B8" }}>Note pour la prochaine fois</div>
              <div className="p-3 rounded-2xl text-sm italic" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
                {report.next_session_note}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4" style={{ borderTop: "1px solid #E2E8F0" }}>
          <button onClick={onClose} className="w-full py-3 rounded-2xl font-black text-sm text-white" style={{ background: "#1B2D5E" }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RapportsClient({ items }: { items: Item[] }) {
  const [openForm, setOpenForm]       = useState<Item | null>(null);
  const [openReport, setOpenReport]   = useState<Report | null>(null);

  const pending  = items.filter(i => !i.report);
  const done     = items.filter(i =>  i.report);

  function ItemRow({ item }: { item: Item }) {
    const hasDone = !!item.report;
    return (
      <div className="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 border" style={{ borderColor: "#E2E8F0" }}>
        {/* Date */}
        <div className="w-10 text-center shrink-0">
          <div className="text-[10px] font-black uppercase" style={{ color: "#94A3B8" }}>{item.dayShort}</div>
          <div className="text-lg font-black leading-none" style={{ color: "#1B2D5E" }}>{item.day}</div>
          <div className="text-[10px]" style={{ color: "#94A3B8" }}>{item.monthShort}</div>
        </div>
        <div className="w-px h-8 shrink-0" style={{ background: "#E2E8F0" }} />

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="font-black text-sm truncate" style={{ color: "#1B2D5E" }}>{item.title}</div>
          <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
            {item.time} · {item.duration} min
            {item.studentName && <> · 👦 {item.studentName}</>}
          </div>
        </div>

        {/* Action */}
        {hasDone ? (
          <button
            onClick={() => setOpenReport(item.report)}
            className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
          >
            ✓ Voir le rapport
          </button>
        ) : (
          <button
            onClick={() => setOpenForm(item)}
            className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-opacity hover:opacity-80"
            style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca" }}
          >
            ● À remplir
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>Mes rapports de séance</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>
          {done.length} rempli{done.length !== 1 ? "s" : ""} · {pending.length} en attente
        </p>
      </div>

      {/* Résumé rapide */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
          <div className="text-2xl font-black" style={{ color: "#16a34a" }}>{done.length}</div>
          <div className="text-xs font-bold mt-0.5" style={{ color: "#16a34a" }}>Remplis</div>
        </div>
        <div className="rounded-2xl p-4 text-center" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div className="text-2xl font-black" style={{ color: "#dc2626" }}>{pending.length}</div>
          <div className="text-xs font-bold mt-0.5" style={{ color: "#dc2626" }}>À remplir</div>
        </div>
      </div>

      {/* Séances à remplir */}
      {pending.length > 0 && (
        <section>
          <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#dc2626" }}>
            ● À remplir ({pending.length})
          </div>
          <div className="space-y-2">
            {pending.map((item, i) => <ItemRow key={i} item={item} />)}
          </div>
        </section>
      )}

      {/* Séances déjà remplies */}
      {done.length > 0 && (
        <section>
          <div className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#16a34a" }}>
            ✓ Remplis ({done.length})
          </div>
          <div className="space-y-2">
            {done.map((item, i) => <ItemRow key={i} item={item} />)}
          </div>
        </section>
      )}

      {items.length === 0 && (
        <div className="text-center py-16 text-sm font-bold" style={{ color: "#94A3B8" }}>
          Aucune séance passée trouvée.
        </div>
      )}

      {/* Modals */}
      {openForm && (
        <SessionReportForm
          sessionId={openForm.sessionId}
          studentId={undefined}
          occurrenceDate={openForm.occurrenceDate}
          sessionTitle={openForm.title}
          sessionDate={`${openForm.dateStr} à ${openForm.time}`}
          onClose={() => setOpenForm(null)}
        />
      )}
      {openReport && <ReportReadOnly report={openReport} onClose={() => setOpenReport(null)} />}
    </div>
  );
}
