import { chromium } from 'playwright';
import * as cheerio from 'cheerio';

export async function scrapeLinkedIn(url: string) {
  let browser;
  try {
    // Launch headless browser
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Basic evasions
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'en-US,en;q=0.9',
    });

    // Go to LinkedIn URL
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    // Extract HTML
    const html = await page.content();
    await browser.close();
    
    // Parse with Cheerio
    const $ = cheerio.load(html);
    
    const name = $('h1').first().text().trim() || $('.top-card-layout__title').text().trim();
    const headline = $('h2').first().text().trim() || $('.top-card-layout__headline').text().trim();
    const about = $('.core-section-container__content p, .about-section p, section.summary p').text().trim();
    
    // Grab all list items which usually contain experience and education
    const listItems = $('li').map((_, el) => $(el).text().replace(/\s+/g, ' ').trim()).get();
    
    // Fallback: Dump body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 8000); 

    return {
      url,
      name,
      headline,
      about,
      listItems,
      rawTextSummary: bodyText
    };
  } catch (error) {
    if (browser) await browser.close();
    console.error('Scraping error:', error);
    throw new Error('Failed to scrape LinkedIn profile.');
  }
}
