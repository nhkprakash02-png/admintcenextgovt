import { NextResponse } from 'next/server';
import { createSession, safeEqual, sessionSecret, SESSION_COOKIE, SESSION_MAX_AGE_S } from '../../../lib/session';

export const dynamic = 'force-dynamic';

// Basic brute-force brake: after MAX_FAILS wrong attempts from one address, further attempts are
// refused for WINDOW_MS. (In-memory, so on serverless hosting it is per-instance — a speed bump,
// not a guarantee. Every failed attempt is also slowed down by FAIL_DELAY_MS.)
const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILS = 8;
const FAIL_DELAY_MS = 700;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function POST(request) {
  const adminEmail = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const adminPassword = (process.env.ADMIN_PASSWORD || '').trim();
  if (!adminEmail || !adminPassword || !sessionSecret()) {
    return NextResponse.json({ error: 'Admin login is not set up yet. Add ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SESSION_SECRET in the hosting environment variables.' }, { status: 500 });
  }

  const ip = (request.headers.get('x-forwarded-for') || 'unknown').split(',')[0].trim();
  const now = Date.now();
  const rec = attempts.get(ip);
  if (rec && now - rec.first < WINDOW_MS && rec.count >= MAX_FAILS) {
    return NextResponse.json({ error: 'Too many failed attempts. Please wait 15 minutes and try again.' }, { status: 429 });
  }

  let email = '';
  let password = '';
  try {
    const body = await request.json();
    email = String(body.email || '').trim().toLowerCase();
    password = String(body.password || '').trim();
  } catch (e) { /* treated as wrong credentials below */ }

  const emailOk = await safeEqual(email, adminEmail);
  const passOk = await safeEqual(password, adminPassword);
  if (!(emailOk && passOk)) {
    const fresh = rec && now - rec.first < WINDOW_MS ? rec : { count: 0, first: now };
    fresh.count += 1;
    attempts.set(ip, fresh);
    await sleep(FAIL_DELAY_MS);
    return NextResponse.json({ error: 'Invalid admin credentials. Please check your email and password.' }, { status: 401 });
  }

  attempts.delete(ip);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, await createSession(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', // 'strict' hid the cookie when the app was opened from a link/another app, which looked like being logged out
    path: '/',
    maxAge: SESSION_MAX_AGE_S,
  });
  return res;
}
