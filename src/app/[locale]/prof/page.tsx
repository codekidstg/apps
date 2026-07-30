export const dynamic = "force-dynamic";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

type ThemeRef = { id: string; title: string };
type ClassRef  = { id: string; name: string };
type Assignment = { id: string; scheduled_at: string | null; theme: ThemeRef | null; class: ClassRef | null };
type ClassRow  = { id: string; name: string; level: string };

export default async function ProfDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const { data: assignmentsRaw } = await (admin
    .from("theme_assignments") as any)
    .select("id, scheduled_at, themes(id, title), classes(id, name)")
    .eq("teacher_id", user.id)
    .order("scheduled_at", { ascending: false });

  const assignments: Assignment[] = (assignmentsRaw ?? []).map((a: Record<string, unknown>) => ({
    id:           a.id as string,
    scheduled_at: a.scheduled_at as string | null,
    theme:        (Array.isArray(a.themes) ? a.themes[0] : a.themes) as ThemeRef | null,
    class:        (Array.isArray(a.classes) ? a.classes[0] : a.classes) as ClassRef | null,
  }));

  const { data: classesRaw } = await (admin
    .from("classes") as any)
    .select("id, name, level")
    .eq("teacher_id", user.id);

  const classes = (classesRaw ?? []) as ClassRow[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black" style={{ color: "#1B2D5E" }}>Tableau de bord</h1>
        <p className="text-xs font-bold mt-0.5" style={{ color: "#94A3B8" }}>Vos cours affectés et vos classes</p>
      </div>
      <div className="space-y-6">

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl border border-cream-border p-6 text-center">
            <div className="text-3xl font-black text-brand-blue">{assignments.length}</div>
            <div className="text-xs font-bold text-ink-light mt-1">Cours affectés</div>
          </div>
          <div className="bg-white rounded-2xl border border-cream-border p-6 text-center">
            <div className="text-3xl font-black text-brand-orange">{classes.length}</div>
            <div className="text-xs font-bold text-ink-light mt-1">Classes</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-cream-border">
          <div className="px-6 py-4 border-b border-cream-border flex justify-between items-center">
            <h2 className="font-extrabold text-ink">Mes cours affectés</h2>
            <Link href="/prof/cours" className="text-xs font-extrabold text-brand-orange hover:underline">
              Voir tout →
            </Link>
          </div>
          {!assignments.length ? (
            <div className="p-8 text-center text-ink-muted text-sm font-bold">
              Aucun cours affecté pour le moment.
            </div>
          ) : (
            <div className="divide-y divide-cream-border">
              {assignments.slice(0, 5).map((a) => (
                <div key={a.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-ink text-sm truncate">{a.theme?.title}</div>
                    <div className="text-xs text-ink-light">Classe : {a.class?.name}</div>
                  </div>
                  {a.theme?.id && (
                    <Link
                      href={`/prof/cours/${a.theme.id}`}
                      className="text-xs font-extrabold text-brand-orange hover:underline shrink-0"
                    >
                      Consulter →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-cream-border">
          <div className="px-6 py-4 border-b border-cream-border flex justify-between items-center">
            <h2 className="font-extrabold text-ink">Mes classes</h2>
            <Link href="/prof/classes" className="text-xs font-extrabold text-brand-orange hover:underline">
              Voir tout →
            </Link>
          </div>
          {!classes.length ? (
            <div className="p-8 text-center text-ink-muted text-sm font-bold">
              Aucune classe assignée.
            </div>
          ) : (
            <div className="divide-y divide-cream-border">
              {classes.map((c) => (
                <div key={c.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-ink text-sm">{c.name}</div>
                    <div className="text-xs text-ink-light capitalize">{c.level}</div>
                  </div>
                  <Link href={`/prof/classes/${c.id}`} className="text-xs font-extrabold text-brand-orange hover:underline">
                    Gérer →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
