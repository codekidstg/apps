import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import BlockEditor from "./BlockEditor";
import { LessonPreviewModal } from "./LessonPreviewModal";
import TrainingSection from "./entrainements/TrainingSection";
import type { BlockType } from "@/lib/supabase/types";

type Block = { id: string; type: BlockType; content: Record<string, unknown>; order_index: number };
type Lesson = { id: string; title: string; xp_reward: number; theme_id: string; chapter_id: string };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ id: string; lessonId: string }>;
}) {
  const { id: themeId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, xp_reward, theme_id, chapter_id")
    .eq("id", lessonId)
    .single<Lesson>();

  if (!lesson) notFound();

  const { data: theme } = await supabase
    .from("themes")
    .select("title, status, created_by")
    .eq("id", themeId)
    .single<{ title: string; status: string; created_by: string }>();

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("id, type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index")
    .returns<Block[]>();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("title")
    .eq("id", lesson.chapter_id)
    .single<{ title: string }>();

  const userRole = user.app_metadata?.role as string | undefined;
  const isAdmin = userRole === "admin";
  const canEdit = isAdmin || (theme?.status === "draft" && theme?.created_by === user.id);

  // Trainings liés à cette leçon
  type TrainingRow = { id: string; title: string; description: string | null; xp_reward: number };
  let trainings: TrainingRow[] = [];
  try {
    const { data } = await (supabase.from("trainings") as any)
      .select("id, title, description, xp_reward")
      .eq("lesson_id", lessonId)
      .order("order_index");
    trainings = (data ?? []) as TrainingRow[];
  } catch { /* table pas encore créée */ }

  return (
    <div>
      <PageHeader
        title={lesson.title}
        subtitle={`${lesson.xp_reward} XP · ${blocks?.length ?? 0} bloc(s)`}
        breadcrumb={[
          { label: "Mes thèmes",      href: "/manager/themes" },
          { label: theme?.title ?? "Thème", href: `/manager/themes/${themeId}` },
          { label: chapter?.title ?? "Chapitre" },
          { label: lesson.title },
        ]}
        actions={
          <LessonPreviewModal
            title={lesson.title}
            xpReward={lesson.xp_reward}
            blocks={blocks ?? []}
          />
        }
      />
      <div className="p-8 max-w-3xl">
        <BlockEditor
          blocks={blocks ?? []}
          lessonId={lessonId}
          themeId={themeId}
          canEdit={canEdit}
        />
        <TrainingSection
          trainings={trainings ?? []}
          lessonId={lessonId}
          themeId={themeId}
        />
      </div>
    </div>
  );
}
