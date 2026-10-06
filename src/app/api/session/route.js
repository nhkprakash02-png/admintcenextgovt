import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSession, verifySession, SESSION_COOKIE, SESSION_MAX_AGE_S } from '../../../lib/session';

export const dynamic = 'force-dynamic';

// "Keep me logged in": every time the admin opens the app, the browser calls this once. If the
// login cookie is still valid, it is re-issued with a fresh expiry, so the session keeps sliding
// forward and only ends when Logout is pressed (or the browser's cookies are cleared).
export async function POST() {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) return NextResponse.json({ ok: false }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
