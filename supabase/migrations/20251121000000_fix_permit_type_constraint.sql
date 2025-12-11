-- Fix permit_type constraint to include 'free' and 'paid'
-- This migration drops the old constraint and adds a new one that includes all permit types

-- Drop the old constraint if it exists
DO $$
DECLARE
  constraint_name_var TEXT;
BEGIN
  -- Find and drop the old constraint
  SELECT constraint_name INTO constraint_name_var
  FROM information_schema.table_constraints 
  WHERE table_name = 'parking_permit_requests'
  AND constraint_type = 'CHECK'
  AND constraint_name LIKE '%permit_type%'
  LIMIT 1;
  
  IF constraint_name_var IS NOT NULL THEN
    EXECUTE format('ALTER TABLE parking_permit_requests DROP CONSTRAINT %I', constraint_name_var);
    RAISE NOTICE 'Dropped constraint: %', constraint_name_var;
  END IF;
END $$;

-- Add the new constraint that includes 'free' and 'paid'
ALTER TABLE parking_permit_requests
  ADD CONSTRAINT parking_permit_requests_permit_type_check 
  CHECK (permit_type IN ('time_slot', 'full_day', 'free', 'paid'));

-- Ensure permit_type column exists (if it doesn't, add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_permit_requests' 
    AND column_name = 'permit_type'
  ) THEN
    ALTER TABLE parking_permit_requests 
    ADD COLUMN permit_type TEXT NOT NULL DEFAULT 'full_day';
    
    -- Add constraint after adding column
    ALTER TABLE parking_permit_requests
      ADD CONSTRAINT parking_permit_requests_permit_type_check 
      CHECK (permit_type IN ('time_slot', 'full_day', 'free', 'paid'));
  END IF;
END $$;
