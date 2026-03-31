-- Drop unused / redundant document columns. Stale OCR recovery uses documents.updated_at
-- (set when a row is claimed into `processing`) instead of last_ocr_attempt_at.
ALTER TABLE documents
  DROP COLUMN IF EXISTS ocr_attempt_count,
  DROP COLUMN IF EXISTS last_ocr_attempt_at,
  DROP COLUMN IF EXISTS deleted_at;
