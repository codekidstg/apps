"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

// ── Rate limiting en mémoire ─────────────────────────────────────
// Max 5 tentatives par IP toutes les 15 minutes
const WINDOW_MS    = 15 * 60 * 1000; // 15 min
const MAX_ATTEMPTS = 5;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

async function getClientIp(): Promise<string> {
  const hdrs = await headers();
  return (
    (hdrs.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    hdrs.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
  const now   = Date.now();
  let bucket  = buckets.get(ip);

  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }

  bucket.count++;
  const remaining = Math.max(0, MAX_ATTEMPTS - bucket.count);
  const resetIn   = Math.ceil((bucket.resetAt - now) / 1000 / 60);

  // Nettoyage basique pour éviter une fuite mémoire
  if (buckets.size > 10_000) {
    for (const [key, val] of buckets) {
      if (now > val.resetAt) buckets.delete(key);
    }
  }

  return { allowed: bucket.count <= MAX_ATTEMPTS, remaining, resetIn };
}

// ── Destinations par rôle ────────────────────────────────────────
const ROLE_REDIRECTS: Record<string, string> = {
  admin:   "/admin",
  manager: "/manager",
  teacher: "/cours",
  student: "/eleve",
  parent:  "/suivi",
};

// ── Action login ─────────────────────────────────────────────────
export async function login(formData: FormData) {
  const ip = getClientIp();

  // 1. Rate limit
  const { allowed, remaining, resetIn } = checkRateLimit(ip);
  if (!allowed) {
    redirect(
      `/connexion?error=${encodeURIComponent(
        `Trop de tentatives. Réessaie dans ${resetIn} minute${resetIn > 1 ? "s" : ""}.`
      )}`
    );
  }

  // 2. Honeypot — champ caché qui ne doit jamais être rempli par un humain
  const honeypot = formData.get("website") as string | null;
  if (honeypot) {
    // Bot détecté — on fait semblant de traiter
    await new Promise((r) => setTimeout(r, 2000));
    redirect("/connexion?error=Une+erreur+est+survenue.");
  }

  const email      = (formData.get("email") as string).trim().toLowerCase();
  const password   = formData.get("password") as string;
  const redirectTo = formData.get("redirect") as string | null;

  // 3. Validation basique avant d'appeler Supabase
  if (!email || !password || password.length < 6) {
    redirect(`/connexion?error=${encodeURIComponent("Identifiants invalides.")}`);
  }

  // 4. Délai minimal anti-timing (évite de déduire si l'email existe)
  const t0 = Date.now();

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  const elapsed = Date.now() - t0;
  if (elapsed < 800) {
    await new Promise((r) => setTimeout(r, 800 - elapsed));
  }

  if (error) {
    const msg = remaining > 0
      ? `Email ou mot de passe incorrect. (${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""})`
      : `Trop de tentatives. Réessaie dans ${resetIn} minute${resetIn > 1 ? "s" : ""}.`;
    redirect(`/connexion?error=${encodeURIComponent(msg)}`);
  }

  // Succès → remettre le compteur à zéro pour cette IP
  buckets.delete(ip);

  // 5. Redirection selon le rôle
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single<{ role: string }>();

  const role        = profile?.role ?? "student";
  const destination = redirectTo ?? ROLE_REDIRECTS[role] ?? "/";

  redirect(destination);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/connexion");
}
