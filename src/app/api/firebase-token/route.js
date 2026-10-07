import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { SESSION_COOKIE, verifySession } from '../../../lib/session';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function adminApp() {
  if (getApps().length) return getApps()[0];
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are missing on the server.');
  }
  return initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

// Only a logged-in admin (valid login cookie) can get a Firebase sign-in token.
export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }
  try {
    const firebaseToken = await getAuth(adminApp()).createCustomToken('tce-admin', { admin: true });
    return NextResponse.json({ token: firebaseToken });
  } catch (e) {
    console.error('firebase-token failed', e);
    return NextResponse.json(
      { error: 'Could not create the database sign-in. Check the Firebase Admin environment variables.' },
      { status: 500 }
    );
  }
}
