"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type BlocklyRobot from "./BlocklyRobot";

const BlocklyRobotDynamic = dynamic(() => import("./BlocklyRobot"), {
  ssr: false,
  loading: () => (
    <div className="rounded-2xl border border-slate-700 bg-slate-900 flex items-center justify-center" style={{ height: 400 }}>
      <div className="text-slate-400 font-bold text-sm">🔧 Chargement du labo Blockly…</div>
    </div>
  ),
});

export default function BlocklyRobotLoader(props: ComponentProps<typeof BlocklyRobot>) {
  return <BlocklyRobotDynamic {...props} />;
}
