"use client";
// Banc de vérification de la scène, dans l'esprit de /test-maze et /test-music :
// elle monte le décor exactement comme le fait le lecteur de quêtes.
import dynamic from "next/dynamic";
import { preludeDe, COLLECTE, type SceneConfig } from "@/components/eleve/scenes/preludes";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });
const Scene = dynamic(() => import("@/components/eleve/scenes/Scene"), { ssr: false });

const sc: SceneConfig = { decor: "forage", reglages: { contenance: 40, prise_min: 4, prise_max: 12 }, plafond: 200 };
const SUJET = `<p>Ce matin, la pompe est capricieuse : un coup donne 4 litres, le suivant en donne 12. <strong>Tu ne peux pas savoir combien de seaux il te faudra</strong> — personne ne peut.</p>
<p>🎯 <strong>Ta mission</strong> — remplir les 40 litres de la bassine, et annoncer combien de seaux il a fallu.<br>
🧰 <strong>Tu as</strong> — <code>tirer()</code>, qui donne le contenu d'un seau en litres. Et un éditeur vide.<br>
✅ <strong>C'est réussi quand</strong> — la bassine est pleine, et que ta dernière ligne annonce le nombre de seaux.</p>`;

export default function Verif() {
  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", padding: 24 }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}
             dangerouslySetInnerHTML={{ __html: SUJET }} />
        <PythonRunner
          starterCode={"# La bassine fait 40 litres. tirer() te donne un seau.\n# A toi d'ecrire le programme.\n"}
          hiddenTests={'seaux = [e for e in _journal if e["quoi"] == "verser"]\ntotal = sum(e["litres"] for e in seaux)\nassert "while" in code, "Seul un while peut decider tout seul quand s arreter."\nassert total >= 40, "La bassine veut 40 litres, et ton programme s arrete a " + str(total) + "."\nlignes = [l for l in output.split("\\n") if l.strip()]\nassert lignes, "Ton programme n affiche rien."\nassert str(len(seaux)) in lignes[-1], "Il a fallu " + str(len(seaux)) + " seaux : ta derniere ligne doit l annoncer."'}
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
