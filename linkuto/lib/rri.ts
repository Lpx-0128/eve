export interface RRIScores {
  embeddingSim: number;
  engagementScore: number;
  profileMatch: number;
  feedbackScore: number;
}

/**
 * Computes the Relationship Relevance Index (RRI).
 * Formula: 0.4*embeddingSim + 0.3*engagementScore + 0.2*profileMatch + 0.1*feedbackScore
 * 
 * @param scores The raw scores to compute RRI for
 * @param useMockData If true, replaces missing/zero values with mocked good values for demo purposes
 */
export function computeRRI(scores: RRIScores, useMockData: boolean = false): number {
  let { embeddingSim, engagementScore, profileMatch, feedbackScore } = scores;

  if (useMockData) {
    // For the hackathon demo, mock missing secondary metrics to give a realistic 0.0-1.0 range
    // We only mock if they are exactly 0 (which means they haven't been calculated or gathered yet)
    if (engagementScore === 0) engagementScore = 0.75; // e.g. solid engagement history
    if (profileMatch === 0) profileMatch = 0.85;       // e.g. high keyword match
    if (feedbackScore === 0) feedbackScore = 0.90;     // e.g. positive past feedback
  }

  const rri = 
    (0.4 * embeddingSim) + 
    (0.3 * engagementScore) + 
    (0.2 * profileMatch) + 
    (0.1 * feedbackScore);

  return Math.min(Math.max(rri, 0), 1); // Clamp between 0 and 1
}

/**
 * Returns a confidence level based on the RRI score.
 */
export function determineConfidence(rriScore: number): 'high' | 'medium' | 'low' {
  if (rriScore >= 0.8) return 'high';
  if (rriScore >= 0.6) return 'medium';
  return 'low';
}
