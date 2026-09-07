/**
 * L'en-tête d'un thème dans le suivi parent.
 *
 * Le compteur vivait auparavant sur le chapitre. Or chaque chapitre ne contient
 * qu'une leçon : la barre valait éternellement 0/1 ou 1/1, et un enfant ayant
 * fait une séance sur cinq affichait une barre verte pleine. Le parent lisait
 * « c'est terminé ». Le seul dénominateur qui informe, c'est le thème.
 */
export default function EnteteTheme({
  titre,
  faites,
  total,
}: {
  titre: string;
  faites: number;
  total: number;
}) {
  const pct = total ? Math.round((faites / total) * 100) : 0;
  return (
    <div className="mb-3">
      {/* Sur mobile le compteur passe sous le titre : selon la longueur du
          titre il sautait d'une ligne à l'autre, tantôt à droite, tantôt à
          gauche. Empilé en dessous de 640 px, aligné à droite au-delà. */}
      <div className="flex flex-col gap-0.5 mb-2 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
        <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest">📚 {titre}</h2>
        <span className="text-xs font-bold text-slate-300 whitespace-nowrap">
          {faites}/{total} séances
        </span>
      </div>
      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
