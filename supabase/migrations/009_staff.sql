-- =====================================================
-- CHUNK 3 (Part 2): Staff
-- =====================================================

CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,

  -- Identity
  staff_number TEXT NOT NULL,
  title TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,

  -- Role classification
  staff_type TEXT DEFAULT 'teaching' CHECK (staff_type IN (
    'teaching', 'non_teaching', 'admin', 'management', 'support'
  )),
  designation TEXT,
  department TEXT,

  -- Contact
  primary_phone TEXT,
  alternate_phone TEXT,
  email TEXT,
  whatsapp_number TEXT,

  -- Demographics
  gender TEXT CHECK (gender IN ('male', 'female')),
  date_of_birth DATE,
  nationality TEXT DEFAULT 'Nigerian',
  state_of_origin TEXT,
  lga TEXT,
  religion TEXT,
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed', 'other')),

  -- Address
  home_address TEXT,
  city TEXT,
  state TEXT,

  -- Employment
  employment_date DATE,
  employment_type TEXT DEFAULT 'full_time' CHECK (employment_type IN (
    'full_time', 'part_time', 'contract', 'nysc', 'volunteer'
  )),
  qualifications TEXT,
  specialization TEXT,
  years_of_experience INT,

  -- Emergency contact
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relationship TEXT,

  -- Media
  photo_url TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'terminated', 'resigned', 'retired')),
  status_reason TEXT,
  status_date DATE,
  end_date DATE,

  notes TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  deleted_at TIMESTAMPTZ,

  UNIQUE (school_id, staff_number)
);

CREATE INDEX IF NOT EXISTS idx_staff_school ON staff(school_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(school_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_type ON staff(school_id, staff_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_staff_name ON staff(school_id, last_name, first_name);

COMMENT ON TABLE staff IS 'All school staff including teachers, admins, and support workers.';

-- Trigger
DROP TRIGGER IF EXISTS trg_staff_updated ON staff;
CREATE TRIGGER trg_staff_updated BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT TO authenticated
  USING (school_id = current_user_school_id() OR is_super_admin());

DROP POLICY IF EXISTS "staff_manage" ON staff;
CREATE POLICY "staff_manage" ON staff FOR ALL TO authenticated
  USING ((school_id = current_user_school_id() AND (user_has_permission('staff.create') OR user_has_permission('staff.edit'))) OR is_super_admin())
  WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission('staff.create') OR user_has_permission('staff.edit'))) OR is_super_admin());
