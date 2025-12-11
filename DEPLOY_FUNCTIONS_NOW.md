# Deploy Edge Functions - Quick Guide

## 🚀 Fast Deployment (10-15 minutes)

### Step 1: Go to Supabase Dashboard
1. Visit: https://app.supabase.com
2. Select your project
3. Click **Edge Functions** in the left sidebar

### Step 2: Deploy Each Function

For each function below, follow these steps:
1. Click the function name (if it exists) or click **"Create Function"**
2. Copy the **entire contents** from the file path shown
3. Paste into the function editor
4. Click **"Deploy"** or **"Save"**

---

## Functions to Deploy (7 total)

### 1. ⭐ create-booking (UPDATED - Rate Limiting & Logging)
**File:** `supabase/functions/create-booking/index.ts`

**Status:** ⭐ Most important - handles all bookings with atomic operations

---

### 2. check-availability
**File:** `supabase/functions/check-availability/index.ts`

**Status:** Required for availability checks

---

### 3. get-unavailable-slots
**File:** `supabase/functions/get-unavailable-slots/index.ts`

**Status:** Required for calendar display

---

### 4. send-booking-confirmation
**File:** `supabase/functions/send-booking-confirmation/index.ts`

**Status:** Sends confirmation emails

---

### 5. send-parking-permit-email
**File:** `supabase/functions/send-parking-permit-email/index.ts`

**Status:** Sends parking permit request emails

---

### 6. approve-parking-permit
**File:** `supabase/functions/approve-parking-permit/index.ts`

**Status:** Handles parking permit approvals

---

### 7. reject-parking-permit
**File:** `supabase/functions/reject-parking-permit/index.ts`

**Status:** Handles parking permit rejections

---

## ✅ After Deployment

1. **Test the deployment:**
   ```bash
   ./test-deployment.sh
   ```

2. **Check function logs:**
   - Go to Edge Functions → Select a function → Logs
   - Look for any errors

3. **Verify functions are working:**
   - Make a test booking
   - Check that emails are sent
   - Verify availability checks work

---

## 🔧 Alternative: Link Project for CLI Deployment

If you want to use CLI for future deployments:

```bash
# 1. Login to Supabase
npx supabase login

# 2. Link your project (get project ref from Dashboard URL)
npx supabase link --project-ref YOUR_PROJECT_REF

# 3. Deploy all functions
npx supabase functions deploy
```

---

## 📝 Notes

- **All functions are ready** - just copy and paste
- **create-booking** is the most critical - deploy this first
- Functions will work immediately after deployment
- Make sure secrets are configured (you mentioned this is done)

---

**Estimated Time:** 10-15 minutes for all 7 functions

