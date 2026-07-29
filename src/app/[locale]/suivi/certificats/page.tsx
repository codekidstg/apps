import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";

export default async function CertificatsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  // Enfants du parent
  const { data: links } = await (supabase.from("parent_children") as any)
    .select("student_id, students(id, profiles(display_name))")
    .eq("parent_id", user.id);

  const children = (links ?? []).map((l: any) => l.students).filter(Boolean);
  const childIds = children.map((c: any) => c.id);

  // Certificats (RLS : parent voit les certs de ses enfants)
  const admin = createAdminClient();
  const { data: certs } = childIds.length
    ? await (admin.from("certificates") as any)
        .select("id, student_id, cert_type, score, total_xp, issued_at, validated_at, verify_hash, revoked, theme_id, themes(title), level_num")
        .in("student_id", childIds)
        .eq("revoked", false)
        .order("issued_at", { ascending: false })
    : { data: [] };

  const certsByChild = new Map<string, any[]>();
  for (const child of children) certsByChild.set(child.id, []);
  for (const cert of certs ?? []) {
    certsByChild.get(cert.student_id)?.push(cert);
  }

  function certTitle(c: any) {
    const subject = (Array.isArray(c.themes) ? c.themes[0]?.title : c.themes?.title) ?? (c.level_num ? `Niveau ${c.level_num}` : "Thème complété");
    return `${c.cert_type === "theme" ? "Certificat" : "Diplôme"} — ${subject}`;
  }

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-black text-white mb-1">Certificats & Diplômes</h1>
        <p className="text-slate-400 text-sm">
          Téléchargez les attestations officielles de vos enfants. Les diplômes sont validés par le professeur.
        </p>
      </div>

      {children.map((child: any) => {
        const name = child.profiles?.display_name ?? "Élève";
        const childCerts = certsByChild.get(child.id) ?? [];
        const validated = childCerts.filter((c) => !!c.validated_at);
        const pending   = childCerts.filter((c) => !c.validated_at);

        return (
          <div key={child.id} className="space-y-4">
            {/* En-tête enfant */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-lg">👦</div>
              <h2 className="text-lg font-black text-white">{name}</h2>
              <span className="text-xs font-bold text-slate-500 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
                {childCerts.length} certificat{childCerts.length !== 1 ? "s" : ""}
              </span>
            </div>

            {childCerts.length === 0 && (
              <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-6 text-center text-sm text-slate-500">
                Aucun certificat pour l'instant
              </div>
            )}

            {/* En attente */}
            {pending.length > 0 && (
              <div className="space-y-2">
                {pending.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-amber-900/20 border border-amber-800/50 rounded-xl px-4 py-3">
                    <div>
                      <div className="font-bold text-amber-300 text-sm">
                        {c.cert_type === "theme" ? "📜" : "🎓"} {certTitle(c)}
                      </div>
                      <div className="text-xs text-amber-500 mt-0.5">Émis le {new Date(c.issued_at).toLocaleDateString("fr-FR")}</div>
                    </div>
                    <span className="text-xs font-bold text-amber-500 bg-amber-900/40 px-2 py-1 rounded-full whitespace-nowrap">⏳ En attente prof</span>
                  </div>
                ))}
              </div>
            )}

            {/* Validés */}
            {validated.length > 0 && (
              <div className="space-y-3">
                {validated.map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-2xl px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div className="text-3xl">{c.cert_type === "theme" ? "📜" : "🎓"}</div>
                      <div>
                        <div className="font-black text-white">{certTitle(c)}</div>
                        <div className="text-xs text-slate-400 mt-0.5">Score {c.score}/100 · {c.total_xp} XP</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          Validé le {new Date(c.validated_at).toLocaleDateString("fr-FR")} · Hash : {c.verify_hash}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <a
                        href={`/api/certificats/${c.id}?preview=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-white text-sm font-bold px-3 py-2.5 rounded-xl transition-colors"
                      >
                        <span>👁</span> Aperçu
                      </a>
                      <a
                        href={`/api/certificats/${c.id}`}
                        download
                        className="flex items-center gap-1.5 bg-[#1e3a6e] hover:bg-[#2a4a8e] text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                      >
                        <span>⬇</span> PDF
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
