#!/bin/bash

# Publishing script for @mirra-messenger/sdk
# Usage: ./scripts/publish.sh [--dry-run]

set -e

echo "🚀 Publishing @mirra-messenger/sdk to npm"
echo "================================"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Run this script from the mirra-sdk-js directory."
    exit 1
fi

# Check if user is logged in to npm
if ! npm whoami &> /dev/null; then
    echo "❌ Error: You are not logged in to npm. Run 'npm login' first."
    exit 1
fi

echo "✓ Logged in as: $(npm whoami)"

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf dist/

# Install dependencies
echo ""
echo "📦 Installing dependencies..."
npm install

# Build the package
echo ""
echo "🔨 Building package..."
npm run build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist/ directory not found"
    exit 1
fi

echo "✓ Build successful"

# Show what will be published
echo ""
echo "📋 Files to be published:"
npm pack --dry-run

# Check if this is a dry run
if [ "$1" == "--dry-run" ]; then
    echo ""
    echo "🏃 Dry run complete. No files were published."
    echo "   Remove --dry-run flag to actually publish."
    exit 0
fi

# Confirm publication
echo ""
read -p "🤔 Do you want to publish to npm? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

# Publish to npm
echo ""
echo "📤 Publishing to npm..."
npm publish --access public

# Get the published version
VERSION=$(node -p "require('./package.json').version")

echo ""
echo "✅ Successfully published @mirra-messenger/sdk@$VERSION"
echo ""
echo "🔗 View on npm: https://www.npmjs.com/package/@mirra-messenger/sdk"
echo ""
echo "📥 Install with: npm install @mirra-messenger/sdk"

