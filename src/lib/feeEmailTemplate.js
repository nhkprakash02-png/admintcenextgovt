// Admin panel copy of the Razorpay "Payment Confirmed" thank-you email.
// wrapEmailHtml, paymentConfirmationEmail and escapeHtml below are copied word-for-word from the
// student website's src/lib/emailTemplates.js, so a fee ticked in the admin panel sends exactly
// the same email a successful Razorpay payment does.
// (If you ever change the wording on the student website, change it here too.)

const BRAND_GOLD = '#F59E0B';
const BRAND_BLACK = '#0B0B0B';

// Shared header/footer shell every email is wrapped in, so all three always
// look consistent. If you want to change the logo, footer text, or overall
// layout (not just one email's wording), edit THIS function.
function wrapEmailHtml({ preheader, bodyHtml }) {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0; padding:0; background-color:#f4f4f5; font-family: Arial, Helvetica, sans-serif;">
    <!-- Preheader: hidden preview text shown next to the subject line in inbox lists -->
    <div style="display:none; max-height:0; overflow:hidden;">${preheader || ''}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:520px; background:#ffffff; border-radius:12px; overflow:hidden;">
            <tr>
              <td style="background-color:${BRAND_BLACK}; padding:24px; text-align:center;">
                <div style="color:${BRAND_GOLD}; font-size:22px; font-weight:800; letter-spacing:0.02em;">TCE</div>
                <div style="color:#ffffff; font-size:13px; margin-top:2px;">The Competitive Edge</div>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px; color:#1f2937; font-size:14px; line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background-color:#f4f4f5; padding:16px 24px; text-align:center; color:#6b7280; font-size:11px;">
                TCE — The Competitive Edge · Nahata, North 24 Parganas, West Bengal<br />
                This is an automated message, please do not reply directly to this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function paymentConfirmationEmail({ name, batchName, amount, paymentId, orderId, date }) {
  const subject = `Payment Confirmed — ${batchName} | TCE`;
  const bodyHtml = `
    <h2 style="margin:0 0 12px; color:${BRAND_BLACK};">Payment received, ${escapeHtml(name)}! ✅</h2>
    <p>Thank you for enrolling — your payment has been successfully received and your access is now active.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
      <tr><td style="padding:10px 14px; background:#f9fafb; font-weight:bold; width:45%;">Batch / Course</td><td style="padding:10px 14px;">${escapeHtml(batchName)}</td></tr>
      <tr><td style="padding:10px 14px; background:#f9fafb; font-weight:bold;">Amount Paid</td><td style="padding:10px 14px;">₹${amount}</td></tr>
      <tr><td style="padding:10px 14px; background:#f9fafb; font-weight:bold;">Date</td><td style="padding:10px 14px;">${escapeHtml(date)}</td></tr>
      <tr><td style="padding:10px 14px; background:#f9fafb; font-weight:bold;">Payment ID</td><td style="padding:10px 14px; font-family: monospace; font-size:12px;">${escapeHtml(paymentId)}</td></tr>
      <tr><td style="padding:10px 14px; background:#f9fafb; font-weight:bold;">Order ID</td><td style="padding:10px 14px; font-family: monospace; font-size:12px;">${escapeHtml(orderId)}</td></tr>
    </table>
    <p>Keep this email as your receipt for this transaction.</p>
    <p style="margin-top:20px;">We're excited to have you in this batch — work hard, stay consistent, and we'll be right there supporting you.</p>
    <p style="margin-top:20px; font-weight:bold;">— Team TCE</p>
  `;
  return { subject, html: wrapEmailHtml({ preheader: `Your payment for ${batchName} is confirmed.`, bodyHtml }) };
}

// Small helper so a student's name/batch name can never accidentally break the
// HTML structure (e.g. if it happened to contain a `<` character).
function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
