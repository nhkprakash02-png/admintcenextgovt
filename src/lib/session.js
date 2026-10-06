// Server-only helpers for the admin login session.
//
// After a correct login the server hands the browser a signed, HttpOnly cookie. The page checks
// that signature on every request, so the dashboard is only ever rendered for a logged-in admin.
// The email/password are compared on the server against environment variables (never shipped in
// the JavaScript bundle), and the cookie can't be read or forged by scripts in the browser.
const enc = new TextEncoder();

export const SESSION_COOKIE = 'tce_admin_session';
// Stay logged in for ~6 months, and the session is renewed every time the admin opens the app
// (see /api/session), so in practice it lasts until the Logout button is pressed.
export const SESSION_MAX_AGE_S = 60 * 60 * 24 * 180;

const subtle = () => globalThis.crypto.subtle;
const toHex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => {
  if (!/^[0-9a-f]+$/i.test(hex) || hex.length % 2) return null;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
};

export function sessionSecret() {
  const s = process.env.ADMIN_SESSION_SECRET || '';
  return s.length >= 16 ? s : '';
}

const hmacKey = (secret, usages) => subtle().importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, usages);

export async function createSession() {
  const secret = sessionSecret();
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is missing or too short');
  const payload = `admin.${Date.now() + SESSION_MAX_AGE_S * 1000}`;
  const sig = await subtle().sign('HMAC', await hmacKey(secret, ['sign']), enc.encode(payload));
  return `${payload}.${toHex(sig)}`;
}

export async function verifySession(token) {
  try {
    const secret = sessionSecret();
    if (!secret || !token) return false;
    const [role, exp, sigHex] = String(token).split('.');
    if (role !== 'admin' || !exp || !sigHex) return false;
    if (!(Number(exp) > Date.now())) return false;
    const sig = fromHex(sigHex);
    if (!sig) return false;
    return await subtle().verify('HMAC', await hmacKey(secret, ['verify']), sig, enc.encode(`${role}.${exp}`));
  } catch (e) {
    return false;
  }
}

// Constant-time string comparison (hashes both sides first so lengths never leak).
export async function safeEqual(a, b) {
  const [ha, hb] = await Promise.all([
    subtle().digest('SHA-256', enc.encode(String(a))),
    subtle().digest('SHA-256', enc.encode(String(b))),
  ]);
  const x = new Uint8Array(ha);
  const y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
