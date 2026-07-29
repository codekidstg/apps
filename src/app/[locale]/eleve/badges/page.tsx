import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BADGE_ORDER, BADGES } from "@/lib/gamification/badges";

export default async function BadgesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", user.id)
    .single<{ id: string }>();

  const { data: achievementsRaw } = student
    ? await (supabase.from("student_achievements") as any)
        .select("badge_id, earned_at")
        .eq("student_id", student.id)
    : { data: [] };

  const list = (achievementsRaw ?? []) as { badge_id: string; earned_at: string }[];
  const earned = new Set(list.map((a) => a.badge_id));
  const earnedMap = new Map(list.map((a) => [a.badge_id, a.earned_at]));

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Collection</div>
        <h1 className="text-2xl font-black text-white">Mes Badges</h1>
        <p className="text-sm mt-1 font-mono" style={{ color: "#475569" }}>
          <span style={{ color: earned.size > 0 ? "#10b981" : "#475569" }}>{earned.size}</span>
          <span style={{ color: "#334155" }}> / {BADGE_ORDER.length}</span>
          <span> débloqués</span>
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {BADGE_ORDER.map((id) => {
          const badge = BADGES[id];
          const isEarned = earned.has(id);
          const earnedAt = earnedMap.get(id);

          return (
            <div
              key={id}
              className="rounded-2xl p-5 flex items-center gap-4 transition-all"
              style={{
                background: isEarned ? "#1e293b" : "#0f172a",
                border: isEarned ? `1px solid ${badge.color}40` : "1px solid #1e293b",
                boxShadow: isEarned ? `0 0 20px ${badge.color}15` : "none",
                opacity: isEarned ? 1 : 0.4,
              }}
            >
              <div className={`text-4xl ${isEarned ? "" : "grayscale opacity-30"}`}>{badge.icon}</div>
              <div className="min-w-0">
                <div className="font-black text-sm" style={{ color: isEarned ? "white" : "#334155" }}>{badge.name}</div>
                <div className="text-xs mt-0.5" style={{ color: "#475569" }}>{badge.description}</div>
                {isEarned && earnedAt && (
                  <div className="text-xs mt-1.5 font-black" style={{ color: badge.color }}>
                    +{badge.xpBonus} XP · {new Date(earnedAt).toLocaleDateString("fr-FR")}
                  </div>
                )}
                {!isEarned && (
                  <div className="text-xs mt-1 font-mono" style={{ color: "#334155" }}>🔒 Verrouillé</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
