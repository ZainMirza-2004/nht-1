# Deploy Email Confirmation Function

The email confirmation function needs to be deployed to Supabase for emails to work.

## Quick Deployment (Using Supabase CLI)

### 1. Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

Or using Homebrew (Mac):
```bash
brew install supabase/tap/supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link Your Project

```bash
supabase link --project-ref cfxdtuwfeuvwpasbwpte
```

### 4. Deploy the Function

```bash
supabase functions deploy send-booking-confirmation
```

## Alternative: Deploy via Supabase Dashboard

1. Go to https://app.supabase.com
2. Select your project
3. Go to **Edge Functions** in the sidebar
4. Click **Create a new function**
5. Name it: `send-booking-confirmation`
6. Copy the contents of `supabase/functions/send-booking-confirmation/index.ts`
7. Paste into the function editor
8. Click **Deploy**

## Verify Deployment

After deployment, test by making a booking. The function should now respond without CORS errors.

## Note

Even without the function deployed, bookings will still work - the email sending is non-blocking and won't prevent successful bookings.

