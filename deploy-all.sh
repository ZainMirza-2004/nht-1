#!/bin/bash

# Complete deployment script - Migration + Functions
# This script will:
# 1. Link project (if needed)
# 2. Run new migration
# 3. Deploy all updated functions

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}=========================================="
echo "Complete Backend Deployment"
echo "==========================================${NC}"
echo ""

# Check if project is linked
if [ ! -f .supabase/config.toml ]; then
    echo -e "${YELLOW}Project not linked.${NC}"
    echo ""
    echo "To link your project:"
    echo "1. Get your project reference from Supabase Dashboard URL"
    echo "   (e.g., https://app.supabase.com/project/cfxdtuwfeuvwpasbwpte)"
    echo "   Project ref is: cfxdtuwfeuvwpasbwpte"
    echo ""
    echo "2. Run:"
    echo "   npx supabase login"
    echo "   npx supabase link --project-ref YOUR_PROJECT_REF"
    echo ""
    read -p "Enter your project reference (or press Enter to skip linking): " PROJECT_REF
    
    if [ -n "$PROJECT_REF" ]; then
        echo "Linking project..."
        npx supabase link --project-ref "$PROJECT_REF" 2>&1 || {
            echo -e "${RED}Failed to link project. Please link manually.${NC}"
            exit 1
        }
        echo -e "${GREEN}✓ Project linked${NC}"
    else
        echo -e "${YELLOW}Skipping link. Will try to run migration manually.${NC}"
    fi
fi

# Step 1: Run Migration
echo ""
echo -e "${YELLOW}Step 1: Running Migration...${NC}"

if [ -f .supabase/config.toml ]; then
    echo "Pushing migration to database..."
    npx supabase db push 2>&1 && {
        echo -e "${GREEN}✓ Migration completed successfully!${NC}"
    } || {
        echo -e "${YELLOW}⚠ Migration via CLI failed.${NC}"
        echo "Please run manually:"
        echo "  File: supabase/migrations/20251116000001_improve_rls_policies.sql"
        echo "  Go to: Supabase Dashboard → SQL Editor"
        read -p "Press Enter after you've run the migration manually..."
    }
else
    echo -e "${YELLOW}Project not linked. Please run migration manually:${NC}"
    echo "1. Go to: Supabase Dashboard → SQL Editor"
    echo "2. Open: supabase/migrations/20251116000001_improve_rls_policies.sql"
    echo "3. Copy and run"
    echo ""
    read -p "Press Enter after you've run the migration..."
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
        npx supabase functions deploy "$func" --no-verify-jwt 2>&1 | tee /tmp/deploy_${func}.log | grep -q "Deployed Function\|Function deployed\|Deployed" && {
            echo -e "${GREEN}✓${NC}"
            DEPLOYED=$((DEPLOYED + 1))
        } || {
            if grep -q "Function deployed\|Deployed" /tmp/deploy_${func}.log 2>/dev/null; then
                echo -e "${GREEN}✓${NC}"
                DEPLOYED=$((DEPLOYED + 1))
            else
                echo -e "${YELLOW}⚠${NC}"
                FAILED=$((FAILED + 1))
            fi
        }
    fi
done

echo ""
if [ $DEPLOYED -eq ${#FUNCTIONS[@]} ]; then
    echo -e "${GREEN}✅ All functions deployed successfully!${NC}"
elif [ $DEPLOYED -gt 0 ]; then
    echo -e "${YELLOW}⚠ Some functions deployed ($DEPLOYED/${#FUNCTIONS[@]}). $FAILED need manual deployment.${NC}"
else
    echo -e "${RED}❌ CLI deployment failed. Please deploy manually via Dashboard.${NC}"
fi

# Step 3: Test
echo ""
echo -e "${YELLOW}Step 3: Testing Deployment...${NC}"
if [ -f test-deployment.sh ]; then
    ./test-deployment.sh
fi

echo ""
echo -e "${GREEN}=========================================="
echo "Deployment Complete!"
echo "==========================================${NC}"

