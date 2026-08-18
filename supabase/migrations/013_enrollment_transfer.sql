-- =====================================================
-- Add transfer support to enrollments
-- =====================================================

-- Add transfer_reason if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'transfer_reason') THEN
    ALTER TABLE enrollments ADD COLUMN transfer_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'end_date') THEN
    ALTER TABLE enrollments ADD COLUMN end_date DATE;
  END IF;
END $$;

-- Update status check constraint to include 'transferred' if not already
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'enrollments_status_check') THEN
    ALTER TABLE enrollments DROP CONSTRAINT enrollments_status_check;
  END IF;
  ALTER TABLE enrollments ADD CONSTRAINT enrollments_status_check
    CHECK (status IN ('active', 'transferred', 'graduated', 'withdrawn', 'suspended', 'expelled'));
END $$;
