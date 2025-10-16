#!/bin/bash

# Quick Test Script for GitHub Integration
# Usage: ./scripts/quick-test.sh

set -e

echo "🧪 GitHub Integration Quick Test"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if token is set
if [ -z "$FIGMA_GITHUB_TOKEN" ]; then
    echo -e "${RED}❌ Error: FIGMA_GITHUB_TOKEN environment variable not set${NC}"
    echo "Please run: export FIGMA_GITHUB_TOKEN=your_token_here"
    exit 1
fi

echo -e "${GREEN}✅ Token is set${NC}"

# Test 1: Basic GitHub API connection
echo -e "\n${YELLOW}Test 1: GitHub API Connection${NC}"
if curl -s -H "Authorization: token $FIGMA_GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/user > /dev/null; then
    echo -e "${GREEN}✅ GitHub API connection successful${NC}"
else
    echo -e "${RED}❌ GitHub API connection failed${NC}"
    exit 1
fi

# Test 2: Repository access
echo -e "\n${YELLOW}Test 2: Repository Access${NC}"
if curl -s -H "Authorization: token $FIGMA_GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        https://api.github.com/repos/vishu2124/figma_mcp > /dev/null; then
    echo -e "${GREEN}✅ Repository access successful${NC}"
else
    echo -e "${RED}❌ Repository access failed${NC}"
    exit 1
fi

# Test 3: Repository dispatch endpoint
echo -e "\n${YELLOW}Test 3: Repository Dispatch Endpoint${NC}"
RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null \
    -X POST \
    -H "Authorization: token $FIGMA_GITHUB_TOKEN" \
    -H "Accept: application/vnd.github.v3+json" \
    -d '{"event_type":"test-event","client_payload":{"test":"data"}}' \
    https://api.github.com/repos/vishu2124/figma_mcp/dispatches)

if [ "$RESPONSE" = "204" ]; then
    echo -e "${GREEN}✅ Repository dispatch endpoint working${NC}"
elif [ "$RESPONSE" = "401" ]; then
    echo -e "${RED}❌ Authentication failed (401)${NC}"
    echo "Check your token permissions"
    exit 1
elif [ "$RESPONSE" = "422" ]; then
    echo -e "${YELLOW}⚠️  Validation error (422) - this might be normal for test data${NC}"
else
    echo -e "${RED}❌ Unexpected response: $RESPONSE${NC}"
    exit 1
fi

# Test 4: Node.js test script
echo -e "\n${YELLOW}Test 4: Node.js Test Script${NC}"
if command -v node >/dev/null 2>&1; then
    echo "Running Node.js test script..."
    if node scripts/test-github-dispatch.js; then
        echo -e "${GREEN}✅ Node.js test script passed${NC}"
    else
        echo -e "${RED}❌ Node.js test script failed${NC}"
        exit 1
    fi
else
    echo -e "${YELLOW}⚠️  Node.js not found, skipping script test${NC}"
fi

echo -e "\n${GREEN}🎉 All tests passed! Your setup is ready.${NC}"
echo -e "\nNext steps:"
echo "1. Go to GitHub Actions tab in your repository"
echo "2. Run the 'Manual Test Workflow'"
echo "3. Configure the Figma Design Tokens plugin"
echo "4. Test the full integration from Figma"
