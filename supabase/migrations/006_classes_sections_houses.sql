-- =====================================================
-- CHUNK 2 (Part 2): Classes, Sections, Houses
-- =====================================================

-- =====================================================
-- CLASS_LEVELS - Permanent academic ladder
-- =====================================================
CREATE TABLE IF NOT EXISTS class_levels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  category TEXT NOT NULL CHECK (category IN ('creche', 'nursery', 'primary', 'junior_secondary', 'senior_secondary')),
  sequence INT NOT NULL,
  next_level_id UUID REFERENCES class_levels(id) ON DELETE SET NULL,
  minimum_age INT,
  maximum_age INT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_class_levels_school ON class_levels(school_id, sequence);

COMMENT ON TABLE class_levels IS 'The permanent ladder (Nursery 1, Primary 1, JSS 1, SS 1). Independent of session.';

-- =====================================================
-- CLASSES - Session-scoped class instances
-- =====================================================
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INT,
  class_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, class_level_id)
);

CREATE INDEX IF NOT EXISTS idx_classes_school_session ON classes(school_id, session_id);

COMMENT ON TABLE classes IS 'A class instance for a specific session. "JSS 1 in 2025/2026" is distinct from "JSS 1 in 2024/2025".';

-- =====================================================
-- SECTIONS - Arms of a class (JSS 1A, JSS 1B)
-- =====================================================
CREATE TABLE IF NOT EXISTS sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  full_name TEXT,
  capacity INT DEFAULT 40,
  stream TEXT CHECK (stream IN ('science', 'arts', 'commercial', 'technical')),
  section_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  room TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (class_id, name)
);

CREATE INDEX IF NOT EXISTS idx_sections_school ON sections(school_id);
CREATE INDEX IF NOT EXISTS idx_sections_class ON sections(class_id);

COMMENT ON TABLE sections IS 'Sub-divisions of a class (JSS 1A, JSS 1B). Every student belongs to exactly one section.';

-- =====================================================
-- HOUSES - School houses for inter-house competitions
-- =====================================================
CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT,
  motto TEXT,
  patron_teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_houses_school ON houses(school_id);

-- =====================================================
-- TRIGGERS: updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trg_class_levels_updated ON class_levels;
CREATE TRIGGER trg_class_levels_updated BEFORE UPDATE ON class_levels FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_classes_updated ON classes;
CREATE TRIGGER trg_classes_updated BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sections_updated ON sections;
CREATE TRIGGER trg_sections_updated BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_houses_updated ON houses;
CREATE TRIGGER trg_houses_updated BEFORE UPDATE ON houses FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE class_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;

-- Class levels
DROP POLICY IF EXISTS "class_levels_select" ON class_levels;
CREATE POLICY "class_levels_select" ON class_levels FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "class_levels_manage" ON class_levels;
CREATE POLICY "class_levels_manage" ON class_levels FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin());

-- Classes
DROP POLICY IF EXISTS "classes_select" ON classes;
CREATE POLICY "classes_select" ON classes FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "classes_manage" ON classes;
CREATE POLICY "classes_manage" ON classes FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin());

-- Sections
DROP POLICY IF EXISTS "sections_select" ON sections;
CREATE POLICY "sections_select" ON sections FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "sections_manage" ON sections;
CREATE POLICY "sections_manage" ON sections FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin());

-- Houses
DROP POLICY IF EXISTS "houses_select" ON houses;
CREATE POLICY "houses_select" ON houses FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "houses_manage" ON houses;
CREATE POLICY "houses_manage" ON houses FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('academic.setup')) OR is_super_admin());

-- =====================================================
-- HELPER: Bulk seed common Nigerian class levels
-- Call from UI to quickly populate: seed_common_class_levels(school_id, levels)
-- =====================================================
CREATE OR REPLACE FUNCTION seed_common_class_levels(p_school_id UUID, p_categories TEXT[])
RETURNS VOID AS $$
DECLARE
  v_seq INT := 1;
BEGIN
  IF 'creche' = ANY(p_categories) THEN
    INSERT INTO class_levels (school_id, name, short_name, category, sequence, minimum_age, maximum_age)
    VALUES (p_school_id, 'Crèche', 'CR', 'creche', v_seq, 0, 2)
    ON CONFLICT (school_id, name) DO NOTHING;
    v_seq := v_seq + 1;
  END IF;

  IF 'nursery' = ANY(p_categories) THEN
    INSERT INTO class_levels (school_id, name, short_name, category, sequence, minimum_age, maximum_age) VALUES
      (p_school_id, 'Nursery 1', 'N1', 'nursery', v_seq, 3, 4),
      (p_school_id, 'Nursery 2', 'N2', 'nursery', v_seq + 1, 4, 5)
    ON CONFLICT (school_id, name) DO NOTHING;
    v_seq := v_seq + 2;
  END IF;

  IF 'primary' = ANY(p_categories) THEN
    INSERT INTO class_levels (school_id, name, short_name, category, sequence, minimum_age, maximum_age) VALUES
      (p_school_id, 'Primary 1', 'P1', 'primary', v_seq, 5, 6),
      (p_school_id, 'Primary 2', 'P2', 'primary', v_seq + 1, 6, 7),
      (p_school_id, 'Primary 3', 'P3', 'primary', v_seq + 2, 7, 8),
      (p_school_id, 'Primary 4', 'P4', 'primary', v_seq + 3, 8, 9),
      (p_school_id, 'Primary 5', 'P5', 'primary', v_seq + 4, 9, 10),
      (p_school_id, 'Primary 6', 'P6', 'primary', v_seq + 5, 10, 11)
    ON CONFLICT (school_id, name) DO NOTHING;
    v_seq := v_seq + 6;
  END IF;

  IF 'junior_secondary' = ANY(p_categories) THEN
    INSERT INTO class_levels (school_id, name, short_name, category, sequence, minimum_age, maximum_age) VALUES
      (p_school_id, 'JSS 1', 'JSS1', 'junior_secondary', v_seq, 11, 12),
      (p_school_id, 'JSS 2', 'JSS2', 'junior_secondary', v_seq + 1, 12, 13),
      (p_school_id, 'JSS 3', 'JSS3', 'junior_secondary', v_seq + 2, 13, 14)
    ON CONFLICT (school_id, name) DO NOTHING;
    v_seq := v_seq + 3;
  END IF;

  IF 'senior_secondary' = ANY(p_categories) THEN
    INSERT INTO class_levels (school_id, name, short_name, category, sequence, minimum_age, maximum_age) VALUES
      (p_school_id, 'SS 1', 'SS1', 'senior_secondary', v_seq, 14, 15),
      (p_school_id, 'SS 2', 'SS2', 'senior_secondary', v_seq + 1, 15, 16),
      (p_school_id, 'SS 3', 'SS3', 'senior_secondary', v_seq + 2, 16, 17)
    ON CONFLICT (school_id, name) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- HELPER: Seed common Nigerian houses (Red, Blue, Green, Yellow)
-- =====================================================
CREATE OR REPLACE FUNCTION seed_common_houses(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO houses (school_id, name, color) VALUES
    (p_school_id, 'Red House', '#EF4444'),
    (p_school_id, 'Blue House', '#3B82F6'),
    (p_school_id, 'Green House', '#10B981'),
    (p_school_id, 'Yellow House', '#F59E0B')
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
