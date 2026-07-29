"use client";
import dynamic from "next/dynamic";

const BlocklyKodi = dynamic(() => import("./BlocklyKodi"), { ssr: false });

export default BlocklyKodi;
