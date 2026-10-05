"use client";

import { useEffect, useState } from "react";

/**
 * Un bloc qu'on replie, et qui se souvient.
 *
 * La fiche d'un élève empile le fil de ses passages, son évolution et ses
 * renseignements : il faut faire défiler longtemps pour atteindre le bas. Le
 * repli règle ça — à condition de ne pas recommencer à chaque visite, sinon
 * c'est un clic de plus à chaque fois au lieu d'un défilement.
 *
 * Le choix reste dans le navigateur de la personne : la direction et un
 * manager ne regardent pas une fiche pour les mêmes raisons.
 */
export default function BlocPliable({ cle, titre, resume, defautOuvert = false, children }: {
  /** De quoi se souvenir, d'une visite à l'autre. */
  cle: string;
  titre: string;
  /** Ce qu'on lit sans déplier — l'essentiel doit rester visible plié. */
  resume?: React.ReactNode;
  defautOuvert?: boolean;
  children: React.ReactNode;
}) {
  const [ouvert, setOuvert] = useState(defautOuvert);

  // Relu après le premier rendu : le serveur ne connaît pas le navigateur, et
  // un état lu trop tôt ferait clignoter le bloc.
  useEffect(() => {
    try {
      const v = localStorage.getItem(`bloc.${cle}`);
      if (v === "ouvert" || v === "plie") setOuvert(v === "ouvert");
    } catch { /* navigation privée */ }
  }, [cle]);

  function basculer() {
    setOuvert((o) => {
      try { localStorage.setItem(`bloc.${cle}`, o ? "plie" : "ouvert"); } catch { /* ignore */ }
      return !o;
    });
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={basculer}
        aria-expanded={ouvert}
        className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="text-xs font-black text-gray-400 w-4 shrink-0" aria-hidden="true">
          {ouvert ? "▾" : "▸"}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block font-display font-black text-ink">{titre}</span>
          {!ouvert && resume && (
            <span className="block text-xs text-ink-muted mt-0.5 truncate">{resume}</span>
          )}
        </span>
      </button>
      {ouvert && <div className="px-6 pb-6 -mt-1">{children}</div>}
    </div>
  );
}
