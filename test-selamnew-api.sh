#!/bin/bash

# Test script for SelamNew AI API endpoints
# Base URL
BASE_URL="https://selamnew-ai.ienetworks.co"

echo "=========================================="
echo "Testing SelamNew AI API Endpoints"
echo "=========================================="
echo ""

# Test 1: OKR Generation
echo "1. Testing /okr endpoint..."
echo "Request: {\"objective\": \"Add AI features to SelamNew Workspaces\"}"
echo "---"
curl -X POST "${BASE_URL}/okr" \
  -H "Content-Type: application/json" \
  -d '{"objective": "Add AI features to SelamNew Workspaces"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response parsing failed"
echo ""
echo ""

# Test 2: Weekly Plan
echo "2. Testing /weekly-plan endpoint..."
echo "Request: {\"key_result\": \"Prepare data pipeline for AI MVP\"}"
echo "---"
curl -X POST "${BASE_URL}/weekly-plan" \
  -H "Content-Type: application/json" \
  -d '{"key_result": "Prepare data pipeline for AI MVP"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response parsing failed"
echo ""
echo ""

# Test 3: Daily Plan
echo "3. Testing /daily-plan endpoint..."
echo "Request: {\"weekly_plan\": \"Finalize 20% ETL pipeline\"}"
echo "---"
curl -X POST "${BASE_URL}/daily-plan" \
  -H "Content-Type: application/json" \
  -d '{"weekly_plan": "Finalize 20% ETL pipeline"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response parsing failed"
echo ""
echo ""

# Test 4: Copilot
echo "4. Testing /copilot endpoint..."
echo "Request: {\"query\": \"How to create OKR on SelamNew Workspaces\"}"
echo "---"
curl -X POST "${BASE_URL}/copilot" \
  -H "Content-Type: application/json" \
  -d '{"query": "How to create OKR on SelamNew Workspaces"}' \
  -w "\nStatus: %{http_code}\n" \
  2>/dev/null | jq '.' 2>/dev/null || echo "Response parsing failed"
echo ""
echo ""

echo "=========================================="
echo "Testing Complete"
echo "=========================================="
echo ""
echo "Note: If you see 'Response parsing failed', install jq:"
echo "  Ubuntu/Debian: sudo apt-get install jq"
echo "  macOS: brew install jq"
echo ""

