#!/usr/bin/env node

/**
 * Test script that loads environment variables from .env file
 * Usage: node scripts/test-with-env.js
 */

const fs = require('fs');
const path = require('path');

// Simple .env file loader
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    console.log('Please create .env file from env.example:');
    console.log('cp env.example .env');
    console.log('Then edit .env with your actual token');
    process.exit(1);
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  
  return envVars;
}

// Load environment variables
console.log('🔧 Loading environment variables from .env file...');
const envVars = loadEnvFile();

// Set environment variables
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

console.log('✅ Environment variables loaded');

// Check if token is set
if (!process.env.FIGMA_GITHUB_TOKEN) {
  console.error('❌ FIGMA_GITHUB_TOKEN not found in .env file');
  console.log('Please edit .env and add your GitHub Personal Access Token:');
  console.log('FIGMA_GITHUB_TOKEN=ghp_your_token_here');
  process.exit(1);
}

console.log(`✅ FIGMA_GITHUB_TOKEN loaded: ${process.env.FIGMA_GITHUB_TOKEN.substring(0, 10)}...`);

// Now run the test
console.log('🧪 Running repository dispatch test...');

// Import and run the test
require('./test-github-dispatch.js');
