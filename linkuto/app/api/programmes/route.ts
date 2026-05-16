import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, organiserId } = body;

    if (!name || !organiserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = db.collection("programmes").doc();
    const data = {
      id: docRef.id,
      name,
      description: body.description || "",
      industry_focus: body.industry_focus || [],
      applicationQuestions: body.applicationQuestions || [],
      status: body.status || "draft",
      organiserId,
      organiserName: body.organiserName || "Unknown Organiser",
      programmeType: body.programmeType || null,
      startDate: body.startDate || null,
      endDate: body.endDate || null,
      applicationDeadline: body.applicationDeadline || null,
      location: body.location || null,
      maxParticipants: body.maxParticipants || null,
      eligibility: body.eligibility || null,
      perks: body.perks || null,
      websiteUrl: body.websiteUrl || null,
      targetShortlistCount: body.targetShortlistCount || 5,
      participants: [],
      mentors: [],
      sponsors: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docRef.set(data);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Error creating programme:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snapshot = await db.collection("programmes").get();
    const programmes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
    
    // Fetch all applications once to dynamically compute accurate participants
    const appsSnapshot = await db.collection("applications").get();
    const apps = appsSnapshot.docs.map(d => d.data());
    
    // Map applications to programmes
    programmes.forEach(prog => {
      const progApps = apps.filter(app => app.programmeId === prog.id);
      prog.participants = progApps.map(app => app.participantId);
    });

    // Sort by createdAt desc
    programmes.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ data: programmes });
  } catch (error: any) {
    console.error("[API] Error fetching programmes:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
