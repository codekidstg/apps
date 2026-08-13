import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// Rate limiter partagé — nécessite UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
// En l'absence de Redis (dev local), on bypass silencieusement
function createLimiter(requests: number, window: `${number} ${"s" | "m" | "h"}`) {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  return new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: false,
  });
}

// Sync lessons/blockly : 30 req/minute par IP
export const syncLimiter = createLimiter(30, "1 m");

// Webhook CinetPay : 60 req/minute (appels légitimes depuis CinetPay)
export const webhookLimiter = createLimiter(60, "1 m");

export async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  if (!limiter) return { allowed: true, headers: {} };

  const { success, limit, remaining, reset } = await limiter.limit(identifier);
  return {
    allowed: success,
    headers: {
      "X-RateLimit-Limit":     String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset":     String(reset),
    },
  };
}
