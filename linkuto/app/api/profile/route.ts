import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const entitiesRef = db.collection("entities");
    const snapshot = await entitiesRef.where("userId", "==", userId).get();

    if (snapshot.empty) {
      return NextResponse.json(
        { data: null },
        { status: 200 }
      );
    }

    // Sort in memory to avoid requiring a Firebase composite index
    const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    docs.sort((a: any, b: any) => {
       const timeA = new Date(a.createdAt || 0).getTime();
       const timeB = new Date(b.createdAt || 0).getTime();
       return timeB - timeA;
    });

    return NextResponse.json({ id: docs[0].id, data: docs[0] });

  } catch (error: any) {
    console.error("[API] Error fetching profile:", error);
    
    return NextResponse.json(
      { error: error.message || "An error occurred fetching the profile" },
      { status: 500 }
    );
  }
}
