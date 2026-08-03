-- Ajoute les nouveaux types de blocs interactifs : fill_blank, match, swipe_sort, drag_to_bin
ALTER TABLE training_blocks
  DROP CONSTRAINT IF EXISTS training_blocks_type_check;

ALTER TABLE training_blocks
  ADD CONSTRAINT training_blocks_type_check
  CHECK (type IN ('quiz', 'code_challenge', 'text', 'blockly_challenge', 'fill_blank', 'match', 'swipe_sort', 'drag_to_bin'));
