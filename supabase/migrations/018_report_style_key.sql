-- =====================================================
-- Drop 14: Bundled template + color "style" system
-- Report cards now pick one of 18 "style keys" (6 templates x 3 color
-- styles each) instead of a template + separate per-class-level colors.
-- =====================================================

-- The style key selected in the 18-card grid picker, e.g. "ducams-classic-royal".
-- template_key stays in sync with it (kept for getReportTemplate() lookups).
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS template_style_key TEXT;

-- Widen template_key to include the new DUCAMS Classic template.
ALTER TABLE report_card_settings DROP CONSTRAINT IF EXISTS report_card_settings_template_key_check;
ALTER TABLE report_card_settings ADD CONSTRAINT report_card_settings_template_key_check
  CHECK (template_key IN ('ducams-classic', 'classic-nigerian', 'modern-minimal', 'executive', 'compact-grid', 'warm-academic'));

-- Toggle columns matching what the rebuilt templates actually read
-- (ReportTemplateProps['settings']). Default true = shown, matching the
-- templates' own `!== false` (opt-out) convention.
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_photo BOOLEAN DEFAULT true;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_house BOOLEAN DEFAULT true;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_position BOOLEAN DEFAULT true;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_class_avg BOOLEAN DEFAULT true;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_cumulative BOOLEAN DEFAULT true;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS show_grade_scale BOOLEAN DEFAULT true;
