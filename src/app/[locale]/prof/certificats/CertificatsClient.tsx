"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { CertPreviewData } from "./CertHtmlPreview";

const CertPreviewModal = dynamic(() => import("./CertPreviewModal"), { ssr: false });

const LEVEL_NAMES: Record<string, string> = { explorer: "Explorateur", builder: "Bâtisseur", architect: "Architecte" };
const LEVEL_COLORS: Record<string, { bg: string; badge: string; bar: string }> = {
  explorer:  { bg: "#f0fdf4", badge: "bg-green-100 text-green-700",   bar: "#22c55e" },
  builder:   { bg: "#eff6ff", badge: "bg-blue-100 text-blue-700",     bar: "#3b82f6" },
  architect: { bg: "#faf5ff", badge: "bg-purple-100 text-purple-700", bar: "#a855f7" },
};

type CertInfo = {
  id: string;
  theme_id: string;
  validated_at: string | null;
  score: number;
  issued_at: string;
  competencies: string[];
  nLessons: number;
};

type ThemeProgress = {
  theme_id: string;
  theme_title: string;
  done: number;
  total: number;
  cert: CertInfo | null;
};

type StudentRow = {
  id: string;
  name: string;
  level: string;
  xp: number;
  themes: ThemeProgress[];
};

type ModalState = {
  certId: string;
  validatedAt: string | null;
  data: CertPreviewData;
};

export default function CertificatsClient({
  students,
  profName,
}: {
  students: StudentRow[];
  profName: string;
}) {
  const [modal, setModal] = useState<ModalState | null>(null);
  const [validatedIds, setValidatedIds] = useState<Set<string>>(new Set());

  function openModal(cert: CertInfo, studentName: string, themeTitle: string) {
    setModal({
      certId: cert.id,
      validatedAt: cert.validated_at,
      data: {
        type:        "theme",
        studentName,
        themeName:   themeTitle,
        competencies: cert.competencies,
        score:       cert.score,
        totalXp:     0,
        nLessons:    cert.nLessons,
        profName,
        issuedAt:    new Date(cert.issued_at).toLocaleDateString("fr-FR"),
        certId:      cert.id,
        verifyHash:  cert.id.slice(0, 12),
      },
    });
  }

  const totalPending   = students.reduce((acc, s) =>
    acc + s.themes.filter(t => t.cert && !t.cert.validated_at && !validatedIds.has(t.cert.id)).length, 0);
  const totalValidated = students.reduce((acc, s) =>
    acc + s.themes.filter(t => t.cert && (t.cert.validated_at || validatedIds.has(t.cert.id))).length, 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>Certificats</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>
          {totalPending > 0 && <span style={{ color: "#d97706" }}>{totalPending} en attente · </span>}
          {totalValidated} validé{totalValidated !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Un bloc par élève */}
      {students.map((student) => {
        const colors = LEVEL_COLORS[student.level] ?? LEVEL_COLORS.explorer;
        const certsDone    = student.themes.filter(t => t.cert && (t.cert.validated_at || validatedIds.has(t.cert.id))).length;
        const certsPending = student.themes.filter(t => t.cert && !t.cert.validated_at && !validatedIds.has(t.cert.id)).length;

        return (
          <div key={student.id} className="bg-white rounded-3xl border overflow-hidden shadow-sm" style={{ borderColor: "#E2E8F0" }}>
            {/* Header élève */}
            <div className="flex items-center gap-4 px-6 py-4" style={{ background: colors.bg, borderBottom: "1px solid #E2E8F0" }}>
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base text-white shrink-0" style={{ background: "#1B2D5E" }}>
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="font-black text-base" style={{ color: "#1B2D5E" }}>{student.name}</div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${colors.badge}`}>
                    {LEVEL_NAMES[student.level] ?? student.level}
                  </span>
                  <span className="text-[10px] font-bold" style={{ color: "#94A3B8" }}>{student.xp} XP</span>
                  {certsDone > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                      🎓 {certsDone} certif{certsDone > 1 ? "s" : ""} validé{certsDone > 1 ? "s" : ""}
                    </span>
                  )}
                  {certsPending > 0 && (
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                      ⏳ {certsPending} en attente
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Thèmes */}
            <div className="divide-y" style={{ borderColor: "#F1F5F9" }}>
              {student.themes.length === 0 && (
                <div className="px-6 py-6 text-sm text-center" style={{ color: "#94A3B8" }}>
                  Aucun thème publié pour ce niveau.
                </div>
              )}
              {student.themes.map((t) => {
                const pct         = t.total > 0 ? Math.round((t.done / t.total) * 100) : 0;
                const isValidated = t.cert && (t.cert.validated_at || validatedIds.has(t.cert.id));
                const isPending   = t.cert && !isValidated;

                return (
                  <div key={t.theme_id} className="flex items-center gap-4 px-6 py-4">
                    {/* Progression */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-sm font-black truncate" style={{ color: "#1B2D5E" }}>{t.theme_title}</span>
                        {isValidated && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">✅ Validé</span>}
                        {isPending   && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">⏳ En attente</span>}
                        {pct === 100 && !t.cert && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 shrink-0">✓ Complété</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "#F1F5F9" }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors.bar }} />
                        </div>
                        <span className="text-[11px] font-black shrink-0 w-20 text-right" style={{ color: "#64748B" }}>
                          {t.done}/{t.total} leçons
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {t.cert && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openModal(t.cert!, student.name, t.theme_title)}
                          className="text-xs font-black px-3 py-2 rounded-xl transition-all hover:opacity-80 flex items-center gap-1.5"
                          style={{ background: "#1B2D5E", color: "white" }}
                        >
                          🔍 Prévisualiser
                          {!isValidated && <span className="text-[9px] bg-amber-400 text-amber-900 px-1.5 rounded-full">valider</span>}
                        </button>
                        {isValidated && (
                          <a
                            href={`/api/certificats/${t.cert.id}`}
                            download
                            className="text-xs font-black px-3 py-2 rounded-xl transition-all hover:opacity-80"
                            style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
                          >
                            ⬇ PDF
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {students.length === 0 && (
        <div className="bg-white rounded-2xl border p-12 text-center shadow-sm" style={{ borderColor: "#E2E8F0" }}>
          <div className="text-4xl mb-3">🎓</div>
          <p className="font-bold" style={{ color: "#94A3B8" }}>Aucun élève assigné pour le moment.</p>
        </div>
      )}

      {modal && (
        <CertPreviewModal
          data={modal.data}
          certId={modal.certId}
          validatedAt={modal.validatedAt}
          onClose={() => setModal(null)}
          onValidated={() => {
            setValidatedIds(prev => new Set([...prev, modal.certId]));
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
