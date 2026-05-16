import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function GET() {
  try {
    const snapshot = await db.collection("entities").get();
    const batch = db.batch();
    let count = 0;

    // Clean up entities
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && /\s\d+$/.test(data.name)) {
        const newName = data.name.replace(/\s\d+$/, "");
        batch.update(doc.ref, { name: newName });
        count++;
      }
    });

    // Clean up programmes
    const progSnapshot = await db.collection("programmes").get();
    progSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.name && /\s\d+$/.test(data.name)) {
        const newName = data.name.replace(/\s\d+$/, "");
        batch.update(doc.ref, { name: newName });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up ${count} names by removing numeric suffixes.` 
    });
  } catch (error: any) {
    console.error("Cleanup error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
