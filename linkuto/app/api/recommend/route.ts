import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { cosineSimilarity } from '@/lib/embeddings';
import { computeRRI, determineConfidence } from '@/lib/rri';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entity_id, type, useMockData = true } = body;

    if (!entity_id) {
      return NextResponse.json({ error: 'entity_id is required' }, { status: 400 });
    }

    // 1. Fetch the source entity
    const sourceDoc = await db.collection('entities').doc(entity_id).get();
    if (!sourceDoc.exists) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    const sourceData = sourceDoc.data()!;
    const sourceEmbedding = sourceData.embedding;

    if (!sourceEmbedding || sourceEmbedding.length === 0) {
      return NextResponse.json({ error: 'Source entity has no embedding generated yet.' }, { status: 400 });
    }

    // 2. Fetch target candidates
    // In a real production app with >10,000 users, this would use Firestore Vector Search.
    // For the hackathon MVP, we fetch candidates of the target type and compute in-memory.
    let query: FirebaseFirestore.Query = db.collection('entities');
    if (type) {
      query = query.where('type', '==', type);
    }
    
    const candidatesSnap = await query.get();
    const candidates = candidatesSnap.docs
      .filter(doc => doc.id !== entity_id) // Exclude self
      .map(doc => ({ id: doc.id, ...(doc.data() as any) }));

    // 3. Compute cosine similarity for all candidates
    const scoredCandidates = candidates
      .filter(c => c.embedding && c.embedding.length > 0)
      .map(candidate => {
        const sim = cosineSimilarity(sourceEmbedding, candidate.embedding);
        return {
          candidate,
          similarity: sim
        };
      })
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10); // Take top 10 for performance

    // 4. Calculate RRI and Generate AI Explanations
    const model = genai.getGenerativeModel({ model: 'gemini-3.1-flash-lite' });
    
    const results = await Promise.all(scoredCandidates.map(async ({ candidate, similarity }) => {
      // Calculate RRI
      const rriScore = computeRRI({
        embeddingSim: similarity,
        engagementScore: 0, // In MVP, this would be fetched from relationships graph
        profileMatch: 0,
        feedbackScore: 0
      }, useMockData);

      // Generate Explanation using Gemini
      // Provide limited context to keep generation fast
      const prompt = `In ONE concise sentence, explain why this candidate is a good match for the source entity.
      Source Entity (Looking for match):
      ${JSON.stringify({ name: sourceData.name || sourceData.headline, expertise: sourceData.expertise, summary: sourceData.summary })}
      
      Candidate Entity (The recommended match):
      ${JSON.stringify({ name: candidate.name || candidate.headline, expertise: candidate.expertise, summary: candidate.summary })}
      
      Return ONLY the explanation sentence. Do not use quotes or introductory phrases.`;

      let explanation = "Strong profile alignment based on semantic matching.";
      try {
        const aiResponse = await model.generateContent(prompt);
        explanation = aiResponse.response.text().trim().replace(/^"|"$/g, '');
      } catch (err) {
        console.warn('Failed to generate AI explanation for candidate', candidate.id, err);
      }

      return {
        id: candidate.id,
        name: candidate.name || candidate.headline,
        type: candidate.type,
        score: Number(rriScore.toFixed(3)),
        confidence: determineConfidence(rriScore),
        explanation,
        rawSimilarity: Number(similarity.toFixed(3)) // useful for debugging
      };
    }));

    // Re-sort by final RRI score
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results });

  } catch (error: any) {
    console.error('[API] Recommend error:', error);
    return NextResponse.json({ error: error.message || 'An error occurred' }, { status: 500 });
  }
}
