# Final Fix for 401 Authorization Error

## The Problem
Supabase Edge Functions require JWT verification by default, which blocks requests from email links that don't have an Authorization header.

## The Solution
I've implemented a two-part solution:

### 1. Disabled JWT Verification (Config Files)
Created `config.toml` files in both function directories:
- `supabase/functions/approve-parking-permit/config.toml`
- `supabase/functions/reject-parking-permit/config.toml`

These files contain:
```toml
[functions.approve-parking-permit]
verify_jwt = false
```

This allows the functions to be called without an Authorization header.

### 2. Custom API Key Validation
The functions now validate the `apikey` query parameter against `SUPABASE_ANON_KEY` from environment variables. This provides security even without JWT verification.

## What You Need to Do

### Step 1: Redeploy Both Functions
The config files need to be deployed with the functions:

```bash
supabase functions deploy approve-parking-permit
supabase functions deploy reject-parking-permit
```

**OR** if using Supabase Dashboard:
1. Go to Edge Functions
2. Redeploy both functions (the config.toml files will be included)

### Step 2: Verify SUPABASE_ANON_KEY is Set
Make sure `SUPABASE_ANON_KEY` is set in Edge Functions secrets (you mentioned you have it).

### Step 3: Test
1. Submit a new parking permit request
2. Check the manager email
3. Click the approve/reject link
4. It should work without the 401 error!

## How It Works Now

1. **Email Link**: Contains `?token=UUID&apikey=ANON_KEY`
2. **Supabase Gateway**: Allows request through (JWT verification disabled)
3. **Function Code**: Validates that `apikey` matches `SUPABASE_ANON_KEY` from environment
4. **Processing**: If valid, processes the approval/rejection
5. **Security**: The apikey validation ensures only valid requests are processed

## Security Note

- The functions are now publicly accessible (no JWT required)
- BUT they validate the apikey from the query parameter
- The apikey must match `SUPABASE_ANON_KEY` exactly
- This provides reasonable security for email link workflows

## If It Still Doesn't Work

1. Check Supabase Edge Functions logs for detailed errors
2. Verify the config.toml files were deployed (check function details in dashboard)
3. Make sure `SUPABASE_ANON_KEY` secret matches the anon key in your project settings
4. Check that the email links include the `&apikey=...` parameter

The 401 error should be completely resolved after redeploying with the config files!

