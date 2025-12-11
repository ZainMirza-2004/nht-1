-- Create parking_permit_requests table
CREATE TABLE IF NOT EXISTS parking_permit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  vehicle_make TEXT NOT NULL,
  registration TEXT NOT NULL,
  property_name TEXT NOT NULL,
  permit_type TEXT NOT NULL DEFAULT 'time_slot' CHECK (permit_type IN ('time_slot', 'full_day')),
  permit_date DATE,
  start_time TEXT,
  end_time TEXT,
  additional_details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ
);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_parking_permit_requests_status ON parking_permit_requests(status);
CREATE INDEX IF NOT EXISTS idx_parking_permit_requests_created_at ON parking_permit_requests(created_at DESC);

-- Enable RLS
ALTER TABLE parking_permit_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous inserts (for form submissions)
CREATE POLICY "Allow anonymous inserts" ON parking_permit_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Policy: Allow service role to read all (for edge functions)
CREATE POLICY "Allow service role read all" ON parking_permit_requests
  FOR SELECT
  TO service_role
  USING (true);

-- Policy: Allow service role to update all (for approval/rejection)
CREATE POLICY "Allow service role update all" ON parking_permit_requests
  FOR UPDATE
  TO service_role
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parking_permit_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_parking_permit_requests_updated_at
  BEFORE UPDATE ON parking_permit_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_permit_requests_updated_at();

