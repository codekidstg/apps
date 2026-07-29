"use client";

import { useState, useMemo } from "react";
import { RoleBadge } from "@/components/backoffice/StatusBadge";
import { CopyCell } from "./CopyCell";
import { ResetPasswordCell } from "./ResetPasswordCell";
import { toggleUserActive } from "./actions";
import { useTransition } from "react";

type UserRow = {
  id: string;
  display_name: string | null;
  role: string;
  active: boolean;
  created_at: string;
  email: string;
  schools: { name: string } | null;
};

function ToggleButton({ userId, active }: { userId: string; active: boolean }) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => startTransition(async () => { await toggleUserActive(userId, !active); })}
      className="text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-40"
    >
      {active ? "Désactiver" : "Réactiver"}
    </button>
  );
}

const ROLE_FILTER_LABELS: Record<string, string> = {
  "": "Tous",
  admin: "Admin",
  manager: "Manager",
  teacher: "Prof",
  student: "Élève",
  parent: "Parent",
};

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";
const DASHBOARD: Record<string, string> = {
  admin: "/fr/admin",
  manager: "/fr/manager",
  teacher: "/fr/prof",
  student: "/fr/eleve",
  parent: "/fr/suivi",
};

export default function UsersSearchTable({ users }: { users: UserRow[] }) {
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  const filtered = useMemo(() => {
    const lower = q.toLowerCase().trim();
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false;
      if (!lower) return true;
      return (
        (u.display_name ?? "").toLowerCase().includes(lower) ||
        u.email.toLowerCase().includes(lower) ||
        u.role.toLowerCase().includes(lower)
      );
    });
  }, [q, roleFilter, users]);

  return (
    <div className="space-y-4">
      {/* Barre de recherche + filtres */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">🔍</span>
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher par nom, email…"
            className="w-full pl-9 pr-4 py-2.5 text-sm font-medium bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 placeholder:text-gray-400 transition-all"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {Object.entries(ROLE_FILTER_LABELS).map(([val, label]) => (
            <button
              key={val}
              onClick={() => setRoleFilter(val)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors ${
                roleFilter === val
                  ? "bg-brand-navy text-white"
                  : "bg-white border border-gray-200 text-gray-500 hover:border-gray-400"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {(q || roleFilter) && (
          <span className="text-xs text-gray-400 font-medium">
            {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {["Nom", "Identifiants & Accès", "Rôle", "Statut", "Créé le", ""].map((h) => (
                <th key={h} className="text-left px-5 py-3 text-xs font-black uppercase tracking-widest text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-12 text-center text-gray-400 font-bold">
                  Aucun utilisateur pour « {q || roleFilter} »
                </td>
              </tr>
            ) : filtered.map((u) => {
              const base = BASE_URL || "http://localhost:3000";
              const loginUrl = `${base}/fr/connexion`;
              const dash = DASHBOARD[u.role] ? `${base}${DASHBOARD[u.role]}` : null;
              return (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-bold text-gray-900">{u.display_name}</div>
                    <div className="text-xs text-gray-400 font-mono">{u.id.slice(0, 8)}…</div>
                  </td>
                  <td className="px-5 py-3">
                    <div className="space-y-1.5">
                      {u.email ? <CopyCell email={u.email} /> : <span className="text-xs text-gray-400">—</span>}
                      <ResetPasswordCell userId={u.id} />
                      <div className="flex items-center gap-3 pt-0.5">
                        <a href={loginUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-brand-orange hover:underline">🔐 Connexion ↗</a>
                        {dash && <a href={dash} target="_blank" rel="noopener noreferrer"
                          className="text-xs font-bold text-gray-400 hover:text-gray-700 hover:underline">🏠 Espace ↗</a>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3"><RoleBadge role={u.role} /></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-black ${u.active ? "text-green-600" : "text-gray-400"}`}>
                      {u.active ? "● Actif" : "○ Inactif"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString("fr-FR")}</span>
                  </td>
                  <td className="px-5 py-3">
                    <ToggleButton userId={u.id} active={u.active} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
