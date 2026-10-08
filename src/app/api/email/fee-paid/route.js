// POST /api/email/fee-paid  — ADMIN PANEL only.
// Body: { name, email, batchName, amount, monthLabel } — batchName/amount come from the batch the
// admin picked in the Monthly Fees batch-selection box.
// Sends the same "Payment Confirmed" thank-you email that a successful Razorpay payment sends
// (no invoice/bill), when the admin ticks a month as paid in Monthly Fees.
// Only a logged-in admin (valid login cookie) can call this.
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifySession } from '../../../../lib/session';
import { sendEmail } from '../../../../lib/resend';
import { paymentConfirmationEmail } from '../../../../lib/feeEmailTemplate';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!(await verifySession(token))) {
    return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const name = String(body.name || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    const email = String(body.email || '').trim();
    const batchName = String(body.batchName || '').trim().slice(0, 120);
    const monthLabel = String(body.monthLabel || '').trim().slice(0, 40);
    const amount = Number(body.amount);

    if (!EMAIL_RE.test(email)) return NextResponse.json({ error: 'This student has no valid email address on file.' }, { status: 400 });
    if (!batchName || !Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: 'The selected batch has no valid fee amount set. Check its price in the Batches tab.' }, { status: 400 });
    }

    const { subject, html } = paymentConfirmationEmail({
      name: name || 'there',
      batchName,
      amount,
      // A manual tick has no Razorpay IDs, so these two rows of the same template carry this instead.
      paymentId: 'Received directly (recorded by TCE)',
      orderId: `Monthly fee — ${monthLabel}`,
      date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    });
    await sendEmail({ to: email, subject, html });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('fee-paid email failed:', err);
    // Only the logged-in admin can reach this route, so the real reason is safe to show.
    return NextResponse.json({ error: `Could not send the email: ${(err && err.message) || 'unknown error'}` }, { status: 500 });
  }
}
