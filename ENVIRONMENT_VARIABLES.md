# Environment Variables Configuration

This document describes all environment variables needed for the booking system to work fully.

## Supabase Edge Functions Secrets

These need to be configured in Supabase Dashboard → Project Settings → Edge Functions → Secrets:

### Required for Email Functionality

1. **RESEND_API_KEY**
   - Description: API key from Resend.com for sending emails
   - How to get: Sign up at https://resend.com → API Keys → Create API Key
   - Format: Starts with `re_`
   - Required for: All email functionality (booking confirmations, manager notifications, parking permits)

2. **PROPERTY_MANAGER_EMAIL**
   - Description: Email address of the property manager who receives booking notifications and parking permit requests
   - Format: Valid email address (e.g., `manager@nhtestates.com`)
   - Default: `manager@nhtestates.com` (if not set)
   - Required for: Manager notifications for bookings and parking permit requests

### Required for Database Operations

3. **SUPABASE_URL**
   - Description: Your Supabase project URL
   - How to get: Supabase Dashboard → Project Settings → API → Project URL
   - Format: `https://xxxxx.supabase.co`
   - Note: Usually automatically available in edge functions, but can be set explicitly

4. **SUPABASE_SERVICE_ROLE_KEY** (or **SERVICE_ROLE_KEY**)
   - Description: Service role key for database operations (has full access)
   - How to get: Supabase Dashboard → Project Settings → API → Service Role Key
   - Format: Long JWT token
   - Required for: Parking permit approval/rejection functions (needs to update database)
   - ⚠️ **Security Warning**: Never expose this in frontend code! Only use in edge functions.

5. **SUPABASE_ANON_KEY**
   - Description: Anonymous/public key for Supabase (safe to use in URLs)
   - How to get: Supabase Dashboard → Project Settings → API → anon/public key
   - Format: JWT token
   - Required for: Parking permit approval/rejection email links (included in URL for authentication)
   - Note: This is safe to include in email links as it's the public anon key

## Frontend Environment Variables

These go in your `.env` file in the project root:

1. **VITE_SUPABASE_URL**
   - Description: Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`

2. **VITE_SUPABASE_ANON_KEY**
   - Description: Anonymous/public key for Supabase
   - Format: JWT token
   - Note: This is safe to use in frontend code

## Setup Instructions

### Step 1: Configure Resend (for emails)

1. Sign up at https://resend.com (free tier: 100 emails/day)
2. Go to https://resend.com/api-keys
3. Create an API key
4. Copy the key (starts with `re_`)

### Step 2: Add Secrets to Supabase

1. Go to https://app.supabase.com → Your Project
2. Navigate to **Project Settings** → **Edge Functions** → **Secrets**
3. Add the following secrets:
   - `RESEND_API_KEY` = Your Resend API key
   - `PROPERTY_MANAGER_EMAIL` = Your property manager email (e.g., `manager@nhtestates.com`)
   - `SUPABASE_SERVICE_ROLE_KEY` = Your Supabase service role key (for parking permit functions)
   - `SUPABASE_ANON_KEY` = Your Supabase anon/public key (for email link authentication)

### Step 3: Configure Frontend

1. Create a `.env` file in the project root (if not already exists)
2. Add:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

## Verification

After configuration:

1. **Booking Emails**: Make a test booking - both customer and manager should receive emails
2. **Parking Permits**: Submit a parking permit request - manager should receive email with approve/reject links
3. **Calendar Links**: Manager email should include "Add to Google Calendar" button

## Troubleshooting

### Emails not sending?
- Check that `RESEND_API_KEY` is set correctly in Supabase Edge Functions secrets
- Verify the API key is active in Resend dashboard
- Check Supabase Edge Functions logs for errors

### Manager not receiving emails?
- Verify `PROPERTY_MANAGER_EMAIL` is set correctly
- Check spam folder
- Verify Resend API key is working (test with customer email first)

### Parking permit approval/rejection not working?
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Edge Functions secrets
- Check that the database migration for `parking_permit_requests` table has been run
- Verify the function URLs are correct (should use your Supabase project URL)

