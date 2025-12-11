# Complete Deployment Guide

This guide covers deploying all the new features: booking notifications with calendar links and parking permit approval workflow.

## Prerequisites

1. Supabase project set up
2. Resend account (for emails)
3. All environment variables configured (see `ENVIRONMENT_VARIABLES.md`)

## Step 1: Run Database Migrations

Run the parking permit requests migration:

```sql
-- This is in: supabase/migrations/20251115000000_create_parking_permit_requests.sql
```

**Via Supabase Dashboard:**
1. Go to Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase/migrations/20251115000000_create_parking_permit_requests.sql`
3. Paste and run

**Via Supabase CLI:**
```bash
supabase db push
```

## Step 2: Deploy Edge Functions

### Updated Functions (Redeploy)

1. **send-booking-confirmation** (updated)
   - Now sends emails to both customer and property manager
   - Includes Google Calendar link for manager

2. **send-parking-permit-email** (updated)
   - Now stores requests in database
   - Sends email to property manager with approve/reject links

### New Functions (Deploy)

3. **approve-parking-permit** (new)
   - Handles parking permit approvals
   - Sends confirmation email to customer

4. **reject-parking-permit** (new)
   - Handles parking permit rejections
   - Sends rejection email to customer

### Deployment Methods

#### Option A: Via Supabase Dashboard (Recommended)

For each function:

1. Go to Supabase Dashboard → Edge Functions
2. Click on the function name (or "Create new function" for new ones)
3. Copy the code from `supabase/functions/[function-name]/index.ts`
4. Paste into the editor
5. Click **Deploy**

#### Option B: Via Supabase CLI

```bash
# Login and link project
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Deploy all functions
supabase functions deploy send-booking-confirmation
supabase functions deploy send-parking-permit-email
supabase functions deploy approve-parking-permit
supabase functions deploy reject-parking-permit
```

## Step 3: Configure Environment Variables

In Supabase Dashboard → Project Settings → Edge Functions → Secrets, add:

1. **RESEND_API_KEY** - Your Resend API key
2. **PROPERTY_MANAGER_EMAIL** - Email address for booking notifications (e.g., `manager@nhtestates.com`)
3. **SUPABASE_SERVICE_ROLE_KEY** - Required for parking permit approval/rejection

## Step 4: Test the System

### Test Booking Flow

1. Make a test booking (spa or cinema)
2. Check customer email - should receive confirmation
3. Check property manager email - should receive notification with calendar link
4. Click calendar link - should open Google Calendar with event details

### Test Parking Permit Flow

1. Submit a parking permit request
2. Check property manager email - should receive email with Approve/Reject buttons
3. Click "Approve" - should see success page and customer receives confirmation email
4. Submit another request and click "Reject" - should see success page and customer receives rejection email

## Features Implemented

### ✅ Booking Notifications

- **Customer Email**: Confirmation email with booking details
- **Manager Email**: Notification email with:
  - All booking details
  - Google Calendar link (one-click add to calendar)
  - Professional HTML formatting

### ✅ Parking Permit Workflow

- **Request Submission**: Stores in database with "pending" status
- **Manager Notification**: Email with approve/reject links
- **Approval**: Updates status, sends confirmation to customer
- **Rejection**: Updates status, sends rejection email to customer

### ✅ Calendar Integration

- Google Calendar links work with any calendar app
- Automatically calculates event duration
- Includes all booking details in event description
- Works with Google Calendar, Outlook, Apple Calendar, etc.

## Troubleshooting

### Calendar link not working?
- Check time format parsing (should handle both 12-hour and 24-hour formats)
- Verify timezone handling
- Test the generated URL directly

### Manager not receiving emails?
- Verify `PROPERTY_MANAGER_EMAIL` is set correctly
- Check Resend dashboard for email status
- Check spam folder

### Parking permit approval/rejection not working?
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Verify database migration ran successfully
- Check function logs in Supabase Dashboard

### Database errors?
- Run the migration: `20251115000000_create_parking_permit_requests.sql`
- Verify RLS policies are correct
- Check service role key has proper permissions

## Next Steps

1. Customize email templates (HTML in edge functions)
2. Add more calendar providers (Outlook, iCal)
3. Add email templates for different scenarios
4. Set up email monitoring/alerts

## Support

For issues or questions:
- Check Supabase Edge Functions logs
- Check Resend dashboard for email delivery status
- Review `ENVIRONMENT_VARIABLES.md` for configuration help

