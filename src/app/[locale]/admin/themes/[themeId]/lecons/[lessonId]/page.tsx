import { createAdminClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import PageHeader from "@/components/backoffice/PageHeader";
import AdminBlockEditor from "./AdminBlockEditor";
import type { BlockType } from "@/lib/supabase/types";

type Block  = { id: string; type: BlockType; content: Record<string, unknown>; order_index: number };
type Lesson = { id: string; title: string; xp_reward: number; status?: string; chapter_id: string };

export default async function AdminLessonPage({
  params,
}: {
  params: Promise<{ themeId: string; lessonId: string; locale: string }>;
}) {
  const { themeId, lessonId, locale } = await params;
  const admin = createAdminClient();

  const [lessonRes, themeRes, blocksRes] = await Promise.all([
    (admin.from("lessons") as any)
      .select("id, title, xp_reward, chapter_id")
      .eq("id", lessonId)
      .single(),

    (admin.from("themes") as any)
      .select("title")
      .eq("id", themeId)
      .single(),

    (admin.from("lesson_blocks") as any)
      .select("id, type, content, order_index")
      .eq("lesson_id", lessonId)
      .order("order_index"),
  ]);

  const lesson = lessonRes.data as Lesson | null;
  const theme  = themeRes.data as { title: string } | null;
  const blocks = blocksRes.data as Block[] | null;

  if (!lesson) notFound();

  const { data: chapter } = await (admin.from("chapters") as any)
    .select("title")
    .eq("id", lesson.chapter_id)
    .single() as { data: { title: string } | null };

  const studentPreviewUrl = `/${locale}/eleve/themes/${themeId}/lecons/${lessonId}`;

  return (
    <div>
      <PageHeader
        title={lesson.title}
        subtitle={`${lesson.xp_reward} XP · ${blocks?.length ?? 0} bloc(s) · ${lesson.status}`}
        breadcrumb={[
          { label: "Thèmes & Cours",             href: `/${locale}/admin/themes` },
          { label: theme?.title ?? "Thème" },
          { label: chapter?.title ?? "Chapitre" },
          { label: lesson.title },
        ]}
        actions={
          <a
            href={studentPreviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl transition-colors"
          >
            👁 Aperçu élève
          </a>
        }
      />

      <div className="px-8 pb-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800 font-medium flex items-center gap-2 max-w-3xl">
          <span className="text-base">⚠️</span>
          <span>Les blocs <strong>Jeu</strong> (Kodi, Labyrinthe…) se configurent dans l'interface Manager. Ici vous pouvez éditer tous les autres types de blocs avec l'éditeur visuel complet.</span>
        </div>
      </div>

      <div className="p-8 pt-2 max-w-3xl">
        <AdminBlockEditor
          blocks={blocks ?? []}
          lessonId={lessonId}
          themeId={themeId}
        />
      </div>
    </div>
  );
}
