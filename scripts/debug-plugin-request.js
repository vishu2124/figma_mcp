#!/usr/bin/env node

/**
 * Debug script to test what the Figma plugin is sending
 * This helps identify the exact format and content
 */

const https = require('https');

// Load environment variables
const fs = require('fs');
const path = require('path');

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

// Test different payload formats that the plugin might send
const testPayloads = [
  {
    name: "Standard Format",
    payload: {
      event_type: "update-tokens",
      client_payload: {
        tokens: JSON.stringify({
          colors: { primary: "#0088fe" },
          spacing: { small: "8px" }
        }),
        filename: "Test Design Tokens",
        commitMessage: "Test commit from debug script"
      }
    }
  },
  {
    name: "Alternative Format",
    payload: {
      event_type: "design-tokens",
      client_payload: {
        tokens: JSON.stringify({
          colors: { primary: "#0088fe" },
          spacing: { small: "8px" }
        }),
        filename: "Test Design Tokens",
        commitMessage: "Test commit from debug script"
      }
    }
  },
  {
    name: "Minimal Format",
    payload: {
      event_type: "tokens",
      client_payload: {
        tokens: "{}",
        filename: "Test",
        commitMessage: "Test"
      }
    }
  }
];

async function testPayload(payload, name) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(payload);
    const options = {
      hostname: 'api.github.com',
      port: 443,
      path: '/repos/vishu2124/figma_mcp/dispatches',
      method: 'POST',
      headers: {
        'Authorization': `token ${process.env.FIGMA_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'Figma-Design-Tokens-Debug',
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📤 Payload: ${JSON.stringify(payload, null, 2)}`);

    const req = https.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📊 Response Status: ${res.statusCode}`);
        
        if (res.statusCode === 204) {
          console.log('✅ Success!');
        } else {
          console.log('❌ Error:');
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

async function runTests() {
  console.log('🔍 Debugging Figma Plugin Request Format');
  console.log('=====================================');
  
  for (const test of testPayloads) {
    const status = await testPayload(test.payload, test.name);
    
    if (status === 204) {
      console.log(`\n🎉 Found working format: ${test.name}`);
      break;
    }
  }
  
  console.log('\n📋 Next Steps:');
  console.log('1. Check which format worked above');
  console.log('2. Update your Figma plugin settings accordingly');
  console.log('3. Test the actual plugin export');
}

runTests().catch(console.error);
