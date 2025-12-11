# Email Not Sending - Troubleshooting Guide

## Issue
Emails are not being sent after payment, even though booking is confirmed and redirect works.

## Possible Causes

### 1. **Webhook Not Being Triggered**
The webhook might not be receiving payment events from Stripe.

**Check:**
- Go to: **Supabase Dashboard → Edge Functions → stripe-webhook → Logs**
- Look for entries when you make a payment
- Should see: `💰 Processing payment success for booking...`

**If no logs:**
- Check Stripe Dashboard → Webhooks → Your endpoint
- Verify webhook URL is correct: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
- Check if webhook events are being received

### 2. **SUPABASE_ANON_KEY Not Set in Webhook**
The webhook needs SUPABASE_ANON_KEY to call the email function.

**Fix:**
1. Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
2. Check if `SUPABASE_ANON_KEY` exists
3. If not, add it:
   - Name: `SUPABASE_ANON_KEY`
   - Value: Your Supabase anon/public key (from Project Settings → API)

### 3. **RESEND_API_KEY Not Configured**
The email function needs RESEND_API_KEY to send emails.

**Check:**
1. Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
2. Verify `RESEND_API_KEY` exists and is correct
3. Should start with `re_`

**If missing:**
1. Sign up at https://resend.com
2. Get API key from https://resend.com/api-keys
3. Add to Supabase secrets

### 4. **Email Function Not Being Called**
The webhook might not be calling the email function.

**Check webhook logs for:**
- `📧 Attempting to send confirmation email...`
- `📧 Email function response status: 200`
- `✅ Confirmation email sent successfully`

**If you see errors:**
- Check the error message in logs
- Verify SUPABASE_ANON_KEY is set
- Verify email function is deployed

### 5. **Email Function Errors**
The email function might be failing silently.

**Check:**
- Go to: **Supabase Dashboard → Edge Functions → send-booking-confirmation → Logs**
- Look for errors when webhook calls it
- Check if RESEND_API_KEY is configured

## Step-by-Step Debugging

### Step 1: Check Webhook Logs
1. Make a test payment
2. Go to: **Supabase Dashboard → Edge Functions → stripe-webhook → Logs**
3. Look for:
   - `💰 Processing payment success...`
   - `📧 Attempting to send confirmation email...`
   - Any error messages

### Step 2: Check Email Function Logs
1. After payment, check: **Edge Functions → send-booking-confirmation → Logs**
2. Look for:
   - `Attempting to send email via Resend to: [email]`
   - `Email sent successfully via Resend`
   - Any error messages

### Step 3: Verify Secrets
Check all required secrets are set:
- ✅ `SUPABASE_ANON_KEY` (for webhook to call email function)
- ✅ `RESEND_API_KEY` (for email function to send emails)
- ✅ `SUPABASE_SERVICE_ROLE_KEY` (for webhook to update bookings)
- ✅ `STRIPE_SECRET_KEY` (for webhook to verify events)
- ✅ `STRIPE_WEBHOOK_SECRET` (for webhook security)

### Step 4: Test Email Function Directly
You can test the email function directly:

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/send-booking-confirmation \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "spa",
    "bookingId": "test-id",
    "fullName": "Test User",
    "email": "your-email@example.com",
    "phone": "+441234567890",
    "bookingDate": "2024-12-25",
    "timeSlot": "10:00 AM",
    "packageType": "Premium Experience",
    "packagePrice": 70,
    "experienceTier": "premium"
  }'
```

## Quick Fixes

### Fix 1: Add SUPABASE_ANON_KEY to Webhook
1. Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
2. Add: `SUPABASE_ANON_KEY` = Your anon key
3. Redeploy webhook: `supabase functions deploy stripe-webhook`

### Fix 2: Verify RESEND_API_KEY
1. Check if `RESEND_API_KEY` is set in secrets
2. Verify it's correct (starts with `re_`)
3. If wrong, update it

### Fix 3: Redeploy Functions
Redeploy both functions to ensure latest code:
```bash
supabase functions deploy stripe-webhook
supabase functions deploy send-booking-confirmation
```

## Expected Log Flow

When payment succeeds, you should see in webhook logs:
1. `✅ Webhook signature verified for event: payment_intent.succeeded`
2. `💰 Processing payment success for booking [id] (spa)`
3. `✅ Successfully updated booking [id]...`
4. `📧 Attempting to send confirmation email...`
5. `📧 Email function response status: 200`
6. `✅ Confirmation email sent successfully`

If any step is missing, that's where the issue is!

