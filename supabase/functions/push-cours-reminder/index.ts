// Supabase Edge Function — push-cours-reminder
// Appelée chaque heure via pg_cron
// Envoie une notification push aux parents/élèves dont un cours commence dans 60 min

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const webpush = await import("https://esm.sh/web-push@3.6.7");

Deno.serve(async (req) => {
  const authHeader = req.headers.get("Authorization");
  if (authHeader !== `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const vapidPublic  = Deno.env.get("VAPID_PUBLIC_KEY")!;
  const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY")!;
  const vapidEmail   = Deno.env.get("VAPID_EMAIL") ?? "contact@codekids.tg";

  if (!vapidPublic || !vapidPrivate) {
    return new Response("VAPID keys missing", { status: 500 });
  }

  webpush.setVapidDetails(`mailto:${vapidEmail}`, vapidPublic, vapidPrivate);

  const now = new Date();
  const in60 = new Date(now.getTime() + 60 * 60 * 1000);
  const nowTime  = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const in60Time = `${String(in60.getHours()).padStart(2, "0")}:${String(in60.getMinutes()).padStart(2, "0")}`;
  const todayWeekday = now.getDay();

  // Sessions récurrentes qui commencent dans ~60 min aujourd'hui
  const { data: sessions } = await (supabase.from("teacher_sessions") as any)
    .select("id, title, teacher_id, start_time, duration_min, students(id, profile_id, parent_children(parent_id))")
    .eq("session_type", "recurring")
    .eq("weekday", todayWeekday)
    .gte("start_time", nowTime)
    .lte("start_time", in60Time);

  let notified = 0;
  for (const session of sessions ?? []) {
    const recipientIds: string[] = [];
    for (const student of session.students ?? []) {
      if (student.profile_id) recipientIds.push(student.profile_id);
      for (const pc of student.parent_children ?? []) {
        if (pc.parent_id) recipientIds.push(pc.parent_id);
      }
    }

    for (const userId of [...new Set(recipientIds)]) {
      const { data: subs } = await (supabase.from("push_subscriptions") as any)
        .select("subscription")
        .eq("user_id", userId);

      for (const { subscription } of subs ?? []) {
        try {
          await webpush.sendNotification(
            subscription,
            JSON.stringify({
              title: "📅 Cours dans 1 heure",
              body:  `"${session.title}" commence à ${session.start_time.slice(0, 5)}`,
              icon:  "/icons/icon-192.png",
              url:   "/fr/suivi",
              tag:   `cours-${session.id}-${now.toISOString().slice(0, 10)}`,
            }),
          );
          notified++;
        } catch {
          // Subscription expirée — on ne nettoie pas ici pour rester simple
        }
      }
    }
  }

  return new Response(JSON.stringify({ notified }), {
    headers: { "Content-Type": "application/json" },
  });
});
