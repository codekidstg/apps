-- Colonne pour stocker le mot de passe initial défini par l'admin
-- Accessible uniquement par les admins (RLS), utile pour les tests et le partage de credentials

alter table public.profiles
  add column if not exists temp_password text default null;

-- Seul l'admin (service role) peut lire cette colonne via le client admin.
-- Les autres rôles ne voient pas cette valeur grâce à la RLS existante sur profiles.
