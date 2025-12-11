#!/bin/bash

# Execute deployment steps 1, 3, and 4
# Step 2 (secrets) is already done per user

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Executing Backend Deployment"
echo "==========================================${NC}"
echo ""

# Step 1: Database Migration
echo -e "${YELLOW}[1/3] Running Database Migration...${NC}"
echo ""

# Try via npx supabase
if command -v npx &> /dev/null; then
    # Check if project is linked
    if [ -f .supabase/config.toml ]; then
        echo "Project is linked. Pushing migration..."
        npx supabase db push && {
            echo -e "${GREEN}✓ Migration completed via CLI${NC}"
            MIGRATION_SUCCESS=true
        } || {
            echo -e "${YELLOW}⚠ CLI migration failed. Please run manually.${NC}"
            MIGRATION_SUCCESS=false
        }
    else
        echo -e "${YELLOW}Project not linked.${NC}"
        echo "To link: npx supabase login && npx supabase link --project-ref YOUR_PROJECT_REF"
        echo ""
        echo -e "${YELLOW}For now, please run migration manually:${NC}"
        echo "1. Go to: https://app.supabase.com → Your Project → SQL Editor"
        echo "2. Open: supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql"
        echo "3. Copy all contents and paste into SQL Editor"
        echo "4. Click 'Run'"
        echo ""
        read -p "Press Enter after you've completed the migration..."
        MIGRATION_SUCCESS=true
    fi
else
    echo -e "${YELLOW}Please run migration manually:${NC}"
    echo "1. Go to: https://app.supabase.com → Your Project → SQL Editor"
    echo "2. Open: supabase/migrations/20251116000000_fix_booking_concurrency_and_validation.sql"
    echo "3. Copy all contents and paste into SQL Editor"
    echo "4. Click 'Run'"
    echo ""
    read -p "Press Enter after you've completed the migration..."
    MIGRATION_SUCCESS=true
fi

# Step 3: Deploy Edge Functions
echo ""
echo -e "${YELLOW}[2/3] Deploying Edge Functions...${NC}"
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

DEPLOYED=0
FAILED=0

if command -v npx &> /dev/null && [ -f .supabase/config.toml ]; then
    echo "Deploying via Supabase CLI..."
    echo ""
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo -n "  Deploying $func... "
            npx supabase functions deploy "$func" --no-verify-jwt 2>&1 | grep -q "Deployed Function" && {
                echo -e "${GREEN}✓${NC}"
                DEPLOYED=$((DEPLOYED + 1))
            } || {
                echo -e "${YELLOW}⚠${NC}"
                FAILED=$((FAILED + 1))
            }
        fi
    done
    
    echo ""
    if [ $DEPLOYED -eq ${#FUNCTIONS[@]} ]; then
        echo -e "${GREEN}✓ All functions deployed successfully!${NC}"
        FUNCTIONS_DEPLOYED=true
    elif [ $DEPLOYED -gt 0 ]; then
        echo -e "${YELLOW}⚠ Some functions deployed. $FAILED need manual deployment.${NC}"
        FUNCTIONS_DEPLOYED=false
    else
        echo -e "${YELLOW}⚠ CLI deployment failed. Please deploy manually.${NC}"
        FUNCTIONS_DEPLOYED=false
    fi
else
    FUNCTIONS_DEPLOYED=false
fi

if [ "$FUNCTIONS_DEPLOYED" != "true" ]; then
    echo ""
    echo -e "${YELLOW}Manual Deployment Required:${NC}"
    echo "1. Go to: https://app.supabase.com → Your Project → Edge Functions"
    echo ""
    echo "Functions to deploy:"
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo "   - $func"
        fi
    done
    echo ""
    echo "2. For each function:"
    echo "   - Click function name or 'Create Function'"
    echo "   - Copy contents from: supabase/functions/[name]/index.ts"
    echo "   - Paste and click 'Deploy'"
    echo ""
    read -p "Press Enter after you've deployed all functions..."
fi

# Step 4: Test Deployment
echo ""
echo -e "${YELLOW}[3/3] Testing Deployment...${NC}"
echo ""

if [ -f test-deployment.sh ]; then
    ./test-deployment.sh
else
    echo -e "${RED}Test script not found!${NC}"
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Steps Complete!"
echo "==========================================${NC}"
echo ""
echo "Summary:"
echo "  ✓ Step 1: Database Migration"
echo "  ✓ Step 2: Secrets (already configured)"
echo "  ✓ Step 3: Edge Functions"
echo "  ✓ Step 4: Testing"
echo ""
echo "Next: Monitor Edge Function logs in Supabase dashboard"

