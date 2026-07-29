import { createServerClient } from "@supabase/ssr";
import createIntlMiddleware from "next-intl/middleware";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

// Routes accessibles sans connexion
const PUBLIC_PATHS = ["/", "/connexion", "/inscription", "/test-maze", "/test-music"];

// Routes réservées par rôle (préfixes)
const ROLE_ROUTES: Record<string, string[]> = {
  "/admin":             ["admin"],
  "/manager":           ["admin", "manager"],
  "/prof":              ["admin", "teacher"],
  "/cours":             ["admin", "manager", "teacher"],
  "/eleve":             ["admin", "student"],
  "/tableau-de-bord":   ["admin", "manager", "student"],
  "/suivi":             ["admin", "manager", "parent"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retirer le préfixe de locale pour les vérifications (/fr/connexion → /connexion)
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(\/|$)/, "/");

  // Laisser passer les routes publiques
  const isPublic = PUBLIC_PATHS.some(
    (p) => pathWithoutLocale === p || pathWithoutLocale.startsWith(p + "?")
  );

  // Réponse de base (gestion i18n)
  const response = intlMiddleware(request);

  if (isPublic) return response;

  // Vérifier la session Supabase
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // Non connecté → page de connexion
  if (!user) {
    const loginUrl = new URL("/connexion", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Lire le rôle depuis le JWT app_metadata (identique à get_my_role() en SQL)
  const role = (user.app_metadata?.role as string | undefined) ?? "student";

  // Vérifier les droits sur les routes protégées par rôle
  for (const [routePrefix, allowedRoles] of Object.entries(ROLE_ROUTES)) {
    if (pathWithoutLocale.startsWith(routePrefix)) {
      if (!allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL("/", request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
