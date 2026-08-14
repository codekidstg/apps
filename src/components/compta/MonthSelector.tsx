"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";

const MONTHS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];

export default function MonthSelector({ month, year }: { month: number; year: number }) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  function navigate(m: number, y: number) {
    const sp = new URLSearchParams(params.toString());
    sp.set("month", String(m));
    sp.set("year",  String(y));
    router.push(`${pathname}?${sp.toString()}`);
  }

  function prev() {
    if (month === 1) navigate(12, year - 1);
    else navigate(month - 1, year);
  }
  function next() {
    const now = new Date();
    if (year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth() + 1)) return;
    if (month === 12) navigate(1, year + 1);
    else navigate(month + 1, year);
  }

  const now = new Date();
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;

  return (
    <div className="flex items-center gap-3">
      <button onClick={prev}
        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-black transition-colors">
        ‹
      </button>
      <div className="text-sm font-black text-gray-800 min-w-32 text-center">
        {MONTHS[month - 1]} {year}
      </div>
      <button onClick={next} disabled={isCurrentMonth}
        className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 font-black transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
        ›
      </button>
      {!isCurrentMonth && (
        <button onClick={() => navigate(now.getMonth() + 1, now.getFullYear())}
          className="text-xs font-black text-brand-orange hover:underline">
          Aujourd'hui
        </button>
      )}
    </div>
  );
}
