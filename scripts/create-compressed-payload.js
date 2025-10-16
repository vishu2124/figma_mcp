#!/usr/bin/env node

/**
 * Create a compressed payload for the Figma Design Tokens plugin
 * This script takes the large payload and creates a compressed version
 */

const fs = require('fs');
const zlib = require('zlib');

// Read the original payload
const payload = JSON.parse(fs.readFileSync('payload.json', 'utf8'));

console.log('🔧 Creating Compressed Payload');
console.log('==============================');

// Compress the tokens
const tokensString = payload.client_payload.tokens;
const compressedTokens = zlib.gzipSync(tokensString).toString('base64');

// Create compressed payload
const compressedPayload = {
  event_type: payload.event_type,
  client_payload: {
    tokens: compressedTokens,
    filename: payload.client_payload.filename,
    commitMessage: payload.client_payload.commitMessage,
    compressed: true,
    originalSize: tokensString.length,
    compressedSize: compressedTokens.length
  }
};

// Calculate sizes
const originalSize = JSON.stringify(payload).length;
const compressedSize = JSON.stringify(compressedPayload).length;
const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);

console.log(`📦 Original size: ${originalSize} bytes (${(originalSize/1024).toFixed(1)}KB)`);
console.log(`📦 Compressed size: ${compressedSize} bytes (${(compressedSize/1024).toFixed(1)}KB)`);
console.log(`📊 Compression ratio: ${compressionRatio}%`);
console.log(`✅ Within GitHub limit: ${compressedSize < 20000 ? 'Yes' : 'No'}`);

// Save compressed payload
fs.writeFileSync('payload-compressed.json', JSON.stringify(compressedPayload, null, 2));
console.log('\n💾 Saved compressed payload to: payload-compressed.json');

// Test the compressed payload
console.log('\n🧪 Testing compressed payload...');

const https = require('https');

// Load environment variables
function loadEnvFile() {
  const envPath = require('path').join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found');
    return {};
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

const envVars = loadEnvFile();
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

if (process.env.FIGMA_GITHUB_TOKEN) {
  // Test the compressed payload
  const postData = JSON.stringify(compressedPayload);
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/vishu2124/figma_mcp/dispatches',
    method: 'POST',
    headers: {
      'Authorization': `token ${process.env.FIGMA_GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Figma-Design-Tokens-Compressor',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`📊 Response Status: ${res.statusCode}`);
      
      if (res.statusCode === 204) {
        console.log('✅ Compressed payload sent successfully!');
        console.log('🔍 Check your GitHub Actions tab for the workflow run');
      } else {
        console.log('❌ Error:', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Request error:', error.message);
  });

  req.write(postData);
  req.end();
} else {
  console.log('⚠️ No token found - skipping test');
  console.log('To test: export FIGMA_GITHUB_TOKEN=your_token && node scripts/create-compressed-payload.js');
}
