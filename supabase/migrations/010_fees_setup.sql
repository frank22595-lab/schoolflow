-- =====================================================
-- CHUNK 4 (Part A): Fees Setup
-- Fee heads, fee structures, discounts, bank accounts
-- =====================================================

-- =====================================================
-- FEE HEADS - Types of fees (Tuition, PTA, Uniform, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_heads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  short_name TEXT,
  code TEXT,
  category TEXT DEFAULT 'academic' CHECK (category IN (
    'academic', 'boarding', 'transport', 'uniform', 'books',
    'meals', 'exam', 'development', 'pta', 'other'
  )),
  is_mandatory BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT true,
  recurrence TEXT DEFAULT 'per_term' CHECK (recurrence IN ('per_term', 'per_session', 'one_time', 'monthly')),
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_fee_heads_school ON fee_heads(school_id, is_active);

COMMENT ON TABLE fee_heads IS 'Types of fees the school charges. Configured once, reused every term.';

-- =====================================================
-- FEE STRUCTURES - Fee amounts per class per term
-- =====================================================
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE CASCADE,
  class_level_id UUID NOT NULL REFERENCES class_levels(id) ON DELETE CASCADE,
  fee_head_id UUID NOT NULL REFERENCES fee_heads(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  is_optional BOOLEAN DEFAULT false,
  boarding_only BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, term_id, class_level_id, fee_head_id)
);

CREATE INDEX IF NOT EXISTS idx_fee_structures_lookup ON fee_structures(school_id, session_id, term_id, class_level_id);

COMMENT ON TABLE fee_structures IS 'Fee amounts per class level per term. E.g. JSS 1 Tuition = 50,000 for Term 1 of 2025/2026.';

-- =====================================================
-- DISCOUNTS - Discount types (sibling, staff, scholarship)
-- =====================================================
CREATE TABLE IF NOT EXISTS discounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT,
  discount_type TEXT DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed_amount')),
  value NUMERIC(12, 2) NOT NULL CHECK (value >= 0),
  category TEXT DEFAULT 'general' CHECK (category IN (
    'sibling', 'staff', 'scholarship', 'early_bird', 'bursary', 'general'
  )),
  applies_to_fee_head_ids UUID[],
  min_qualifying_children INT,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, name)
);

CREATE INDEX IF NOT EXISTS idx_discounts_school ON discounts(school_id, is_active);

-- =====================================================
-- BANK ACCOUNTS - Where fees are paid to
-- =====================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  account_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  branch TEXT,
  sort_code TEXT,
  swift_code TEXT,
  currency TEXT DEFAULT 'NGN',
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_on_receipts BOOLEAN DEFAULT true,
  display_on_invoices BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (school_id, account_number)
);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_school ON bank_accounts(school_id, is_active);

-- Only ONE primary bank account per school
CREATE OR REPLACE FUNCTION enforce_single_primary_bank_account()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE bank_accounts SET is_primary = false
    WHERE school_id = NEW.school_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_single_primary_bank ON bank_accounts;
CREATE TRIGGER trg_single_primary_bank
  BEFORE INSERT OR UPDATE ON bank_accounts
  FOR EACH ROW EXECUTE FUNCTION enforce_single_primary_bank_account();

-- =====================================================
-- TRIGGERS: updated_at
-- =====================================================
DROP TRIGGER IF EXISTS trg_fee_heads_updated ON fee_heads;
CREATE TRIGGER trg_fee_heads_updated BEFORE UPDATE ON fee_heads FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_fee_structures_updated ON fee_structures;
CREATE TRIGGER trg_fee_structures_updated BEFORE UPDATE ON fee_structures FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_discounts_updated ON discounts;
CREATE TRIGGER trg_discounts_updated BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_bank_accounts_updated ON bank_accounts;
CREATE TRIGGER trg_bank_accounts_updated BEFORE UPDATE ON bank_accounts FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE fee_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['fee_heads', 'fee_structures', 'discounts', 'bank_accounts'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING ((school_id = current_user_school_id() AND user_has_permission(''fees.setup'')) OR is_super_admin())
      WITH CHECK ((school_id = current_user_school_id() AND user_has_permission(''fees.setup'')) OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- =====================================================
-- HELPER: Seed common Nigerian fee heads
-- =====================================================
CREATE OR REPLACE FUNCTION seed_common_fee_heads(p_school_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO fee_heads (school_id, name, short_name, category, is_mandatory, recurrence, sort_order) VALUES
    (p_school_id, 'Tuition Fee', 'TUI', 'academic', true, 'per_term', 1),
    (p_school_id, 'Development Levy', 'DEV', 'development', true, 'per_session', 2),
    (p_school_id, 'PTA Levy', 'PTA', 'pta', true, 'per_session', 3),
    (p_school_id, 'Exam Fee', 'EXM', 'exam', true, 'per_term', 4),
    (p_school_id, 'Books & Stationery', 'BKS', 'books', false, 'per_term', 5),
    (p_school_id, 'Uniform', 'UNF', 'uniform', false, 'one_time', 6),
    (p_school_id, 'Lunch / Feeding', 'LNC', 'meals', false, 'per_term', 7),
    (p_school_id, 'Bus / Transport', 'BUS', 'transport', false, 'per_term', 8),
    (p_school_id, 'Boarding Fee', 'BRD', 'boarding', false, 'per_term', 9),
    (p_school_id, 'Sports Fee', 'SPT', 'other', false, 'per_term', 10),
    (p_school_id, 'ICT / Computer Fee', 'ICT', 'academic', false, 'per_term', 11),
    (p_school_id, 'Medical Fee', 'MED', 'other', false, 'per_session', 12)
  ON CONFLICT (school_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
