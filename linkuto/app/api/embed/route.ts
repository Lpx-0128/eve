import { NextResponse } from 'next/server';
import { generateEmbedding } from '@/lib/embeddings';
import { db } from '@/lib/firebase-admin';

export async function POST() {
  try {
    console.log('[API] Starting batch embedding job...');
    
    // Fetch all entities that don't have an embedding yet
    const snapshot = await db.collection('entities').get();
    
    let processedCount = 0;
    const errors: any[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Skip if it already has an embedding
      if (data.embedding && Array.isArray(data.embedding) && data.embedding.length > 0) {
        continue;
      }

      console.log(`[API] Generating embedding for entity: ${doc.id}`);

      try {
        // Construct the embedding string based on user preference
        const headline = data.headline || '';
        const summary = data.summary || '';
        const expertise = Array.isArray(data.expertise) ? data.expertise.join(', ') : '';

        const embeddingString = `Headline: ${headline}\nExpertise: ${expertise}\nSummary: ${summary}`;

        // Generate vector
        const vector = await generateEmbedding(embeddingString);

        // Update document
        await db.collection('entities').doc(doc.id).update({
          embedding: vector,
          updatedAt: new Date().toISOString()
        });

        processedCount++;
      } catch (err: any) {
        console.error(`[API] Failed to embed doc ${doc.id}:`, err);
        errors.push({ id: doc.id, error: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      processed: processedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error: any) {
    console.error('[API] Batch embed error:', error);
    return NextResponse.json(
      { error: error.message || 'An error occurred during batch embedding' },
      { status: 500 }
    );
  }
}
