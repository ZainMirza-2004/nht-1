-- Add new columns to parking_permit_requests table
ALTER TABLE parking_permit_requests
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS permit_id TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS number_of_nights INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS permit_type TEXT DEFAULT 'full_day' CHECK (permit_type IN ('time_slot', 'full_day', 'free', 'paid'));

-- Create index for permit_id lookups
CREATE INDEX IF NOT EXISTS idx_parking_permit_requests_permit_id ON parking_permit_requests(permit_id);

-- Create parking_otp_codes table for phone verification
CREATE TABLE IF NOT EXISTS parking_otp_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_otp_codes_phone ON parking_otp_codes(phone_number);
CREATE INDEX IF NOT EXISTS idx_parking_otp_codes_hash ON parking_otp_codes(otp_hash);
CREATE INDEX IF NOT EXISTS idx_parking_otp_codes_expires ON parking_otp_codes(expires_at);

-- Enable RLS
ALTER TABLE parking_otp_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (only create if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parking_otp_codes' 
    AND policyname = 'Service role only'
  ) THEN
    CREATE POLICY "Service role only" ON parking_otp_codes
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Create parking_phone_verifications table for anti-fraud logging
CREATE TABLE IF NOT EXISTS parking_phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parking_phone_verifications_phone ON parking_phone_verifications(phone_number);
CREATE INDEX IF NOT EXISTS idx_parking_phone_verifications_verified_at ON parking_phone_verifications(verified_at DESC);

-- Enable RLS
ALTER TABLE parking_phone_verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (only create if doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'parking_phone_verifications' 
    AND policyname = 'Service role only'
  ) THEN
    CREATE POLICY "Service role only" ON parking_phone_verifications
      FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

-- Clean up expired OTP codes (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_otp_codes()
RETURNS void AS $$
BEGIN
  DELETE FROM parking_otp_codes
  WHERE expires_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

