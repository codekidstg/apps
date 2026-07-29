-- Numéro permanent d'un thème dans son niveau (jamais modifié par drag-drop)
alter table themes add column if not exists number integer;
