-- =====================================================
-- CHUNK 2 (Part 1): Academic Calendar - Sessions & Terms
-- =====================================================

-- =====================================================
-- SESSIONS - Academic year container
-- =====================================================
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sessions_school_current ON sessions(school_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_sessions_school ON sessions(school_id);

COMMENT ON TABLE sessions IS 'Academic year container (e.g., 2025/2026). Only one is_current per school.';

-- Ensure only ONE current session per school
CREATE OR REPLACE FUNCTION enforce_single_current_session()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE sessions SET is_current = false
    WHERE school_id = NEW.school_id AND id != NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_current_session ON sessions;
CREATE TRIGGER trg_single_current_session
  BEFORE INSERT OR UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_current_session();

-- =====================================================
-- TERMS - Terms within a session
-- =====================================================
CREATE TABLE IF NOT EXISTS terms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  sequence INT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  resumption_date DATE,
  vacation_date DATE,
  is_current BOOLEAN DEFAULT false,
  is_closed BOOLEAN DEFAULT false,
  mid_term_break_start DATE,
  mid_term_break_end DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_terms_school_current ON terms(school_id, is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_terms_session ON terms(session_id);

COMMENT ON TABLE terms IS 'Terms within a session. Configurable count per school (usually 2 or 3).';

-- Ensure only ONE current term per school
CREATE OR REPLACE FUNCTION enforce_single_current_term()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_current = true THEN
    UPDATE terms SET is_current = false
    WHERE school_id = NEW.school_id AND id != NEW.id AND is_current = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_current_term ON terms;
CREATE TRIGGER trg_single_current_term
  BEFORE INSERT OR UPDATE ON terms
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_current_term();

-- Auto updated_at triggers
DROP TRIGGER IF EXISTS trg_sessions_updated ON sessions;
CREATE TRIGGER trg_sessions_updated BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_terms_updated ON terms;
CREATE TRIGGER trg_terms_updated BEFORE UPDATE ON terms FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- ADD FK TO SCHOOLS for current_session_id and current_term_id
-- (Was defined earlier as UUID but without FK due to circular dep)
-- =====================================================
ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_current_session_fk;
ALTER TABLE schools ADD CONSTRAINT schools_current_session_fk
  FOREIGN KEY (current_session_id) REFERENCES sessions(id) ON DELETE SET NULL;

ALTER TABLE schools DROP CONSTRAINT IF EXISTS schools_current_term_fk;
ALTER TABLE schools ADD CONSTRAINT schools_current_term_fk
  FOREIGN KEY (current_term_id) REFERENCES terms(id) ON DELETE SET NULL;

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms ENABLE ROW LEVEL SECURITY;

-- Sessions: users see their school's sessions
DROP POLICY IF EXISTS "sessions_select" ON sessions;
CREATE POLICY "sessions_select" ON sessions FOR SELECT
  TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "sessions_manage" ON sessions;
CREATE POLICY "sessions_manage" ON sessions FOR ALL
  TO authenticated
  USING (
    (school_id = current_user_school_id() AND user_has_permission('academic.setup'))
    OR is_super_admin()
  )
  WITH CHECK (
    (school_id = current_user_school_id() AND user_has_permission('academic.setup'))
    OR is_super_admin()
  );

-- Terms: users see their school's terms
DROP POLICY IF EXISTS "terms_select" ON terms;
CREATE POLICY "terms_select" ON terms FOR SELECT
  TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "terms_manage" ON terms;
CREATE POLICY "terms_manage" ON terms FOR ALL
  TO authenticated
  USING (
    (school_id = current_user_school_id() AND user_has_permission('academic.setup'))
    OR is_super_admin()
  )
  WITH CHECK (
    (school_id = current_user_school_id() AND user_has_permission('academic.setup'))
    OR is_super_admin()
  );
