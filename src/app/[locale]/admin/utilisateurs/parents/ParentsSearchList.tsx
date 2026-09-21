"use client";

import { useState, useMemo } from "react";
import AddChildForm from "./AddChildForm";
import UnlinkButton from "./UnlinkButton";
import { STATUT_PARENT, type StatutParent } from "@/lib/backoffice/statut-parent";
import type { ActiviteParent } from "@/lib/backoffice/parents";

const STATUTS = Object.entries(STATUT_PARENT) as [StatutParent, (typeof STATUT_PARENT)[StatutParent]][];
const ABONNEMENT: Record<ActiviteParent["abonnement"], { texte: string; ok: boolean | null }> = {
  actif:   { texte: "Abonnement actif",  ok: true },
  essai:   { texte: "Abonnement à l'essai", ok: null },
  termine: { texte: "Abonnement terminé", ok: false },
  aucun:   { texte: "Pas d'abonnement",  ok: false },
};

/** Une démarche faite ou pas : ✓ vert, ✗ gris, ⏳ ambre. */
function Demarche({ ok, texte }: { ok: boolean | null; texte: string }) {
  const style = ok === true ? "text-green-700" : ok === null ? "text-amber-700" : "text-gray-400";
  return <span className={`text-xs font-bold ${style}`}>{ok === true ? "✓" : ok === null ? "⏳" : "✗"} {texte}</span>;
}

const LEVEL_NAMES: Record<number, string> = { 1: "Explorateur", 2: "Bâtisseur", 3: "Architecte" };

type ChildLink = {
  student_id: string;
  students: {
    id: string;
    xp: number;
    level_num: number;
    profiles: { id: string; display_name: string } | null;
  } | null;
};

type ParentRow = {
  id: string;
  display_name: string;
  email: string;
  children: ChildLink[];
  activite: ActiviteParent;
};

type StudentOption = { id: string; display_name: string };

export default function ParentsSearchList({
  parents,
  studentList,
  filtreInitial = null,
}: {
  parents: ParentRow[];
  studentList: StudentOption[];
  /** Arrivée depuis l'alerte du tableau de bord : on ouvre sur « À relancer ». */
  filtreInitial?: StatutParent | null;
}) {
  const [q, setQ] = useState("");
  const [statut, setStatut] = useState<StatutParent | null>(filtreInitial);

  // Les familles à relancer d'abord : c'est l'ordre dans lequel on les appelle.
  const filtered = useMemo(() => {
    const lower = q.toLowerCase().trim();
    return parents
      .filter((p) => !statut || p.activite.statut === statut)
      .filter((p) => !lower
        || p.display_name.toLowerCase().includes(lower)
        || p.email.toLowerCase().includes(lower)
        || p.children.some((c) => (c.students?.profiles?.display_name ?? "").toLowerCase().includes(lower)))
      .sort((a, b) => STATUT_PARENT[a.activite.statut].ordre - STATUT_PARENT[b.activite.statut].ordre);
  }, [q, statut, parents]);

  const parStatut = useMemo(() => {
    const n: Partial<Record<StatutParent, number>> = {};
    for (const p of parents) n[p.activite.statut] = (n[p.activite.statut] ?? 0) + 1;
    return n;
  }, [parents]);
  const journalActif = parents.some((p) => p.activite.journalActif);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, email, enfant…"
            className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 placeholder:text-gray-400 transition-all"
          />
        </div>
        {(q || statut) && (
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex gap-1.5 flex-wrap">
        <button onClick={() => setStatut(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${statut === null ? "bg-brand-navy text-white" : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"}`}>
          Tous
        </button>
        {STATUTS.map(([cle, s]) => (
          <button key={cle} onClick={() => setStatut(statut === cle ? null : cle)}
            className={`px-3 py-1.5 rounded-lg text-xs font-black border transition-colors ${statut === cle ? s.classes : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"}`}>
            {s.pastille} {s.label} <span className="opacity-60">{parStatut[cle] ?? 0}</span>
          </button>
        ))}
      </div>

      {!journalActif && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          Les visites des parents ne sont pas encore enregistrées : la présence affichée vient de leur dernière connexion,
          qui ne bouge pas quand un parent reste connecté.
        </p>
      )}

      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-gray-100">
            Aucun parent pour ce filtre
          </div>
        ) : filtered.map((parent) => {
          const a = parent.activite;
          const s = STATUT_PARENT[a.statut];
          return (
          <div key={parent.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg font-black text-blue-700">
                  {parent.display_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-black text-gray-900">{parent.display_name}</div>
                  <div className="text-xs text-gray-400 font-mono">{parent.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${s.classes}`}>{s.pastille} {s.label}</span>
                <span className="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                  {parent.children.length} enfant{parent.children.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Sa présence, et ses démarches. */}
            <div className="mb-4 rounded-xl bg-gray-50 px-4 py-3 space-y-1.5">
              <div className="text-sm text-gray-700">
                {a.presenceSource === "connexion" ? "Dernière connexion" : "Dernière visite"} : <strong>{a.presence}</strong>
                {a.joursVisite30 !== null && (
                  <span className="text-gray-400"> · {a.joursVisite30} jour{a.joursVisite30 > 1 ? "s" : ""} de visite sur 30</span>
                )}
              </div>
              <div className="flex gap-4 flex-wrap">
                <Demarche ok={a.consentement} texte="Consentement" />
                <Demarche ok={ABONNEMENT[a.abonnement].ok} texte={ABONNEMENT[a.abonnement].texte} />
                <Demarche ok={a.notifications} texte="Notifications" />
              </div>
              {a.derniereAction && <div className="text-xs text-gray-500">Dernière action : {a.derniereAction}</div>}
              {a.recents.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-xs font-bold text-brand-navy hover:underline list-none">
                    <span className="group-open:hidden">▸ Activité récente</span>
                    <span className="hidden group-open:inline">▾ Activité récente</span>
                  </summary>
                  <ul className="mt-1.5 space-y-0.5">
                    {a.recents.map((r, i) => <li key={i} className="text-xs text-gray-500">{r}</li>)}
                  </ul>
                </details>
              )}
            </div>

            {parent.children.length > 0 ? (
              <div className="mb-4 space-y-2">
                <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Enfants liés</div>
                {parent.children.map((link) => {
                  const student = link.students;
                  const studentName = student?.profiles?.display_name ?? "—";
                  const levelNum = student?.level_num ?? 1;
                  return (
                    <div key={link.student_id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">👦</span>
                        <div>
                          <div className="font-bold text-gray-800 text-sm">{studentName}</div>
                          <div className="text-xs text-gray-400">
                            {LEVEL_NAMES[levelNum] ?? `Niveau ${levelNum}`} · {student?.xp ?? 0} XP
                          </div>
                        </div>
                      </div>
                      <UnlinkButton parentId={parent.id} studentId={link.student_id} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mb-4 text-sm text-gray-400 italic">Aucun enfant associé</div>
            )}

            <details className="group">
              <summary className="cursor-pointer text-xs font-bold text-brand-navy hover:underline list-none flex items-center gap-1">
                <span className="group-open:hidden">＋ Associer un enfant</span>
                <span className="hidden group-open:inline">▲ Fermer</span>
              </summary>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <AddChildForm parentId={parent.id} students={studentList} />
              </div>
            </details>
          </div>
          );
        })}
      </div>
    </div>
  );
}
