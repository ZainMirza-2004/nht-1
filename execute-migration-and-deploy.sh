#!/bin/bash

# Execute migration and deploy functions
# This script will run the migration via Supabase Dashboard API or provide manual instructions

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Deploying Migration + Functions"
echo "==========================================${NC}"
echo ""

# Step 1: Run Migration
echo -e "${YELLOW}Step 1: Running Migration...${NC}"

# Try to use Supabase Management API
PROJECT_REF="cfxdtuwfeuvwpasbwpte"
MIGRATION_FILE="run-migration-directly.sql"

if [ -f "$MIGRATION_FILE" ]; then
    echo "Migration file ready: $MIGRATION_FILE"
    echo ""
    echo "Since Supabase CLI doesn't support direct SQL execution,"
    echo "please run this migration manually:"
    echo ""
    echo "1. Go to: https://app.supabase.com/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: $MIGRATION_FILE"
    echo "3. Paste and click 'Run'"
    echo ""
    read -p "Press Enter after you've run the migration, or 's' to skip: " response
    
    if [ "$response" = "s" ]; then
        echo -e "${YELLOW}Skipping migration (you can run it later)${NC}"
    else
        echo -e "${GREEN}✓ Migration should be applied${NC}"
    fi
else
    echo -e "${YELLOW}Migration file not found. Skipping.${NC}"
fi

# Step 2: Deploy Functions
echo ""
echo -e "${YELLOW}Step 2: Deploying Edge Functions...${NC}"

FUNCTIONS=(
    "send-parking-permit-email"
    "approve-parking-permit"
    "reject-parking-permit"
    "send-booking-confirmation"
)

DEPLOYED=0
FAILED=0

for func in "${FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        echo -n "Deploying $func... "
        
        # Deploy function
        if npx supabase functions deploy "$func" --no-verify-jwt 2>&1 | tee /tmp/deploy_${func}.log | grep -E "Deployed|deployed|Success" > /dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            DEPLOYED=$((DEPLOYED + 1))
        else
            # Check if it actually deployed (sometimes output format differs)
            if [ -s /tmp/deploy_${func}.log ]; then
                if grep -qi "deployed\|success\|created" /tmp/deploy_${func}.log; then
                    echo -e "${GREEN}✓${NC}"
                    DEPLOYED=$((DEPLOYED + 1))
                else
                    echo -e "${YELLOW}⚠${NC}"
                    FAILED=$((FAILED + 1))
                fi
            else
                echo -e "${YELLOW}⚠${NC}"
                FAILED=$((FAILED + 1))
            fi
        fi
    fi
done

echo ""
if [ $DEPLOYED -eq ${#FUNCTIONS[@]} ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
elif [ $DEPLOYED -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some functions deployed ($DEPLOYED/${#FUNCTIONS[@]}).${NC}"
    if [ $FAILED -gt 0 ]; then
        echo "Failed functions need manual deployment via Dashboard."
    fi
else
    echo -e "${YELLOW}⚠ CLI deployment had issues. Functions may need manual deployment.${NC}"
fi

# Step 3: Summary
echo ""
echo -e "${BLUE}=========================================="
echo "Deployment Summary"
echo "==========================================${NC}"
echo ""
echo "Migration: ${YELLOW}Run manually via Dashboard${NC}"
echo "Functions: ${GREEN}$DEPLOYED/${#FUNCTIONS[@]} deployed${NC}"
echo ""
echo "Next: Test with ./test-deployment.sh"

