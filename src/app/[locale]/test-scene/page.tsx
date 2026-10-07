"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "etal", reglages: { papiers: ["2000", "1 500", "2 500", "800"] }, plafond: 200 };
const SUJET = `<p>C'est le marché. Quatre clients t'ont tendu leur papier, et trois ont écrit leur montant avec un espace au milieu.</p>
<p>🎯 <strong>Ta mission</strong> — encaisser les quatre papiers, et annoncer le total de la caisse.<br>
🧰 <strong>Tu as</strong> — la liste <code>papiers</code>, la commande <code>encaisser(papier)</code>, et <code>.replace(" ", "")</code>.<br>
✅ <strong>C'est réussi quand</strong> — les quatre clients sont servis et que la caisse affiche 6800.</p>`;

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: SUJET }} />
        <PythonRunner
          starterCode={"caisse = 0\n\n# Pour chaque papier : nettoie-le, ajoute-le a la caisse, encaisse.\n"}
          hiddenTests={'encaisses = [e for e in _journal if e["quoi"] == "encaisser"]\nassert ".replace(" in code, "Un espace au milieu tue int()."\nassert len(encaisses) == 4, "Les 4 clients doivent etre encaisses, ton programme en a servi " + str(len(encaisses)) + "."\nassert "6800" in output, "La caisse doit afficher 6800."'}
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
