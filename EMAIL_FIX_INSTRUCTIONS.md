# Email Not Sending - Fix Instructions

## ✅ What I Fixed

I've added detailed logging to the webhook so we can see exactly what's happening. The webhook will now log:
- When it attempts to send emails
- What email address it's sending to
- Any errors that occur
- The response from the email function

## 🔍 What to Check First

### 1. Check Webhook Logs (Most Important!)

After making a payment, check the webhook logs:

1. Go to: **Supabase Dashboard → Edge Functions → stripe-webhook → Logs**
2. Look for these messages:
   - `💰 Processing payment success for booking...`
   - `📧 Attempting to send confirmation email...`
   - `📧 Email function response status: 200` (or error code)
   - `✅ Confirmation email sent successfully`

**If you don't see ANY logs:**
- The webhook might not be receiving events from Stripe
- Check Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries
- Verify the webhook URL is correct

**If you see errors:**
- Copy the error message
- It will tell you exactly what's wrong

### 2. Check Required Secrets

The webhook needs these secrets to send emails:

**Required Secrets:**
- ✅ `SUPABASE_ANON_KEY` - **CRITICAL!** Needed for webhook to call email function
- ✅ `RESEND_API_KEY` - Needed for email function to send emails
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Needed to update booking status
- ✅ `STRIPE_SECRET_KEY` - Needed to verify webhook
- ✅ `STRIPE_WEBHOOK_SECRET` - Needed for security

**To check:**
1. Go to: **Supabase Dashboard → Project Settings → Edge Functions → Secrets**
2. Verify all secrets above are listed
3. **Most likely missing:** `SUPABASE_ANON_KEY`

### 3. Add Missing Secret (If Needed)

If `SUPABASE_ANON_KEY` is missing:

1. Go to: **Supabase Dashboard → Project Settings → API**
2. Copy the **anon/public** key
3. Go to: **Project Settings → Edge Functions → Secrets**
4. Click **Add new secret**
5. Name: `SUPABASE_ANON_KEY`
6. Value: Paste the anon key
7. Click **Save**

### 4. Redeploy Webhook

After adding secrets, redeploy the webhook:

**Via CLI:**
```bash
supabase functions deploy stripe-webhook
```

**Via Dashboard:**
1. Go to: **Edge Functions → stripe-webhook**
2. Click **Deploy** (or redeploy)

## 🧪 Testing Steps

1. **Make a test payment**
2. **Check webhook logs immediately:**
   - Should see: `💰 Processing payment success...`
   - Should see: `📧 Attempting to send confirmation email...`
   - Should see: `✅ Confirmation email sent successfully`
3. **Check email function logs:**
   - Go to: **Edge Functions → send-booking-confirmation → Logs**
   - Should see: `Attempting to send email via Resend to: [your-email]`
   - Should see: `Customer email sent successfully via Resend`

## 🐛 Common Issues

### Issue 1: "SUPABASE_ANON_KEY not configured"
**Fix:** Add `SUPABASE_ANON_KEY` to Edge Functions secrets (see step 3 above)

### Issue 2: "RESEND_API_KEY not configured"
**Fix:** 
1. Sign up at https://resend.com
2. Get API key from https://resend.com/api-keys
3. Add to Supabase secrets as `RESEND_API_KEY`

### Issue 3: Webhook not receiving events
**Fix:**
1. Check Stripe Dashboard → Webhooks
2. Verify endpoint URL is correct
3. Check if events are being delivered
4. Verify `STRIPE_WEBHOOK_SECRET` matches Stripe

### Issue 4: Email function returns error
**Check email function logs for specific error message**

## 📋 Quick Checklist

- [ ] Check webhook logs after payment
- [ ] Verify `SUPABASE_ANON_KEY` is in secrets
- [ ] Verify `RESEND_API_KEY` is in secrets
- [ ] Redeploy webhook after adding secrets
- [ ] Check email function logs
- [ ] Test payment again

## 🎯 Most Likely Issue

**90% chance the issue is:** `SUPABASE_ANON_KEY` is not set in Edge Functions secrets.

The webhook needs this key to call the email function. Without it, the email function call will fail silently.

**Fix:** Add `SUPABASE_ANON_KEY` to secrets and redeploy webhook.

---

After checking the logs, you'll see exactly what's wrong. The detailed logging I added will show you the exact error message!

