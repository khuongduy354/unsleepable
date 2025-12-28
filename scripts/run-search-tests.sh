#!/bin/bash

# Script to run search tests with automatic Supabase lifecycle management
# Starts Supabase if not running, runs tests, then stops Supabase

set -e  # Exit on error

SUPABASE_WAS_RUNNING=false

# Check if Supabase is already running
if npx supabase status &> /dev/null; then
    echo "Supabase is already running, will keep it running after tests..."
    SUPABASE_WAS_RUNNING=true
else
    echo "Starting Supabase..."
    npx supabase start
fi

# Run the tests and capture exit code
echo "Running search tests..."
npm run test:search:run
TEST_EXIT_CODE=$?

# Stop Supabase only if we started it
if [ "$SUPABASE_WAS_RUNNING" = false ]; then
    echo "Stopping Supabase..."
    npx supabase stop
fi

exit $TEST_EXIT_CODE
