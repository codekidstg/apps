import { createAdminClient } from "@/lib/supabase/server";
import PageHeader from "@/components/backoffice/PageHeader";
import { publishTheme, rejectTheme } from "./actions";
import { SortableThemeList } from "./ThemeAccordion";
import type { ThemeRow, ChapterRow, LessonRow } from "./ThemeAccordion";
import type { ContentStatus } from "@/lib/supabase/types";

const LEVELS = [
  { key: "explorer",  label: "Explorateur",  icon: "🌱", color: "#10b981", bg: "#f0fdf4", border: "#bbf7d0" },
  { key: "builder",   label: "Bâtisseur",    icon: "🔨", color: "#f59e0b", bg: "#fffbeb", border: "#fde68a" },
  { key: "architect", label: "Architecte",   icon: "🏛️", color: "#8b5cf6", bg: "#faf5ff", border: "#e9d5ff" },
] as const;

export default async function AdminThemesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("themes")
    .select("*, profiles(display_name)")
    // Grouper par niveau d'abord : sans ça les « T0 » des trois niveaux se mélangent
    .order("level", { ascending: true })
    .order("order_index", { ascending: true });

  if (status) query = query.eq("status", status);

  const { data: rawThemes } = await query as { data: any[] | null };

  // Fetch chapters + lessons for each theme
  const themes: ThemeRow[] = await Promise.all(
    (rawThemes ?? []).map(async (t) => {
      const { data: chapters } = await (supabase
        .from("chapters")
        .select("id, title, order_index")
        .eq("theme_id", t.id)
        .order("order_index") as any) as { data: ChapterRow[] | null };

      const chaptersWithLessons: ChapterRow[] = await Promise.all(
        (chapters ?? []).map(async (ch) => {
          const { data: lessons, error: lessonsError } = await (supabase as any)
            .from("lessons")
            .select("id, title, xp_reward, order_index, status")
            .eq("chapter_id", ch.id)
            .order("order_index");

          // Si status n'existe pas encore en DB, fallback sans status
          const finalLessons: LessonRow[] = lessonsError
            ? ((await (supabase as any)
                .from("lessons")
                .select("id, title, xp_reward, order_index")
                .eq("chapter_id", ch.id)
                .order("order_index")
              ).data ?? []).map((l: any) => ({ ...l, status: "draft" as const }))
            : (lessons ?? []);

          return { ...ch, lessons: finalLessons };
        })
      );

      return {
        id: t.id,
        title: t.title,
        level: t.level,
        status: t.status,
        version: t.version,
        updated_at: t.updated_at,
        order_index: t.order_index ?? 0,
        number: (t.number as number | null) ?? null,
        description: t.description ?? null,
        profiles: t.profiles as { display_name: string } | null,
        chapters: chaptersWithLessons,
      };
    })
  );

  const statuses: { key: string; label: string }[] = [
    { key: "",          label: "Tous" },
    { key: "draft",     label: "Brouillons" },
    { key: "validated", label: "À valider" },
    { key: "published", label: "Publiés" },
    { key: "locked",    label: "Archivés" },
  ];

  const byLevel = new Map<string, ThemeRow[]>();
  for (const t of themes) {
    if (!byLevel.has(t.level)) byLevel.set(t.level, []);
    byLevel.get(t.level)!.push(t);
  }

  return (
    <div>
      <PageHeader title="Thèmes & Cours" subtitle="Workflow de publication du contenu" />

      {/* Filtres */}
      <div className="px-8 pt-6 pb-2 flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <a
            key={s.key}
            href={s.key ? `?status=${s.key}` : "?"}
            className={`px-4 py-1.5 rounded-full text-xs font-extrabold border transition-colors ${
              (status ?? "") === s.key
                ? "bg-brand-blue text-white border-brand-blue"
                : "bg-white text-ink-muted border-cream-border hover:border-brand-blue"
            }`}
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="p-8 pt-4 space-y-8">
        {LEVELS.map((lvl) => {
          const lvlThemes = byLevel.get(lvl.key) ?? [];
          if (!lvlThemes.length) return null;

          return (
            <div key={lvl.key}>
              {/* En-tête de section niveau */}
              <div
                className="flex items-center gap-3 px-5 py-3 rounded-t-2xl border-b"
                style={{ background: lvl.bg, borderColor: lvl.border }}
              >
                <span className="text-xl">{lvl.icon}</span>
                <h2 className="font-black text-base" style={{ color: lvl.color }}>
                  {lvl.label}
                </h2>
                <span
                  className="text-xs font-extrabold px-2.5 py-0.5 rounded-full"
                  style={{ background: lvl.border, color: lvl.color }}
                >
                  {lvlThemes.length} thème{lvlThemes.length > 1 ? "s" : ""}
                </span>
                <a
                  href={`/manager/themes/new?level=${lvl.key}`}
                  className="ml-auto text-xs font-extrabold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-80"
                  style={{ background: lvl.color }}
                >
                  + Nouveau thème
                </a>
              </div>

              {/* Table thèmes */}
              <div className="bg-white rounded-b-2xl border border-t-0 overflow-hidden" style={{ borderColor: lvl.border }}>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-cream-border bg-cream">
                      <th className="w-8" />
                      <th className="text-left px-3 py-3 text-xs font-extrabold uppercase tracking-widest text-ink-light">Titre</th>
                      <th className="text-left px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-ink-light w-[120px]">Statut</th>
                      <th className="text-left px-5 py-3 text-xs font-extrabold uppercase tracking-widest text-ink-light w-[110px]">Modifié</th>
                      <th className="w-[160px]" />
                    </tr>
                  </thead>
                  <SortableThemeList themes={lvlThemes} />
                </table>
              </div>
            </div>
          );
        })}

        {themes.length === 0 && (
          <div className="bg-white rounded-2xl border border-cream-border px-5 py-12 text-center text-ink-muted font-bold">
            Aucun thème trouvé.
          </div>
        )}
      </div>
    </div>
  );
}
