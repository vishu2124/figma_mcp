#!/bin/bash

# Load environment variables from .env file and run tests
# Usage: ./scripts/load-env-and-test.sh

set -e

echo "🔧 Loading environment variables from .env file..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please create one from env.example"
    echo "Run: cp env.example .env"
    echo "Then edit .env with your actual token"
    exit 1
fi

# Load environment variables from .env file
export $(grep -v '^#' .env | xargs)

echo "✅ Environment variables loaded from .env"

# Check if token is set
if [ -z "$FIGMA_GITHUB_TOKEN" ]; then
    echo "❌ FIGMA_GITHUB_TOKEN not found in .env file"
    echo "Please edit .env and add your GitHub Personal Access Token:"
    echo "FIGMA_GITHUB_TOKEN=ghp_your_token_here"
    exit 1
fi

echo "✅ FIGMA_GITHUB_TOKEN loaded: ${FIGMA_GITHUB_TOKEN:0:10}..."

# Run the quick test
echo "🧪 Running tests..."
./scripts/quick-test.sh
