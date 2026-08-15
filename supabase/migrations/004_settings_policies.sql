-- =====================================================
-- Allow school users with school.edit permission to update their own school
-- =====================================================

-- The existing schools_update policy needs to check permission properly
-- Let's make sure Principal role can update the school

-- First, ensure the current authenticated user's school can be updated by them
-- if they hold school.edit permission
DROP POLICY IF EXISTS "schools_update" ON schools;
CREATE POLICY "schools_update" ON schools FOR UPDATE
  TO authenticated
  USING (
    (id = current_user_school_id() AND user_has_permission('school.edit'))
    OR is_super_admin()
  )
  WITH CHECK (
    (id = current_user_school_id() AND user_has_permission('school.edit'))
    OR is_super_admin()
  );
