import webpush from "web-push";

// Clés VAPID à générer une fois : npx web-push generate-vapid-keys
// Puis ajouter dans les variables d'env Vercel :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL ?? "contact@codekids.tg"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
}

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
};

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: PushPayload,
): Promise<boolean> {
  if (!process.env.VAPID_PUBLIC_KEY) return false;
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return true;
  } catch (err: any) {
    // 410 Gone = subscription expirée
    if (err?.statusCode === 410) return false;
    console.error("push error:", err?.message);
    return false;
  }
}

export const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
