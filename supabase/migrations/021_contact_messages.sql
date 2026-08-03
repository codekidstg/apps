CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_name text,
  subject    text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz DEFAULT now(),
  read_at    timestamptz
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Parent can insert their own messages
CREATE POLICY "parent_insert_own" ON contact_messages
  FOR INSERT TO authenticated
  WITH CHECK (parent_id = auth.uid());

-- Admin/manager can read all
CREATE POLICY "admin_read_all" ON contact_messages
  FOR ALL TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('admin', 'manager')
  );
