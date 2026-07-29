-- Ajoute order_index aux thèmes pour permettre le réordonnancement manuel
alter table themes add column if not exists order_index integer not null default 0;

-- Initialise l'ordre à partir du titre (ordre alphabétique actuel)
with ranked as (
  select id, row_number() over (partition by level order by title) - 1 as rn
  from themes
)
update themes set order_index = ranked.rn from ranked where themes.id = ranked.id;
