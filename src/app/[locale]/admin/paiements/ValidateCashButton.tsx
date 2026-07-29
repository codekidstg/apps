"use client";
import { useTransition } from "react";
import { validateCashPayment } from "../../suivi/actions";

export default function ValidateCashButton({ paymentId }: { paymentId: string }) {
  const [isPending, start] = useTransition();
  return (
    <button
      disabled={isPending}
      onClick={() => start(async () => { await validateCashPayment(paymentId); })}
      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-black px-4 py-2 rounded-xl transition-colors"
    >
      {isPending ? "Validation…" : "✓ Valider"}
    </button>
  );
}
