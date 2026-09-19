-- =====================================================
-- Drop 13B: Printable Report Cards
-- =====================================================

-- =====================================================
-- STUDENTS: photo_url (already added in 008_students_chunk3.sql —
-- kept here as IF NOT EXISTS so this migration is safe to run standalone)
-- =====================================================
ALTER TABLE students ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- =====================================================
-- REPORT_CARD_SETTINGS: branding + template columns
-- (next_term_begins, principal_name, principal_signature_url already
-- exist from 016_scores_and_report_settings.sql — kept IF NOT EXISTS)
-- =====================================================
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS stamp_url TEXT;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS principal_signature_url TEXT;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS principal_name TEXT;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS teacher_signature_url TEXT;
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS template_key TEXT DEFAULT 'modern-minimal'
  CHECK (template_key IN ('classic-nigerian', 'modern-minimal', 'executive', 'compact-grid', 'warm-academic'));
ALTER TABLE report_card_settings ADD COLUMN IF NOT EXISTS next_term_begins DATE;

-- =====================================================
-- CLASS_LEVEL_REPORT_STYLE — per class-level accent colors
-- =====================================================
CREATE TABLE IF NOT EXISTS class_level_report_style (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  primary_color TEXT NOT NULL DEFAULT '#4F46E5',
  accent_color TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, class_level_id)
);

CREATE INDEX IF NOT EXISTS idx_class_level_report_style_school ON class_level_report_style(school_id);

DROP TRIGGER IF EXISTS trg_class_level_report_style_updated ON class_level_report_style;
CREATE TRIGGER trg_class_level_report_style_updated BEFORE UPDATE ON class_level_report_style
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE class_level_report_style ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "class_level_report_style_select" ON class_level_report_style;
CREATE POLICY "class_level_report_style_select" ON class_level_report_style FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "class_level_report_style_manage" ON class_level_report_style;
CREATE POLICY "class_level_report_style_manage" ON class_level_report_style FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('settings.manage')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('settings.manage')) OR is_super_admin());

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-photos', 'student-photos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('school-assets', 'school-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read on both buckets
DROP POLICY IF EXISTS "student_photos_public_read" ON storage.objects;
CREATE POLICY "student_photos_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'student-photos');

DROP POLICY IF EXISTS "school_assets_public_read" ON storage.objects;
CREATE POLICY "school_assets_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'school-assets');

-- Authenticated write, scoped to the caller's own school folder
-- (files are stored as {schoolId}/{filename}; uploads in this app go
-- through API routes using the service-role client, which bypasses
-- these policies entirely — they exist as defense-in-depth for any
-- future direct-from-browser uploads)
DROP POLICY IF EXISTS "student_photos_auth_write" ON storage.objects;
CREATE POLICY "student_photos_auth_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "student_photos_auth_update" ON storage.objects;
CREATE POLICY "student_photos_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "student_photos_auth_delete" ON storage.objects;
CREATE POLICY "student_photos_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'student-photos' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "school_assets_auth_write" ON storage.objects;
CREATE POLICY "school_assets_auth_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'school-assets' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "school_assets_auth_update" ON storage.objects;
CREATE POLICY "school_assets_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'school-assets' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "school_assets_auth_delete" ON storage.objects;
CREATE POLICY "school_assets_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'school-assets' AND (storage.foldername(name))[1] = current_user_school_id()::text);

-- =====================================================
-- RPC: calculate_class_position
-- Rank of a student within their section for a term, by term average
-- (mean of total_score across all subjects that term, excluding
-- absent/ungraded rows — same rule TermDashboardClient uses client-side)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_class_position(section_id UUID, term_id UUID, student_id UUID)
RETURNS INT AS $$
DECLARE
  v_position INT;
BEGIN
  WITH student_avgs AS (
    SELECT ss.student_id, AVG(ss.total_score) AS avg_score
    FROM student_scores ss
    JOIN score_sessions sess ON sess.id = ss.score_session_id
    WHERE sess.section_id = calculate_class_position.section_id
      AND sess.term_id = calculate_class_position.term_id
      AND ss.is_absent = false
      AND ss.total_score > 0
    GROUP BY ss.student_id
  ),
  ranked AS (
    SELECT sa.student_id, RANK() OVER (ORDER BY sa.avg_score DESC) AS rnk
    FROM student_avgs sa
  )
  SELECT r.rnk INTO v_position FROM ranked r WHERE r.student_id = calculate_class_position.student_id;

  RETURN v_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- RPC: calculate_subject_position
-- Rank of a student within one score_session (one class-subject-term sheet)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_subject_position(score_session_id UUID, student_id UUID)
RETURNS INT AS $$
DECLARE
  v_position INT;
BEGIN
  WITH ranked AS (
    SELECT ss.student_id, RANK() OVER (ORDER BY ss.total_score DESC) AS rnk
    FROM student_scores ss
    WHERE ss.score_session_id = calculate_subject_position.score_session_id
      AND ss.is_absent = false
      AND ss.total_score > 0
  )
  SELECT r.rnk INTO v_position FROM ranked r WHERE r.student_id = calculate_subject_position.student_id;

  RETURN v_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =====================================================
-- RPC: calculate_class_avg_for_subject
-- Class average total_score for one score_session
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_class_avg_for_subject(score_session_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_avg NUMERIC;
BEGIN
  SELECT ROUND(AVG(ss.total_score), 2) INTO v_avg
  FROM student_scores ss
  WHERE ss.score_session_id = calculate_class_avg_for_subject.score_session_id
    AND ss.is_absent = false
    AND ss.total_score > 0;

  RETURN COALESCE(v_avg, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
