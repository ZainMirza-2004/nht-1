# Email Configuration Guide

The booking system includes email confirmation functionality. To enable email sending, you need to configure an email service provider.

## Current Status

The email function is created at `supabase/functions/send-booking-confirmation/index.ts` but currently only logs emails. To send actual emails, integrate with an email service.

## Recommended Email Services

### Option 1: Resend (Recommended - Easy Setup)

1. Sign up at https://resend.com
2. Get your API key from the dashboard
3. Update the edge function to use Resend:

```typescript
// In supabase/functions/send-booking-confirmation/index.ts
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const resendResponse = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RESEND_API_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: "NH&T Estates <bookings@nhtestates.com>",
    to: email,
    subject: subject,
    html: emailBody,
  }),
});
```

4. Set the environment variable in Supabase:
   - Go to Supabase Dashboard → Project Settings → Edge Functions
   - Add `RESEND_API_KEY` as a secret

### Option 2: SendGrid

1. Sign up at https://sendgrid.com
2. Create an API key
3. Update the function to use SendGrid API
4. Set `SENDGRID_API_KEY` in Supabase Edge Functions secrets

### Option 3: AWS SES

1. Set up AWS SES
2. Configure credentials
3. Update the function to use AWS SDK
4. Set AWS credentials in Supabase Edge Functions secrets

## Testing

After configuring, test by making a booking. Check the Supabase Edge Functions logs to see if emails are being sent successfully.

## Note

The email sending is non-blocking - if email fails, the booking still succeeds. This ensures users can always complete their bookings even if there's a temporary email service issue.

