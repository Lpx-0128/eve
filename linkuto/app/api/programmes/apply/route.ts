import { NextResponse } from "next/server";
import { db, auth } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(request: Request) {
  try {
    const { 
      programmeId, 
      participantId, 
      name,
      email,
      answers 
    } = await request.json();

    if (!programmeId || !participantId || !name || !email) {
      return NextResponse.json({ error: "Missing required fields (name, email, programmeId, participantId)" }, { status: 400 });
    }

    // Check for duplicate application
    const existing = await db.collection("applications")
      .where("programmeId", "==", programmeId)
      .where("participantId", "==", participantId)
      .get();

    if (!existing.empty) {
      return NextResponse.json({ error: "You have already applied to this programme." }, { status: 409 });
    }

    // 1. Create application document
    const docRef = db.collection("applications").doc();
    const data = {
      id: docRef.id,
      programmeId,
      participantId,
      name,
      email,
      answers: answers || {},
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await docRef.set(data);

    // 2. Add participant to the programme's participants array
    await db.collection("programmes").doc(programmeId).update({
      participants: FieldValue.arrayUnion(participantId),
      updatedAt: new Date().toISOString()
    });

    // 3. Get programme name and host email
    const progDoc = await db.collection("programmes").doc(programmeId).get();
    const programmeName = progDoc.exists ? progDoc.data()?.name || "the programme" : "the programme";
    const organiserId = progDoc.exists ? progDoc.data()?.organiserId : null;

    let hostEmail;
    if (organiserId) {
      try {
        const hostUser = await auth.getUser(organiserId);
        hostEmail = hostUser.email;
      } catch (e) {
        console.warn("[API] Could not fetch host email", e);
      }
    }

    const organiserName = progDoc.exists ? progDoc.data()?.organiserName : undefined;

    // 4. Send Confirmation Email via Resend
    await sendConfirmationEmail(name, email, programmeName, hostEmail, organiserName);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("[API] Error submitting application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
