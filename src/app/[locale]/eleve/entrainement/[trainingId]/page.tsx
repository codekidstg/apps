import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TrainingReader from "./TrainingReader";
import { visiteurEleve, accesEntrainement, urlRefus } from "@/lib/eleve/acces";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function TrainingPage({
  params,
}: {
  params: Promise<{ trainingId: string }>;
}) {
  const { trainingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const visiteur = await visiteurEleve(supabase, user.id);
  if (!visiteur) redirect("/fr/connexion");

  // Un entraînement suit la leçon dont il dépend : même règle d'accès.
  if (visiteur.mode === "eleve") {
    const verdict = await accesEntrainement(createAdminClient(), visiteur.studentId, trainingId);
    if (!verdict.ok) redirect(urlRefus("fr", verdict.raison));
  }
  const apercu = visiteur.mode === "apercu";

  const { data: training } = await (supabase.from("trainings") as any)
    .select("id, title, description, xp_reward, lesson_id, lessons(id, title)")
    .eq("id", trainingId)
    .single();
  if (!training) notFound();

  const { data: blocksRaw } = await (supabase.from("training_blocks") as any)
    .select("id, type, content, order_index")
    .eq("training_id", trainingId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  // En aperçu, aucune progression n'est lue ni écrite.
  const { data: progress } = apercu
    ? { data: null }
    : await (supabase.from("training_progress") as any)
        .select("status, score, attempts, completed_at")
        .eq("student_id", (visiteur as { studentId: string }).studentId)
        .eq("training_id", trainingId)
        .maybeSingle();

  return (
    <div className="p-6 lg:p-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 flex-wrap">
        <Link href="/eleve" className="hover:text-slate-300 transition-colors">Ma Cité</Link>
        <span>›</span>
        {apercu
          ? <Link href={`/eleve/quete/${training.lesson_id}`} className="hover:text-slate-300 transition-colors">← Retour à la leçon</Link>
          : <Link href="/eleve/entrainement" className="hover:text-slate-300 transition-colors">Mon Entraînement</Link>}
        <span>›</span>
        <span className="text-white">{training.title}</span>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-black text-brand-orange uppercase tracking-widest mb-2">
          💪 Entraînement · +{training.xp_reward} XP
        </div>
        <h1 className="text-3xl font-black text-white">{training.title}</h1>
        {training.description && (
          <p className="text-slate-400 mt-2 text-sm">{training.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4 flex-wrap">
          <span className="text-xs text-slate-500">📖 Leçon liée : <span className="text-slate-300 font-bold">{training.lessons?.title}</span></span>
          {progress?.attempts > 0 && (
            <>
              <span className="text-slate-700">·</span>
              <span className="text-xs text-slate-500">{progress.attempts} tentative{progress.attempts > 1 ? "s" : ""}</span>
              {progress.score != null && (
                <span className="text-xs text-emerald-400 font-bold">Meilleur : {progress.score}%</span>
              )}
            </>
          )}
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏗️</div>
          <div className="text-xl font-black text-white mb-2">Entraînement en cours de préparation</div>
          <p className="text-slate-400 text-sm">Ton prof est en train de préparer les exercices. Reviens bientôt !</p>
          <Link href="/eleve/entrainement" className="mt-6 inline-flex items-center gap-2 text-brand-orange font-bold text-sm hover:underline">
            ← Retour aux entraînements
          </Link>
        </div>
      ) : (
        <TrainingReader
          trainingId={trainingId}
          lessonId={training.lesson_id}
          blocks={blocks}
          xpReward={training.xp_reward}
          previousAttempts={progress?.attempts ?? 0}
          previousScore={progress?.score ?? null}
          readOnly={apercu}
        />
      )}
    </div>
  );
}
