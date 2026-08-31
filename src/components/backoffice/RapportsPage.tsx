import PageHeader from "@/components/backoffice/PageHeader";
import { getRapportsData, AVANCEMENT, ENGAGEMENT, AIDES, type Occurrence } from "@/lib/rapports";

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

  return (
    <div className={`px-5 sm:px-6 py-4 ${r ? "" : "bg-amber-50/60"}`}>
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
          r ? "bg-emerald-100 text-emerald-700" : "bg-amber-200 text-amber-900"
        }`}>
          {r ? "✓ Compte rendu fait" : "⏳ Compte rendu manquant"}
        </span>
      </div>

      {r && (
        <div className="mt-3 space-y-2.5">
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

export default async function RapportsPage() {
  const { occurrences, faits, manquants } = await getRapportsData();

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader
        title="Rapports de séance"
        subtitle="Ce que les mentors ont écrit après chaque séance — et ce qui manque"
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className="text-2xl font-black text-emerald-600">{faits}</div>
          <div className="text-xs font-bold text-gray-400 mt-1">Comptes rendus faits</div>
        </div>
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className={`text-2xl font-black ${manquants > 0 ? "text-amber-600" : "text-gray-300"}`}>{manquants}</div>
          <div className="text-xs font-bold text-gray-400 mt-1">Manquants</div>
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
            {occurrences.map(o => <Ligne key={o.cle} o={o} />)}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-400 px-1">
        Lecture seule — le compte rendu est rédigé par le mentor qui a fait la séance.
      </p>
    </div>
  );
}
