/**
 * Ce que l'enfant voit pendant que la page se prépare.
 *
 * Il n'y en avait aucun dans tout l'espace élève : en cliquant, l'enfant
 * restait sur la page précédente, sans rien, jusqu'à ce que le serveur ait
 * fini ses allers-retours. Depuis le Togo, ça fait une plateforme qui a l'air
 * morte — alors qu'elle travaille.
 *
 * Le cadre apparaît tout de suite, le contenu se pose dedans.
 */
export default function Chargement() {
  return (
    <div className="p-6 lg:p-10 max-w-5xl animate-pulse" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-52 rounded-lg" style={{ background: "#1e293b" }} />
      <div className="h-4 w-80 max-w-full rounded-lg mt-3" style={{ background: "#172033" }} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-2xl h-32"
            style={{ background: "#141f33", border: "1px solid #1e293b" }} />
        ))}
      </div>
    </div>
  );
}
