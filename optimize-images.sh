#!/bin/bash
# Image optimization script for icns.ca
# Requires: ImageMagick (convert command)
# Install on Ubuntu/Debian: sudo apt install imagemagick
# Install on macOS: brew install imagemagick

set -e

cd "$(dirname "$0")/images"

echo "Optimizing images..."

# Backup originals
mkdir -p ../images-backup
cp *.png *.jpg ../images-backup/ 2>/dev/null || true

# Optimize hero background (target ~300KB)
if [ -f "space-icns.jpg" ]; then
    echo "Optimizing space-icns.jpg..."
    convert space-icns.jpg -quality 75 -resize "1920x1080>" space-icns-optimized.jpg
    mv space-icns-optimized.jpg space-icns.jpg
fi

# Optimize logos (target ~100KB each)
if [ -f "icns-logo-circle.png" ]; then
    echo "Optimizing icns-logo-circle.png..."
    convert icns-logo-circle.png -resize "500x500>" -quality 85 icns-logo-circle-optimized.png
    mv icns-logo-circle-optimized.png icns-logo-circle.png
fi

if [ -f "icns-logo.png" ]; then
    echo "Optimizing icns-logo.png..."
    convert icns-logo.png -resize "500x500>" -quality 85 icns-logo-optimized.png
    mv icns-logo-optimized.png icns-logo.png
fi

echo ""
echo "Done! Original images backed up to images-backup/"
echo ""
echo "File sizes after optimization:"
ls -lh *.jpg *.png 2>/dev/null | awk '{print $5, $9}'
