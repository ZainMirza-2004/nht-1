# Migration Status Check

## ✅ Migrations You've Already Run

Based on your message, you've successfully run:

1. ✅ **Parking Permit Requests** (`20251115000000_create_parking_permit_requests.sql`)
   - Creates `parking_permit_requests` table
   - Sets up RLS policies
   - Creates indexes

2. ✅ **Parking Permit Time Fields** (`20251115000001_add_parking_permit_time_fields.sql`)
   - Adds `permit_type`, `permit_date`, `start_time`, `end_time` columns

3. ✅ **Experience Tier** (`20251115000002_add_experience_tier_to_bookings.sql`)
   - Adds `experience_tier` column to both booking tables

4. ✅ **Concurrency & Validation** (`20251116000000_fix_booking_concurrency_and_validation.sql`)
   - Creates atomic booking functions (`create_spa_booking`, `create_cinema_booking`)
   - Adds database constraints
   - Creates secure views
   - Adds `parking_permit_tokens` table
   - **Note:** This migration also ensures status columns exist (covers 20251114000001)

---

## ⚠️ Migrations You May Still Need

### Check if these exist:

#### 1. Initial Booking Tables (`20251113224939_create_bookings_tables.sql`)

**Check if needed:**
```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spa_bookings')
      AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cinema_bookings')
    THEN '✅ Tables exist - migration not needed'
    ELSE '❌ Run: 20251113224939_create_bookings_tables.sql'
  END;
```

**If needed:** This creates the initial `spa_bookings`, `cinema_bookings`, and `featured_properties` tables.

---

#### 2. Additional Indexes (`20251114000000_improve_booking_indexes.sql`)

**Check if needed:**
```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'spa_bookings_date_idx')
      AND EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'cinema_bookings_date_idx')
    THEN '✅ Indexes exist - migration not needed'
    ELSE '❌ Run: 20251114000000_improve_booking_indexes.sql'
  END;
```

**If needed:** Adds `spa_bookings_date_idx` and `cinema_bookings_date_idx` indexes.

---

#### 3. Production Improvements (`20251114000001_improve_bookings_for_production.sql`)

**Status:** ✅ **Likely NOT needed** - The concurrency migration (20251116000000) includes a section that ensures status columns exist.

**However, check if you want the triggers:**
```sql
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'update_updated_at_column')
    THEN '✅ Triggers exist'
    ELSE '⚠️  Consider running: 20251114000001_improve_bookings_for_production.sql (adds auto-update triggers)'
  END;
```

**If needed:** Adds `update_updated_at_column()` function and triggers to auto-update `updated_at` timestamps.

---

## 🔍 Quick Verification

Run this in Supabase SQL Editor to check everything:

**File:** `check-migrations.sql` (I've created this for you)

Or run this quick check:

```sql
-- Quick status check
SELECT 
  'spa_bookings table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spa_bookings') 
    THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
  'create_spa_booking function' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_spa_booking') 
    THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
  'parking_permit_requests table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parking_permit_requests') 
    THEN '✅' ELSE '❌' END as status
UNION ALL
SELECT 
  'parking_permit_tokens table' as item,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'parking_permit_tokens') 
    THEN '✅' ELSE '❌' END as status;
```

---

## 📋 Recommended Action

1. **Run `check-migrations.sql`** in Supabase SQL Editor to see what's missing
2. **If `spa_bookings` table doesn't exist:** Run `20251113224939_create_bookings_tables.sql`
3. **If indexes are missing:** Run `20251114000000_improve_booking_indexes.sql`
4. **If you want auto-update triggers:** Run `20251114000001_improve_bookings_for_production.sql` (optional)

---

## ✅ Most Likely Scenario

Since you've run the concurrency migration (20251116000000), you probably have:
- ✅ All tables
- ✅ All functions
- ✅ All constraints
- ✅ All views

You might only be missing:
- ⚠️ Some indexes (20251114000000) - but these are performance optimizations, not critical
- ⚠️ Auto-update triggers (20251114000001) - nice to have but not required

**Bottom line:** Your database is likely production-ready! Just verify with the check script.

