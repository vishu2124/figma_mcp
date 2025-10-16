#!/usr/bin/env node

/**
 * Upload large design tokens directly to GitHub repository
 * This bypasses the repository dispatch size limit
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

// Upload file directly to GitHub repository
async function uploadTokensToGitHub(tokens, filename, commitMessage) {
  const filePath = 'src/tokens/figma-export/design-tokens.json';
  const content = Buffer.from(JSON.stringify(tokens, null, 2)).toString('base64');
  
  const payload = {
    message: commitMessage,
    content: content,
    path: filePath
  };
  
  const postData = JSON.stringify(payload);
  const options = {
    hostname: 'api.github.com',
    port: 443,
    path: '/repos/vishu2124/figma_mcp/contents/' + filePath,
    method: 'PUT',
    headers: {
      'Authorization': `token ${process.env.FIGMA_GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Figma-Design-Tokens-Uploader',
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
        console.log(`📊 Response Status: ${res.statusCode}`);
        
        if (res.statusCode === 200 || res.statusCode === 201) {
          console.log('✅ Success! Tokens uploaded to repository');
          console.log('🔍 Check your repository for the updated file');
        } else {
          console.log('❌ Upload failed:');
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

// Test with large design tokens
const largeTokens = {
  colors: {
    primary: {
      default: "#0088fe",
      hover: "#0066cc",
      active: "#004499",
      disabled: "#b3d9ff"
    },
    secondary: {
      default: "#ffffff",
      hover: "#f5f5f5",
      active: "#e0e0e0",
      disabled: "#f0f0f0"
    },
    background: {
      default: "#0e121c",
      secondary: "#1a1f2e",
      tertiary: "#252b3d",
      overlay: "rgba(0, 0, 0, 0.5)"
    },
    text: {
      primary: "#ffffff",
      secondary: "#b3b3b3",
      disabled: "#666666",
      inverse: "#000000"
    },
    success: {
      default: "#00c851",
      hover: "#00a041",
      active: "#007831"
    },
    warning: {
      default: "#ff8800",
      hover: "#e67700",
      active: "#cc6600"
    },
    error: {
      default: "#ff4444",
      hover: "#e63939",
      active: "#cc2e2e"
    }
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px",
    xxxl: "64px"
  },
  typography: {
    fontFamily: {
      primary: "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
      secondary: "Georgia, serif",
      mono: "Monaco, Consolas, monospace"
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "20px",
      xxl: "24px",
      xxxl: "32px"
    },
    fontWeight: {
      light: "300",
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    },
    lineHeight: {
      tight: "1.2",
      normal: "1.5",
      relaxed: "1.75"
    }
  },
  borderRadius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    xl: "16px",
    full: "50%"
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)",
    inner: "inset 0 2px 4px rgba(0, 0, 0, 0.1)"
  },
  breakpoints: {
    mobile: "320px",
    tablet: "768px",
    desktop: "1024px",
    wide: "1440px"
  }
};

async function main() {
  console.log('🚀 Uploading Large Design Tokens to GitHub');
  console.log('==========================================');
  
  const payloadSize = JSON.stringify(largeTokens).length;
  console.log(`📦 Payload size: ${payloadSize} bytes`);
  
  if (payloadSize > 10000) {
    console.log('⚠️ Large payload detected - using direct file upload');
  }
  
  await uploadTokensToGitHub(
    largeTokens,
    "VideoReady Design System",
    "Upload large design tokens from Figma"
  );
}

main().catch(console.error);
