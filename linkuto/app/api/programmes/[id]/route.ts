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
    
    const data = doc.data() as any;

    // Dynamically fetch participants from applications to ensure accurate stats even if deleted manually
    const applicationsSnap = await db.collection("applications")
      .where("programmeId", "==", id)
      .get();
      
    // Replace static participants with dynamic ones
    data.participants = applicationsSnap.docs.map(d => d.data().participantId);

    return NextResponse.json({ data: { id: doc.id, ...data } });
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
      "location", "maxParticipants", "eligibility", "perks", "websiteUrl", "organiserName"
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Actually delete the programme from firestore
    await db.collection("programmes").doc(id).delete();
    
    // Optionally we could delete related applications too, but deleting the programme is enough for now
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
