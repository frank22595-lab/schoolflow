-- =====================================================
-- CHUNK 3 (Part 1): Students, Parents, Enrollments
-- =====================================================

-- =====================================================
-- STUDENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Identity
  admission_number TEXT NOT NULL,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Current placement (denormalized for speed)
  current_enrollment_id UUID,
  current_section_id UUID,
  house_id UUID REFERENCES houses(id) ON DELETE SET NULL,

  -- Names
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,

  -- Demographics
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT DEFAULT 'Nigerian',
  state_of_origin TEXT,
  lga TEXT,
  religion TEXT,

  -- Health (critical in Nigerian schools)
  blood_group TEXT CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  genotype TEXT CHECK (genotype IN ('AA', 'AS', 'SS', 'AC', 'SC')),

  -- Address
  home_address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',

  -- Media & documents
  photo_url TEXT,
  id_card_url TEXT,
  id_card_generated_at TIMESTAMPTZ,

  -- Boarding & transport
  is_boarder BOOLEAN DEFAULT false,
  boarding_house TEXT,
  transport_mode TEXT CHECK (transport_mode IN ('parent_drop', 'school_bus', 'public_transport', 'walk', 'private_transport', 'other')),
  bus_route_id UUID,

  -- Previous school
  previous_school_name TEXT,
  previous_school_class TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'graduated', 'withdrawn', 'suspended', 'expelled')),
  status_reason TEXT,
  status_date DATE,

  -- Special needs
  special_needs TEXT,
  medical_alert_flag BOOLEAN DEFAULT false,

  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,

  -- Sync
  sync_version INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,

  UNIQUE (school_id, admission_number)
);

CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_status ON students(school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_section ON students(current_section_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_students_admission ON students(school_id, admission_number);
CREATE INDEX IF NOT EXISTS idx_students_name ON students(school_id, last_name, first_name);

COMMENT ON TABLE students IS 'Student profiles with Nigerian context (state of origin, LGA, genotype, blood group).';

-- =====================================================
-- PARENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Identity (Nigerian titles matter culturally)
  title TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,

  -- Contact
  primary_phone TEXT NOT NULL,
  alternate_phone TEXT,
  whatsapp_number TEXT,
  email TEXT,

  -- Address
  home_address TEXT,
  city TEXT,
  state TEXT,

  -- Work
  occupation TEXT,
  employer TEXT,
  work_address TEXT,
  work_phone TEXT,

  -- Access (code-based lookup for parent portal)
  access_code TEXT NOT NULL,
  access_code_expires_at TIMESTAMPTZ,

  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  communication_channels TEXT[] DEFAULT ARRAY['whatsapp', 'sms'],
  notification_opt_ins JSONB DEFAULT '{}'::jsonb,

  photo_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (school_id, access_code)
);

CREATE INDEX IF NOT EXISTS idx_parents_school ON parents(school_id);
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(school_id, primary_phone);
CREATE INDEX IF NOT EXISTS idx_parents_access_code ON parents(access_code);

-- =====================================================
-- STUDENT_PARENTS - Links students to parents
-- =====================================================
CREATE TABLE IF NOT EXISTS student_parents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN (
    'father', 'mother', 'guardian', 'grandparent', 'uncle', 'aunt', 'sponsor', 'other'
  )),
  relationship_other TEXT,
  is_primary_contact BOOLEAN DEFAULT false,
  is_emergency_contact BOOLEAN DEFAULT false,
  is_report_recipient BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_student_parents_student ON student_parents(student_id);
CREATE INDEX IF NOT EXISTS idx_student_parents_parent ON student_parents(parent_id);

-- =====================================================
-- ENROLLMENTS - Student-section per session
-- =====================================================
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  enrollment_type TEXT DEFAULT 'new_admission' CHECK (enrollment_type IN (
    'new_admission', 'promoted', 'repeated', 'transferred_in'
  )),
  promoted_from_section_id UUID REFERENCES sections(id) ON DELETE SET NULL,
  withdrawn_date DATE,
  withdrawal_reason TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'withdrawn', 'graduated', 'transferred_out')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, session_id)
);

CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_section ON enrollments(section_id, status);
CREATE INDEX IF NOT EXISTS idx_enrollments_session ON enrollments(school_id, session_id);

-- Add FKs on students table now that enrollments exists
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_enrollment_fk;
ALTER TABLE students ADD CONSTRAINT students_enrollment_fk
  FOREIGN KEY (current_enrollment_id) REFERENCES enrollments(id) ON DELETE SET NULL;

ALTER TABLE students DROP CONSTRAINT IF EXISTS students_section_fk;
ALTER TABLE students ADD CONSTRAINT students_section_fk
  FOREIGN KEY (current_section_id) REFERENCES sections(id) ON DELETE SET NULL;

-- =====================================================
-- Triggers
-- =====================================================
DROP TRIGGER IF EXISTS trg_students_updated ON students;
CREATE TRIGGER trg_students_updated BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_parents_updated ON parents;
CREATE TRIGGER trg_parents_updated BEFORE UPDATE ON parents FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_enrollments_updated ON enrollments;
CREATE TRIGGER trg_enrollments_updated BEFORE UPDATE ON enrollments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Students
DROP POLICY IF EXISTS "students_select" ON students;
CREATE POLICY "students_select" ON students FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "students_manage" ON students;
CREATE POLICY "students_manage" ON students FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND (user_has_permission('students.create') OR user_has_permission('students.edit'))) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission('students.create') OR user_has_permission('students.edit'))) OR is_super_admin());

-- Parents
DROP POLICY IF EXISTS "parents_select" ON parents;
CREATE POLICY "parents_select" ON parents FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "parents_manage" ON parents;
CREATE POLICY "parents_manage" ON parents FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND (user_has_permission('parents.edit') OR user_has_permission('students.create'))) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission('parents.edit') OR user_has_permission('students.create'))) OR is_super_admin());

-- Student-parents
DROP POLICY IF EXISTS "student_parents_select" ON student_parents;
CREATE POLICY "student_parents_select" ON student_parents FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "student_parents_manage" ON student_parents;
CREATE POLICY "student_parents_manage" ON student_parents FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND (user_has_permission('students.create') OR user_has_permission('students.edit'))) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission('students.create') OR user_has_permission('students.edit'))) OR is_super_admin());

-- Enrollments
DROP POLICY IF EXISTS "enrollments_select" ON enrollments;
CREATE POLICY "enrollments_select" ON enrollments FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "enrollments_manage" ON enrollments;
CREATE POLICY "enrollments_manage" ON enrollments FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND user_has_permission('students.create')) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND user_has_permission('students.create')) OR is_super_admin());

-- =====================================================
-- HELPER: Generate unique access code for parent
-- =====================================================
CREATE OR REPLACE FUNCTION generate_parent_access_code(p_school_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
  v_exists BOOLEAN;
  v_chars TEXT := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; -- no confusing chars
  i INT;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..8 LOOP
      v_code := v_code || substr(v_chars, floor(random() * length(v_chars) + 1)::int, 1);
    END LOOP;
    SELECT EXISTS(SELECT 1 FROM parents WHERE school_id = p_school_id AND access_code = v_code) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- HELPER: Auto-update student.current_enrollment_id and current_section_id
-- =====================================================
CREATE OR REPLACE FUNCTION update_student_current_placement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE students
    SET current_enrollment_id = NEW.id,
        current_section_id = NEW.section_id
    WHERE id = NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_update_student_placement ON enrollments;
CREATE TRIGGER trg_update_student_placement
  AFTER INSERT OR UPDATE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION update_student_current_placement();
