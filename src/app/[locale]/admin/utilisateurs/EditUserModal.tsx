"use client";

import { useState, useTransition } from "react";
import { updateUser } from "./actions";

type Role = "admin" | "manager" | "teacher" | "student" | "parent";

type Props = {
  user: {
    id: string;
    display_name: string | null;
    email: string;
    role: string;
  };
  onClose: () => void;
};

const ROLES: { value: Role; label: string }[] = [
  { value: "student",  label: "Élève" },
  { value: "teacher",  label: "Professeur" },
  { value: "parent",   label: "Parent" },
  { value: "manager",  label: "Manager" },
  { value: "admin",    label: "Admin" },
];

export default function EditUserModal({
  user, onClose, viewerRole = "admin",
}: Props & { viewerRole?: "admin" | "manager" }) {
  const [name,  setName]  = useState(user.display_name ?? "");
  const [email, setEmail] = useState(user.email);
  const [role,  setRole]  = useState<Role>(user.role as Role);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await updateUser(user.id, {
        display_name: name.trim() || undefined,
        email: email.trim() !== user.email ? email.trim() : undefined,
        role: role !== user.role ? role : undefined,
      });
      if (res.error) { setError(res.error); return; }
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 space-y-5" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Modifier l'utilisateur</h2>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{user.id.slice(0, 12)}…</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm transition-colors">✕</button>
        </div>

        {/* Champs */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Nom complet</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition-all"
              placeholder="Nom complet"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 transition-all"
              placeholder="email@exemple.com"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5">Rôle</label>
            <div className="grid grid-cols-5 gap-1.5">
              {ROLES.filter((r) => r.value !== "admin" || viewerRole === "admin").map((r) => (
                <button
                  key={r.value}
                  onClick={() => setRole(r.value)}
                  className={`py-2 rounded-xl text-xs font-black transition-all ${
                    role === r.value
                      ? "bg-brand-navy text-white shadow-sm"
                      : "bg-gray-50 border border-gray-200 text-gray-500 hover:border-brand-navy/40"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm font-black text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors">
            Annuler
          </button>
          <button
            onClick={submit}
            disabled={pending}
            className="flex-1 py-2.5 rounded-xl text-sm font-black text-white bg-brand-navy hover:bg-brand-navy/90 disabled:opacity-50 transition-colors"
          >
            {pending ? "Enregistrement…" : "Enregistrer"}
          </button>
        </div>

      </div>
    </div>
  );
}
