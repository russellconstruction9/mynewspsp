#!/bin/bash
# Quick deployment script for CustodyX.AI

echo "🚀 Deploying CustodyX.AI to Netlify..."

# Build the application
echo "📦 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed! Check errors above."
    exit 1
fi

echo "✅ Build successful!"

# Check if netlify CLI is installed
if ! command -v netlify &> /dev/null; then
    echo "📦 Installing Netlify CLI..."
    npm install -g netlify-cli
fi

# Login check
echo "🔐 Checking Netlify authentication..."
netlify status

if [ $? -ne 0 ]; then
    echo "🔑 Please login to Netlify..."
    netlify login
fi

# Deploy
echo "🚀 Deploying to production..."
netlify deploy --prod --dir=dist

echo "🎉 Deployment complete!"
echo "📱 Check your site at the URL provided above"
echo "⚙️  Don't forget to set environment variables in Netlify dashboard!"