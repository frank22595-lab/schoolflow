-- =====================================================
-- Drop 16A follow-up: restore the 'topic' column on questions.
-- The live questions table was reshaped (bank_id kept, points ->
-- default_points, subject_id/class_level_id added directly,
-- acceptable_answers changed to text[], tags added) and topic was
-- dropped in the process — but it's still read/written throughout
-- the question bank + bulk upload + exam builder code, so restore it.
-- =====================================================

ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic TEXT;
