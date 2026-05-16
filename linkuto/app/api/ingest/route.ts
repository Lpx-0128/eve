import { NextResponse } from 'next/server';
import { crawlWebsite, searchFirecrawl } from '@/lib/scraper';
import { extractCompanyAndCEO, compileFinalProfile } from '@/lib/gemini';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return NextResponse.json(
        { error: 'Valid website URL is required (must start with http)' },
        { status: 400 }
      );
    }

    console.log(`[API] Ingesting startup website: ${url}`);
    
    // 1. Crawl startup website
    console.log(`[API] Starting Firecrawl crawl...`);
    const { markdown } = await crawlWebsite(url);
    
    // 2. Extract basic company info & CEO name
    console.log(`[API] Extracting info with Gemini...`);
    let profileData = await extractCompanyAndCEO(markdown);
    
    let ceoInfo = [];
    
    // 3. If CEO is found, search for recent info
    if (profileData.ceo_name && profileData.ceo_name.trim().length > 0) {
      console.log(`[API] CEO found: ${profileData.ceo_name}. Searching web for interactions...`);
      ceoInfo = await searchFirecrawl(`"${profileData.ceo_name}" "${profileData.name}" recent news interactions`);
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
