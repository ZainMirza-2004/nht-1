# Email Setup - Complete Guide

## Current Status

✅ **Email function is deployed and working**  
❌ **Emails are not being sent** - The function returns success but doesn't actually send emails because no email service is configured.

## The Problem

The function is working correctly, but it's not sending real emails because:
1. No email service API key is configured
2. The function needs to be updated with your email service credentials

## Solution: Configure Resend (Recommended)

### Step 1: Sign up for Resend (Free)

1. Go to https://resend.com
2. Sign up for a free account (100 emails/day free)
3. Verify your email address

### Step 2: Get Your API Key

1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name it: "NH&T Estates Booking Emails"
4. Copy the API key (starts with `re_`)

### Step 3: Add API Key to Supabase

1. Go to https://app.supabase.com
2. Select your project (cfxdtuwfeuvwpasbwpte)
3. Go to **Project Settings** → **Edge Functions**
4. Scroll down to **Secrets**
5. Click **Add Secret**
6. Name: `RESEND_API_KEY`
7. Value: Paste your Resend API key
8. Click **Save**

### Step 4: Redeploy the Function

The function code has been updated to use Resend. You need to redeploy it:

**Option A: Via Supabase Dashboard**
1. Go to **Edge Functions** in the sidebar
2. Click on `send-booking-confirmation`
3. Copy the updated code from `supabase/functions/send-booking-confirmation/index.ts`
4. Paste it into the editor
5. Click **Deploy**

**Option B: Via CLI**
```bash
supabase functions deploy send-booking-confirmation
```

### Step 5: Test

1. Make a test booking on your website
2. Check your email inbox
3. Check Supabase Edge Functions logs to see if email was sent

## Verify It's Working

After configuration, when you make a booking:
- ✅ You'll see "Email sent successfully" in the console
- ✅ The response will include `"emailSent": true`
- ✅ You'll receive the confirmation email

## Troubleshooting

### Still not receiving emails?

1. **Check Supabase Edge Functions Logs:**
   - Go to Supabase Dashboard → Edge Functions → Logs
   - Look for error messages

2. **Check Resend Dashboard:**
   - Go to https://resend.com/emails
   - See if emails are being sent and their status

3. **Verify API Key:**
   - Make sure `RESEND_API_KEY` is set correctly in Supabase secrets
   - The key should start with `re_`

4. **Check Spam Folder:**
   - Emails might go to spam initially

5. **Verify Email Address:**
   - Make sure the email address in your booking is correct

### TypeScript Error (Deno not found)

This is a **harmless IDE error**. The function uses Deno runtime (which Supabase Edge Functions use), but your IDE's TypeScript doesn't recognize it. This won't affect the function when deployed.

To fix the IDE error (optional):
- The function will work fine when deployed
- The error is just in your IDE, not in the actual code
- You can ignore it or install Deno extension for VS Code

## Alternative Email Services

If you prefer a different service:

### SendGrid
1. Sign up at https://sendgrid.com
2. Get API key
3. Update the function to use SendGrid API
4. Set `SENDGRID_API_KEY` in Supabase secrets

### AWS SES
1. Set up AWS SES
2. Configure credentials
3. Update function to use AWS SDK
4. Set AWS credentials in Supabase secrets

## Current Function Status

The function now:
- ✅ Checks for `RESEND_API_KEY` environment variable
- ✅ Sends emails via Resend if configured
- ✅ Logs helpful messages if not configured
- ✅ Returns success even if email fails (booking still works)
- ✅ Provides clear error messages

## Next Steps

1. **Sign up for Resend** (5 minutes)
2. **Add API key to Supabase** (2 minutes)
3. **Redeploy the function** (1 minute)
4. **Test a booking** (1 minute)

Total time: ~10 minutes to get emails working!

