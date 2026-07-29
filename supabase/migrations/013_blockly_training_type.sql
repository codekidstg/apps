-- Ajoute blockly_challenge comme type valide dans training_blocks
ALTER TABLE training_blocks
  DROP CONSTRAINT IF EXISTS training_blocks_type_check;

ALTER TABLE training_blocks
  ADD CONSTRAINT training_blocks_type_check
  CHECK (type IN ('quiz', 'code_challenge', 'text', 'blockly_challenge'));
