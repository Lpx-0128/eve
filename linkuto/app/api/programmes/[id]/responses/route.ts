import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check if programme exists and grab questions to know what columns to expect
    const progDoc = await db.collection("programmes").doc(id).get();
    
    if (!progDoc.exists) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    const applicationQuestions = progDoc.data()?.applicationQuestions || [];

    // Fetch applications
    const appsSnapshot = await db.collection("applications").where("programmeId", "==", id).get();
    
    const applications = appsSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));

    // Sort by createdAt descending
    applications.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({ data: { applications, applicationQuestions } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
