import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    // 1. Fetch organiser profile
    const sourceSnapshot = await db.collection("entities").where("userId", "==", userId).get();
    if (sourceSnapshot.empty) {
      return NextResponse.json({ error: "Organiser profile not found" }, { status: 404 });
    }
    const sourceProfile = sourceSnapshot.docs[0].data();

    // 2. Fetch organiser's programmes
    const programmesSnapshot = await db.collection("programmes").where("organiserId", "==", userId).get();
    const programmes = programmesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Build organiser context for AI prompt
    let organiserContext = "";
    if (programmes.length > 0) {
      organiserContext = `Active Programmes: ${programmes.map((p: any) => `${p.name} (${p.industry_focus?.join(", ")})`).join("; ")}`;
    }

    // 3. Fetch all mentor and sponsor entities
    const candidatesSnapshot = await db.collection("entities").get();
    const candidates = candidatesSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter((c: any) => c.userId !== userId)
      .filter((c: any) =>
        c.type?.toLowerCase() === "sponsor" || c.type?.toLowerCase() === "mentor"
      );

    if (candidates.length === 0) {
      return NextResponse.json({
        programmes: programmes.map((p: any) => ({
          id: p.id, name: p.name, industry_focus: p.industry_focus,
          status: p.status, participants: p.participants, mentors: p.mentors,
        })),
        entities: [],
        edges: [],
      });
    }

    // 4. AI Scoring — compute RRI for ALL candidates
    const model = genai.getGenerativeModel({ model: "gemini-3-flash-preview" });

    const edges: any[] = [];
    const scoredEntities = await Promise.all(
      candidates.map(async (candidate: any) => {
        try {
          const prompt = `
            You are the AI brain of LINKUTO, a B2B SaaS ecosystem matching platform.
            Evaluate the synergy between this Source Organiser and this Candidate ${candidate.type}.
            
            Source Organiser:
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
              "explanation": "<one sentence explaining why this is a good or poor match based on the context provided>",
              "confidence": "<high, medium, or low>"
            }
          `;

          const result = await model.generateContent(prompt);
          let responseText = result.response.text().trim();

          const jsonMatch = responseText.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error("No JSON found in AI response");

          const aiEval = JSON.parse(jsonMatch[0]);

          // Calculate final RRI Score
          const engagement = candidate.mockEngagementScore || 0.5;
          const feedback = candidate.mockFeedbackScore || 0.5;
          const profileCompleteness =
            (candidate.summary ? 0.4 : 0) +
            (candidate.expertise?.length ? 0.3 : 0) +
            (candidate.industry ? 0.3 : 0);

          const embeddingSim = aiEval.baseScore || 0.5;
          const rriScore =
            0.5 * embeddingSim + 0.25 * engagement + 0.15 * profileCompleteness + 0.1 * feedback;
          const clampedScore = Math.min(Math.max(rriScore, 0), 1);

          // Create edge from organiser to this entity
          edges.push({
            sourceId: "organiser-root",
            targetId: `ent-${candidate.id}`,
            rriScore: Number(clampedScore.toFixed(4)),
            confidence: aiEval.confidence || "low",
            explanation: aiEval.explanation || "No explanation available.",
          });

          // Also connect entity to a relevant programme if any exist
          if (programmes.length > 0) {
            const bestProg = programmes[Math.floor(Math.random() * programmes.length)] as any;
            edges.push({
              sourceId: `prog-${bestProg.id}`,
              targetId: `ent-${candidate.id}`,
              rriScore: Number((clampedScore * (0.7 + Math.random() * 0.3)).toFixed(4)),
              confidence: aiEval.confidence || "low",
              explanation: `Potential fit for ${bestProg.name}: ${aiEval.explanation}`,
            });
          }

          return {
            id: candidate.id,
            name: candidate.name,
            type: candidate.type,
            industry: candidate.industry,
            expertise: candidate.expertise,
            summary: candidate.summary,
            location: candidate.location,
            rriScore: Number(clampedScore.toFixed(4)),
          };
        } catch (err: any) {
          console.error(`[Graph Scoring Error] Candidate: ${candidate.name} | Error:`, err.message);

          edges.push({
            sourceId: "organiser-root",
            targetId: `ent-${candidate.id}`,
            rriScore: 0.35,
            confidence: "low",
            explanation: "Synergy evaluation pending.",
          });

          return {
            id: candidate.id,
            name: candidate.name,
            type: candidate.type,
            industry: candidate.industry,
            expertise: candidate.expertise,
            summary: candidate.summary,
            location: candidate.location,
            rriScore: 0.35,
          };
        }
      })
    );

    return NextResponse.json({
      programmes: programmes.map((p: any) => ({
        id: p.id,
        name: p.name,
        industry_focus: p.industry_focus,
        status: p.status,
        participants: p.participants,
        mentors: p.mentors,
        description: p.description,
      })),
      entities: scoredEntities,
      edges,
    });
  } catch (error: any) {
    console.error("[API] Graph computation error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to compute ecosystem graph" },
      { status: 500 }
    );
  }
}
