"use client";

import { useState, useTransition } from "react";
import { PAGES_BY_ROLE } from "@/lib/permissions/registry";
import { toggleRolePage, setUserPageOverride, seedAllRoleDefaults } from "./actions";

type RoleConfigs   = Record<string, Record<string, boolean>>;
type UserOverrides = Record<string, Record<string, boolean>>;
type UserProfile   = { id: string; display_name: string; role: string };

const ROLE_LABELS: Record<string, string> = {
  admin:   "Admin",
  manager: "Manager",
  teacher: "Professeur",
};

// ─── Toggle switch ─────────────────────────────────────────────────────────────

function Toggle({ checked, onChange, disabled }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      className="relative inline-flex w-10 h-5 rounded-full transition-colors focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: checked ? "#10b981" : "#d1d5db" }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
        style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }}
      />
    </button>
  );
}

// ─── Tab 1: par rôle ───────────────────────────────────────────────────────────

function RoleTab({ allRoleConfigs }: { allRoleConfigs: RoleConfigs }) {
  const [selectedRole, setSelectedRole] = useState<string>("manager");
  const [configs, setConfigs] = useState<RoleConfigs>(allRoleConfigs);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const pages = PAGES_BY_ROLE[selectedRole] ?? [];
  const roleConfig = configs[selectedRole] ?? {};
  const isAdmin = selectedRole === "admin";

  function handleToggle(pageKey: string) {
    if (isAdmin) return;
    const next = !(roleConfig[pageKey] ?? true);
    setConfigs(prev => ({
      ...prev,
      [selectedRole]: { ...prev[selectedRole], [pageKey]: next },
    }));
    startTransition(async () => {
      const res = await toggleRolePage(selectedRole, pageKey, next);
      if (res?.error) {
        // revert
        setConfigs(prev => ({
          ...prev,
          [selectedRole]: { ...prev[selectedRole], [pageKey]: !next },
        }));
        setNotice("Erreur : " + res.error);
      } else {
        setNotice("Mis à jour");
        setTimeout(() => setNotice(null), 2000);
      }
    });
  }

  function handleSeed() {
    startTransition(async () => {
      await seedAllRoleDefaults();
      setNotice("Valeurs par défaut restaurées");
      setTimeout(() => setNotice(null), 2500);
    });
  }

  return (
    <div>
      {/* Role selector */}
      <div className="flex items-center gap-3 mb-6">
        {["admin", "manager", "teacher"].map(r => (
          <button
            key={r}
            onClick={() => setSelectedRole(r)}
            className="px-4 py-2 rounded-xl text-sm font-black transition-colors"
            style={
              selectedRole === r
                ? { background: "#1B2D5E", color: "#FDB813" }
                : { background: "#f1f5f9", color: "#475569" }
            }
          >
            {ROLE_LABELS[r]}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-3">
          {notice && (
            <span className="text-xs font-bold text-emerald-600">{notice}</span>
          )}
          {pending && <span className="text-xs text-gray-400">Enregistrement…</span>}
          <button
            onClick={handleSeed}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
          >
            Restaurer les défauts
          </button>
        </div>
      </div>

      {isAdmin && (
        <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm font-bold text-amber-700">
          Les administrateurs ont toujours accès à toutes les pages — leurs droits ne sont pas modifiables ici.
        </div>
      )}

      {/* Pages table */}
      <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-cream-border flex items-center gap-3">
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest flex-1">Page</span>
          <span className="text-xs font-black text-gray-500 uppercase tracking-widest w-16 text-center">Accès</span>
        </div>
        <div className="divide-y divide-cream-border">
          {pages.map(page => {
            const allowed = roleConfig[page.key] ?? true;
            const isChild = !!page.parentKey;
            return (
              <div
                key={page.key}
                className="flex items-center gap-3 px-5 py-3"
                style={isChild ? { paddingLeft: 32 } : {}}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-ink">{page.label}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{page.href}</div>
                </div>
                <div className="w-16 flex justify-center">
                  <Toggle
                    checked={allowed}
                    onChange={() => handleToggle(page.key)}
                    disabled={isAdmin || pending}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Tab 2: par utilisateur ────────────────────────────────────────────────────

type OverrideState = "allow" | "deny" | "inherit";

function UserTab({
  users,
  allRoleConfigs,
  allUserOverrides,
}: {
  users: UserProfile[];
  allRoleConfigs: RoleConfigs;
  allUserOverrides: UserOverrides;
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [overrides, setOverrides] = useState<UserOverrides>(allUserOverrides);
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const selectedUser = users.find(u => u.id === selectedUserId);
  const pages = selectedUser ? (PAGES_BY_ROLE[selectedUser.role] ?? []) : [];
  const roleConfig = selectedUser ? (allRoleConfigs[selectedUser.role] ?? {}) : {};
  const userOverrideMap = selectedUserId ? (overrides[selectedUserId] ?? {}) : {};

  function getOverrideState(pageKey: string): OverrideState {
    if (!(pageKey in userOverrideMap)) return "inherit";
    return userOverrideMap[pageKey] ? "allow" : "deny";
  }

  function handleOverride(pageKey: string, next: OverrideState) {
    const allowed = next === "allow" ? true : next === "deny" ? false : null;

    setOverrides(prev => {
      const userMap = { ...(prev[selectedUserId] ?? {}) };
      if (allowed === null) delete userMap[pageKey];
      else userMap[pageKey] = allowed;
      return { ...prev, [selectedUserId]: userMap };
    });

    startTransition(async () => {
      const res = await setUserPageOverride(selectedUserId, pageKey, allowed);
      if (res?.error) {
        setNotice("Erreur : " + res.error);
      } else {
        setNotice("Mis à jour");
        setTimeout(() => setNotice(null), 2000);
      }
    });
  }

  return (
    <div>
      {/* User selector */}
      <div className="flex items-center gap-4 mb-6">
        <select
          value={selectedUserId}
          onChange={e => setSelectedUserId(e.target.value)}
          className="flex-1 max-w-sm border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-ink bg-white focus:outline-none focus:ring-2 focus:ring-brand-navy/30"
        >
          <option value="">-- Sélectionner un utilisateur --</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>
              {u.display_name} ({ROLE_LABELS[u.role] ?? u.role})
            </option>
          ))}
        </select>
        <div className="flex items-center gap-3">
          {notice && <span className="text-xs font-bold text-emerald-600">{notice}</span>}
          {pending && <span className="text-xs text-gray-400">Enregistrement…</span>}
        </div>
      </div>

      {!selectedUser && (
        <div className="text-center py-16 text-ink-muted font-bold text-sm">
          Sélectionnez un utilisateur pour voir et modifier ses droits individuels.
        </div>
      )}

      {selectedUser && (
        <>
          <div className="mb-4 text-sm font-bold text-ink-muted">
            Rôle de base : <span className="text-ink">{ROLE_LABELS[selectedUser.role]}</span>
            <span className="ml-3 text-xs text-gray-400">— Les surcharges s'appliquent par-dessus les droits du rôle.</span>
          </div>
          <div className="bg-white rounded-2xl border border-cream-border overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-cream-border grid grid-cols-[1fr_80px_160px] gap-3">
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Page</span>
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">Rôle</span>
              <span className="text-xs font-black text-gray-500 uppercase tracking-widest text-center">Surcharge individuelle</span>
            </div>
            <div className="divide-y divide-cream-border">
              {pages.map(page => {
                const roleAllowed = roleConfig[page.key] ?? true;
                const state = getOverrideState(page.key);
                const isChild = !!page.parentKey;

                return (
                  <div
                    key={page.key}
                    className="grid grid-cols-[1fr_80px_160px] gap-3 items-center px-5 py-3"
                    style={isChild ? { paddingLeft: 32 } : {}}
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-ink">{page.label}</div>
                    </div>
                    <div className="flex justify-center">
                      <span
                        className="text-xs font-black px-2 py-0.5 rounded-full"
                        style={roleAllowed
                          ? { background: "#dcfce7", color: "#16a34a" }
                          : { background: "#fee2e2", color: "#dc2626" }
                        }
                      >
                        {roleAllowed ? "ON" : "OFF"}
                      </span>
                    </div>
                    <div className="flex justify-center gap-1">
                      {(["allow", "inherit", "deny"] as OverrideState[]).map(s => (
                        <button
                          key={s}
                          onClick={() => handleOverride(page.key, s)}
                          disabled={pending}
                          className="px-2 py-1 rounded-lg text-xs font-black transition-colors disabled:opacity-50"
                          style={
                            state === s
                              ? s === "allow"
                                ? { background: "#10b981", color: "#fff" }
                                : s === "deny"
                                ? { background: "#ef4444", color: "#fff" }
                                : { background: "#6366f1", color: "#fff" }
                              : { background: "#f1f5f9", color: "#64748b" }
                          }
                        >
                          {s === "allow" ? "Forcer ON" : s === "deny" ? "Forcer OFF" : "Hérité"}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

type Props = {
  allRoleConfigs: RoleConfigs;
  allUserOverrides: UserOverrides;
  users: UserProfile[];
};

export default function DroitsClient({ allRoleConfigs, allUserOverrides, users }: Props) {
  const [tab, setTab] = useState<"role" | "user">("role");

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 w-fit">
        {([["role", "Par rôle"], ["user", "Par utilisateur"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className="px-5 py-2 rounded-lg text-sm font-black transition-colors"
            style={
              tab === key
                ? { background: "#fff", color: "#1B2D5E", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                : { color: "#64748b" }
            }
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "role" ? (
        <RoleTab allRoleConfigs={allRoleConfigs} />
      ) : (
        <UserTab
          users={users}
          allRoleConfigs={allRoleConfigs}
          allUserOverrides={allUserOverrides}
        />
      )}
    </div>
  );
}
