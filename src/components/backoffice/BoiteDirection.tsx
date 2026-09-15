import PageHeader from "@/components/backoffice/PageHeader";
import { createClient } from "@/lib/supabase/server";
import { chargerBoiteDirection, DELAI_PROMIS_HEURES, type MessageDirection } from "@/lib/contact/boite";
import CarteMessage, { type LibellesMessage } from "./CarteMessage";

/**
 * Écran « Messages des parents », servi tel quel à l'admin et au manager.
 *
 * Il répond à une seule question : qui attend une réponse, et depuis quand.
 * Les messages au-delà des 48 h promises passent en tête.
 */

const FUSEAU = "Africa/Lome";

function dateEtHeure(iso: string): string {
  const d = new Date(iso);
  const jour  = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: FUSEAU });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: FUSEAU });
  return `${jour} à ${heure}`;
}

function depuis(iso: string, maintenant: number): string {
  const minutes = Math.max(1, Math.round((maintenant - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return `il y a ${minutes} min`;
  const heures = Math.round(minutes / 60);
  if (heures < 48) return `il y a ${heures} h`;
  return `il y a ${Math.round(heures / 24)} jours`;
}

function libellesDe(m: MessageDirection, maintenant: number): LibellesMessage {
  return {
    recu: dateEtHeure(m.recuLe),
    depuis: depuis(m.recuLe, maintenant),
    priseEnCharge: m.priseEnCharge ? depuis(m.priseEnCharge.le, maintenant) : null,
    reponse: m.reponse ? dateEtHeure(m.reponse.le) : null,
    cloture: m.cloture ? dateEtHeure(m.cloture.le) : null,
  };
}

export default async function BoiteDirection() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { aTraiter, traites, erreur } = await chargerBoiteDirection();

  const maintenant = Date.now();
  const enRetard = aTraiter.filter((m) => m.enRetard).length;

  return (
    <div>
      <PageHeader
        title="Messages des parents"
        subtitle={`Réponse promise sous ${DELAI_PROMIS_HEURES} h. Le premier qui prend un message en charge en devient responsable.`}
      />
      <div className="p-8 space-y-10 max-w-4xl">
        {erreur && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
            Les messages n&apos;ont pas pu être chargés : {erreur}
          </div>
        )}

        <section className="space-y-4">
          <h2 className="font-display font-black text-base text-ink flex flex-wrap items-center gap-2">
            À traiter
            <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 text-ink-muted">{aTraiter.length}</span>
            {enRetard > 0 && (
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                {enRetard} au-delà des {DELAI_PROMIS_HEURES} h
              </span>
            )}
          </h2>
          {aTraiter.length === 0 ? (
            <div className="bg-white rounded-2xl border border-cream-border px-6 py-10 text-center text-sm font-bold text-ink-muted">
              Aucun message en attente.
            </div>
          ) : (
            aTraiter.map((m) => (
              <CarteMessage key={m.id} message={m} moiId={user?.id ?? null} libelles={libellesDe(m, maintenant)} />
            ))
          )}
        </section>

        {traites.length > 0 && (
          <section className="space-y-4">
            <h2 className="font-display font-black text-base text-ink flex items-center gap-2">
              Traités
              <span className="text-xs font-black px-2 py-0.5 rounded-full bg-gray-100 text-ink-muted">{traites.length}</span>
            </h2>
            {traites.map((m) => (
              <CarteMessage key={m.id} message={m} moiId={user?.id ?? null} libelles={libellesDe(m, maintenant)} />
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
