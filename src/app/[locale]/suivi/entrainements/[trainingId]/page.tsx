import { redirect, notFound } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";

type Block = { id: string; type: string; content: Record<string, unknown>; order_index: number };

function BlockViewer({ block }: { block: Block }) {
  const raw = block.content as any;

  if (block.type === "text") {
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
        {raw.title && <div className="font-black text-white mb-2">{raw.title}</div>}
        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{raw.text ?? raw.body ?? ""}</p>
      </div>
    );
  }

  if (block.type === "quiz") {
    const options: string[] = raw.options ?? [];
    const correct: number   = raw.correct ?? 0;
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">QCM</div>
        <div className="font-bold text-white">{raw.question}</div>
        <div className="space-y-2">
          {options.map((opt, i) => (
            <div
              key={i}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold border ${
                i === correct
                  ? "bg-emerald-900/40 border-emerald-700 text-emerald-300"
                  : "bg-slate-900/40 border-slate-700/50 text-slate-400"
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${i === correct ? "bg-emerald-700 text-white" : "bg-slate-700 text-slate-500"}`}>
                {i === correct ? "✓" : String.fromCharCode(65 + i)}
              </span>
              {opt}
            </div>
          ))}
        </div>
        {raw.explanation && <div className="text-xs text-slate-400 italic border-l-2 border-slate-600 pl-3">💡 {raw.explanation}</div>}
      </div>
    );
  }

  if (block.type === "match") {
    const pairs: { left: string; right: string }[] = raw.pairs ?? [];
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Association</div>
        {raw.question && <div className="font-bold text-white">{raw.question}</div>}
        <div className="space-y-2">
          {pairs.map((p, i) => (
            <div key={i} className="flex items-center gap-3 text-sm">
              <div className="flex-1 bg-slate-900/60 rounded-xl px-3 py-2 text-slate-300 font-bold">{p.left}</div>
              <span className="text-slate-600 font-black">→</span>
              <div className="flex-1 bg-emerald-900/30 border border-emerald-800/40 rounded-xl px-3 py-2 text-emerald-300 font-bold">{p.right}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (block.type === "swipe_sort") {
    const items: { id: string; label: string; emoji?: string; correct: string }[] = raw.items ?? [];
    const categories: { id: string; label: string; color?: string }[] = raw.categories ?? [];
    const catMap = new Map(categories.map((c) => [c.id, c]));
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Tri par catégorie</div>
        {raw.question && <div className="font-bold text-white">{raw.question}</div>}
        <div className="space-y-2">
          {items.map((item) => {
            const cat = catMap.get(item.correct);
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  {item.emoji && <span>{item.emoji}</span>}
                  {item.label}
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-full bg-slate-700 text-slate-300" style={cat?.color ? { background: `${cat.color}22`, color: cat.color } : {}}>
                  {cat?.label ?? item.correct}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "drag_to_bin") {
    const items: { id: string; label: string; emoji?: string; correct: string }[] = raw.items ?? [];
    const bins: { id: string; label: string; emoji?: string; color?: string }[] = raw.bins ?? [];
    const binMap = new Map(bins.map((b) => [b.id, b]));
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Glisser dans la bonne case</div>
        {raw.question && <div className="font-bold text-white">{raw.question}</div>}
        <div className="space-y-2">
          {items.map((item) => {
            const bin = binMap.get(item.correct);
            return (
              <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2 text-slate-300 font-bold">
                  {item.emoji && <span>{item.emoji}</span>}
                  {item.label}
                </div>
                <span className="text-xs font-black px-2 py-1 rounded-full" style={{ background: `${bin?.color ?? "#334155"}22`, color: bin?.color ?? "#94a3b8" }}>
                  {bin?.emoji} {bin?.label ?? item.correct}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (block.type === "fill_blank") {
    const sentences: { id: string; before: string; after?: string; options: string[]; correct: number }[] = raw.sentences ?? [];
    return (
      <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 space-y-3">
        <div className="text-xs font-black text-slate-400 uppercase tracking-widest">Compléter la phrase</div>
        {raw.title && <div className="font-bold text-white">{raw.title}</div>}
        <div className="space-y-3">
          {sentences.map((s) => (
            <div key={s.id} className="text-sm text-slate-300 leading-relaxed">
              {s.before}
              <span className="inline-block mx-1 bg-emerald-900/40 border border-emerald-700 rounded px-2 py-0.5 text-emerald-300 font-black">
                {s.options[s.correct]}
              </span>
              {s.after}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-4 text-sm text-slate-500 italic">
      Bloc type « {block.type} »
    </div>
  );
}

export default async function SuiviTrainingDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; trainingId: string }>;
  searchParams: Promise<{ child?: string }>;
}) {
  const { locale, trainingId } = await params;
  const { child: childId } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/connexion`);

  // Vérifier que le child appartient bien à ce parent
  const { data: link } = await (supabase.from("parent_children") as any)
    .select("student_id, students(id, profiles!students_profile_id_fkey(display_name))")
    .eq("parent_id", user.id)
    .eq("student_id", childId ?? "")
    .maybeSingle();

  if (!link && childId) {
    // child inconnu → prendre le premier enfant
    redirect(`/${locale}/suivi/entrainements`);
  }

  const child = link?.students ?? null;

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

  const { data: progress } = child
    ? await (admin.from("training_progress") as any)
        .select("score, attempts, completed_at")
        .eq("student_id", child.id)
        .eq("training_id", trainingId)
        .maybeSingle()
    : { data: null };

  return (
    <div className="max-w-2xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs font-bold text-slate-500 flex-wrap">
        <Link href={`/${locale}/suivi`} className="hover:text-slate-300 transition-colors">Tableau de bord</Link>
        <span>›</span>
        <Link href={`/${locale}/suivi/entrainements${childId ? `?child=${childId}` : ""}`} className="hover:text-slate-300 transition-colors">Entraînements</Link>
        <span>›</span>
        <span className="text-white">{training.title}</span>
      </div>

      {/* Bandeau mode entraîneur */}
      <div className="flex items-center gap-3 bg-amber-900/30 border border-amber-700/40 rounded-xl px-4 py-3">
        <span className="text-xl">👁</span>
        <div>
          <div className="text-sm font-black text-amber-300">Mode Entraîneur</div>
          <div className="text-xs text-amber-500">
            Vous observez cet entraînement{child ? ` de ${child.profiles?.display_name}` : ""}. Les bonnes réponses sont affichées en vert.
          </div>
        </div>
      </div>

      {/* Header entraînement */}
      <div>
        <div className="text-xs font-black text-orange-400 uppercase tracking-widest mb-2">💪 Entraînement · +{training.xp_reward} XP</div>
        <h1 className="text-2xl font-black text-white">{training.title}</h1>
        {training.description && <p className="text-slate-400 text-sm mt-1">{training.description}</p>}
      </div>

      {/* Résultats de l'enfant */}
      {progress && (
        <div className={`flex items-center gap-4 rounded-2xl px-5 py-4 border ${progress.completed_at ? "bg-emerald-900/20 border-emerald-700/40" : "bg-slate-800/60 border-slate-700"}`}>
          <div className="text-3xl">{progress.completed_at ? "🏆" : "⏳"}</div>
          <div>
            <div className="font-black text-white">{progress.completed_at ? "Entraînement complété" : "En cours"}</div>
            <div className="text-sm text-slate-400">
              {progress.score != null && <span>Score : <strong className="text-white">{progress.score}/100</strong> · </span>}
              {progress.attempts} essai{progress.attempts > 1 ? "s" : ""}
              {progress.completed_at && (
                <span> · Terminé le {new Date(progress.completed_at).toLocaleDateString("fr-FR")}</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Blocs de l'entraînement */}
      <div className="space-y-4">
        {blocks.map((block) => (
          <BlockViewer key={block.id} block={block} />
        ))}
      </div>
    </div>
  );
}
