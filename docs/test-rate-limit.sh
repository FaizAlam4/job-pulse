#!/bin/bash

# 🧪 Rate Limiting Test Script
# This script tests if rate limiting is working correctly

set -e

API_URL="${1:-http://localhost:3000}"
TEST_COUNT=105  # Make 105 requests to exceed 100-request limit

echo "🧪 Rate Limiting Test"
echo "===================="
echo ""
echo "API URL: $API_URL"
echo "Testing with: $TEST_COUNT requests"
echo "Rate limit: 100 requests per 15 minutes"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
success_count=0
rate_limited_count=0
error_count=0

echo "Starting tests..."
echo ""

# Make requests
for i in $(seq 1 $TEST_COUNT); do
  response=$(curl -s -w "\n%{http_code}" "$API_URL/health")
  
  http_code=$(echo "$response" | tail -1)
  body=$(echo "$response" | head -n-1)
  
  # Check response code
  if [ "$http_code" = "200" ]; then
    success_count=$((success_count + 1))
    
    # Print every 10th success
    if [ $((i % 10)) -eq 0 ]; then
      printf "${GREEN}✓${NC} Request $i: HTTP $http_code (Success)\n"
    fi
  elif [ "$http_code" = "429" ]; then
    rate_limited_count=$((rate_limited_count + 1))
    printf "${RED}✗${NC} Request $i: HTTP $http_code (Rate Limited)\n"
  else
    error_count=$((error_count + 1))
    printf "${YELLOW}⚠${NC} Request $i: HTTP $http_code (Error)\n"
  fi
done

echo ""
echo "===================="
echo "📊 Test Results"
echo "===================="
echo ""
printf "✅ Successful (200): ${GREEN}$success_count${NC}\n"
printf "❌ Rate Limited (429): ${RED}$rate_limited_count${NC}\n"
printf "⚠️  Errors (other): ${YELLOW}$error_count${NC}\n"
echo ""

# Analysis
echo "📈 Analysis:"
echo ""

if [ $success_count -ge 100 ] && [ $rate_limited_count -gt 0 ]; then
  echo -e "${GREEN}✅ SUCCESS!${NC}"
  echo "Rate limiting is working correctly!"
  echo ""
  echo "What happened:"
  echo "  • Requests 1-100: ✅ Allowed (HTTP 200)"
  echo "  • Requests 101+: ❌ Blocked (HTTP 429)"
  echo ""
  echo "This means your API is protected from:"
  echo "  🛡️ DDoS attacks"
  echo "  🛡️ Bot spam"
  echo "  🛡️ Accidental abuse"
  echo ""
  exit 0
elif [ $success_count -eq $TEST_COUNT ] && [ $rate_limited_count -eq 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING${NC}"
  echo "Rate limiting may not be enabled!"
  echo ""
  echo "All $TEST_COUNT requests were allowed."
  echo "Expected: First 100 allowed, rest blocked."
  echo ""
  echo "Please check:"
  echo "  1. npm install (install @fastify/rate-limit)"
  echo "  2. npm run dev (restart server)"
  echo "  3. Check server logs for rate limit plugin message"
  echo ""
  exit 1
else
  echo -e "${YELLOW}⚠️  UNCERTAIN${NC}"
  echo "Unexpected results. Please check:"
  echo "  • Server is running"
  echo "  • Correct API URL: $API_URL"
  echo "  • Rate limit plugin is registered"
  echo ""
  exit 1
fi
