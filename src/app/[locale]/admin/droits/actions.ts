"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { revalidateTag } from "next/cache";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single<{ role: string }>();
  if (profile?.role !== "admin") return null;
  return user;
}

export async function toggleRolePage(role: string, pageKey: string, allowed: boolean) {
  const user = await requireAdmin();
  if (!user) return { error: "Non autorisé" };

  const admin = createAdminClient();
  const { error } = await (admin.from("role_nav_config") as any).upsert(
    { role, page_key: pageKey, allowed, updated_at: new Date().toISOString() },
    { onConflict: "role,page_key" }
  );
  if (error) return { error: error.message };

  revalidateTag("nav-permissions", {} as any);
  return { success: true };
}

export async function setUserPageOverride(
  userId: string,
  pageKey: string,
  allowed: boolean | null
) {
  const user = await requireAdmin();
  if (!user) return { error: "Non autorisé" };

  const admin = createAdminClient();

  if (allowed === null) {
    // Remove override → inherit from role
    const { error } = await (admin.from("user_nav_overrides") as any)
      .delete()
      .eq("user_id", userId)
      .eq("page_key", pageKey);
    if (error) return { error: error.message };
  } else {
    const { error } = await (admin.from("user_nav_overrides") as any).upsert(
      { user_id: userId, page_key: pageKey, allowed, updated_at: new Date().toISOString() },
      { onConflict: "user_id,page_key" }
    );
    if (error) return { error: error.message };
  }

  revalidateTag("nav-permissions", {} as any);
  return { success: true };
}

export async function seedAllRoleDefaults() {
  const user = await requireAdmin();
  if (!user) return { error: "Non autorisé" };

  const { PAGES_BY_ROLE } = await import("@/lib/permissions/registry");
  const admin = createAdminClient();

  for (const [role, pages] of Object.entries(PAGES_BY_ROLE)) {
    const rows = pages.map(p => ({ role, page_key: p.key, allowed: true }));
    await (admin.from("role_nav_config") as any).upsert(rows, {
      onConflict: "role,page_key",
      ignoreDuplicates: true,
    });
  }

  revalidateTag("nav-permissions", {} as any);
  return { success: true };
}
