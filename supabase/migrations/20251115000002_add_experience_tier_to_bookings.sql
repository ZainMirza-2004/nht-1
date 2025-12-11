-- Add experience_tier column to spa_bookings and cinema_bookings tables
-- This migration adds the tier field for the upselling system

-- Add experience_tier to spa_bookings
ALTER TABLE spa_bookings 
ADD COLUMN IF NOT EXISTS experience_tier TEXT CHECK (experience_tier IN ('standard', 'premium', 'deluxe'));

-- Add experience_tier to cinema_bookings
ALTER TABLE cinema_bookings 
ADD COLUMN IF NOT EXISTS experience_tier TEXT CHECK (experience_tier IN ('standard', 'premium', 'deluxe'));

-- Create index for experience_tier queries (useful for analytics)
CREATE INDEX IF NOT EXISTS idx_spa_bookings_experience_tier ON spa_bookings(experience_tier);
CREATE INDEX IF NOT EXISTS idx_cinema_bookings_experience_tier ON cinema_bookings(experience_tier);

-- Add comment for documentation
COMMENT ON COLUMN spa_bookings.experience_tier IS 'Experience tier: standard, premium, or deluxe';
COMMENT ON COLUMN cinema_bookings.experience_tier IS 'Experience tier: standard, premium, or deluxe';

