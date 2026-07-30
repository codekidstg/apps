"use client";

import { useState, useTransition } from "react";
import { validateCertificate } from "./actions";
import CertHtmlPreview, { type CertPreviewData } from "./CertHtmlPreview";

type Props = {
  data: CertPreviewData;
  certId: string;
  validatedAt: string | null;
  onClose: () => void;
  onValidated?: () => void;
};

export default function CertPreviewModal({ data, certId, validatedAt, onClose, onValidated }: Props) {
  const [validated, setValidated] = useState(!!validatedAt);
  const [isPending, start] = useTransition();

  function handleValidate() {
    start(async () => {
      await validateCertificate(certId);
      setValidated(true);
      onValidated?.();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.8)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="flex flex-col overflow-hidden shadow-2xl"
        style={{ width: "min(820px, 96vw)", height: "min(640px, 92vh)", borderRadius: 20, background: "#fff" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0" style={{ borderBottom: "1px solid #E2E8F0" }}>
          <div>
            <div className="text-xs font-black uppercase tracking-widest mb-0.5" style={{ color: "#FDB813" }}>
              Prévisualisation
            </div>
            <div className="font-black text-sm" style={{ color: "#1B2D5E" }}>
              {data.themeName ?? data.levelName}
            </div>
            <div className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
              {data.studentName} · Score {data.score}/100 · {data.issuedAt}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none ml-4 shrink-0">✕</button>
        </div>

        {/* Preview HTML — occupe tout l'espace disponible */}
        <div className="flex-1 overflow-auto">
          <CertHtmlPreview {...data} />
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-3 px-6 py-4 shrink-0" style={{ borderTop: "1px solid #E2E8F0" }}>
          {!validated ? (
            <button
              disabled={isPending}
              onClick={handleValidate}
              className="flex-1 py-3 rounded-2xl font-black text-sm transition-all disabled:opacity-50"
              style={{ background: "#FDB813", color: "#1B2D5E" }}
            >
              {isPending ? "Validation…" : "✓ Valider & autoriser le téléchargement"}
            </button>
          ) : (
            <a
              href={`/api/certificats/${certId}`}
              download
              className="flex-1 py-3 rounded-2xl font-black text-sm text-center transition-all"
              style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0" }}
            >
              ⬇ Télécharger le PDF
            </a>
          )}
          <button
            onClick={onClose}
            className="py-3 px-5 rounded-2xl font-bold text-sm border-2 transition-colors"
            style={{ borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
