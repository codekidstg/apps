import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single<{ role: string }>();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const admin = createAdminClient();
  const { data: users } = await (admin.from("profiles") as any)
    .select("id, display_name, role, created_at, students(xp, level_num, streak_days, last_activity)")
    .order("created_at", { ascending: false });

  const rows = [
    ["ID", "Nom", "Rôle", "XP", "Niveau", "Streak", "Dernière activité", "Créé le"],
    ...(users ?? []).map((u: any) => [
      u.id,
      u.display_name ?? "",
      u.role ?? "",
      u.students?.[0]?.xp ?? "",
      u.students?.[0]?.level_num ?? "",
      u.students?.[0]?.streak_days ?? "",
      u.students?.[0]?.last_activity ?? "",
      u.created_at ? new Date(u.created_at).toLocaleDateString("fr-FR") : "",
    ]),
  ];

  const csv = rows.map((r) => r.map((v: unknown) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="codekids-utilisateurs-${date}.csv"`,
    },
  });
}
