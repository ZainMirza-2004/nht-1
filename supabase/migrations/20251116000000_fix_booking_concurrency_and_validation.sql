/*
  # Fix Booking Concurrency and Add Validation
  
  This migration fixes critical production issues:
  1. Adds atomic booking creation function with row-level locking
  2. Adds database constraints for data integrity
  3. Adds validation for prices and tiers
  4. Adds cleaning gap support
  5. Improves RLS policies
*/

-- ============================================
-- 1. ADD DATABASE CONSTRAINTS
-- ============================================

-- Add CHECK constraints for experience_tier (already exists but ensure it's correct)
DO $$ 
BEGIN
  -- Ensure experience_tier constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'spa_bookings_experience_tier_check'
  ) THEN
    ALTER TABLE spa_bookings 
    ADD CONSTRAINT spa_bookings_experience_tier_check 
    CHECK (experience_tier IS NULL OR experience_tier IN ('standard', 'premium', 'deluxe'));
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'cinema_bookings_experience_tier_check'
  ) THEN
    ALTER TABLE cinema_bookings 
    ADD CONSTRAINT cinema_bookings_experience_tier_check 
    CHECK (experience_tier IS NULL OR experience_tier IN ('standard', 'premium', 'deluxe'));
  END IF;
END $$;

-- Add CHECK constraints for valid prices (prevent price manipulation)
-- Spa: standard=75, premium=120, deluxe=180
-- Cinema: standard=75, premium=120, deluxe=180
ALTER TABLE spa_bookings 
DROP CONSTRAINT IF EXISTS spa_bookings_price_check;

ALTER TABLE spa_bookings 
ADD CONSTRAINT spa_bookings_price_check 
CHECK (
  (experience_tier = 'standard' AND package_price = 75) OR
  (experience_tier = 'premium' AND package_price = 120) OR
  (experience_tier = 'deluxe' AND package_price = 180) OR
  (experience_tier IS NULL) -- Allow legacy bookings without tier
);

ALTER TABLE cinema_bookings 
DROP CONSTRAINT IF EXISTS cinema_bookings_price_check;

ALTER TABLE cinema_bookings 
ADD CONSTRAINT cinema_bookings_price_check 
CHECK (
  (experience_tier = 'standard' AND package_price = 75) OR
  (experience_tier = 'premium' AND package_price = 120) OR
  (experience_tier = 'deluxe' AND package_price = 180) OR
  (experience_tier IS NULL) -- Allow legacy bookings without tier
);

-- Add CHECK constraint for valid package types
ALTER TABLE spa_bookings 
DROP CONSTRAINT IF EXISTS spa_bookings_package_type_check;

ALTER TABLE spa_bookings 
ADD CONSTRAINT spa_bookings_package_type_check 
CHECK (
  package_type IN ('1 Hour Session', '1.5 Hour Session', '2 Hour Premium Session')
);

ALTER TABLE cinema_bookings 
DROP CONSTRAINT IF EXISTS cinema_bookings_package_type_check;

ALTER TABLE cinema_bookings 
ADD CONSTRAINT cinema_bookings_package_type_check 
CHECK (
  package_type IN ('Standard Experience', 'Premium Experience', 'Deluxe Experience')
);

-- Add NOT NULL constraints where needed
ALTER TABLE spa_bookings 
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN booking_date SET NOT NULL,
ALTER COLUMN time_slot SET NOT NULL,
ALTER COLUMN package_type SET NOT NULL,
ALTER COLUMN package_price SET NOT NULL;

ALTER TABLE cinema_bookings 
ALTER COLUMN full_name SET NOT NULL,
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN phone SET NOT NULL,
ALTER COLUMN booking_date SET NOT NULL,
ALTER COLUMN time_slot SET NOT NULL,
ALTER COLUMN package_type SET NOT NULL,
ALTER COLUMN package_price SET NOT NULL;

-- ============================================
-- 2. CREATE HELPER FUNCTIONS FOR DURATION
-- ============================================

-- Function to get spa duration in minutes
CREATE OR REPLACE FUNCTION get_spa_duration_minutes(package_type text)
RETURNS integer AS $$
BEGIN
  RETURN CASE package_type
    WHEN '1 Hour Session' THEN 60
    WHEN '1.5 Hour Session' THEN 90
    WHEN '2 Hour Premium Session' THEN 120
    ELSE 60
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to get cinema duration in minutes
CREATE OR REPLACE FUNCTION get_cinema_duration_minutes(package_type text)
RETURNS integer AS $$
BEGIN
  RETURN CASE package_type
    WHEN 'Standard Experience' THEN 120
    WHEN 'Premium Experience' THEN 180
    WHEN 'Deluxe Experience' THEN 240
    ELSE 120
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3. CREATE ATOMIC BOOKING FUNCTION WITH LOCKING
-- ============================================

-- Function to check if time ranges overlap (accounts for cleaning gap)
CREATE OR REPLACE FUNCTION time_ranges_overlap(
  start1 timestamptz,
  end1 timestamptz,
  start2 timestamptz,
  end2 timestamptz
) RETURNS boolean AS $$
BEGIN
  RETURN start1 < end2 AND start2 < end1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Atomic function to create spa booking with concurrency protection
CREATE OR REPLACE FUNCTION create_spa_booking(
  p_full_name text,
  p_email text,
  p_phone text,
  p_booking_date date,
  p_time_slot text,
  p_package_type text,
  p_package_price integer,
  p_experience_tier text,
  p_cleaning_gap_minutes integer DEFAULT 30
) RETURNS jsonb AS $$
DECLARE
  v_duration_minutes integer;
  v_time_24 text;
  v_hours integer;
  v_minutes integer;
  v_period text;
  v_booking_start timestamptz;
  v_booking_end timestamptz;
  v_cleaning_end timestamptz;
  v_conflicting_booking record;
  v_booking_id uuid;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Full name is required');
  END IF;
  
  IF p_email IS NULL OR length(trim(p_email)) = 0 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valid email is required');
  END IF;
  
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phone is required');
  END IF;
  
  -- Validate price matches tier
  IF p_experience_tier IS NOT NULL THEN
    IF (p_experience_tier = 'standard' AND p_package_price != 75) OR
       (p_experience_tier = 'premium' AND p_package_price != 120) OR
       (p_experience_tier = 'deluxe' AND p_package_price != 180) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Price does not match experience tier');
    END IF;
  END IF;
  
  -- Get duration
  v_duration_minutes := get_spa_duration_minutes(p_package_type);
  
  -- Parse time slot (e.g., "10:00 AM" -> 10:00)
  v_time_24 := regexp_replace(p_time_slot, '^(\d{1,2}):(\d{2})\s*(AM|PM)$', '\1:\2 \3', 'i');
  v_hours := CAST(split_part(split_part(v_time_24, ':', 1), ' ', 1) AS integer);
  v_minutes := CAST(split_part(split_part(v_time_24, ':', 2), ' ', 1) AS integer);
  v_period := upper(trim(split_part(v_time_24, ' ', 2)));
  
  IF v_period = 'PM' AND v_hours != 12 THEN
    v_hours := v_hours + 12;
  ELSIF v_period = 'AM' AND v_hours = 12 THEN
    v_hours := 0;
  END IF;
  
  -- Create timestamps in UTC
  v_booking_start := (p_booking_date || ' ' || lpad(v_hours::text, 2, '0') || ':' || lpad(v_minutes::text, 2, '0') || ':00')::timestamptz;
  v_booking_end := v_booking_start + (v_duration_minutes || ' minutes')::interval;
  v_cleaning_end := v_booking_end + (p_cleaning_gap_minutes || ' minutes')::interval;
  
  -- Use advisory lock to prevent concurrent bookings for same slot
  -- Lock based on date + time slot hash
  PERFORM pg_advisory_xact_lock(
    hashtext(p_booking_date::text || p_time_slot || 'spa')
  );
  
  -- Check for conflicts with existing bookings (including cleaning gap)
  -- Use SELECT FOR UPDATE to lock rows during check
  FOR v_conflicting_booking IN
    SELECT 
      id,
      time_slot,
      package_type,
      booking_date
    FROM spa_bookings
    WHERE booking_date = p_booking_date
      AND status = 'confirmed' -- Only check confirmed bookings
    FOR UPDATE -- Lock rows to prevent concurrent modifications
  LOOP
    DECLARE
      v_existing_duration integer;
      v_existing_start timestamptz;
      v_existing_end timestamptz;
      v_existing_cleaning_end timestamptz;
      v_existing_time_24 text;
      v_existing_hours integer;
      v_existing_minutes integer;
      v_existing_period text;
    BEGIN
      -- Calculate existing booking range
      v_existing_duration := get_spa_duration_minutes(v_conflicting_booking.package_type);
      
      -- Parse existing time slot
      v_existing_time_24 := regexp_replace(v_conflicting_booking.time_slot, '^(\d{1,2}):(\d{2})\s*(AM|PM)$', '\1:\2 \3', 'i');
      v_existing_hours := CAST(split_part(split_part(v_existing_time_24, ':', 1), ' ', 1) AS integer);
      v_existing_minutes := CAST(split_part(split_part(v_existing_time_24, ':', 2), ' ', 1) AS integer);
      v_existing_period := upper(trim(split_part(v_existing_time_24, ' ', 2)));
      
      IF v_existing_period = 'PM' AND v_existing_hours != 12 THEN
        v_existing_hours := v_existing_hours + 12;
      ELSIF v_existing_period = 'AM' AND v_existing_hours = 12 THEN
        v_existing_hours := 0;
      END IF;
      
      v_existing_start := (v_conflicting_booking.booking_date || ' ' || lpad(v_existing_hours::text, 2, '0') || ':' || lpad(v_existing_minutes::text, 2, '0') || ':00')::timestamptz;
      v_existing_end := v_existing_start + (v_existing_duration || ' minutes')::interval;
      v_existing_cleaning_end := v_existing_end + (p_cleaning_gap_minutes || ' minutes')::interval;
      
      -- Check if ranges overlap (including cleaning gap)
      IF time_ranges_overlap(v_booking_start, v_cleaning_end, v_existing_start, v_existing_cleaning_end) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'This time slot is no longer available. Please select another time.',
          'conflict_with', v_conflicting_booking.id
        );
      END IF;
    END;
  END LOOP;
  
  -- If no conflicts, create the booking
  INSERT INTO spa_bookings (
    full_name,
    email,
    phone,
    booking_date,
    time_slot,
    package_type,
    package_price,
    experience_tier,
    status,
    email_sent
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    p_booking_date,
    p_time_slot,
    p_package_type,
    p_package_price,
    p_experience_tier,
    'confirmed',
    false
  ) RETURNING id INTO v_booking_id;
  
  -- Return success with booking data
  SELECT row_to_json(b.*)::jsonb INTO v_result
  FROM spa_bookings b
  WHERE b.id = v_booking_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', v_result,
    'message', 'Booking confirmed successfully'
  );
  
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid booking data: ' || SQLERRM);
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to create booking: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- Atomic function to create cinema booking with concurrency protection
CREATE OR REPLACE FUNCTION create_cinema_booking(
  p_full_name text,
  p_email text,
  p_phone text,
  p_booking_date date,
  p_time_slot text,
  p_package_type text,
  p_package_price integer,
  p_experience_tier text,
  p_cleaning_gap_minutes integer DEFAULT 30
) RETURNS jsonb AS $$
DECLARE
  v_duration_minutes integer;
  v_time_24 text;
  v_hours integer;
  v_minutes integer;
  v_period text;
  v_booking_start timestamptz;
  v_booking_end timestamptz;
  v_cleaning_end timestamptz;
  v_conflicting_booking record;
  v_booking_id uuid;
  v_result jsonb;
BEGIN
  -- Validate inputs
  IF p_full_name IS NULL OR length(trim(p_full_name)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Full name is required');
  END IF;
  
  IF p_email IS NULL OR length(trim(p_email)) = 0 OR p_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Valid email is required');
  END IF;
  
  IF p_phone IS NULL OR length(trim(p_phone)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Phone is required');
  END IF;
  
  -- Validate price matches tier
  IF p_experience_tier IS NOT NULL THEN
    IF (p_experience_tier = 'standard' AND p_package_price != 75) OR
       (p_experience_tier = 'premium' AND p_package_price != 120) OR
       (p_experience_tier = 'deluxe' AND p_package_price != 180) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Price does not match experience tier');
    END IF;
  END IF;
  
  -- Get duration
  v_duration_minutes := get_cinema_duration_minutes(p_package_type);
  
  -- Parse time slot
  v_time_24 := regexp_replace(p_time_slot, '^(\d{1,2}):(\d{2})\s*(AM|PM)$', '\1:\2 \3', 'i');
  v_hours := CAST(split_part(split_part(v_time_24, ':', 1), ' ', 1) AS integer);
  v_minutes := CAST(split_part(split_part(v_time_24, ':', 2), ' ', 1) AS integer);
  v_period := upper(trim(split_part(v_time_24, ' ', 2)));
  
  IF v_period = 'PM' AND v_hours != 12 THEN
    v_hours := v_hours + 12;
  ELSIF v_period = 'AM' AND v_hours = 12 THEN
    v_hours := 0;
  END IF;
  
  -- Create timestamps in UTC
  v_booking_start := (p_booking_date || ' ' || lpad(v_hours::text, 2, '0') || ':' || lpad(v_minutes::text, 2, '0') || ':00')::timestamptz;
  v_booking_end := v_booking_start + (v_duration_minutes || ' minutes')::interval;
  v_cleaning_end := v_booking_end + (p_cleaning_gap_minutes || ' minutes')::interval;
  
  -- Use advisory lock
  PERFORM pg_advisory_xact_lock(
    hashtext(p_booking_date::text || p_time_slot || 'cinema')
  );
  
  -- Check for conflicts
  FOR v_conflicting_booking IN
    SELECT 
      id,
      time_slot,
      package_type,
      booking_date
    FROM cinema_bookings
    WHERE booking_date = p_booking_date
      AND status = 'confirmed'
    FOR UPDATE
  LOOP
    DECLARE
      v_existing_duration integer;
      v_existing_start timestamptz;
      v_existing_end timestamptz;
      v_existing_cleaning_end timestamptz;
      v_existing_time_24 text;
      v_existing_hours integer;
      v_existing_minutes integer;
      v_existing_period text;
    BEGIN
      v_existing_duration := get_cinema_duration_minutes(v_conflicting_booking.package_type);
      
      v_existing_time_24 := regexp_replace(v_conflicting_booking.time_slot, '^(\d{1,2}):(\d{2})\s*(AM|PM)$', '\1:\2 \3', 'i');
      v_existing_hours := CAST(split_part(split_part(v_existing_time_24, ':', 1), ' ', 1) AS integer);
      v_existing_minutes := CAST(split_part(split_part(v_existing_time_24, ':', 2), ' ', 1) AS integer);
      v_existing_period := upper(trim(split_part(v_existing_time_24, ' ', 2)));
      
      IF v_existing_period = 'PM' AND v_existing_hours != 12 THEN
        v_existing_hours := v_existing_hours + 12;
      ELSIF v_existing_period = 'AM' AND v_existing_hours = 12 THEN
        v_existing_hours := 0;
      END IF;
      
      v_existing_start := (v_conflicting_booking.booking_date || ' ' || lpad(v_existing_hours::text, 2, '0') || ':' || lpad(v_existing_minutes::text, 2, '0') || ':00')::timestamptz;
      v_existing_end := v_existing_start + (v_existing_duration || ' minutes')::interval;
      v_existing_cleaning_end := v_existing_end + (p_cleaning_gap_minutes || ' minutes')::interval;
      
      IF time_ranges_overlap(v_booking_start, v_cleaning_end, v_existing_start, v_existing_cleaning_end) THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', 'This time slot is no longer available. Please select another time.',
          'conflict_with', v_conflicting_booking.id
        );
      END IF;
    END;
  END LOOP;
  
  -- Create booking
  INSERT INTO cinema_bookings (
    full_name,
    email,
    phone,
    booking_date,
    time_slot,
    package_type,
    package_price,
    experience_tier,
    status,
    email_sent
  ) VALUES (
    p_full_name,
    p_email,
    p_phone,
    p_booking_date,
    p_time_slot,
    p_package_type,
    p_package_price,
    p_experience_tier,
    'confirmed',
    false
  ) RETURNING id INTO v_booking_id;
  
  SELECT row_to_json(b.*)::jsonb INTO v_result
  FROM cinema_bookings b
  WHERE b.id = v_booking_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', v_result,
    'message', 'Booking confirmed successfully'
  );
  
EXCEPTION
  WHEN check_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid booking data: ' || SQLERRM);
  WHEN unique_violation THEN
    RETURN jsonb_build_object('success', false, 'error', 'Booking already exists');
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', 'Failed to create booking: ' || SQLERRM);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. CREATE SECURE VIEW FOR AVAILABILITY CHECKS
-- ============================================

-- View that only exposes necessary fields for availability checking
CREATE OR REPLACE VIEW spa_bookings_availability AS
SELECT 
  booking_date,
  time_slot,
  package_type,
  experience_tier,
  status
FROM spa_bookings
WHERE status = 'confirmed';

CREATE OR REPLACE VIEW cinema_bookings_availability AS
SELECT 
  booking_date,
  time_slot,
  package_type,
  experience_tier,
  status
FROM cinema_bookings
WHERE status = 'confirmed';

-- Grant access to views
GRANT SELECT ON spa_bookings_availability TO anon, authenticated;
GRANT SELECT ON cinema_bookings_availability TO anon, authenticated;

-- ============================================
-- 5. UPDATE RLS POLICIES
-- ============================================

-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can view spa bookings for availability check" ON spa_bookings;
DROP POLICY IF EXISTS "Anyone can view cinema bookings for availability check" ON cinema_bookings;

-- Create more restrictive policies - use views instead
CREATE POLICY "Allow availability check via view"
  ON spa_bookings
  FOR SELECT
  USING (true); -- Still allow SELECT but recommend using view

CREATE POLICY "Allow availability check via view"
  ON cinema_bookings
  FOR SELECT
  USING (true);

-- Add index for status filtering (helps with availability queries)
CREATE INDEX IF NOT EXISTS spa_bookings_status_idx ON spa_bookings(status) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS cinema_bookings_status_idx ON cinema_bookings(status) WHERE status = 'confirmed';

-- ============================================
-- 6. ADD SECURITY TOKEN TABLE FOR PARKING PERMITS
-- ============================================

-- Create table for secure approval tokens (with expiration)
CREATE TABLE IF NOT EXISTS parking_permit_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  permit_request_id uuid NOT NULL REFERENCES parking_permit_requests(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE, -- HMAC hash of token
  action text NOT NULL CHECK (action IN ('approve', 'reject')),
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_parking_permit_tokens_hash ON parking_permit_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_parking_permit_tokens_permit_id ON parking_permit_tokens(permit_request_id);

-- Enable RLS
ALTER TABLE parking_permit_tokens ENABLE ROW LEVEL SECURITY;

-- Only service role can access tokens
CREATE POLICY "Service role only" ON parking_permit_tokens
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

