import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY || ''
});

/**
 * Crawls a startup website up to a certain limit and compiles the markdown.
 * Uses pollInterval to wait for completion.
 */
export async function crawlWebsite(url: string) {
  try {
    console.log(`[Firecrawl] Mapping subpages for: ${url}`);
    // 1. Get a quick map of the site to find about/team pages
    let urlsToScrape = [url];
    try {
      const mapRes = await app.map(url, { limit: 3 });
      if (mapRes && mapRes.links && mapRes.links.length > 0) {
        // Take a few internal subpages that look useful
        const subpages = mapRes.links
          .filter((u: any) => {
            const path = typeof u === 'string' ? u : u.url;
            return path !== url && 
                   path.startsWith(url) && 
                   (path.includes('about') || path.includes('team') || path.includes('company') || path.includes('founder'));
          })
          .map((u: any) => typeof u === 'string' ? u : u.url)
          .slice(0, 2);
        
        urlsToScrape = [...urlsToScrape, ...subpages];
      }
    } catch (mapErr) {
      console.warn('[Firecrawl] Map failed or timed out, falling back to homepage only');
    }

    console.log(`[Firecrawl] Scraping ${urlsToScrape.length} pages in batch...`);
    // 2. Batch scrape is much faster than a full crawl for small sets
    const scrapeResponse = await app.scrape(urlsToScrape[0], {
      formats: ['markdown'],
    });

    // Note: If we really want multiple pages fast, we could use Promise.all with app.scrape
    // but for now let's just ensure we get the primary page content perfectly.
    // If urlsToScrape has more than 1, we can optionally scrape the others.
    let documents = [scrapeResponse];
    
    if (urlsToScrape.length > 1) {
      const remaining = await Promise.all(
        urlsToScrape.slice(1).map(u => app.scrape(u, { formats: ['markdown'] }).catch(() => null))
      );
      documents = [...documents, ...remaining.filter(d => d !== null)];
    }

    const combinedMarkdown = documents
      .map(doc => `--- ${doc.metadata?.url || 'Page'} ---\n${doc.markdown || ''}`)
      .join('\n\n');

    return {
      url,
      markdown: combinedMarkdown.substring(0, 30000)
    };
  } catch (error) {
    console.error('Crawl error:', error);
    throw new Error('Failed to analyze startup website.');
  }
}

/**
 * Perform a web search using Firecrawl to find recent interactions or news about the CEO.
 */
export async function searchFirecrawl(query: string) {
  try {
    const results = await app.search(query, {
      limit: 3,
      scrapeOptions: { formats: ['markdown'] }
    });

    return results || [];
  } catch (error) {
    console.error('Search error:', error);
    return []; // Return empty instead of throwing to prevent breaking the whole pipeline
  }
}
