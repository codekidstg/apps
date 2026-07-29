"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type BlocklyMusic from "./BlocklyMusic";

const BlocklyMusicDynamic = dynamic(() => import("./BlocklyMusic"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center" style={{ height: 400 }}>
      <div className="text-slate-400 font-bold text-sm">🎹 Chargement du studio musical…</div>
    </div>
  ),
});

export default function BlocklyMusicLoader(props: ComponentProps<typeof BlocklyMusic>) {
  return <BlocklyMusicDynamic {...props} />;
}
