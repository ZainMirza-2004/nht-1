# Troubleshooting 500 Error on Parking Permit Request

## Common Causes

### 1. Database Migration Not Run
The `parking_permit_requests` table might be missing the new columns (`permit_type`, `permit_date`, `start_time`, `end_time`).

**Solution**: Run the migration files:
1. `supabase/migrations/20251115000000_create_parking_permit_requests.sql` (creates table)
2. `supabase/migrations/20251115000001_add_parking_permit_time_fields.sql` (adds new columns if table exists)

### 2. Missing Service Role Key
The function needs `SUPABASE_SERVICE_ROLE_KEY` or `SERVICE_ROLE_KEY` to insert into the database.

**Solution**: 
1. Go to Supabase Dashboard → Project Settings → Edge Functions → Secrets
2. Add: `SUPABASE_SERVICE_ROLE_KEY` = Your service role key
   - Find it at: Project Settings → API → Service Role Key

### 3. RLS (Row Level Security) Issues
The service role should bypass RLS, but if there are policy issues, inserts might fail.

**Solution**: Check that the RLS policies allow service_role to insert:
```sql
-- Should exist:
CREATE POLICY "Allow anonymous inserts" ON parking_permit_requests
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

## How to Debug

### Check Supabase Edge Functions Logs
1. Go to Supabase Dashboard → Edge Functions
2. Click on `send-parking-permit-email`
3. View the logs to see the exact error

### Check Database Schema
Run this in Supabase SQL Editor:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'parking_permit_requests'
ORDER BY ordinal_position;
```

You should see:
- `permit_type` (TEXT, NOT NULL, default 'time_slot')
- `permit_date` (DATE, nullable)
- `start_time` (TEXT, nullable)
- `end_time` (TEXT, nullable)

If these columns are missing, run the migration:
```sql
-- Run this migration:
-- supabase/migrations/20251115000001_add_parking_permit_time_fields.sql
```

## Quick Fix

1. **Run the migration** (if columns are missing):
   ```bash
   # In Supabase SQL Editor, run:
   # supabase/migrations/20251115000001_add_parking_permit_time_fields.sql
   ```

2. **Check service role key** is set in Edge Functions secrets

3. **Redeploy the function**:
   ```bash
   supabase functions deploy send-parking-permit-email
   ```

4. **Test again** - the error message should now be more specific

## Updated Error Messages

The function now returns more detailed error messages:
- If service role key is missing: "Server configuration error. Please contact support."
- If database insert fails: "Failed to store permit request: [specific error message]"

Check the browser console or Supabase logs for the specific error message.

