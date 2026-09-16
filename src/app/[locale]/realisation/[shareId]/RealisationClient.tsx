"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import AvatarSvg from "@/components/eleve/AvatarSvg";
import { programmeLisible } from "@/lib/questions/programme";

const BlocklyRobot = dynamic(() => import("@/components/eleve/BlocklyRobotLoader"), { ssr: false });

/**
 * Ce que le parent voit.
 *
 * L'ordre compte : d'abord le plan que son enfant a ÉCRIT, en français, parce
 * que c'est ce qui prouve la réflexion ; ensuite le programme que c'est devenu ;
 * le dessin en dernier, qu'il peut relancer lui-même.
 *
 * `programmeLisible` s'appuie sur DOMParser — d'où ce composant client.
 */

type Props = {
  realisation: {
    first_name: string;
    avatar: { base?: string; hat?: string | null; accessory?: string | null; color?: string; accent?: string | null } | null;
    plan: string[];
    program_xml: string | null;
    maze: Record<string, unknown> | null;
    created_at: string;
  };
  /** Déjà formatée côté serveur, fuseau fixé : voir le commentaire dans page.tsx. */
  dateTexte: string;
};

export default function RealisationClient({ realisation, dateTexte }: Props) {
  const { first_name: prenom, avatar, plan, program_xml, maze } = realisation;

  /**
   * `programmeLisible` s'appuie sur DOMParser, qui n'existe pas sur le serveur :
   * il y rend `null`, et une chaîne dans le navigateur. La section du programme
   * était donc absente du rendu serveur et présente du rendu client — c'est
   * l'échec d'hydratation. Blockly a le même problème, pour la même raison.
   *
   * Les deux n'apparaissent donc qu'après l'hydratation, comme les ateliers de
   * la page de leçon.
   */
  const [hydrate, setHydrate] = useState(false);
  useEffect(() => { setHydrate(true); }, []);

  const programme = hydrate ? programmeLisible(program_xml) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-white px-4 py-10">
      <div className="mx-auto w-full max-w-2xl space-y-8">

        <header className="text-center space-y-3">
          <div className="flex justify-center">
            <AvatarSvg
              base={avatar?.base}
              hat={avatar?.hat}
              accessory={avatar?.accessory}
              color={avatar?.color}
              accent={avatar?.accent}
              size={96}
            />
          </div>
          <h1 className="text-2xl font-black">{prenom} a programmé ça</h1>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Séance terminée le {dateTexte} — thème « Je guide un robot dans un labyrinthe »
          </p>
        </header>

        <section className="rounded-2xl p-5 space-y-3" style={{ background: "#1e293b", border: "1px solid #334155" }}>
          <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "#FDB813" }}>
            {/* Pas d'élision : « qu'Ryshawn » était faux, et aucune règle en dur
                ne marche pour tous les prénoms. On tourne la phrase autrement. */}
            Le plan écrit par {prenom} avant de coder
          </h2>
          <ol className="space-y-2">
            {plan.map((phase, i) => (
              <li key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl"
                style={{ background: "#0f172a", border: "1px solid #FDB81333" }}>
                <span className="text-xs font-black shrink-0 mt-0.5" style={{ color: "#FDB813" }}>Phase {i + 1}</span>
                <span className="text-sm font-bold" style={{ color: "#e2e8f0" }}>{phase}</span>
              </li>
            ))}
          </ol>
          <p className="text-xs italic" style={{ color: "#64748b" }}>
            Écrire son plan en français avant de toucher au code, c&apos;est ce que font les ingénieurs
            logiciels chaque jour. On appelle ça le pseudocode.
          </p>
        </section>

        {programme && (
          <section className="rounded-2xl p-5 space-y-3" style={{ background: "#1e293b", border: "1px solid #334155" }}>
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "#a78bfa" }}>
              Le programme que c&apos;est devenu
            </h2>
            <pre className="text-sm font-mono whitespace-pre-wrap rounded-xl px-4 py-3 overflow-x-auto"
              style={{ background: "#0f172a", border: "1px solid #334155", color: "#6ee7b7" }}>
              {programme}
            </pre>
          </section>
        )}

        {maze && (
          <section className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest" style={{ color: "#10b981" }}>
              Le dessin que son code a tracé — appuyez sur ▶ Lancer
            </h2>
            {hydrate ? (
              <BlocklyRobot
                config={maze as never}
                savedXml={program_xml ?? undefined}
                onSolved={() => {}}
              />
            ) : (
              <div className="rounded-2xl flex items-center justify-center"
                style={{ height: 400, background: "#0f172a", border: "1px solid #334155" }}>
                <span className="text-sm font-bold" style={{ color: "#64748b" }}>🔧 Chargement du dessin…</span>
              </div>
            )}
          </section>
        )}

        <footer className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: "linear-gradient(135deg,#1c1917,#0f172a)", border: "1px solid #d97706" }}>
          <div className="text-2xl">🏗️</div>
          <p className="font-black">{prenom} n&apos;a pas joué à un jeu : {prenom} a écrit un programme.</p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            Planifier, découper un problème, repérer ce qui se répète — ce sont les gestes du métier.
          </p>
        </footer>

      </div>
    </div>
  );
}
