/*
  # Improve Bookings Tables for Production Use
  
  This migration adds:
  - Booking status tracking
  - Better constraints for concurrency
  - Updated timestamps
  - Email sent tracking
  - Better indexing for performance
*/

-- Add status and email tracking to spa_bookings
ALTER TABLE spa_bookings 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add status and email tracking to cinema_bookings
ALTER TABLE cinema_bookings 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to auto-update updated_at
DROP TRIGGER IF EXISTS update_spa_bookings_updated_at ON spa_bookings;
CREATE TRIGGER update_spa_bookings_updated_at
    BEFORE UPDATE ON spa_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cinema_bookings_updated_at ON cinema_bookings;
CREATE TRIGGER update_cinema_bookings_updated_at
    BEFORE UPDATE ON cinema_bookings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add composite index for better query performance (date + status for active bookings)
CREATE INDEX IF NOT EXISTS spa_bookings_date_status_idx ON spa_bookings(booking_date, status) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS cinema_bookings_date_status_idx ON cinema_bookings(booking_date, status) WHERE status = 'confirmed';

-- Add index on email for customer lookups
CREATE INDEX IF NOT EXISTS spa_bookings_email_idx ON spa_bookings(email);
CREATE INDEX IF NOT EXISTS cinema_bookings_email_idx ON cinema_bookings(email);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS spa_bookings_created_at_idx ON spa_bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS cinema_bookings_created_at_idx ON cinema_bookings(created_at DESC);

