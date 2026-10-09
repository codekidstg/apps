"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "cahier", reglages: { cahier_depart: ["Ama 14", "Kofi 11", "Yawa 16"] }, plafond: 200 };
const SUJET = `<p>Page fraîche, aucun autre bloc n'a tourné. Le cahier doit pourtant contenir les notes d'hier.</p>
<p>🎯 <strong>Ta mission</strong> — relire le cahier, afficher chaque note, puis annoncer combien il y en a.</p>`;

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: SUJET }} />
        <PythonRunner
          starterCode={"# Relis le cahier, decoupe-le, affiche, et compte.\n"}
          hiddenTests={'assert ".split(" in code, "Il faut redecouper le texte en lignes."\nfor n in ["Ama", "Kofi", "Yawa"]:\n    assert n in output, "Il manque " + n + "."\nassert "3" in output, "Il y a 3 notes."'}
          language="python"
          prelude={preludeDe(sc)}
          collect={COLLECTE[sc.decor]}
          garderSortieSiPlante
          rendreSortie={(out, enMarche, recolte, plante) => (
            <Scene scene={sc} recolte={recolte} enMarche={enMarche} plante={plante} stdout={out} />
          )}
        />
      </div>
    </div>
  );
}
