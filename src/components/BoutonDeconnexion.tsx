import { logout } from "@/app/[locale]/auth/actions";

/**
 * « Se déconnecter » : le même bouton dans tous les espaces, en haut, à côté
 * du logo. À cette place se trouvait « Exit », en anglais et en gris à moitié
 * effacé : on ne le voyait pas. Le parent, lui, avait « Déconnexion » tout en
 * bas de sa barre, ou une icône seule sur téléphone.
 *
 * Le clic ferme la session et ramène à la page de connexion, qui le confirme.
 * Tous les espaces ont un fond sombre : un seul style suffit, texte blanc et
 * contour net, qui rougit au survol parce qu'on s'en va.
 *
 * Sans état : il sert la barre du personnel (composant client) comme celles
 * de l'élève et du parent (rendues par le serveur).
 */
export default function BoutonDeconnexion() {
  return (
    <form action={logout} className="shrink-0">
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/50 px-2 py-1.5 text-xs font-black text-white transition-colors hover:border-red-300 hover:bg-red-500/20 hover:text-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <span aria-hidden="true">⏻</span>
        Se déconnecter
      </button>
    </form>
  );
}
