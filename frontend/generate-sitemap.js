import fs from 'fs';
import path from 'path';

// Handle the Render host variable which might not have the protocol
let baseUrl = process.env.VITE_API_URL || 'blogverse-api-ssvc.onrender.com';
if (baseUrl && !baseUrl.startsWith('http')) {
    baseUrl = `https://${baseUrl}`;
}

const SITEMAP_URL = `${baseUrl}/sitemap.xml`;

async function generateSitemap() {
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[SITEMAP] Attempt ${attempt}: Fetching from ${SITEMAP_URL}...`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      
      const response = await fetch(SITEMAP_URL, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
          throw new Error(`HTTP status: ${response.status}`);
      }
      
      const xml = await response.text();
      
      // Basic validation to ensure it's a full sitemap, not just the fallback
      if (xml.includes('<loc>') && xml.split('<url>').length > 5) {
        const publicDir = path.resolve('public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        
        const publicPath = path.join(publicDir, 'sitemap.xml');
        fs.writeFileSync(publicPath, xml);
        console.log(`[SITEMAP] Successfully saved FULL sitemap (${xml.split('<url>').length - 1} URLs)`);
        return; // Success!
      } else {
        throw new Error('Fetched XML seems incomplete.');
      }
      
    } catch (error) {
      console.error(`[SITEMAP] Attempt ${attempt} failed:`, error.message);
      if (attempt < maxRetries) {
        console.log(`[SITEMAP] Retrying in ${retryDelay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }
  
  console.error('[SITEMAP] All attempts failed. Skipping static generation.');
}

generateSitemap();
