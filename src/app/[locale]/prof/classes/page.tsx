import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import Link from "next/link";

type ClassRow = { id: string; name: string; level: string; created_at: string };

export default async function ProfClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data } = await supabase
    .from("classes")
    .select("id, name, level, created_at")
    .eq("teacher_id", user.id)
    .order("name");

  const classes = (data ?? []) as ClassRow[];

  return (
    <div>
      <PageHeader title="Mes classes" subtitle="Gérez vos élèves et saisissez les notes" />
      <div className="p-8">
        {!classes.length ? (
          <div className="bg-white rounded-2xl border border-cream-border p-12 text-center">
            <p className="text-ink-muted font-bold">Aucune classe assignée pour le moment.</p>
            <p className="text-xs text-ink-light mt-2">Contactez l&apos;administrateur pour être affecté à une classe.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-cream-border p-6 flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-ink">{c.name}</div>
                  <div className="text-xs text-ink-light capitalize mt-0.5">{c.level}</div>
                </div>
                <Link
                  href={`/prof/classes/${c.id}`}
                  className="bg-brand-blue text-white text-sm font-extrabold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Gérer →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
