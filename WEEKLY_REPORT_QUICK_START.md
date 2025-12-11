# Weekly Report - Quick Start Guide

## Quick Setup Checklist

- [ ] **Deploy the Edge Function**
  ```bash
  supabase functions deploy weekly-report
  ```

- [ ] **Verify Secrets in Supabase Dashboard**
  - Go to **Project Settings** → **Edge Functions** → **Secrets**
  - Ensure these exist:
    - `RESEND_API_KEY`
    - `PROPERTY_MANAGER_EMAIL`
    - `SUPABASE_SERVICE_ROLE_KEY` (or `SERVICE_ROLE_KEY`)

- [ ] **Enable pg_cron Extension**
  ```sql
  CREATE EXTENSION IF NOT EXISTS pg_cron;
  CREATE EXTENSION IF NOT EXISTS pg_net;
  ```

- [ ] **Create Cron Job**
  
  Replace `YOUR_PROJECT_REF` with your Supabase project reference:
  
  ```sql
  SELECT cron.schedule(
    'weekly-parking-report',
    '0 8 * * MON',  -- Every Monday at 8:00 AM UTC
    $$
    SELECT
      net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/weekly-report',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
        ),
        body := '{}'::jsonb
      ) AS request_id;
    $$
  );
  ```

- [ ] **Test Manually**
  - Go to **Edge Functions** → **weekly-report** → **Invoke function**
  - Check your email for the report

## What It Does

1. **Queries** all bookings from `parking_permit_requests` table from the last 7 days
2. **Generates** an Excel (.xlsx) file with all booking data
3. **Emails** the Excel file to the property manager
4. **Sends** an email even if no bookings exist (with a message)

## Schedule

- **Default**: Every Monday at 8:00 AM UTC
- **To change**: Update the cron expression in the scheduled job

## Report Contains

All fields from `parking_permit_requests` table including:
- Booking ID, Permit ID
- Customer details (name, email, phone)
- Vehicle information
- Property and permit details
- Dates and times
- Payment information (if applicable)
- Status and timestamps

## Troubleshooting

**Function not running?**
- Check cron job status: `SELECT * FROM cron.job WHERE jobname = 'weekly-parking-report';`
- Check logs: `SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'weekly-parking-report');`

**Email not received?**
- Verify `PROPERTY_MANAGER_EMAIL` is correct
- Check Resend API key is valid
- Review Edge Function logs in Supabase Dashboard

**Excel file issues?**
- Check Edge Function logs for generation errors
- Verify database query returns data correctly

For detailed setup instructions, see `WEEKLY_REPORT_SETUP.md`.

