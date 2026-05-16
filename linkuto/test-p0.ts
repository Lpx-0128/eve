import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { db } from './lib/firebase-admin';

async function runTests() {
  console.log('Running Phase 0 Tests...');
  let allPassed = true;

  // P0-1: Firebase connection
  try {
    process.stdout.write('Test P0-1 (Firebase connection)... ');
    const ref = db.collection('_test').doc('connectivity');
    await ref.set({ ping: true, ts: Date.now() });
    const snap = await ref.get();
    if (snap.exists && snap.data()?.ping === true) {
      console.log('PASS');
    } else {
      console.log('FAIL (document read failed)');
      allPassed = false;
    }
    await ref.delete();
  } catch (error: any) {
    console.log('FAIL');
    console.error('  ->', error.message);
    allPassed = false;
  }

  // P0-2: Env vars loaded
  try {
    process.stdout.write('Test P0-2 (Env vars loaded)... ');
    const required = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'FIREBASE_ADMIN_KEY',
      'GEMINI_API_KEY',
    ];
    let missing = false;
    required.forEach(key => {
      if (!process.env[key] || process.env[key]!.length === 0) {
        missing = true;
      }
    });
    if (!missing) {
      console.log('PASS');
    } else {
      console.log('FAIL (Missing some required variables)');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('FAIL');
    console.error('  ->', error.message);
    allPassed = false;
  }

  // P0-3: Three Firestore collections writable
  try {
    process.stdout.write('Test P0-3 (Firestore collections writable)... ');
    const collections = ['entities', 'relationships', 'programmes'];
    let colsPassed = true;
    for (const col of collections) {
      try {
        const ref = db.collection(col).doc('test_doc');
        await ref.set({ test: true });
        await ref.delete();
      } catch (e: any) {
        console.error(`\n  -> Failed on collection ${col}: ${e.message}`);
        colsPassed = false;
      }
    }
    if (colsPassed) {
      console.log('PASS');
    } else {
      console.log('FAIL');
      allPassed = false;
    }
  } catch (error: any) {
    console.log('FAIL');
    console.error('  ->', error.message);
    allPassed = false;
  }

  if (allPassed) {
    console.log('\nAll tests PASSED!');
  } else {
    console.log('\nSome tests FAILED.');
    process.exit(1);
  }
}

runTests();
