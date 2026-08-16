-- =====================================================
-- CHUNK 2 (Part 3) + CHUNK 6 (start): Subjects & Grading
-- =====================================================

-- =====================================================
-- SUBJECTS
-- =====================================================
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  code TEXT,
  category TEXT DEFAULT 'core' CHECK (category IN ('core', 'elective', 'vocational', 'extra_curricular')),
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_subjects_school ON subjects(school_id, is_active);

COMMENT ON TABLE subjects IS 'Subjects the school teaches. Configured once per school.';

-- =====================================================
-- GRADING SCALES
-- =====================================================
CREATE TABLE IF NOT EXISTS grading_scales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  scale_type TEXT DEFAULT 'letter' CHECK (scale_type IN ('percentage', 'letter', 'numerical', 'custom')),
  is_default BOOLEAN DEFAULT false,
  applies_to_levels TEXT[] DEFAULT '{}',
  max_score INT DEFAULT 100,
  min_pass_score INT DEFAULT 40,
  show_grade_point_on_report BOOLEAN DEFAULT false,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

-- Only ONE default grading scale per school
CREATE OR REPLACE FUNCTION enforce_single_default_grading_scale()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = true THEN
    UPDATE grading_scales SET is_default = false
    WHERE school_id = NEW.school_id AND id != NEW.id AND is_default = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_default_scale ON grading_scales;
CREATE TRIGGER trg_single_default_scale
  BEFORE INSERT OR UPDATE ON grading_scales
  FOR EACH ROW EXECUTE FUNCTION enforce_single_default_grading_scale();

-- =====================================================
-- GRADE BOUNDARIES - The score ranges within a scale
-- =====================================================
CREATE TABLE IF NOT EXISTS grade_boundaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  scale_id UUID NOT NULL REFERENCES grading_scales(id) ON DELETE CASCADE,
  grade_label TEXT NOT NULL,
  min_score NUMERIC(5,2) NOT NULL,
  max_score NUMERIC(5,2) NOT NULL,
  grade_point NUMERIC(3,2),
  remark TEXT,
  is_pass BOOLEAN DEFAULT true,
  color TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scale_id, grade_label)
);

CREATE INDEX IF NOT EXISTS idx_grade_boundaries_scale ON grade_boundaries(scale_id);

-- =====================================================
-- ASSESSMENT COMPONENTS (CA1, CA2, Exam, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS assessment_components (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_code TEXT,
  category TEXT DEFAULT 'continuous_assessment' CHECK (category IN (
    'continuous_assessment', 'project', 'assignment', 'mid_term_exam', 'final_exam', 'practical', 'other'
  )),
  default_max_score NUMERIC(5,2) DEFAULT 10,
  default_weight NUMERIC(5,2) DEFAULT 10,
  requires_moderation BOOLEAN DEFAULT false,
  is_cumulative_only BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_subjects_updated ON subjects;
CREATE TRIGGER trg_subjects_updated BEFORE UPDATE ON subjects FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_grading_scales_updated ON grading_scales;
CREATE TRIGGER trg_grading_scales_updated BEFORE UPDATE ON grading_scales FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_assessment_components_updated ON assessment_components;
CREATE TRIGGER trg_assessment_components_updated BEFORE UPDATE ON assessment_components FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE grading_scales ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_boundaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_components ENABLE ROW LEVEL SECURITY;

-- All 4 tables use the same pattern: view for school, manage requires academic.setup permission
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['subjects', 'grading_scales', 'grade_boundaries', 'assessment_components'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING ((school_id = current_user_school_id() AND user_has_permission(''academic.setup'')) OR is_super_admin())
      WITH CHECK ((school_id = current_user_school_id() AND user_has_permission(''academic.setup'')) OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- =====================================================
-- HELPER: Seed common Nigerian subjects based on levels offered
-- =====================================================
CREATE OR REPLACE FUNCTION seed_common_subjects(p_school_id UUID, p_categories TEXT[])
RETURNS VOID AS $$
BEGIN
  -- Nursery/Primary subjects
  IF 'nursery' = ANY(p_categories) OR 'primary' = ANY(p_categories) THEN
    INSERT INTO subjects (school_id, name, short_name, category, department) VALUES
      (p_school_id, 'English Language', 'ENG', 'core', 'Language'),
      (p_school_id, 'Mathematics', 'MTH', 'core', 'Science'),
      (p_school_id, 'Basic Science', 'BSC', 'core', 'Science'),
      (p_school_id, 'Social Studies', 'SOC', 'core', 'Arts'),
      (p_school_id, 'Civic Education', 'CVE', 'core', 'Arts'),
      (p_school_id, 'Christian Religious Studies', 'CRS', 'core', 'Religion'),
      (p_school_id, 'Cultural & Creative Arts', 'CCA', 'core', 'Arts'),
      (p_school_id, 'Physical & Health Education', 'PHE', 'core', 'Sports'),
      (p_school_id, 'Computer Studies', 'CMP', 'core', 'Science'),
      (p_school_id, 'Yoruba/Hausa/Igbo Language', 'LNG', 'core', 'Language'),
      (p_school_id, 'French', 'FRN', 'elective', 'Language'),
      (p_school_id, 'Home Economics', 'HEC', 'core', 'Vocational'),
      (p_school_id, 'Agricultural Science', 'AGR', 'core', 'Vocational')
    ON CONFLICT (school_id, name) DO NOTHING;
  END IF;

  -- JSS subjects
  IF 'junior_secondary' = ANY(p_categories) THEN
    INSERT INTO subjects (school_id, name, short_name, category, department) VALUES
      (p_school_id, 'Business Studies', 'BUS', 'core', 'Commercial'),
      (p_school_id, 'Basic Technology', 'BTE', 'core', 'Science'),
      (p_school_id, 'Islamic Religious Studies', 'IRS', 'elective', 'Religion'),
      (p_school_id, 'Music', 'MUS', 'elective', 'Arts'),
      (p_school_id, 'Fine Arts', 'ART', 'elective', 'Arts')
    ON CONFLICT (school_id, name) DO NOTHING;
  END IF;

  -- SS subjects
  IF 'senior_secondary' = ANY(p_categories) THEN
    INSERT INTO subjects (school_id, name, short_name, category, department) VALUES
      -- Sciences
      (p_school_id, 'Physics', 'PHY', 'core', 'Science'),
      (p_school_id, 'Chemistry', 'CHM', 'core', 'Science'),
      (p_school_id, 'Biology', 'BIO', 'core', 'Science'),
      (p_school_id, 'Further Mathematics', 'FMT', 'elective', 'Science'),
      (p_school_id, 'Geography', 'GEO', 'elective', 'Science'),
      -- Arts
      (p_school_id, 'Literature in English', 'LIT', 'core', 'Arts'),
      (p_school_id, 'Government', 'GOV', 'core', 'Arts'),
      (p_school_id, 'History', 'HST', 'elective', 'Arts'),
      (p_school_id, 'Christian Religious Knowledge', 'CRK', 'elective', 'Religion'),
      -- Commercial
      (p_school_id, 'Economics', 'ECN', 'core', 'Commercial'),
      (p_school_id, 'Accounting', 'ACC', 'core', 'Commercial'),
      (p_school_id, 'Commerce', 'COM', 'core', 'Commercial'),
      (p_school_id, 'Marketing', 'MKT', 'elective', 'Commercial')
    ON CONFLICT (school_id, name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER: Seed WAEC A1-F9 grading scale (Nigerian standard)
-- =====================================================
CREATE OR REPLACE FUNCTION seed_waec_grading_scale(p_school_id UUID)
RETURNS UUID AS $$
DECLARE
  v_scale_id UUID;
BEGIN
  INSERT INTO grading_scales (school_id, name, scale_type, is_default, max_score, min_pass_score, description)
  VALUES (p_school_id, 'WAEC (A1-F9)', 'letter', true, 100, 40, 'West African Examinations Council standard grading')
  ON CONFLICT (school_id, name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO v_scale_id;

  -- Clear existing boundaries for this scale
  DELETE FROM grade_boundaries WHERE scale_id = v_scale_id;

  INSERT INTO grade_boundaries (school_id, scale_id, grade_label, min_score, max_score, grade_point, remark, is_pass, color, sort_order) VALUES
    (p_school_id, v_scale_id, 'A1', 75, 100, 4.0, 'Excellent', true, '#10B981', 1),
    (p_school_id, v_scale_id, 'B2', 70, 74.99, 3.6, 'Very Good', true, '#22C55E', 2),
    (p_school_id, v_scale_id, 'B3', 65, 69.99, 3.2, 'Good', true, '#84CC16', 3),
    (p_school_id, v_scale_id, 'C4', 60, 64.99, 2.8, 'Credit', true, '#EAB308', 4),
    (p_school_id, v_scale_id, 'C5', 55, 59.99, 2.4, 'Credit', true, '#F59E0B', 5),
    (p_school_id, v_scale_id, 'C6', 50, 54.99, 2.0, 'Credit', true, '#F97316', 6),
    (p_school_id, v_scale_id, 'D7', 45, 49.99, 1.6, 'Pass', true, '#FB923C', 7),
    (p_school_id, v_scale_id, 'E8', 40, 44.99, 1.2, 'Pass', true, '#F87171', 8),
    (p_school_id, v_scale_id, 'F9', 0, 39.99, 0, 'Fail', false, '#EF4444', 9);

  RETURN v_scale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER: Seed simple percentage scale
-- =====================================================
CREATE OR REPLACE FUNCTION seed_percentage_grading_scale(p_school_id UUID)
RETURNS UUID AS $$
DECLARE
  v_scale_id UUID;
BEGIN
  INSERT INTO grading_scales (school_id, name, scale_type, is_default, max_score, min_pass_score, description)
  VALUES (p_school_id, 'Percentage (A-F)', 'letter', false, 100, 40, 'Simple A-F letter grades')
  ON CONFLICT (school_id, name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO v_scale_id;

  DELETE FROM grade_boundaries WHERE scale_id = v_scale_id;

  INSERT INTO grade_boundaries (school_id, scale_id, grade_label, min_score, max_score, grade_point, remark, is_pass, color, sort_order) VALUES
    (p_school_id, v_scale_id, 'A', 70, 100, 4.0, 'Excellent', true, '#10B981', 1),
    (p_school_id, v_scale_id, 'B', 60, 69.99, 3.0, 'Good', true, '#22C55E', 2),
    (p_school_id, v_scale_id, 'C', 50, 59.99, 2.0, 'Credit', true, '#EAB308', 3),
    (p_school_id, v_scale_id, 'D', 45, 49.99, 1.0, 'Pass', true, '#F59E0B', 4),
    (p_school_id, v_scale_id, 'E', 40, 44.99, 0.5, 'Pass', true, '#F97316', 5),
    (p_school_id, v_scale_id, 'F', 0, 39.99, 0, 'Fail', false, '#EF4444', 6);

  RETURN v_scale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER: Seed standard assessment components
-- =====================================================
CREATE OR REPLACE FUNCTION seed_common_assessment_components(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO assessment_components (school_id, name, short_code, category, default_max_score, default_weight, sort_order) VALUES
    (p_school_id, 'First CA', 'CA1', 'continuous_assessment', 10, 10, 1),
    (p_school_id, 'Second CA', 'CA2', 'continuous_assessment', 10, 10, 2),
    (p_school_id, 'Assignment', 'ASG', 'assignment', 10, 10, 3),
    (p_school_id, 'Project', 'PRJ', 'project', 10, 10, 4),
    (p_school_id, 'End of Term Exam', 'EXAM', 'final_exam', 60, 60, 5)
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
