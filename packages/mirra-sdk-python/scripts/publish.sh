#!/bin/bash

# Publishing script for mirra-sdk (Python)
# Usage: ./scripts/publish.sh [--test] [--dry-run]

set -e

echo "🚀 Publishing mirra-sdk to PyPI"
echo "================================"

# Check if we're in the right directory
if [ ! -f "setup.py" ]; then
    echo "❌ Error: setup.py not found. Run this script from the mirra-sdk-python directory."
    exit 1
fi

# Check if build and twine are installed
if ! python -m build --version &> /dev/null; then
    echo "❌ Error: 'build' is not installed. Install it with: pip install build"
    exit 1
fi

if ! python -m twine --version &> /dev/null; then
    echo "❌ Error: 'twine' is not installed. Install it with: pip install twine"
    exit 1
fi

# Parse arguments
USE_TEST_PYPI=false
DRY_RUN=false

for arg in "$@"; do
    case $arg in
        --test)
            USE_TEST_PYPI=true
            ;;
        --dry-run)
            DRY_RUN=true
            ;;
    esac
done

# Clean previous builds
echo ""
echo "🧹 Cleaning previous builds..."
rm -rf dist/ build/ *.egg-info

# Build the package
echo ""
echo "🔨 Building package..."
python -m build

# Verify build output
if [ ! -d "dist" ]; then
    echo "❌ Error: Build failed - dist/ directory not found"
    exit 1
fi

echo "✓ Build successful"

# Check the distribution
echo ""
echo "🔍 Checking distribution..."
python -m twine check dist/*

# Show what will be published
echo ""
echo "📋 Files to be published:"
ls -lh dist/

# Check if this is a dry run
if [ "$DRY_RUN" = true ]; then
    echo ""
    echo "🏃 Dry run complete. No files were published."
    echo "   Remove --dry-run flag to actually publish."
    exit 0
fi

# Determine repository
if [ "$USE_TEST_PYPI" = true ]; then
    REPO="testpypi"
    REPO_URL="https://test.pypi.org/legacy/"
    INSTALL_URL="https://test.pypi.org/simple/"
    echo ""
    echo "📍 Publishing to TestPyPI (test repository)"
else
    REPO="pypi"
    REPO_URL="https://upload.pypi.org/legacy/"
    INSTALL_URL="https://pypi.org/simple/"
    echo ""
    echo "📍 Publishing to PyPI (production repository)"
fi

# Confirm publication
echo ""
read -p "🤔 Do you want to publish to $REPO? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Publication cancelled"
    exit 1
fi

# Publish
echo ""
echo "📤 Publishing to $REPO..."

if [ "$USE_TEST_PYPI" = true ]; then
    python -m twine upload --repository testpypi dist/*
else
    python -m twine upload dist/*
fi

# Get the published version
VERSION=$(python -c "import sys; sys.path.insert(0, 'src'); from mirra import __version__; print(__version__)")

echo ""
echo "✅ Successfully published mirra-sdk@$VERSION to $REPO"
echo ""

if [ "$USE_TEST_PYPI" = true ]; then
    echo "🔗 View on TestPyPI: https://test.pypi.org/project/mirra-sdk/"
    echo ""
    echo "📥 Install with: pip install --index-url $INSTALL_URL mirra-sdk"
else
    echo "🔗 View on PyPI: https://pypi.org/project/mirra-sdk/"
    echo ""
    echo "📥 Install with: pip install mirra-sdk"
fi

