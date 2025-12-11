#!/bin/bash

# Deploy all edge functions to Supabase
# This script will attempt to deploy via CLI, or provide manual instructions

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Deploying Edge Functions"
echo "==========================================${NC}"
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

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    echo -e "${YELLOW}⚠ Project not linked to Supabase${NC}"
    echo ""
    echo "To link your project:"
    echo "1. Get your project reference from Supabase Dashboard"
    echo "2. Run: npx supabase login"
    echo "3. Run: npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    echo -e "${YELLOW}For now, deploying manually via Dashboard is recommended.${NC}"
    echo ""
    echo "Manual Deployment Steps:"
    echo "1. Go to: https://app.supabase.com → Your Project → Edge Functions"
    echo ""
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo "   Function: $func"
            echo "   File: supabase/functions/$func/index.ts"
            echo ""
        fi
    done
    echo "2. For each function:"
    echo "   - Click function name or 'Create Function'"
    echo "   - Copy contents from the file path above"
    echo "   - Paste and click 'Deploy'"
    exit 0
fi

# Try to deploy via CLI
echo "Attempting to deploy via Supabase CLI..."
echo ""

DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        echo -n "Deploying $func... "
        
        if npx supabase functions deploy "$func" --no-verify-jwt 2>&1 | tee /tmp/deploy_${func}.log | grep -q "Deployed Function\|Function deployed"; then
            echo -e "${GREEN}✓${NC}"
            DEPLOYED=$((DEPLOYED + 1))
        else
            echo -e "${YELLOW}⚠${NC}"
            FAILED=$((FAILED + 1))
            echo "   Check /tmp/deploy_${func}.log for details"
        fi
    fi
done

echo ""
if [ $DEPLOYED -eq ${#FUNCTIONS[@]} ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run: ./test-deployment.sh"
    echo "2. Check Edge Function logs in Supabase dashboard"
elif [ $DEPLOYED -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some functions deployed ($DEPLOYED/${#FUNCTIONS[@]}). $FAILED need manual deployment.${NC}"
    echo ""
    echo "For failed functions, deploy manually via Supabase Dashboard"
else
    echo -e "${RED}❌ CLI deployment failed. Please deploy manually via Dashboard.${NC}"
    echo ""
    echo "See deploy-all-functions.md for manual instructions"
fi

