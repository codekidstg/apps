"use client";
import { useState, useTransition } from "react";
import { toggleAtelier } from "./actions";
import { toggleRolePage, setUserPageOverride } from "@/lib/permissions/actions";

type Student   = { id: string; name: string; atelier_active: boolean };
type StaffRole = "teacher" | "manager";
type Override  = "inherit" | "allow" | "deny";
type Staff     = { id: string; name: string; role: StaffRole; override: Override };

const ROLE_LABEL: Record<StaffRole, string> = { teacher: "Professeur", manager: "Manager" };

export default function AtelierAdminClient({
  students,
  staff,
  roleAllowed,
}: {
  students: Student[];
  staff: Staff[];
  roleAllowed: Record<StaffRole, boolean>;
}) {
  const [list, setList]     = useState(students);
  const [team, setTeam]     = useState(staff);
  const [roles, setRoles]   = useState(roleAllowed);
  const [search, setSearch] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function flash(msg: string) {
    setNotice(msg);
    setTimeout(() => setNotice(null), 2000);
  }

  const filtered    = list.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
  const activeCount = list.filter(s => s.atelier_active).length;

  function toggleStudent(id: string) {
    const next = !list.find(s => s.id === id)!.atelier_active;
    setList(prev => prev.map(s => (s.id === id ? { ...s, atelier_active: next } : s)));
    startTransition(async () => {
      await toggleAtelier(id, next);
      flash("Mis à jour");
    });
  }

  function toggleRole(role: StaffRole) {
    const next = !roles[role];
    setRoles(prev => ({ ...prev, [role]: next }));
    startTransition(async () => {
      const res = await toggleRolePage(role, `${role}.atelier`, next);
      if (res?.error) {
        setRoles(prev => ({ ...prev, [role]: !next }));
        flash("Erreur : " + res.error);
      } else flash("Mis à jour");
    });
  }

  function setOverride(person: Staff, next: Override) {
    const previous = person.override;
    setTeam(prev => prev.map(p => (p.id === person.id ? { ...p, override: next } : p)));
    startTransition(async () => {
      const allowed = next === "allow" ? true : next === "deny" ? false : null;
      const res = await setUserPageOverride(person.id, `${person.role}.atelier`, allowed);
      if (res?.error) {
        setTeam(prev => prev.map(p => (p.id === person.id ? { ...p, override: previous } : p)));
        flash("Erreur : " + res.error);
      } else flash("Mis à jour");
    });
  }

  const effective  = (p: Staff) =>
    p.override === "allow" ? true : p.override === "deny" ? false : roles[p.role];
  const animateurs = team.filter(effective).length;

  return (
    <div className="space-y-8">
      <div className="h-4 flex items-center gap-3">
        {notice && <span className="text-xs font-bold text-emerald-600">{notice}</span>}
        {pending && <span className="text-xs text-gray-400">Enregistrement…</span>}
      </div>

      {/* ══════════ ÉLÈVES — SÉANCE OFFERTE ══════════ */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
            🎟️ Séance offerte — élèves
          </h2>
          <p className="text-xs text-gray-400 font-bold mt-1">
            L&apos;élève voit un menu « Séance offerte » dans son espace.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-cream-border p-4 text-center">
            <div className="text-3xl font-black text-orange-500">{activeCount}</div>
            <div className="text-xs text-gray-500 mt-1 font-bold">Séance(s) activée(s)</div>
          </div>
          <div className="bg-white rounded-2xl border border-cream-border p-4 text-center">
            <div className="text-3xl font-black text-ink">{list.length - activeCount}</div>
            <div className="text-xs text-gray-500 mt-1 font-bold">Non activé(s)</div>
          </div>
        </div>

        <input
          type="text"
          placeholder="Rechercher un élève…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-bold text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
        />

        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-bold">Aucun élève trouvé</div>
          ) : (
            <div className="divide-y divide-cream-border">
              {filtered.map(s => (
                <div key={s.id} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                    s.atelier_active ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400"
                  }`}>
                    {s.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-ink truncate">{s.name}</div>
                    <div className={`text-xs font-bold mt-0.5 ${s.atelier_active ? "text-orange-600" : "text-gray-400"}`}>
                      {s.atelier_active ? "🎟️ Séance offerte active" : "Pas de séance offerte"}
                    </div>
                  </div>
                  <button
                    disabled={pending}
                    onClick={() => toggleStudent(s.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-colors disabled:opacity-50 shrink-0 ${
                      s.atelier_active
                        ? "border border-gray-200 text-gray-500 hover:bg-gray-50"
                        : "bg-orange-500 hover:bg-orange-400 text-white"
                    }`}
                  >
                    {s.atelier_active ? "Désactiver" : "Activer la séance"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ══════════ STAFF — ANIMATION ══════════ */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
            🎓 Animation — profs &amp; managers
          </h2>
          <p className="text-xs text-gray-400 font-bold mt-1">
            Donne accès au tableau de bord Mentor et fait apparaître « Atelier » dans leur menu.
            Mêmes réglages que dans Gestion des droits.
          </p>
        </div>

        {/* Interrupteurs par rôle */}
        <div className="grid grid-cols-2 gap-4">
          {(["teacher", "manager"] as StaffRole[]).map(role => (
            <button
              key={role}
              disabled={pending}
              onClick={() => toggleRole(role)}
              className={`rounded-2xl p-4 border text-left transition-colors disabled:opacity-50 ${
                roles[role] ? "border-emerald-200 bg-emerald-50" : "bg-white border-cream-border"
              }`}
            >
              <div className="text-xs text-gray-500 font-bold">Tous les {ROLE_LABEL[role].toLowerCase()}s</div>
              <div className={`text-lg font-black mt-1 ${roles[role] ? "text-emerald-600" : "text-gray-400"}`}>
                {roles[role] ? "Activé" : "Désactivé"}
              </div>
            </button>
          ))}
        </div>

        <div className="text-xs text-gray-500 font-bold">
          {animateurs} personne(s) peuvent animer une séance.
        </div>

        {/* Exceptions individuelles */}
        <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
          <div className="px-5 py-3 bg-gray-50 border-b border-cream-border flex items-center gap-3">
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest flex-1">Personne</span>
            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Accès</span>
          </div>
          {team.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm font-bold">Aucun prof ni manager</div>
          ) : (
            <div className="divide-y divide-cream-border">
              {team.map(p => {
                const can = effective(p);
                return (
                  <div key={p.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-ink truncate">{p.name}</div>
                      <div className="text-xs font-bold mt-0.5">
                        <span className="text-gray-400">{ROLE_LABEL[p.role]} · </span>
                        <span className={can ? "text-emerald-600" : "text-gray-400"}>
                          {can ? "peut animer" : "ne peut pas animer"}
                        </span>
                      </div>
                    </div>

                    <div className="flex rounded-xl overflow-hidden border border-gray-200 shrink-0">
                      {([
                        ["inherit", "Hérité"],
                        ["allow",   "Autorisé"],
                        ["deny",    "Bloqué"],
                      ] as [Override, string][]).map(([value, label]) => (
                        <button
                          key={value}
                          disabled={pending}
                          onClick={() => setOverride(p, value)}
                          className={`px-3 py-1.5 text-xs font-black transition-colors disabled:opacity-50 ${
                            p.override === value
                              ? value === "deny"
                                ? "bg-red-500 text-white"
                                : value === "allow"
                                ? "bg-emerald-500 text-white"
                                : "bg-gray-400 text-white"
                              : "bg-white text-gray-400 hover:bg-gray-50"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
