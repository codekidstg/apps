import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireParentPermission } from "@/lib/permissions/parent";
import { chargerMessagesParent, marquerReponsesVues, type MessageParent } from "@/lib/contact/parent";

/**
 * Vrai si le message est bien parti. L'erreur de l'insertion était ignorée :
 * le parent lisait « Message envoyé ! » même quand rien n'avait été enregistré.
 */
async function sendMessage(formData: FormData): Promise<boolean> {
  "use server";
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string }>();

  const { error } = await (supabase.from("contact_messages") as any).insert({
    parent_id: user.id,
    parent_name: profile?.display_name ?? formData.get("name"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });
  if (error) {
    console.error("[contact parent] envoi :", error.message);
    return false;
  }

  // La page du parent, et les pastilles de la direction qui doivent s'allumer.
  revalidatePath("/[locale]/suivi", "layout");
  revalidatePath("/[locale]/admin", "layout");
  revalidatePath("/[locale]/manager", "layout");
  return true;
}

const ETATS_PARENT: Record<MessageParent["etat"], { libelle: string; classe: string }> = {
  a_traiter:      { libelle: "📨 Envoyé",         classe: "bg-slate-700 text-slate-300" },
  pris_en_charge: { libelle: "👀 Pris en charge", classe: "bg-blue-900/60 text-blue-300" },
  repondu:        { libelle: "💬 Réponse reçue",  classe: "bg-emerald-900/50 text-emerald-300" },
  clos:           { libelle: "✅ Traité",          classe: "bg-slate-700 text-slate-300" },
};

function dateEtHeure(iso: string): string {
  const d = new Date(iso);
  const jour  = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Lome" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lome" });
  return `${jour} à ${heure}`;
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string; erreur?: string }>;
}) {
  const { locale } = await params;
  const { sent, erreur } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  await requireParentPermission(user.id, "parent.contact", locale);

  const [{ data: profile }, messages] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single<{ display_name: string }>(),
    chargerMessagesParent(user.id),
  ]);

  // Afficher la page, c'est avoir lu la réponse : la pastille « Contact » s'éteint.
  await marquerReponsesVues(user.id, messages.filter((m) => m.reponse).map((m) => m.id));

  async function handleSend(formData: FormData) {
    "use server";
    const ok = await sendMessage(formData);
    redirect(`/${locale}/suivi/contact?${ok ? "sent=1" : "erreur=1"}`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Contacter la direction</h1>
        <p className="text-slate-400 text-sm">
          Une question, une remarque ? Écrivez-nous : la direction vous répond sous 48 h, directement sur cette page.
        </p>
      </div>

      {sent === "1" ? (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-8 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <div className="font-black text-white text-lg">Message envoyé !</div>
          {/* L'ancienne phrase promettait une réponse « par email » : aucun
              email n'était jamais parti, et l'adresse d'envoi est une adresse
              noreply. La réponse s'affiche désormais ici. */}
          <div className="text-sm text-slate-400">
            Nous avons bien reçu votre message. La direction vous répondra ici même, sous 48 h.
          </div>
          <a href={`/${locale}/suivi/contact`} className="inline-block mt-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Envoyer un autre message
          </a>
        </div>
      ) : (
        <>
          {erreur === "1" && (
            <div className="bg-red-900/30 border border-red-700/40 rounded-2xl px-5 py-4 text-sm font-bold text-red-300">
              Votre message n&apos;est pas parti. Réessayez dans un instant.
            </div>
          )}

          <form action={handleSend} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Votre nom</label>
              <input
                name="name"
                defaultValue={profile?.display_name ?? ""}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-blue-600 transition-colors"
                placeholder="Votre nom"
                readOnly={!!profile?.display_name}
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Sujet</label>
              <select
                name="subject"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-blue-600 transition-colors"
                required
              >
                <option value="">— Choisissez un sujet —</option>
                <option value="Progression de mon enfant">Progression de mon enfant</option>
                <option value="Abonnement et paiement">Abonnement et paiement</option>
                <option value="Problème technique">Problème technique</option>
                <option value="Question sur les cours">Question sur les cours</option>
                <option value="Autre">Autre</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5">Message</label>
              <textarea
                name="message"
                rows={5}
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm font-bold placeholder:text-slate-600 focus:outline-none focus:border-blue-600 transition-colors resize-none"
                placeholder="Décrivez votre demande..."
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-700 hover:bg-blue-600 text-white font-black py-3.5 rounded-xl transition-colors"
            >
              Envoyer le message ✉️
            </button>
          </form>
        </>
      )}

      {/* Le parent voit enfin ce qu'il a envoyé, où ça en est, et la réponse. */}
      {messages.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Vos messages</div>
          {messages.map((m) => {
            const etat = ETATS_PARENT[m.etat];
            return (
              <div key={m.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-black text-white">{m.sujet}</div>
                    <div className="text-xs text-slate-500 mt-0.5">Envoyé le {dateEtHeure(m.envoyeLe)}</div>
                  </div>
                  <span className={`shrink-0 text-[11px] font-black px-2.5 py-1 rounded-full ${etat.classe}`}>
                    {etat.libelle}
                  </span>
                </div>
                <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">{m.texte}</p>

                {m.reponse && (
                  <div className="rounded-xl bg-blue-950/40 border border-blue-800/40 p-4 space-y-1.5">
                    <div className="text-xs font-black text-blue-300 uppercase tracking-widest">
                      Réponse de la direction · {dateEtHeure(m.reponse.le)}
                    </div>
                    <p className="text-sm text-white whitespace-pre-wrap leading-relaxed">{m.reponse.texte}</p>
                  </div>
                )}

                {!m.reponse && m.cloture && (
                  <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-4 space-y-1">
                    <div className="text-xs font-black text-slate-400 uppercase tracking-widest">
                      Traité par la direction · {dateEtHeure(m.cloture.le)}
                    </div>
                    {m.cloture.note && <p className="text-sm text-slate-200">{m.cloture.note}</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Coordonnées directes */}
      <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Contact direct</div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">📧</span>
          <a href="mailto:direction@codekids.tg" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
            direction@codekids.tg
          </a>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-lg">⏰</span>
          <span className="text-slate-400">Lundi – Vendredi, 8h – 18h (GMT+0)</span>
        </div>
      </div>
    </div>
  );
}
