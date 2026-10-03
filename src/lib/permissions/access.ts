import { createAdminClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";
import { PAGES_BY_ROLE } from "./registry";

async function seedRoleDefaults(role: string) {
  const admin = createAdminClient();
  const pages = PAGES_BY_ROLE[role] ?? [];
  if (pages.length === 0) return;
  const rows = pages.map(p => ({ role, page_key: p.key, allowed: true }));
  await (admin.from("role_nav_config") as any).upsert(rows, {
    onConflict: "role,page_key",
    ignoreDuplicates: true,
  });
}

/**
 * Les lignes de la base, et elles seules.
 *
 * Ce cache survit aux déploiements : sur Vercel, le Data Cache n'est pas vidé
 * quand on met le code à jour. Il ne doit donc contenir que ce qui vient de la
 * base — jamais le résultat d'un calcul fait avec le registre, sinon une page
 * ajoutée au registre reste absente du menu tant que l'entrée n'a pas expiré.
 * C'est exactement ce qui est arrivé à « Mon atelier » : le code était en
 * ligne, la page n'apparaissait nulle part.
 */
const getRoleRows = unstable_cache(
  async (role: string): Promise<{ page_key: string; allowed: boolean }[]> => {
    const admin = createAdminClient();
    const { data } = await (admin.from("role_nav_config") as any)
      .select("page_key, allowed")
      .eq("role", role);

    const rows  = (data ?? []) as { page_key: string; allowed: boolean }[];
    const pages = PAGES_BY_ROLE[role] ?? [];
    const known = new Set(rows.map(r => r.page_key));

    // Une page ajoutée au registre après coup n'a pas encore de ligne en base.
    // On la sème (ignoreDuplicates préserve les choix existants) pour qu'elle
    // apparaisse dans /admin/droits avec un vrai toggle. Le menu, lui, n'attend
    // pas cette ligne : le défaut est appliqué plus bas, à chaque requête.
    if (pages.some(p => !known.has(p.key))) await seedRoleDefaults(role);

    return rows;
  },
  ["role-nav-rows"],
  { revalidate: 300, tags: ["nav-permissions"] }
);

async function getRoleConfig(role: string): Promise<Record<string, boolean>> {
  const rows  = await getRoleRows(role);
  const pages = PAGES_BY_ROLE[role] ?? [];

  // Défaut « activé », puis la base a le dernier mot. Sans ce défaut, toute
  // nouvelle page resterait invisible partout jusqu'à activation manuelle —
  // et l'UI de /admin/droits, elle, l'affiche déjà comme activée (`?? true`).
  const config: Record<string, boolean> = Object.fromEntries(pages.map(p => [p.key, true]));
  for (const r of rows) config[r.page_key] = r.allowed;
  return config;
}

const getUserOverrides = unstable_cache(
  async (userId: string): Promise<Record<string, boolean>> => {
    const admin = createAdminClient();
    const { data } = await (admin.from("user_nav_overrides") as any)
      .select("page_key, allowed")
      .eq("user_id", userId);

    return Object.fromEntries(
      (data ?? []).map((r: any) => [r.page_key, r.allowed as boolean])
    );
  },
  ["user-nav-overrides"],
  { revalidate: 300, tags: ["nav-permissions"] }
);

/** Returns the set of allowed page keys for a user (role defaults + individual overrides). */
export async function getEffectiveNavPermissions(
  userId: string,
  role: string
): Promise<Set<string>> {
  const [roleConfig, overrides] = await Promise.all([
    getRoleConfig(role),
    getUserOverrides(userId),
  ]);

  const allowed = new Set<string>();
  for (const [key, isAllowed] of Object.entries(roleConfig)) {
    if (isAllowed) allowed.add(key);
  }
  for (const [key, isAllowed] of Object.entries(overrides)) {
    if (isAllowed) allowed.add(key);
    else allowed.delete(key);
  }
  return allowed;
}

/** Returns full permission data for the droits admin page. */
export async function getDroitsPageData() {
  const admin = createAdminClient();

  const [{ data: roleConfigRows }, { data: overrideRows }, { data: users }] =
    await Promise.all([
      (admin.from("role_nav_config") as any).select("role, page_key, allowed"),
      (admin.from("user_nav_overrides") as any).select("user_id, page_key, allowed"),
      (admin.from("profiles") as any)
        .select("id, display_name, role")
        .in("role", ["manager", "teacher", "parent", "student"])
        .order("display_name"),
    ]);

  // Build allRoleConfigs: role → { pageKey → allowed }
  const allRoleConfigs: Record<string, Record<string, boolean>> = {};
  for (const row of roleConfigRows ?? []) {
    if (!allRoleConfigs[row.role]) allRoleConfigs[row.role] = {};
    allRoleConfigs[row.role][row.page_key] = row.allowed;
  }
  // Seed missing roles with defaults
  for (const role of ["admin", "manager", "teacher", "parent", "student"]) {
    if (!allRoleConfigs[role]) {
      allRoleConfigs[role] = Object.fromEntries(
        (PAGES_BY_ROLE[role] ?? []).map(p => [p.key, true])
      );
    }
  }

  // Build allUserOverrides: userId → { pageKey → allowed }
  const allUserOverrides: Record<string, Record<string, boolean>> = {};
  for (const row of overrideRows ?? []) {
    if (!allUserOverrides[row.user_id]) allUserOverrides[row.user_id] = {};
    allUserOverrides[row.user_id][row.page_key] = row.allowed;
  }

  return {
    allRoleConfigs,
    allUserOverrides,
    users: (users ?? []) as { id: string; display_name: string; role: string }[],
  };
}
