import { GoogleGenerativeAI } from '@google/generative-ai';

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

/**
 * Generates a 768-dimensional float array representing the semantic meaning of the text.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  // Using gemini-embedding-2 as it is the currently available text embedding model
  const model = genai.getGenerativeModel({ model: 'gemini-embedding-2' });
  const result = await model.embedContent(text);
  
  return result.embedding.values;
}

/**
 * Calculates the cosine similarity between two vector arrays.
 * Returns a value between -1.0 and 1.0 (higher means more similar).
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must be of the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
