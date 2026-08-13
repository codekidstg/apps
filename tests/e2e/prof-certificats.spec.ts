import { test, expect } from "@playwright/test";

const PROF_EMAIL    = process.env.TEST_PROF_EMAIL    ?? "prof@codekids.test";
const PROF_PASSWORD = process.env.TEST_PROF_PASSWORD ?? "TestProf123!";

test.describe("Espace Prof — Certificats & Navigation", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/fr/connexion");
    await page.getByLabel(/email/i).fill(PROF_EMAIL);
    await page.getByLabel(/mot de passe/i).fill(PROF_PASSWORD);
    await page.getByRole("button", { name: /connexion|se connecter/i }).click();
    await page.waitForURL(/\/prof/, { timeout: 10_000 });
  });

  test("Dashboard prof charge correctement", async ({ page }) => {
    await expect(page.getByText(/Tableau de bord|planning|élèves/i)).toBeVisible({ timeout: 8_000 });
  });

  test("Navigation vers certificats", async ({ page }) => {
    await page.getByRole("link", { name: /certificats/i }).click();
    await page.waitForURL(/\/prof\/certificats/);
    await expect(page.getByText(/certificat|valider|aucun/i)).toBeVisible();
  });

  test("Navigation vers planning", async ({ page }) => {
    await page.getByRole("link", { name: /planning/i }).click();
    await page.waitForURL(/\/prof\/planning/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Navigation vers rapports", async ({ page }) => {
    await page.getByRole("link", { name: /rapports/i }).click();
    await page.waitForURL(/\/prof\/rapports/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("Accès direct à l'espace admin refusé", async ({ page }) => {
    await page.goto("/fr/admin");
    await expect(page).not.toHaveURL(/\/admin/);
  });

  test("Accès direct à l'espace élève refusé", async ({ page }) => {
    await page.goto("/fr/eleve");
    await expect(page).not.toHaveURL(/\/eleve/);
  });
});
