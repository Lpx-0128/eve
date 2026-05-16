import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";
import { screenApplications } from "@/lib/gemini";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Fetch programme details
    const progDoc = await db.collection("programmes").doc(id).get();
    if (!progDoc.exists) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    const programme = progDoc.data();

    // Fetch applications
    const appsSnapshot = await db.collection("applications").where("programmeId", "==", id).get();
    
    if (appsSnapshot.empty) {
      return NextResponse.json({ data: [] });
    }

    const applications = appsSnapshot.docs.map(d => ({
      id: d.id,
      ...(d.data() as any)
    }));

    // Run AI Screening via Gemini
    const results = await screenApplications(programme, applications);

    // Merge results with application data
    const enrichedResults = results.map((result: any) => {
      const app = applications.find(a => a.id === result.id);
      return {
        id: result.id,
        name: app?.name || "Unknown Applicant",
        score: result.score || 0,
        reason: result.reason || "No reasoning provided."
      };
    });

    // Sort by score descending
    enrichedResults.sort((a: any, b: any) => b.score - a.score);

    return NextResponse.json({ data: enrichedResults });
  } catch (error: any) {
    console.error("[API] AI Screening Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
