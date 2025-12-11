# Deployment Status & Next Steps

## ✅ Completed

1. **Step 2: Secrets Configured** ✓ (You mentioned this is done)
   - RESEND_API_KEY
   - PROPERTY_MANAGER_EMAIL  
   - SUPABASE_SERVICE_ROLE_KEY

2. **Code Ready** ✓
   - All edge functions updated with rate limiting & logging
   - Migration file ready
   - Test scripts created

---

## ⏳ Remaining Steps

### Step 1: Run Database Migration

**Quick Method:**
1. Open: `MIGRATION_SQL.txt` (contains the full migration SQL)
2. Go to: https://app.supabase.com → Your Project → SQL Editor
3. Copy entire contents of `MIGRATION_SQL.txt`
4. Paste into SQL Editor
5. Click **Run**

**Or use the migration file directly:**
- File: `supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql`

**Verify it worked:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_spa_booking', 'create_cinema_booking');
```
Should return 2 rows.

---

### Step 3: Deploy Edge Functions

**Quick Reference:** See `deploy-all-functions.md`

**Steps:**
1. Go to: https://app.supabase.com → Your Project → Edge Functions
2. For each function listed below, click the function name (or "Create Function" if new)
3. Copy the entire contents from the file path shown
4. Paste into the function editor
5. Click **Deploy**

**Functions to deploy:**

| Function Name | File Path |
|--------------|-----------|
| `create-booking` ⭐ | `supabase/functions/create-booking/index.ts` |
| `check-availability` | `supabase/functions/check-availability/index.ts` |
| `get-unavailable-slots` | `supabase/functions/get-unavailable-slots/index.ts` |
| `send-booking-confirmation` | `supabase/functions/send-booking-confirmation/index.ts` |
| `send-parking-permit-email` | `supabase/functions/send-parking-permit-email/index.ts` |
| `approve-parking-permit` | `supabase/functions/approve-parking-permit/index.ts` |
| `reject-parking-permit` | `supabase/functions/reject-parking-permit/index.ts` |

⭐ = Updated with rate limiting & structured logging

---

### Step 4: Test Deployment

After deploying functions, run:
```bash
./test-deployment.sh
```

**Expected Results:**
- ✓ Availability check works
- ✓ Booking creation works
- ✓ Price validation rejects invalid prices
- ✓ Email validation rejects invalid emails
- ✓ Unavailable slots returned correctly

---

## Current Test Results

Tests were run but functions returned "NOT_FOUND" - this confirms functions need to be deployed.

After deployment, re-run tests to verify everything works.

---

## Time Estimate

- **Step 1 (Migration):** 2-3 minutes
- **Step 3 (Functions):** 10-15 minutes (7 functions)
- **Step 4 (Testing):** 2-3 minutes

**Total: ~20 minutes**

---

## Need Help?

- **Migration Issues:** Check `DEPLOYMENT_READY.md` troubleshooting section
- **Function Deployment:** See `deploy-all-functions.md`
- **Testing:** Run `./test-deployment.sh`

