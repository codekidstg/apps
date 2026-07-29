"use client";
import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type CityMap from "./CityMap";

const CityMapDynamic = dynamic(() => import("./CityMap"), { ssr: false });

export default function CityMapLoader(props: ComponentProps<typeof CityMap>) {
  return <CityMapDynamic {...props} />;
}
