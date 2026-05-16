import fs from 'fs';
import path from 'path';

// Handle the Render host variable which might not have the protocol
let baseUrl = process.env.VITE_API_URL || 'blogverse-api-ssvc.onrender.com';
if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
}

const SITEMAP_URL = `${baseUrl}/sitemap.xml`;

async function generateSitemap() {
  try {
    console.log(`[SITEMAP] Fetching from ${SITEMAP_URL}...`);
    const response = await fetch(SITEMAP_URL);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const xml = await response.text();
    
    // Ensure public directory exists
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    
    const publicPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(publicPath, xml);
    console.log(`[SITEMAP] Successfully saved to ${publicPath}`);
    
  } catch (error) {
    console.error('[SITEMAP] Error:', error.message);
    
    // Fallback: Create a minimal sitemap if the backend is down during build
    const fallbackXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blogverse.info/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://blogverse.info/stories</loc>
    <priority>0.9</priority>
  </url>
</urlset>`;
    
    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), fallbackXml);
    console.log('[SITEMAP] Created fallback sitemap.');
  }
}

generateSitemap();
