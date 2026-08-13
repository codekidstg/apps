# Tests E2E — CodeKids

## Prérequis

1. Installer les navigateurs Playwright :
```bash
pnpm exec playwright install chromium
```

2. Créer `.env.test` à la racine :
```env
PLAYWRIGHT_BASE_URL=http://localhost:3000
TEST_ELEVE_EMAIL=eleve@codekids.test
TEST_ELEVE_PASSWORD=TestEleve123!
TEST_PROF_EMAIL=prof@codekids.test
TEST_PROF_PASSWORD=TestProf123!
```

3. Créer ces comptes de test dans Supabase (rôles `student` et `teacher`).

## Lancer les tests

```bash
# Démarrer l'app d'abord
pnpm dev

# Puis dans un autre terminal
pnpm exec playwright test

# Mode UI interactif
pnpm exec playwright test --ui

# Un seul fichier
pnpm exec playwright test tests/e2e/auth-protection.spec.ts
```

## Fichiers de tests

| Fichier | Ce qu'il teste |
|---------|---------------|
| `auth-protection.spec.ts` | Routes protégées redirigent vers connexion |
| `eleve-lecon.spec.ts` | Dashboard élève, navigation, isolation des rôles |
| `prof-certificats.spec.ts` | Dashboard prof, navigation, isolation des rôles |
