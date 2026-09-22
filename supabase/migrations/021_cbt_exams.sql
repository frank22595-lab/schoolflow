-- =====================================================
-- Drop 16B: CBT Exam Builder foundation
-- exams, exam_questions + total_points auto-recalc trigger
-- =====================================================

CREATE TABLE IF NOT EXISTS exams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT,
  instructions TEXT,

  duration_minutes INT NOT NULL DEFAULT 60,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,

  total_points NUMERIC(6,2) NOT NULL DEFAULT 0,  -- kept in sync with exam_questions by trigger, below
  passing_score NUMERIC(5,2) NOT NULL DEFAULT 50, -- percentage

  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'live', 'ended', 'archived')),

  randomize_questions BOOLEAN NOT NULL DEFAULT true,
  randomize_options BOOLEAN NOT NULL DEFAULT true,
  show_results_immediately BOOLEAN NOT NULL DEFAULT false,
  allow_calculator BOOLEAN NOT NULL DEFAULT false,
  attempts_allowed INT NOT NULL DEFAULT 1,
  require_fullscreen BOOLEAN NOT NULL DEFAULT true,
  prevent_copy_paste BOOLEAN NOT NULL DEFAULT true,
  detect_tab_switch BOOLEAN NOT NULL DEFAULT true,
  auto_submit_on_time_up BOOLEAN NOT NULL DEFAULT true,
  auto_post_to_grades BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_exams_school ON exams(school_id);
CREATE INDEX IF NOT EXISTS idx_exams_status ON exams(school_id, status);
CREATE INDEX IF NOT EXISTS idx_exams_subject_class ON exams(subject_id, class_level_id);

-- =====================================================
-- EXAM_QUESTIONS — join table, one row per question on an exam
-- =====================================================
CREATE TABLE IF NOT EXISTS exam_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  display_order INT NOT NULL DEFAULT 0,
  points NUMERIC(5,2) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (exam_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam ON exam_questions(exam_id, display_order);
CREATE INDEX IF NOT EXISTS idx_exam_questions_question ON exam_questions(question_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_exams_updated ON exams;
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON exams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Keep exams.total_points in sync with SUM(exam_questions.points) whenever
-- questions are added, removed, or re-pointed on an exam.
CREATE OR REPLACE FUNCTION recalc_exam_total_points()
RETURNS TRIGGER AS $$
DECLARE
  v_exam_id UUID;
BEGIN
  v_exam_id := COALESCE(NEW.exam_id, OLD.exam_id);
  UPDATE exams SET total_points = COALESCE((
    SELECT SUM(points) FROM exam_questions WHERE exam_id = v_exam_id
  ), 0)
  WHERE id = v_exam_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_exam_questions_recalc ON exam_questions;
CREATE TRIGGER trg_exam_questions_recalc
  AFTER INSERT OR UPDATE OR DELETE ON exam_questions
  FOR EACH ROW EXECUTE FUNCTION recalc_exam_total_points();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_questions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['exams', 'exam_questions'])
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
