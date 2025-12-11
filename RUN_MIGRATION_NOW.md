# Run This Migration Now!

## The Problem
Your database table is missing the new columns: `permit_type`, `permit_date`, `start_time`, `end_time`

## The Solution
Run this migration in your Supabase SQL Editor:

### Step 1: Open Supabase SQL Editor
1. Go to https://app.supabase.com
2. Select your project
3. Click on **SQL Editor** in the left sidebar

### Step 2: Run This SQL

Copy and paste this entire SQL script into the SQL Editor and click **Run**:

```sql
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
```

### Step 3: Verify It Worked

After running, verify the columns exist:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'parking_permit_requests'
ORDER BY ordinal_position;
```

You should now see:
- `permit_type`
- `permit_date`
- `start_time`
- `end_time`

### Step 4: Test Again

After running the migration:
1. Redeploy the `send-parking-permit-email` function (it's been updated to handle this gracefully)
2. Try submitting a parking permit request again
3. It should now work with time slots!

## Note

The function has been updated to work even without these columns (it will use basic fields only), but you'll get full functionality (time slots, full day permits) once you run the migration.

