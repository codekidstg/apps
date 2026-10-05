"use client";

import { useState } from "react";

/**
 * Une infobulle qui s'ouvre aussi au doigt.
 *
 * Le survol n'existe pas sur une tablette, et la direction comme les mentors
 * travaillent dessus. Elle s'ouvre donc au survol *et* au clic, et ce qu'elle
 * contient est toujours disponible ailleurs dans la page : on ne cache jamais
 * une information derrière un survol, on la rapproche.
 */
export default function Infobulle({ children, contenu, libelle }: {
  children: React.ReactNode;
  contenu: React.ReactNode;
  /** Ce que lit une personne qui n'utilise ni souris ni écran. */
  libelle: string;
}) {
  const [ouvert, setOuvert] = useState(false);

  return (
    <span className="relative inline-block group">
      <button
        type="button"
        aria-label={libelle}
        aria-expanded={ouvert}
        onClick={(e) => { e.preventDefault(); setOuvert((o) => !o); }}
        onBlur={() => setOuvert(false)}
        className="text-left cursor-help"
      >
        {children}
      </button>

      <span
        role="tooltip"
        className={`absolute left-0 top-full z-30 mt-1.5 w-64 rounded-xl px-3.5 py-3 text-left shadow-xl transition-opacity
          ${ouvert ? "opacity-100" : "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto"}`}
        style={{ background: "#1e293b", border: "1px solid #334155" }}
      >
        {contenu}
      </span>
    </span>
  );
}
