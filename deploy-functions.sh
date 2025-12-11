#!/bin/bash

# Script to deploy edge functions
# This will use npx supabase if available, or provide manual instructions

set -e

echo "=========================================="
echo "Edge Functions Deployment"
echo "=========================================="
echo ""

# Check if we can use npx supabase
if command -v npx &> /dev/null; then
    echo "Attempting to deploy via Supabase CLI (npx)..."
    echo ""
    
    # Try to deploy functions
    FUNCTIONS=(
        "create-booking"
        "check-availability"
        "get-unavailable-slots"
        "send-booking-confirmation"
        "send-parking-permit-email"
        "approve-parking-permit"
        "reject-parking-permit"
    )
    
    for func in "${FUNCTIONS[@]}"; do
        if [ -f "supabase/functions/$func/index.ts" ]; then
            echo "Deploying $func..."
            npx supabase functions deploy "$func" --no-verify-jwt 2>&1 || {
                echo "⚠️  CLI deployment failed for $func"
                echo "   You'll need to deploy manually via dashboard"
            }
        fi
    done
else
    echo "npx not available. Please deploy manually via Supabase Dashboard."
    echo ""
fi

echo ""
echo "=========================================="
echo "Manual Deployment Instructions"
echo "=========================================="
echo ""
echo "If CLI deployment didn't work, deploy manually:"
echo ""
echo "1. Go to: https://app.supabase.com → Your Project → Edge Functions"
echo ""
echo "2. For each function, click 'Create Function' or select existing:"
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

for func in "${FUNCTIONS[@]}"; do
    if [ -f "supabase/functions/$func/index.ts" ]; then
        echo "   - $func"
        echo "     File: supabase/functions/$func/index.ts"
    fi
done

echo ""
echo "3. Copy the contents of each index.ts file and paste into the function editor"
echo "4. Click 'Deploy' for each function"
echo ""

