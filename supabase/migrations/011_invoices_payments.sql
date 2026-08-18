-- =====================================================
-- CHUNK 4 (Part B): Invoicing & Payments
-- =====================================================

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  term_id UUID REFERENCES terms(id) ON DELETE SET NULL,

  invoice_number TEXT NOT NULL,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,

  -- Snapshot of student info (in case student changes class later)
  student_name TEXT NOT NULL,
  student_admission_number TEXT NOT NULL,
  class_name TEXT,
  section_name TEXT,

  -- Totals
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  discount_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  paid_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  balance NUMERIC(12, 2) GENERATED ALWAYS AS (total - paid_total) STORED,

  -- Status
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'overdue', 'cancelled')),
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,

  UNIQUE (school_id, invoice_number)
);

CREATE INDEX IF NOT EXISTS idx_invoices_school ON invoices(school_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_student ON invoices(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_term ON invoices(school_id, session_id, term_id, status);

-- =====================================================
-- INVOICE LINES (each fee head on the invoice)
-- =====================================================
CREATE TABLE IF NOT EXISTS invoice_lines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  fee_head_id UUID REFERENCES fee_heads(id) ON DELETE SET NULL,

  description TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(12, 2) GENERATED ALWAYS AS (amount - discount_amount) STORED,
  discount_id UUID REFERENCES discounts(id) ON DELETE SET NULL,

  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice ON invoice_lines(invoice_id);

-- =====================================================
-- PAYMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

  receipt_number TEXT NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),

  method TEXT NOT NULL DEFAULT 'cash' CHECK (method IN (
    'cash', 'bank_transfer', 'pos', 'cheque', 'online', 'mobile_money', 'other'
  )),
  reference TEXT,
  bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL,

  received_by TEXT,
  paid_by TEXT,
  notes TEXT,

  -- Voidance
  is_voided BOOLEAN DEFAULT false,
  voided_at TIMESTAMPTZ,
  voided_by UUID REFERENCES users(id) ON DELETE SET NULL,
  voided_reason TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,

  UNIQUE (school_id, receipt_number)
);

CREATE INDEX IF NOT EXISTS idx_payments_school ON payments(school_id, is_voided);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(school_id, payment_date DESC);

-- =====================================================
-- TRIGGERS
-- =====================================================
DROP TRIGGER IF EXISTS trg_invoices_updated ON invoices;
CREATE TRIGGER trg_invoices_updated BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_payments_updated ON payments;
CREATE TRIGGER trg_payments_updated BEFORE UPDATE ON payments FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Auto-update invoice paid_total and status when payments change
CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_paid NUMERIC(12, 2);
  v_total NUMERIC(12, 2);
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, OLD.invoice_id);

  SELECT COALESCE(SUM(amount), 0) INTO v_paid
  FROM payments WHERE invoice_id = v_invoice_id AND is_voided = false;

  SELECT total INTO v_total FROM invoices WHERE id = v_invoice_id;

  UPDATE invoices SET
    paid_total = v_paid,
    status = CASE
      WHEN v_paid >= v_total THEN 'paid'
      WHEN v_paid > 0 THEN 'partial'
      WHEN due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
      ELSE 'unpaid'
    END
  WHERE id = v_invoice_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_updates_invoice ON payments;
CREATE TRIGGER trg_payment_updates_invoice
  AFTER INSERT OR UPDATE OR DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_totals();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['invoices', 'invoice_lines', 'payments'])
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%1$s_select" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_select" ON %1$s FOR SELECT TO authenticated
      USING (school_id = current_user_school_id() OR is_super_admin())', tbl);

    EXECUTE format('DROP POLICY IF EXISTS "%1$s_manage" ON %1$s', tbl);
    EXECUTE format('CREATE POLICY "%1$s_manage" ON %1$s FOR ALL TO authenticated
      USING ((school_id = current_user_school_id() AND (user_has_permission(''fees.create'') OR user_has_permission(''fees.edit''))) OR is_super_admin())
      WITH CHECK ((school_id = current_user_school_id() AND (user_has_permission(''fees.create'') OR user_has_permission(''fees.edit''))) OR is_super_admin())', tbl);
  END LOOP;
END $$;

-- =====================================================
-- HELPERS: Number generators
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invoice_number(p_school_id UUID, p_session_name TEXT)
RETURNS TEXT AS $$
DECLARE
  v_short_code TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT short_code INTO v_short_code FROM schools WHERE id = p_school_id;
  v_year := to_char(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '[0-9]+$') AS INT)), 0) + 1
    INTO v_seq FROM invoices WHERE school_id = p_school_id;

  RETURN COALESCE(v_short_code, 'INV') || '/INV/' || v_year || '/' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_receipt_number(p_school_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_short_code TEXT;
  v_year TEXT;
  v_seq INT;
BEGIN
  SELECT short_code INTO v_short_code FROM schools WHERE id = p_school_id;
  v_year := to_char(NOW(), 'YY');

  SELECT COALESCE(MAX(CAST(SUBSTRING(receipt_number FROM '[0-9]+$') AS INT)), 0) + 1
    INTO v_seq FROM payments WHERE school_id = p_school_id;

  RETURN COALESCE(v_short_code, 'RCP') || '/RCP/' || v_year || '/' || LPAD(v_seq::TEXT, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- BULK INVOICE GENERATION
-- =====================================================
CREATE OR REPLACE FUNCTION generate_invoices_for_term(
  p_school_id UUID,
  p_session_id UUID,
  p_term_id UUID,
  p_class_level_ids UUID[] DEFAULT NULL,
  p_created_by UUID DEFAULT NULL
)
RETURNS TABLE(created_count INT, skipped_count INT) AS $$
DECLARE
  v_student RECORD;
  v_fee RECORD;
  v_invoice_id UUID;
  v_invoice_num TEXT;
  v_subtotal NUMERIC(12, 2);
  v_session_name TEXT;
  v_created INT := 0;
  v_skipped INT := 0;
BEGIN
  SELECT name INTO v_session_name FROM sessions WHERE id = p_session_id;

  FOR v_student IN
    SELECT
      s.id, s.first_name, s.middle_name, s.last_name, s.admission_number,
      s.is_boarder,
      cl.id AS class_level_id, cl.name AS class_name,
      sec.name AS section_name
    FROM students s
    JOIN enrollments e ON e.student_id = s.id AND e.session_id = p_session_id AND e.status = 'active'
    JOIN sections sec ON sec.id = e.section_id
    JOIN classes c ON c.id = sec.class_id
    JOIN class_levels cl ON cl.id = c.class_level_id
    WHERE s.school_id = p_school_id
      AND s.deleted_at IS NULL
      AND (p_class_level_ids IS NULL OR cl.id = ANY(p_class_level_ids))
  LOOP
    -- Skip if invoice already exists
    IF EXISTS (SELECT 1 FROM invoices WHERE student_id = v_student.id AND session_id = p_session_id AND term_id = p_term_id AND status != 'cancelled') THEN
      v_skipped := v_skipped + 1;
      CONTINUE;
    END IF;

    v_invoice_num := generate_invoice_number(p_school_id, v_session_name);
    v_subtotal := 0;

    INSERT INTO invoices (
      school_id, student_id, session_id, term_id,
      invoice_number, invoice_date,
      student_name, student_admission_number, class_name, section_name,
      subtotal, total, created_by
    ) VALUES (
      p_school_id, v_student.id, p_session_id, p_term_id,
      v_invoice_num, CURRENT_DATE,
      TRIM(v_student.first_name || ' ' || COALESCE(v_student.middle_name || ' ', '') || v_student.last_name),
      v_student.admission_number,
      v_student.class_name, v_student.section_name,
      0, 0, p_created_by
    ) RETURNING id INTO v_invoice_id;

    -- Add lines for applicable fee heads
    FOR v_fee IN
      SELECT fs.amount, fh.name, fh.id AS fee_head_id, fs.is_optional, fs.boarding_only
      FROM fee_structures fs
      JOIN fee_heads fh ON fh.id = fs.fee_head_id
      WHERE fs.school_id = p_school_id
        AND fs.session_id = p_session_id
        AND (fs.term_id = p_term_id OR fs.term_id IS NULL)
        AND fs.class_level_id = v_student.class_level_id
        AND fh.is_active = true
        AND NOT fs.is_optional
        AND (NOT fs.boarding_only OR v_student.is_boarder)
    LOOP
      INSERT INTO invoice_lines (school_id, invoice_id, fee_head_id, description, amount)
      VALUES (p_school_id, v_invoice_id, v_fee.fee_head_id, v_fee.name, v_fee.amount);
      v_subtotal := v_subtotal + v_fee.amount;
    END LOOP;

    UPDATE invoices SET subtotal = v_subtotal, total = v_subtotal WHERE id = v_invoice_id;
    v_created := v_created + 1;
  END LOOP;

  RETURN QUERY SELECT v_created, v_skipped;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
