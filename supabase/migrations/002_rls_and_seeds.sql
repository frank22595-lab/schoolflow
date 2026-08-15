-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Helper: get current user's school_id from users table
CREATE OR REPLACE FUNCTION current_user_school_id()
RETURNS UUID AS $$
  SELECT school_id FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if current user is super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN AS $$
  SELECT COALESCE(is_super_admin, false) FROM users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: check if user has a specific permission
CREATE OR REPLACE FUNCTION user_has_permission(perm_code TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON rp.role_id = ur.role_id
    JOIN permissions p ON p.id = rp.permission_id
    WHERE ur.user_id = auth.uid()
      AND ur.is_active = true
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
      AND rp.granted = true
      AND p.code = perm_code
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- ENABLE RLS ON ALL TENANT TABLES
-- =====================================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
-- permissions is intentionally NOT RLS-protected (public reference table)

-- =====================================================
-- POLICIES
-- =====================================================

-- Schools: users see their own school; super admins see all
CREATE POLICY "schools_select" ON schools FOR SELECT
  USING (id = current_user_school_id() OR is_super_admin());
CREATE POLICY "schools_update" ON schools FOR UPDATE
  USING ((id = current_user_school_id() AND user_has_permission('school.edit')) OR is_super_admin());
CREATE POLICY "schools_insert" ON schools FOR INSERT
  WITH CHECK (is_super_admin());

-- Users: see users in same school; super admins see all
CREATE POLICY "users_select" ON users FOR SELECT
  USING (school_id = current_user_school_id() OR id = auth.uid() OR is_super_admin());
CREATE POLICY "users_update_self" ON users FOR UPDATE
  USING (id = auth.uid());
CREATE POLICY "users_update_admin" ON users FOR UPDATE
  USING (school_id = current_user_school_id() AND user_has_permission('users.edit'));

-- Roles: scoped to school
CREATE POLICY "roles_select" ON roles FOR SELECT
  USING (school_id = current_user_school_id() OR is_super_admin());
CREATE POLICY "roles_manage" ON roles FOR ALL
  USING ((school_id = current_user_school_id() AND user_has_permission('roles.manage')) OR is_super_admin());

-- Role permissions: through role
CREATE POLICY "role_permissions_select" ON role_permissions FOR SELECT
  USING (role_id IN (SELECT id FROM roles WHERE school_id = current_user_school_id()) OR is_super_admin());
CREATE POLICY "role_permissions_manage" ON role_permissions FOR ALL
  USING (
    (role_id IN (SELECT id FROM roles WHERE school_id = current_user_school_id())
     AND user_has_permission('roles.manage'))
    OR is_super_admin()
  );

-- User roles: scoped to school
CREATE POLICY "user_roles_select" ON user_roles FOR SELECT
  USING (school_id = current_user_school_id() OR user_id = auth.uid() OR is_super_admin());
CREATE POLICY "user_roles_manage" ON user_roles FOR ALL
  USING ((school_id = current_user_school_id() AND user_has_permission('users.assign_roles')) OR is_super_admin());

-- Audit logs: read-only for those with permission
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING ((school_id = current_user_school_id() AND user_has_permission('audit.view')) OR is_super_admin());
CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (true); -- Any authenticated user can insert audit entries

-- Subscriptions: only admins see
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT
  USING ((school_id = current_user_school_id() AND user_has_permission('subscription.view')) OR is_super_admin());

-- Invitations
CREATE POLICY "invitations_select" ON invitations FOR SELECT
  USING (school_id = current_user_school_id() OR is_super_admin());
CREATE POLICY "invitations_manage" ON invitations FOR ALL
  USING ((school_id = current_user_school_id() AND user_has_permission('users.invite')) OR is_super_admin());

-- School groups
CREATE POLICY "school_groups_select" ON school_groups FOR SELECT
  USING (
    id IN (SELECT school_group_id FROM schools WHERE id = current_user_school_id())
    OR is_super_admin()
  );

-- =====================================================
-- SEED: CORE PERMISSIONS
-- =====================================================
INSERT INTO permissions (code, module, action, scope, description, is_sensitive) VALUES
  -- School management
  ('school.view', 'school', 'view', 'school_wide', 'View school details', false),
  ('school.edit', 'school', 'edit', 'school_wide', 'Edit school settings', true),

  -- Users
  ('users.view', 'users', 'view', 'school_wide', 'View users in school', false),
  ('users.create', 'users', 'create', 'school_wide', 'Create new users', true),
  ('users.edit', 'users', 'edit', 'school_wide', 'Edit user details', true),
  ('users.deactivate', 'users', 'deactivate', 'school_wide', 'Deactivate users', true),
  ('users.invite', 'users', 'invite', 'school_wide', 'Send user invitations', false),
  ('users.assign_roles', 'users', 'assign_roles', 'school_wide', 'Assign roles to users', true),
  ('users.impersonate', 'users', 'impersonate', 'school_wide', 'Log in as another user', true),

  -- Roles
  ('roles.view', 'roles', 'view', 'school_wide', 'View roles and permissions', false),
  ('roles.manage', 'roles', 'manage', 'school_wide', 'Create/edit/delete roles', true),

  -- Audit
  ('audit.view', 'audit', 'view', 'school_wide', 'View audit logs', true),

  -- Subscription
  ('subscription.view', 'subscription', 'view', 'school_wide', 'View subscription details', false),
  ('subscription.manage', 'subscription', 'manage', 'school_wide', 'Manage subscription', true),

  -- Students
  ('students.view.all', 'students', 'view', 'school_wide', 'View all students in school', false),
  ('students.view.own_class', 'students', 'view', 'own_class', 'View students in own class', false),
  ('students.create', 'students', 'create', 'school_wide', 'Add new students', false),
  ('students.edit', 'students', 'edit', 'school_wide', 'Edit student records', false),
  ('students.delete', 'students', 'delete', 'school_wide', 'Delete student records', true),
  ('students.bulk_import', 'students', 'bulk_import', 'school_wide', 'Bulk import students', false),

  -- Staff
  ('staff.view.all', 'staff', 'view', 'school_wide', 'View all staff', false),
  ('staff.create', 'staff', 'create', 'school_wide', 'Add new staff', false),
  ('staff.edit', 'staff', 'edit', 'school_wide', 'Edit staff records', false),
  ('staff.view_salary', 'staff', 'view_salary', 'school_wide', 'View staff salary details', true),
  ('staff.edit_salary', 'staff', 'edit_salary', 'school_wide', 'Edit staff salaries', true),

  -- Parents
  ('parents.view', 'parents', 'view', 'school_wide', 'View parent records', false),
  ('parents.edit', 'parents', 'edit', 'school_wide', 'Edit parent records', false),
  ('parents.regenerate_code', 'parents', 'regenerate_code', 'school_wide', 'Regenerate parent access codes', false),

  -- Academic
  ('academic.setup', 'academic', 'setup', 'school_wide', 'Configure sessions, terms, classes', true),
  ('academic.promote_students', 'academic', 'promote_students', 'school_wide', 'Run promotion tool', true),

  -- Attendance
  ('attendance.mark.own_section', 'attendance', 'mark', 'own_section', 'Mark attendance for own sections', false),
  ('attendance.mark.any_section', 'attendance', 'mark', 'any_section', 'Mark attendance for any section', false),
  ('attendance.edit', 'attendance', 'edit', 'school_wide', 'Edit past attendance records', true),
  ('attendance.view.own_section', 'attendance', 'view', 'own_section', 'View own section attendance', false),
  ('attendance.view.all', 'attendance', 'view', 'school_wide', 'View all attendance', false),
  ('attendance.lock', 'attendance', 'lock', 'school_wide', 'Lock attendance sessions', true),

  -- Grades
  ('grades.enter.own_subjects', 'grades', 'enter', 'own_subjects', 'Enter grades for assigned subjects', false),
  ('grades.moderate', 'grades', 'moderate', 'own_department', 'HOD moderation of grades', false),
  ('grades.publish', 'grades', 'publish', 'school_wide', 'Publish results', true),
  ('grades.approve_change', 'grades', 'approve_change', 'school_wide', 'Approve grade change requests', true),
  ('grades.view.own', 'grades', 'view', 'own', 'View own grades', false),
  ('grades.view.own_child', 'grades', 'view', 'own_child', 'Parent view of child grades', false),

  -- Fees
  ('fees.setup', 'fees', 'setup', 'school_wide', 'Configure fee heads and structures', true),
  ('fees.generate_invoices', 'fees', 'generate_invoices', 'school_wide', 'Generate invoices', false),
  ('fees.record_payment', 'fees', 'record_payment', 'school_wide', 'Record confirmed payments', false),
  ('fees.reverse_payment', 'fees', 'reverse_payment', 'school_wide', 'Reverse a payment', true),
  ('fees.approve_reversal', 'fees', 'approve_reversal', 'school_wide', 'Approve payment reversals', true),
  ('fees.apply_discount', 'fees', 'apply_discount', 'school_wide', 'Apply discounts', false),
  ('fees.approve_waiver', 'fees', 'approve_waiver', 'school_wide', 'Approve fee waivers', true),
  ('fees.view.own_child', 'fees', 'view', 'own_child', 'Parent view of child fees', false),
  ('fees.send_reminders', 'fees', 'send_reminders', 'school_wide', 'Send fee reminders', false),

  -- Expenses
  ('expenses.create', 'expenses', 'create', 'school_wide', 'Record expenses', false),
  ('expenses.approve', 'expenses', 'approve', 'school_wide', 'Approve expenses', true),
  ('expenses.view', 'expenses', 'view', 'school_wide', 'View expense reports', false),

  -- Reports
  ('reports.financial', 'reports', 'view', 'financial', 'View financial reports', false),
  ('reports.academic', 'reports', 'view', 'academic', 'View academic reports', false),
  ('reports.attendance', 'reports', 'view', 'attendance', 'View attendance reports', false),

  -- Communication
  ('announcements.create', 'announcements', 'create', 'school_wide', 'Create announcements', false),
  ('announcements.send', 'announcements', 'send', 'school_wide', 'Send announcements to parents', false),
  ('messaging.send_bulk', 'messaging', 'send_bulk', 'school_wide', 'Send bulk WhatsApp/SMS', false)
ON CONFLICT (code) DO NOTHING;
