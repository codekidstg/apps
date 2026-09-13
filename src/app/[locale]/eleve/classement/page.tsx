import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import AvatarSvg from "@/components/eleve/AvatarSvg";

type Avatar = { base: string; hat: string | null; accessory: string | null; color: string; accent: string | null };

type RankRow = {
  student_id: string;
  display_name: string;
  xp: number;
  streak_days: number;
  avatar: Avatar | null;
};

export default async function ClassementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/fr/connexion");

  const { data: me } = await supabase
    .from("students")
    .select("id, xp")
    .eq("profile_id", user.id)
    .single<{ id: string; xp: number }>();

  const admin = createAdminClient();

  const { data: rawRank } = await admin
    .from("students")
    .select("id, xp, streak_days, profiles!inner(display_name)")
    .order("xp", { ascending: false })
    .limit(20) as any;

  // Le robot que chacun s'est construit ne se voyait que dans sa propre barre
  // latérale : personne ne le croisait jamais. Le classement est le seul écran
  // où les élèves se regardent — c'est là qu'il a sa place.
  const idsClasses = (rawRank ?? []).map((r: any) => r.id);
  const { data: avatarsRaw, error: errAvatars } = idsClasses.length
    ? await (admin.from("student_avatar") as any).select("*").in("student_id", idsClasses)
    : { data: [], error: null };
  if (errAvatars) console.error("[classement] avatars:", errAvatars.message);
  const parEleve = new Map<string, Avatar>(
    (avatarsRaw ?? []).map((a: any) => [a.student_id as string, a as Avatar]),
  );

  const ranking: RankRow[] = (rawRank ?? []).map((r: any) => ({
    student_id: r.id,
    display_name: r.profiles?.display_name ?? "???",
    xp: r.xp ?? 0,
    streak_days: r.streak_days ?? 0,
    avatar: parEleve.get(r.id) ?? null,
  }));

  const myRank = ranking.findIndex((r) => r.student_id === me?.id) + 1;
  const medals = ["🥇", "🥈", "🥉"];
  const podiumColors = ["#FDB813", "#94a3b8", "#f97316"];

  return (
    <div className="p-8 max-w-2xl">
      {/* HUD header */}
      <div className="mb-8">
        <div className="text-xs font-mono tracking-widest uppercase mb-1" style={{ color: "#FDB813" }}>◈ Arena</div>
        <h1 className="text-2xl font-black text-white">🏆 Classement</h1>
        <p className="text-sm mt-1" style={{ color: "#475569" }}>
          Top 20 · mis à jour en temps réel
        </p>
      </div>

      {/* Ma position */}
      {myRank > 0 && (
        <div className="mb-6 rounded-2xl px-5 py-4 flex items-center justify-between"
          style={{
            background: "#FDB81315",
            border: "1.5px solid #FDB81340",
            boxShadow: "0 0 20px #FDB81310",
          }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📍</span>
            <div>
              <div className="font-black text-white">Ta position</div>
              <div className="text-sm font-mono" style={{ color: "#94a3b8" }}>#{myRank} · {(me?.xp ?? 0).toLocaleString()} XP</div>
            </div>
          </div>
          {myRank > 3 && ranking[2]?.xp - (me?.xp ?? 0) > 0 && (
            <div className="text-sm font-black" style={{ color: "#FDB813" }}>
              {(ranking[2].xp - (me?.xp ?? 0)).toLocaleString()} XP pour le podium
            </div>
          )}
        </div>
      )}

      <div className="space-y-2">
        {ranking.map((row, i) => {
          const isMe = row.student_id === me?.id;
          const rank = i + 1;
          const isPodium = rank <= 3;
          return (
            <div
              key={row.student_id}
              className="flex items-center gap-4 rounded-2xl px-5 py-4 transition-all"
              style={{
                background: isMe ? "#FDB81312" : isPodium ? "#ffffff08" : "#1e293b",
                border: isMe
                  ? "1.5px solid #FDB81350"
                  : isPodium ? `1px solid ${podiumColors[rank - 1]}30`
                  : "1px solid #334155",
                boxShadow: isMe ? "0 0 15px #FDB81310" : "none",
              }}
            >
              <div className="w-10 text-center shrink-0">
                {isPodium ? (
                  <span className="text-2xl">{medals[rank - 1]}</span>
                ) : (
                  <span className="text-sm font-black font-mono" style={{ color: "#334155" }}>#{rank}</span>
                )}
              </div>

              <div className="shrink-0 relative" style={{ width: 40, height: 40 }}>
                <div className="absolute inset-0 rounded-full blur-md opacity-25"
                  style={{ background: row.avatar?.color ?? "#475569" }} />
                <AvatarSvg
                  base={row.avatar?.base}
                  hat={row.avatar?.hat}
                  accessory={row.avatar?.accessory}
                  color={row.avatar?.color ?? "#475569"}
                  accent={row.avatar?.accent}
                  size={40}
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-black truncate" style={{ color: isMe ? "#FDB813" : isPodium ? podiumColors[rank - 1] : "white" }}>
                  {row.display_name}
                  {isMe && <span className="ml-2 text-xs font-bold" style={{ color: "#94a3b8" }}>← toi</span>}
                </div>
                {row.streak_days > 1 && (
                  <div className="text-xs mt-0.5 font-mono" style={{ color: "#475569" }}>🔥 {row.streak_days}j de suite</div>
                )}
              </div>

              <div className="font-black shrink-0 font-mono">
                <span style={{ color: isMe ? "#FDB813" : isPodium ? podiumColors[rank - 1] : "#94a3b8" }}>
                  {row.xp.toLocaleString()}
                </span>
                <span className="text-xs ml-1" style={{ color: "#334155" }}>XP</span>
              </div>
            </div>
          );
        })}

        {ranking.length === 0 && (
          <div className="text-center py-16" style={{ color: "#475569" }}>
            Personne dans le classement pour l&apos;instant… sois le premier !
          </div>
        )}
      </div>
    </div>
  );
}
