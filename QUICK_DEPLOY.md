# Quick Deployment Guide

## 🚀 Fast Track to Production

### Step 1: Run Migration (5 minutes)

**Via Supabase Dashboard:**
1. Go to https://app.supabase.com → Your Project
2. Click **SQL Editor**
3. Open file: `supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql`
4. Copy all contents
5. Paste into SQL Editor
6. Click **Run**

**Verify:**
```sql
SELECT routine_name FROM information_schema.routines 
WHERE routine_name IN ('create_spa_booking', 'create_cinema_booking');
```
Should return 2 rows.

---

### Step 2: Set Secrets (2 minutes)

Go to: **Project Settings** → **Edge Functions** → **Secrets**

Add:
- `RESEND_API_KEY` = Your Resend API key
- `PROPERTY_MANAGER_EMAIL` = manager@nhtestates.com
- `SUPABASE_SERVICE_ROLE_KEY` = From API settings

---

### Step 3: Deploy Functions (10 minutes)

**Via Dashboard:**
1. Go to **Edge Functions**
2. For each function, copy from `supabase/functions/[name]/index.ts`
3. Paste and deploy

**Functions:**
- ✅ create-booking (updated with rate limiting & logging)
- ✅ check-availability
- ✅ get-unavailable-slots
- ✅ send-booking-confirmation
- ✅ send-parking-permit-email
- ✅ approve-parking-permit
- ✅ reject-parking-permit

---

### Step 4: Test (2 minutes)

Run:
```bash
./test-deployment.sh
```

Or test manually:
```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/create-booking \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"serviceType":"spa","full_name":"Test","email":"test@test.com","phone":"123","booking_date":"2025-12-01","time_slot":"10:00 AM","package_type":"1 Hour Session","package_price":75,"experience_tier":"standard"}'
```

---

## ✅ Done!

Your backend is now production-ready with:
- ✅ Race condition protection
- ✅ Server-side validation
- ✅ Rate limiting (50 req/min)
- ✅ Structured logging
- ✅ Cleaning gap support

**Total Time: ~20 minutes**

---

## 📚 Full Documentation

- **Complete Guide:** `DEPLOYMENT_READY.md`
- **Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **Test Script:** `test-deployment.sh`

