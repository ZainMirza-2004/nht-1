#!/bin/bash

# Comprehensive deployment script
# Attempts automated deployment, falls back to manual instructions

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================="
echo "Backend Deployment Automation"
echo "==========================================${NC}"
echo ""

# Step 1: Database Migration
echo -e "${YELLOW}Step 1: Database Migration${NC}"
echo ""

# Check if .env exists and has Supabase URL
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Try to run migration via Supabase CLI if available
if command -v npx &> /dev/null; then
    echo "Attempting migration via Supabase CLI..."
    
    # Check if linked
    if [ -f .supabase/config.toml ] || npx supabase status 2>/dev/null | grep -q "API URL"; then
        echo "Project is linked. Running migration..."
        npx supabase db push 2>&1 && {
            echo -e "${GREEN}✓ Migration completed successfully!${NC}"
            MIGRATION_DONE=true
        } || {
            echo -e "${YELLOW}⚠ Migration via CLI failed. Please run manually.${NC}"
            MIGRATION_DONE=false
        }
    else
        echo -e "${YELLOW}Project not linked. Please run migration manually.${NC}"
        MIGRATION_DONE=false
    fi
else
    MIGRATION_DONE=false
fi

if [ "$MIGRATION_DONE" != "true" ]; then
    echo ""
    echo -e "${YELLOW}Manual Migration Required:${NC}"
    echo "1. Go to: https://app.supabase.com → Your Project → SQL Editor"
    echo "2. Open: supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql"
    echo "3. Copy all contents and paste into SQL Editor"
    echo "4. Click 'Run'"
    echo ""
    read -p "Press Enter after you've completed the migration..."
fi

# Step 2: Deploy Edge Functions
echo ""
echo -e "${YELLOW}Step 2: Deploy Edge Functions${NC}"
echo ""

FUNCTIONS=(
    "create-booking"
    "check-availability"
    "get-unavailable-slots"
    "send-booking-confirmation"
    "send-parking-permit-email"
    "approve-parking-permit"
    "reject-parking-permit"
)

DEPLOYED_COUNT=0

if command -v npx &> /dev/null; then
    echo "Attempting to deploy functions via Supabase CLI..."
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo -n "Deploying $func... "
            npx supabase functions deploy "$func" --no-verify-jwt 2>&1 && {
                echo -e "${GREEN}✓${NC}"
                DEPLOYED_COUNT=$((DEPLOYED_COUNT + 1))
            } || {
                echo -e "${YELLOW}⚠ (will need manual deployment)${NC}"
            }
        fi
    done
fi

if [ $DEPLOYED_COUNT -lt ${#FUNCTIONS[@]} ]; then
    echo ""
    echo -e "${YELLOW}Some functions need manual deployment:${NC}"
    echo "1. Go to: https://app.supabase.com → Your Project → Edge Functions"
    echo ""
    echo "Functions to deploy:"
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo "   - $func (supabase/functions/$func/index.ts)"
        fi
    done
    echo ""
    echo "2. For each function:"
    echo "   - Click 'Create Function' or select existing"
    echo "   - Copy contents from index.ts"
    echo "   - Paste and click 'Deploy'"
    echo ""
    read -p "Press Enter after you've deployed all functions..."
fi

# Step 3: Test Deployment
echo ""
echo -e "${YELLOW}Step 3: Testing Deployment${NC}"
echo ""

if [ -f test-deployment.sh ]; then
    echo "Running test script..."
    ./test-deployment.sh
else
    echo -e "${RED}Test script not found!${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"
echo ""
echo "Next steps:"
echo "1. Check Edge Function logs in Supabase dashboard"
echo "2. Verify bookings are working"
echo "3. Monitor for any errors"

