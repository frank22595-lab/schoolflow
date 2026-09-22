-- =====================================================
-- Drop 16A: CBT Question Bank foundation
-- question_banks, questions, passages + question-images storage
-- =====================================================

-- =====================================================
-- QUESTION BANKS — one per subject+class_level combo (school-scoped)
-- =====================================================
CREATE TABLE IF NOT EXISTS question_banks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_question_banks_school ON question_banks(school_id);
CREATE INDEX IF NOT EXISTS idx_question_banks_subject_class ON question_banks(school_id, subject_id, class_level_id);

-- =====================================================
-- PASSAGES — shared reading-comprehension text a question can reference
-- (not wired into the UI yet; foundational for later CBT drops)
-- =====================================================
CREATE TABLE IF NOT EXISTS passages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  bank_id UUID REFERENCES question_banks(id) ON DELETE CASCADE,
  title TEXT,
  passage_text TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_passages_school ON passages(school_id);
CREATE INDEX IF NOT EXISTS idx_passages_bank ON passages(bank_id);

-- =====================================================
-- QUESTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  bank_id UUID NOT NULL REFERENCES question_banks(id) ON DELETE CASCADE,
  passage_id UUID REFERENCES passages(id) ON DELETE SET NULL,

  question_type TEXT NOT NULL CHECK (question_type IN (
    'mcq_single', 'mcq_multiple', 'true_false', 'fill_blank', 'short_answer', 'essay'
  )),
  difficulty TEXT NOT NULL DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  topic TEXT,

  question_text TEXT NOT NULL,
  question_image_url TEXT,

  -- Type-specific answer payloads (shape enforced by the API layer, not the DB):
  --   mcq_single / mcq_multiple -> options:  [{id, text, image_url, is_correct}, ...]
  --   true_false                -> correct_answer:     {correct: boolean}
  --   fill_blank                -> acceptable_answers: {acceptable_answers: string[], case_sensitive: boolean}
  --   short_answer / essay      -> none (manually graded)
  options JSONB,
  correct_answer JSONB,
  acceptable_answers JSONB,

  points NUMERIC(5,2) NOT NULL DEFAULT 1,
  explanation TEXT,

  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_questions_school ON questions(school_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_questions_bank ON questions(bank_id);
CREATE INDEX IF NOT EXISTS idx_questions_passage ON questions(passage_id);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_question_banks_updated ON question_banks;
CREATE TRIGGER trg_question_banks_updated BEFORE UPDATE ON question_banks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_passages_updated ON passages;
CREATE TRIGGER trg_passages_updated BEFORE UPDATE ON passages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_questions_updated ON questions;
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE question_banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['question_banks', 'passages', 'questions'])
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
-- STORAGE: question-images bucket
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('question-images', 'question-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "question_images_public_read" ON storage.objects;
CREATE POLICY "question_images_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'question-images');

-- Uploads go through the API route using the service-role client (bypasses these
-- policies entirely); kept as defense-in-depth for any future direct-from-browser upload.
DROP POLICY IF EXISTS "question_images_auth_write" ON storage.objects;
CREATE POLICY "question_images_auth_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'question-images' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "question_images_auth_update" ON storage.objects;
CREATE POLICY "question_images_auth_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'question-images' AND (storage.foldername(name))[1] = current_user_school_id()::text);

DROP POLICY IF EXISTS "question_images_auth_delete" ON storage.objects;
CREATE POLICY "question_images_auth_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'question-images' AND (storage.foldername(name))[1] = current_user_school_id()::text);
