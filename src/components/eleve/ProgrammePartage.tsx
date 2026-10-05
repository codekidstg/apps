"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import EcranSortie from "./EcranSortie";
import { avecDe } from "@/lib/eleve/atelier-regles";

const PythonRunner = dynamic(() => import("@/components/editor/PythonRunner"), { ssr: false });

/**
 * Ce que le parent reçoit au bout du lien.
 *
 * Il ouvre sur le jeu, pas sur le code : un téléphone, le résultat déjà
 * enregistré, et un bouton pour y jouer. Le code est en dessous, replié — on
 * peut vouloir le voir, on ne commence pas par là.
 *
 * Le résultat enregistré s'affiche tout de suite, avant que Python ne se
 * charge : six mégaoctets sur un forfait togolais, ça se demande, ça ne
 * s'impose pas. Le parent voit d'abord ce que son enfant a fait, et décide
 * ensuite de jouer.
 */
export default function ProgrammePartage({ titre, prenom, code, sortie, interactif }: {
  titre: string;
  prenom: string;
  code: string;
  sortie: string | null;
  interactif: boolean;
}) {
  const [joue, setJoue] = useState(false);

  return (
    <div className="space-y-4">
      {joue ? (
        <PythonRunner
          starterCode={code}
          initialCode={code}
          libre
          cacherEditeur
          libelleLancer={interactif ? "Jouer" : "Lancer"}
          rendreSortie={(stdout, enMarche) => (
            <EcranSortie appareil="telephone" titre={titre}
              // Tant que rien n'est sorti, on garde le résultat enregistré sous
              // les yeux du parent — sauf quand le programme tourne vraiment :
              // il faut alors dire qu'il tourne, et pas inviter à le lancer.
              sortie={stdout || (enMarche ? "" : sortie ?? "")}
              attente={enMarche ? "Ton programme tourne — réponds-lui en dessous." : undefined} />
          )}
        />
      ) : (
        <>
          <EcranSortie appareil="telephone" sortie={sortie ?? ""} titre={titre} />

          <div className="flex flex-col items-center gap-2">
            <button type="button" onClick={() => setJoue(true)}
              className="text-sm font-black px-6 py-3 rounded-2xl transition-colors"
              style={{ background: "#047857", color: "white" }}>
              ▶ {interactif ? `Jouer au programme ${avecDe(prenom)}` : `Lancer le programme ${avecDe(prenom)}`}
            </button>
            <span className="text-xs text-center" style={{ color: "#64748b" }}>
              Votre navigateur télécharge Python la première fois (~6 Mo).
              {" "}Le Wi-Fi est conseillé.
            </span>
          </div>
        </>
      )}

      <details className="rounded-2xl" style={{ background: "#0f172a", border: "1px solid #1e293b" }}>
        <summary className="cursor-pointer list-none px-4 py-3 text-xs font-black" style={{ color: "#94a3b8" }}>
          📄 Voir le code écrit par {prenom}
        </summary>
        <pre className="px-4 pb-4 font-mono text-xs leading-relaxed overflow-x-auto"
          style={{ color: "#cbd5e1" }}>{code}</pre>
      </details>
    </div>
  );
}
