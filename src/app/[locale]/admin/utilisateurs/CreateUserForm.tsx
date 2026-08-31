"use client";

import { useState, useRef } from "react";
import { createUser } from "./actions";
import { identifiantDepuisNom, estEmailInterne } from "@/lib/username";

type School = { id: string; name: string };
type Credentials = { email: string; username: string; password: string; envoye: boolean };

const SPECIAL = ["@", "!", "#", "$", "%"];

function generatePassword(displayName: string): string {
  const firstName = displayName.trim().split(/\s+/)[0] || "User";
  // Capitalize first letter, lowercase rest, max 4 chars
  const base = firstName.charAt(0).toUpperCase() + firstName.slice(1, 4).toLowerCase();
  const digits = Math.floor(10 + Math.random() * 90); // 2 chiffres
  const special = SPECIAL[Math.floor(Math.random() * SPECIAL.length)];
  const extra = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // 1 lettre maj
  // Assemble ≤ 8 chars : Base + chiffres + spécial + lettre = 4+2+1+1 = 8
  return `${base}${digits}${special}${extra}`;
}

export default function CreateUserForm({
  schools, viewerRole = "admin",
}: {
  schools: School[];
  /** Un manager ne peut pas créer d'admin : l'option ne lui est pas proposée. */
  viewerRole?: "admin" | "manager";
}) {
  const [open, setOpen]             = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [loading, setLoading]       = useState(false);
  const [creds, setCreds]           = useState<Credentials | null>(null);
  const [password, setPassword]     = useState("");
  const [displayName, setDisplayName] = useState("");
  // Aperçu de l'identifiant pendant la saisie du nom. Un chiffre peut s'ajouter
  // à la création si celui-ci est déjà pris.
  const identifiantPrevu = identifiantDepuisNom(displayName);
  const formRef = useRef<HTMLFormElement>(null);

  function handleGenerate() {
    setPassword(generatePassword(displayName || "User"));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const pw = fd.get("password") as string;
    const result = await createUser(fd);
    setLoading(false);
    if (result?.error) { setError(result.error); return; }
    formRef.current?.reset();
    setPassword("");
    setDisplayName("");
    setOpen(false);
    // On affiche ce que le serveur a réellement retenu, pas ce qui a été saisi.
    setCreds({
      email: result.email ?? "",
      username: result.username ?? "",
      password: pw,
      envoye: !!result.envoye,
    });
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
              {/* Nom affiché */}
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Nom affiché</label>
                <input
                  type="text"
                  name="display_name"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* Facultatif : sans adresse, le compte reçoit un identifiant
                  prénom.initiale et se connecte avec. */}
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">
                  Email <span className="font-bold text-ink-light/60">— facultatif</span>
                </label>
                <input type="email" name="email" className={inputClass} placeholder="laisser vide si la personne n'en donne pas" />
                <p className="mt-1.5 text-[11px] text-ink-light/70 leading-relaxed">
                  Sans email, la connexion se fera avec l&apos;identifiant
                  {identifiantPrevu ? <> <b className="text-ink">{identifiantPrevu}</b></> : " généré depuis le nom"}.
                </p>
              </div>

              {/* Mot de passe + bouton Générer */}
              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Mot de passe</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} flex-1 font-mono`}
                    placeholder="Min. 8 caractères"
                  />
                  <button
                    type="button"
                    onClick={handleGenerate}
                    title="Générer un mot de passe"
                    className="shrink-0 bg-cream hover:bg-cream-border border border-cream-border text-ink-muted hover:text-ink text-xs font-extrabold px-3 rounded-xl transition-colors"
                  >
                    ✨ Générer
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-ink-light mb-1.5">Rôle</label>
                <select name="role" required className={inputClass}>
                  <option value="">Choisir un rôle…</option>
                  <option value="manager">Manager</option>
                  <option value="teacher">Professeur</option>
                  <option value="student">Élève</option>
                  <option value="parent">Parent</option>
                  {viewerRole === "admin" && <option value="admin">Admin</option>}
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
                  onClick={() => { setOpen(false); setPassword(""); setDisplayName(""); }}
                  className="flex-1 border-2 border-cream-border text-ink-muted font-extrabold text-sm py-2.5 rounded-xl hover:bg-cream transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-brand-orange text-white font-extrabold text-sm py-2.5 rounded-xl hover:bg-brand-orange-dark transition-colors disabled:opacity-50"
                >
                  {loading ? "Création…" : "Créer & envoyer"}
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
            <p className="text-sm text-ink-muted mb-2">
              {creds.envoye
                ? "Un email de bienvenue avec les identifiants a été envoyé à l'utilisateur."
                : "Aucun email n'a été envoyé — transmettez ces accès vous-même, le bouton « Voir le message d'accès » prépare le texte à copier."}
            </p>
            <p className="text-xs text-ink-light mb-6">
              Conservez ces identifiants — le mot de passe ne sera plus affiché après fermeture.
            </p>

            <div className="space-y-3">
              {estEmailInterne(creds.email)
                ? <CredentialRow label="Identifiant" value={creds.username} masked={false} />
                : <CredentialRow label="Email" value={creds.email} masked={false} />}
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
