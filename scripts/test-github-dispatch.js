#!/usr/bin/env node

/**
 * Test script for GitHub repository dispatch
 * Uses environment variables for credentials
 * 
 * Usage:
 *   FIGMA_GITHUB_TOKEN=your_token node scripts/test-github-dispatch.js
 */

const https = require('https');

// Configuration
const CONFIG = {
  token: process.env.FIGMA_GITHUB_TOKEN,
  owner: 'vishu2124',
  repo: 'figma_mcp',
  eventType: 'update-tokens'
};

// Validate environment variables
if (!CONFIG.token) {
  console.error('❌ Error: FIGMA_GITHUB_TOKEN environment variable is required');
  console.log('Usage: FIGMA_GITHUB_TOKEN=your_token node scripts/test-github-dispatch.js');
  process.exit(1);
}

// Test payload
const payload = {
  event_type: CONFIG.eventType,
  client_payload: {
    tokens: JSON.stringify({
      colors: {
        primary: '#0088fe',
        secondary: '#ffffff',
        background: '#0e121c'
      },
      spacing: {
        small: '8px',
        medium: '16px',
        large: '24px'
      }
    }),
    filename: 'Test Design Tokens',
    commitMessage: 'Test commit from script'
  }
};

// Make the request
const postData = JSON.stringify(payload);
const options = {
  hostname: 'api.github.com',
  port: 443,
  path: `/repos/${CONFIG.owner}/${CONFIG.repo}/dispatches`,
  method: 'POST',
  headers: {
    'Authorization': `token ${CONFIG.token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Figma-Design-Tokens-Test',
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing GitHub repository dispatch...');
console.log(`📡 URL: https://api.github.com/repos/${CONFIG.owner}/${CONFIG.repo}/dispatches`);
console.log(`🎯 Event Type: ${CONFIG.eventType}`);

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);
    
    if (res.statusCode === 204) {
      console.log('✅ Success! Repository dispatch triggered successfully');
      console.log('🔍 Check your GitHub Actions tab for the workflow run');
    } else {
      console.log('❌ Error occurred:');
      console.log(data);
      
      if (res.statusCode === 401) {
        console.log('\n💡 Troubleshooting:');
        console.log('- Check if your token is valid');
        console.log('- Ensure token has "repo" and "public_repo" permissions');
        console.log('- Verify the token format (should start with "ghp_")');
      } else if (res.statusCode === 422) {
        console.log('\n💡 Troubleshooting:');
        console.log('- Check if the event_type matches your workflow');
        console.log('- Verify the repository name and owner');
        console.log('- Ensure the payload format is correct');
      }
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();
