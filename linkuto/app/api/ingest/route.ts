import { NextResponse } from 'next/server';
import { crawlWebsite, searchFirecrawl } from '@/lib/scraper';
import { extractCompanyAndCEO, compileFinalProfile, extractPersonName } from '@/lib/gemini';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { url, userId } = await request.json();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid website URL is required (must start with http)' },
        { status: 400 }
      );
    }

    console.log(`[API] Ingesting startup website: ${url} for user: ${userId || 'anonymous'}`);
    
    // 1. Crawl startup website
    console.log(`[API] Starting Firecrawl crawl...`);
    const { markdown } = await crawlWebsite(url);
    
    // 2. Extract basic company info & CEO name
    console.log(`[API] Extracting info with Gemini...`);
    let profileData = await extractCompanyAndCEO(markdown);
    
    let ceoInfo = [];
    
    // 3. Deep Search for CEO/Founder
    if (!profileData.ceo_name || profileData.ceo_name.trim().length === 0) {
      console.log(`[API] CEO not found on site. Deep searching web for founder...`);
      // Wider search to find the name
      const searchRes = await searchFirecrawl(`founder CEO of ${profileData.name || url} LinkedIn Crunchbase`);
      if (searchRes && searchRes.length > 0) {
        const searchContent = searchRes.map((r: any) => `${r.title}: ${r.description} ${r.markdown || ''}`).join('\n\n');
        const extracted = await extractPersonName(searchContent.substring(0, 10000));
        if (extracted.ceo_name) {
          profileData.ceo_name = extracted.ceo_name;
          console.log(`[API] Leadership identified via deep search: ${profileData.ceo_name}`);
        }
      }
    }

    if (profileData.ceo_name && profileData.ceo_name.trim().length > 0) {
      console.log(`[API] Performing deep research on: ${profileData.ceo_name}...`);
      // Targeted deep search for news, LinkedIn summary, and recent interactions
      const deepSearchQueries = [
        `"${profileData.ceo_name}" ${profileData.name} background founder news`,
        `"${profileData.ceo_name}" LinkedIn profile summary interactions`
      ];
      
      const searchTasks = deepSearchQueries.map(q => searchFirecrawl(q));
      const searchResults = await Promise.all(searchTasks);
      ceoInfo = searchResults.flat();
    }

    // 4. Compile final rich profile
    console.log(`[API] Compiling final profile...`);
    const structuredProfile = await compileFinalProfile(profileData, ceoInfo);
    
    // 5. Save to Firestore
    console.log(`[API] Saving to Firestore...`);
    const entityRef = db.collection('entities').doc();
    
    const entityData = {
      ...structuredProfile,
      sourceUrl: url,
      type: 'Participant', // Default for Phase 1, can be extended later
      userId: userId || null, // Associate with Firebase Auth user
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    await entityRef.set(entityData);

    return NextResponse.json({
      success: true,
      id: entityRef.id,
      data: entityData
    });

  } catch (error: any) {
    console.error('[API] Ingest error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during ingestion' },
      { status: 500 }
    );
  }
}
