"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

const SessionReportForm = dynamic(() => import("@/components/prof/SessionReportForm"), { ssr: false });

type PastSession = {
  sessionId?: string;
  studentId?: string;
  title: string;
  dateStr: string;
  time: string;
  duration: number;
  studentName: string | null;
  recurring: boolean;
};

export default function PastSessionsList({ sessions }: { sessions: PastSession[] }) {
  const [openReport, setOpenReport] = useState<PastSession | null>(null);

  if (!sessions.length) return null;

  return (
    <>
      <section>
        <details>
          <summary className="cursor-pointer text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 list-none">
            <span className="text-gray-300">▶</span>
            Archivées — 7 derniers jours ({sessions.length})
          </summary>
          <div className="mt-3 space-y-1.5">
            {sessions.map((occ, i) => (
              <div key={i} className="flex items-center gap-4 bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="font-black text-gray-600 text-sm line-through">{occ.title}</div>
                  <div className="text-xs text-gray-400">{occ.dateStr} à {occ.time} · {occ.duration} min</div>
                </div>
                <button
                  onClick={() => setOpenReport(occ)}
                  className="shrink-0 text-xs font-black px-3 py-1.5 rounded-xl transition-colors hover:opacity-80"
                  style={{ background: "#1B2D5E", color: "white" }}
                >
                  + Rapport
                </button>
              </div>
            ))}
          </div>
        </details>
      </section>

      {openReport && (
        <SessionReportForm
          sessionId={openReport.sessionId}
          studentId={openReport.studentId ?? undefined}
          sessionTitle={openReport.title}
          sessionDate={`${openReport.dateStr} à ${openReport.time}`}
          onClose={() => setOpenReport(null)}
        />
      )}
    </>
  );
}
