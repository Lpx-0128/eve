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
    console.log(`[Firecrawl] Starting deep crawl for: ${url}`);
    
    // Using .crawl() as requested to traverse the site thoroughly.
    // Note: This is an asynchronous-style blocking call in the SDK and will take minutes for larger limits.
    const crawlResponse = await app.crawl(url, {
      limit: 20,
      scrapeOptions: {
        formats: ['markdown'],
      }
    });

    if (crawlResponse.status !== 'completed') {
      throw new Error(`Failed to crawl: Job status is ${crawlResponse.status}`);
    }

    const documents = crawlResponse.data || [];
    const combinedMarkdown = documents
      .map(doc => `--- ${doc.metadata?.url || 'Page'} ---\n${doc.markdown || ''}`)
      .join('\n\n');

    return {
      url,
      markdown: combinedMarkdown.substring(0, 30000)
    };
  } catch (error) {
    console.error('Crawl error:', error);
    throw new Error('Failed to crawl startup website.');
  }
}

/**
 * Perform a web search using Firecrawl to find recent interactions or news about the CEO.
 */
export async function searchFirecrawl(query: string) {
  try {
    const results = await app.search(query, {
      limit: 8,
      scrapeOptions: { formats: ['markdown'] }
    });

    // Based on runtime check, results are in the 'web' property
    const webResults = (results as any).web || [];
    
    // Truncate markdown for each result to prevent token blowout
    return webResults.map((r: any) => ({
      ...r,
      markdown: r.markdown ? r.markdown.substring(0, 5000) : ''
    }));
  } catch (error) {
    console.error('Search error:', error);
    return []; // Return empty instead of throwing to prevent breaking the whole pipeline
  }
}
