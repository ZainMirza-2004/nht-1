-- Fix duplicate RLS policies for better performance
-- Removes redundant SELECT policies and consolidates into single policy

-- ============================================
-- SPA BOOKINGS
-- ============================================

-- Drop the old redundant policy
DROP POLICY IF EXISTS "Anyone can view spa bookings for availability check" ON spa_bookings;

-- Ensure the consolidated policy exists (should already exist from previous migration)
-- If it doesn't exist, create it
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
END $$;

-- ============================================
-- CINEMA BOOKINGS
-- ============================================

-- Drop the old redundant policy
DROP POLICY IF EXISTS "Anyone can view cinema bookings for availability check" ON cinema_bookings;

-- Ensure the consolidated policy exists (should already exist from previous migration)
-- If it doesn't exist, create it
DO $$
BEGIN
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

-- Add comments
COMMENT ON POLICY "Allow SELECT via views only" ON spa_bookings IS 
  'Allows SELECT access for availability checks. Use secure views when possible.';

COMMENT ON POLICY "Allow SELECT via views only" ON cinema_bookings IS 
  'Allows SELECT access for availability checks. Use secure views when possible.';

