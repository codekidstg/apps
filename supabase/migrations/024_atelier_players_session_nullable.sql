-- Rend session_code nullable pour les parties solo (sans code mentor)
ALTER TABLE atelier_players
  ALTER COLUMN session_code DROP NOT NULL,
  ALTER COLUMN session_code SET DEFAULT NULL;
