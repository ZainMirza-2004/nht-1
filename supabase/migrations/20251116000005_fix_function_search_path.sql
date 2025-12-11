-- Fix function search_path security warnings
-- Sets explicit search_path to prevent search path injection attacks

-- ============================================
-- Fix update_updated_at_column function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- ============================================
-- Fix update_parking_permit_requests_updated_at function
-- ============================================

CREATE OR REPLACE FUNCTION update_parking_permit_requests_updated_at()
RETURNS TRIGGER 
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add comments
COMMENT ON FUNCTION update_updated_at_column() IS 
  'Trigger function to automatically update updated_at timestamp. Has explicit search_path for security.';

COMMENT ON FUNCTION update_parking_permit_requests_updated_at() IS 
  'Trigger function to automatically update updated_at timestamp for parking permit requests. Has explicit search_path for security.';

