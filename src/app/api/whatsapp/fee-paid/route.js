// POST /api/whatsapp/fee-paid  — ADMIN PANEL only.
// Body: { name, phone }. Sends the "fee received" WhatsApp message to that student.
// Only a logged-in admin (valid login cookie) can call this, so nobody else can use your
// WhatsApp number to send messages.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from '../../../../lib/session';
import { normalizePhone, sendWhatsAppTemplate, sendWhatsAppText } from '../../../../lib/whatsapp';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const feeMessage = (name) => `🎉 Dear ${name}, 

Your fee for this current month has been successfully received by TCE Nahata! Thank you so much for your timely payment. 🌟

Wishing you the absolute best for your studies and future career. Keep up the hard work and keep shining! ✨

Warm regards,
Team TCE - The Competitive Edge 🎓🚀`;

// Plain-language explanations for the errors Meta returns most often.
function friendlyError(e) {
  const code = e && e.code;
  if (code === 131047) return 'WhatsApp only allows free-form messages within 24 hours of the student messaging you. Create an approved message template and set WHATSAPP_FEE_TEMPLATE_NAME in Vercel.';
  if (code === 132001) return 'The message template was not found or is not approved yet. Check its name and language in WhatsApp Manager.';
  if (code === 131030) return 'This phone number is not on the allowed recipients list (the WhatsApp number is still in test mode).';
  if (code === 190 || (e && e.status === 401)) return 'The WhatsApp access token is invalid or expired. Generate a new permanent token and update WHATSAPP_ACCESS_TOKEN in Vercel.';
  if (code === 131026) return 'This number is not on WhatsApp or cannot receive the message.';
  return (e && e.message) || 'WhatsApp request failed.';
}

export async function POST(request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  let name = '';
  let phone = '';
  try {
    const body = await request.json();
    name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 60);
    phone = String(body.phone || '');
  } catch (e) { /* handled below */ }

  const to = normalizePhone(phone);
  if (!name) return NextResponse.json({ error: 'The student has no name.' }, { status: 400 });
  if (!to) return NextResponse.json({ error: 'This student has no valid phone number saved.' }, { status: 400 });

  const templateName = (process.env.WHATSAPP_FEE_TEMPLATE_NAME || '').trim();
  const language = (process.env.WHATSAPP_TEMPLATE_LANG || 'en').trim();
  try {
    if (templateName) await sendWhatsAppTemplate(to, templateName, language, [name]);
    else await sendWhatsAppText(to, feeMessage(name)); // only works inside the 24h window
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[whatsapp-fee] send failed for', to, e && e.code, e && e.message);
    return NextResponse.json({ error: friendlyError(e) }, { status: 502 });
  }
}
