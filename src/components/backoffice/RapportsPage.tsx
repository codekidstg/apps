import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";
import { getRapportsData, AVANCEMENT, ENGAGEMENT, AIDES, NON_TENUE, type Occurrence } from "@/lib/rapports";
import { PERIODES, PERIODE_DEFAUT, debutPeriode, libellePeriode } from "@/lib/planning/occurrences-passees";

/**
 * Écran « Rapports de séance », en lecture seule.
 *
 * Servi tel quel à l'admin et au manager — un seul chargement, un seul rendu.
 * Seul le mentor qui a fait la séance rédige : rien ici ne modifie un rapport.
 *
 * Il répond aux deux questions à la fois : ce qui a été écrit, et ce qui
 * manque. Les séances passées sans compte rendu apparaissent dans la même
 * liste, à leur date — c'est là qu'on les remarque.
 */
function dateLongue(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    weekday: "short", day: "numeric", month: "short", year: "numeric",
  });
}
function heure(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function Ligne({ o }: { o: Occurrence }) {
  const r = o.rapport;
  const av = r?.advancement ? AVANCEMENT[r.advancement] : null;
  const en = r?.engagement  ? ENGAGEMENT[r.engagement]  : null;
  const aides = (r?.help_methods ?? []).map(k => AIDES[k] ?? k);

  const nonTenue = r && r.tenue === false ? NON_TENUE[r.raison_non_tenue ?? ""] ?? null : null;

  return (
    <div className={`px-5 sm:px-6 py-4 ${!r ? "bg-amber-50/60" : r.tenue === false ? "bg-slate-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <div className="font-black text-ink text-sm">{o.titre}</div>
          <div className="text-xs text-ink-muted mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>{dateLongue(o.quand)} · {heure(o.quand)}</span>
            <span>· 👩‍🏫 {o.mentor}</span>
            {o.eleve && <span>· 🎓 {o.eleve}</span>}
          </div>
        </div>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
          !r ? "bg-amber-200 text-amber-900" : r.tenue === false ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"
        }`}>
          {!r ? "⏳ Compte rendu manquant" : r.tenue === false ? "🚫 Séance non tenue" : "✓ Compte rendu fait"}
        </span>
      </div>

      {nonTenue && (
        <div className="mt-3 space-y-2.5">
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700">
            {nonTenue.icon} {nonTenue.label}
          </span>
          {r?.difficulty_notes && (
            <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{r.difficulty_notes}</p>
          )}
        </div>
      )}

      {r && r.tenue !== false && (
        <div className="mt-3 space-y-2.5">
          {/* Ce qui a été travaillé : la première chose qu'on veut savoir, et
              la seule que le compte rendu ne disait pas. */}
          {r.lecon?.title && (
            <div className="text-sm font-bold" style={{ color: "#1B2D5E" }}>
              📘 {r.lecon.title}{r.lecon_2?.title ? ` puis ${r.lecon_2.title}` : ""}
              {r.lecon_finie && <span className="ml-2 text-xs font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">terminée ensemble</span>}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {av && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg"
                style={{ background: `${av.color}18`, color: av.color }}>
                {av.icon} {av.label}
              </span>
            )}
            {en && (
              <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600">
                {en.icon} {en.label}
              </span>
            )}
          </div>

          {aides.length > 0 && (
            <div className="text-xs text-ink-muted">
              <span className="font-bold text-ink-light">Aide apportée :</span> {aides.join(" · ")}
            </div>
          )}

          {/* Le texte libre : c'est ce qu'on vient lire, et c'est justement ce
              qu'aucun écran n'affichait jusqu'ici. */}
          {r.difficulty_notes && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Difficultés rencontrées</div>
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{r.difficulty_notes}</p>
            </div>
          )}
          {r.next_session_note && (
            <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
              <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Pour la prochaine séance</div>
              <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{r.next_session_note}</p>
            </div>
          )}
          {!r.difficulty_notes && !r.next_session_note && (
            <p className="text-xs text-gray-400 italic">Aucune note écrite — seules les cases ont été cochées.</p>
          )}
        </div>
      )}
    </div>
  );
}

/** Combien de séances s'affichent d'un coup, et de combien « Voir plus » avance. */
const LOT = 15;

export default async function RapportsPage({ espace, periode, voir }: {
  espace: "admin" | "manager";
  periode?: string;
  voir?: string;
}) {
  // Deux bornes, deux métiers : la période décide de ce qu'on déroule — donc
  // du travail fait —, le lot décide de ce qu'on affiche. Sans la première,
  // chaque ouverture recalculait toutes les semaines depuis la création de
  // chaque séance ; sans la seconde, la page rendait tout d'un bloc.
  const choisie = PERIODES.some((p) => p.cle === periode) ? periode! : PERIODE_DEFAUT;
  const depuis = debutPeriode(choisie) ?? undefined;
  const { occurrences, faits, manquants, nonTenues } = await getRapportsData({ depuis });

  const montrees = Math.max(LOT, Number(voir) || LOT);
  const visibles = occurrences.slice(0, montrees);
  const reste = occurrences.length - visibles.length;
  const base = `/${espace}/rapports`;
  const lien = (p: Record<string, string | number>) =>
    `${base}?${new URLSearchParams({ periode: choisie, ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, String(v)])) })}`;

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Rapports de séance"
        subtitle={`Ce que les mentors ont écrit après chaque séance — et ce qui manque. ${libellePeriode(choisie)}.`}
      />

      <div className="flex flex-wrap gap-2">
        {PERIODES.map((p) => (
          <Link key={p.cle} href={lien({ periode: p.cle })}
            className={`text-xs font-black px-3 py-1.5 rounded-xl border transition-colors ${
              p.cle === choisie ? "bg-[#1B2D5E] text-white border-[#1B2D5E]" : "bg-white text-ink-muted border-cream-border hover:text-ink"}`}>
            {p.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className="text-2xl font-black text-emerald-600">{faits}</div>
          <div className="text-xs font-bold text-gray-400 mt-1">Comptes rendus faits</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className={`text-2xl font-black ${manquants > 0 ? "text-amber-600" : "text-gray-300"}`}>{manquants}</div>
          <div className="text-xs font-bold text-gray-400 mt-1">Manquants</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className={`text-2xl font-black ${nonTenues > 0 ? "text-slate-600" : "text-gray-300"}`}>{nonTenues}</div>
          <div className="text-xs font-bold text-gray-400 mt-1">Séances non tenues</div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
        {occurrences.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-3xl mb-2">📝</div>
            <p className="font-bold text-gray-500 text-sm">Aucune séance passée pour le moment.</p>
            <p className="text-xs text-gray-400 mt-1">Les comptes rendus apparaîtront ici après la première séance.</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-border">
            {visibles.map(o => <Ligne key={o.cle} o={o} />)}
          </div>
        )}
      </div>

      {reste > 0 && (
        <div className="text-center">
          <Link href={lien({ voir: montrees + LOT })}
            className="inline-block text-sm font-black px-5 py-2.5 rounded-xl border border-cream-border bg-white hover:border-brand-orange transition-colors"
            style={{ color: "#1B2D5E" }}>
            Voir plus — {reste} séance{reste > 1 ? "s" : ""} encore
          </Link>
        </div>
      )}

      <p className="text-xs text-gray-400 px-1">
        Lecture seule — le compte rendu est rédigé par le mentor qui a fait la séance.
        Les compteurs ci-dessus portent sur la période choisie.
      </p>
    </div>
  );
}
