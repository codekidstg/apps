import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import BilanMentorForm from "@/components/backoffice/BilanMentorForm";
import { ChoixMois, Pastille } from "@/components/backoffice/SuiviMentors";
import { JaugesAvecRegle } from "@/components/backoffice/RegleNote";
import { chargerSuiviMentors, lireMois, libelleMois, libelleNonTenue, type SeanceVue, type EleveVue, type QuestionVue } from "@/lib/backoffice/suivi-mentors";
import { chargerBilansMentor } from "@/lib/backoffice/bilans";
import { SEUIL, DELAI_HEURES } from "@/lib/backoffice/note-mentor";
import { AVANCEMENT, ENGAGEMENT, NON_TENUE } from "@/lib/rapports-libelles";
import { STATUT_ELEVE } from "@/lib/backoffice/statut-eleve";

/**
 * La fiche d'un mentor pour un mois — l'écran du point de fin de mois, servi
 * tel quel à l'admin et au manager.
 *
 * Elle répond dans cet ordre : quelle note, pourquoi cette note, et qu'est-ce
 * qu'on en fait. « Ce qui a coûté des points » est daté ligne par ligne : un
 * point de fin de mois se tient sur des faits, pas sur une impression.
 *
 * Ses élèves sont affichés à part, sous la note : leur progression n'y entre
 * pas, elle sert la discussion.
 */

const jourCourt = (iso: string) => new Date(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const heure = (iso: string) => new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" });

function LigneSeance({ s }: { s: SeanceVue }) {
  const r = s.rapport;
  const nonTenue = r && r.tenue === false ? NON_TENUE[r.raison_non_tenue ?? ""] ?? null : null;
  const av = r?.advancement ? AVANCEMENT[r.advancement] : null;
  const en = r?.engagement ? ENGAGEMENT[r.engagement] : null;

  return (
    <div className={`px-5 py-3.5 ${!r ? "bg-amber-50/60" : r.tenue === false ? "bg-slate-50" : ""}`}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1.5">
        <div className="min-w-0">
          <div className="font-black text-ink text-sm">{s.titre}</div>
          <div className="text-xs text-ink-muted mt-0.5">
            {jourCourt(s.quand)} · {heure(s.quand)}{s.eleve ? ` · 🎓 ${s.eleve}` : ""}
          </div>
        </div>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap ${
          !r ? "bg-amber-200 text-amber-900" : r.tenue === false ? "bg-slate-200 text-slate-700" : "bg-emerald-100 text-emerald-700"
        }`}>
          {!r ? "⏳ Compte rendu manquant" : r.tenue === false ? "🚫 Non tenue" : "✓ Compte rendu fait"}
        </span>
      </div>
      {nonTenue && (
        <div className="mt-2 text-xs font-bold text-slate-600">{nonTenue.icon} {nonTenue.label}</div>
      )}
      {r && r.tenue !== false && (
        <div className="mt-2 flex flex-wrap gap-2">
          {av && <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg" style={{ background: `${av.color}18`, color: av.color }}>{av.icon} {av.label}</span>}
          {en && <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600">{en.icon} {en.label}</span>}
          {r.next_session_note?.trim() && <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700">📌 Note pour la prochaine fois</span>}
        </div>
      )}
    </div>
  );
}

function LigneQuestion({ q, lien }: { q: QuestionVue; lien: string }) {
  const attente = !q.traiteeLe;
  const delai = q.traiteeLe ? (new Date(q.traiteeLe).getTime() - new Date(q.poseeLe).getTime()) / 3_600_000 : null;
  return (
    <div className={`px-5 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-1 ${attente ? "bg-amber-50/60" : ""}`}>
      <div className="text-sm font-bold text-ink">
        <Link href={lien} className="hover:underline">{q.eleve}</Link>
        <span className="text-xs font-bold text-ink-muted"> · posée le {jourCourt(q.poseeLe)}</span>
      </div>
      <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${
        attente ? "bg-amber-200 text-amber-900"
          : delai! > DELAI_HEURES ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
      }`}>
        {attente ? "Sans réponse"
          : `${q.comment === "reglee" ? "Réglée en séance" : "Répondue"} en ${delai! < 24 ? `${Math.max(1, Math.round(delai!))} h` : `${Math.round(delai! / 24)} j`}`}
      </span>
    </div>
  );
}

function LigneEleve({ e, lien }: { e: EleveVue; lien: string }) {
  const s = STATUT_ELEVE[e.statut];
  const difficulte = e.statut === "bloque" || e.statut === "ralentit";
  return (
    <div className="px-5 py-3">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <Link href={lien} className="text-sm font-black text-ink hover:underline">{e.nom}</Link>
        <span className={`text-[11px] font-black px-2.5 py-1 rounded-full border ${s.classes}`}>{s.pastille} {s.label}</span>
      </div>
      {e.raisons.length > 0 && (
        <p className="mt-1 text-xs font-bold text-ink-muted">{e.raisons.join(" · ")}</p>
      )}
      {difficulte && (
        <p className="mt-1 text-xs font-bold">
          {!e.avecSeance ? (
            <span className="text-ink-muted">Pas de séance tenue ce mois-ci</span>
          ) : (
            <>
              <span className={e.signale ? "text-emerald-700" : "text-amber-700"}>
                {e.signale ? "✓ signalé dans un compte rendu" : "✗ aucun compte rendu ne le signale"}
              </span>
              {" · "}
              <span className={e.suite ? "text-emerald-700" : "text-amber-700"}>
                {e.suite ? "✓ une suite est écrite" : "✗ rien sur quoi reprendre"}
              </span>
            </>
          )}
        </p>
      )}
    </div>
  );
}

function Section({ titre, compte, children }: { titre: string; compte?: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-black text-ink mb-2">
        {titre}{compte ? <span className="text-sm font-bold text-ink-muted"> · {compte}</span> : null}
      </h2>
      <div className="bg-white rounded-2xl border border-cream-border divide-y divide-cream-border overflow-hidden">{children}</div>
    </div>
  );
}

export default async function FicheMentor({ espace, id, mois }: {
  espace: "admin" | "manager";
  id: string;
  mois?: string;
}) {
  const cle = lireMois(mois);
  const base = `/${espace}/mentors`;
  const [{ mentors, erreur }, bilans] = await Promise.all([
    chargerSuiviMentors({ mois: cle, mentorId: id }),
    chargerBilansMentor(id),
  ]);
  if (erreur) {
    return (
      <div className="p-8">
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
          La fiche n&apos;a pas pu être chargée : {erreur}
        </div>
      </div>
    );
  }
  const m = mentors[0];
  if (!m) notFound();

  const duMois = bilans.find((b) => b.mois === cle) ?? null;
  const passes = bilans.filter((b) => b.mois !== cle);
  const fiche = (eleveId: string | null) => eleveId ? `/${espace}/utilisateurs/eleves/${eleveId}` : base;

  return (
    <div>
      <PageHeader
        title={m.nom}
        subtitle={`Suivi de ${libelleMois(cle)} — la note porte sur ses séances, ses réponses aux enfants et sa réaction quand un élève décroche. Minimum attendu : ${SEUIL} sur 100.`}
        breadcrumb={[{ label: "Suivi des mentors", href: `${base}?mois=${cle}` }, { label: m.nom }]}
      />

      <div className="p-8 space-y-6 max-w-4xl">
        <ChoixMois base={`${base}/${id}`} actif={cle} />

        {/* La note, et ce qui la compose */}
        <div className="bg-white rounded-2xl border border-cream-border p-5">
          <div className="flex flex-wrap items-start gap-5">
            <Pastille note={m.note} taille="grande" />
            <div className="min-w-0 flex-1 space-y-3">
              {m.note.note === null && (
                <p className="text-sm font-bold text-amber-700">{m.note.sansNote}</p>
              )}
              <JaugesAvecRegle blocs={m.note.blocs} />
              <p className="text-xs font-bold text-ink-muted">
                {m.note.seances.comptees} séance{m.note.seances.comptees > 1 ? "s" : ""} comptée{m.note.seances.comptees > 1 ? "s" : ""}
                {m.note.seances.nonTenues.length > 0 && (
                  <> · {m.note.seances.nonTenues.length} déclarée{m.note.seances.nonTenues.length > 1 ? "s" : ""} non tenue{m.note.seances.nonTenues.length > 1 ? "s" : ""}
                    {" ("}{m.note.seances.nonTenues.map((n) => libelleNonTenue(n.raison).toLowerCase()).join(", ")}{")"}</>
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-cream-border">
            <h2 className="font-black text-ink text-sm mb-2">Ce qui a coûté des points</h2>
            {m.note.pertes.length === 0 ? (
              // Sans rien à compter, « le mois est complet » serait un compliment
              // adressé à un mois vide.
              m.note.blocs.some((b) => b.unites > 0)
                ? <p className="text-sm font-bold text-emerald-700">Rien : le mois est complet.</p>
                : <p className="text-sm font-bold text-ink-muted">Rien à compter ce mois-ci.</p>
            ) : (
              <ul className="space-y-1.5">
                {m.note.pertes.map((p, i) => (
                  <li key={i} className="flex items-baseline gap-2 text-sm">
                    <span className="font-black text-red-600 shrink-0 tabular-nums">−{p.points}</span>
                    <span className="font-bold text-ink">{p.quoi}</span>
                    <span className="text-ink-muted font-bold text-xs">— {p.manques.join(" · ")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Le point de fin de mois */}
        <BilanMentorForm
          mentorId={id} mois={cle} moisLabel={libelleMois(cle)} note={m.note.note}
          bilan={duMois && {
            ajustement: duMois.ajustement,
            raisonAjustement: duMois.raisonAjustement,
            pointsForts: duMois.pointsForts,
            aAmeliorer: duMois.aAmeliorer,
            decisions: duMois.decisions,
            auteur: duMois.auteur,
            misAJourLe: duMois.misAJourLe,
          }}
        />

        <Section titre="Ses séances du mois" compte={`${m.seances.length}`}>
          {m.seances.length === 0
            ? <div className="px-5 py-8 text-center text-sm font-bold text-ink-muted">Aucune séance ce mois-ci.</div>
            : m.seances.map((s) => <LigneSeance key={s.cle} s={s} />)}
        </Section>

        <Section titre="Les questions de ses élèves" compte={`${m.questions.length} posée${m.questions.length > 1 ? "s" : ""} dans le mois`}>
          {m.questions.length === 0
            ? <div className="px-5 py-8 text-center text-sm font-bold text-ink-muted">Aucune question ce mois-ci.</div>
            : m.questions.map((q) => <LigneQuestion key={q.id} q={q} lien={`/${espace}/questions?eleve=${q.eleveId}`} />)}
        </Section>

        <Section titre="Ses élèves" compte={`${m.eleves.length}`}>
          {m.eleves.length === 0
            ? <div className="px-5 py-8 text-center text-sm font-bold text-ink-muted">Aucun élève ne lui est attribué.</div>
            : m.eleves.map((e) => <LigneEleve key={e.id} e={e} lien={fiche(e.id)} />)}
        </Section>
        <p className="text-xs font-bold text-ink-muted -mt-4">
          Le statut d&apos;un élève est celui d&apos;aujourd&apos;hui : il se recalcule à chaque lecture.
          Sur un mois déjà ancien, il dit l&apos;élève tel qu&apos;il est maintenant.
        </p>

        {passes.length > 0 && (
          <Section titre="Les points précédents" compte={`${passes.length}`}>
            {passes.map((b) => (
              <div key={b.id} className="px-5 py-4 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`${base}/${id}?mois=${b.mois}`} className="font-black text-ink text-sm hover:underline">{b.moisLabel}</Link>
                  <span className="text-[11px] font-black text-ink-muted">
                    {b.noteRetenue === null ? "pas de note" : `${b.noteRetenue} / 100`}
                    {b.ajustement !== 0 && b.noteCalculee !== null && ` (${b.noteCalculee} ${b.ajustement > 0 ? "+" : "−"} ${Math.abs(b.ajustement)})`}
                    {b.auteur ? ` · ${b.auteur}` : ""}
                  </span>
                </div>
                {b.raisonAjustement && <p className="text-xs font-bold text-ink-muted">Ajustement : {b.raisonAjustement}</p>}
                {b.pointsForts && <p className="text-sm text-ink"><span className="font-black text-xs text-ink-muted">Points forts — </span>{b.pointsForts}</p>}
                {b.aAmeliorer && <p className="text-sm text-ink"><span className="font-black text-xs text-ink-muted">À améliorer — </span>{b.aAmeliorer}</p>}
                {b.decisions && <p className="text-sm text-ink"><span className="font-black text-xs text-ink-muted">Décidé — </span>{b.decisions}</p>}
              </div>
            ))}
          </Section>
        )}
      </div>
    </div>
  );
}
