import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const doc = await db.collection("programmes").doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Dynamically accept all editable fields
    const allowedFields = [
      "name", "description", "status", "applicationQuestions",
      "programmeType", "startDate", "endDate", "applicationDeadline",
      "location", "maxParticipants", "eligibility", "perks", "websiteUrl",
    ];

    const updateData: Record<string, any> = {
      updatedAt: new Date().toISOString()
    };

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    await db.collection("programmes").doc(id).update(updateData);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
