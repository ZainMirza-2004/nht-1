-- Add time slot fields to existing parking_permit_requests table
-- This migration is safe to run even if the table already has these columns

-- Add permit_type column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_permit_requests' 
    AND column_name = 'permit_type'
  ) THEN
    ALTER TABLE parking_permit_requests 
    ADD COLUMN permit_type TEXT NOT NULL DEFAULT 'time_slot' 
    CHECK (permit_type IN ('time_slot', 'full_day'));
  END IF;
END $$;

-- Add permit_date column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_permit_requests' 
    AND column_name = 'permit_date'
  ) THEN
    ALTER TABLE parking_permit_requests 
    ADD COLUMN permit_date DATE;
  END IF;
END $$;

-- Add start_time column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_permit_requests' 
    AND column_name = 'start_time'
  ) THEN
    ALTER TABLE parking_permit_requests 
    ADD COLUMN start_time TEXT;
  END IF;
END $$;

-- Add end_time column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'parking_permit_requests' 
    AND column_name = 'end_time'
  ) THEN
    ALTER TABLE parking_permit_requests 
    ADD COLUMN end_time TEXT;
  END IF;
END $$;

