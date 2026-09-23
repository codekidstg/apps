"use client";

/**
 * La pagination des listes de personnes — élèves, parents, utilisateurs.
 *
 * Elle découpe **ce qui est déjà filtré**, jamais ce qui est chargé : la
 * recherche et les filtres de ces écrans tournent dans le navigateur, sur la
 * liste entière. Paginer côté serveur les casserait en silence — on ne
 * trouverait plus que ce qui se trouve sur la page affichée, et rien ne le
 * dirait. Le jour où ces listes dépasseront quelques centaines de lignes, il
 * faudra déplacer la recherche côté serveur, et la pagination avec elle.
 *
 * Ici, le gain est l'affichage : vingt-cinq lignes dans la page au lieu de
 * toutes, sur des machines qui ne sont pas toujours neuves.
 */

export const PAR_PAGE = 25;

export function decouper<T>(lignes: T[], page: number, parPage = PAR_PAGE): T[] {
  return lignes.slice(page * parPage, (page + 1) * parPage);
}

export default function Pages({ page, total, onPage, parPage = PAR_PAGE, quoi = "ligne" }: {
  page: number;
  /** Le nombre de lignes après filtrage. */
  total: number;
  onPage: (p: number) => void;
  parPage?: number;
  /** « élève », « parent »… pour que le compte se lise. */
  quoi?: string;
}) {
  const pages = Math.ceil(total / parPage);
  if (pages <= 1) return null;

  const premier = page * parPage + 1;
  const dernier = Math.min(total, (page + 1) * parPage);
  // Une fenêtre de cinq numéros autour de la page courante : au-delà, une
  // rangée de trente boutons ne sert plus à rien.
  const debut = Math.max(0, Math.min(page - 2, pages - 5));
  const numeros = Array.from({ length: Math.min(5, pages) }, (_, i) => debut + i);

  const bouton = "text-xs font-black px-3 py-1.5 rounded-xl border transition-colors disabled:opacity-40";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-4">
      <span className="text-xs font-bold text-ink-muted tabular-nums">
        {premier}–{dernier} sur {total} {quoi}{total > 1 ? "s" : ""}
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => onPage(page - 1)} disabled={page === 0}
          className={`${bouton} bg-white border-cream-border text-ink-muted hover:text-ink`}>
          ← Précédent
        </button>

        {debut > 0 && <span className="text-xs font-bold text-ink-muted px-1">…</span>}
        {numeros.map((n) => (
          <button key={n} type="button" onClick={() => onPage(n)}
            className={`${bouton} ${n === page
              ? "bg-[#1B2D5E] text-white border-[#1B2D5E]"
              : "bg-white border-cream-border text-ink-muted hover:text-ink"}`}>
            {n + 1}
          </button>
        ))}
        {debut + numeros.length < pages && <span className="text-xs font-bold text-ink-muted px-1">…</span>}

        <button type="button" onClick={() => onPage(page + 1)} disabled={page >= pages - 1}
          className={`${bouton} bg-white border-cream-border text-ink-muted hover:text-ink`}>
          Suivant →
        </button>
      </div>
    </div>
  );
}
