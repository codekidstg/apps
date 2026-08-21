export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import type { ThemeProgress } from "@/components/eleve/VillageMap";
import VillageMapClient from "@/components/eleve/VillageMapClient";

const EXPLORER_THEME_IDS = [
  "8979e87c-058c-4003-95fd-1531c649bd1d",
  "b82126de-7df6-410a-8089-5c39330a035d",
  "9277a050-62d8-4920-80a1-9114ae315e63",
  "8cfcf715-b35b-446d-b5d7-a480952c3a2d",
  "7c497d11-0cbf-4cb3-9f6f-43721b63e418",
];

const KODI_BRIEFS: Record<string, string> = {
  "L'ordinateur, la machine magique": "Amavi… je ne sais plus bouger. Apprends-moi ce qu'est une instruction.",
  "Mon premier algorithme": "Si tu m'apprends à suivre un chemin pas à pas, je pourrai quitter cette case.",
  "Gauche ou droite ?": "Il y a un croisement devant moi. Comment je sais où aller ?",
  "Le débogage — Deviens détective du code": "J'ai suivi le chemin mais je me suis coincé. Trouve mon erreur.",
  "La répétition — Kirikou dit moins pour faire plus": "Il y a 40 lampes à allumer. Si tu m'apprends à répéter, je les allume toutes d'un coup.",
  "La boucle qui fait tout": "Regarde — les routes s'éclairent. Tu m'as rendu mes jambes.",
  "Plan avant code": "Maintenant planifions ensemble le prochain quartier du village.",
};

export default async function VillePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id, level")
    .eq("profile_id", user.id)
    .single<{ id: string; level: string }>();
  if (!student) redirect("/fr/connexion");

  const admin = createAdminClient();

  const [{ data: accessRows }, { data: chaptersRaw }, { data: lessonsRaw }, { data: progressRaw }] =
    await Promise.all([
      (admin.from("student_theme_access") as any).select("theme_id").eq("student_id", student.id),
      (admin.from("chapters") as any).select("id, theme_id").order("order_index"),
      (admin.from("lessons") as any).select("id, title, chapter_id").order("order_index"),
      (supabase.from("lesson_progress") as any).select("lesson_id, status").eq("student_id", student.id),
    ]);

  const accessibleThemeIds = new Set((accessRows ?? []).map((r: { theme_id: string }) => r.theme_id));
  const progressMap = new Map((progressRaw ?? []).map((p: { lesson_id: string; status: string }) => [p.lesson_id, p.status]));

  const lessonsByChapter = new Map<string, { id: string; title: string }[]>();
  for (const l of lessonsRaw ?? []) {
    if (!lessonsByChapter.has(l.chapter_id)) lessonsByChapter.set(l.chapter_id, []);
    lessonsByChapter.get(l.chapter_id)!.push(l);
  }
  const chaptersByTheme = new Map<string, string[]>();
  for (const ch of chaptersRaw ?? []) {
    if (!chaptersByTheme.has(ch.theme_id)) chaptersByTheme.set(ch.theme_id, []);
    chaptersByTheme.get(ch.theme_id)!.push(ch.id);
  }

  function themeLessons(themeId: string) {
    return (chaptersByTheme.get(themeId) ?? []).flatMap(cid => lessonsByChapter.get(cid) ?? []);
  }

  function themeProgressLevel(themeId: string): number {
    const tl = themeLessons(themeId);
    if (!tl.length) return 0;
    const done = tl.filter(l => progressMap.get(l.id) === "completed").length;
    if (done >= tl.length) return 2;
    if (done > 0 || accessibleThemeIds.has(themeId)) return 1;
    return 0;
  }

  const villageProgress: ThemeProgress = {
    theme1: themeProgressLevel(EXPLORER_THEME_IDS[0]) as 0|1|2,
    theme2: themeProgressLevel(EXPLORER_THEME_IDS[1]) as 0|1|2,
    theme3: themeProgressLevel(EXPLORER_THEME_IDS[2]) as 0|1|2,
    theme4: themeProgressLevel(EXPLORER_THEME_IDS[3]) as 0|1|2,
    theme5: themeProgressLevel(EXPLORER_THEME_IDS[4]) as 0|1|2,
  };

  // Prochaine leçon non complétée
  const allLessons = lessonsRaw ?? [];
  const nextLesson = allLessons.find((l: { id: string; title: string }) => progressMap.get(l.id) !== "completed");
  const kodiMessage = nextLesson ? (KODI_BRIEFS[nextLesson.title] ?? undefined) : undefined;

  // Stats par quartier
  const QUARTIERS = [
    { label: "Routes du Village", color: "#d97706", emoji: "🛤️" },
    { label: "Case du Griot",     color: "#a78bfa", emoji: "🎵" },
    { label: "Bibliothèque",      color: "#3b82f6", emoji: "📚" },
    { label: "Palais des Décisions", color: "#10b981", emoji: "⚖️" },
    { label: "Galerie des Œuvres",   color: "#ec4899", emoji: "🎨" },
  ];

  const quartierStats = EXPLORER_THEME_IDS.map((tid, i) => {
    const tl = themeLessons(tid);
    const done = tl.filter(l => progressMap.get(l.id) === "completed").length;
    const level = themeProgressLevel(tid);
    return { ...QUARTIERS[i], done, total: tl.length, level };
  });

  return (
    <div className="p-8 space-y-8 max-w-2xl">
      <div>
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Village Numérique d&apos;Amavi</div>
        <h1 className="text-3xl font-black text-white">Ma Cité</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: "#475569" }}>
          Kodi compte sur toi pour rallumer le village quartier par quartier.
        </p>
      </div>

      {/* Carte plein écran */}
      <Suspense fallback={<div className="w-full h-64 rounded-2xl animate-pulse" style={{ background: "#1e293b" }} />}>
        <VillageMapClient progress={villageProgress} kodiMessage={kodiMessage} themeIds={EXPLORER_THEME_IDS} />
      </Suspense>

      {/* Statuts des quartiers */}
      <div className="space-y-3">
        <h2 className="font-black text-sm uppercase tracking-widest" style={{ color: "#475569" }}>Quartiers</h2>
        {quartierStats.map((q, i) => (
          <div key={i} className="flex items-center gap-4 rounded-xl px-5 py-3"
            style={{ background: "#1e293b", border: `1px solid ${q.level >= 1 ? q.color + "40" : "#334155"}` }}>
            <span className="text-xl">{q.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="font-black text-sm" style={{ color: q.level >= 1 ? q.color : "#475569" }}>{q.label}</div>
              <div className="text-xs font-mono mt-0.5" style={{ color: "#334155" }}>
                {q.level === 0 ? "🔒 Verrouillé" : q.level === 2 ? "✓ Complété" : `${q.done}/${q.total} leçons`}
              </div>
            </div>
            {q.level >= 1 && (
              <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: "#0f172a" }}>
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${q.total ? Math.round((q.done / q.total) * 100) : 0}%`, background: q.color }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
