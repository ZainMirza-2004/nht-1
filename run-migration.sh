#!/bin/bash

# Script to run database migration via Supabase Dashboard
# This script opens the migration file for easy copy-paste

echo "=========================================="
echo "Database Migration Helper"
echo "=========================================="
echo ""
echo "Since Supabase CLI requires authentication, please run the migration manually:"
echo ""
echo "1. Go to: https://app.supabase.com → Your Project → SQL Editor"
echo "2. Copy the contents of the migration file below"
echo "3. Paste into SQL Editor"
echo "4. Click 'Run'"
echo ""
echo "Migration file location:"
echo "  supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql"
echo ""
echo "=========================================="
echo "Migration SQL (copy from here):"
echo "=========================================="
echo ""

cat supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql

echo ""
echo "=========================================="
echo "After running, verify with:"
echo "=========================================="
echo ""
echo "SELECT routine_name FROM information_schema.routines"
echo "WHERE routine_name IN ('create_spa_booking', 'create_cinema_booking');"
echo ""
echo "Should return 2 rows."

