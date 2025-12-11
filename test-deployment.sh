#!/bin/bash

# Test script for backend deployment
# Usage: ./test-deployment.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== Backend Deployment Test Script ===${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Warning: .env file not found. Some tests may fail.${NC}"
    echo "Create .env file with:"
    echo "  VITE_SUPABASE_URL=https://your-project.supabase.co"
    echo "  VITE_SUPABASE_ANON_KEY=your-anon-key"
    echo ""
fi

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check required variables
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_URL not set${NC}"
    exit 1
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo -e "${RED}Error: VITE_SUPABASE_ANON_KEY not set${NC}"
    exit 1
fi

SUPABASE_URL="${VITE_SUPABASE_URL}"
ANON_KEY="${VITE_SUPABASE_ANON_KEY}"

# Test date (tomorrow)
TEST_DATE=$(date -v+1d +%Y-%m-%d 2>/dev/null || date -d "+1 day" +%Y-%m-%d)

echo -e "${GREEN}Testing with date: ${TEST_DATE}${NC}\n"

# Test 1: Check Availability
echo -e "${YELLOW}Test 1: Check Availability${NC}"
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/check-availability" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"spa\",
    \"bookingDate\": \"${TEST_DATE}\",
    \"timeSlot\": \"10:00 AM\",
    \"packageType\": \"1 Hour Session\"
  }")

if echo "$RESPONSE" | grep -q '"available"'; then
    echo -e "${GREEN}✓ Availability check passed${NC}"
else
    echo -e "${RED}✗ Availability check failed${NC}"
    echo "Response: $RESPONSE"
fi

# Test 2: Create Booking
echo -e "\n${YELLOW}Test 2: Create Booking${NC}"
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/create-booking" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"spa\",
    \"full_name\": \"Test User $(date +%s)\",
    \"email\": \"test$(date +%s)@example.com\",
    \"phone\": \"1234567890\",
    \"booking_date\": \"${TEST_DATE}\",
    \"time_slot\": \"10:00 AM\",
    \"package_type\": \"1 Hour Session\",
    \"package_price\": 75,
    \"experience_tier\": \"standard\"
  }")

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo -e "${GREEN}✓ Booking creation passed${NC}"
    BOOKING_ID=$(echo "$RESPONSE" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "  Booking ID: $BOOKING_ID"
else
    echo -e "${RED}✗ Booking creation failed${NC}"
    echo "Response: $RESPONSE"
fi

# Test 3: Test Price Validation
echo -e "\n${YELLOW}Test 3: Price Validation (should fail)${NC}"
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/create-booking" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"spa\",
    \"full_name\": \"Test User\",
    \"email\": \"test@example.com\",
    \"phone\": \"1234567890\",
    \"booking_date\": \"${TEST_DATE}\",
    \"time_slot\": \"11:00 AM\",
    \"package_type\": \"1 Hour Session\",
    \"package_price\": 999,
    \"experience_tier\": \"standard\"
  }")

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Price validation working (correctly rejected invalid price)${NC}"
else
    echo -e "${RED}✗ Price validation failed (should have rejected invalid price)${NC}"
    echo "Response: $RESPONSE"
fi

# Test 4: Test Email Validation
echo -e "\n${YELLOW}Test 4: Email Validation (should fail)${NC}"
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/create-booking" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"spa\",
    \"full_name\": \"Test User\",
    \"email\": \"invalid-email\",
    \"phone\": \"1234567890\",
    \"booking_date\": \"${TEST_DATE}\",
    \"time_slot\": \"12:00 PM\",
    \"package_type\": \"1 Hour Session\",
    \"package_price\": 75,
    \"experience_tier\": \"standard\"
  }")

if echo "$RESPONSE" | grep -q '"success":false'; then
    echo -e "${GREEN}✓ Email validation working (correctly rejected invalid email)${NC}"
else
    echo -e "${RED}✗ Email validation failed (should have rejected invalid email)${NC}"
    echo "Response: $RESPONSE"
fi

# Test 5: Get Unavailable Slots
echo -e "\n${YELLOW}Test 5: Get Unavailable Slots${NC}"
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/functions/v1/get-unavailable-slots" \
  -H "Authorization: Bearer ${ANON_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"serviceType\": \"spa\",
    \"bookingDate\": \"${TEST_DATE}\",
    \"allTimeSlots\": [\"9:00 AM\", \"10:00 AM\", \"11:00 AM\", \"12:00 PM\"]
  }")

if echo "$RESPONSE" | grep -q '"unavailableSlots"'; then
    echo -e "${GREEN}✓ Get unavailable slots passed${NC}"
else
    echo -e "${RED}✗ Get unavailable slots failed${NC}"
    echo "Response: $RESPONSE"
fi

echo -e "\n${GREEN}=== Test Summary ===${NC}"
echo "All critical tests completed. Check results above."
echo ""
echo "Next steps:"
echo "1. Check Edge Function logs in Supabase dashboard"
echo "2. Verify emails are being sent (check Resend dashboard)"
echo "3. Test concurrent bookings manually"
echo "4. Monitor for any errors"

