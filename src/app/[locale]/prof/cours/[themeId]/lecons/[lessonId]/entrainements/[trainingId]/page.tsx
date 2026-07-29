import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import TrainingReader from "@/app/[locale]/eleve/entrainement/[trainingId]/TrainingReader";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function ProfTrainingPage({
  params,
}: {
  params: Promise<{ themeId: string; lessonId: string; trainingId: string }>;
}) {
  const { themeId, lessonId, trainingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const { data: training } = await (admin.from("trainings") as any)
    .select("id, title, description, xp_reward, lesson_id, lessons(id, title)")
    .eq("id", trainingId)
    .single();
  if (!training) notFound();

  const { data: blocksRaw } = await (admin.from("training_blocks") as any)
    .select("id, type, content, order_index")
    .eq("training_id", trainingId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  const lessonTitle = training.lessons?.title ?? "Leçon";

  return (
    <div className="p-6 lg:p-10">
      {/* Bandeau prof */}
      <div className="mb-5 flex items-center gap-3 bg-indigo-950 border border-indigo-800 rounded-2xl px-5 py-3">
        <span className="text-lg">👁️</span>
        <div className="flex-1 text-sm text-indigo-300 font-bold">
          Aperçu professeur — contenu identique à celui de l&apos;élève. Aucune progression enregistrée.
        </div>
        <Link
          href={`/fr/prof/cours/${themeId}/lecons/${lessonId}`}
          className="text-xs font-black text-indigo-400 hover:text-white transition-colors"
        >
          ← Retour à la leçon
        </Link>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-6 flex-wrap">
        <Link href="/fr/prof/cours" className="hover:text-slate-300 transition-colors">Mes cours</Link>
        <span>›</span>
        <Link href={`/fr/prof/cours/${themeId}/lecons/${lessonId}`} className="hover:text-slate-300 transition-colors">
          {lessonTitle}
        </Link>
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
        <div className="mt-3 text-xs text-slate-500">
          📖 Leçon liée : <span className="text-slate-300 font-bold">{lessonTitle}</span>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🏗️</div>
          <div className="text-xl font-black text-white mb-2">Entraînement en cours de préparation</div>
          <p className="text-slate-400 text-sm">Aucun bloc de contenu pour cet entraînement.</p>
        </div>
      ) : (
        <TrainingReader
          trainingId={trainingId}
          lessonId={lessonId}
          blocks={blocks}
          xpReward={training.xp_reward}
          previousAttempts={0}
          previousScore={null}
          readOnly={true}
        />
      )}
    </div>
  );
}
