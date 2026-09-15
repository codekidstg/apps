-- La boîte de réception de la direction.
--
-- « Contacter la direction » promettait aux parents une réponse sous 48 h,
-- mais aucune page n'affichait jamais `contact_messages`. Le premier message
-- reçu, le 3 août 2026, est resté 43 jours sans lecteur.
--
-- Deux destinataires voient tout : le manager et l'admin. Pour qu'aucun ne
-- compte sur l'autre, le premier qui ouvre un message le prend en charge
-- (`claimed_by`), et son nom s'affiche. La réponse s'écrit dans l'application
-- et le parent la lit sur sa page Contact : l'expéditeur des emails est une
-- adresse noreply, une réponse par mail n'arriverait nulle part.

ALTER TABLE contact_messages
  ADD COLUMN IF NOT EXISTS claimed_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS claimed_at    timestamptz,
  ADD COLUMN IF NOT EXISTS reply         text,
  ADD COLUMN IF NOT EXISTS replied_by    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS replied_at    timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at     timestamptz,
  ADD COLUMN IF NOT EXISTS closed_note   text,
  ADD COLUMN IF NOT EXISTS reply_seen_at timestamptz;

-- Le parent pouvait écrire mais jamais relire ses propres messages.
DROP POLICY IF EXISTS "parent_select_own" ON contact_messages;
CREATE POLICY "parent_select_own" ON contact_messages
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- Les compteurs du tableau de bord ne lisent que les messages non traités.
CREATE INDEX IF NOT EXISTS contact_messages_a_traiter
  ON contact_messages (created_at)
  WHERE replied_at IS NULL AND closed_at IS NULL;
