/*
  # Improve Booking Indexes for Better Performance
  
  This migration adds additional indexes to improve query performance
  for availability checks and booking lookups.
*/

-- Add index on booking_date for faster date-based queries
CREATE INDEX IF NOT EXISTS spa_bookings_date_idx ON spa_bookings(booking_date);
CREATE INDEX IF NOT EXISTS cinema_bookings_date_idx ON cinema_bookings(booking_date);

-- The existing composite indexes on (booking_date, time_slot) are already good
-- for queries that filter by both date and time slot

