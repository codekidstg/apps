import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import StatusBadge, { LevelBadge } from "@/components/backoffice/StatusBadge";
import ThemeEditor from "./ThemeEditor";
import type { ContentStatus } from "@/lib/supabase/types";

type Lesson = { id: string; title: string; xp_reward: number; order_index: number; estimated_minutes: number | null; status: "draft" | "validated" | "published" | "archived" };
type Chapter = {
  id: string; title: string; description: string | null;
  order_index: number; estimated_minutes: number | null;
  lessons: Lesson[];
};
type Theme = {
  id: string; title: string; description: string | null; level: string;
  status: string; version: number; estimated_hours: number | null;
  created_by: string;
};

export default async function ThemePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/connexion");

  const { data: theme } = await supabase
    .from("themes")
    .select("id, title, description, level, status, version, estimated_hours, created_by")
    .eq("id", id)
    .single<Theme>();

  if (!theme) notFound();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, title, description, order_index, estimated_minutes")
    .eq("theme_id", id)
    .order("order_index");

  // Fetch lessons for each chapter
  const chaptersWithLessons: Chapter[] = await Promise.all(
    ((chapters ?? []) as any[]).map(async (chapter) => {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, xp_reward, order_index, estimated_minutes, status")
        .eq("chapter_id", chapter.id)
        .order("order_index");
      return { ...chapter, lessons: lessons ?? [] };
    })
  );

  const isAdmin = (user.app_metadata?.role as string | undefined) === "admin";
  const canEdit = isAdmin || (theme.status === "draft" && theme.created_by === user.id);

  return (
    <div>
      <PageHeader
        title={theme.title}
        breadcrumb={[
          { label: "Mes thèmes", href: "/manager/themes" },
          { label: theme.title },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <LevelBadge level={theme.level} />
            <StatusBadge status={theme.status as ContentStatus} />
          </div>
        }
      />
      <div className="p-8">
        <ThemeEditor
          theme={theme}
          chapters={chaptersWithLessons}
          canEdit={canEdit}
          userId={user.id}
        />
      </div>
    </div>
  );
}
