"use client";

import dynamic from "next/dynamic";
import type { ThemeProgress } from "./VillageMap";

const VillageMap = dynamic(() => import("./VillageMap"), { ssr: false });

export default function VillageMapClient({ progress, kodiMessage }: { progress: ThemeProgress; kodiMessage?: string }) {
  return <VillageMap progress={progress} kodiMessage={kodiMessage} />;
}
