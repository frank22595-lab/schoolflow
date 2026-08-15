-- =====================================================
-- SCHOOL ONBOARDING: SEED DEFAULT ROLES AND PERMISSIONS
-- Called when a new school is created
-- =====================================================

CREATE OR REPLACE FUNCTION seed_default_roles_for_school(p_school_id UUID)
RETURNS VOID AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Principal (all permissions)
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Principal', 'principal', 'School head with full control', true, 10)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions;

  -- Vice Principal (most permissions except sensitive financial)
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Vice Principal', 'vice_principal', 'Deputy principal', true, 20)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code NOT IN ('staff.edit_salary', 'subscription.manage', 'users.impersonate');

  -- Academic Head / HOD
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Head of Department', 'hod', 'Manages academics for a department', true, 30)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'users.view', 'students.view.all', 'staff.view.all', 'parents.view',
    'grades.enter.own_subjects', 'grades.moderate', 'grades.view.own',
    'attendance.view.all', 'reports.academic'
  );

  -- Class Teacher
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Class Teacher', 'class_teacher', 'Pastoral head of a class', true, 40)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.own_class', 'parents.view',
    'attendance.mark.own_section', 'attendance.view.own_section',
    'grades.enter.own_subjects', 'grades.view.own',
    'announcements.create', 'reports.attendance'
  );

  -- Subject Teacher
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Subject Teacher', 'teacher', 'Teaches specific subjects', true, 50)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.own_class',
    'grades.enter.own_subjects', 'grades.view.own'
  );

  -- Bursar
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Bursar', 'bursar', 'Finance and accounts officer', true, 60)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.all', 'parents.view',
    'fees.setup', 'fees.generate_invoices', 'fees.record_payment',
    'fees.apply_discount', 'fees.send_reminders',
    'expenses.create', 'expenses.view',
    'reports.financial'
  );

  -- Head Bursar
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Head Bursar', 'head_bursar', 'Senior finance officer with reversal authority', true, 55)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.all', 'parents.view',
    'fees.setup', 'fees.generate_invoices', 'fees.record_payment',
    'fees.reverse_payment', 'fees.approve_reversal',
    'fees.apply_discount', 'fees.approve_waiver', 'fees.send_reminders',
    'expenses.create', 'expenses.approve', 'expenses.view',
    'reports.financial', 'audit.view'
  );

  -- Attendance Officer
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Attendance Officer', 'attendance_officer', 'Dedicated attendance marker', true, 70)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.all',
    'attendance.mark.any_section', 'attendance.view.all',
    'reports.attendance'
  );

  -- Nurse / Health Officer
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Nurse', 'nurse', 'Manages student medical records', true, 80)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'school.view', 'students.view.all', 'parents.view'
  );

  -- Parent
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Parent', 'parent', 'Parent or guardian', true, 90)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'grades.view.own_child', 'fees.view.own_child'
  );

  -- Student (for Phase 2)
  INSERT INTO roles (school_id, name, code, description, is_system, sort_order)
  VALUES (p_school_id, 'Student', 'student', 'Student user (Phase 2)', true, 100)
  RETURNING id INTO v_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_role_id, id, true FROM permissions
  WHERE code IN (
    'grades.view.own'
  );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: seed roles automatically on school creation
CREATE OR REPLACE FUNCTION trigger_seed_school_roles()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_default_roles_for_school(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_school_seed_roles
  AFTER INSERT ON schools
  FOR EACH ROW
  EXECUTE FUNCTION trigger_seed_school_roles();
