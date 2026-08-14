import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireParentPermission } from "@/lib/permissions/parent";

async function sendMessage(formData: FormData) {
  "use server";
  const supabase = await (await import("@/lib/supabase/server")).createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string }>();

  await (supabase.from("contact_messages") as any).insert({
    parent_id: user.id,
    parent_name: profile?.display_name ?? formData.get("name"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  revalidatePath("/suivi/contact");
}

export default async function ContactPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ sent?: string }>;
}) {
  const { locale } = await params;
  const { sent } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  await requireParentPermission(user.id, "parent.contact", locale);

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single<{ display_name: string }>();

  async function handleSend(formData: FormData) {
    "use server";
    await sendMessage(formData);
    redirect(`/${locale}/suivi/contact?sent=1`);
  }

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Contacter la direction</h1>
        <p className="text-slate-400 text-sm">Une question, une remarque ? Envoyez-nous un message, nous vous répondrons sous 48h.</p>
      </div>

      {sent === "1" ? (
        <div className="bg-emerald-900/30 border border-emerald-700/40 rounded-2xl p-8 text-center space-y-3">
          <div className="text-5xl">✅</div>
          <div className="font-black text-white text-lg">Message envoyé !</div>
          <div className="text-sm text-slate-400">Nous avons bien reçu votre message. Vous recevrez une réponse par email sous 48h.</div>
          <a href={`/${locale}/suivi/contact`} className="inline-block mt-2 text-sm font-bold text-blue-400 hover:text-blue-300 transition-colors">
            Envoyer un autre message
          </a>
        </div>
      ) : (
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
