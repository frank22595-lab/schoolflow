-- =====================================================
-- Drop 14 follow-up: ensure report_card_settings has every column the
-- settings save route and templates read/write. Safe to run even if
-- 018_report_style_key.sql already added some of these — IF NOT EXISTS
-- makes every clause a no-op on columns that already exist.
-- =====================================================

ALTER TABLE report_card_settings
  ADD COLUMN IF NOT EXISTS show_class_avg BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_subject_position BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_class_high BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_class_low BOOLEAN DEFAULT false;
