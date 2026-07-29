"use client";
import { useTransition } from "react";
import { validateCertificate } from "./actions";

export default function ValidateCertButton({ certId }: { certId: string }) {
  const [isPending, start] = useTransition();

  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await validateCertificate(certId); })}
      className="bg-brand-orange hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-black px-4 py-2 rounded-xl transition-colors"
    >
      {isPending ? "Validation…" : "✓ Valider"}
    </button>
  );
}
