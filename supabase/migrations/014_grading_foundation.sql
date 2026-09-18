-- =====================================================
-- CHUNK 6: Grading Foundation
-- Assumes subjects, class_subjects, grade_scales tables from earlier migrations
-- This migration ensures they exist + adds missing bits + seeder functions
-- =====================================================

-- =====================================================
-- SUBJECTS (idempotent — create if not exists)
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  category TEXT DEFAULT 'core' CHECK (category IN ('core', 'elective', 'vocational', 'language', 'science', 'arts', 'commercial')),
  is_active BOOLEAN DEFAULT true,
  sequence INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id) WHERE is_active = true;

-- =====================================================
-- CLASS_SUBJECTS — links subjects to class levels
-- =====================================================
CREATE TABLE IF NOT EXISTS class_subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  is_compulsory BOOLEAN DEFAULT true,
  stream TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_level_id, subject_id, stream)
);

CREATE INDEX IF NOT EXISTS idx_class_subjects_level ON class_subjects(class_level_id);

-- =====================================================
-- GRADE_SCALES — grading system per school
-- =====================================================
CREATE TABLE IF NOT EXISTS grade_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS grade_bands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  grade_scale_id UUID NOT NULL REFERENCES grade_scales(id) ON DELETE CASCADE,
  grade TEXT NOT NULL,
  min_score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  remark TEXT,
  gpa NUMERIC(3,2),
  color TEXT DEFAULT 'gray',
  sequence INT DEFAULT 0,
  UNIQUE (grade_scale_id, grade)
);

CREATE INDEX IF NOT EXISTS idx_grade_bands_scale ON grade_bands(grade_scale_id, sequence);

-- =====================================================
-- ASSESSMENT_TYPES — CA1, CA2, Exam etc, per school
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT NOT NULL,
  max_score NUMERIC(5,2) NOT NULL DEFAULT 100,
  weight NUMERIC(5,2),
  sequence INT DEFAULT 0,
  is_exam BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, short_code)
);

CREATE INDEX IF NOT EXISTS idx_assessment_types_school ON assessment_types(school_id, sequence) WHERE is_active = true;

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_subjects_updated ON subjects;
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_grade_scales_updated ON grade_scales;
CREATE TRIGGER trg_grade_scales_updated BEFORE UPDATE ON grade_scales FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Only one default grade scale per school
CREATE OR REPLACE FUNCTION enforce_single_default_grade_scale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE grade_scales SET is_default = false WHERE school_id = NEW.school_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_default_grade_scale ON grade_scales;
CREATE TRIGGER trg_single_default_grade_scale AFTER INSERT OR UPDATE ON grade_scales
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_grade_scale();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_bands ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_types ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['subjects', 'class_subjects', 'grade_scales', 'assessment_types'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING ((school_id = current_user_school_id() AND user_has_permission(''settings.manage'')) OR is_super_admin())
      WITH CHECK ((school_id = current_user_school_id() AND user_has_permission(''settings.manage'')) OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- grade_bands via parent scale
DROP POLICY IF EXISTS "grade_bands_select" ON grade_bands;
CREATE POLICY "grade_bands_select" ON grade_bands FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM grade_scales WHERE grade_scales.id = grade_bands.grade_scale_id AND (grade_scales.school_id = current_user_school_id() OR is_super_admin())));
DROP POLICY IF EXISTS "grade_bands_manage" ON grade_bands;
CREATE POLICY "grade_bands_manage" ON grade_bands FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM grade_scales WHERE grade_scales.id = grade_bands.grade_scale_id AND ((grade_scales.school_id = current_user_school_id() AND user_has_permission('settings.manage')) OR is_super_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM grade_scales WHERE grade_scales.id = grade_bands.grade_scale_id AND ((grade_scales.school_id = current_user_school_id() AND user_has_permission('settings.manage')) OR is_super_admin())));

-- =====================================================
-- SEED FUNCTION: WAEC-style grade scale
-- =====================================================
CREATE OR REPLACE FUNCTION seed_waec_grade_scale(p_school_id UUID)
RETURNS UUID AS $$
DECLARE v_scale_id UUID;
BEGIN
  -- Delete existing default if any
  DELETE FROM grade_scales WHERE school_id = p_school_id AND name = 'WAEC Standard';

  INSERT INTO grade_scales (school_id, name, is_default)
  VALUES (p_school_id, 'WAEC Standard', true)
  RETURNING id INTO v_scale_id;

  INSERT INTO grade_bands (grade_scale_id, grade, min_score, max_score, remark, gpa, color, sequence) VALUES
    (v_scale_id, 'A1', 75, 100, 'Excellent', 4.0, 'emerald', 1),
    (v_scale_id, 'B2', 70, 74.99, 'Very Good', 3.6, 'emerald', 2),
    (v_scale_id, 'B3', 65, 69.99, 'Good', 3.2, 'sky', 3),
    (v_scale_id, 'C4', 60, 64.99, 'Credit', 2.8, 'sky', 4),
    (v_scale_id, 'C5', 55, 59.99, 'Credit', 2.4, 'indigo', 5),
    (v_scale_id, 'C6', 50, 54.99, 'Credit', 2.0, 'indigo', 6),
    (v_scale_id, 'D7', 45, 49.99, 'Pass', 1.6, 'amber', 7),
    (v_scale_id, 'E8', 40, 44.99, 'Pass', 1.2, 'amber', 8),
    (v_scale_id, 'F9', 0, 39.99, 'Fail', 0.0, 'red', 9);

  RETURN v_scale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED FUNCTION: Standard assessment types (CA1, CA2, Exam)
-- =====================================================
CREATE OR REPLACE FUNCTION seed_standard_assessments(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO assessment_types (school_id, name, short_code, max_score, weight, sequence, is_exam)
  VALUES
    (p_school_id, 'First CA',  'CA1',  20, 20, 1, false),
    (p_school_id, 'Second CA', 'CA2',  20, 20, 2, false),
    (p_school_id, 'Exam',      'EXAM', 60, 60, 3, true)
  ON CONFLICT (school_id, short_code) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED FUNCTION: Standard Nigerian subjects (broad set)
-- =====================================================
CREATE OR REPLACE FUNCTION seed_nigerian_subjects(p_school_id UUID)
RETURNS INT AS $$
DECLARE v_count INT := 0;
BEGIN
  INSERT INTO subjects (school_id, name, code, category, sequence) VALUES
    -- Core (all levels)
    (p_school_id, 'English Language',                'ENG',  'core',        1),
    (p_school_id, 'Mathematics',                     'MTH',  'core',        2),
    (p_school_id, 'Civic Education',                 'CIV',  'core',        3),

    -- Primary + JSS
    (p_school_id, 'Basic Science',                   'BSC',  'core',        10),
    (p_school_id, 'Basic Technology',                'BTC',  'vocational',  11),
    (p_school_id, 'Social Studies',                  'SOS',  'core',        12),
    (p_school_id, 'Business Studies',                'BST',  'core',        13),
    (p_school_id, 'Cultural & Creative Arts',        'CCA',  'arts',        14),
    (p_school_id, 'Physical & Health Education',     'PHE',  'core',        15),
    (p_school_id, 'Computer Studies',                'CMP',  'core',        16),
    (p_school_id, 'Agricultural Science',            'AGR',  'vocational',  17),
    (p_school_id, 'Home Economics',                  'HEC',  'vocational',  18),
    (p_school_id, 'Christian Religious Studies',     'CRS',  'core',        19),
    (p_school_id, 'Islamic Religious Studies',       'IRS',  'core',        20),
    (p_school_id, 'French',                          'FRE',  'language',    21),
    (p_school_id, 'Yoruba',                          'YOR',  'language',    22),
    (p_school_id, 'Igbo',                            'IGB',  'language',    23),
    (p_school_id, 'Hausa',                           'HAU',  'language',    24),
    (p_school_id, 'Music',                           'MUS',  'arts',        25),

    -- SSS: Science
    (p_school_id, 'Physics',                         'PHY',  'science',     30),
    (p_school_id, 'Chemistry',                       'CHM',  'science',     31),
    (p_school_id, 'Biology',                         'BIO',  'science',     32),
    (p_school_id, 'Further Mathematics',             'FMT',  'science',     33),
    (p_school_id, 'Computer Science',                'CSC',  'science',     34),

    -- SSS: Arts
    (p_school_id, 'Literature-in-English',           'LIT',  'arts',        40),
    (p_school_id, 'Government',                      'GOV',  'arts',        41),
    (p_school_id, 'History',                         'HIS',  'arts',        42),
    (p_school_id, 'Geography',                       'GEO',  'arts',        43),

    -- SSS: Commercial
    (p_school_id, 'Economics',                       'ECO',  'commercial',  50),
    (p_school_id, 'Commerce',                        'COM',  'commercial',  51),
    (p_school_id, 'Financial Accounting',            'ACC',  'commercial',  52),
    (p_school_id, 'Marketing',                       'MKT',  'commercial',  53)
  ON CONFLICT (school_id, name) DO NOTHING;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED FUNCTION: All-in-one setup wizard (safe to re-run)
-- =====================================================
CREATE OR REPLACE FUNCTION setup_grading_defaults(p_school_id UUID)
RETURNS JSON AS $$
DECLARE
  v_scale_id UUID;
  v_subject_count INT;
BEGIN
  v_scale_id := seed_waec_grade_scale(p_school_id);
  PERFORM seed_standard_assessments(p_school_id);
  v_subject_count := seed_nigerian_subjects(p_school_id);

  RETURN json_build_object(
    'scale_id', v_scale_id,
    'subjects_added', v_subject_count,
    'assessments', 3
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
