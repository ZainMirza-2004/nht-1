#!/bin/bash

# Run the new RLS policy migration
# This migration is safe to run multiple times (uses IF NOT EXISTS)

echo "Running new migration: 20251116000001_improve_rls_policies.sql"
echo ""

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    echo "Project not linked. Please link first:"
    echo "  npx supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

# Get the SQL content
SQL_FILE="supabase/migrations/20251116000001_improve_rls_policies.sql"

if [ ! -f "$SQL_FILE" ]; then
    echo "Error: Migration file not found: $SQL_FILE"
    exit 1
fi

# Use psql via Supabase CLI to execute SQL
echo "Executing migration..."
echo ""

# Try to execute via Supabase API
npx supabase db execute < "$SQL_FILE" 2>&1 || {
    echo ""
    echo "Alternative: Please run this SQL manually in Supabase Dashboard:"
    echo "1. Go to: https://app.supabase.com → Your Project → SQL Editor"
    echo "2. Copy contents of: $SQL_FILE"
    echo "3. Paste and run"
    echo ""
    echo "Or the migration will be applied when you run: npx supabase db push"
}

