import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import TrainingBlockEditor from "./TrainingBlockEditor";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function TrainingEditPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string; trainingId: string }>;
}) {
  const { id: themeId, lessonId, trainingId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: training } = await (supabase.from("trainings") as any)
    .select("id, title, description, xp_reward, lessons(title)")
    .eq("id", trainingId)
    .single();
  if (!training) notFound();

  const { data: theme } = await supabase
    .from("themes")
    .select("title")
    .eq("id", themeId)
    .single<{ title: string }>();

  const { data: blocksRaw } = await (supabase.from("training_blocks") as any)
    .select("id, type, content, order_index")
    .eq("training_id", trainingId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  // Blocs de la leçon source pour duplication rapide
  const { data: lessonBlocksRaw } = await (supabase.from("lesson_blocks") as any)
    .select("id, type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  const lessonBlocks = (lessonBlocksRaw ?? []) as Block[];

  return (
    <div>
      <PageHeader
        title={training.title}
        subtitle={`Entraînement · ${training.xp_reward} XP · ${blocks.length} bloc(s)`}
        breadcrumb={[
          { label: "Mes thèmes", href: "/manager/themes" },
          { label: theme?.title ?? "Thème", href: `/manager/themes/${themeId}` },
          { label: training.lessons?.title ?? "Leçon", href: `/manager/themes/${themeId}/lecons/${lessonId}` },
          { label: "Entraînements" },
          { label: training.title },
        ]}
      />
      <div className="p-8 max-w-3xl">
        {/* Info banner */}
        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-6 py-4 mb-8 flex items-start gap-3">
          <span className="text-2xl shrink-0">💪</span>
          <div>
            <div className="font-black text-ink text-sm">Entraînement lié à : {training.lessons?.title}</div>
            <div className="text-xs text-ink-muted mt-0.5">
              Types de blocs disponibles : Quiz, Défi code, Texte. Les jeux ne sont pas disponibles en entraînement.
            </div>
          </div>
        </div>
        <TrainingBlockEditor
          blocks={blocks}
          lessonBlocks={lessonBlocks}
          trainingId={trainingId}
          lessonId={lessonId}
          themeId={themeId}
        />
      </div>
    </div>
  );
}
