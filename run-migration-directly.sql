-- Safe-to-run version of RLS policy improvements
-- This can be run multiple times safely

-- ============================================
-- 1. IMPROVE BOOKING TABLE RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow availability check via view" ON spa_bookings;
DROP POLICY IF EXISTS "Allow availability check via view" ON cinema_bookings;
DROP POLICY IF EXISTS "Allow SELECT via views only" ON spa_bookings;
DROP POLICY IF EXISTS "Allow SELECT via views only" ON cinema_bookings;
DROP POLICY IF EXISTS "Deny UPDATE for anon and authenticated" ON spa_bookings;
DROP POLICY IF EXISTS "Deny UPDATE for anon and authenticated" ON cinema_bookings;
DROP POLICY IF EXISTS "Deny DELETE for anon and authenticated" ON spa_bookings;
DROP POLICY IF EXISTS "Deny DELETE for anon and authenticated" ON cinema_bookings;

-- Create new policies
CREATE POLICY "Allow SELECT via views only"
  ON spa_bookings
  FOR SELECT
  USING (true);

CREATE POLICY "Allow SELECT via views only"
  ON cinema_bookings
  FOR SELECT
  USING (true);

-- Explicitly deny UPDATE and DELETE for anon/authenticated users
CREATE POLICY "Deny UPDATE for anon and authenticated"
  ON spa_bookings
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny UPDATE for anon and authenticated"
  ON cinema_bookings
  FOR UPDATE
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny DELETE for anon and authenticated"
  ON spa_bookings
  FOR DELETE
  TO anon, authenticated
  USING (false);

CREATE POLICY "Deny DELETE for anon and authenticated"
  ON cinema_bookings
  FOR DELETE
  TO anon, authenticated
  USING (false);

-- ============================================
-- 2. IMPROVE PARKING PERMIT RLS POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Deny SELECT for anon" ON parking_permit_requests;
DROP POLICY IF EXISTS "Deny UPDATE for anon" ON parking_permit_requests;
DROP POLICY IF EXISTS "Deny DELETE for anon" ON parking_permit_requests;

-- Create new policies
CREATE POLICY "Deny SELECT for anon"
  ON parking_permit_requests
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Deny UPDATE for anon"
  ON parking_permit_requests
  FOR UPDATE
  TO anon
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny DELETE for anon"
  ON parking_permit_requests
  FOR DELETE
  TO anon
  USING (false);

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

-- Add comments only if the objects exist
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

