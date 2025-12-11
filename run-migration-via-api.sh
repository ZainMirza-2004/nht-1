#!/bin/bash

# Attempt to run migration via Supabase Management API
# Falls back to manual instructions if API method fails

PROJECT_REF="cfxdtuwfeuvwpasbwpte"
MIGRATION_FILE="run-migration-directly.sql"

echo "Attempting to run migration via Supabase API..."
echo ""

# Get access token (requires user to be logged in)
ACCESS_TOKEN=$(npx supabase projects api-keys --project-ref $PROJECT_REF 2>/dev/null | grep "service_role" | awk '{print $NF}' | head -1)

if [ -z "$ACCESS_TOKEN" ]; then
    echo "Could not get access token automatically."
    echo ""
    echo "Please run the migration manually:"
    echo "1. Go to: https://app.supabase.com/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: $MIGRATION_FILE"
    echo "3. Paste and click 'Run'"
    exit 1
fi

# Read SQL file
SQL_CONTENT=$(cat "$MIGRATION_FILE")

# Try to execute via Management API
echo "Executing migration..."
RESPONSE=$(curl -s -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"query\": $(echo "$SQL_CONTENT" | jq -Rs .)}" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/database/query" 2>&1)

if echo "$RESPONSE" | grep -q "error\|Error\|ERROR"; then
    echo "API execution failed. Please run manually:"
    echo "1. Go to: https://app.supabase.com/project/$PROJECT_REF/sql/new"
    echo "2. Copy contents of: $MIGRATION_FILE"
    echo "3. Paste and click 'Run'"
    exit 1
else
    echo "✅ Migration executed successfully!"
    echo "$RESPONSE"
fi

