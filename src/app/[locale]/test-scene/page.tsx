"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "cahier", reglages: {}, plafond: 200 };
const SUJET = `<p>L'exercice exact sur lequel ça bloquait : séance 4, premier défi, cahier vide au départ.</p>
<p>🎯 <strong>Ta mission</strong> — ajouter <code>f.close()</code> pour que la note arrive vraiment dans le cahier.</p>`;

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: SUJET }} />
        <PythonRunner
          starterCode={'f = open("carnet.txt", "w")\nf.write("Ama 14")\nprint("Ecrit !")\n'}
          hiddenTests={'assert ".close(" in code, "Il faut fermer le cahier."\ngarde = _vrai_open("carnet.txt").read()\nassert garde == "Ama 14", "Le cahier devrait contenir Ama 14. Il contient : " + repr(garde)'}
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
