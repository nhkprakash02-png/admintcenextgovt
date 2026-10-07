'use client';

// Same Firebase project as the student website (tce-nahata), so everything the admin changes
// shows up on the student site straight away. Firestore holds the data; Firebase Authentication
// is used only to sign this admin app in with a token created by the admin server
// (see src/app/api/firebase-token/route.js). No Firebase Storage is used.
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAelAmzeV33Ejc6i-aDKJg_GDgqJdswcI4',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'tce-nahata.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tce-nahata',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'tce-nahata.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_SENDER_ID || '718216468668',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:718216468668:web:517364ed83fdff2fd918b9',
};

export const DEMO_MODE = false;

let fbApp = null, fbDB = null, fbAuth = null;
try {
  fbApp = initializeApp(firebaseConfig);
  fbDB = getFirestore(fbApp);
  fbAuth = getAuth(fbApp);
} catch (e) {
  console.warn('Firebase init failed', e);
}

export { fbApp, fbDB, fbAuth };
