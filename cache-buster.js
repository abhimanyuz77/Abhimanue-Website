/**
 * Cache Buster Utility
 * Automatically versions CSS and JS files with build timestamp
 * Run this during build process or deployment
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Configuration
const config = {
  htmlFiles: [
    'index.html',
    'neet-physics-academy.html',
    'foundation-programs-crack-neet.html',
    'about-us.html',
    'contact.html',
    'pricing.html',
    'blog.html',
    'portfolio.html'
  ],
  assetsDir: 'assets',
  buildTimestamp: new Date().getTime(),
  hashLength: 8
};

/**
 * Generate hash for file content
 */
function generateFileHash(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return hash.substring(0, config.hashLength);
  } catch (error) {
    console.error(`Error hashing file ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Create versioned filename with hash
 */
function createVersionedFilename(filePath, hash) {
  const ext = path.extname(filePath);
  const basename = path.basename(filePath, ext);
  const dir = path.dirname(filePath);
  return path.join(dir, `${basename}.${hash}${ext}`);
}

/**
 * Update HTML file references
 */
function updateHtmlReferences(htmlFile, assetMap) {
  try {
    let content = fs.readFileSync(htmlFile, 'utf8');
    let updated = false;

    // Update CSS references
    Object.entries(assetMap.css).forEach(([original, versioned]) => {
      const originalHref = original.replace(/^\.\//, '');
      const versionedHref = versioned.replace(/^\.\//, '');
      
      // Match href="..." or href='...'
      const regex = new RegExp(`href=["']([^"']*${originalHref}[^"']*)["']`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `href="${versionedHref}"`);
        updated = true;
        console.log(`✓ Updated CSS: ${originalHref} → ${versionedHref}`);
      }
    });

    // Update JS references
    Object.entries(assetMap.js).forEach(([original, versioned]) => {
      const originalSrc = original.replace(/^\.\//, '');
      const versionedSrc = versioned.replace(/^\.\//, '');
      
      // Match src="..." or src='...'
      const regex = new RegExp(`src=["']([^"']*${originalSrc}[^"']*)["']`, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, `src="${versionedSrc}"`);
        updated = true;
        console.log(`✓ Updated JS: ${originalSrc} → ${versionedSrc}`);
      }
    });

    if (updated) {
      fs.writeFileSync(htmlFile, content, 'utf8');
      console.log(`✓ Updated ${htmlFile}`);
    }
  } catch (error) {
    console.error(`Error updating ${htmlFile}:`, error.message);
  }
}

/**
 * Main cache busting function
 */
function bustCache() {
  console.log('\n🔄 Starting Cache Busting Process...\n');

  const assetMap = { css: {}, js: {} };

  // Process CSS files
  const cssDir = path.join(config.assetsDir, 'css');
  if (fs.existsSync(cssDir)) {
    fs.readdirSync(cssDir).forEach(file => {
      if (file.endsWith('.css') && !file.includes('.')) {
        const filePath = path.join(cssDir, file);
        const hash = generateFileHash(filePath);
        if (hash) {
          const versionedName = createVersionedFilename(filePath, hash);
          assetMap.css[filePath] = versionedName;
          
          // Rename file
          if (filePath !== versionedName) {
            fs.renameSync(filePath, versionedName);
            console.log(`📦 Versioned CSS: ${file} → ${path.basename(versionedName)}`);
          }
        }
      }
    });
  }

  // Process JS files
  const jsDir = path.join(config.assetsDir, 'js');
  if (fs.existsSync(jsDir)) {
    fs.readdirSync(jsDir).forEach(file => {
      if (file.endsWith('.js') && !file.includes('.')) {
        const filePath = path.join(jsDir, file);
        const hash = generateFileHash(filePath);
        if (hash) {
          const versionedName = createVersionedFilename(filePath, hash);
          assetMap.js[filePath] = versionedName;
          
          // Rename file
          if (filePath !== versionedName) {
            fs.renameSync(filePath, versionedName);
            console.log(`📦 Versioned JS: ${file} → ${path.basename(versionedName)}`);
          }
        }
      }
    });
  }

  // Update HTML files with new asset references
  console.log('\n📝 Updating HTML references...\n');
  config.htmlFiles.forEach(htmlFile => {
    if (fs.existsSync(htmlFile)) {
      updateHtmlReferences(htmlFile, assetMap);
    }
  });

  console.log('\n✅ Cache busting complete!\n');
  console.log('Summary:');
  console.log(`  CSS files versioned: ${Object.keys(assetMap.css).length}`);
  console.log(`  JS files versioned: ${Object.keys(assetMap.js).length}`);
  console.log(`  HTML files updated: ${config.htmlFiles.filter(f => fs.existsSync(f)).length}`);
}

// Run if executed directly
if (require.main === module) {
  bustCache();
}

module.exports = { bustCache, generateFileHash, createVersionedFilename };
