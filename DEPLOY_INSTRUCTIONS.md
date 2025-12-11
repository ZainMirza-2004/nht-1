# Deploy Email Confirmation Function

The email confirmation function needs to be deployed to Supabase. Here are two ways to do it:

## Option 1: Using Supabase Dashboard (Easiest - No CLI Required)

1. **Go to Supabase Dashboard**
   - Visit https://app.supabase.com
   - Select your project (cfxdtuwfeuvwpasbwpte)

2. **Navigate to Edge Functions**
   - Click on **Edge Functions** in the left sidebar
   - If you don't see it, click **More** to expand the menu

3. **Create New Function**
   - Click **Create a new function** or **New Function**
   - Name it: `send-booking-confirmation`

4. **Copy Function Code**
   - Open the file: `supabase/functions/send-booking-confirmation/index.ts`
   - Copy ALL the code from that file
   - Paste it into the function editor in Supabase Dashboard

5. **Deploy**
   - Click **Deploy** or **Save**
   - Wait for deployment to complete

6. **Test**
   - Make a booking on your website
   - Check the Edge Functions logs to see if it's working
   - The CORS error should be gone!

## Option 2: Using Supabase CLI

### Install Supabase CLI

**Mac (using Homebrew):**
```bash
brew install supabase/tap/supabase
```

**Or using npm:**
```bash
npm install -g supabase
```

**Windows/Linux:**
```bash
npm install -g supabase
```

### Login and Deploy

```bash
# Login to Supabase
supabase login

# Link your project (replace with your project ref)
supabase link --project-ref cfxdtuwfeuvwpasbwpte

# Deploy the function
supabase functions deploy send-booking-confirmation
```

## Verify It's Working

After deployment:
1. Make a test booking on your website
2. Check the browser console - you should NOT see CORS errors anymore
3. Check Supabase Dashboard → Edge Functions → Logs to see function execution

## Current Status

✅ **Bookings work perfectly** - even without the email function deployed
✅ **No errors shown to users** - email failures are handled gracefully
✅ **Function code is ready** - just needs deployment

The email function is optional - bookings will work fine without it. Once deployed, customers will receive confirmation emails automatically.

## Next Step: Configure Email Service

After deploying, you'll need to configure an actual email service (Resend, SendGrid, etc.) to send real emails. See `EMAIL_SETUP.md` for details.

