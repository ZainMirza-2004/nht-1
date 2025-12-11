# Stripe Webhook Setup Guide

## Step-by-Step Instructions

### 1. Get Your Supabase Project Reference

Your project reference is: `cfxdtuwfeuvwpasbwpte`

Your webhook URL will be:
```
https://cfxdtuwfeuvwpasbwpte.supabase.co/functions/v1/stripe-webhook
```

### 2. Set Up Webhook in Stripe Dashboard

1. **Go to Stripe Dashboard**
   - Visit: https://dashboard.stripe.com
   - Make sure you're in **Live mode** (toggle in top right)

2. **Navigate to Webhooks**
   - Click: **Developers** → **Webhooks** (in left sidebar)
   - Click: **Add endpoint** button

3. **Configure Endpoint**
   - **Endpoint URL**: 
     ```
     https://cfxdtuwfeuvwpasbwpte.supabase.co/functions/v1/stripe-webhook
     ```
   - **Description** (optional): `NH&T Estates Booking Payments`

4. **Select Events to Listen For**
   - Click: **Select events**
   - Check: `payment_intent.succeeded`
   - (Optional) Check: `payment_intent.payment_failed` (for error handling)
   - Click: **Add events**

5. **Create Endpoint**
   - Click: **Add endpoint**

### 3. Get the Signing Secret

After creating the endpoint:

1. **Click on your new webhook endpoint** in the list
2. **Find "Signing secret"** section
3. **Click "Reveal"** or **"Click to reveal"**
4. **Copy the secret** (starts with `whsec_...`)

### 4. Add Signing Secret to Supabase

1. **Go to Supabase Dashboard**
   - Visit: https://app.supabase.com
   - Select your project

2. **Navigate to Edge Functions Secrets**
   - Go to: **Project Settings** → **Edge Functions** → **Secrets**

3. **Add Secret**
   - Click: **Add new secret**
   - **Name**: `STRIPE_WEBHOOK_SECRET`
   - **Value**: Paste the signing secret you copied (starts with `whsec_...`)
   - Click: **Save**

### 5. Test the Webhook (Optional)

1. **In Stripe Dashboard** → **Webhooks** → Your endpoint
2. Click: **Send test webhook**
3. Select: `payment_intent.succeeded`
4. Click: **Send test webhook**
5. Check: **Logs** tab to see if it was received successfully

## Verification

After setup, test a booking:

1. Make a test booking on your site
2. Complete payment
3. Check Supabase Dashboard → **Table Editor** → `spa_bookings` or `cinema_bookings`
4. Verify the booking has:
   - `status` = `'paid'`
   - `payment_intent_id` = (Stripe payment intent ID)
   - `payment_status` = `'succeeded'`

## Troubleshooting

### Webhook Not Receiving Events

- Verify the endpoint URL is correct
- Check Stripe Dashboard → Webhooks → Your endpoint → **Recent deliveries**
- Look for failed attempts and error messages

### Webhook Receiving But Not Updating Database

- Check Supabase Dashboard → **Edge Functions** → `stripe-webhook` → **Logs**
- Verify `STRIPE_WEBHOOK_SECRET` matches the signing secret
- Ensure booking ID is in payment intent metadata

### Signature Verification Failing

- Make sure `STRIPE_WEBHOOK_SECRET` is exactly the same as in Stripe Dashboard
- No extra spaces or characters
- The secret should start with `whsec_`

## Important Notes

- ⚠️ **Webhook secret is different from API keys** - it's specifically for webhook signature verification
- ✅ **Webhook works without the secret** (but it's less secure - not recommended for production)
- 🔒 **The secret prevents unauthorized webhook calls** - always use it in production

