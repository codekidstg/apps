-- ─────────────────────────────────────────────────────────────────────────────
-- 034 — Les séances qui n'ont pas eu lieu
--
-- Jusqu'ici, une séance passée sans compte rendu voulait dire deux choses à la
-- fois : le mentor a oublié de le rédiger, ou la séance n'a pas eu lieu. On ne
-- pouvait pas les distinguer — et le 19 septembre, la séance de Kenneth s'est
-- arrêtée sur une coupure de courant.
--
-- Le mentor déclare donc désormais « séance non tenue » avec sa raison. Ce qui
-- ne dépend pas de lui (enfant absent, coupure, congés) sort du décompte de son
-- suivi ; « mentor empêché » reste à sa charge, et le nombre de déclarations
-- s'affiche à part, pour que rien ne se règle en silence.
--
-- Une séance non tenue n'a ni avancement ni engagement : ces deux colonnes
-- deviennent facultatives, et une contrainte garde les deux cas cohérents.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.session_reports
  add column if not exists tenue             boolean not null default true,
  add column if not exists raison_non_tenue  text;

-- Les rapports existants décrivent tous une séance qui a eu lieu : le défaut
-- `true` les laisse tels quels.
alter table public.session_reports alter column advancement drop not null;
alter table public.session_reports alter column engagement  drop not null;

alter table public.session_reports drop constraint if exists session_reports_tenue_coherente;
alter table public.session_reports add constraint session_reports_tenue_coherente check (
  (tenue
    and advancement is not null
    and engagement is not null
    and raison_non_tenue is null)
  or
  (not tenue
    and advancement is null
    and engagement is null
    -- `is not null` d'abord : sans lui, « raison in (...) » vaut inconnu quand
    -- la raison est nulle, et une contrainte laisse passer l'inconnu.
    and raison_non_tenue is not null
    and raison_non_tenue in ('enfant_absent', 'coupure', 'mentor_empeche', 'conges'))
);
