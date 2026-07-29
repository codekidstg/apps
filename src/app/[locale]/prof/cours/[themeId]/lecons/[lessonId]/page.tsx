import { createAdminClient, createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import QuestReader from "@/app/[locale]/eleve/quete/[lessonId]/QuestReader";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

export default async function ProfLessonPage({
  params,
}: {
  params: Promise<{ themeId: string; lessonId: string }>;
}) {
  const { themeId, lessonId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const admin = createAdminClient();

  const { data: lesson } = await (admin.from("lessons") as any)
    .select("id, title, xp_reward, chapter_id")
    .eq("id", lessonId)
    .single();
  if (!lesson) notFound();

  const { data: chapter } = await admin.from("chapters")
    .select("id, title, theme_id")
    .eq("id", lesson.chapter_id)
    .single<{ id: string; title: string; theme_id: string }>();

  const { data: theme } = await admin.from("themes")
    .select("id, title")
    .eq("id", themeId)
    .single<{ id: string; title: string }>();

  const { data: blocksRaw } = await (admin.from("lesson_blocks") as any)
    .select("id, type, content, order_index")
    .eq("lesson_id", lessonId)
    .order("order_index");
  const blocks = (blocksRaw ?? []) as Block[];

  // Entraînements publiés liés à cette leçon
  const { data: trainings } = await (admin.from("trainings") as any)
    .select("id, title, description, xp_reward")
    .eq("lesson_id", lessonId)
    .eq("status", "published")
    .order("created_at");

  return (
    <div className="p-6 lg:p-10 bg-slate-950 min-h-screen">
      {/* Bandeau prof */}
      <div className="mb-5 flex items-center gap-3 bg-indigo-950 border border-indigo-800 rounded-2xl px-5 py-3">
        <span className="text-lg">👁️</span>
        <div className="flex-1 text-sm text-indigo-300 font-bold">
          Aperçu professeur — contenu identique à celui de l&apos;élève. Aucune progression enregistrée.
        </div>
        <Link href="/fr/prof/cours" className="text-xs font-black text-indigo-400 hover:text-white transition-colors">
          ← Retour aux cours
        </Link>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-xs font-mono mb-6 flex-wrap">
        <Link href="/fr/prof/cours" className="hover:underline" style={{ color: "#475569" }}>Mes cours</Link>
        {theme && (
          <>
            <span style={{ color: "#1e293b" }}>›</span>
            <span style={{ color: "#475569" }}>{theme.title}</span>
          </>
        )}
        {chapter && (
          <>
            <span style={{ color: "#1e293b" }}>›</span>
            <span style={{ color: "#475569" }}>{chapter.title}</span>
          </>
        )}
        <span style={{ color: "#1e293b" }}>›</span>
        <span style={{ color: "#94a3b8" }}>{lesson.title}</span>
      </div>

      {/* Header leçon */}
      <div className="mb-8 rounded-2xl p-6 relative overflow-hidden"
        style={{ background: "#0f172a", border: "1px solid #FDB81330", boxShadow: "0 0 30px #FDB81310" }}>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-5 text-9xl flex items-center justify-center select-none">⚔️</div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-mono font-black uppercase tracking-widest" style={{ color: "#FDB813" }}>⚔️ Quête</span>
          <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
            style={{ background: "#FDB81320", color: "#FDB813", border: "1px solid #FDB81340" }}>
            +{lesson.xp_reward} XP
          </span>
        </div>
        <h1 className="text-2xl font-black text-white">{lesson.title}</h1>
      </div>

      <QuestReader
        lessonId={lessonId}
        title={lesson.title}
        blocks={blocks}
        alreadyCompleted={false}
        xpReward={lesson.xp_reward}
        nextLessonId={null}
        themeId={themeId}
        savedBlockProgress={null}
        readOnly={true}
      />

      {/* Entraînements liés */}
      {(trainings ?? []).length > 0 && (
        <div className="mt-10">
          <div className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">
            💪 Entraînements associés à cette leçon
          </div>
          <div className="space-y-2">
            {(trainings ?? []).map((t: any) => (
              <Link
                key={t.id}
                href={`/fr/prof/cours/${themeId}/lecons/${lessonId}/entrainements/${t.id}`}
                className="flex items-center gap-4 bg-slate-900 border border-slate-800 hover:border-brand-orange rounded-2xl px-5 py-4 transition-colors group"
              >
                <span className="text-2xl">💪</span>
                <div className="flex-1 min-w-0">
                  <div className="font-black text-white text-sm group-hover:text-brand-orange transition-colors">{t.title}</div>
                  {t.description && <div className="text-xs text-slate-500 truncate mt-0.5">{t.description}</div>}
                </div>
                <span className="text-xs font-black text-brand-orange">+{t.xp_reward} XP</span>
                <span className="text-slate-600 group-hover:text-brand-orange transition-colors">→</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
