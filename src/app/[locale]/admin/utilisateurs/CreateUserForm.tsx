"use client";

import { useState, useRef } from "react";
import { createUser } from "./actions";

type School = { id: string; name: string };
type Credentials = { email: string; password: string };

export default function CreateUserForm({ schools }: { schools: School[] }) {
  const [open, setOpen]           = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [creds, setCreds]         = useState<Credentials | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const email    = fd.get("email") as string;
    const password = fd.get("password") as string;
    const result = await createUser(fd);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    formRef.current?.reset();
    setOpen(false);
    setCreds({ email, password });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="bg-brand-orange text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors"
      >
        + Nouvel utilisateur
      </button>

      {/* Modal création */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <h2 className="font-display font-black text-xl text-ink mb-6">Créer un compte</h2>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
              <Field label="Nom affiché" name="display_name" type="text" required />
              <Field label="Email" name="email" type="email" required />
              <Field label="Mot de passe" name="password" type="password" required />

              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Rôle</label>
                <select name="role" required className={inputClass}>
                  <option value="">Choisir un rôle…</option>
                  <option value="manager">Manager</option>
                  <option value="teacher">Professeur</option>
                  <option value="student">Élève</option>
                  <option value="parent">Parent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {schools.length > 0 && (
                <div>
                  <label className="block text-xs font-extrabold text-ink-light mb-1.5">École (optionnel)</label>
                  <select name="school_id" className={inputClass}>
                    <option value="">Aucune</option>
                    {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}

              {error && <p className="text-sm text-red-600 font-bold">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border-2 border-cream-border text-ink-muted font-extrabold text-sm py-2.5 rounded-xl hover:bg-cream transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
                >
                  {loading ? "Création…" : "Créer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal credentials — affiché une fois après création */}
      {creds && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🔑</span>
              <h2 className="font-display font-black text-xl text-ink">Compte créé !</h2>
            </div>
            <p className="text-sm text-ink-muted mb-6">
              Notez ces identifiants — le mot de passe ne sera plus affiché après fermeture.
            </p>

            <div className="space-y-3">
              <CredentialRow label="Email" value={creds.email} masked={false} />
              <CredentialRow label="Mot de passe" value={creds.password} masked />
            </div>

            <button
              onClick={() => { setCreds(null); window.location.reload(); }}
              className="mt-6 w-full bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function CredentialRow({ label, value, masked }: { label: string; value: string; masked: boolean }) {
  const [revealed, setRevealed] = useState(!masked);
  const [copied, setCopied]     = useState(false);

  function copy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border border-cream-border rounded-xl px-4 py-3 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-xs font-extrabold text-ink-light mb-0.5">{label}</div>
        <div className="font-bold text-sm text-ink font-mono truncate">
          {revealed ? value : "•".repeat(Math.min(value.length, 20))}
        </div>
      </div>
      {masked && (
        <button
          onClick={() => setRevealed((r) => !r)}
          className="text-xs text-ink-muted hover:text-ink shrink-0 px-2 py-1 rounded-lg hover:bg-cream transition-colors"
          title={revealed ? "Masquer" : "Afficher"}
        >
          {revealed ? "👁️" : "🙈"}
        </button>
      )}
      <button
        onClick={copy}
        className="text-xs font-extrabold shrink-0 px-3 py-1.5 rounded-lg transition-colors bg-cream hover:bg-cream-border text-ink-muted hover:text-ink"
      >
        {copied ? "✓ Copié" : "Copier"}
      </button>
    </div>
  );
}

const inputClass = "w-full border border-cream-border rounded-xl px-3.5 py-2.5 text-sm text-ink font-bold focus:outline-none focus:ring-2 focus:ring-brand-orange bg-white";

function Field({ label, name, type, required }: { label: string; name: string; type: string; required?: boolean }) {
  return (
    <div>
      <label className="block text-xs font-extrabold text-ink-light mb-1.5">{label}</label>
      <input type={type} name={name} required={required} className={inputClass} />
    </div>
  );
}
