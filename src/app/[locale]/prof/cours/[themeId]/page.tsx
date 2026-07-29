import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import PageHeader from "@/components/backoffice/PageHeader";
import { LevelBadge } from "@/components/backoffice/StatusBadge";
import Link from "next/link";
import type { Level, ContentStatus } from "@/lib/supabase/types";

type Theme   = { id: string; title: string; level: Level; status: ContentStatus; description: string | null; estimated_hours: number | null };
type Lesson  = { id: string; title: string; xp_reward: number; order_index: number };
type Chapter = { id: string; title: string; description: string | null; order_index: number; lessons: Lesson[] };

export default async function ProfThemePage({ params }: { params: Promise<{ themeId: string }> }) {
  const { themeId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  // Vérifier que le prof est affecté à ce thème
  const { data: assignment } = await supabase
    .from("theme_assignments")
    .select("id")
    .eq("teacher_id", user.id)
    .eq("theme_id", themeId)
    .maybeSingle();

  if (!assignment) notFound();

  const { data: themeData } = await supabase
    .from("themes")
    .select("id, title, level, status, description, estimated_hours")
    .eq("id", themeId)
    .single<Theme>();

  if (!themeData) notFound();
  const theme = themeData;

  const { data: chaptersRaw } = await supabase
    .from("chapters")
    .select("id, title, description, order_index")
    .eq("theme_id", themeId)
    .order("order_index");

  const chaptersWithLessons: Chapter[] = await Promise.all(
    (chaptersRaw ?? []).map(async (ch: Record<string, unknown>) => {
      const { data: lessons } = await supabase
        .from("lessons")
        .select("id, title, xp_reward, order_index")
        .eq("chapter_id", ch.id as string)
        .order("order_index");
      return {
        id:          ch.id as string,
        title:       ch.title as string,
        description: ch.description as string | null,
        order_index: ch.order_index as number,
        lessons:     (lessons ?? []) as Lesson[],
      };
    })
  );

  const totalLessons = chaptersWithLessons.reduce((s, c) => s + c.lessons.length, 0);

  return (
    <div>
      <PageHeader
        title={theme.title}
        breadcrumb={[{ label: "Mes cours", href: "/prof/cours" }, { label: theme.title }]}
        actions={<LevelBadge level={theme.level} />}
      />
      <div className="p-8 max-w-3xl space-y-6">

        <div className="bg-white rounded-2xl border border-cream-border p-6">
          {theme.description && <p className="text-sm text-ink-muted mb-3">{theme.description}</p>}
          <div className="flex gap-6 text-xs font-bold text-ink-light">
            <span>{chaptersWithLessons.length} chapitre(s)</span>
            <span>{totalLessons} leçon(s)</span>
            {theme.estimated_hours && <span>~{theme.estimated_hours}h</span>}
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 rounded-xl px-3 py-2 w-fit">
            🔒 Mode lecture seule — aucune modification possible
          </div>
        </div>

        <div className="space-y-3">
          {chaptersWithLessons.map((chapter, ci) => (
            <div key={chapter.id} className="bg-white rounded-2xl border border-cream-border overflow-hidden">
              <div className="flex items-center gap-4 px-6 py-4 bg-cream">
                <div className="w-8 h-8 rounded-xl bg-brand-blue text-white text-xs font-black flex items-center justify-center shrink-0">
                  {ci + 1}
                </div>
                <div>
                  <div className="font-bold text-ink">{chapter.title}</div>
                  {chapter.description && <div className="text-xs text-ink-light">{chapter.description}</div>}
                </div>
              </div>
              <div className="divide-y divide-cream-border">
                {chapter.lessons.map((lesson, li) => (
                  <Link
                    key={lesson.id}
                    href={`/prof/cours/${themeId}/lecons/${lesson.id}`}
                    className="flex items-center gap-4 px-6 py-3.5 hover:bg-cream transition-colors group"
                  >
                    <div className="w-6 h-6 rounded-lg bg-gray-100 text-ink-light text-xs font-bold flex items-center justify-center shrink-0">
                      {li + 1}
                    </div>
                    <span className="flex-1 font-bold text-sm text-ink group-hover:text-brand-orange transition-colors">
                      {lesson.title}
                    </span>
                    <span className="text-xs text-ink-light font-bold shrink-0">{lesson.xp_reward} XP</span>
                    <span className="text-xs font-extrabold text-brand-orange opacity-0 group-hover:opacity-100 transition-opacity">
                      Lire →
                    </span>
                  </Link>
                ))}
                {chapter.lessons.length === 0 && (
                  <div className="px-6 py-4 text-sm text-ink-muted italic">Aucune leçon dans ce chapitre.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
