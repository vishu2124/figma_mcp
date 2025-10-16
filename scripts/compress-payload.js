#!/usr/bin/env node

/**
 * Compress large design tokens payload for GitHub repository dispatch
 * This script compresses the payload and tests different approaches
 */

const fs = require('fs');
const zlib = require('zlib');
const https = require('https');

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

const path = require('path');

// Load environment
const envVars = loadEnvFile();
Object.entries(envVars).forEach(([key, value]) => {
  process.env[key] = value;
});

if (!process.env.FIGMA_GITHUB_TOKEN) {
  console.error('❌ FIGMA_GITHUB_TOKEN not found in .env file');
  process.exit(1);
}

// Read the large payload
const payload = JSON.parse(fs.readFileSync('payload.json', 'utf8'));
const originalSize = JSON.stringify(payload).length;

console.log('🔍 Analyzing Large Payload');
console.log('==========================');
console.log(`📦 Original size: ${originalSize} bytes (${(originalSize/1024).toFixed(1)}KB)`);
console.log(`📊 GitHub limit: ~20KB`);
console.log(`⚠️  Excess: ${(originalSize - 20000)} bytes over limit`);

// Strategy 1: Compress the tokens string
function compressTokens(payload) {
  const compressed = { ...payload };
  if (compressed.client_payload && compressed.client_payload.tokens) {
    const tokensString = compressed.client_payload.tokens;
    const compressedTokens = zlib.gzipSync(tokensString).toString('base64');
    compressed.client_payload.tokens = compressedTokens;
    compressed.client_payload.compressed = true;
  }
  return compressed;
}

// Strategy 2: Split into multiple smaller payloads
function splitPayload(payload) {
  const tokens = JSON.parse(payload.client_payload.tokens);
  const chunks = [];
  const chunkSize = 15000; // Keep under 20KB limit
  
  // Split tokens into categories
  const categories = Object.keys(tokens);
  
  for (const category of categories) {
    const categoryPayload = {
      event_type: payload.event_type,
      client_payload: {
        tokens: JSON.stringify({ [category]: tokens[category] }),
        filename: payload.client_payload.filename,
        commitMessage: `${payload.client_payload.commitMessage} - ${category}`,
        category: category,
        totalCategories: categories.length
      }
    };
    
    const size = JSON.stringify(categoryPayload).length;
    if (size < chunkSize) {
      chunks.push(categoryPayload);
    } else {
      // Further split large categories
      const subCategories = Object.keys(tokens[category]);
      for (const subCategory of subCategories) {
        const subPayload = {
          event_type: payload.event_type,
          client_payload: {
            tokens: JSON.stringify({ [category]: { [subCategory]: tokens[category][subCategory] } }),
            filename: payload.client_payload.filename,
            commitMessage: `${payload.client_payload.commitMessage} - ${category}.${subCategory}`,
            category: `${category}.${subCategory}`,
            totalCategories: categories.length
          }
        };
        chunks.push(subPayload);
      }
    }
  }
  
  return chunks;
}

// Strategy 3: Create a minimal payload with file upload
function createMinimalPayload(payload) {
  return {
    event_type: payload.event_type,
    client_payload: {
      filename: payload.client_payload.filename,
      commitMessage: payload.client_payload.commitMessage,
      tokensSize: originalSize,
      uploadMethod: 'file',
      note: 'Large payload - tokens will be uploaded as file'
    }
  };
}

async function testPayload(testPayload, name) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(testPayload);
    const size = Buffer.byteLength(postData);
    
    console.log(`\n🧪 Testing: ${name}`);
    console.log(`📦 Size: ${size} bytes (${(size/1024).toFixed(1)}KB)`);
    
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
        'Content-Length': size
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
          console.log('✅ Success!');
        } else if (res.statusCode === 422) {
          console.log('❌ Still too large');
        } else {
          console.log('❌ Error:', data);
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

async function main() {
  console.log('\n🚀 Testing Compression Strategies');
  console.log('==================================');
  
  // Test 1: Compressed tokens
  const compressed = compressTokens(payload);
  await testPayload(compressed, 'Compressed Tokens');
  
  // Test 2: Minimal payload
  const minimal = createMinimalPayload(payload);
  await testPayload(minimal, 'Minimal Payload');
  
  // Test 3: Split payload (first chunk)
  const chunks = splitPayload(payload);
  if (chunks.length > 0) {
    await testPayload(chunks[0], `Split Payload (1/${chunks.length})`);
  }
  
  console.log('\n📋 Recommendations:');
  console.log('1. Use minimal payload + file upload for large tokens');
  console.log('2. Split tokens into categories and send separately');
  console.log('3. Compress tokens and decompress in workflow');
  console.log('4. Use GitHub file upload API instead of repository dispatch');
}

main().catch(console.error);
