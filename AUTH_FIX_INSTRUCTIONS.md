# Fix for 401 Authorization Error

## Problem
When clicking approve/reject links from emails, you get: `{"code":401,"message":"Missing authorization header"}`

This happens because Supabase Edge Functions require authentication, but email links can't include HTTP headers.

## Solution

The functions have been updated to include the anon key in the URL. You need to:

1. **Add `SUPABASE_ANON_KEY` to Edge Functions Secrets**:
   - Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
   - Add: `SUPABASE_ANON_KEY` = Your Supabase anon/public key
   - You can find this at: Project Settings → API → anon/public key

2. **Redeploy the Edge Functions**:
   - `send-parking-permit-email` (updated to include anon key in URLs)
   - `approve-parking-permit` (updated to handle query param auth)
   - `reject-parking-permit` (updated to handle query param auth)

## How It Works

The email links now include the anon key as a query parameter:
```
https://your-project.supabase.co/functions/v1/approve-parking-permit?token=UUID&apikey=ANON_KEY
```

The functions extract the `apikey` from the query parameter and use it for authentication.

## Alternative Solution (If Above Doesn't Work)

If Supabase still blocks the request at the gateway level, you can:

1. Create a simple HTML redirect page that makes an authenticated request
2. Or use a server-side proxy
3. Or configure the Edge Function to be truly public (if Supabase supports this)

But the query parameter approach should work for most cases.

## Testing

After adding the secret and redeploying:
1. Submit a new parking permit request
2. Check the manager email - the approve/reject links should now include `&apikey=...`
3. Click the approve link - it should work without the 401 error

