import { test, expect } from "@playwright/test";

// Credentials de test — à définir dans .env.test
const ELEVE_EMAIL    = process.env.TEST_ELEVE_EMAIL    ?? "eleve@codekids.test";
const ELEVE_PASSWORD = process.env.TEST_ELEVE_PASSWORD ?? "TestEleve123!";

test.describe("Espace Élève — Leçon & Gamification", () => {
  test.beforeEach(async ({ page }) => {
    // Connexion élève
    await page.goto("/fr/connexion");
    await page.getByLabel(/email/i).fill(ELEVE_EMAIL);
    await page.getByLabel(/mot de passe/i).fill(ELEVE_PASSWORD);
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    // Attend la redirection vers l'espace élève
    await page.waitForURL(/\/eleve/, { timeout: 10_000 });
  });

  test("Dashboard élève charge correctement", async ({ page }) => {
    await expect(page.getByText(/Ma Cité|XP/i)).toBeVisible({ timeout: 8_000 });
  });

  test("Navigation vers classement", async ({ page }) => {
    await page.getByRole("link", { name: /classement/i }).click();
    await page.waitForURL(/\/eleve\/classement/);
    await expect(page.getByText(/Top|Podium|XP/i)).toBeVisible();
  });

  test("Navigation vers badges", async ({ page }) => {
    await page.getByRole("link", { name: /badges/i }).click();
    await page.waitForURL(/\/eleve\/badges/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Navigation vers avatar", async ({ page }) => {
    await page.getByRole("link", { name: /robot|avatar/i }).click();
    await page.waitForURL(/\/eleve\/avatar/);
    await expect(page.getByText(/robot|NEXUS|VULCAN/i)).toBeVisible();
  });

  test("Accès direct à l'espace admin refusé", async ({ page }) => {
    await page.goto("/fr/admin");
    // Doit être redirigé (pas sur /admin)
    await expect(page).not.toHaveURL(/\/admin/);
  });
});
