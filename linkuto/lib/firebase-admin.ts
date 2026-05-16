import * as admin from 'firebase-admin';

// Initialize Firebase Admin if it hasn't been initialized yet
if (!admin.apps.length) {
  try {
    let credential;
    // For local development, check if the FIREBASE_ADMIN_KEY is a JSON string
    if (process.env.FIREBASE_ADMIN_KEY) {
      try {
        let keyString = process.env.FIREBASE_ADMIN_KEY;
        if (keyString.startsWith("'") && keyString.endsWith("'")) {
          keyString = keyString.slice(1, -1);
        }

        const serviceAccount = JSON.parse(keyString);
        console.log('Parsed service account with project_id:', serviceAccount.project_id);
        credential = admin.credential.cert(serviceAccount);
      } catch (e: any) {
        // Fallback for paths or other credential types
        console.warn('FIREBASE_ADMIN_KEY parsing failed:', e.message);
        credential = admin.credential.applicationDefault();
      }
    } else {
      credential = admin.credential.applicationDefault();
    }

    admin.initializeApp({
      credential,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

const db = admin.firestore();
const auth = admin.auth();

export { db, auth };
