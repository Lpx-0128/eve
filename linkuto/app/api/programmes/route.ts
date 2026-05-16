import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const { 
      name, 
      description, 
      industry_focus, 
      applicationQuestions,
      status, 
      organiserId,
      organiserName
    } = await request.json();

    if (!name || !organiserId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const docRef = db.collection("programmes").doc();
    const data = {
      id: docRef.id,
      name,
      description: description || "",
      industry_focus: industry_focus || [],
      applicationQuestions: applicationQuestions || [],
      status: status || "draft",
      organiserId,
      organiserName: organiserName || "Unknown Organiser",
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
    const programmes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
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
