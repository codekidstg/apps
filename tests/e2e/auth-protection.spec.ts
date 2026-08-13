import { test, expect } from "@playwright/test";

test.describe("Protection des routes — utilisateur non connecté", () => {
  const protectedRoutes = [
    "/fr/eleve",
    "/fr/prof",
    "/fr/admin",
    "/fr/manager",
    "/fr/suivi",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirige vers connexion`, async ({ page }) => {
      await page.goto(route);
      await expect(page).toHaveURL(/connexion/, { timeout: 8_000 });
    });
  }

  test("Page de connexion accessible", async ({ page }) => {
    await page.goto("/fr/connexion");
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible();
  });

  test("Landing page accessible sans connexion", async ({ page }) => {
    await page.goto("/fr");
    await expect(page.getByText(/CodeKids|codeKids|Lomé/i)).toBeVisible();
  });
});
