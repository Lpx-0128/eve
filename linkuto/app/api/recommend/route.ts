import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { userId, type } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // 1. Fetch source user profile
    const sourceSnapshot = await db.collection("entities").where("userId", "==", userId).get();
    if (sourceSnapshot.empty) {
      return NextResponse.json({ error: "Source profile not found" }, { status: 404 });
    }
    const sourceProfile = sourceSnapshot.docs[0].data();

    // 2. Fetch ecosystem candidates
    // We fetch all entities to score against, filtering out the user themselves
    const candidatesSnapshot = await db.collection("entities").get();
    let candidates = candidatesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => c.userId !== userId);

    // If requested a specific type, try to filter, but if it results in empty (like in a fresh DB),
    // we fallback to showing anyone else in the DB for demo purposes.
    if (type) {
      const typeFiltered = candidates.filter((c: any) => c.type?.toLowerCase() === type.toLowerCase());
      if (typeFiltered.length > 0) {
        candidates = typeFiltered;
      }
    }

    if (candidates.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 3. AI Scoring and Explanation (The RRI Engine)
    // For each candidate, we'll ask Gemini to evaluate the match and provide an explanation.
    // To stay fast, we'll process them in parallel with a simple prompt.
    const model = genai.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const results = await Promise.all(
      candidates.map(async (candidate: any) => {
        try {
          const prompt = `
            You are the AI brain of LINKUTO, a B2B SaaS ecosystem matching platform.
            Evaluate the synergy between this Source Startup and this Candidate ${type || 'Partner'}.
            
            Source Startup:
            Name: ${sourceProfile.name}
            Summary: ${sourceProfile.summary}
            Expertise: ${sourceProfile.expertise?.join(", ")}
            Industry: ${sourceProfile.industry}

            Candidate:
            Name: ${candidate.name}
            Summary: ${candidate.summary}
            Expertise: ${candidate.expertise?.join(", ")}
            Industry: ${candidate.industry}

            Return a valid JSON object EXACTLY like this (no markdown, no extra text):
            {
              "baseScore": <number between 0.0 and 1.0 based on alignment>,
              "explanation": "<one sentence explaining why this is a good or bad match>",
              "confidence": "<high, medium, or low>"
            }
          `;

          const result = await model.generateContent(prompt);
          let responseText = result.response.text().trim();
          
          // Cleanup markdown if AI included it
          if (responseText.startsWith("```json")) {
             responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
          } else if (responseText.startsWith("```")) {
             responseText = responseText.replace(/```/g, "").trim();
          }

          const aiEval = JSON.parse(responseText);

          // 4. Calculate final RRI Score
          // RRI = 0.4 * AI Base Alignment + 0.3 * Engagement + 0.2 * ProfileMatch + 0.1 * Feedback
          // Since it's a new match, Engagement = 0.5, ProfileMatch = baseScore, Feedback = 0.5
          const embeddingSim = aiEval.baseScore || 0.5;
          const rriScore = (0.4 * embeddingSim) + (0.3 * 0.5) + (0.2 * embeddingSim) + (0.1 * 0.5);

          return {
            id: candidate.id,
            candidate,
            score: Number(rriScore.toFixed(2)),
            explanation: aiEval.explanation,
            confidence: aiEval.confidence
          };
        } catch (err) {
          console.error("Failed to score candidate", candidate.name, err);
          return {
            id: candidate.id,
            candidate,
            score: 0.5,
            explanation: "Could not evaluate synergy.",
            confidence: "low"
          };
        }
      })
    );

    // 5. Sort by RRI score descending
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ results: results.slice(0, 10) });

  } catch (error: any) {
    console.error("[API] Recommendation error:", error);
    return NextResponse.json(
      { error: error.message || "An error occurred generating recommendations" },
      { status: 500 }
    );
  }
}
