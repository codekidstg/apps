import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import { chargerSuiviMentors, moisDisponibles, lireMois, libelleMois, type MentorMois } from "@/lib/backoffice/suivi-mentors";
import { chargerBilansDuMois, type Bilan } from "@/lib/backoffice/bilans";
import { couleurNote, SEUIL, type NoteMentor } from "@/lib/backoffice/note-mentor";
import RegleNote from "@/components/backoffice/RegleNote";

/**
 * Écran « Suivi des mentors » — la liste, servie telle quelle à l'admin et au
 * manager. Un mois, tous les mentors, une note chacun.
 *
 * La liste ne juge pas : elle dit où regarder. Le détail est sur la fiche, et
 * c'est là que le point de fin de mois s'écrit.
 */

export function ChoixMois({ base, actif }: { base: string; actif: string }) {
  return (
    <div className="flex flex-wrap gap-2">
      {moisDisponibles().map((m) => (
        <Link
          key={m.cle}
          href={m.cle === actif ? base : `${base}?mois=${m.cle}`}
          className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-colors ${
            m.cle === actif
              ? "bg-[#1B2D5E] text-white border-[#1B2D5E]"
              : "bg-white text-ink-muted border-cream-border hover:text-ink"
          }`}
        >
          {m.label}
        </Link>
      ))}
    </div>
  );
}

/** La note, en gros, avec sa pastille — ou la raison de son absence. */
export function Pastille({ note, taille = "normale" }: { note: NoteMentor; taille?: "normale" | "grande" }) {
  const c = couleurNote(note.note);
  const grande = taille === "grande";
  return (
    <div className={`rounded-2xl border px-4 py-3 text-center shrink-0 ${c.classes}`} style={{ minWidth: grande ? 140 : 104 }}>
      {note.note === null ? (
        <>
          <div className={`font-black leading-none ${grande ? "text-3xl" : "text-xl"}`}>—</div>
          <div className="text-[10px] font-bold mt-1.5 leading-tight">pas de note</div>
        </>
      ) : (
        <>
          <div className={`font-black leading-none ${grande ? "text-4xl" : "text-2xl"}`}>
            {c.pastille} {note.note}
          </div>
          <div className="text-[10px] font-bold mt-1.5 leading-tight">sur 100 · minimum {SEUIL}</div>
        </>
      )}
    </div>
  );
}

function Carte({ m, lien, bilan }: { m: MentorMois; lien: string; bilan: Bilan | undefined }) {
  const sansRapport = m.seances.filter((s) => !s.rapport).length;
  const enAttente = m.questions.filter((q) => !q.traiteeLe).length;
  const enDifficulte = m.eleves.filter((e) => e.statut === "bloque" || e.statut === "ralentit").length;

  return (
    <Link href={lien} className="block bg-white rounded-2xl border border-cream-border p-5 hover:border-brand-orange transition-colors">
      <div className="flex items-start gap-4">
        <Pastille note={m.note} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-ink">{m.nom}</span>
            {bilan ? (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                ✓ Point fait{bilan.ajustement !== 0 ? ` · ${bilan.ajustement > 0 ? "+" : "−"}${Math.abs(bilan.ajustement)} → ${bilan.noteRetenue}` : ""}
              </span>
            ) : (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">Pas encore de point</span>
            )}
          </div>

          <div className="mt-1.5 text-xs font-bold text-ink-muted flex flex-wrap gap-x-3 gap-y-1">
            <span>{m.note.seances.comptees} séance{m.note.seances.comptees > 1 ? "s" : ""}</span>
            {m.note.seances.nonTenues.length > 0 && <span>· {m.note.seances.nonTenues.length} non tenue{m.note.seances.nonTenues.length > 1 ? "s" : ""}</span>}
            <span>· {m.eleves.length} élève{m.eleves.length > 1 ? "s" : ""}</span>
            {sansRapport > 0 && <span className="text-amber-700">· {sansRapport} sans compte rendu</span>}
            {enAttente > 0 && <span className="text-amber-700">· {enAttente} question{enAttente > 1 ? "s" : ""} sans réponse</span>}
            {enDifficulte > 0 && <span>· {enDifficulte} élève{enDifficulte > 1 ? "s" : ""} en difficulté</span>}
          </div>

          {m.note.note === null ? (
            <p className="mt-2 text-xs font-bold text-ink-muted">{m.note.sansNote}</p>
          ) : m.note.pertes.length === 0 ? (
            <p className="mt-2 text-xs font-bold text-emerald-700">Rien à reprendre ce mois-ci.</p>
          ) : (
            <p className="mt-2 text-xs font-bold text-ink-muted truncate">
              Le plus cher : {m.note.pertes[0].quoi} — {m.note.pertes[0].manques[0]}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default async function SuiviMentors({ espace, mois }: { espace: "admin" | "manager"; mois?: string }) {
  const cle = lireMois(mois);
  const base = `/${espace}/mentors`;
  const [{ mentors, erreur }, bilans] = await Promise.all([
    chargerSuiviMentors({ mois: cle }),
    chargerBilansDuMois(cle),
  ]);

  // Les notes les plus basses d'abord : c'est par là qu'on commence le point.
  // Les mentors sans note passent après, ils n'ont rien à comparer.
  const ordonnes = [...mentors].sort((a, b) =>
    (a.note.note ?? 1000) - (b.note.note ?? 1000) || a.nom.localeCompare(b.nom));
  const aFaire = mentors.filter((m) => !bilans.has(m.id)).length;

  return (
    <div>
      <PageHeader
        title="Suivi des mentors"
        subtitle={`${libelleMois(cle)} — la note du mois, ce qui l'explique, et le point de fin de mois. Minimum attendu : ${SEUIL} sur 100.`}
      />
      <div className="p-8 space-y-6 max-w-4xl">
        {erreur && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Le suivi n&apos;a pas pu être chargé : {erreur}
          </div>
        )}

        <ChoixMois base={base} actif={cle} />

        {/* Un constat, pas une injonction : le point de fin de mois se tient
            quand il a lieu d'être, et un mois peut se passer. */}
        {aFaire > 0 && (
          <div className="rounded-2xl border border-cream-border bg-white px-5 py-4 text-sm font-bold text-ink-muted">
            {aFaire} mentor{aFaire > 1 ? "s n'ont" : " n'a"} pas encore eu {aFaire > 1 ? "leur" : "son"} point pour {libelleMois(cle)}.
          </div>
        )}

        {ordonnes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-border px-6 py-10 text-center text-sm font-bold text-ink-muted">
            Aucun mentor enregistré.
          </div>
        ) : (
          <div className="space-y-3">
            {ordonnes.map((m) => (
              <Carte key={m.id} m={m} lien={`${base}/${m.id}?mois=${cle}`} bilan={bilans.get(m.id)} />
            ))}
          </div>
        )}

        <RegleNote />
      </div>
    </div>
  );
}
