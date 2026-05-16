import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const entitiesSnapshot = await db.collection("entities").get();
    const entities = entitiesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const programmesSnapshot = await db.collection("programmes").get();
    const programmes = programmesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ data: { entities, programmes } });
  } catch (error: any) {
    console.error("[API] Error fetching graph data:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
