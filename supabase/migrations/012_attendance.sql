-- =====================================================
-- CHUNK 5: Attendance
-- =====================================================

-- =====================================================
-- ATTENDANCE SESSIONS - one per class per day (or per period)
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,
  section_id UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,

  attendance_date DATE NOT NULL,
  period TEXT DEFAULT 'morning' CHECK (period IN ('morning', 'afternoon', 'full_day', 'custom')),
  period_label TEXT,

  -- Summary counts (denormalized for speed)
  total_students INT NOT NULL DEFAULT 0,
  present_count INT NOT NULL DEFAULT 0,
  absent_count INT NOT NULL DEFAULT 0,
  late_count INT NOT NULL DEFAULT 0,
  excused_count INT NOT NULL DEFAULT 0,

  notes TEXT,
  is_final BOOLEAN DEFAULT false,
  finalized_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (section_id, attendance_date, period)
);

CREATE INDEX IF NOT EXISTS idx_att_sessions_school ON attendance_sessions(school_id, attendance_date DESC);
CREATE INDEX IF NOT EXISTS idx_att_sessions_section ON attendance_sessions(section_id, attendance_date DESC);

-- =====================================================
-- ATTENDANCE RECORDS - individual student marks
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  attendance_session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN (
    'present', 'absent', 'late', 'excused', 'sick'
  )),
  arrival_time TIME,
  minutes_late INT,
  reason TEXT,
  notes TEXT,

  marked_by UUID REFERENCES users(id) ON DELETE SET NULL,
  marked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (attendance_session_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_att_records_session ON attendance_records(attendance_session_id);
CREATE INDEX IF NOT EXISTS idx_att_records_student ON attendance_records(student_id, marked_at DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_att_sessions_updated ON attendance_sessions;
CREATE TRIGGER trg_att_sessions_updated BEFORE UPDATE ON attendance_sessions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-update session summary counts when records change
CREATE OR REPLACE FUNCTION update_attendance_session_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_session_id UUID;
BEGIN
  v_session_id := COALESCE(NEW.attendance_session_id, OLD.attendance_session_id);

  UPDATE attendance_sessions SET
    present_count = (SELECT COUNT(*) FROM attendance_records WHERE attendance_session_id = v_session_id AND status = 'present'),
    absent_count = (SELECT COUNT(*) FROM attendance_records WHERE attendance_session_id = v_session_id AND status = 'absent'),
    late_count = (SELECT COUNT(*) FROM attendance_records WHERE attendance_session_id = v_session_id AND status = 'late'),
    excused_count = (SELECT COUNT(*) FROM attendance_records WHERE attendance_session_id = v_session_id AND status IN ('excused', 'sick')),
    total_students = (SELECT COUNT(*) FROM attendance_records WHERE attendance_session_id = v_session_id)
  WHERE id = v_session_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_counts ON attendance_records;
CREATE TRIGGER trg_attendance_counts
  AFTER INSERT OR UPDATE OR DELETE ON attendance_records
  FOR EACH ROW EXECUTE FUNCTION update_attendance_session_counts();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['attendance_sessions', 'attendance_records'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING ((school_id = current_user_school_id() AND (user_has_permission(''attendance.create'') OR user_has_permission(''attendance.edit''))) OR is_super_admin())
      WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission(''attendance.create'') OR user_has_permission(''attendance.edit''))) OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- =====================================================
-- HELPER: Get or create attendance session for a class + date
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_attendance_session(
  p_school_id UUID,
  p_session_id UUID,
  p_term_id UUID,
  p_section_id UUID,
  p_date DATE,
  p_period TEXT DEFAULT 'morning',
  p_created_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_student RECORD;
BEGIN
  SELECT id INTO v_id FROM attendance_sessions
  WHERE section_id = p_section_id AND attendance_date = p_date AND period = p_period;

  IF v_id IS NOT NULL THEN RETURN v_id; END IF;

  INSERT INTO attendance_sessions (
    school_id, session_id, term_id, section_id, attendance_date, period, created_by
  ) VALUES (p_school_id, p_session_id, p_term_id, p_section_id, p_date, p_period, p_created_by)
  RETURNING id INTO v_id;

  -- Pre-create records for all enrolled students, defaulting to 'present'
  FOR v_student IN
    SELECT DISTINCT s.id FROM students s
    JOIN enrollments e ON e.student_id = s.id
    WHERE e.section_id = p_section_id
      AND e.session_id = p_session_id
      AND e.status = 'active'
      AND s.deleted_at IS NULL
  LOOP
    INSERT INTO attendance_records (school_id, attendance_session_id, student_id, status, marked_by)
    VALUES (p_school_id, v_id, v_student.id, 'present', p_created_by)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
