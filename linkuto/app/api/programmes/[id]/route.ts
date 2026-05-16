import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const doc = await db.collection("programmes").doc(params.id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }
    
    return NextResponse.json({ data: { id: doc.id, ...doc.data() } });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, description, status } = body;
    
    await db.collection("programmes").doc(params.id).update({
      name,
      description,
      status,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
