# Edge Functions Deployment Guide

## Quick Deploy Instructions

1. Go to: https://app.supabase.com → Your Project → Edge Functions

2. For each function below, click the function name (or "Create Function" if new) and deploy:

---

## Function 1: create-booking

**File:** `supabase/functions/create-booking/index.ts`

**Status:** ⭐ UPDATED with rate limiting & logging

Copy the entire contents of the file and paste into the function editor.

---

## Function 2: check-availability

**File:** `supabase/functions/check-availability/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## Function 3: get-unavailable-slots

**File:** `supabase/functions/get-unavailable-slots/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## Function 4: send-booking-confirmation

**File:** `supabase/functions/send-booking-confirmation/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## Function 5: send-parking-permit-email

**File:** `supabase/functions/send-parking-permit-email/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## Function 6: approve-parking-permit

**File:** `supabase/functions/approve-parking-permit/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## Function 7: reject-parking-permit

**File:** `supabase/functions/reject-parking-permit/index.ts`

Copy the entire contents of the file and paste into the function editor.

---

## After Deployment

Run the test script:
```bash
./test-deployment.sh
```

