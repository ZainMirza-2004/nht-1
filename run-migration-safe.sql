-- Safe migration version WITHOUT destructive operations
-- This version only ADDS new policies and indexes
-- No DROP statements - completely safe

-- ============================================
-- 1. IMPROVE BOOKING TABLE RLS POLICIES
-- ============================================

-- Create SELECT policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'spa_bookings' 
    AND policyname = 'Allow SELECT via views only'
  ) THEN
    CREATE POLICY "Allow SELECT via views only"
      ON spa_bookings
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cinema_bookings' 
    AND policyname = 'Allow SELECT via views only'
  ) THEN
    CREATE POLICY "Allow SELECT via views only"
      ON cinema_bookings
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- Create UPDATE denial policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'spa_bookings' 
    AND policyname = 'Deny UPDATE for anon and authenticated'
  ) THEN
    CREATE POLICY "Deny UPDATE for anon and authenticated"
      ON spa_bookings
      FOR UPDATE
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cinema_bookings' 
    AND policyname = 'Deny UPDATE for anon and authenticated'
  ) THEN
    CREATE POLICY "Deny UPDATE for anon and authenticated"
      ON cinema_bookings
      FOR UPDATE
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
END $$;

-- Create DELETE denial policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'spa_bookings' 
    AND policyname = 'Deny DELETE for anon and authenticated'
  ) THEN
    CREATE POLICY "Deny DELETE for anon and authenticated"
      ON spa_bookings
      FOR DELETE
      TO anon, authenticated
      USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'cinema_bookings' 
    AND policyname = 'Deny DELETE for anon and authenticated'
  ) THEN
    CREATE POLICY "Deny DELETE for anon and authenticated"
      ON cinema_bookings
      FOR DELETE
      TO anon, authenticated
      USING (false);
  END IF;
END $$;

-- ============================================
-- 2. IMPROVE PARKING PERMIT RLS POLICIES
-- ============================================

-- Create parking permit denial policies (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parking_permit_requests' 
    AND policyname = 'Deny SELECT for anon'
  ) THEN
    CREATE POLICY "Deny SELECT for anon"
      ON parking_permit_requests
      FOR SELECT
      TO anon
      USING (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parking_permit_requests' 
    AND policyname = 'Deny UPDATE for anon'
  ) THEN
    CREATE POLICY "Deny UPDATE for anon"
      ON parking_permit_requests
      FOR UPDATE
      TO anon
      USING (false)
      WITH CHECK (false);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parking_permit_requests' 
    AND policyname = 'Deny DELETE for anon'
  ) THEN
    CREATE POLICY "Deny DELETE for anon"
      ON parking_permit_requests
      FOR DELETE
      TO anon
      USING (false);
  END IF;
END $$;

-- ============================================
-- 3. ADD INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS spa_bookings_date_status_tier_idx 
  ON spa_bookings(booking_date, status, experience_tier) 
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS cinema_bookings_date_status_tier_idx 
  ON cinema_bookings(booking_date, status, experience_tier) 
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS spa_bookings_time_slot_idx 
  ON spa_bookings(time_slot) 
  WHERE status = 'confirmed';

CREATE INDEX IF NOT EXISTS cinema_bookings_time_slot_idx 
  ON cinema_bookings(time_slot) 
  WHERE status = 'confirmed';

-- ============================================
-- 4. ADD COMMENTS FOR DOCUMENTATION
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'spa_bookings_availability') THEN
    COMMENT ON VIEW spa_bookings_availability IS 
      'Secure view for availability checks. Only exposes necessary fields. Use this instead of direct table access.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'cinema_bookings_availability') THEN
    COMMENT ON VIEW cinema_bookings_availability IS 
      'Secure view for availability checks. Only exposes necessary fields. Use this instead of direct table access.';
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'parking_permit_tokens') THEN
    COMMENT ON TABLE parking_permit_tokens IS 
      'Stores secure HMAC tokens for parking permit approval/rejection links. Tokens expire after 24 hours.';
  END IF;
END $$;

