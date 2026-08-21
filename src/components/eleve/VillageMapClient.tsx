"use client";

import dynamic from "next/dynamic";
import type { ThemeProgress } from "./VillageMap";

const VillageMap = dynamic(() => import("./VillageMap"), { ssr: false });

export default function VillageMapClient({
  progress,
  kodiMessage,
  themeIds,
  locale,
}: {
  progress: ThemeProgress;
  kodiMessage?: string;
  themeIds?: string[];
  locale?: string;
}) {
  return <VillageMap progress={progress} kodiMessage={kodiMessage} themeIds={themeIds} locale={locale} />;
}
