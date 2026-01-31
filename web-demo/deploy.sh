#!/bin/bash

# Deployment script for WizeGigaLLM Web Demo to Vercel
# This script automates the deployment process from the web-demo directory

set -e  # Exit on error

echo "🚀 Starting deployment process for WizeGigaLLM Web Demo..."
echo ""

# Check if we're in the web-demo directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the web-demo directory."
    exit 1
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found."
    echo "   Make sure to configure environment variables in Vercel Dashboard:"
    echo "   - GIGACHAT_CREDENTIALS"
    echo "   - GIGACHAT_BASE_URL"
    echo "   - GIGACHAT_VERIFY_SSL_CERTS"
    echo ""
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run linting
echo "🔍 Running linter..."
npm run lint || echo "⚠️  Linting warnings found (non-blocking)"

# Build the project
echo "🏗️  Building project..."
npm run build

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "NOTE: If using GitHub integration, make sure to set:"
echo "      Root Directory: web-demo"
echo "      in your Vercel project settings!"
echo ""
vercel --prod

echo "✅ Deployment complete!"
echo ""
echo "📝 Next steps:"
echo "   1. If using GitHub integration, verify Root Directory is set to 'web-demo'"
echo "   2. Visit your Vercel Dashboard to configure environment variables"
echo "   3. Test your deployment at https://your-url.vercel.app/test"
echo "   4. Share your demo URL!"
