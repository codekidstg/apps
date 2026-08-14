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

const getRoleConfig = unstable_cache(
  async (role: string): Promise<Record<string, boolean>> => {
    const admin = createAdminClient();
    const { data } = await (admin.from("role_nav_config") as any)
      .select("page_key, allowed")
      .eq("role", role);

    if (!data || data.length === 0) {
      await seedRoleDefaults(role);
      return Object.fromEntries(
        (PAGES_BY_ROLE[role] ?? []).map(p => [p.key, true])
      );
    }
    return Object.fromEntries(
      (data as { page_key: string; allowed: boolean }[]).map(r => [r.page_key, r.allowed])
    );
  },
  ["role-nav-config"],
  { revalidate: 300, tags: ["nav-permissions"] }
);

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
        .in("role", ["manager", "teacher"])
        .order("display_name"),
    ]);

  // Build allRoleConfigs: role → { pageKey → allowed }
  const allRoleConfigs: Record<string, Record<string, boolean>> = {};
  for (const row of roleConfigRows ?? []) {
    if (!allRoleConfigs[row.role]) allRoleConfigs[row.role] = {};
    allRoleConfigs[row.role][row.page_key] = row.allowed;
  }
  // Seed missing roles with defaults
  for (const role of ["admin", "manager", "teacher"]) {
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
