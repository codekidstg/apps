"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "etal", reglages: { papiers: ["2000", "1 500", "deux mille", "800"] }, plafond: 200 };
const SUJET = `<p>Quatre clients, et le troisième a écrit <strong>deux mille</strong> en toutes lettres. Aucun nettoyage ne sauvera ce papier-là.</p>
<p>Lance le programme tel quel, et regarde ce qui arrive à la boutique.</p>`;

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: SUJET }} />
        <PythonRunner
          starterCode={"caisse = 0\nfor papier in papiers:\n    propre = papier.replace(\" \", \"\")\n    caisse = caisse + int(propre)\n    encaisser(papier)\nprint(\"Caisse :\", caisse)\n"}
          hiddenTests={'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\nassert len(encaisses) == 4, "Les 4 clients doivent etre encaisses, ton programme en a servi " + str(len(encaisses)) + "."'}
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
