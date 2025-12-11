-- Migration Status Check
-- Run this in Supabase SQL Editor to see what's missing

-- Check 1: Initial booking tables (20251113224939)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spa_bookings')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cinema_bookings')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'featured_properties')
    THEN '✅ Initial booking tables exist'
    ELSE '❌ MISSING: Initial booking tables (20251113224939_create_bookings_tables.sql)'
  END as initial_tables;

-- Check 2: Additional indexes (20251114000000)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'spa_bookings_date_idx'
    ) AND EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE indexname = 'cinema_bookings_date_idx'
    )
    THEN '✅ Additional indexes exist'
    ELSE '❌ MISSING: Additional indexes (20251114000000_improve_booking_indexes.sql)'
  END as additional_indexes;

-- Check 3: Production improvements (20251114000001)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'spa_bookings' AND column_name = 'status'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'spa_bookings' AND column_name = 'email_sent'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'spa_bookings' AND column_name = 'updated_at'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'update_updated_at_column'
    )
    THEN '✅ Production improvements exist'
    ELSE '❌ MISSING: Production improvements (20251114000001_improve_bookings_for_production.sql)'
  END as production_improvements;

-- Check 4: Parking permit tables (20251115000000)
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parking_permit_requests')
    THEN '✅ Parking permit requests table exists'
    ELSE '❌ MISSING: Parking permit requests (20251115000000_create_parking_permit_requests.sql)'
  END as parking_permit_requests;

-- Check 5: Parking permit time fields (20251115000001)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parking_permit_requests' AND column_name = 'permit_type'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'parking_permit_requests' AND column_name = 'permit_date'
    )
    THEN '✅ Parking permit time fields exist'
    ELSE '❌ MISSING: Parking permit time fields (20251115000001_add_parking_permit_time_fields.sql)'
  END as parking_permit_time_fields;

-- Check 6: Experience tier (20251115000002)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'spa_bookings' AND column_name = 'experience_tier'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'cinema_bookings' AND column_name = 'experience_tier'
    )
    THEN '✅ Experience tier columns exist'
    ELSE '❌ MISSING: Experience tier (20251115000002_add_experience_tier_to_bookings.sql)'
  END as experience_tier;

-- Check 7: Concurrency and validation (20251116000000)
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'create_spa_booking'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.routines 
      WHERE routine_name = 'create_cinema_booking'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.views 
      WHERE table_name = 'spa_bookings_availability'
    ) AND EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'parking_permit_tokens'
    )
    THEN '✅ Concurrency and validation migration exists'
    ELSE '❌ MISSING: Concurrency and validation (20251116000000_fix_booking_concurrency_and_validation.sql)'
  END as concurrency_validation;

-- Summary: List all missing migrations
SELECT 
  'MIGRATION STATUS SUMMARY' as summary,
  CASE 
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spa_bookings')
      THEN 'Run: 20251113224939_create_bookings_tables.sql'
    WHEN NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'spa_bookings_date_idx')
      THEN 'Run: 20251114000000_improve_booking_indexes.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spa_bookings' AND column_name = 'status')
      THEN 'Run: 20251114000001_improve_bookings_for_production.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parking_permit_requests')
      THEN 'Run: 20251115000000_create_parking_permit_requests.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'parking_permit_requests' AND column_name = 'permit_type')
      THEN 'Run: 20251115000001_add_parking_permit_time_fields.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'spa_bookings' AND column_name = 'experience_tier')
      THEN 'Run: 20251115000002_add_experience_tier_to_bookings.sql'
    WHEN NOT EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_spa_booking')
      THEN 'Run: 20251116000000_fix_booking_concurrency_and_validation.sql'
    ELSE '✅ All migrations appear to be applied!'
  END as status;

