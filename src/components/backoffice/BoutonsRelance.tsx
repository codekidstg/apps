"use client";

import { useState } from "react";

/**
 * Les deux boutons de relance d'un parent.
 *
 * Deux, et pas un : le message qui rend fier est fait pour être transféré — à
 * l'autre parent, à la tante, au groupe familial de l'école. Un identifiant et
 * un mot de passe n'ont rien à faire dans un message conçu pour circuler.
 *
 * On les colle l'un après l'autre dans la même conversation. Le parent reçoit
 * les deux, et ne transfère que le premier.
 */

type Relance = { fier: string; acces: string };

function Bouton({ texte, libelle, libelleFait, ton }: {
  texte: string;
  libelle: string;
  libelleFait: string;
  ton: "plein" | "discret";
}) {
  const [fait, setFait] = useState(false);
  const [echec, setEchec] = useState(false);

  async function copier() {
    try {
      await navigator.clipboard.writeText(texte);
      setFait(true);
      setEchec(false);
      setTimeout(() => setFait(false), 2500);
    } catch {
      // Presse-papiers refusé (connexion non sécurisée, permission) : on
      // sélectionne le texte pour qu'il reste copiable à la main.
      setEchec(true);
    }
  }

  const style = ton === "plein"
    ? { background: "#047857", color: "white", border: "1px solid #047857" }
    : { background: "white", color: "#475569", border: "1px solid #e2e8f0" };

  return (
    <button type="button" onClick={copier}
      className="text-xs font-black px-3 py-1.5 rounded-xl transition-colors hover:opacity-90"
      style={style}>
      {echec ? "Copie refusée — sélectionnez le texte" : fait ? `✓ ${libelleFait}` : libelle}
    </button>
  );
}

export default function BoutonsRelance({ relance }: { relance: Relance }) {
  const [apercu, setApercu] = useState(false);

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Bouton ton="plein" texte={relance.fier}
        libelle="📋 Copier le message" libelleFait="Message copié" />
      <Bouton ton="discret" texte={relance.acces}
        libelle="🔑 Copier les accès" libelleFait="Accès copiés" />

      <button type="button" onClick={() => setApercu((a) => !a)}
        className="text-xs font-bold text-gray-400 hover:text-gray-600 transition-colors">
        {apercu ? "Masquer" : "Relire avant d'envoyer"}
      </button>

      {apercu && (
        <div className="w-full mt-2 space-y-2">
          <pre className="whitespace-pre-wrap text-xs rounded-xl p-3 font-sans"
            style={{ background: "#f8fafc", border: "1px solid #e2e8f0", color: "#334155" }}>
            {relance.fier}
          </pre>
          <pre className="whitespace-pre-wrap text-xs rounded-xl p-3 font-mono"
            style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#9a3412" }}>
            {relance.acces}
          </pre>
          <p className="text-[11px] text-gray-400">
            Le second message ne se transfère pas : envoyez-le juste après le premier.
          </p>
        </div>
      )}
    </div>
  );
}
