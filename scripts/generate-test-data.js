#!/usr/bin/env node

/**
 * Generate test data for design tokens
 * Usage: node scripts/generate-test-data.js
 */

const fs = require('fs');
const path = require('path');

// Create test design tokens
const testTokens = {
  colors: {
    primary: {
      default: "#0088fe",
      hover: "#0066cc",
      active: "#004499"
    },
    secondary: {
      default: "#ffffff",
      hover: "#f5f5f5",
      active: "#e0e0e0"
    },
    background: {
      default: "#0e121c",
      secondary: "#1a1f2e",
      tertiary: "#252b3d"
    },
    text: {
      primary: "#ffffff",
      secondary: "#b3b3b3",
      disabled: "#666666"
    }
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "16px",
    lg: "24px",
    xl: "32px",
    xxl: "48px"
  },
  typography: {
    fontFamily: {
      primary: "Inter, sans-serif",
      secondary: "Georgia, serif"
    },
    fontSize: {
      xs: "12px",
      sm: "14px",
      md: "16px",
      lg: "18px",
      xl: "24px",
      xxl: "32px"
    },
    fontWeight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700"
    }
  },
  borderRadius: {
    none: "0px",
    sm: "4px",
    md: "8px",
    lg: "12px",
    full: "50%"
  },
  shadows: {
    sm: "0 1px 2px rgba(0, 0, 0, 0.1)",
    md: "0 4px 6px rgba(0, 0, 0, 0.1)",
    lg: "0 10px 15px rgba(0, 0, 0, 0.1)",
    xl: "0 20px 25px rgba(0, 0, 0, 0.1)"
  }
};

// Create directories
const outputDir = path.join(__dirname, '..', 'src', 'tokens', 'figma-export');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Generate different formats
const formats = {
  'design-tokens.json': testTokens,
  'design-tokens-minified.json': testTokens,
  'design-tokens-formatted.json': testTokens
};

console.log('🎨 Generating test design tokens...');

Object.entries(formats).forEach(([filename, data]) => {
  const filePath = path.join(outputDir, filename);
  const content = JSON.stringify(data, null, filename.includes('minified') ? 0 : 2);
  
  fs.writeFileSync(filePath, content);
  console.log(`✅ Created: ${filename}`);
});

// Generate a mock Figma plugin payload
const mockPayload = {
  event_type: "update-tokens",
  client_payload: {
    tokens: JSON.stringify(testTokens),
    filename: "Test Design Tokens",
    commitMessage: "Test commit from script"
  }
};

const payloadPath = path.join(outputDir, 'mock-figma-payload.json');
fs.writeFileSync(payloadPath, JSON.stringify(mockPayload, null, 2));
console.log(`✅ Created: mock-figma-payload.json`);

console.log('\n📁 Test files created in:', outputDir);
console.log('\n🧪 You can now test:');
console.log('1. Run: ./scripts/quick-test.sh');
console.log('2. Run: node scripts/test-github-dispatch.js');
console.log('3. Check GitHub Actions for manual test workflow');
