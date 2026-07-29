import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ConsentForm from "./ConsentForm";

export default async function ConsentementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  // Enfants liés
  const { data: links } = await (supabase.from("parent_children") as any)
    .select("student_id, students(id, profiles(display_name))")
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => ({
    id:   l.students?.id,
    name: l.students?.profiles?.display_name ?? "Enfant",
  })).filter((c: any) => c.id);

  // Consentements existants
  const { data: existing } = await (supabase.from("parental_consents") as any)
    .select("student_id, consented_at, revoked_at, version")
    .eq("parent_id", user.id);

  const consentMap = new Map(((existing ?? []) as any[]).map((c: any) => [c.student_id, c]));

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Consentement parental</h1>
        <p className="text-slate-400 text-sm">
          Conformément au RGPD et à la protection des mineurs, votre consentement est requis
          pour activer le compte de votre enfant sur CodeKids.
        </p>
      </div>

      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 text-sm text-slate-300 space-y-3">
        <p className="font-bold text-white">En signant ce consentement, vous acceptez que CodeKids :</p>
        <ul className="space-y-1.5 list-none">
          {[
            "Collecte uniquement un pseudonyme et les progressions pédagogiques de votre enfant",
            "N'utilise aucune donnée à des fins publicitaires",
            "N'active aucun chat libre — les interactions sont limitées aux activités pédagogiques",
            "Conserve les données dans des serveurs sécurisés en Europe",
            "Vous permette de révoquer ce consentement à tout moment",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      {children.length === 0 ? (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 text-slate-400 text-sm">
          Aucun enfant lié à votre compte. Contactez l'administrateur.
        </div>
      ) : (
        <div className="space-y-4">
          {children.map((child: { id: string; name: string }) => {
            const consent = consentMap.get(child.id);
            const signed  = consent && !consent.revoked_at;
            return (
              <div key={child.id} className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="font-black text-white">{child.name}</div>
                  {signed ? (
                    <span className="bg-emerald-900 text-emerald-300 text-xs font-black px-3 py-1 rounded-full">
                      ✓ Signé le {new Date(consent.consented_at).toLocaleDateString("fr-FR")}
                    </span>
                  ) : (
                    <span className="bg-red-900 text-red-300 text-xs font-black px-3 py-1 rounded-full">
                      ⚠ Non signé
                    </span>
                  )}
                </div>
                <ConsentForm studentId={child.id} alreadySigned={!!signed} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
