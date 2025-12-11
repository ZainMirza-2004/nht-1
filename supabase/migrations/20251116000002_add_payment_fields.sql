-- Add payment fields to booking tables for Stripe integration

-- Add payment fields to spa_bookings
ALTER TABLE spa_bookings 
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add payment fields to cinema_bookings
ALTER TABLE cinema_bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending';

-- Add indexes for payment queries
CREATE INDEX IF NOT EXISTS idx_spa_bookings_payment_status 
ON spa_bookings(payment_status) 
WHERE payment_status IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cinema_bookings_payment_status 
ON cinema_bookings(payment_status) 
WHERE payment_status IS NOT NULL;

-- Add comments
COMMENT ON COLUMN spa_bookings.payment_intent_id IS 'Stripe Payment Intent ID for this booking';
COMMENT ON COLUMN spa_bookings.payment_status IS 'Payment status: pending, succeeded, failed, refunded';
COMMENT ON COLUMN cinema_bookings.payment_intent_id IS 'Stripe Payment Intent ID for this booking';
COMMENT ON COLUMN cinema_bookings.payment_status IS 'Payment status: pending, succeeded, failed, refunded';

