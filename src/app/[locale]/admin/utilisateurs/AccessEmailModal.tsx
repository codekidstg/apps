"use client";

import { useEffect, useState } from "react";
import { getWelcomeEmail, resendWelcomeEmail } from "./actions";

type Contenu = { subject: string; html: string; text: string };

/**
 * Voir, copier, envoyer le message d'accès d'un utilisateur.
 *
 * L'aperçu, la copie et l'envoi viennent tous de buildWelcomeEmail côté
 * serveur : ce qui s'affiche ici est exactement ce qui part.
 *
 * La copie en texte brut est volontairement mise en avant : au Togo un parent
 * lit bien plus sûrement un message WhatsApp qu'un email, et l'envoi par email
 * dépend d'un domaine vérifié chez Resend.
 */
export default function AccessEmailModal({
  userId, nom, onClose,
}: { userId: string; nom: string; onClose: () => void }) {
  const [contenu, setContenu] = useState<Contenu | null>(null);
  const [to, setTo]           = useState("");
  const [erreur, setErreur]   = useState<string | null>(null);
  const [copie, setCopie]     = useState<"texte" | "html" | null>(null);
  const [envoi, setEnvoi]     = useState(false);
  const [envoye, setEnvoye]   = useState(false);
  const [errEnvoi, setErrEnvoi] = useState<string | null>(null);

  useEffect(() => {
    let vivant = true;
    getWelcomeEmail(userId).then(r => {
      if (!vivant) return;
      if ("error" in r) { setErreur(r.error); return; }
      setContenu(r.email); setTo(r.to);
    });
    return () => { vivant = false; };
  }, [userId]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  async function copier(quoi: "texte" | "html") {
    if (!contenu) return;
    await navigator.clipboard.writeText(quoi === "texte" ? contenu.text : contenu.html);
    setCopie(quoi);
    setTimeout(() => setCopie(null), 2000);
  }

  function envoyer() {
    setEnvoi(true); setErrEnvoi(null);
    resendWelcomeEmail(userId).then(r => {
      setEnvoi(false);
      if (r?.error) { setErrEnvoi(r.error); return; }
      setEnvoye(true);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:p-8"
      onClick={onClose}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <div className="font-black text-brand-navy">Accès de {nom}</div>
            <div className="text-xs text-gray-400 truncate">{to || "…"}</div>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-xl leading-none" aria-label="Fermer">×</button>
        </div>

        {erreur && <div className="px-6 py-5 text-sm font-bold text-red-500">{erreur}</div>}

        {!erreur && !contenu && <div className="px-6 py-10 text-center text-sm text-gray-400">Chargement…</div>}

        {contenu && (
          <>
            <div className="px-6 pt-4">
              <div className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-1">Objet</div>
              <div className="text-sm font-bold text-brand-navy mb-4">{contenu.subject}</div>
            </div>

            <div className="px-6">
              <iframe
                title="Aperçu du message"
                srcDoc={contenu.html}
                sandbox=""
                className="w-full h-[420px] rounded-xl border border-gray-200 bg-gray-50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 px-6 py-4">
              <button onClick={() => copier("texte")}
                className="px-3 py-2 rounded-lg bg-brand-navy text-white text-xs font-black hover:opacity-90 transition-opacity">
                {copie === "texte" ? "✓ Copié" : "📋 Copier pour WhatsApp"}
              </button>
              <button onClick={() => copier("html")}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 transition-colors">
                {copie === "html" ? "✓ Copié" : "Copier le HTML"}
              </button>
              <div className="flex-1" />
              <button onClick={envoyer} disabled={envoi || envoye}
                className="px-4 py-2 rounded-lg bg-brand-orange text-white text-xs font-black hover:opacity-90 transition-opacity disabled:opacity-40">
                {envoi ? "Envoi…" : envoye ? "✓ Envoyé" : "📧 Envoyer par email"}
              </button>
            </div>

            {errEnvoi && (
              <div className="mx-6 mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
                <div className="text-xs font-black text-red-600 mb-1">L&apos;envoi a échoué</div>
                <div className="text-xs text-red-500 mb-2">{errEnvoi}</div>
                <div className="text-[11px] text-red-400 leading-relaxed">
                  Tant qu&apos;aucun domaine n&apos;est vérifié dans Resend, l&apos;envoi par email
                  est refusé. En attendant, « Copier pour WhatsApp » fonctionne.
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
