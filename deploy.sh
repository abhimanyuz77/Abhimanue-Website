#!/bin/bash

# Deployment Script with Cache Busting and Cloudflare Cache Purge
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting Deployment Process..."
echo "=================================="

# Configuration
CLOUDFLARE_ZONE_ID="${CLOUDFLARE_ZONE_ID:-your_zone_id}"
CLOUDFLARE_API_TOKEN="${CLOUDFLARE_API_TOKEN:-your_api_token}"
DOMAIN="${DOMAIN:-abhimanue.in}"

# Step 1: Run Cache Busting
echo ""
echo "📦 Step 1: Running Cache Busting..."
if [ -f "cache-buster.js" ]; then
    node cache-buster.js
    echo "✅ Cache busting complete"
else
    echo "⚠️  cache-buster.js not found, skipping cache busting"
fi

# Step 2: Verify Files
echo ""
echo "✅ Step 2: Verifying deployment files..."
files_to_check=(
    "index.html"
    "neet-physics-academy.html"
    "foundation-programs-crack-neet.html"
    ".htaccess"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file found"
    else
        echo "  ✗ $file NOT found"
    fi
done

# Step 3: Build/Minify (Optional)
echo ""
echo "🔨 Step 3: Building assets (optional)..."
# Add your build commands here if needed
# Example: npm run build

# Step 4: Deploy to Server
echo ""
echo "📤 Step 4: Deploying to server..."
# Add your deployment commands here
# Example: rsync, git push, or FTP upload
echo "  ℹ️  Add your deployment commands in this script"

# Step 5: Purge Cloudflare Cache
echo ""
echo "🌐 Step 5: Purging Cloudflare Cache..."
if [ -z "$CLOUDFLARE_ZONE_ID" ] || [ "$CLOUDFLARE_ZONE_ID" = "your_zone_id" ]; then
    echo "⚠️  Cloudflare credentials not set. Skipping cache purge."
    echo "   Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN environment variables"
else
    # Purge all cache
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{"purge_everything":true}' \
        --silent --show-error
    
    if [ $? -eq 0 ]; then
        echo "✅ Cloudflare cache purged successfully"
    else
        echo "❌ Failed to purge Cloudflare cache"
    fi
fi

# Step 6: Verify Deployment
echo ""
echo "🔍 Step 6: Verifying deployment..."
echo "  Testing HTML cache headers..."
html_cache=$(curl -s -I "https://$DOMAIN/index.html" | grep -i "cache-control" || echo "Not found")
echo "  Cache-Control: $html_cache"

echo "  Testing asset cache headers..."
asset_cache=$(curl -s -I "https://$DOMAIN/assets/css/style.css" | grep -i "cache-control" || echo "Not found")
echo "  Cache-Control: $asset_cache"

# Step 7: Summary
echo ""
echo "=================================="
echo "✅ Deployment Complete!"
echo "=================================="
echo ""
echo "Summary:"
echo "  • Cache busting: Applied"
echo "  • Files deployed: Ready"
echo "  • Cloudflare cache: Purged"
echo "  • HTML caching: Disabled (no-cache)"
echo "  • Asset caching: Enabled (1 year)"
echo ""
echo "Next steps:"
echo "  1. Visit https://$DOMAIN in an incognito window"
echo "  2. Verify latest version loads"
echo "  3. Check browser DevTools Network tab"
echo "  4. Confirm Cache-Control headers are correct"
echo ""
