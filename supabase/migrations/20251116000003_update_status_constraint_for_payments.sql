-- Update status constraint to include payment statuses
-- This allows bookings to be 'pending' before payment and 'paid' after payment

-- Drop existing status constraints
ALTER TABLE spa_bookings 
DROP CONSTRAINT IF EXISTS spa_bookings_status_check;

ALTER TABLE cinema_bookings 
DROP CONSTRAINT IF EXISTS cinema_bookings_status_check;

-- Add new constraints that include payment statuses
ALTER TABLE spa_bookings 
ADD CONSTRAINT spa_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed'));

ALTER TABLE cinema_bookings 
ADD CONSTRAINT cinema_bookings_status_check 
CHECK (status IN ('pending', 'confirmed', 'paid', 'cancelled', 'completed'));

-- Update default status to 'pending' for new bookings (they'll be updated to 'paid' after payment)
ALTER TABLE spa_bookings 
ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE cinema_bookings 
ALTER COLUMN status SET DEFAULT 'pending';

