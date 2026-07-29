import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CityMap from "@/components/eleve/CityMapLoader";

export default async function VillePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();

  const { data: lessonsRaw } = await supabase
    .from("lessons")
    .select("id, title, chapter_id, order_index")
    .order("order_index");

  const { data: progressRaw } = student
    ? await (supabase.from("lesson_progress") as any)
        .select("lesson_id, status")
        .eq("student_id", student.id)
    : { data: [] };

  const progressMap = new Map((progressRaw ?? []).map((p: { lesson_id: string; status: string }) => [p.lesson_id, p.status]));

  const ZONE_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b"];
  const ZONE_ICONS  = ["🏛️", "🔁", "🌉", "🧪"];

  const { data: chaptersRaw } = await supabase
    .from("chapters")
    .select("id, order_index")
    .order("order_index");

  const chapterOrder = new Map((chaptersRaw ?? []).map((c: { id: string; order_index: number }) => [c.id, c.order_index]));

  const lessons = (lessonsRaw ?? []).map((l: { id: string; title: string; chapter_id: string; order_index: number }) => ({
    id:        l.id,
    title:     l.title,
    completed: progressMap.get(l.id) === "completed",
    x:         0, y: 0,
    zoneColor: ZONE_COLORS[chapterOrder.get(l.chapter_id) ?? 0] ?? "#3b82f6",
    zoneIcon:  ZONE_ICONS[chapterOrder.get(l.chapter_id)  ?? 0] ?? "🏛️",
  }));

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-white">🗺️ La Carte de ta Cité</h1>
        <p className="text-slate-400 text-sm mt-1">
          Clique sur une leçon pour commencer la quête. Les bâtiments s'illuminent quand tu complètes une zone !
        </p>
      </div>
      <CityMap lessons={lessons} />
      <div className="mt-4 flex gap-4 flex-wrap text-xs font-bold text-slate-400">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-400 inline-block" /> Leçon complétée</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-500 inline-block" /> À compléter</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-blue-700 inline-block" /> Bâtiment débloqué</span>
        <span className="flex items-center gap-1.5"><span className="w-4 h-4 rounded bg-slate-700 inline-block" /> Bâtiment verrouillé</span>
      </div>
    </div>
  );
}
