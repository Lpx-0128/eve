import { NextResponse } from 'next/server';
import { scrapeLinkedIn } from '@/lib/scraper';
import { enrichProfile } from '@/lib/gemini';
import { db } from '@/lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== 'string' || !url.includes('linkedin.com')) {
      return NextResponse.json(
        { error: 'Valid LinkedIn URL is required' },
        { status: 400 }
      );
    }

    console.log(`[API] Ingesting profile: ${url}`);
    
    // 1. Scrape raw data
    console.log(`[API] Starting scraper...`);
    const rawData = await scrapeLinkedIn(url);
    
    // 2. Enrich with Gemini
    console.log(`[API] Enriching with Gemini...`);
    const structuredProfile = await enrichProfile(rawData);
    
    // 3. Save to Firestore
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
