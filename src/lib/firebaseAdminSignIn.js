'use client';

import { signInWithCustomToken } from 'firebase/auth';
import { fbAuth } from '../firebase';

// Signs this browser in to Firebase as the admin. Firebase remembers the sign-in, so after the
// first time this returns immediately.
export async function ensureFirebaseSignIn() {
  if (!fbAuth) throw new Error('Firebase sign-in is not available.');
  await fbAuth.authStateReady();
  if (fbAuth.currentUser && fbAuth.currentUser.uid === 'tce-admin') return;
  const res = await fetch('/api/firebase-token', { method: 'POST', credentials: 'same-origin' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) throw new Error(data.error || 'Could not sign in to the database.');
  await signInWithCustomToken(fbAuth, data.token);
}
