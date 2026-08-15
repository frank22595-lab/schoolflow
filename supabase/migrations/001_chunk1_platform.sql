-- =====================================================
-- CHUNK 1: PLATFORM FOUNDATION
-- School Groups, Schools, Users, Roles, Permissions, Audit
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. SCHOOL GROUPS
-- =====================================================
CREATE TABLE school_groups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_user_id UUID,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE school_groups IS 'Multi-branch school proprietors (e.g., Chrisland Schools). Standalone schools do not use this.';

-- =====================================================
-- 2. SCHOOLS - The tenant anchor
-- =====================================================
CREATE TABLE schools (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_group_id UUID REFERENCES school_groups(id) ON DELETE SET NULL,

  -- Identity
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  short_code TEXT NOT NULL UNIQUE,
  levels_offered TEXT[] NOT NULL DEFAULT '{}',
  display_label TEXT,

  -- Contact
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'Nigeria',
  phone TEXT,
  email TEXT,
  website TEXT,

  -- Branding
  logo_url TEXT,
  motto TEXT,
  established_year INT,

  -- Academic calendar
  academic_calendar_type TEXT DEFAULT '3-term' CHECK (academic_calendar_type IN ('3-term', '2-semester', 'custom')),
  academic_year_starts_month INT DEFAULT 9 CHECK (academic_year_starts_month BETWEEN 1 AND 12),
  academic_year_ends_month INT DEFAULT 7 CHECK (academic_year_ends_month BETWEEN 1 AND 12),
  current_session_id UUID,
  current_term_id UUID,

  -- Regional
  timezone TEXT DEFAULT 'Africa/Lagos',
  currency TEXT DEFAULT 'NGN',
  locale TEXT DEFAULT 'en-NG',

  -- Status
  status TEXT DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'suspended', 'archived')),
  trial_ends_at TIMESTAMPTZ,
  admissions_open BOOLEAN DEFAULT true,

  -- Onboarding
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_step TEXT,

  -- Preferences
  report_card_footer_text TEXT,
  receipt_footer_text TEXT,
  default_pass_mark INT DEFAULT 40,
  settings JSONB DEFAULT '{}'::jsonb,

  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_schools_group ON schools(school_group_id) WHERE school_group_id IS NOT NULL;
CREATE INDEX idx_schools_status ON schools(status);
CREATE INDEX idx_schools_slug ON schools(slug);

COMMENT ON TABLE schools IS 'The tenant anchor. Every row is one school. All tenant tables reference this via school_id.';

-- =====================================================
-- 3. USERS - All human accounts
-- =====================================================
CREATE TABLE users (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE CASCADE,

  -- Identity
  email TEXT UNIQUE,
  phone TEXT,
  title TEXT,
  first_name TEXT NOT NULL,
  middle_name TEXT,
  last_name TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- Demographics
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  date_of_birth DATE,
  nationality TEXT DEFAULT 'Nigerian',
  state_of_origin TEXT,
  whatsapp_number TEXT,

  -- Access
  is_super_admin BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  password_last_changed TIMESTAMPTZ,
  mfa_enabled BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,

  -- Preferences
  preferred_language TEXT DEFAULT 'en',
  notification_preferences JSONB DEFAULT '{"email":true,"whatsapp":true,"sms":false,"push":true}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Meta
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_users_school ON users(school_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_email ON users(email) WHERE email IS NOT NULL;
CREATE INDEX idx_users_super_admin ON users(is_super_admin) WHERE is_super_admin = true;

COMMENT ON TABLE users IS 'Every human in the system. Extends Supabase auth.users. Role-specific data in students/staff/parents tables.';

-- =====================================================
-- 4. ROLES - Per-school role definitions
-- =====================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  is_default_for TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, code)
);

CREATE INDEX idx_roles_school ON roles(school_id);

COMMENT ON TABLE roles IS 'Roles defined per school. 13 defaults seeded on onboarding; schools can add custom.';

-- =====================================================
-- 5. PERMISSIONS - Global permission definitions
-- =====================================================
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL,
  action TEXT NOT NULL,
  scope TEXT,
  description TEXT,
  is_sensitive BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_permissions_module ON permissions(module);

COMMENT ON TABLE permissions IS 'Global master list of every action. Same across all schools; role_permissions maps them per role per school.';

-- =====================================================
-- 6. ROLE_PERMISSIONS - Which permissions each role has
-- =====================================================
CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

-- =====================================================
-- 7. USER_ROLES - Assign roles to users
-- =====================================================
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  scope_data JSONB,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id, is_active);
CREATE INDEX idx_user_roles_school_role ON user_roles(school_id, role_id);

-- =====================================================
-- 8. AUDIT_LOGS - Immutable audit trail
-- =====================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  before_state JSONB,
  after_state JSONB,
  ip_address INET,
  user_agent TEXT,
  device_id TEXT,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  request_id TEXT,
  context JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_school_date ON audit_logs(school_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('warning', 'critical');

COMMENT ON TABLE audit_logs IS 'Immutable audit trail. Never edited, never deleted. Records every important action.';

-- =====================================================
-- 9. SUBSCRIPTIONS - Billing status per school
-- =====================================================
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL UNIQUE REFERENCES schools(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'trial' CHECK (plan IN ('trial', 'basic', 'standard', 'premium', 'enterprise')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'expired')),
  trial_started_at TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  amount NUMERIC(10,2),
  currency TEXT DEFAULT 'NGN',
  billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'termly', 'annual')),
  payment_method TEXT,
  external_customer_id TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- 10. INVITATIONS - Pending user invites
-- =====================================================
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  phone TEXT,
  invited_role_id UUID REFERENCES roles(id) ON DELETE SET NULL,
  invited_scope_data JSONB,
  invited_by UUID REFERENCES users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  sent_via TEXT[] DEFAULT '{}',
  accepted_at TIMESTAMPTZ,
  accepted_user_id UUID REFERENCES users(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_school_status ON invitations(school_id, status);
CREATE INDEX idx_invitations_token ON invitations(invitation_token) WHERE status = 'pending';

-- =====================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =====================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need it
CREATE TRIGGER trg_school_groups_updated BEFORE UPDATE ON school_groups FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_schools_updated BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_roles_updated BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_role_permissions_updated BEFORE UPDATE ON role_permissions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_subscriptions_updated BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
