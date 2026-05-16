import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { userId, role } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // 1. Fetch source user profile
    const sourceSnapshot = await db.collection("entities").where("userId", "==", userId).get();
    if (sourceSnapshot.empty) {
      return NextResponse.json({ error: "Source profile not found" }, { status: 404 });
    }
    const sourceProfile = sourceSnapshot.docs[0].data();

    // 2. If Organiser, fetch their active programmes
    let organiserContext = "";
    if (role === "organiser") {
      const programmesSnapshot = await db.collection("programmes").where("organiserId", "==", userId).get();
      const programmes = programmesSnapshot.docs.map(doc => doc.data());
      if (programmes.length > 0) {
        organiserContext = `Active Programmes: ${programmes.map(p => `${p.name} (${p.industry_focus?.join(", ")})`).join("; ")}`;
      }
    }

    // 3. Fetch ecosystem candidates
    const candidatesSnapshot = await db.collection("entities").get();
    let candidates = candidatesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => c.userId !== userId);

    // If Organiser, filter for Sponsors and Mentors
    if (role === "organiser") {
      candidates = candidates.filter((c: any) => 
        c.type?.toLowerCase() === "sponsor" || c.type?.toLowerCase() === "mentor"
      );
    }

    if (candidates.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // 4. AI Scoring and Explanation (The RRI Engine)
    if (!process.env.GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not set");
      return NextResponse.json({ error: "Recommendation engine misconfigured (API Key missing)" }, { status: 500 });
    }

    const model = genai.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const results = await Promise.all(
      candidates.map(async (candidate: any) => {
        try {
          const prompt = `
            You are the AI brain of LINKUTO, a B2B SaaS ecosystem matching platform.
            Evaluate the synergy between this Source ${role === 'organiser' ? 'Organiser' : 'Startup'} and this Candidate ${candidate.type}.
            
            Source ${role === 'organiser' ? 'Organiser' : 'Startup'}:
            Name: ${sourceProfile.name}
            Summary: ${sourceProfile.summary}
            Expertise: ${sourceProfile.expertise?.join(", ")}
            Industry: ${sourceProfile.industry}
            ${organiserContext}

            Candidate:
            Name: ${candidate.name}
            Summary: ${candidate.summary}
            Expertise: ${candidate.expertise?.join(", ")}
            Industry: ${candidate.industry}
            ${candidate.type === 'Sponsor' ? `Investment Thesis: ${candidate.investment_thesis}` : ''}

            Return a valid JSON object EXACTLY like this (no markdown, no extra text):
            {
              "baseScore": <number between 0.0 and 1.0. Use 3 decimal places for high granularity (e.g., 0.842). Be critical: only give >0.9 for perfect industry AND mission alignment.>,
              "explanation": "<one sentence explaining why this is a good match based on the context provided>",
              "confidence": "<high, medium, or low>",
              "bestMatchedProgramme": "<The name of the programme from 'Active Programmes' that matches this candidate best. If no programmes exist, use 'N/A'>"
            }
          `;

          const result = await model.generateContent(prompt);
          let responseText = result.response.text().trim();
          
          // Robust JSON extraction
          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) {
            throw new Error("No JSON found in AI response");
          }
          
          const aiEval = JSON.parse(jsonMatch[0]);

          // 5. Calculate final RRI Score
          // RRI = 0.5 * AI Base Alignment + 0.25 * Engagement + 0.15 * ProfileMatch + 0.1 * Feedback
          const engagement = candidate.mockEngagementScore || 0.5;
          const feedback = candidate.mockFeedbackScore || 0.5;
          const profileCompleteness = (candidate.summary ? 0.4 : 0) + 
                                     (candidate.expertise?.length ? 0.3 : 0) + 
                                     (candidate.industry ? 0.3 : 0);
          
          const embeddingSim = aiEval.baseScore || 0.5;
          const rriScore = (0.5 * embeddingSim) + (0.25 * engagement) + (0.15 * profileCompleteness) + (0.1 * feedback);

          return {
            id: candidate.id,
            candidate,
            score: Number(rriScore.toFixed(4)), 
            displayScore: Number(rriScore.toFixed(2)), 
            explanation: aiEval.explanation,
            confidence: aiEval.confidence,
            bestMatchedProgramme: aiEval.bestMatchedProgramme
          };
        } catch (err: any) {
          console.error(`[Scoring Error] Candidate: ${candidate.name} | Error:`, err.message);
          return {
            id: candidate.id,
            candidate,
            score: 0.5,
            explanation: "Synergy evaluation failed. Please check AI configuration.",
            confidence: "low"
          };
        }
      })
    );

    // 6. Sort by RRI score descending
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
