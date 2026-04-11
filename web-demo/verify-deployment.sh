#!/bin/bash

# Deployment Verification Script
# This script verifies that the WizeGigaLLM web demo is ready for deployment

set -e

echo "🔍 WizeGigaLLM Deployment Verification Script"
echo "=============================================="
echo ""

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web-demo directory."
    exit 1
fi

# Check Node.js version
echo "📌 Checking Node.js version..."
NODE_VERSION=$(node --version)
echo "   Node.js version: $NODE_VERSION"
if [[ ! "$NODE_VERSION" =~ ^v1[8-9]\. ]] && [[ ! "$NODE_VERSION" =~ ^v2[0-9]\. ]]; then
    echo "⚠️  Warning: Node.js 18.x or higher is recommended"
fi
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install --silent
echo "   ✓ Dependencies installed"
echo ""

# Build the project
echo "🏗️  Building project..."
BUILD_OUTPUT=$(npm run build 2>&1)
echo "$BUILD_OUTPUT" | tail -20

# Check if build was successful
if echo "$BUILD_OUTPUT" | grep -q "✓ Compiled successfully"; then
    echo "   ✓ Build successful"
else
    echo "   ❌ Build failed"
    exit 1
fi
echo ""

# Verify test page is in build output
echo "🧪 Verifying test page..."
if echo "$BUILD_OUTPUT" | grep -q "/test"; then
    echo "   ✓ Test page found in build output"
    
    # Check if test.html exists
    if [ -f ".next/server/app/test.html" ]; then
        TEST_SIZE=$(stat -f%z ".next/server/app/test.html" 2>/dev/null || stat -c%s ".next/server/app/test.html" 2>/dev/null)
        echo "   ✓ test.html generated ($TEST_SIZE bytes)"
    else
        echo "   ❌ test.html not found in build output"
        exit 1
    fi
else
    echo "   ❌ Test page not found in build routes"
    exit 1
fi
echo ""

# Verify all required routes
echo "📍 Verifying all routes..."
REQUIRED_ROUTES=("/" "/chat" "/settings" "/test" "/api/chat" "/api/config")
MISSING_ROUTES=()

for route in "${REQUIRED_ROUTES[@]}"; do
    if echo "$BUILD_OUTPUT" | grep -q "$route"; then
        echo "   ✓ $route"
    else
        echo "   ❌ $route (missing)"
        MISSING_ROUTES+=("$route")
    fi
done

if [ ${#MISSING_ROUTES[@]} -ne 0 ]; then
    echo ""
    echo "   ❌ Missing routes detected!"
    exit 1
fi
echo ""

# Check for required files
echo "📂 Verifying required files..."
REQUIRED_FILES=(
    "src/app/page.tsx"
    "src/app/test/page.tsx"
    "src/app/chat/page.tsx"
    "src/app/settings/page.tsx"
    "src/app/api/chat/route.ts"
    "src/app/api/config/route.ts"
    "src/lib/gigaapi.ts"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "   ✓ $file"
    else
        echo "   ❌ $file (missing)"
        exit 1
    fi
done
echo ""

# Start production server in background
echo "🚀 Testing production server..."
npm start > /tmp/server.log 2>&1 &
SERVER_PID=$!

# Wait for server to start
sleep 5

# Test if server is running
if kill -0 $SERVER_PID 2>/dev/null; then
    echo "   ✓ Production server started (PID: $SERVER_PID)"
    
    # Test test page endpoint
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/test | grep -q "200"; then
        echo "   ✓ /test endpoint accessible (HTTP 200)"
    else
        echo "   ❌ /test endpoint not accessible"
        kill $SERVER_PID 2>/dev/null
        exit 1
    fi
    
    # Stop server
    kill $SERVER_PID 2>/dev/null
    echo "   ✓ Server stopped"
else
    echo "   ❌ Failed to start production server"
    exit 1
fi
echo ""

# Summary
echo "=============================================="
echo "✅ All verification checks passed!"
echo ""
echo "Your application is ready for deployment to Vercel."
echo ""
echo "Next steps:"
echo "1. Deploy to Vercel: vercel --prod"
echo "2. Configure environment variables in Vercel Dashboard"
echo "3. Visit https://your-deployment.vercel.app/test to verify"
echo ""
echo "For detailed deployment instructions, see:"
echo "- DEPLOYMENT.md"
echo "- DEPLOYMENT_VALIDATION.md"
echo ""
