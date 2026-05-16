import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const userName = searchParams.get("userName") || "Programme Host";
    
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const mockProgs = await db.collection("programmes").where("organiserId", "==", "mock-organiser-id").get();
    
    if (mockProgs.empty) {
      return NextResponse.json({ message: "No mock programmes found to claim" });
    }

    const batch = db.batch();
    mockProgs.docs.forEach(doc => {
      batch.update(doc.ref, { 
        organiserId: userId,
        organiserName: userName 
      });
    });
    
    await batch.commit();

    return NextResponse.json({ success: true, claimedCount: mockProgs.docs.length });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
