import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { 
      programmeId, 
      participantId, 
      answers 
    } = await request.json();

    if (!programmeId || !participantId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // 1. Create a new application document
    const docRef = db.collection("applications").doc();
    const data = {
      id: docRef.id,
      programmeId,
      participantId,
      answers: answers || {},
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docRef.set(data);

    // 2. Optionally: Update the programme's participant count or list (for now just add to application collection)
    // We can extend this to update the programme's metadata if needed.

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Error submitting application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
