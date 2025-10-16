#!/usr/bin/env node

/**
 * Test script that exactly matches the generateUrlExportRequestBody format
 * from the Design Tokens plugin source code
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load environment variables
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
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

// Load environment
const envVars = loadEnvFile();
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

if (!process.env.FIGMA_GITHUB_TOKEN) {
  console.error('❌ FIGMA_GITHUB_TOKEN not found in .env file');
  process.exit(1);
}

// Simulate the exact generateUrlExportRequestBody function
function generateUrlExportRequestBody(tokens, filename, commitMessage, eventType = 'update-tokens') {
  return {
    event_type: eventType,
    client_payload: {
      tokens: JSON.stringify(tokens), // This is the key - tokens must be stringified JSON
      filename: filename,
      commitMessage: commitMessage
    }
  };
}

// Test with realistic design tokens (matching Figma export format)
const testTokens = {
  colors: {
    primary: {
      default: "#0088fe",
      hover: "#0066cc",
      active: "#004499"
    },
    secondary: {
      default: "#ffffff",
      hover: "#f5f5f5"
    },
    background: {
      default: "#0e121c",
      secondary: "#1a1f2e"
    }
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px"
  },
  typography: {
    fontFamily: {
      primary: "Inter, sans-serif"
    },
    fontSize: {
      sm: "14px",
      md: "16px",
      lg: "18px"
    }
  }
};

async function testExactFormat() {
  console.log('🧪 Testing Exact Plugin Format (generateUrlExportRequestBody)');
  console.log('==========================================================');
  
  // Generate payload exactly as the plugin does
  const payload = generateUrlExportRequestBody(
    testTokens,
    "VideoReady Design System",
    "Update design tokens from Figma plugin",
    "update-tokens"
  );
  
  console.log('📤 Generated Payload:');
  console.log(JSON.stringify(payload, null, 2));
  
  const postData = JSON.stringify(payload);
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/vishu2124/figma_mcp/dispatches',
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.FIGMA_GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Figma-Design-Tokens-Plugin',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  return new Promise((resolve) => {
    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n📊 Response Status: ${res.statusCode}`);
        
        if (res.statusCode === 204) {
          console.log('✅ Success! Repository dispatch triggered');
          console.log('🔍 Check your GitHub Actions tab for the workflow run');
        } else if (res.statusCode === 422) {
          console.log('❌ 422 Error - Unprocessable Entity');
          console.log('This usually means:');
          console.log('1. Event type mismatch');
          console.log('2. Invalid payload format');
          console.log('3. Missing required fields');
          console.log('\nResponse:', data);
        } else if (res.statusCode === 401) {
          console.log('❌ 401 Error - Bad Credentials');
          console.log('Check your token permissions');
          console.log('\nResponse:', data);
        } else {
          console.log('❌ Unexpected error:');
          console.log(data);
        }
        
        resolve(res.statusCode);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      resolve(500);
    });

    req.write(postData);
    req.end();
  });
}

// Test different event types that might be used by the plugin
async function testAllEventTypes() {
  const eventTypes = ['update-tokens', 'design-tokens', 'tokens', 'figma-tokens'];
  
  for (const eventType of eventTypes) {
    console.log(`\n🧪 Testing Event Type: ${eventType}`);
    console.log('================================');
    
    const payload = generateUrlExportRequestBody(
      testTokens,
      "VideoReady Design System",
      `Test with event type: ${eventType}`,
      eventType
    );
    
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/vishu2124/figma_mcp/dispatches',
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.FIGMA_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Figma-Design-Tokens-Plugin',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const status = await new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          console.log(`Status: ${res.statusCode}`);
          if (res.statusCode === 204) {
            console.log('✅ SUCCESS!');
          } else {
            console.log('❌ Failed:', data);
          }
          resolve(res.statusCode);
        });
      });
      req.on('error', (error) => {
        console.error('Request error:', error.message);
        resolve(500);
      });
      req.write(postData);
      req.end();
    });
    
    if (status === 204) {
      console.log(`\n🎉 Working event type found: ${eventType}`);
      break;
    }
  }
}

// Run tests
async function main() {
  console.log('🔍 Testing Exact Plugin Request Format');
  console.log('=====================================\n');
  
  // Test the exact format
  await testExactFormat();
  
  // Test all possible event types
  console.log('\n🔍 Testing All Possible Event Types');
  console.log('===================================');
  await testAllEventTypes();
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check which event type worked above');
  console.log('2. Update your Figma plugin settings to use that event type');
  console.log('3. Ensure your workflow supports that event type');
}

main().catch(console.error);
