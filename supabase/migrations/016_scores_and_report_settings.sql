-- =====================================================
-- Drop 13A: Scores + Report Card Configuration
-- =====================================================

-- =====================================================
-- SCORE SESSIONS (one per class-subject-term)
-- =====================================================
CREATE TABLE IF NOT EXISTS score_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,

  is_finalized BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (section_id, subject_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_score_sessions_school ON score_sessions(school_id);
CREATE INDEX IF NOT EXISTS idx_score_sessions_term ON score_sessions(term_id, section_id);

-- =====================================================
-- STUDENT SCORES (one row per student per subject per term)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  score_session_id UUID NOT NULL REFERENCES score_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  -- Individual assessment scores (jsonb for flexibility: {"CA1": 15, "CA2": 18, "EXAM": 45})
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,

  total_score NUMERIC(5,2) DEFAULT 0,
  grade TEXT,
  grade_remark TEXT,

  is_absent BOOLEAN DEFAULT false,
  teacher_comment TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (score_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_student_scores_session ON student_scores(score_session_id);
CREATE INDEX IF NOT EXISTS idx_student_scores_student ON student_scores(student_id);

-- =====================================================
-- REPORT CARD SETTINGS (one row per school)
-- =====================================================
CREATE TABLE IF NOT EXISTS report_card_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE UNIQUE,

  -- Toggles
  show_class_position BOOLEAN DEFAULT true,
  show_subject_position BOOLEAN DEFAULT true,
  show_cumulative_average BOOLEAN DEFAULT true,
  show_class_average BOOLEAN DEFAULT true,
  show_highest_lowest BOOLEAN DEFAULT true,
  show_gpa BOOLEAN DEFAULT false,
  show_attendance BOOLEAN DEFAULT true,
  show_affective BOOLEAN DEFAULT true,
  show_psychomotor BOOLEAN DEFAULT true,
  show_teacher_comment BOOLEAN DEFAULT true,
  show_principal_comment BOOLEAN DEFAULT true,
  show_next_term_dates BOOLEAN DEFAULT true,
  show_fees_notice BOOLEAN DEFAULT false,
  show_signatures BOOLEAN DEFAULT true,
  show_stamp_area BOOLEAN DEFAULT true,
  show_logo BOOLEAN DEFAULT true,
  show_motto BOOLEAN DEFAULT true,

  -- Custom text
  header_motto TEXT,
  footer_note TEXT,
  next_term_begins DATE,
  next_term_fees NUMERIC(10,2),
  principal_name TEXT,
  principal_signature_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- AFFECTIVE TRAITS (behavior) - configurable per school
-- =====================================================
CREATE TABLE IF NOT EXISTS affective_traits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (school_id, name)
);

-- =====================================================
-- PSYCHOMOTOR SKILLS - configurable per school
-- =====================================================
CREATE TABLE IF NOT EXISTS psychomotor_skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  UNIQUE (school_id, name)
);

-- =====================================================
-- STUDENT BEHAVIOR SCORES (per term, per student)
-- Rated 1-5 (Poor to Excellent)
-- =====================================================
CREATE TABLE IF NOT EXISTS student_behavior (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  term_id UUID NOT NULL REFERENCES terms(id) ON DELETE CASCADE,

  affective JSONB DEFAULT '{}'::jsonb,      -- {"Punctuality": 5, "Neatness": 4, ...}
  psychomotor JSONB DEFAULT '{}'::jsonb,    -- {"Handwriting": 4, "Games": 5, ...}

  teacher_comment TEXT,
  principal_comment TEXT,

  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, term_id)
);

CREATE INDEX IF NOT EXISTS idx_behavior_term ON student_behavior(term_id);

-- =====================================================
-- COMMENT LIBRARY - preset teacher/principal comments
-- =====================================================
CREATE TABLE IF NOT EXISTS comment_presets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  comment_type TEXT NOT NULL CHECK (comment_type IN ('teacher', 'principal', 'grade')),
  score_min NUMERIC(5,2),
  score_max NUMERIC(5,2),
  text TEXT NOT NULL,
  sequence INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_school ON comment_presets(school_id, comment_type);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_score_sessions_updated ON score_sessions;
CREATE TRIGGER trg_score_sessions_updated BEFORE UPDATE ON score_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_student_scores_updated ON student_scores;
CREATE TRIGGER trg_student_scores_updated BEFORE UPDATE ON student_scores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_report_settings_updated ON report_card_settings;
CREATE TRIGGER trg_report_settings_updated BEFORE UPDATE ON report_card_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_behavior_updated ON student_behavior;
CREATE TRIGGER trg_behavior_updated BEFORE UPDATE ON student_behavior
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE score_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_card_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE affective_traits ENABLE ROW LEVEL SECURITY;
ALTER TABLE psychomotor_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_behavior ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_presets ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['score_sessions', 'student_scores', 'report_card_settings',
    'affective_traits', 'psychomotor_skills', 'student_behavior', 'comment_presets'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())
      WITH CHECK (school_id = current_user_school_id() OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- =====================================================
-- SEED DEFAULT AFFECTIVE TRAITS & PSYCHOMOTOR SKILLS
-- =====================================================
CREATE OR REPLACE FUNCTION seed_default_behavior_traits(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Nigerian standard affective traits
  INSERT INTO affective_traits (school_id, name, sequence) VALUES
    (p_school_id, 'Punctuality', 1),
    (p_school_id, 'Neatness', 2),
    (p_school_id, 'Honesty', 3),
    (p_school_id, 'Politeness', 4),
    (p_school_id, 'Attentiveness', 5),
    (p_school_id, 'Attitude to Work', 6),
    (p_school_id, 'Relationship with Others', 7),
    (p_school_id, 'Leadership', 8),
    (p_school_id, 'Emotional Stability', 9),
    (p_school_id, 'Sense of Responsibility', 10)
  ON CONFLICT (school_id, name) DO NOTHING;

  -- Nigerian standard psychomotor skills
  INSERT INTO psychomotor_skills (school_id, name, sequence) VALUES
    (p_school_id, 'Handwriting', 1),
    (p_school_id, 'Drawing', 2),
    (p_school_id, 'Painting', 3),
    (p_school_id, 'Sports/Games', 4),
    (p_school_id, 'Music', 5),
    (p_school_id, 'Verbal Fluency', 6),
    (p_school_id, 'Manipulative Skills', 7),
    (p_school_id, 'Public Speaking', 8)
  ON CONFLICT (school_id, name) DO NOTHING;

  -- Default report settings
  INSERT INTO report_card_settings (school_id) VALUES (p_school_id)
  ON CONFLICT (school_id) DO NOTHING;

  -- Sample teacher comments by score range
  INSERT INTO comment_presets (school_id, comment_type, score_min, score_max, text, sequence) VALUES
    (p_school_id, 'teacher', 75, 100, 'Excellent performance. Keep it up!', 1),
    (p_school_id, 'teacher', 65, 74.99, 'Very good work. Aim higher.', 2),
    (p_school_id, 'teacher', 50, 64.99, 'Good effort. Can do better with more focus.', 3),
    (p_school_id, 'teacher', 40, 49.99, 'Fair. Needs more attention and practice.', 4),
    (p_school_id, 'teacher', 0, 39.99, 'Weak performance. Requires urgent improvement.', 5),
    (p_school_id, 'principal', 75, 100, 'A brilliant term. Congratulations!', 1),
    (p_school_id, 'principal', 50, 74.99, 'Good result. Keep working hard.', 2),
    (p_school_id, 'principal', 0, 49.99, 'Must work harder to improve.', 3)
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CALCULATE TOTAL & GRADE FROM SCORES (helper)
-- =====================================================
CREATE OR REPLACE FUNCTION calculate_grade(p_school_id UUID, p_total NUMERIC)
RETURNS TABLE(grade TEXT, remark TEXT, color TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT gb.grade, gb.remark, gb.color
  FROM grade_bands gb
  JOIN grade_scales gs ON gs.id = gb.grade_scale_id
  WHERE gs.school_id = p_school_id AND gs.is_default = true
    AND p_total >= gb.min_score AND p_total <= gb.max_score
  ORDER BY gb.sequence
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
