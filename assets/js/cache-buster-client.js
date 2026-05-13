/**
 * Client-Side Cache Buster
 * Ensures users always get the latest version of the website
 * Add this script to the <head> of your HTML files
 */

(function() {
  'use strict';

  // Configuration
  const config = {
    storageKey: 'abhimanue_site_version',
    versionCheckInterval: 60000, // Check every 60 seconds
    enableLogging: true
  };

  /**
   * Log messages (only if logging enabled)
   */
  function log(message, type = 'info') {
    if (config.enableLogging) {
      const timestamp = new Date().toLocaleTimeString();
      const prefix = `[${timestamp}] [Cache Buster]`;
      
      switch(type) {
        case 'success':
          console.log(`%c${prefix} ✅ ${message}`, 'color: green; font-weight: bold;');
          break;
        case 'warning':
          console.log(`%c${prefix} ⚠️  ${message}`, 'color: orange; font-weight: bold;');
          break;
        case 'error':
          console.log(`%c${prefix} ❌ ${message}`, 'color: red; font-weight: bold;');
          break;
        default:
          console.log(`%c${prefix} ℹ️  ${message}`, 'color: blue;');
      }
    }
  }

  /**
   * Get current page version from HTML meta tag or timestamp
   */
  function getCurrentVersion() {
    // Try to get version from meta tag
    const metaTag = document.querySelector('meta[name="site-version"]');
    if (metaTag) {
      return metaTag.getAttribute('content');
    }
    
    // Fallback: use document last modified time
    return new Date(document.lastModified).getTime().toString();
  }

  /**
   * Get stored version from localStorage
   */
  function getStoredVersion() {
    return localStorage.getItem(config.storageKey);
  }

  /**
   * Store current version in localStorage
   */
  function storeVersion(version) {
    localStorage.setItem(config.storageKey, version);
  }

  /**
   * Force page reload with cache bypass
   */
  function forceReload() {
    log('New version detected! Reloading page...', 'warning');
    
    // Clear service worker cache if available
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          caches.delete(cacheName);
        });
      });
    }
    
    // Reload with cache bypass
    window.location.href = window.location.href.split('#')[0] + '?v=' + Date.now();
  }

  /**
   * Check for new version
   */
  function checkForNewVersion() {
    const currentVersion = getCurrentVersion();
    const storedVersion = getStoredVersion();

    if (!storedVersion) {
      // First visit
      storeVersion(currentVersion);
      log('First visit - version stored', 'success');
      return;
    }

    if (currentVersion !== storedVersion) {
      // New version detected
      log(`Version mismatch detected!`, 'warning');
      log(`Stored: ${storedVersion}`, 'warning');
      log(`Current: ${currentVersion}`, 'warning');
      
      storeVersion(currentVersion);
      forceReload();
    } else {
      log('Site is up to date', 'success');
    }
  }

  /**
   * Initialize cache buster
   */
  function init() {
    log('Initializing cache buster...', 'info');
    
    // Check version on page load
    checkForNewVersion();

    // Optional: Periodically check for updates
    // Uncomment to enable background version checking
    // setInterval(checkForNewVersion, config.versionCheckInterval);
  }

  /**
   * Verify cache headers
   */
  function verifyCacheHeaders() {
    // This function helps debug cache issues
    if (!config.enableLogging) return;

    log('Verifying cache headers...', 'info');
    
    // Check HTML cache headers
    fetch(window.location.href, { method: 'HEAD' })
      .then(response => {
        const cacheControl = response.headers.get('cache-control');
        const pragma = response.headers.get('pragma');
        const expires = response.headers.get('expires');
        
        log(`HTML Cache-Control: ${cacheControl}`, 'info');
        log(`HTML Pragma: ${pragma}`, 'info');
        log(`HTML Expires: ${expires}`, 'info');
        
        if (cacheControl && cacheControl.includes('no-cache')) {
          log('HTML cache headers are correct (no-cache)', 'success');
        } else {
          log('HTML cache headers may be incorrect', 'warning');
        }
      })
      .catch(error => {
        log(`Error verifying cache headers: ${error.message}`, 'error');
      });
  }

  /**
   * Add version meta tag if not present
   */
  function ensureVersionMetaTag() {
    if (!document.querySelector('meta[name="site-version"]')) {
      const meta = document.createElement('meta');
      meta.name = 'site-version';
      meta.content = new Date().getTime().toString();
      document.head.appendChild(meta);
      log('Added version meta tag', 'info');
    }
  }

  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Verify cache headers after page load
  window.addEventListener('load', verifyCacheHeaders);

  // Expose functions globally for debugging
  window.cacheBuster = {
    checkForNewVersion,
    forceReload,
    getCurrentVersion,
    getStoredVersion,
    verifyCacheHeaders,
    log
  };

  log('Cache buster loaded and ready', 'success');
})();
