# Cache Busting & Deployment Setup Guide

This document explains how to implement automatic cache busting and ensure users always receive the latest version of your website.

## Overview

The setup includes:
1. **Server-side cache control** via `.htaccess`
2. **Automatic asset versioning** via `cache-buster.js`
3. **Client-side version checking** via `cache-buster-client.js`
4. **Cloudflare configuration** for optimal CDN caching
5. **Deployment automation** via `deploy.sh`

---

## File Structure

```
Abhimanue-Website/
├── .htaccess                          # Server cache headers
├── cache-buster.js                    # Node.js script for versioning assets
├── deploy.sh                          # Deployment automation script
├── cloudflare-config.json             # Cloudflare cache rules
├── CACHE_BUSTING_SETUP.md            # This file
├── index.html                         # Main page (with cache-buster-client.js)
├── neet-physics-academy.html          # NEET page (with cache-buster-client.js)
├── foundation-programs-crack-neet.html # Foundation page (with cache-buster-client.js)
└── assets/
    ├── css/
    │   ├── style.css                  # Will be versioned to style.a82jf.css
    │   └── academy.css
    ├── js/
    │   ├── main.js                    # Will be versioned to main.83hf72.js
    │   ├── cache-buster-client.js     # Client-side cache checker
    │   └── academy.js
    └── img/
        └── [images]
```

---

## Setup Instructions

### Step 1: Verify .htaccess is in Place

The `.htaccess` file should be in your root directory. It contains:

```apache
# NO CACHE for HTML files
<FilesMatch "\.html?$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires "0"
</FilesMatch>

# AGGRESSIVE CACHE for versioned assets
<FilesMatch "\.[a-f0-9]{8,}\.(js|css)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
</FilesMatch>

# LONG CACHE for static assets
<FilesMatch "\.(jpg|jpeg|png|gif|svg|woff|woff2)$">
    Header set Cache-Control "public, max-age=31536000"
</FilesMatch>
```

**Verify it's working:**
```bash
curl -I https://abhimanue.in/index.html | grep Cache-Control
# Should show: Cache-Control: no-cache, no-store, must-revalidate
```

### Step 2: Install Node.js Dependencies (if needed)

The `cache-buster.js` uses only Node.js built-in modules, so no npm install needed.

### Step 3: Add Cache-Buster Script to HTML Files

All HTML files should include:

```html
<head>
  <!-- ... other meta tags ... -->
  <meta name="site-version" content="cache-buster-enabled">
  <!-- ... stylesheets ... -->
  <script src="assets/js/cache-buster-client.js"></script>
</head>
```

**Already added to:**
- ✅ neet-physics-academy.html
- ⏳ index.html (add if not present)
- ⏳ foundation-programs-crack-neet.html (add if not present)

### Step 4: Configure Cloudflare (Optional but Recommended)

1. Go to Cloudflare Dashboard
2. Select your domain (abhimanue.in)
3. Go to **Caching > Cache Rules**
4. Add rules from `cloudflare-config.json`:

**Rule 1: Bypass cache for HTML**
- URL Pattern: `*.html`
- Cache Level: Bypass
- Browser Cache TTL: 0

**Rule 2: Cache versioned assets for 1 year**
- URL Pattern: `*.*.css` and `*.*.js`
- Cache Level: Cache Everything
- Browser Cache TTL: 1 year

**Rule 3: Cache images for 1 year**
- URL Pattern: `*.{jpg,jpeg,png,gif,svg,webp}`
- Cache Level: Cache Everything
- Browser Cache TTL: 1 year

### Step 5: Set Cloudflare API Credentials (for auto-purge)

```bash
export CLOUDFLARE_ZONE_ID="your_zone_id"
export CLOUDFLARE_API_TOKEN="your_api_token"
```

Get these from:
- Zone ID: Cloudflare Dashboard → Overview → Zone ID
- API Token: Cloudflare Dashboard → My Profile → API Tokens → Create Token

---

## Deployment Process

### Manual Deployment

```bash
# 1. Run cache busting
node cache-buster.js

# 2. Deploy files to server
# (use your preferred method: rsync, git, FTP, etc.)

# 3. Purge Cloudflare cache (optional)
curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything":true}'
```

### Automated Deployment

```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

The script will:
1. ✅ Run cache busting
2. ✅ Verify files
3. ✅ Deploy to server
4. ✅ Purge Cloudflare cache
5. ✅ Verify cache headers

---

## How It Works

### User Flow

```
User visits site
    ↓
Browser loads index.html (no-cache)
    ↓
cache-buster-client.js runs
    ↓
Checks stored version vs current version
    ↓
If different:
  - Clears service worker cache
  - Reloads page with cache bypass
    ↓
Browser loads versioned assets (style.a82jf.css, main.83hf72.js)
    ↓
Assets cached for 1 year (immutable)
    ↓
User sees latest version
```

### Cache Behavior

| File Type | Cache Duration | Behavior |
|-----------|----------------|----------|
| HTML files | 0 seconds | Always fresh, never cached |
| Versioned CSS/JS | 1 year | Cached forever (immutable) |
| Images | 1 year | Cached forever |
| Fonts | 1 year | Cached forever |
| Non-versioned CSS/JS | 1 hour | Moderate cache (fallback) |

---

## Verification

### Test 1: HTML Cache Headers

```bash
curl -I https://abhimanue.in/index.html
```

Expected output:
```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

### Test 2: Asset Cache Headers

```bash
curl -I https://abhimanue.in/assets/css/style.a82jf.css
```

Expected output:
```
Cache-Control: public, max-age=31536000, immutable
```

### Test 3: Browser DevTools

1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Check Response Headers for each file
5. Verify Cache-Control headers match expectations

### Test 4: Real-World Test

1. **First visit:** Open site in incognito window
2. **Deploy update:** Run `node cache-buster.js` and deploy
3. **Second visit:** Open site again (same incognito window)
4. **Verify:** Should see latest version without hard refresh

---

## Debugging

### Enable Client-Side Logging

The cache-buster-client.js logs to console. Check:

```javascript
// In browser console
window.cacheBuster.log('Test message', 'success');
window.cacheBuster.getCurrentVersion();
window.cacheBuster.getStoredVersion();
window.cacheBuster.verifyCacheHeaders();
```

### Check LocalStorage

```javascript
// In browser console
localStorage.getItem('abhimanue_site_version');
```

### Force Clear Cache

```javascript
// In browser console
localStorage.clear();
location.reload();
```

---

## Troubleshooting

### Issue: Users still see old version

**Solution:**
1. Verify `.htaccess` is in root directory
2. Check server has `mod_headers` enabled
3. Purge Cloudflare cache
4. Ask users to clear browser cache

### Issue: Cache-buster.js not versioning files

**Solution:**
1. Verify Node.js is installed: `node --version`
2. Check file paths in script match your structure
3. Ensure CSS/JS files exist in `assets/css` and `assets/js`
4. Run with verbose logging: `node cache-buster.js 2>&1`

### Issue: Cloudflare cache not purging

**Solution:**
1. Verify API credentials are correct
2. Check Zone ID matches your domain
3. Ensure API token has cache purge permission
4. Test API manually: `curl -X POST ... --verbose`

---

## Best Practices

1. **Always run cache-buster before deployment**
   ```bash
   node cache-buster.js && deploy
   ```

2. **Use versioned filenames in production**
   - ✅ Good: `style.a82jf.css`
   - ❌ Bad: `style.css?v=123`

3. **Never cache HTML files**
   - HTML must always be fresh
   - Users should never need Ctrl+F5

4. **Cache assets aggressively**
   - Versioned assets can be cached for 1 year
   - Reduces server load and improves performance

5. **Monitor cache headers**
   - Regularly verify cache headers are correct
   - Use DevTools Network tab to check

6. **Test before going live**
   - Test in incognito window
   - Test on different browsers
   - Test on different devices

---

## Performance Impact

### Before Cache Busting
- Users might see stale content
- Need Ctrl+F5 to refresh
- No aggressive caching possible
- Higher server load

### After Cache Busting
- Users always see latest content
- Automatic updates without hard refresh
- Aggressive caching of assets
- Reduced server load
- Faster page loads for returning users

**Expected improvements:**
- ⚡ 50-70% faster for returning users
- 📉 30-40% reduction in server bandwidth
- 🚀 Better Core Web Vitals scores

---

## Maintenance

### Monthly Tasks
- [ ] Verify cache headers are correct
- [ ] Check Cloudflare cache hit ratio
- [ ] Monitor server error logs

### Per Deployment
- [ ] Run `node cache-buster.js`
- [ ] Deploy files
- [ ] Purge Cloudflare cache
- [ ] Verify in browser (incognito)

### Quarterly Tasks
- [ ] Review cache strategy
- [ ] Update Cloudflare rules if needed
- [ ] Audit asset sizes
- [ ] Check Core Web Vitals

---

## Support & References

- [MDN: HTTP Caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching)
- [Cloudflare: Cache Rules](https://developers.cloudflare.com/cache/about/cache-rules/)
- [Apache: mod_headers](https://httpd.apache.org/docs/current/mod/mod_headers.html)
- [Web.dev: Cache-Control](https://web.dev/http-cache/)

---

## Questions?

For issues or questions:
1. Check browser DevTools Network tab
2. Review console logs
3. Verify .htaccess is in place
4. Check Cloudflare cache rules
5. Test with `curl -I` command

---

**Last Updated:** May 13, 2026
**Version:** 1.0
