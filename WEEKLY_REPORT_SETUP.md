# Weekly Automated Report Setup Guide

This guide will help you set up the weekly automated reporting system that generates and emails an Excel report of all parking bookings from the past 7 days.

## Overview

The system consists of:
1. **Edge Function**: `weekly-report` - Generates Excel reports and sends them via email
2. **Cron Job**: Scheduled to run every Monday at 8:00 AM UTC
3. **Email Delivery**: Uses Resend API to send reports to the property manager

## Prerequisites

Before setting up, ensure you have:
- ✅ Supabase project with `parking_permit_requests` table
- ✅ `RESEND_API_KEY` configured in Supabase Edge Functions secrets
- ✅ `PROPERTY_MANAGER_EMAIL` configured in Supabase Edge Functions secrets
- ✅ `SUPABASE_SERVICE_ROLE_KEY` configured in Supabase Edge Functions secrets

## Step 1: Deploy the Edge Function

### Option A: Using Supabase CLI

```bash
# Navigate to your project directory
cd /path/to/your/project

# Deploy the function
supabase functions deploy weekly-report
```

### Option B: Using Supabase Dashboard

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Click **Create a new function**
5. Name it: `weekly-report`
6. Copy and paste the contents of `supabase/functions/weekly-report/index.ts`
7. Click **Deploy**

## Step 2: Verify Environment Variables

Ensure these secrets are set in your Supabase project:

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Verify these secrets exist:
   - `RESEND_API_KEY` - Your Resend API key
   - `PROPERTY_MANAGER_EMAIL` - Email address to receive reports
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (or `SERVICE_ROLE_KEY`)

If any are missing, add them by clicking **Add Secret**.

## Step 3: Set Up the Cron Job

Supabase uses PostgreSQL's `pg_cron` extension to schedule Edge Functions. You'll need to set this up via SQL.

### Step 3.1: Enable pg_cron Extension

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this SQL to enable the extension (if not already enabled):

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Grant usage to postgres role (required for cron jobs)
GRANT USAGE ON SCHEMA cron TO postgres;
```

### Step 3.2: Create the Cron Job

Run this SQL to schedule the weekly report function:

```sql
-- Enable pg_net extension if not already enabled (for HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule weekly-report function to run every Monday at 8:00 AM UTC
-- Note: Replace YOUR_PROJECT_REF with your actual Supabase project reference
-- You can find it in your Supabase dashboard URL: https://app.supabase.com/project/YOUR_PROJECT_REF
SELECT cron.schedule(
  'weekly-parking-report',                    -- Job name (must be unique)
  '0 8 * * MON',                              -- Cron expression: Every Monday at 8:00 AM UTC
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Important:** Replace `YOUR_PROJECT_REF` with your actual Supabase project reference. You can find it:
- In your Supabase dashboard URL: `https://app.supabase.com/project/YOUR_PROJECT_REF`
- Or go to **Project Settings** → **API** → **Project URL** - the reference is the subdomain

**Alternative Method (Using Service Role Key from Secrets):**

If the above doesn't work, you can also use this approach which directly uses the service role key:

```sql
-- Get your service role key from Project Settings → API → service_role key
-- Then use this version:
SELECT cron.schedule(
  'weekly-parking-report',
  '0 8 * * MON',
  $$
  SELECT
    net.http_post(
      url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-report',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY_HERE'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**Cron Expression Explanation:**
- `0 8 * * MON` means:
  - `0` - At minute 0
  - `8` - At hour 8 (8 AM)
  - `*` - Every day of the month
  - `*` - Every month
  - `MON` - On Mondays

### Step 3.3: Alternative Cron Schedule Options

If you want a different schedule, modify the cron expression:

```sql
-- Every Monday at 9:00 AM UTC
'0 9 * * MON'

-- Every Monday at 8:00 AM in a specific timezone (adjust hour accordingly)
'0 8 * * MON'  -- For UTC
'0 9 * * MON'  -- For UTC+1 (BST/GMT+1)

-- Every Sunday at 6:00 PM UTC (end of week)
'0 18 * * SUN'

-- Every day at 8:00 AM UTC
'0 8 * * *'
```

## Step 4: Verify the Cron Job

### Check if the job was created:

```sql
-- List all cron jobs
SELECT * FROM cron.job;
```

You should see a row with `jobname = 'weekly-parking-report'`.

### View job details:

```sql
-- Get detailed information about the weekly report job
SELECT 
  jobid,
  schedule,
  command,
  nodename,
  nodeport,
  database,
  username,
  active
FROM cron.job
WHERE jobname = 'weekly-parking-report';
```

### Test the Function Manually

Before waiting for the cron job, test the function manually:

**Option A: Using Supabase Dashboard**
1. Go to **Edge Functions** → **weekly-report**
2. Click **Invoke function**
3. Leave the request body empty or use `{}`
4. Click **Invoke**
5. Check the response - you should see a success message

**Option B: Using curl**

```bash
curl -X POST \
  'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-report' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

**Option C: Using the Supabase Client**

If you have the Supabase client set up, you can trigger it programmatically:

```typescript
const { data, error } = await supabase.functions.invoke('weekly-report', {
  body: {}
});
```

## Step 5: Monitor the Cron Job

### View Cron Job Execution History

```sql
-- View recent cron job runs
SELECT 
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
WHERE jobid = (
  SELECT jobid FROM cron.job WHERE jobname = 'weekly-parking-report'
)
ORDER BY start_time DESC
LIMIT 10;
```

### View Edge Function Logs

1. Go to **Edge Functions** → **weekly-report**
2. Click on **Logs** tab
3. You'll see execution logs each time the function runs

## Troubleshooting

### Cron Job Not Running

1. **Check if pg_cron is enabled:**
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. **Check if the job is active:**
   ```sql
   SELECT active FROM cron.job WHERE jobname = 'weekly-parking-report';
   ```
   If `active` is `false`, reactivate it:
   ```sql
   UPDATE cron.job SET active = true WHERE jobname = 'weekly-parking-report';
   ```

3. **Check cron job logs:**
   ```sql
   SELECT * FROM cron.job_run_details 
   WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-parking-report')
   ORDER BY start_time DESC 
   LIMIT 5;
   ```

### Function Not Receiving Requests

1. **Verify the function URL is correct** - It should be:
   ```
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-report
   ```

2. **Check environment variables** are set correctly in Edge Functions secrets

3. **Check Edge Function logs** for errors

### Email Not Being Sent

1. **Verify Resend API key** is correct in Supabase secrets
2. **Check PROPERTY_MANAGER_EMAIL** is set correctly
3. **Check Resend dashboard** for email delivery status
4. **Review Edge Function logs** for email-related errors

### Excel File Generation Errors

1. **Check Edge Function logs** for specific error messages
2. **Verify database query** is returning data correctly
3. **Test with a manual function invocation** to see detailed error messages

## Updating or Removing the Cron Job

### Update the Schedule

```sql
-- Update the cron schedule (e.g., change to Tuesday at 9 AM)
SELECT cron.alter_job(
  (SELECT jobid FROM cron.job WHERE jobname = 'weekly-parking-report'),
  schedule := '0 9 * * TUE'
);
```

### Pause the Cron Job

```sql
-- Temporarily disable the job
UPDATE cron.job 
SET active = false 
WHERE jobname = 'weekly-parking-report';
```

### Resume the Cron Job

```sql
-- Re-enable the job
UPDATE cron.job 
SET active = true 
WHERE jobname = 'weekly-parking-report';
```

### Remove the Cron Job

```sql
-- Unschedule and remove the job
SELECT cron.unschedule('weekly-parking-report');
```

## Report Format

The Excel report includes the following columns:

- **Booking ID** - Unique identifier for each booking
- **Permit ID** - Permit identifier (if applicable)
- **Full Name** - Customer's full name
- **Email** - Customer's email address
- **Phone** - Customer's phone number
- **Vehicle Make** - Vehicle manufacturer
- **Registration** - Vehicle registration number
- **Property Name** - Name of the property
- **Permit Type** - Type of permit (free, paid, time_slot, full_day)
- **Number of Nights** - Number of nights (if applicable)
- **Check-in Date** - Check-in date (if applicable)
- **Check-out Date** - Check-out date (if applicable)
- **Permit Date** - Date of the permit
- **Start Time** - Start time (for time slot permits)
- **End Time** - End time (for time slot permits)
- **Status** - Booking status (pending, approved, rejected)
- **Transaction ID** - Payment transaction ID (if paid)
- **Amount Paid** - Payment amount (if paid)
- **Additional Details** - Any additional notes
- **Created At** - When the booking was created
- **Updated At** - When the booking was last updated
- **Approved At** - When the booking was approved (if applicable)
- **Rejected At** - When the booking was rejected (if applicable)

## Support

If you encounter any issues:
1. Check the **Edge Function logs** in Supabase Dashboard
2. Review the **cron job execution history** using the SQL queries above
3. Verify all **environment variables** are set correctly
4. Test the function manually to isolate the issue

## Next Steps

Once set up:
- ✅ The report will automatically generate every Monday at 8:00 AM UTC
- ✅ Reports are emailed to the property manager
- ✅ If no bookings exist, an email is still sent indicating no bookings
- ✅ All errors are logged for debugging

You can manually trigger the report at any time by invoking the Edge Function through the Supabase Dashboard or API.

