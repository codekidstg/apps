-- ============================================================
-- 026 — Connexion par identifiant
-- ============================================================
--
-- Certaines familles ne veulent pas donner d'adresse email, et un enfant de
-- neuf ans n'en a pas. Supabase Auth exige pourtant une adresse unique par
-- compte : on continue donc à lui en fournir une, mais fabriquée
-- (`uriel.a@interne.codekids.tg`). Elle n'est jamais affichée ni saisie, et
-- aucun message n'y est envoyé.
--
-- `username` est ce que la personne tape réellement pour se connecter.
-- L'unicité est posée sur la version minuscule : `Uriel.A` et `uriel.a` ne
-- peuvent pas coexister.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username))
  WHERE username IS NOT NULL;

COMMENT ON COLUMN public.profiles.username IS
  'Identifiant de connexion, alternative à l''email. Format prénom.initiale.';
