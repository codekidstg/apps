"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "forage", reglages: { contenance: 40, prise_min: 8, prise_max: 8 }, plafond: 200 };

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <PythonRunner
          starterCode={'litres = 0\n\nwhile litres < 40:\n    litres = litres + tirer()\n    print("Dans la bassine :", litres, "litres")\n'}
          hiddenTests={'import re\nassert "while" in code, "Garde la boucle while."\nassert "40" in code, "La bassine veut 40 litres."\nassert output.count("Dans la bassine") == 5, "Il faut 5 coups."\n'}
          language="python"
          prelude={preludeDe(sc)}
          collect={COLLECTE[sc.decor]}
          rendreSortie={(out, enMarche, recolte) => (
            <Scene scene={sc} recolte={recolte} enMarche={enMarche} stdout={out} />
          )}
        />
      </div>
    </div>
  );
}
