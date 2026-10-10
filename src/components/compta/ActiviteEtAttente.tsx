import type { Activite, EnAttente } from "@/lib/compta/treasury";

/**
 * Deux questions que la trésorerie seule ne sait pas trancher.
 *
 * « Est-ce que mon activité rapporte ? » — la caisse ne le dit pas : un mois
 * où quinze séances ont été assurées peut n'avoir rien encaissé parce que les
 * parents règlent en retard. L'activité se compte au jour de la séance.
 *
 * « Qui me doit quoi ? » — c'est ce couple de chiffres qui absorbe le décalage
 * de facturation. Une séance du 20 septembre réglée le 5 octobre est une
 * créance, puis un encaissement d'octobre. Jamais les deux, jamais aucun.
 */

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} F`;
const s = (n: number) => (n > 1 ? "s" : "");

function Chiffre({ titre, valeur, detail, couleur, bordure }: {
  titre: string; valeur: string; detail: string; couleur: string; bordure: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
      style={{ borderTop: `3px solid ${bordure}` }}>
      <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">{titre}</div>
      <div className="text-3xl font-black tabular-nums" style={{ color: couleur }}>{valeur}</div>
      <div className="text-xs text-gray-400 mt-1 font-semibold">{detail}</div>
    </div>
  );
}

export default function ActiviteEtAttente({ activite, enAttente }: {
  activite: Activite;
  enAttente: EnAttente;
}) {
  const rentable = activite.marge >= 0;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-black text-ink">L&apos;activité de la période</h2>
        <p className="text-xs text-ink-muted mt-0.5">
          Ce que les séances assurées ont produit et coûté — peu importe quand l&apos;argent arrive.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Chiffre
          titre="Séances assurées"
          valeur={`${activite.seances}`}
          detail={activite.seances === 0 ? "Aucune séance tenue sur la période" : `${fmt(activite.produits)} facturés aux parents`}
          couleur="#1B2D5E" bordure="#1B2D5E"
        />
        <Chiffre
          titre="Coût mentors"
          valeur={fmt(activite.charges)}
          detail={activite.seances > 0 ? `soit ${fmt(Math.round(activite.charges / activite.seances))} par séance` : "—"}
          couleur="#ef4444" bordure="#ef4444"
        />
        <Chiffre
          titre="Marge"
          valeur={`${rentable ? "+" : ""}${fmt(activite.marge)}`}
          detail={activite.seances > 0 ? `soit ${fmt(Math.round(activite.marge / activite.seances))} par séance` : "—"}
          couleur={rentable ? "#059669" : "#ef4444"}
          bordure={rentable ? "#10B981" : "#ef4444"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: "#b45309" }}>
            Ce qu&apos;on me doit
          </div>
          <div className="text-2xl font-black tabular-nums" style={{ color: "#b45309" }}>
            {fmt(enAttente.parentsMontant)}
          </div>
          <div className="text-xs mt-1 font-semibold" style={{ color: "#92400e" }}>
            {enAttente.parentsSeances === 0
              ? "Tout est réglé par les parents."
              : `${enAttente.parentsSeances} séance${s(enAttente.parentsSeances)} assurée${s(enAttente.parentsSeances)}, pas encore payée${s(enAttente.parentsSeances)}`}
          </div>
        </div>

        <div className="rounded-2xl p-5" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
          <div className="text-[11px] font-black uppercase tracking-widest mb-1" style={{ color: "#b91c1c" }}>
            Ce que je dois
          </div>
          <div className="text-2xl font-black tabular-nums" style={{ color: "#b91c1c" }}>
            {fmt(enAttente.mentorsMontant)}
          </div>
          <div className="text-xs mt-1 font-semibold" style={{ color: "#991b1b" }}>
            {enAttente.mentorsSeances === 0
              ? "Tous les mentors sont à jour."
              : `${enAttente.mentorsSeances} séance${s(enAttente.mentorsSeances)} assurée${s(enAttente.mentorsSeances)}, pas encore réglée${s(enAttente.mentorsSeances)} aux mentors`}
          </div>
        </div>
      </div>

      {/* Une séance sans ligne de paiement n'est pas une créance : personne ne
          doit rien, et elle n'apparaît nulle part. C'est l'oubli le plus cher
          de toute cette page. */}
      {(enAttente.nonFacturees > 0 || enAttente.nonProvisionnees > 0) && (
        <div className="rounded-2xl p-5" style={{ background: "#fff1f2", border: "1px solid #fda4af" }}>
          <div className="text-sm font-black" style={{ color: "#9f1239" }}>
            ⚠ Des séances assurées ne sont facturées à personne
          </div>
          <ul className="mt-2 space-y-1 text-xs font-semibold" style={{ color: "#881337" }}>
            {enAttente.nonFacturees > 0 && (
              <li>
                <strong>{enAttente.nonFacturees} séance{s(enAttente.nonFacturees)}</strong> tenue{s(enAttente.nonFacturees)}
                {" "}sans aucune ligne de paiement parent — ni payée, ni due, ni comptée.
              </li>
            )}
            {enAttente.nonProvisionnees > 0 && (
              <li>
                <strong>{enAttente.nonProvisionnees} séance{s(enAttente.nonProvisionnees)}</strong> tenue{s(enAttente.nonProvisionnees)}
                {" "}sans ligne de paiement mentor — le mentor ne sera pas réglé.
              </li>
            )}
          </ul>
          <p className="text-[11px] mt-2" style={{ color: "#9f1239" }}>
            Une séance offerte compte aussi : créez-lui une ligne à 0 F, sinon elle disparaît des comptes.
          </p>
        </div>
      )}

      <p className="text-[11px] text-ink-muted">
        Les montants dus ne dépendent d&apos;aucune période : une séance due reste due,
        qu&apos;elle date de ce mois-ci ou de trois mois en arrière.
      </p>
    </div>
  );
}
