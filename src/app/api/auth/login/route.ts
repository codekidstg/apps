import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { routing } from "@/i18n/routing";

/**
 * Locale de la redirection après connexion.
 *
 * Elle était déduite du chemin de la requête — or ce chemin est
 * `/api/auth/login`, donc le premier segment vaut « api ». Toute connexion
 * réussie redirigeait vers `/api/admin` au lieu de `/fr/admin` : en production
 * cette URL renvoie vers /connexion, si bien que l'utilisateur, authentifié et
 * son cookie posé, retombait sur la page de connexion — indiscernable d'un
 * mauvais mot de passe.
 *
 * On lit donc la locale envoyée par le formulaire, et on ne retient qu'une
 * valeur réellement supportée.
 */
const LOCALES = new Set<string>(routing.locales);

function localeValide(...candidats: (string | null | undefined)[]) {
  for (const c of candidats) if (c && LOCALES.has(c)) return c;
  return routing.defaultLocale;
}

const WINDOW_MS    = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function checkRateLimit(ip: string) {
  const now = Date.now();
  let bucket = buckets.get(ip);
  if (!bucket || now > bucket.resetAt) {
    bucket = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, bucket);
  }
  bucket.count++;
  if (buckets.size > 10_000) {
    for (const [k, v] of buckets) if (now > v.resetAt) buckets.delete(k);
  }
  return { allowed: bucket.count <= MAX_ATTEMPTS, remaining: Math.max(0, MAX_ATTEMPTS - bucket.count), resetIn: Math.ceil((bucket.resetAt - now) / 60000) };
}

const ROLE_DESTINATIONS: Record<string, string> = {
  admin:   "/admin",
  manager: "/manager",
  teacher: "/cours",
  student: "/eleve",
  parent:  "/suivi",
};

function getBase(req: NextRequest) {
  const host = req.headers.get("host") ?? "localhost:3000";
  const proto = req.headers.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function errRedirect(msg: string, locale = "fr", req?: NextRequest) {
  const base = req ? getBase(req) : "http://localhost:3000";
  return NextResponse.redirect(
    new URL(`/${locale}/connexion?error=${encodeURIComponent(msg)}`, base),
    { status: 303 }
  );
}

export async function POST(req: NextRequest) {
  // Le corps est lu avant le compteur de tentatives : c'est lui qui porte la
  // locale, et un message d'erreur doit déjà pouvoir être redirigé correctement.
  const body = await req.formData();
  const locale = localeValide(body.get("locale") as string | null);

  // Rate limit
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  const { allowed, remaining, resetIn } = checkRateLimit(ip);
  if (!allowed) return errRedirect(`Trop de tentatives. Réessaie dans ${resetIn} minute${resetIn > 1 ? "s" : ""}.`, locale, req);

  if (body.get("website")) {
    await new Promise(r => setTimeout(r, 2000));
    return errRedirect("Une erreur est survenue.", locale, req);
  }

  const email      = ((body.get("email") as string) ?? "").trim().toLowerCase();
  const password   = (body.get("password") as string) ?? "";
  const redirectTo = (body.get("redirect") as string) ?? null;

  if (!email || !password || password.length < 6) return errRedirect("Identifiants invalides.", locale, req);

  // Build Supabase client with response cookies
  const cookieStore = await cookies();
  const response = NextResponse.redirect("http://placeholder", { status: 303 });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const t0 = Date.now();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  const elapsed = Date.now() - t0;
  if (elapsed < 800) await new Promise(r => setTimeout(r, 800 - elapsed));

  if (error) {
    const msg = remaining > 0
      ? `Email ou mot de passe incorrect. (${remaining} tentative${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""})`
      : `Trop de tentatives. Réessaie dans ${resetIn} min.`;
    return errRedirect(msg, locale, req);
  }

  buckets.delete(ip);

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile }  = await supabase.from("profiles").select("role").eq("id", user!.id).single<{ role: string }>();
  const role = profile?.role ?? "student";
  const dest = redirectTo ?? ROLE_DESTINATIONS[role] ?? "/";
  const destination = dest.startsWith(`/${locale}`) ? dest : `/${locale}${dest}`;

  const base = getBase(req);
  response.headers.set("Location", new URL(destination, base).toString());

  return response;
}
