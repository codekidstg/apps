import Link from "next/link";
import type { ApercuSeance, EnfantApercu, ExerciceSeance } from "@/lib/backoffice/apercu-seance";

/**
 * « Voir comme un enfant », et les exercices de la séance.
 *
 * Le bouton « Aperçu élève » montre le contenu tel qu'il est, tout ouvert.
 * Utile pour relire, insuffisant pour vérifier : un enfant ne voit pas que du
 * contenu, il voit ses verrous. « Voir comme Samuel » ajoute cette vérité-là.
 *
 * Et la page ne montrait que les blocs de la leçon. Ses exercices — ceux du
 * parcours et ceux de la salle de jeu — n'étaient visibles nulle part : c'est
 * pourtant là que l'enfant passe le plus de temps.
 */

const ETAT_LIBELLE = {
  terminee:  { texte: "séance terminée", couleur: "#047857", fond: "#d1fae5" },
  commencee: { texte: "en cours",        couleur: "#b45309", fond: "#fef3c7" },
  rien:      { texte: "pas commencée",   couleur: "#64748b", fond: "#f1f5f9" },
} as const;

const PALIERS = ["", "① Je m'échauffe", "② Je m'entraîne", "③ Je me dépasse"];

function dateCourte(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });
}

function Exercice({ e, locale }: { e: ExerciceSeance; locale: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-t border-cream-border first:border-t-0">
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm text-ink">{e.titre}</div>
        {e.description && <div className="text-xs text-ink-muted mt-0.5">{e.description}</div>}
        <div className="text-[11px] text-ink-muted mt-1 font-mono">{e.moteurs.join(" · ") || "—"}</div>
      </div>
      <div className="text-right shrink-0">
        {/* Ce qui dit si un exercice sert : combien l'ont essayé, combien ont
            réussi seuls. Un exercice que personne ne réussit sans indice est un
            exercice trop dur, ou mal écrit. */}
        <div className="text-[11px] text-ink-muted whitespace-nowrap">
          {e.essayePar > 0 ? `${e.essayePar} enfant${e.essayePar > 1 ? "s" : ""}` : "jamais joué"}
          {e.sansIndice > 0 && <span className="text-emerald-600"> · {e.sansIndice} ★</span>}
        </div>
      </div>
      <a href={`/${locale}/eleve/entrainement/${e.id}`} target="_blank" rel="noopener noreferrer"
        className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-ink transition-colors">
        Tester
      </a>
    </div>
  );
}

export default function SeanceApercu({
  apercu, lessonId, locale, eleveChoisi, hrefBase,
}: {
  apercu: ApercuSeance;
  lessonId: string;
  locale: string;
  eleveChoisi?: string;
  /** L'adresse de la page courante, pour que les pastilles y reviennent. */
  hrefBase: string;
}) {
  const choisi: EnfantApercu | undefined = apercu.enfants.find((e) => e.studentId === eleveChoisi);

  return (
    <div className="space-y-4 max-w-3xl">
      {/* ── Voir comme ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-cream-border p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black uppercase tracking-wide text-ink-muted mr-1">Voir comme</span>
          {apercu.enfants.length === 0 && (
            <span className="text-sm text-ink-muted italic">aucun enfant n&apos;a accès à ce thème</span>
          )}
          {apercu.enfants.map((e) => {
            const meta = ETAT_LIBELLE[e.etat];
            const actif = e.studentId === eleveChoisi;
            return (
              <Link key={e.studentId} href={actif ? hrefBase : `${hrefBase}?eleve=${e.studentId}`}
                className="text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors"
                style={{
                  background: actif ? "#1B2D5E" : meta.fond,
                  color: actif ? "white" : meta.couleur,
                  borderColor: actif ? "#1B2D5E" : "transparent",
                }}>
                {e.nom} <span className="font-medium opacity-80">— {meta.texte}</span>
              </Link>
            );
          })}
          {apercu.sansAcces > 0 && (
            <span className="text-[11px] text-ink-muted italic">
              · {apercu.sansAcces} enfant{apercu.sansAcces > 1 ? "s" : ""} de ce niveau n&apos;{apercu.sansAcces > 1 ? "ont" : "a"} pas accès à ce thème
            </span>
          )}
        </div>

        {choisi && (
          <div className="mt-4 rounded-xl px-4 py-3" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <p className="text-sm text-ink">
              {choisi.etat === "terminee" ? (
                <>
                  <strong>{choisi.nom}</strong> a terminé cette séance
                  {choisi.termineeLe && <> le {dateCourte(choisi.termineeLe)}</>} — sa salle de jeu est <strong>ouverte</strong>
                  {apercu.terrain.length > 0 && (
                    <> : {apercu.terrain.length} exercices, {choisi.terrainEssayes === 0
                      ? "aucun essayé pour l'instant"
                      : `${choisi.terrainEssayes} essayé${choisi.terrainEssayes > 1 ? "s" : ""}`}
                      {choisi.terrainSansIndice > 0 && <>, dont {choisi.terrainSansIndice} sans indice</>}</>
                  )}.
                </>
              ) : choisi.etat === "commencee" ? (
                <><strong>{choisi.nom}</strong> a commencé cette séance sans la terminer — sa salle de jeu est <strong>fermée</strong> : il ne verrait aucun de ces exercices.</>
              ) : (
                <><strong>{choisi.nom}</strong> n&apos;a pas commencé cette séance — sa salle de jeu est <strong>fermée</strong>.</>
              )}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              <a href={`/${locale}/eleve/quete/${lessonId}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white transition-colors">
                👁 Ouvrir la séance
              </a>
              <a href={`/${locale}/eleve/salle-de-jeu?eleve=${choisi.studentId}`} target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-100 hover:bg-violet-200 text-violet-800 transition-colors">
                🏟️ Voir sa salle de jeu
              </a>
            </div>
          </div>
        )}
      </div>

      {/* ── Les exercices de la séance ─────────────────────────────────── */}
      {(apercu.parcours.length > 0 || apercu.terrain.length > 0) && (
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          <div className="px-4 py-3 border-b border-cream-border">
            <div className="font-black text-sm text-ink">Entraînements & salle de jeu</div>
            <div className="text-xs text-ink-muted mt-0.5">
              {apercu.parcours.length} du parcours · {apercu.terrain.length} en libre service.
              Chaque « Tester » ouvre le vrai exercice, sans rien enregistrer.
            </div>
          </div>

          {apercu.parcours.length > 0 && (
            <>
              <div className="px-4 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted bg-cream">Parcours</div>
              {apercu.parcours.map((e) => <Exercice key={e.id} e={e} locale={locale} />)}
            </>
          )}

          {[1, 2, 3].map((p) => {
            const lot = apercu.terrain.filter((e) => (e.palier ?? 1) === p);
            if (!lot.length) return null;
            return (
              <div key={p}>
                <div className="px-4 py-2 text-[11px] font-black uppercase tracking-wide text-ink-muted bg-cream">
                  Salle de jeu · {PALIERS[p]}
                </div>
                {lot.map((e) => <Exercice key={e.id} e={e} locale={locale} />)}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
